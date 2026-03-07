# AI Provider Adapter
# Supports: Emergent, OpenAI, Anthropic, Google, Ollama

import os
import httpx
import uuid


def get_ai_provider():
    """Get the configured AI provider"""
    return os.environ.get("AI_PROVIDER", "emergent")


def get_ai_api_key():
    """Get the configured API key at runtime"""
    return os.environ.get("AI_API_KEY", os.environ.get("EMERGENT_LLM_KEY", ""))


async def get_ai_response(messages: list, system_prompt: str) -> str:
    """
    Get AI response using configured provider.
    Returns the assistant's response text.
    """
    provider = get_ai_provider()
    
    if provider == "emergent":
        return await _emergent_chat(messages, system_prompt)
    elif provider == "openai":
        return await _openai_chat(messages, system_prompt)
    elif provider == "anthropic":
        return await _anthropic_chat(messages, system_prompt)
    elif provider == "google":
        return await _google_chat(messages, system_prompt)
    elif provider == "ollama":
        return await _ollama_chat(messages, system_prompt)
    else:
        return await _emergent_chat(messages, system_prompt)


async def _emergent_chat(messages: list, system_prompt: str) -> str:
    """Use Emergent Universal Key (GPT-5.2)"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = get_ai_api_key()
        
        # Create a unique session ID for this conversation
        session_id = str(uuid.uuid4())
        
        # Initialize chat with system prompt
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_prompt
        )
        
        # Use GPT-5.2 via Emergent
        chat.with_model("openai", "gpt-5.2")
        
        # Replay all messages to build context, get response from the last user message
        for msg in messages:
            if msg["role"] == "user":
                user_message = UserMessage(text=msg["content"])
                response = await chat.send_message(user_message)
        
        return response
    except Exception as e:
        print(f"Emergent API error: {e}")
        raise


async def _openai_chat(messages: list, system_prompt: str) -> str:
    """Use OpenAI directly"""
    api_key = get_ai_api_key()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4-turbo-preview",
                "messages": [{"role": "system", "content": system_prompt}] + messages,
                "max_tokens": 500,
                "temperature": 0.7
            },
            timeout=60.0
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]


async def _anthropic_chat(messages: list, system_prompt: str) -> str:
    """Use Anthropic Claude"""
    api_key = get_ai_api_key()
    async with httpx.AsyncClient() as client:
        # Convert to Anthropic format
        anthropic_messages = []
        for msg in messages:
            anthropic_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            },
            json={
                "model": "claude-3-sonnet-20240229",
                "max_tokens": 500,
                "system": system_prompt,
                "messages": anthropic_messages
            },
            timeout=60.0
        )
        response.raise_for_status()
        return response.json()["content"][0]["text"]


async def _google_chat(messages: list, system_prompt: str) -> str:
    """Use Google Gemini"""
    api_key = get_ai_api_key()
    async with httpx.AsyncClient() as client:
        # Convert to Gemini format
        contents = []
        
        # Add system prompt as first user message context
        full_prompt = f"{system_prompt}\n\nConversation:\n"
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}]
            })
        
        response = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": contents,
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "generationConfig": {
                    "maxOutputTokens": 500,
                    "temperature": 0.7
                }
            },
            timeout=60.0
        )
        response.raise_for_status()
        return response.json()["candidates"][0]["content"]["parts"][0]["text"]


async def _ollama_chat(messages: list, system_prompt: str) -> str:
    """Use local Ollama"""
    async with httpx.AsyncClient() as client:
        # Format messages for Ollama
        ollama_messages = [{"role": "system", "content": system_prompt}]
        ollama_messages.extend(messages)
        
        response = await client.post(
            "http://localhost:11434/api/chat",
            json={
                "model": "llama3.1",
                "messages": ollama_messages,
                "stream": False,
                "options": {
                    "num_predict": 500,
                    "temperature": 0.7
                }
            },
            timeout=120.0  # Ollama can be slower
        )
        response.raise_for_status()
        return response.json()["message"]["content"]


def get_provider_info() -> dict:
    """Return info about current AI provider"""
    provider = get_ai_provider()
    api_key = get_ai_api_key()
    return {
        "provider": provider,
        "configured": bool(api_key) or provider == "ollama"
    }
