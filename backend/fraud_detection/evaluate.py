from __future__ import annotations

import argparse
from pathlib import Path

from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

from train import build_pipeline, load_dataset


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate the SMS fraud baseline")
    parser.add_argument("--data", type=Path, default=Path(__file__).parent / "data" / "messages.csv")
    args = parser.parse_args()
    frame = load_dataset(args.data)
    train, test = train_test_split(frame, test_size=0.25, random_state=42, stratify=frame["label"])
    pipeline = build_pipeline().fit(train["message"], train["label"])
    predictions = pipeline.predict(test["message"])
    print(classification_report(test["label"], predictions, zero_division=0))


if __name__ == "__main__":
    main()
