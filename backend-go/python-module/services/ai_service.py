"""Оркестратор пайплайна: классификация -> планирование -> генерация контента."""

from __future__ import annotations

import json
import logging
from typing import Any

from adapters.openrouter_client import OpenRouterClient
from config import model_settings
from core.exceptions import AIError
from core.prompts import CLASSIFIER_PROMPT, JSON_ONLY_PROMPT, PLANNER_PROMPT
from models.schemas import ClassifierOut, StructureOut
from services.generation_service import GenerationService
from services.rag_service import RAGService
from utils.json import extract_json_balanced
from utils.text import safe_format


class AIService:
    """Высокуровневый сервис для генерации презентации из пользовательского запроса."""

    def __init__(
        self,
        openrouter_client: OpenRouterClient,
        rag_service: RAGService,
        generation_service: GenerationService,
        model: str,
    ) -> None:
        self.client = openrouter_client
        self.rag_service = rag_service
        self.generation_service = generation_service
        self.model = model
        self.logger = logging.getLogger(__name__)

    async def _call_llm(
        self,
        prompt: str,
        max_tokens: int = 400,
        temperature: float = 0.2,
        retry_with_json_only: bool = True,
    ) -> str:
        import asyncio

        resp = await self.client.chat_completion(
            [{"role": "user", "content": prompt}],
            model=self.model,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        raw = self.client.extract_content(resp)

        parsed = extract_json_balanced(raw)
        if parsed is not None:
            return json.dumps(parsed, ensure_ascii=False)

        if retry_with_json_only:
            try:
                resp2 = await self.client.chat_completion(
                    [
                        {
                            "role": "user",
                            "content": JSON_ONLY_PROMPT + "\n\n" + prompt,
                        }
                    ],
                    model=self.model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                raw2 = self.client.extract_content(resp2)
                parsed = extract_json_balanced(raw2)
                if parsed is not None:
                    return json.dumps(parsed, ensure_ascii=False)
            except Exception:
                pass

        raise AIError("LLM did not return valid JSON after retries")

    async def run_classifier(self, user_request: str) -> tuple[ClassifierOut, str]:
        snippet = (user_request or "")[:2000]
        prompt = safe_format(CLASSIFIER_PROMPT, user_text=snippet)
        raw = await self._call_llm(prompt, max_tokens=400, temperature=model_settings.GEN_TEMPERATURE)
        parsed = ClassifierOut.model_validate_json(raw)
        return parsed, raw

    async def run_planner(
        self,
        audience: str,
        project_context: str,
    ) -> tuple[StructureOut, str]:
        context_snippet = (project_context or "")[:3000]
        prompt = safe_format(
            PLANNER_PROMPT,
            audience=audience,
            context_snippet=context_snippet,
        )
        raw = await self._call_llm(prompt, max_tokens=600, temperature=model_settings.GEN_TEMPERATURE)
        parsed = StructureOut.model_validate_json(raw)
        return parsed, raw

    async def generate_presentation(
        self,
        user_prompt: str,
        project_context: str,
    ) -> Any:
        self.logger.info("=" * 60)
        self.logger.info("START AI PIPELINE")
        self.logger.info("=" * 60)

        self.logger.info("[STEP 1] Classifier")
        clf, clf_raw = await self.run_classifier(user_prompt)
        audience = clf.label
        self.logger.info(
            "Audience: %s (conf=%.2f)", audience, clf.confidence
        )

        self.logger.info("[STEP 2] Planner")
        struct, planner_raw = await self.run_planner(
            audience, project_context
        )
        slides = [s.model_dump() for s in struct.slides]
        slide_structure = [
            {
                "id": s.get("slide_id"),
                "slide_id": s.get("slide_id"),
                "title": s.get("title", ""),
                "task": s.get("task", ""),
            }
            for s in slides
        ]
        self.logger.info("Slides planned: %d", len(slide_structure))

        self.logger.info("[STEP 3] Content Generation")
        presentation_data = {
            "presentation_topic": user_prompt[:200],
            "slide_structure": slide_structure,
        }

        results = []
        async for sc in self.generation_service.generate_presentation_content(
            presentation_data
        ):
            results.append(sc)

        return results

    async def regenerate_slide(
        self,
        user_prompt: str,
        slide: dict,
        action: str,
    ) -> dict:
        slide_id = slide.get("slide_id", 1)
        slide_title = slide.get("title", "")
        slide_topic = slide.get("topic", "")

        sc = await self.generation_service.generate_slide_content(
            slide_id, slide_title, user_prompt, slide_topic
        )
        return sc.to_dict()
