from __future__ import annotations

import re
from dataclasses import dataclass

from .preprocessing import ProcessedMessage, is_shortener


@dataclass(frozen=True)
class RuleMatch:
    rule_id: str
    category: str
    description: str
    severity: int
    evidence: str


RULES = (
    ("otp_request", "credential_theft", "asks for an OTP, PIN, password, or code", 5, r"(?i)(share|send|forward|tell|enter|provide|bhej|bataye|شیئر|بھیج|بتائیں).{0,50}(otp|pin|password|passcode|code|او ٹی پی|پن)"),
    ("urgency_threat", "urgency", "uses a blocking, expiry, or immediate-action threat", 3, r"(?i)(blocked|block|expire|suspend|freeze|final warning|immediately|urgent|within \d+|band|khatam|foran|jaldi|بلاک|معطل|فوری|آخری انتباہ)"),
    ("financial_request", "financial_fraud", "requests an advance fee, payment, or refund verification", 4, r"(?i)(processing fee|advance payment|pay.*fee|refund.*verify|verification fee|prize.*fee|charges|rakam.*jama|fees|فیس|رقم جمع|واپسی.*تصدیق)"),
    ("impersonation", "impersonation", "mentions a wallet, bank, telecom, or government identity", 2, r"(?i)(jazzcash|easypaisa|hbl|meezan|ubl|mcb|bank|bisp|ehsaas|8171|tcs|leopard|ptcl|جازکیش|ایزی پیسہ|بینک|احساس|بے نظیر)"),
    ("prize_or_grant", "prize_or_grant", "claims a prize, lottery, grant, or assistance payment", 3, r"(?i)(lottery|winner|prize|inami|inaam|cash grant|grant|bisp|ehsaas|25000|انعام|لاٹری|وظیفہ|امداد)"),
    ("suspicious_url", "suspicious_link", "contains a shortened or unfamiliar link", 2, r"(?i)(https?://|www\.)"),
    ("callback_request", "impersonation", "directs the user to contact an unknown mobile number", 2, r"(?i)(call|whatsapp|rabta|contact|کال|رابطہ|واٹس ایپ)"),
)


def evaluate_rules(message: ProcessedMessage) -> list[RuleMatch]:
    text = message.normalized
    matches: list[RuleMatch] = []
    for rule_id, category, description, severity, pattern in RULES:
        if rule_id == "suspicious_url":
            if not message.urls:
                continue
            suspicious = any(is_shortener(domain) or not any(domain.endswith(suffix) for suffix in ("jazzcash.com.pk", "easypaisa.com.pk", "hbl.com", "meezanbank.com")) for domain in message.domains)
            if not suspicious:
                continue
            evidence = message.domains[0]
        elif rule_id == "callback_request":
            if not (message.phone_numbers and re.search(pattern, text)):
                continue
            evidence = message.phone_numbers[0]
        else:
            match = re.search(pattern, text)
            if not match:
                continue
            if rule_id == "otp_request" and re.search(
                r"(?i)\b(never|do not|don't|kabhi nahi|نہ|مت)\b.{0,30}\b(share|send|forward|شیئر|بھیج)",
                text,
            ):
                continue
            evidence = match.group(0)[:100]
        matches.append(RuleMatch(rule_id, category, description, severity, evidence))
    return matches
