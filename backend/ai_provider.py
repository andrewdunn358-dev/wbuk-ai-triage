# AI Provider Adapter
# Supports: Emergent, OpenAI, Anthropic, Google, Ollama

import os
import httpx
from typing import AsyncGenerator

AI_PROVIDER = os.environ.get("AI_PROVIDER", "emergent")
AI_API_KEY = os.environ.get("AI_API_KEY", os.environ.get("EMERGENT_LLM_KEY", ""))


async def get_ai_response(messages: list, system_prompt: str) -> str:
    """
    Get AI response using configured provider.
    Returns the assistant's response text.
    """
    
    if AI_PROVIDER == "emergent":
        return await _emergent_chat(messages, system_prompt)
    elif AI_PROVIDER == "openai":
        return await _openai_chat(messages, system_prompt)
    elif AI_PROVIDER == "anthropic":
        return await _anthropic_chat(messages, system_prompt)
    elif AI_PROVIDER == "google":
        return await _google_chat(messages, system_prompt)
    elif AI_PROVIDER == "ollama":
        return await _ollama_chat(messages, system_prompt)
    else:
        return await _emergent_chat(messages, system_prompt)


async def _emergent_chat(messages: list, system_prompt: str) -> str:
    """Use Emergent Universal Key (GPT-5.2)"""
    try:
        from emergentintegrations.llm.chat import chat, UserMessage, SystemMessage, AssistantMessage
        
        # Convert messages to Emergent format
        emergent_messages = [SystemMessage(content=system_prompt)]
        
        for msg in messages:
            if msg["role"] == "user":
                emergent_messages.append(UserMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                emergent_messages.append(AssistantMessage(content=msg["content"]))
        
        response = await chat(
            api_key=AI_API_KEY,
            messages=emergent_messages
        )
        
        return response.message.content
    except Exception as e:
        print(f"Emergent API error: {e}")
        raise


async def _openai_chat(messages: list, system_prompt: str) -> str:
    """Use OpenAI directly"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {AI_API_KEY}",
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
                "x-api-key": AI_API_KEY,
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
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={AI_API_KEY}",
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
    return {
        "provider": AI_PROVIDER,
        "configured": bool(AI_API_KEY) or AI_PROVIDER == "ollama"
    }
