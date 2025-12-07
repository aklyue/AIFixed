import json

import requests

from src.config import settings, model_settings


def call_model(
    messages: list[dict],
    api_key: str,
    model: str = settings.DEFAULT_MODEL,
    temperature: float = model_settings.GEN_TEMPERATURE,
    max_tokens: int = 900,
    timeout: int = 60,
) -> dict:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "presenton-stable/1.2",
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    resp = requests.post(
        settings.OPENROUTER_API_URL, headers=headers, json=payload, timeout=timeout
    )
    if not resp.ok:
        try:
            err = resp.json()
            raise RuntimeError(
                f"API error {resp.status_code}: {json.dumps(err, ensure_ascii=False)}"
            )
        except Exception:
            raise RuntimeError(f"API error {resp.status_code}: {resp.text}")
    return resp.json()


def get_content(resp: dict) -> str:
    try:
        return resp["choices"][0]["message"]["content"]
    except Exception as e:
        raise RuntimeError(
            f"Unexpected LLM response format: {json.dumps(resp, ensure_ascii=False)[:800]}"
        ) from e


def get_api_key(explicit: str | None = None) -> str:
    key = (
        explicit or settings.OPENROUTER_API_KEY or settings.OPENAI_API_KEY or ""
    ).strip()
    key = _strip_invisible(key)
    if not key:
        raise RuntimeError(
            "API key required (set CONFIG['API_KEY'] "
            "or env OPENROUTER_API_KEY/OPENAI_API_KEY)."
        )
    if not key.isascii():
        raise RuntimeError("API key contains non-ASCII characters.")
    return key


def _strip_invisible(s: str) -> str:
    if not s:
        return s
    s = "".join(
        ch
        for ch in s
        if ch.isprintable()
        and ch not in ("\u00a0", "\u2009", "\u200a", "\u202f", "\u2007", "\u2060")
    )
    s = s.replace("\u200b", "").replace("\u200c", "").replace("\u200d", "")
    return s
