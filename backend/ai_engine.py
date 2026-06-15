import json
import os

import aiohttp

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama").lower()
LLM_MODEL = os.getenv("LLM_MODEL", "gemma3:1b")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

DEFAULT_MODELS = {
    "ollama": "gemma3:1b",
    "openai": "gpt-5.4-mini",
    "groq": "openai/gpt-oss-120b",
    "gemini": "gemini-3.5-flash",
}


def _model():
    return os.getenv("LLM_MODEL", DEFAULT_MODELS.get(LLM_PROVIDER, "gemma3:1b"))


def _clean_json(raw):
    clean = raw.strip().replace("```json", "").replace("```", "").strip()
    return json.loads(clean)


async def _ollama_generate(session, prompt):
    async with session.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={"model": _model(), "prompt": prompt, "stream": False},
    ) as resp:
        resp.raise_for_status()
        result = await resp.json()
        return result.get("response", "{}")


async def _openai_compatible_generate(session, prompt, base_url, api_key):
    async with session.post(
        f"{base_url}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": _model(),
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        },
    ) as resp:
        resp.raise_for_status()
        result = await resp.json()
        return result["choices"][0]["message"]["content"]


def _extract_openai_response_text(result):
    if result.get("output_text"):
        return result["output_text"]
    for item in result.get("output", []):
        for content in item.get("content", []):
            if content.get("text"):
                return content["text"]
    return "{}"


async def _openai_generate(session, prompt):
    async with session.post(
        f"{OPENAI_BASE_URL}/responses",
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": _model(),
            "input": prompt,
            "temperature": 0.2,
        },
    ) as resp:
        resp.raise_for_status()
        result = await resp.json()
        return _extract_openai_response_text(result)


async def _gemini_generate(session, prompt):
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{_model()}:generateContent?key={GEMINI_API_KEY}"
    )
    async with session.post(
        url,
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json",
            },
        },
    ) as resp:
        resp.raise_for_status()
        result = await resp.json()
        return result["candidates"][0]["content"]["parts"][0]["text"]


async def _generate(prompt):
    timeout = aiohttp.ClientTimeout(total=30)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        if LLM_PROVIDER == "openai":
            return await _openai_generate(session, prompt)
        if LLM_PROVIDER == "groq":
            return await _openai_compatible_generate(session, prompt, GROQ_BASE_URL, GROQ_API_KEY)
        if LLM_PROVIDER == "gemini":
            return await _gemini_generate(session, prompt)
        return await _ollama_generate(session, prompt)

async def ai_analyze(events, risk):
    # Build a clear prompt for the model
    event_list = "\n".join([
        f"- {e['type']} in zone {e['zone']} at {e['timestamp']}"
        for e in events
    ])

    prompt = f"""You are InfraGuard AI, a critical infrastructure security analyst.

EVENTS DETECTED:
{event_list}

RISK ASSESSMENT:
Score: {risk['score']}/100
Level: {risk['level']}
Factors: {', '.join(risk['factors'])}

Respond in this exact JSON format:
{{
    "summary": "one sentence describing what happened",
    "threat_assessment": "is this a real threat and why",
    "recommended_action": "specific steps the operator should take",
    "confidence": "High or Medium or Low"
}}

Respond with JSON only. No extra text."""

    try:
        raw = await _generate(prompt)
        return _clean_json(raw)

    except Exception as e:
        # Fallback if AI fails
        return {
            "summary": f"{len(events)} events detected across multiple zones",
            "threat_assessment": f"Risk level is {risk['level']} based on event patterns",
            "recommended_action": "Review events manually and dispatch unit if needed",
            "confidence": "Low"
        }
