from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.linear_model import LogisticRegression

REQUIRED_COLUMNS = {"message", "label", "language", "category"}


def build_pipeline() -> Pipeline:
    features = FeatureUnion([
        ("word", TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)),
        ("char", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=1, sublinear_tf=True)),
    ])
    return Pipeline([("features", features), ("classifier", LogisticRegression(max_iter=1000, random_state=42))])


def load_dataset(path: Path) -> pd.DataFrame:
    frame = pd.read_csv(path).drop_duplicates(subset=["message"])
    missing = REQUIRED_COLUMNS - set(frame.columns)
    if missing:
        raise ValueError(f"Dataset is missing columns: {sorted(missing)}")
    frame = frame.dropna(subset=["message", "label"])
    frame["label"] = frame["label"].str.strip().str.lower()
    if not set(frame["label"]).issubset({"fraud", "safe"}):
        raise ValueError("label must be fraud or safe")
    if frame["label"].nunique() < 2:
        raise ValueError("dataset must contain both fraud and safe labels")
    return frame


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the SMS fraud baseline")
    parser.add_argument("--data", type=Path, default=Path(__file__).parent / "data" / "messages.csv")
    parser.add_argument("--output", type=Path, default=Path(__file__).parent / "models" / "fraud_model.joblib")
    args = parser.parse_args()
    frame = load_dataset(args.data)
    pipeline = build_pipeline()
    pipeline.fit(frame["message"], frame["label"])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, args.output)
    print(f"trained on {len(frame)} unique synthetic/labelled messages")
    print(f"saved model to {args.output}")


if __name__ == "__main__":
    main()
