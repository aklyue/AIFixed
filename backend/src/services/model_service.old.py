#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Integrated RAG + LLM Agents Pipeline for Presentation Generation (CLI Version)
Combines:
- RAG system with sentence transformers and vector database
- LLM agent pipeline: classifier -> planner -> content generator
"""

from __future__ import annotations
import os
import sys
import re
import json
import time
import textwrap
import argparse
import traceback
from typing import List, Any, Optional, Tuple, Dict

import requests
import numpy as np
from sentence_transformers import SentenceTransformer

from src.config import settings

os.environ['HF_HUB_DOWNLOAD_TIMEOUT'] = '900'

# pydantic для валидации
try:
    from pydantic import BaseModel, Field, field_validator, model_validator
except Exception:
    raise RuntimeError("pydantic required. Install: pip install pydantic")

# ----------------- Config -----------------
DEFAULT_MODEL = "google/gemma-3-27b-it"
API_URL = "https://openrouter.ai/api/v1/chat/completions"
MIN_SLIDES = 10
MAX_SLIDES = 15
JSON_ONLY_PROMPT = "Previous reply was not valid JSON. Please REPLY with valid JSON only (no explanations, no code fences)."
CLASSIFIER_CONFIDENCE_THRESHOLD = 0.4

# RAG Config
DEFAULT_EMBEDDING_MODEL = "intfloat/multilingual-e5-small"
CHUNK_SIZE = 512
CHUNK_OVERLAP = 50
TOP_K_RETRIEVAL = 5


# ----------------- API wrapper -----------------
def call_model(
    messages: List[dict],
    api_key: str,
    model: str = DEFAULT_MODEL,
    temperature: float = 0.0,
    max_tokens: int = 800,
    timeout: int = 60,
) -> dict:
    """Call OpenRouter API"""
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is required (env or argument).")
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    resp = requests.post(API_URL, headers=headers, json=payload, timeout=timeout)
    if not resp.ok:
        try:
            err = resp.json()
            raise RuntimeError(
                f"API error {resp.status_code}: {json.dumps(err, ensure_ascii=False)}"
            )
        except Exception:
            raise RuntimeError(f"API error {resp.status_code}: {resp.text}")
    return resp.json()


# ----------------- Pydantic models -----------------
class ClassifierOut(BaseModel):
    label: str
    confidence: float
    rationale: str
    suggested_actions: List[str]

    @field_validator("label")
    @classmethod
    def check_label(cls, v: str) -> str:
        allowed = {"TopManagement", "Experts", "Investors"}
        if v not in allowed:
            raise ValueError(f"label must be one of {allowed}")
        return v

    @field_validator("confidence")
    @classmethod
    def check_confidence(cls, v: Any) -> float:
        fv = float(v)
        if not (0.0 <= fv <= 1.0):
            raise ValueError("confidence out of range 0.0-1.0")
        return fv


class SlideItem(BaseModel):
    slide_id: int
    title: str

    @field_validator("title")
    @classmethod
    def check_title(cls, v: str) -> str:
        if not isinstance(v, str) or not v.strip():
            raise ValueError("title must be non-empty")
        if len(v.split()) > 24:
            raise ValueError("title too long")
        return v.strip()


class StructureOut(BaseModel):
    slides: List[SlideItem] = Field(..., min_length=MIN_SLIDES, max_length=MAX_SLIDES)

    @model_validator(mode="after")
    @classmethod
    def check_seq(cls, m):
        for i, s in enumerate(m.slides, start=1):
            if s.slide_id != i:
                raise ValueError(
                    f"slide_id must be sequential starting at 1 (expected {i}, got {s.slide_id})"
                )
        return m


# ----------------- JSON extraction helpers -----------------
def extract_json_object(text: str) -> Optional[dict]:
    """Extract JSON object from text"""
    if not text:
        return None
    candidates = re.findall(r"\{[^{}]*\}", text, flags=re.DOTALL)
    candidates = sorted(set(candidates), key=len)
    for c in candidates:
        try:
            parsed = json.loads(c)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            continue
    m = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if m:
        try:
            parsed = json.loads(m.group(0))
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass
    return None


def extract_json_array(text: str) -> Optional[List[Any]]:
    """Extract JSON array from text"""
    if not text:
        return None
    candidates = re.findall(r"\[[^\[\]]*\]", text, flags=re.DOTALL)
    candidates = sorted(set(candidates), key=len)
    for c in candidates:
        try:
            parsed = json.loads(c)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            continue
    m = re.search(r"\[.*\]", text, flags=re.DOTALL)
    if m:
        try:
            parsed = json.loads(m.group(0))
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
    except Exception:
        pass
    return None


# ----------------- RAG System: Document Processing -----------------
class DocumentProcessor:
    """Handles document chunking and processing"""

    def __init__(
        self, chunk_size: int = CHUNK_SIZE, chunk_overlap: int = CHUNK_OVERLAP
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks"""
        if not text or not text.strip():
            return []

        sentences = re.split(r"(?<=[.!?])\s+", text)
        chunks = []
        current_chunk = []
        current_length = 0

        for sentence in sentences:
            sentence_length = len(sentence)

            if current_length + sentence_length > self.chunk_size and current_chunk:
                chunks.append(" ".join(current_chunk))

                overlap_size = 0
                overlap_chunk = []
                for s in reversed(current_chunk):
                    if overlap_size + len(s) <= self.chunk_overlap:
                        overlap_chunk.insert(0, s)
                        overlap_size += len(s)
                    else:
                        break

                current_chunk = overlap_chunk
                current_length = overlap_size

            current_chunk.append(sentence)
            current_length += sentence_length

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks

    def process_document(
        self, document: str, metadata: Optional[Dict] = None
    ) -> List[Dict]:
        """Process a document into chunks with metadata"""
        chunks = self.chunk_text(document)
        processed_chunks = []

        for i, chunk in enumerate(chunks):
            chunk_data = {"chunk_id": i, "text": chunk, "metadata": metadata or {}}
            processed_chunks.append(chunk_data)

        return processed_chunks


