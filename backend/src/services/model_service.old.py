#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# pydantic для валидации
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Integrated RAG + LLM Agents Pipeline for Presentation Generation (CLI Version)
Only ML components, no external app imports.
"""

from __future__ import annotations
import os
import sys
from typing import List, Optional, Tuple, Dict

from src.config import model_settings
from src.modules.models.rag import VectorDatabase, DocumentProcessor
from src.modules.models import SlideContentGenerator
from src.schemas.model_schemas import ClassifierOut, StructureOut
from src.utils import json_utils, model_api_utils

os.environ["HF_HUB_DOWNLOAD_TIMEOUT"] = "900"
os.environ["OPENROUTER_API_KEY"] = (
    "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"
)


def run_prompt(user_request: str, project_context: str) -> str:
    """CLI entry point"""
    api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        api_key = input("OPENROUTER_API_KEY: ").strip()
    if not api_key:
        print("ERROR: API key required. Exiting.")
        sys.exit(1)

    pipeline = _IntegratedPipeline(api_key)
    if project_context.strip():
        pipeline.load_documents([project_context.strip()])
    result = pipeline.run_full_pipeline(user_request, project_context)
    slides = result.get("slides_content", [])
    markdown = []
    for slide in slides:
        markdown.append(f"# {slide['title']}\n\n{slide['content']}\n")
    return "\n".join(markdown)


class _IntegratedPipeline:
    """Main pipeline integrating RAG with LLM agents"""

    def __init__(
        self,
        api_key: str,
        embedding_model: str = model_settings.DEFAULT_EMBEDDING_MODEL,
        llm_model: str = model_settings.DEFAULT_MODEL,
    ):
        self.api_key = api_key
        self.llm_model = llm_model
        self.doc_processor = DocumentProcessor()
        self.vector_db = VectorDatabase(embedding_model)
        print("✓ Integrated Pipeline initialized successfully!")

    def load_documents(
        self, documents: List[str], metadata: Optional[List[Dict]] = None
    ):
        print(f"\nLoading {len(documents)} documents into RAG system...")
        all_chunks = []
        for i, doc in enumerate(documents):
            meta = metadata[i] if metadata and i < len(metadata) else {"doc_id": i}
            all_chunks.extend(self.doc_processor.process_document(doc, meta))
        self.vector_db.add_documents(all_chunks)
        print(f"✓ Loaded {len(all_chunks)} chunks into vector database")

    def run_full_pipeline(self, user_request: str, project_context: str = "") -> dict:
        print("\n" + "=" * 60)
        print("STARTING INTEGRATED PIPELINE")
        print("=" * 60)
        # Step 1: Classifier
        print("\n[STEP 1] Running Classifier...")
        clf, _ = self.run_classifier(user_request)
        audience = clf.label
        # Step 2: Planner
        print("\n[STEP 2] Running Planner...")
        struct, _ = self.run_planner(
            self.api_key, audience, project_context, self.llm_model
        )
        slides = [s.model_dump() for s in struct.slides]
        # Step 3: Content Generation
        data = {
            "presentation_topic": user_request[:200],
            "slide_structure": [
                {"id": s["slide_id"], "title": s["title"], "task": s.get("task", "")}
                for s in slides
            ],
        }
        gen = SlideContentGenerator(self.api_key, self.vector_db, self.llm_model)
        result = gen.generate_presentation_content(data)
        return result

    def run_classifier(self, user_text: str) -> Tuple[ClassifierOut, str]:
        """Run classifier agent"""
        prompt = model_settings.CLASSIFIER_PROMPT.format(user_text=user_text)
        resp = model_api_utils.call_model(
            [{"role": "user", "content": prompt}],
            api_key=self.api_key,
            model=self.llm_model,
            max_tokens=400,
        )
        raw = resp["choices"][0]["message"]["content"]
        parsed = json_utils.extract_json_object(raw)
        if parsed is None:
            resp2 = model_api_utils.call_model(
                [
                    {
                        "role": "user",
                        "content": model_settings.JSON_ONLY_PROMPT + "\n\n" + prompt,
                    }
                ],
                api_key=self.api_key,
                model=self.llm_model,
                max_tokens=400,
            )
            raw2 = resp2["choices"][0]["message"]["content"]
            parsed = json_utils.extract_json_object(raw2)
            if parsed is not None:
                raw = raw2
        if parsed is None:
            raise ValueError("Classifier output not parseable as JSON. Raw:\n" + raw)
        clf = ClassifierOut.model_validate(parsed)
        return clf, raw

    def run_planner(
        self, audience: str, project_context: str
    ) -> Tuple[StructureOut, str]:
        """Run planner agent"""
        snippet = (project_context or "")[:4000]
        prompt = model_settings.PLANNER_PROMPT.format(
            audience=audience, context_snippet=snippet
        )
        resp = model_api_utils.call_model(
            [{"role": "user", "content": prompt}],
            api_key=self.api_key,
            model=self.llm_model,
            max_tokens=1000,
        )
        raw = resp["choices"][0]["message"]["content"]
        arr = json_utils.extract_json_array(raw)
        if arr is None:
            resp2 = model_api_utils.call_model(
                [
                    {
                        "role": "user",
                        "content": model_settings.JSON_ONLY_PROMPT + "\n\n" + prompt,
                    }
                ],
                api_key=self.api_key,
                model=self.llm_model,
                max_tokens=1000,
            )
            raw2 = resp2["choices"][0]["message"]["content"]
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


if __name__ == "__main__":
    # Example usage
    UR = "Создай презентацию для инвесторов о нашем стартапе"
    PC = ""  # project context if any
    print(run_prompt(UR, PC))
