# -*- coding: utf-8 -*-
"""
model_services.py (stable baseline final)
- Strict context from text.txt
- SentenceTransformer + cosine retrieval
- Robust JSON handling: sanitize, balanced parse, JSON-only retry
- Safe prompts (triple-single quotes)
- Single-slide editor prompt for "Writing" actions only:
  polish | correct | translate | expand | shorten | simplify | specify
"""

from __future__ import annotations
import os
from typing import AsyncGenerator, Generator
import json
import logging
import asyncio

from fastapi import HTTPException

from config import settings, model_settings, ModelAction
from modules.models import FZ44RAGSearcher, SlideContentGenerator
from modules.models.rag import DocumentProcessor, QdrantVectorDatabase
from schemas.model_schemas import ClassifierOut, StructureOut
from schemas.presentation_schemas import EditSlideInSchema
from utils import json_utils, model_api_utils, text_utils


def setup_logging(level: int = logging.INFO):
    logging.basicConfig(level=level, format="%(asctime)s | %(levelname)s | %(message)s")
    logging.info("Logging initialized")


class IntegratedPipeline:
    def __init__(
        self,
        api_key: str,
        embedding_model: str = settings.DEFAULT_EMBEDDING_MODEL,
        llm_model: str = settings.DEFAULT_MODEL,
        collection_name: str = "atomic_hack",
    ):
        self.api_key = api_key
        self.llm_model = llm_model
        self.doc_processor = DocumentProcessor()
        self.vector_db = QdrantVectorDatabase(collection_name, embedding_model)
        self.searcher = FZ44RAGSearcher(self.vector_db)
        logging.info("✓ Pipeline initialized")

    def load_documents(self, documents: list[str], metadata: list[dict] | None = None):
        logging.info(f"Loading {len(documents)} documents into RAG...")
        all_chunks, metadata = [], (metadata or [])
        for i, doc in enumerate(documents):
            meta = metadata[i] if i < len(metadata) else {"doc_id": i}
            path = meta.get("source")
            if path and os.path.exists(path):
                all_chunks.extend(self.doc_processor.process_document(doc, meta))
            else:
                all_chunks.extend(self.doc_processor.process_document(doc, meta))

        self.vector_db.add_documents(all_chunks)
        logging.info(f"✓ Loaded {len(all_chunks)} chunks")

    def run_classifier(self, user_request: str) -> tuple[ClassifierOut, str]:
        snippet = (user_request or "")[:2000]
        prompt = model_settings.CLASSIFIER_PROMPT.format(user_text=snippet)
        resp = model_api_utils.call_model(
            [{"role": "user", "content": prompt}],
            api_key=self.api_key,
            model=self.llm_model,
            max_tokens=400,
            temperature=0.2,
        )
        raw = model_api_utils.get_content(resp)
        parsed = json_utils.extract_json_balanced(raw)
        if parsed is None:
            resp2 = model_api_utils.call_model(
                [{"role": "user", "content": model_settings.JSON_ONLY_PROMPT + "\n\n" + prompt}],
                api_key=self.api_key,
                model=self.llm_model,
                max_tokens=400,
                temperature=0.2,
            )
            raw2 = model_api_utils.get_content(resp2)
            parsed = json_utils.extract_json_balanced(raw2)
            if parsed is not None:
                raw = raw2
        if parsed is None:
            raise ValueError("Classifier output not parseable as JSON. Raw:\n" + raw)
        clf = ClassifierOut.model_validate(parsed)
        return clf, raw

    def run_planner(self, audience: str, project_context: str) -> tuple[StructureOut, str]:
        snippet = (project_context or "")[:4000]
        prompt = model_settings.PLANNER_PROMPT.format(
            audience=audience, context_snippet=snippet
        )
        resp = model_api_utils.call_model(
            [{"role": "user", "content": prompt}],
            api_key=self.api_key,
            model=self.llm_model,
            max_tokens=1000,
            temperature=0.2,
        )
        raw = model_api_utils.get_content(resp)
        arr = json_utils.extract_json_array(raw)
        if arr is None:
            resp2 = model_api_utils.call_model(
                [{"role": "user", "content": model_settings.JSON_ONLY_PROMPT + "\n\n" + prompt}],
                api_key=self.api_key,
                model=self.llm_model,
                max_tokens=1000,
                temperature=0.2,
            )
            raw2 = model_api_utils.get_content(resp2)
            if raw2 and raw2 != raw:
                raw = raw2
            arr = json_utils.extract_json_array(raw)
        if arr is None:
            raise ValueError("Planner output not parseable as JSON array. Raw:\n" + raw)

        normalized = []
        for i, item in enumerate(arr, start=1):
            if isinstance(item, dict):
                title = item.get("title") or item.get("name") or f"Слайд {i}"
                task = item.get("task") or item.get("description") or ""
            else:
                title = str(item)
                task = ""
            normalized.append(
                {
                    "slide_id": i,
                    "title": " ".join(str(title).split()[:6]),
                    "task": str(task)[:200],
                }
            )

        if len(normalized) < model_settings.MIN_SLIDES:
            for j in range(len(normalized) + 1, model_settings.MIN_SLIDES + 1):
                normalized.append(
                    {
                        "slide_id": j,
                        "title": f"Доп. слайд {j}",
                        "task": "Автоматически добавлен.",
                    }
                )
        if len(normalized) > model_settings.MAX_SLIDES:
            normalized = normalized[: model_settings.MAX_SLIDES]
        for idx, it in enumerate(normalized, start=1):
            it["slide_id"] = idx

        struct = StructureOut.model_validate({"slides": normalized})
        return struct, raw

    def run(self, user_request: str, project_context: str = "") -> Generator:
        logging.info("=" * 60)
        logging.info("START PIPELINE")
        logging.info("=" * 60)
        logging.info("[STEP 1] Classifier")
        clf, clf_raw = self.run_classifier(user_request)
        audience = clf.label
        logging.info(f"Audience: {audience} (conf={clf.confidence:.2f})")
        logging.info("[STEP 2] Planner")
        struct, planner_raw = self.run_planner(audience, project_context)
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
        logging.info(f"Slides planned: {len(slide_structure)}")
        logging.info("[STEP 3] Content Generation")
        gen = SlideContentGenerator(self.api_key, self.searcher, self.llm_model)
        data = {
            "presentation_topic": user_request[:200],
            "slide_structure": slide_structure,
        }
        for sc in gen.generate_presentation_content(data):
            yield sc

    def regenerate_slide(self, user_prompt: str, slide: dict, action: str) -> dict:
        gen = SlideContentGenerator(self.api_key, self.searcher, self.llm_model)
        result = gen.generate_slide_content(
            slide.get("slide_id", 1),
            slide.get("title", ""),
            user_prompt,
            slide.get("topic", "")
        )
        return result