# ----------------- RAG System: Vector Database -----------------
class VectorDatabase:
    """Vector database using sentence transformers"""

    def __init__(self, embedding_model_name: str = DEFAULT_EMBEDDING_MODEL):
        print(f"Loading embedding model: {embedding_model_name}")
        self.model = SentenceTransformer(embedding_model_name)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()

        self.embeddings = []
        self.chunks = []
        self.metadata = []

    def add_documents(self, chunks: List[Dict]):
        """Add document chunks to the database"""
        if not chunks:
            return

        texts = [chunk["text"] for chunk in chunks]
        print(f"Encoding {len(texts)} chunks...")

        batch_size = 32
        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            batch_embeddings = self.model.encode(
                batch, convert_to_numpy=True, show_progress_bar=False
            )
            all_embeddings.append(batch_embeddings)

        embeddings = np.vstack(all_embeddings)

        self.embeddings.append(embeddings)
        self.chunks.extend(chunks)
        self.metadata.extend([chunk.get("metadata", {}) for chunk in chunks])

        print(f"Added {len(chunks)} chunks. Total chunks: {len(self.chunks)}")

    def search(self, query: str, top_k: int = TOP_K_RETRIEVAL) -> List[Dict]:
        """Search for most relevant chunks"""
        if not self.chunks:
            return []

        query_embedding = self.model.encode([query], convert_to_numpy=True)[0]
        all_embeddings = np.vstack(self.embeddings) if self.embeddings else np.array([])

        if all_embeddings.size == 0:
            return []

        scores = np.dot(all_embeddings, query_embedding) / (
            np.linalg.norm(all_embeddings, axis=1) * np.linalg.norm(query_embedding)
        )

        top_indices = np.argsort(scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            results.append(
                {
                    "text": self.chunks[idx]["text"],
                    "score": float(scores[idx]),
                    "metadata": self.metadata[idx],
                    "chunk_id": self.chunks[idx].get("chunk_id", idx),
                }
            )

        return results

    def clear(self):
        """Clear all data"""
        self.embeddings = []
        self.chunks = []
        self.metadata = []


# ----------------- Prompts -----------------
CLASSIFIER_PROMPT = textwrap.dedent(
    """
Ты — классификатор аудитории для генерации презентаций. На входе — короткий user_request и (опционально) project_context.
Верни строго JSON с полями:
- label: одно из ["TopManagement","Experts","Investors"]
- confidence: число 0.0-1.0
- rationale: 1-2 предложения почему
- suggested_actions: список коротких предложений/действий

FEW-SHOT EXAMPLES:
User: "Нужно 5 слайдов для совета директоров, кратко о стратегии и финансах."
-> {{ "label": "TopManagement", "confidence": 0.97, "rationale": "Явно указано 'совет директоров' и требование краткости.", "suggested_actions": ["generate_presentation", "audience:TopManagement"] }}

User: "Пришлите полную методологию расчетов unit-economics и assumptions."
-> {{ "label": "Experts", "confidence": 0.99, "rationale": "Запрошена глубокая методология и предпосылки.", "suggested_actions": ["generate_presentation","audience:Experts"] }}

User: "Сделайте pitch для инвестора: сколько нужно и на что, прогноз 3 года."
-> {{ "label": "Investors", "confidence": 0.98, "rationale": "Фокус на ask и прогнозе — инвесторская логика.", "suggested_actions": ["generate_presentation","audience:Investors"] }}

USER_QUERY: {user_text}

Return ONLY the JSON object — no extra text.
"""
)

PLANNER_PROMPT = textwrap.dedent(
    """
Ты — генератор структуры презентации (только структура, без содержания).
Вход: audience (TopManagement | Experts | Investors) и краткий project_context.
Задача: вернуть строго ТОЛЬКО JSON-массив объектов в формате:
[{{"slide_id":1,"title":"Заголовок","task":"Короткое задание"}}, ...]

Требования:
- Количество слайдов обязательно 10–15.
- slide_id — последовательные целые числа, начиная с 1.
- title — короткий заголовок на русском (не больше 6 слов).
- task — 1-2 коротких предложения с заданием для генерации контента.
- Никакого дополнительного текста/пояснений — только валидный JSON-массив.

Audience: {audience}
Project context (extract): {context_snippet}

Return ONLY the JSON array — no extra text.
"""
)


# ----------------- Classifier & Planner runners -----------------
def run_classifier(
    api_key: str, user_text: str, model: str = DEFAULT_MODEL
) -> Tuple[ClassifierOut, str]:
    """Run classifier agent"""
    prompt = CLASSIFIER_PROMPT.format(user_text=user_text)
    resp = call_model(
        [{"role": "user", "content": prompt}],
        api_key=api_key,
        model=model,
        max_tokens=400,
    )
    raw = resp["choices"][0]["message"]["content"]
    parsed = extract_json_object(raw)
    if parsed is None:
        resp2 = call_model(
            [{"role": "user", "content": JSON_ONLY_PROMPT + "\n\n" + prompt}],
            api_key=api_key,
            model=model,
            max_tokens=400,
        )
        raw2 = resp2["choices"][0]["message"]["content"]
        parsed = extract_json_object(raw2)
        if parsed is not None:
            raw = raw2
    if parsed is None:
        raise ValueError("Classifier output not parseable as JSON. Raw:\n" + raw)
    clf = ClassifierOut.model_validate(parsed)
    return clf, raw


def run_planner(
    api_key: str, audience: str, project_context: str, model: str = DEFAULT_MODEL
) -> Tuple[StructureOut, str]:
    """Run planner agent"""
    snippet = (project_context or "")[:4000]
    prompt = PLANNER_PROMPT.format(audience=audience, context_snippet=snippet)
    resp = call_model(
        [{"role": "user", "content": prompt}],
        api_key=api_key,
        model=model,
        max_tokens=1000,
    )
    raw = resp["choices"][0]["message"]["content"]
    arr = extract_json_array(raw)
    if arr is None:
        resp2 = call_model(
            [{"role": "user", "content": JSON_ONLY_PROMPT + "\n\n" + prompt}],
            api_key=api_key,
            model=model,
            max_tokens=1000,
        )
        raw2 = resp2["choices"][0]["message"]["content"]
        if raw2 and raw2 != raw:
            raw = raw2
        arr = extract_json_array(raw)
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

    if len(normalized) < MIN_SLIDES:
        for j in range(len(normalized) + 1, MIN_SLIDES + 1):
            normalized.append(
                {
                    "slide_id": j,
                    "title": f"Доп. слайд {j}",
                    "task": "Автоматически добавлен.",
                }
            )
    if len(normalized) > MAX_SLIDES:
        normalized = normalized[:MAX_SLIDES]
    for idx, it in enumerate(normalized, start=1):
        it["slide_id"] = idx
    struct = StructureOut.model_validate({"slides": normalized})
    return struct, raw


# ----------------- SlideContentGenerator with RAG -----------------
class SlideContentGenerator:
    """Content generator using RAG system"""

    def __init__(
        self, api_key: str, vector_db: VectorDatabase, model: str = DEFAULT_MODEL
    ):
        self.api_key = api_key
        self.vector_db = vector_db
        self.model = model
        self.used_facts: List[str] = []
        self.generation_history: List[dict] = []

    def generate_slide_prompt(
        self,
        slide_id: int,
        slide_title: str,
        slide_task: str,
        topic: str,
        retrieved_chunks: List[str],
    ) -> str:
        """Generate prompt for slide content"""
        chunks_text = (
            "\n".join([f"{i+1}. {c}" for i, c in enumerate(retrieved_chunks)])
            if retrieved_chunks
            else ""
        )

        used_facts_section = ""
        if self.used_facts:
            used_facts_section = "\nИСПОЛЬЗОВАННЫЕ_ФАКТЫ_РАНЕЕ: " + "; ".join(
                [f[:120] for f in self.used_facts[-10:]]
            )

        prompt = f"""
Ты — ассистент, который создаёт контент для слайда презентации, используя ТОЛЬКО предоставленные данные (chunks).

ТЕМА: {topic}
СЛАЙД №{slide_id}: "{slide_title}"
ЗАДАЧА: {slide_task}

ИСХОДНЫЕ ДАННЫЕ (chunks):
{chunks_text}

{used_facts_section}

СТРОГИЕ ТРЕБОВАНИЯ:
1) Используй ТОЛЬКО факты из раздела "ИСХОДНЫЕ ДАННЫЕ (chunks)".
2) Если релевантных данных нет — верни объект:
 {{ "slide_id": {slide_id}, "title": "{slide_title}", "used_facts": [], "content": "### {slide_title}\\n\\n* Данные для этого раздела отсутствуют" }}
3) Формат ответа: ТОЛЬКО один JSON-объект (без пояснений), со следующими полями:
 - slide_id (число)
 - title (строка)
 - used_facts (массив коротких дословных цитат из chunks, до 50 символов)
 - content (строка): НЕ включай заголовок или markdown headers (###). Формат: 
   * Первая строка: 1-2 предложения краткого описания
   * Затем пустая строка
   * Затем 3-4 буллета (каждый начинается с "* "), длина каждого <= 70 символов

Верни ТОЛЬКО валидный JSON объект.
"""
        return prompt

    def call_api(self, prompt: str, max_tokens: int = 600, retry: int = 2) -> str:
        """Call API with retry"""
        for attempt in range(retry):
            try:
                resp = call_model(
                    [{"role": "user", "content": prompt}],
                    api_key=self.api_key,
                    model=self.model,
                    max_tokens=max_tokens,
                    temperature=0.2,
                    timeout=60,
                )
                return resp["choices"][0]["message"]["content"]
            except Exception as e:
                if attempt < retry - 1:
                    time.sleep(1 + attempt * 2)
                    continue
                raise

    def extract_json_from_text(self, text: str) -> dict:
        """Extract JSON from model output"""
        m = re.search(r"``````", text, flags=re.DOTALL)
        if m:
            try:
                return json.loads(m.group(1))
            except Exception:
                pass
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            candidate = text[start : end + 1]
            try:
                return json.loads(candidate)
            except Exception:
                pass
        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass
        raise ValueError("Не удалось извлечь JSON объект из ответа модели.")

    def validate_slide_content(
        self, slide_content: dict, source_chunks: List[str], slide_id: int
    ) -> bool:
        """Validate generated slide content"""
        required = {"slide_id", "title", "content"}
        if not required.issubset(set(slide_content.keys())):
            raise ValueError(
                f"Missing required keys in slide {slide_id}: need {required}"
            )
        return True

    def _create_fallback(self, slide_id: int, slide_title: str) -> dict:
        """Create fallback content"""
        return {
            "slide_id": slide_id,
            "title": slide_title,
            "used_facts": [],
            "content": "Данные для этого раздела отсутствуют",
        }

    def generate_slide_content(
        self, slide_id: int, slide_title: str, slide_task: str, topic: str
    ) -> dict:
        """Generate content for a single slide using RAG"""
        query = f"{slide_title} {slide_task}"
        retrieved_results = self.vector_db.search(query, top_k=TOP_K_RETRIEVAL)
        retrieved_chunks = [r["text"] for r in retrieved_results]

        print(f"  Retrieved {len(retrieved_chunks)} chunks for slide {slide_id}")

        prompt = self.generate_slide_prompt(
            slide_id, slide_title, slide_task, topic, retrieved_chunks
        )
        try:
            raw = self.call_api(prompt)
            parsed = self.extract_json_from_text(raw)

            if int(parsed.get("slide_id", -1)) != slide_id:
                parsed["slide_id"] = slide_id

            self.validate_slide_content(parsed, retrieved_chunks, slide_id)

            used = parsed.get("used_facts", [])
            if isinstance(used, list):
                self.used_facts.extend([u for u in used if isinstance(u, str)])

            self.generation_history.append({"slide_id": slide_id, "success": True})
            return parsed
        except Exception as e:
            print(f"  Warning: Error generating slide {slide_id}: {e}")
            self.generation_history.append(
                {"slide_id": slide_id, "success": False, "error": str(e)}
            )
            return self._create_fallback(slide_id, slide_title)

    def generate_presentation_content(self, presentation_data: dict) -> dict:
        """Generate content for all slides"""
        result = {
            "presentation_topic": presentation_data.get("presentation_topic", ""),
            "slides_content": [],
            "generation_metadata": {
                "total_facts_used": 0,
                "slides_generated": 0,
                "slides_with_fallback": 0,
            },
        }

        for slide in presentation_data["slide_structure"]:
            sid = slide["id"]
            title = slide["title"]
            task = slide.get("task", "")

            print(f"\n---- Генерирую слайд {sid}: {title} ----")
            slide_content = self.generate_slide_content(
                sid, title, task, presentation_data.get("presentation_topic", "")
            )
            result["slides_content"].append(slide_content)
            result["generation_metadata"]["slides_generated"] += 1

            if not slide_content.get("used_facts"):
                result["generation_metadata"]["slides_with_fallback"] += 1

            time.sleep(1.0)

        result["generation_metadata"]["total_facts_used"] = len(set(self.used_facts))
        return result


# ----------------- Main Pipeline -----------------
class IntegratedPipeline:
    """Main pipeline integrating RAG with LLM agents"""

    def __init__(
        self,
        api_key: str,
        embedding_model: str = DEFAULT_EMBEDDING_MODEL,
        llm_model: str = DEFAULT_MODEL,
    ):
        self.api_key = api_key
        self.llm_model = llm_model

        self.doc_processor = DocumentProcessor()
        self.vector_db = VectorDatabase(embedding_model)

        print("✓ Integrated Pipeline initialized successfully!")

    def load_documents(
        self, documents: List[str], metadata: Optional[List[Dict]] = None
    ):
        """Load documents into RAG system"""
        print(f"\nLoading {len(documents)} documents into RAG system...")

        all_chunks = []
        for i, doc in enumerate(documents):
            doc_metadata = (
                metadata[i] if metadata and i < len(metadata) else {"doc_id": i}
            )
            chunks = self.doc_processor.process_document(doc, doc_metadata)
            all_chunks.extend(chunks)

        self.vector_db.add_documents(all_chunks)
        print(f"✓ Loaded {len(all_chunks)} chunks into vector database")

    def run_full_pipeline(self, user_request: str, project_context: str = "") -> dict:
        """Run complete pipeline: classify -> plan -> generate with RAG"""
        print("\n" + "=" * 60)
        print("STARTING INTEGRATED PIPELINE")
        print("=" * 60)

        # Step 1: Classifier
        print("\n[STEP 1] Running Classifier...")
        try:
            clf, clf_raw = run_classifier(self.api_key, user_request, self.llm_model)
            print(f"  Audience: {clf.label} (confidence: {clf.confidence:.2f})")
            print(f"  Rationale: {clf.rationale}")
        except Exception as e:
            print(f"Classifier error: {e}")
            raise

        audience = clf.label

        # Step 2: Planner
        print("\n[STEP 2] Running Planner...")
        try:
            struct, planner_raw = run_planner(
                self.api_key, audience, project_context, self.llm_model
            )
            slides = [s.model_dump() for s in struct.slides]
            print(f"  Generated structure with {len(slides)} slides")
        except Exception as e:
            print(f"Planner error: {e}")
            raise

        # Step 3: Content Generation with RAG
        print("\n[STEP 3] Generating Content with RAG...")
        presentation_data = {
            "presentation_topic": user_request[:200],
            "slide_structure": [
                {"id": s["slide_id"], "title": s["title"], "task": s.get("task", "")}
                for s in slides
            ],
        }

        generator = SlideContentGenerator(
            api_key=self.api_key, vector_db=self.vector_db, model=self.llm_model
        )

        result = generator.generate_presentation_content(presentation_data)

        result["classifier_output"] = clf.model_dump()
        result["structure_output"] = slides

        print("\n" + "=" * 60)
        print("PIPELINE COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print(
            f"Total slides generated: {result['generation_metadata']['slides_generated']}"
        )
        print(
            f"Slides with fallback: {result['generation_metadata']['slides_with_fallback']}"
        )
        print(f"Total facts used: {result['generation_metadata']['total_facts_used']}")

        return result


# ----------------- CLI -----------------
def run_prompt(user_request: str, project_context: str) -> str:
    """CLI entry point"""
    # parser = argparse.ArgumentParser(description="Integrated RAG + LLM Agents Pipeline")
    # parser.add_argument(
    #     "--api-key",
    #     type=str,
    #     help="OpenRouter API key (or use OPENROUTER_API_KEY env var)",
    # )
    # parser.add_argument(
    #     "--llm-model", type=str, default=DEFAULT_MODEL, help="LLM model name"
    # )
    # parser.add_argument(
    #     "--embedding-model",
    #     type=str,
    #     default=DEFAULT_EMBEDDING_MODEL,
    #     help="Embedding model name",
    # )
    # parser.add_argument("--user-request", type=str, help="User request/prompt")
    # parser.add_argument("--context-file", type=str, help="Path to project context file")
    # parser.add_argument(
    #     "--output",
    #     type=str,
    #     default="generated_presentation_rag.json",
    #     help="Output JSON file",
    # )

    # args = parser.parse_args()

    # Get API key
    api_key = settings.OPENROUTER_API_KEY
    if not api_key:
        api_key = input("OPENROUTER_API_KEY: ").strip()
    if not api_key:
        print("ERROR: API key required. Exiting.")
        sys.exit(1)

    # Get user request
    if not user_request:
        print("\nEnter user request (prompt for presentation):")
        user_request = input("> ").strip()
    if not user_request:
        print("ERROR: Empty user request. Exiting.")
        sys.exit(1)

    # Get project context
    # if args.context_file:
    #     try:
    #         with open(args.context_file, "r", encoding="utf-8") as f:
    #             project_context = f.read()
    #         print(f"✓ Loaded context from {args.context_file}")
    #     except Exception as e:
    #         print(f"Warning: Could not read context file: {e}")
    # else:
    #     print("\nPaste project context (or press Ctrl+D / Ctrl+Z+Enter when done):")
    #     lines = []
    #     try:
    #         while True:
    #             line = input()
    #             lines.append(line)
    #     except EOFError:
    #         pass
    #     project_context = "\n".join(lines)

    if not project_context.strip():
        print("Warning: No project context provided. RAG will have no data.")

    try:
        # Initialize pipeline
        print("\nInitializing pipeline...")
        pipeline = IntegratedPipeline(
            api_key=api_key,
            embedding_model=DEFAULT_EMBEDDING_MODEL,
            llm_model=DEFAULT_MODEL,
        )

        # Load documents
        if project_context.strip():
            pipeline.load_documents([project_context.strip()])

        # Run pipeline
        result = pipeline.run_full_pipeline(user_request, project_context)

        # Save result
        # with open(args.output, "w", encoding="utf-8") as f:
        #     json.dump(result, f, ensure_ascii=False, indent=2)

        # print(f"\n✓ Saved generated presentation to {args.output}")
        # print("\nPreview:")
        # print(json.dumps(result, ensure_ascii=False, indent=2)[:1500])
        # print("\n... (see full output in file)")

        slides = result.get("slides_content")
        if not slides:
            raise ValueError("No slides_content found in result")

        markdown_lines = []
        for slide in slides:
            if not isinstance(slide, dict):
                print(f"Warning: Skipping invalid slide: {slide}")
                continue
            title = slide.get("title", "Untitled")
            content = slide.get("content", "")
            markdown_lines.append(f"# {title}\n\n{content.strip()}\n")

        return "\n".join(markdown_lines)

    except Exception as e:
        print(f"\nERROR: {e}")
        traceback.print_exc()
        sys.exit(1)
