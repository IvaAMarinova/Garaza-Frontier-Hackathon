from typing import Dict, List, Any

from openai import AsyncOpenAI

from .config import OPENAI_API_KEY


class OpenAIClient:
    def __init__(self) -> None:
        self._client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    async def generate_text(self, *, model: str, messages: List[Dict[str, Any]]) -> str:
        """Request a full response from OpenAI and return the aggregated text."""
        response = await self._client.responses.create(model=model, input=messages, timeout=60)

        text = getattr(response, "output_text", "") or ""
        if text:
            return text

        # Fallback in case output_text isn't populated.
        for output in response.output:
            if output.type != "message":
                continue
            for content in output.content:
                if getattr(content, "type", None) == "output_text" and getattr(content, "text", ""):
                    return content.text

        return ""
