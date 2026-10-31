from __future__ import annotations

from .classifier import FraudClassifier
from .preprocessing import ProcessedMessage
from .rule_engine import RuleMatch
from .schemas import Classification

MODEL_VERSION = "1.0.0"
FRAUD_THRESHOLD = 0.80
SAFE_THRESHOLD = 0.30


def _explanation(language: str, classification: Classification, matches: list[RuleMatch]) -> str:
    has_credential = any(match.rule_id == "otp_request" for match in matches)
    has_financial = any(match.rule_id in {"financial_request", "prize_or_grant"} for match in matches)
    if language == "urdu":
        if has_credential:
            return "یہ پیغام حساس OTP یا PIN مانگ رہا ہے۔ ایسی معلومات کسی کے ساتھ شیئر نہ کریں۔"
        if has_financial:
            return "یہ پیغام مالی فائدے یا رقم کا دعویٰ کر کے آپ سے کارروائی مانگ رہا ہے۔ آزادانہ طور پر تصدیق کریں۔"
        return "اس پیغام میں کچھ مشکوک نشانیاں ملی ہیں۔ بھیجنے والے کی آزادانہ طور پر تصدیق کریں۔"
    if language == "roman_urdu":
        if has_credential:
            return "Yeh message OTP ya PIN maang raha hai. Aisi maloomat kisi ke sath share na karein."
        if has_financial:
            return "Yeh message paison ka dawa karke aap se action maang raha hai. Khud tasdeeq karein."
        return "Is message mein kuch mashkook nishaniyan hain. Bhejne wale ki khud tasdeeq karein."
    if classification == Classification.SAFE:
        return "No significant risk was detected, but this does not guarantee that the message is genuine."
    if has_credential:
        return "This message asks for sensitive credentials such as an OTP or PIN, which is a common fraud technique."
    if has_financial:
        return "This message uses a financial claim or fee request that should be independently verified."
    return "This message contains suspicious indicators. Verify it through an official channel."


def decide(processed: ProcessedMessage, matches: list[RuleMatch], classifier: FraudClassifier) -> tuple[Classification, float, str, str, list[str]]:
    model_probability = classifier.predict_probability(processed.normalized)
    rule_score = min(0.95, sum(match.severity for match in matches) / 14)
    if model_probability is None:
        probability = rule_score
        classification = Classification.UNDER_REVIEW
    else:
        probability = min(0.99, max(0.01, 0.65 * model_probability + 0.35 * rule_score))
        if probability >= FRAUD_THRESHOLD:
            classification = Classification.FRAUD
        elif probability <= SAFE_THRESHOLD and not matches:
            classification = Classification.SAFE
        else:
            classification = Classification.UNDER_REVIEW
    risk_level = "high" if probability >= 0.8 or sum(match.severity for match in matches) >= 8 else "medium" if matches else "low"
    factors = [match.rule_id for match in matches]
    explanation = _explanation(processed.language, classification, matches)
    actions = ["Do not share OTPs, PINs, passwords, or verification codes.", "Do not open suspicious links or pay processing fees.", "Verify the claim using the official app, website, or phone number."] if matches else ["Do not rely on this result as proof that the message is genuine.", "Contact the organization through an official channel if unsure."]
    return classification, probability, risk_level, explanation, actions
