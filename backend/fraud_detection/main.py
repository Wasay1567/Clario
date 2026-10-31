from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .classifier import FraudClassifier
from .decision_engine import MODEL_VERSION, decide
from .preprocessing import process_message
from .rule_engine import evaluate_rules
from .schemas import AnalyzeRequest, AnalyzeResponse, ModelInfo

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
BASE_DIR = Path(__file__).resolve().parent
classifier = FraudClassifier(BASE_DIR / "models" / "fraud_model.joblib")
app = FastAPI(title="Madadgar SMS Fraud Detection API", version=MODEL_VERSION)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/v1/model-info", response_model=ModelInfo)
def model_info() -> ModelInfo:
    return ModelInfo(model_available=classifier.available, model_version=MODEL_VERSION, classifier="logistic_regression_tfidf" if classifier.available else "unavailable", thresholds={"fraud": 0.80, "safe": 0.30})


@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    processed = process_message(request.message)
    matches = evaluate_rules(processed)
    classification, probability, risk_level, explanation, actions = decide(processed, matches, classifier)
    return AnalyzeResponse(classification=classification, fraud_probability=round(probability, 4), risk_level=risk_level, language=processed.language, risk_factors=[match.rule_id for match in matches], explanation=explanation, recommended_action=actions, model_version=MODEL_VERSION)


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled fraud API error: %s", type(exc).__name__)
    return JSONResponse(status_code=500, content={"detail": "The fraud analysis service could not process the request."})
