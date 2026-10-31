"""Операции с временными файлами."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path


class FileStorage:
    """Управление временными файлами для загруженных документов."""

    def __init__(self, temp_dir: str | Path | None = None) -> None:
        self.temp_dir = Path(temp_dir or "./tmp")
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def save_uploaded_file(
        self, content: bytes, suffix: str = ".tmp"
    ) -> str:
        fd, path = tempfile.mkstemp(
            suffix=suffix, dir=str(self.temp_dir)
        )
        with os.fdopen(fd, "wb") as f:
            f.write(content)
        return path

    def delete_file(self, path: str) -> None:
        try:
            os.unlink(path)
        except FileNotFoundError:
            pass
