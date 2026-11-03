"""Сервис генерации контента слайдов через LLM."""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from adapters.openrouter_client import OpenRouterClient
from config import model_settings
from core.exceptions import AIError
from core.prompts import (
    CHART_GENERATOR_PROMPT,
    JSON_ONLY_PROMPT,
    SLIDE_PROMPT_TEMPLATE,
)
from models.schemas import SlideItem
from models.slide import SlideContent
from utils.json import extract_json_balanced
from utils.text import safe_format


class GenerationService:
    """Генерирует контент отдельных слайдов и диаграммы."""

    def __init__(
        self,
        openrouter_client: OpenRouterClient,
        model: str,
        searcher: Any,
        top_k_retrieval: int = 5,
    ) -> None:
        self.client = openrouter_client
        self.model = model
        self.searcher = searcher
        self.top_k_retrieval = top_k_retrieval
        self.logger = logging.getLogger(__name__)
        self.used_facts: list[str] = []
        self.generation_metadata: dict[str, Any] = {}

    def _chunks_to_text(self, retrieved: list[dict]) -> str:
        lines = []
        for i, r in enumerate(retrieved):
            raw = str(r.get("text", ""))
            txt = raw[:600].replace("\n", " ").replace("\r", " ")
            lines.append(f"{i + 1}. {txt}")
        return "\n".join(lines)

    async def _call_api_with_retry(
        self,
        prompt: str,
        max_tokens: int = 900,
        retry: int = 2,
    ) -> str:
        for attempt in range(retry):
            try:
                resp = await self.client.chat_completion(
                    [{"role": "user", "content": prompt}],
                    model=self.model,
                    temperature=model_settings.GEN_TEMPERATURE,
                    max_tokens=max_tokens,
                )
                return self.client.extract_content(resp)
            except Exception:
                if attempt < retry - 1:
                    await asyncio.sleep(1 + attempt * 2)
                    continue
                raise

    def _fallback(self, slide_id: int, slide_title: str) -> dict:
        return {
            "slide_id": slide_id,
            "title": slide_title,
            "used_facts": [],
            "content": "Данные для этого раздела отсутствуют",
        }

    async def generate_slide_content(
        self,
        slide_id: int,
        slide_title: str,
        slide_task: str,
        topic: str,
    ) -> SlideContent:
        query = f"{slide_title} {slide_task} {topic}".strip()
        retrieved = self.searcher.search(query, top_k=self.top_k_retrieval)
        self.logger.info("[Slide %d] retrieved=%d", slide_id, len(retrieved))

        chunks_text = self._chunks_to_text(retrieved)
        prompt = safe_format(
            SLIDE_PROMPT_TEMPLATE,
            topic=topic,
            slide_id=str(slide_id),
            slide_title=slide_title,
            slide_task=slide_task,
            chunks_text=chunks_text,
        )

        try:
            raw = await self._call_api_with_retry(prompt, max_tokens=900)
            parsed = extract_json_balanced(raw)
            if not isinstance(parsed, dict):
                raise ValueError("Not a dict")
        except Exception:
            try:
                raw2 = await self._call_api_with_retry(
                    JSON_ONLY_PROMPT + "\n\n" + prompt, max_tokens=900
                )
                parsed = extract_json_balanced(raw2)
                if not isinstance(parsed, dict):
                    raise ValueError("Not a dict")
            except Exception:
                return SlideContent(
                    slide_id=slide_id,
                    title=slide_title,
                    content=self._fallback(slide_id, slide_title)["content"],
                    used_facts=[],
                )

        content = parsed.get("content", "")
        used_facts = parsed.get("used_facts", [])
        self.used_facts.extend(
            f.get("excerpt", "") for f in used_facts if isinstance(f, dict)
        )

        return SlideContent(
            slide_id=slide_id,
            title=slide_title,
            content=content,
            used_facts=used_facts,
        )

    async def generate_charts(
        self,
        slide_id: int,
        slide_title: str,
        slide_task: str,
        topic: str,
        slide_content: str,
        retrieved: list[dict],
    ) -> str:
        chunks_text = self._chunks_to_text(retrieved)
        full_context = f"SLIDE_CONTENT:\n{slide_content}\n\nCHUNKS:\n{chunks_text}"

        prompt = safe_format(
            CHART_GENERATOR_PROMPT,
            topic=topic,
            slide_id=str(slide_id),
            slide_title=slide_title,
            slide_task=slide_task,
            chunks_text=full_context,
        )

        try:
            raw = await self._call_api_with_retry(prompt, max_tokens=900)
            obj = self._extract_json_from_text(raw)
        except Exception:
            obj = {}

        specs = self._validate_llm_charts(obj)
        fences = [self._chart_fence(sp) for sp in specs]
        return "\n".join(fences)

    def _extract_json_from_text(self, text: str) -> dict:
        import json
        import re

        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return {}
        return {}

    def _validate_llm_charts(self, obj: dict) -> list:
        if not isinstance(obj, dict):
            return []
        charts = obj.get("charts", [])
        if not isinstance(charts, list):
            return []
        return charts

    def _chart_fence(self, sp: dict) -> str:
        chart_type = sp.get("type", "bar")
        title = sp.get("title", "")
        labels = sp.get("labels", [])
        values = sp.get("values", [])
        reason = sp.get("reason", "")
        used_facts = sp.get("used_facts", [])
        facts_str = "; ".join(
            f.get("excerpt", "") for f in used_facts if isinstance(f, dict)
        )
        return (
            f"```chart {chart_type}\n{title}\n{labels}\n{values}\n"
            f"{reason}\n{facts_str}\n```"
        )

    async def generate_presentation_content(
        self,
        presentation_data: dict,
    ):
        self.generation_metadata = {
            "total_facts_used": 0,
            "slides_generated": 0,
            "slides_with_fallback": 0,
        }
        slides_content_for_logging = []

        for slide in presentation_data["slide_structure"]:
            sid = slide.get("slide_id") or slide.get("id")
            title = slide.get("title", f"Слайд {sid}")
            task = slide.get("task", "")
            sc = await self.generate_slide_content(
                sid, title, task, presentation_data.get("presentation_topic", "")
            )
            yield sc
            slides_content_for_logging.append(sc)
            self.generation_metadata["slides_generated"] += 1
            if not sc.used_facts:
                self.generation_metadata["slides_with_fallback"] += 1
            await asyncio.sleep(0.2)

        self.generation_metadata["total_facts_used"] = len(set(self.used_facts))
        self.logger.info("=== SLIDE SUMMARY ===")
        for s in slides_content_for_logging:
            self.logger.info(
                "- id=%d title='%s...' facts=%d",
                s.slide_id,
                s.title[:40],
                len(s.used_facts),
            )
