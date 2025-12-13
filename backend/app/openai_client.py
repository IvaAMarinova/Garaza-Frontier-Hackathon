import json
from typing import Any, Dict, List, Optional

from openai import AsyncOpenAI
from openai.types.responses import Response as OpenAIResponse

from .config import OPENAI_API_KEY


class OpenAIClient:
    def __init__(self) -> None:
        self._client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    async def generate_text(
        self,
        *,
        model: str,
        messages: List[Dict[str, Any]],
        temperature: Optional[float] = None,
        max_output_tokens: Optional[int] = None,
    ) -> str:
        """Request a response from OpenAI and return the aggregated text output."""
        response = await self._create_response(
            model=model,
            messages=messages,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        )
        return self._extract_plain_text(response)

    async def generate_json(
        self,
        *,
        model: str,
        messages: List[Dict[str, Any]],
        temperature: float = 0.0,
        max_output_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Call OpenAI and parse the response body as JSON."""
        response = await self._create_response(
            model=model,
            messages=messages,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        )
        raw_text = self._extract_plain_text(response)
        try:
            return self._coerce_json(raw_text)
        except ValueError:
            repaired = None
            if max_output_tokens is not None and self._was_cut_off(response):
                repaired = self._repair_cutoff_json(raw_text)
            if repaired is not None:
                return repaired
            raise

    @staticmethod
    def _coerce_json(raw: str) -> Dict[str, Any]:
        """Best-effort JSON parsing with guardrails for noisy model outputs."""
        if not raw:
            return {}
        parsed = OpenAIClient._try_parse_json(raw)
        if parsed is not None:
            return parsed
        raise ValueError("OpenAI response was not valid JSON")

    @staticmethod
    def _try_parse_json(raw: str) -> Optional[Dict[str, Any]]:
        if not raw:
            return None
        attempts = [raw]
        stripped = raw.strip()
        if stripped is not raw:
            attempts.append(stripped)
        start = stripped.find("{")
        end = stripped.rfind("}")
        if start != -1 and end != -1 and end > start:
            attempts.append(stripped[start : end + 1])
        for candidate in attempts:
            try:
                parsed = json.loads(candidate)
            except json.JSONDecodeError:
                continue
            if isinstance(parsed, dict):
                return parsed
        return None

    def _repair_cutoff_json(self, raw: str) -> Optional[Dict[str, Any]]:
        """Attempt to recover truncated JSON produced due to max token cutoffs."""
        snippet = raw.strip()
        start = snippet.find("{")
        if start == -1:
            return None
        balanced = self._balance_json(snippet[start:])
        if not balanced:
            return None
        return self._try_parse_json(balanced)

    @staticmethod
    def _balance_json(raw: str) -> Optional[str]:
        """Balance braces/brackets and close unterminated strings."""
        if not raw:
            return None
        chars: List[str] = []
        stack: List[str] = []
        in_string = False
        escape = False
        for ch in raw:
            chars.append(ch)
            if in_string:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == '"':
                    in_string = False
                continue
            if ch == '"':
                in_string = True
            elif ch == "{":
                stack.append("}")
            elif ch == "[":
                stack.append("]")
            elif ch in {"}", "]"}:
                if stack and stack[-1] == ch:
                    stack.pop()
                else:
                    return None
        if in_string:
            chars.append('"')
        while stack:
            OpenAIClient._trim_trailing_comma(chars)
            chars.append(stack.pop())
        return "".join(chars)

    @staticmethod
    def _trim_trailing_comma(chars: List[str]) -> None:
        idx = len(chars) - 1
        while idx >= 0 and chars[idx].isspace():
            idx -= 1
        if idx >= 0 and chars[idx] == ",":
            del chars[idx]

    async def _create_response(
        self,
        *,
        model: str,
        messages: List[Dict[str, Any]],
        temperature: Optional[float],
        max_output_tokens: Optional[int],
    ) -> OpenAIResponse:
        extra: Dict[str, Any] = {"timeout": 60}
        if temperature is not None:
            extra["temperature"] = temperature
        if max_output_tokens is not None:
            extra["max_output_tokens"] = max_output_tokens
        return await self._client.responses.create(model=model, input=messages, **extra)

    @staticmethod
    def _was_cut_off(response: OpenAIResponse) -> bool:
        details = getattr(response, "incomplete_details", None)
        if not details:
            return False
        return getattr(details, "reason", None) == "max_output_tokens"

    @staticmethod
    def _extract_plain_text(response: Any) -> str:
        text = getattr(response, "output_text", "") or ""
        if text:
            return text

        for output in getattr(response, "output", []):
            if getattr(output, "type", None) != "message":
                continue
            for content in getattr(output, "content", []):
                if getattr(content, "type", None) == "output_text" and getattr(content, "text", ""):
                    return content.text
        return ""
