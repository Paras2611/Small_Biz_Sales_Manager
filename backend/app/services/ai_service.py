import json
import logging
from typing import Dict, Any, List
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


def generate_fallback_priority(lead_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Deterministic fallback for lead prioritisation when AI API is unavailable."""
    val = float(lead_dict.get("estimated_value") or 0)
    score = int(lead_dict.get("score") or 0)
    source = lead_dict.get("source", "Unknown")

    if val >= 100000 or score >= 75:
        priority = "High"
        evidence = [
            f"Significant commercial value of ₹{val:,.2f}",
            f"High qualification score of {score}/100",
            f"Qualified source channel: {source}"
        ]
        next_action = "Schedule executive solution demo and proposal presentation."
    elif val >= 40000 or score >= 50:
        priority = "Medium"
        evidence = [
            f"Moderate budget allocation of ₹{val:,.2f}",
            f"Moderate engagement score of {score}/100",
            f"Originating channel: {source}"
        ]
        next_action = "Conduct technical scoping call to clarify feature requirements."
    else:
        priority = "Low"
        evidence = [
            f"Entry-level estimated deal size of ₹{val:,.2f}",
            f"Initial interest stage with score {score}/100",
            f"Inbound inquiry via {source}"
        ]
        next_action = "Send product catalog overview and follow up in 5 business days."

    return {
        "priority": priority,
        "evidence": evidence,
        "next_action": next_action,
        "is_ai_generated": False
    }


def generate_fallback_summary(record_dict: Dict[str, Any], entity_type: str) -> Dict[str, Any]:
    """Concise 5-line summary adhering to PRD guardrails (missing fields stated as 'not available')."""
    stage = record_dict.get("stage") or record_dict.get("status") or "not available"
    val = f"₹{float(record_dict.get('amount') or record_dict.get('estimated_value') or 0):,.2f}"
    latest_interaction = record_dict.get("latest_interaction") or "not available"
    blocker = record_dict.get("lost_reason") or "No blocker documented"
    next_action = record_dict.get("next_action") or "Follow-up scheduling pending"

    points = [
        f"1. Current Pipeline Stage: {stage}",
        f"2. Commercial Value: {val}",
        f"3. Most Recent Interaction: {latest_interaction}",
        f"4. Documented Blocker: {blocker}",
        f"5. Next Scheduled Action: {next_action}"
    ]
    return {
        "summary": "\n".join(points),
        "points": points,
        "is_ai_generated": False
    }


def generate_fallback_next_action(context_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Generates next best action and pre-fills an editable draft message."""
    stage = context_dict.get("stage", "Prospecting")
    customer_name = context_dict.get("customer_name", "Valued Client")
    
    if stage in ["Proposal", "Negotiation"]:
        rec = "Send quotation follow-up and schedule executive closing call."
        rationale = "Deal is in commercial discussion; rapid response prevents decision stalling."
        msg = f"Hi {customer_name}, following up on our proposal. Do you have any questions regarding the pricing or deployment timeline? We'd be glad to arrange a quick walkthrough."
    else:
        rec = "Confirm technical fit and business decision timeline."
        rationale = "Establishing clear budget and timeline criteria accelerates qualification."
        msg = f"Hi {customer_name}, thank you for your continued interest. Could we connect briefly this week to review your target implementation timeline?"

    return {
        "recommended_action": rec,
        "rationale": rationale,
        "suggested_message": msg,
        "is_ai_generated": False
    }


async def call_ai_model(prompt: str) -> str:
    """Invokes external AI API with timeout and error capture."""
    if not settings.AI_API_KEY or settings.AI_API_KEY == "demo-mock-key":
        raise ValueError("AI_API_KEY not configured, using fallback.")
    
    url = f"{settings.AI_API_BASE_URL}/models/{settings.AI_MODEL}:generateContent?key={settings.AI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 300}
    }
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
