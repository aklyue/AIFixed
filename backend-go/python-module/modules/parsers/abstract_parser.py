import os
import uuid
from abc import ABC, abstractmethod
import re

class AbstractParser(ABC):

    @abstractmethod
    def parse(self, filename: str, *args, **kwargs) -> str:
        pass

    def _preprocess_md(self, md_text: str) -> str:
        md_text = re.sub(r"(\w+)-\n(\w+)", r"\1\2", md_text)
        md_text = re.sub(r" +", " ", md_text)
        md_text = re.sub(r"\n{3,}", "\n\n", md_text)
        md_text = re.sub(r" +\n", "\n", md_text)
        return md_text.strip()

    def _image_to_md(self, content: bytes, ext: str, alt: str = "") -> str:
        # Берем директорию для временных файлов из переменной окружения (ее же контролирует Go!)
        # Либо используем общий относительный путь "./tmp"
        tmp_dir = os.getenv("TEMPFILE_DIR", "./tmp")
        os.makedirs(tmp_dir, exist_ok=True)
        
        # Генерируем уникальное имя файла с правильным расширением
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(tmp_dir, filename)
        
        # Сохраняем бинарник картинки на диск
        with open(filepath, "wb") as f:
            f.write(content)
            
        # Возвращаем путь, который идеально совпадает с Go-роутером GET /api/files/{filename}
        return f"![](/api/files/{filename})"