"""Сервис конвертации загруженных файлов в Markdown."""

from __future__ import annotations

from typing import Any

from adapters.file_storage import FileStorage
from core.exceptions import ParsingError
from parsers.registry import markdown_parser
from utils.file import get_file_ext


class ParsingService:
    """Конвертирует загруженный файл в текст Markdown."""

    def __init__(
        self,
        file_storage: FileStorage,
        temp_dir: str = "./tmp",
    ) -> None:
        self.file_storage = file_storage
        self.temp_dir = temp_dir

    async def convert_file(
        self,
        file_content: bytes,
        filename: str,
    ) -> str:
        file_ext = get_file_ext(filename)
        if file_ext not in markdown_parser.allowed_formats:
            raise ParsingError(f"Неподдерживаемый формат файла: {file_ext}")

        tmp_path = ""
        try:
            suffix = f".{file_ext}" if file_ext else ".tmp"
            tmp_path = self.file_storage.save_uploaded_file(
                file_content, suffix=suffix
            )
            md_text = markdown_parser.parse(tmp_path)
            return md_text
        finally:
            if tmp_path:
                self.file_storage.delete_file(tmp_path)
