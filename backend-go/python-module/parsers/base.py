"""Базовый класс парсера документов."""

from __future__ import annotations

import os
import re
import uuid
from abc import ABC, abstractmethod


class AbstractParser(ABC):
    """Базовый класс для всех парсеров документов."""

    def __init__(self, temp_dir: str = "./tmp") -> None:
        self.temp_dir = temp_dir

    @abstractmethod
    def parse(self, filename: str, *args, **kwargs) -> str:
        """Превращает файл в Markdown-строку."""

    def preprocess_md(self, md_text: str) -> str:
        md_text = re.sub(r"(\w+)-\n(\w+)", r"\1\2", md_text)
        md_text = re.sub(r" +", " ", md_text)
        md_text = re.sub(r"\n{3,}", "\n\n", md_text)
        md_text = re.sub(r" +\n", "\n", md_text)
        return md_text.strip()

    def image_to_md(self, content: bytes, ext: str, alt: str = "") -> str:
        os.makedirs(self.temp_dir, exist_ok=True)
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(self.temp_dir, filename)
        with open(filepath, "wb") as f:
            f.write(content)
        return f"![](/api/files/{filename})"
