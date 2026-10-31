"""Утилиты для извлечения JSON из текста LLM."""

import re
from typing import Any

from . import text


def extract_json_balanced(text: str) -> dict | None:
    """Извлекает первый валидный JSON-объект из текста, используя сбалансированные скобки."""
    t = text.pre_sanitize(text)
    start = None
    depth = 0
    in_str = False
    esc = False
    for i, ch in enumerate(t):
        if start is None:
            if ch == "{":
                start = i
                depth = 1
                in_str = False
                esc = False
            continue
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
        else:
            if ch == '"':
                in_str = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    cand = t[start : i + 1]
                    try:
                        import json

                        return json.loads(cand)
                    except Exception:
                        pass
    try:
        import json

        parsed = json.loads(t)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass
    m = re.search(r"\{.*\}", t, flags=re.DOTALL)
    if m:
        try:
            import json

            cand = m.group(0)
            parsed = json.loads(cand)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass
    return None


def extract_json_array(text: str) -> list[Any] | None:
    """Извлекает первый валидный JSON-массив из текста."""
    t = text.pre_sanitize(text)
    try:
        import json

        parsed = json.loads(t)
        if isinstance(parsed, list):
            return parsed
    except Exception:
        pass
    for c in re.findall(r"\[[^[]*\]", t, flags=re.DOTALL):
        try:
            import json

            parsed = json.loads(c)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            continue
    m = re.search(r"\[.*\]", t, flags=re.DOTALL)
    if m:
        try:
            import json

            parsed = json.loads(m.group(0))
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass
    return None
