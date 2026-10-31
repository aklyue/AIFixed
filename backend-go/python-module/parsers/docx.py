"""DOCX parser implementation."""

from __future__ import annotations

from docx import Document
from docx.document import Document as DocumentObject
from docx.oxml.text.paragraph import CT_P
from docx.oxml.table import CT_Tbl
from docx.table import Table
from docx.text.paragraph import Paragraph

from .base import AbstractParser
from utils.file import get_extension_from_content_type


class DocxToMDParser(AbstractParser):
    """Convert DOCX files to Markdown."""

    def __init__(self, temp_dir: str = "./tmp") -> None:
        super().__init__(temp_dir)

    def parse(self, filename: str, *args, **kwargs) -> str:
        doc = Document(filename)
        markdown_lines = []

        for element in doc.element.body:
            if isinstance(element, CT_P):
                para = Paragraph(element, doc)
                result = self._parse_paragraph(doc, para)
                if result:
                    markdown_lines.append(result)

            elif isinstance(element, CT_Tbl):
                table = Table(element, doc)
                result = self._parse_table(table)
                markdown_lines.append(result)
                markdown_lines.append("")

        md_text = "\n".join(markdown_lines)
        return self.preprocess_md(md_text)

    def _parse_paragraph(self, doc: DocumentObject, para: Paragraph) -> str:
        images = self._extract_images(doc, para)
        if images:
            return "\n".join(images)

        if para.style.name and para.style.name.startswith("Heading"):
            level = self._get_heading_level(para.style.name)
            return f"{'#' * level} {para.text}\n"

        text = self._format_text(para)

        if not text.strip():
            return ""

        if self._is_list(para):
            return self._format_list_item(para, text)

        return f"{text}\n"

    def _get_heading_level(self, style_name: str) -> int:
        try:
            return int(style_name.split()[-1])
        except (ValueError, IndexError):
            return 1

    def _format_text(self, para: Paragraph) -> str:
        text = ""

        for run in para.runs:
            if not run.text or not (run_text := run.text.strip()):
                continue

            if run.bold and run.italic:
                run_text = f"***{run_text}***"
            elif run.bold:
                run_text = f"**{run_text}**"
            elif run.italic:
                run_text = f"*{run_text}*"
            if run.font.strike:
                run_text = f"~~{run_text}~~"

            if run.font.name and "Courier" in run.font.name:
                run_text = f"`{run_text}`"

            text += run_text

        return text

    def _is_list(self, para: Paragraph) -> bool:
        if para.style.name and para.style.name.startswith("List"):
            return True

        pPr = para._p.pPr
        return pPr is not None and pPr.numPr is not None

    def _format_list_item(self, para: Paragraph, text: str) -> str:
        level = 0
        if para._p.pPr is not None and para._p.pPr.numPr is not None:
            ilvl = para._p.pPr.numPr.ilvl
            if ilvl is not None:
                level = ilvl.val

        indent = "  " * level

        if para.style.name and "Bullet" in para.style.name:
            return f"{indent}- {text}\n"
        else:
            return f"{indent}1. {text}\n"

    def _extract_images(self, doc: DocumentObject, para: Paragraph) -> list:
        images = []

        for run in para.runs:
            blips = run._element.xpath(".//a:blip")

            for blip in blips:
                embed = blip.get(
                    "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed"
                )

                if embed:
                    image_part = doc.part.related_parts[embed]

                    image_ext = get_extension_from_content_type(
                        image_part.content_type
                    )

                    images.append(self.image_to_md(image_part.blob, image_ext))

        return images

    def _parse_table(self, table: Table) -> str:
        md_lines = []

        for i, row in enumerate(table.rows):
            cells = []
            for cell in row.cells:
                cell_text = cell.text.strip().replace("\n", " ")
                cells.append(cell_text)

            md_lines.append("| " + " | ".join(cells) + " |")

            if i == 0:
                separator = "| " + " | ".join(["---"] * len(cells)) + " |"
                md_lines.append(separator)

        return "\n".join(md_lines)