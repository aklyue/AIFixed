"""Клиент OpenRouter API с ретраями и обработкой ошибок."""

from __future__ import annotations

import json
import time
from typing import Any

import httpx

from core.exceptions import AIError


class OpenRouterClient:
    """Асинхронный клиент для OpenRouter API."""

    def __init__(
        self,
        api_key: str,
        base_url: str | None = None,
        timeout: int = 60,
        max_retries: int = 3,
    ) -> None:
        self.api_key = api_key
        self.base_url = base_url or "https://openrouter.ai/api/v1/chat/completions"
        self.timeout = timeout
        self.max_retries = max_retries

    async def chat_completion(
        self,
        messages: list[dict[str, str]],
        model: str,
        temperature: float = 0.2,
        max_tokens: int = 900,
    ) -> dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "aifix-python-module/1.0",
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        last_error: Exception | None = None
        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(
                        self.base_url, headers=headers, json=payload
                    )
                    if resp.is_success:
                        return resp.json()
                    if resp.status_code == 429:
                        wait = 1 + attempt * 2
                        time.sleep(wait)
                        continue
                    err_body = ""
                    try:
                        err_body = resp.json()
                    except Exception:
                        err_body = resp.text
                    raise AIError(
                        f"OpenRouter API error {resp.status_code}: {err_body}",
                        status_code=resp.status_code,
                    )
            except AIError:
                raise
            except Exception as exc:
                last_error = exc
                if attempt < self.max_retries - 1:
                    time.sleep(1 + attempt * 2)
                    continue

        raise AIError(f"OpenRouter API failed after {self.max_retries} retries: {last_error}")

    def extract_content(self, response: dict[str, Any]) -> str:
        try:
            return response["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise AIError(
                f"Unexpected LLM response format: {str(response)[:800]}"
            ) from exc
