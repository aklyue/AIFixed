"""Репозиторий для работы с Qdrant векторной базой данных."""

from __future__ import annotations

import logging
import uuid
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models

from core.exceptions import RAGError


class QdrantRepository:
    """Инкапсулирует все операции с Qdrant."""

    def __init__(
        self,
        host: str,
        collection_name: str,
        embedding_model_name: str,
        encoder: Any,
        vector_size: int,
        api_key: str | None = None,
    ) -> None:
        self.host = host
        self.collection_name = collection_name
        self.encoder = encoder
        self.vector_size = vector_size
        self.logger = logging.getLogger(__name__)

        self.client = QdrantClient(host, api_key=api_key)
        self._ensure_collection()

    def _ensure_collection(self) -> None:
        try:
            if not self.client.collection_exists(self.collection_name):
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=qdrant_models.VectorParams(
                        size=self.vector_size,
                        distance=qdrant_models.Distance.COSINE,
                    ),
                )
                self.logger.info(
                    "Created Qdrant collection: %s", self.collection_name
                )
        except Exception as exc:
            raise RAGError(f"Failed to ensure Qdrant collection: {exc}") from exc

    def add_documents(self, chunks: list[dict[str, Any]]) -> None:
        if not chunks:
            return

        points = []
        for item in chunks:
            vector = self.encoder.encode(item["text"]).tolist()
            doc_id = str(uuid.uuid4())
            points.append(
                qdrant_models.PointStruct(
                    id=doc_id,
                    vector=vector,
                    payload={
                        "context": item["text"],
                        "file_name": item.get("metadata", {}).get("source"),
                        "chunk_index": item.get("chunk_id"),
                        "id": doc_id,
                    },
                )
            )

        batch_size = 100
        for i in range(0, len(points), batch_size):
            batch = points[i : i + batch_size]
            self.client.upsert(
                collection_name=self.collection_name, points=batch
            )

        self.logger.info(
            "Added %d chunks to Qdrant collection %s",
            len(chunks),
            self.collection_name,
        )

    def search(
        self,
        query_vector: list[float],
        top_k: int = 30,
    ) -> list[dict[str, Any]]:
        try:
            response = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=top_k,
                with_payload=True,
            )
            candidates = []
            for hit in response:
                payload = hit.payload or {}
                candidates.append(
                    {
                        "text": payload.get("context"),
                        "score": hit.score,
                        "metadata": {
                            "source": payload.get("file_name"),
                            "chunk_id": payload.get("chunk_index"),
                        },
                    }
                )
            return candidates
        except Exception as exc:
            raise RAGError(f"Qdrant search failed: {exc}") from exc
