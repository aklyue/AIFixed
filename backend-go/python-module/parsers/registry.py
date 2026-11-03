"""Реестр парсеров: маршрутизация по расширению файла."""

from __future__ import annotations

import os
from typing import Callable

from .base import AbstractParser
from .docx import DocxToMDParser
from .pdf import PDFToMDParser
from .pptx import PPTXToMDParser


class ParserRegistry:
    """Сопоставляет расширение файла с подходящим парсером."""

    def __init__(self, temp_dir: str = "./tmp") -> None:
        self._pptx_parser = PPTXToMDParser(temp_dir=temp_dir)
        self._docx_parser = DocxToMDParser(temp_dir=temp_dir)
        self._pdf_parser = PDFToMDParser(temp_dir=temp_dir)

        self._format_to_func: dict[str, Callable[..., str]] = {
            "pdf": self._pdf_parser.parse,
            "doc": self._docx_parser.parse,
            "docx": self._docx_parser.parse,
            "csv": self._parse_from_csv,
            "tsv": self._parse_from_csv,
            "xlsx": self._parse_from_xlsx,
            "pptx": self._pptx_parser.parse,
        }

    def parse(self, filename: str, *args, **kwargs) -> str:
        from ..utils.file import get_file_ext

        ext = get_file_ext(filename)
        func = self._format_to_func.get(ext)
        if func is None:
            from core.exceptions import ParsingError

            raise ParsingError(f"Неподдерживаемый формат: {ext}")
        return func(filename, *args, **kwargs)

    def _parse_from_csv(self, filename: str, sep: str = ",") -> str:
        import pandas as pd

        md = pd.read_csv(filename, sep=sep).to_markdown()
        return self._preprocess(md)

    def _parse_from_xlsx(self, filename: str) -> str:
        import pandas as pd

        md = pd.read_excel(filename).to_markdown()
        return self._preprocess(md)

    def _preprocess(self, md_text: str) -> str:
        base = AbstractParser.__new__(AbstractParser)
        return base.preprocess_md(md_text)

    @property
    def allowed_formats(self) -> tuple[str, ...]:
        return tuple(self._format_to_func.keys())


# Глобальный реестр
temp_dir = os.getenv("TEMPFILE_DIR", "./tmp")
markdown_parser = ParserRegistry(temp_dir=temp_dir)
