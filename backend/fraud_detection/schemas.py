from __future__ import annotations

from enum import Enum
from pydantic import BaseModel, Field, field_validator


class Classification(str, Enum):
    FRAUD = "fraud"
    SAFE = "safe"
    UNDER_REVIEW = "under_review"


class AnalyzeRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)
    language: str = Field(default="auto", max_length=20)

    @field_validator("message")
    @classmethod
    def non_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("message must not be blank")
        return value


class AnalyzeResponse(BaseModel):
    classification: Classification
    fraud_probability: float = Field(ge=0, le=1)
    risk_level: str
    language: str
    risk_factors: list[str]
    explanation: str
    recommended_action: list[str]
    model_version: str


class ModelInfo(BaseModel):
    model_available: bool
    model_version: str
    classifier: str
    thresholds: dict[str, float]
