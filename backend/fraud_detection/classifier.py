from __future__ import annotations

from pathlib import Path
from typing import Optional

import joblib


class FraudClassifier:
    def __init__(self, model_path: Path):
        self.model_path = model_path
        self.pipeline = None
        if model_path.exists():
            self.pipeline = joblib.load(model_path)

    @property
    def available(self) -> bool:
        return self.pipeline is not None

    def predict_probability(self, text: str) -> Optional[float]:
        if self.pipeline is None:
            return None
        probabilities = self.pipeline.predict_proba([text])[0]
        classes = list(self.pipeline.classes_)
        fraud_index = classes.index("fraud")
        return float(probabilities[fraud_index])