setup_logging(logging.INFO)
api_key = model_api_utils.get_api_key()


async def generate_presentation(user_prompt: str, project_context: str, model: str):
    pipe = IntegratedPipeline(
        api_key=api_key,
        embedding_model=settings.DEFAULT_EMBEDDING_MODEL,
        llm_model=model,
    )
    pipe.load_documents([project_context])

    for slide in pipe.run(user_prompt, project_context=project_context):
        title = slide.get("title", "Untitled")
        content = slide.get("content", "")
        chunk = f"# {title}\n\n{content.strip()}\n\n"
        yield chunk


def edit_one_slide(user_prompt, slide: dict, action: str, model: str) -> str:
    pipe = IntegratedPipeline(
        api_key=api_key,
        embedding_model=settings.DEFAULT_EMBEDDING_MODEL,
        llm_model=settings.DEFAULT_MODEL,
    )
    content = pipe.regenerate_slide(user_prompt, slide, action).get("content", "")

    return f"# {content}\n"

def run_prompt(user_request: str, project_context: str) -> list[dict]:
    """Адаптер для обратной совместимости с эндпоинтом /message"""
    # Используем твой новый класс IntegratedPipeline
    pipe = IntegratedPipeline(
        api_key=api_key,
        embedding_model=settings.DEFAULT_EMBEDDING_MODEL,
        llm_model=settings.DEFAULT_MODEL,
    )
    
    # Загружаем контекст в векторную базу Qdrant
    if project_context.strip():
        pipe.load_documents([project_context.strip()])

    # Собираем все сгенерированные слайды в список словарей
    slides_content = []
    for slide in pipe.run(user_request, project_context=project_context):
        slides_content.append({
            "slide": slide.get("slide_id", len(slides_content) + 1),
            "title": slide.get("title", "Untitled"),
            "content": slide.get("content", ""),
        })
        
    return slides_content