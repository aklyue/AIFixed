"""Доменные объекты слайда и презентации."""

from __future__ import annotations

from typing import Any


class SlideContent:
    """Результат генерации контента одного слайда."""

    def __init__(
        self,
        slide_id: int,
        title: str,
        content: str,
        used_facts: list[dict] | None = None,
    ) -> None:
        self.slide_id = slide_id
        self.title = title
        self.content = content
        self.used_facts = used_facts or []

    def to_dict(self) -> dict[str, Any]:
        return {
            "slide_id": self.slide_id,
            "title": self.title,
            "content": self.content,
            "used_facts": self.used_facts,
        }


class PresentationResult:
    """Собранная презентация из сгенерированных слайдов."""

    def __init__(self, slides: list[SlideContent]) -> None:
        self.slides = slides

    def to_markdown(self) -> str:
        chunks = []
        for slide in self.slides:
            chunks.append(f"# {slide.title}\n\n{slide.content.strip()}\n\n")
        return "\n".join(chunks)

    def to_dict_list(self) -> list[dict[str, Any]]:
        return [s.to_dict() for s in self.slides]
