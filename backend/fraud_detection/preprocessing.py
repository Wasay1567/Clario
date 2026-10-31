from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import urlparse

URL_RE = re.compile(r"(?i)\b(?:https?://|www\.)[^\s<>]+")
PHONE_RE = re.compile(r"(?<!\d)(?:\+92|0092|03)\d[\s-]?\d{3}[\s-]?\d{4}(?!\d)")
OTP_RE = re.compile(r"(?i)\b(?:otp|pin|code|passcode|verification)\D{0,12}\d{4,8}\b|\b\d{4,8}\b")
CNIC_RE = re.compile(r"(?<!\d)\d{5}[-\s]?\d{7}[-\s]?\d(?!\d)")
SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "rb.gy", "cutt.ly", "is.gd", "goo.gl"}
URDU_RE = re.compile(r"[\u0600-\u06ff]")


@dataclass(frozen=True)
class ProcessedMessage:
    original: str
    normalized: str
    language: str
    urls: tuple[str, ...]
    domains: tuple[str, ...]
    phone_numbers: tuple[str, ...]
    otp_like_values: tuple[str, ...]
    redacted: str


def normalize_message(message: str) -> str:
    return re.sub(r"\s+", " ", message.strip())


def detect_language(message: str) -> str:
    if URDU_RE.search(message):
        return "urdu"
    roman_markers = re.search(
        r"(?i)\b(aur|apka|apna|aap|hai|hain|karain|karein|rakam|jama|bhejein|rabta|milay|kisi|dein|na)\b",
        message,
    )
    return "roman_urdu" if roman_markers else "english"


def extract_urls(message: str) -> tuple[str, ...]:
    return tuple(URL_RE.findall(message))


def domain_for_url(url: str) -> str:
    parsed = urlparse(url if "://" in url else f"https://{url}")
    return (parsed.hostname or "").lower().strip(".")


def process_message(message: str) -> ProcessedMessage:
    normalized = normalize_message(message)
    urls = extract_urls(normalized)
    domains = tuple(domain_for_url(url) for url in urls if domain_for_url(url))
    phones = tuple(PHONE_RE.findall(normalized))
    otp_values = tuple(OTP_RE.findall(normalized))
    redacted = CNIC_RE.sub("[CNIC_REDACTED]", normalized)
    redacted = PHONE_RE.sub("[PHONE_REDACTED]", redacted)
    redacted = re.sub(r"(?i)(otp|pin|passcode|password)\s*[:=]?\s*\d{4,8}", r"\1 [CODE_REDACTED]", redacted)
    return ProcessedMessage(
        original=message,
        normalized=normalized,
        language=detect_language(normalized),
        urls=urls,
        domains=domains,
        phone_numbers=phones,
        otp_like_values=otp_values,
        redacted=redacted,
    )


def is_shortener(domain: str) -> bool:
    return domain in SHORTENERS
