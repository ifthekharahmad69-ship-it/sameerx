import os
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv(override=True)

# We load the Groq key (configured via GROQ_API_KEY or XAI_API_KEY)
GROQ_API_KEY = (os.environ.get("GROQ_API_KEY") or os.environ.get("XAI_API_KEY") or "").strip()
if GROQ_API_KEY.startswith("agsk_"):
    GROQ_API_KEY = GROQ_API_KEY[1:]

client = AsyncOpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)

MODEL = os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b")

async def extract_case_facts(raw_text: str, case_type: str) -> dict:
    """Extract case facts from legal document text using Groq."""
    system_instruction = (
        "You are a legal document parser for Indian courts. Extract facts from FIR or "
        "legal document text. Return only valid JSON, no markdown, no explanation."
    )
    user_prompt = (
        f"Extract the following from this {case_type} document text and return as JSON:\n"
        "{\n"
        "  \"crime_type\": \"...\",\n"
        "  \"ipc_sections\": [\"...\"],\n"
        "  \"accused_name\": \"...\",\n"
        "  \"accused_address\": \"...\",\n"
        "  \"arrest_date\": \"...\",\n"
        "  \"arrest_time\": \"...\",\n"
        "  \"police_station\": \"...\",\n"
        "  \"place_of_offence\": \"...\",\n"
        "  \"value_stolen_or_loss\": \"...\",\n"
        "  \"complainant_name\": \"...\",\n"
        "  \"fo_number\": \"...\"\n"
        "}\n"
        f"TEXT: {raw_text}"
    )

    candidate_models = [MODEL, "groq/compound", "openai/gpt-oss-20b", "openai/gpt-oss-120b"]
    seen = set()
    models_to_try = [m for m in candidate_models if not (m in seen or seen.add(m))]

    for m in models_to_try:
        try:
            response = await client.chat.completions.create(
                model=m,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.0,
                max_tokens=800
            )
            response_text = response.choices[0].message.content.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            return json.loads(response_text.strip())
        except Exception as e:
            print(f"Model {m} failed in extract_case_facts: {e}")
            continue

    return {
        "crime_type": "Offence under investigation",
        "ipc_sections": [],
        "accused_name": "Accused",
        "fo_number": "N/A"
    }

async def draft_bail_application(facts: dict) -> str:
    """Draft a formal bail application using case facts via Groq."""
    system_instruction = "You are a senior Indian criminal lawyer drafting court documents."
    user_prompt = (
        f"Draft a complete formal bail application for the Sessions Court using these case facts: {facts}. "
        "Use standard Indian legal language. Include: court heading, applicant details, IPC sections, "
        "grounds for bail (no prior conviction, roots in community, cooperation with investigation), "
        "prayer clause, and verification. Output as plain text ready to print."
    )
    
    candidate_models = [MODEL, "groq/compound", "openai/gpt-oss-20b", "openai/gpt-oss-120b"]
    for m in candidate_models:
        try:
            response = await client.chat.completions.create(
                model=m,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Model {m} failed in draft_bail_application: {e}")
            continue
    return "Application for Bail before the Hon'ble Sessions Court. (Draft generation unavailable)."

async def draft_client_update(facts: dict, case_status: str) -> str:
    """Draft a short, simple update for the client via Groq."""
    system_instruction = (
        "You are a helpful legal assistant writing plain-language updates for clients who are not lawyers."
    )
    user_prompt = (
        f"Write a short, simple, reassuring case update for the client based on: {facts}. "
        f"Status: {case_status}. Use simple language, no legal jargon, max 5 sentences."
    )
    
    candidate_models = [MODEL, "groq/compound", "openai/gpt-oss-20b", "openai/gpt-oss-120b"]
    for m in candidate_models:
        try:
            response = await client.chat.completions.create(
                model=m,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=400
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Model {m} failed in draft_client_update: {e}")
            continue
    return f"Your case is active. Status: {case_status}. We are following up with the registry and will update you shortly."
