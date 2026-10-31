from pathlib import Path

from fastapi.testclient import TestClient

from fraud_detection.main import app
from fraud_detection.preprocessing import process_message
from fraud_detection.rule_engine import evaluate_rules

client = TestClient(app)


def test_otp_theft_is_review_without_model():
    response = client.post("/api/v1/analyze", json={"message": "Your JazzCash refund is pending. Share your OTP immediately."})
    assert response.status_code == 200
    body = response.json()
    assert body["classification"] == "under_review"
    assert "otp_request" in body["risk_factors"]


def test_legitimate_otp_is_not_credential_request():
    processed = process_message("Your OTP is 2468. Never share this code with anyone.")
    assert "otp_request" not in [match.rule_id for match in evaluate_rules(processed)]


def test_urdu_and_roman_urdu_detection():
    assert process_message("اپنا پن کسی کو نہ دیں").language == "urdu"
    assert process_message("Apna PIN kisi ko na dein").language == "roman_urdu"


def test_empty_and_long_input_validation():
    assert client.post("/api/v1/analyze", json={"message": ""}).status_code == 422
    assert client.post("/api/v1/analyze", json={"message": "x" * 5001}).status_code == 422


def test_health_and_model_info():
    assert client.get("/health").json() == {"status": "ok"}
    info = client.get("/api/v1/model-info").json()
    assert info["model_available"] is False
