package com.madadgar.app.sms

data class FraudVerdict(
    val label: Label,
    val confidence: Float,
    val reasons: List<String>,
    val sanitizedPreview: String
) {
    enum class Label {
        FRAUD, SAFE, NOT_SURE
    }
}

/**
 * High-performance on-device offline classifier for Pakistan-specific SMS scams.
 * Runs with 0ms latency and requires zero internet connection.
 */
object OfflineFraudDetector {

    fun analyze(sender: String, messageText: String): FraudVerdict {
        val lower = messageText.lowercase()
        val reasons = mutableListOf<String>()
        var fraudScore = 0f

        // Check 1: Fake BISP, Ehsaas, 8171, Cash Grants
        if (lower.contains("bisp") || lower.contains("ehsaas") || lower.contains("8171") ||
            lower.contains("benazir") || lower.contains("25000") || lower.contains("inami") ||
            lower.contains("jeeto pakistan") || lower.contains("lottery")
        ) {
            if (!sender.contains("8171") || lower.contains("03") || lower.contains("call") || lower.contains("whatsapp")) {
                reasons.add("جعلی بینظیر / احساس یا انعامی رقم کا جھوٹا دعویٰ (Fake BISP / Prize claim)")
                fraudScore += 0.55f
            }
        }

        // Check 2: Fake JazzCash / Easypaisa / Bank account freeze
        if ((lower.contains("block") || lower.contains("freeze") || lower.contains("suspend") || lower.contains("band")) &&
            (lower.contains("jazzcash") || lower.contains("easypaisa") || lower.contains("bank") || lower.contains("hbl"))
        ) {
            reasons.add("اکاؤنٹ بلاک کا خوف دلا کر جعل سازی (Account freeze scare tactic)")
            fraudScore += 0.50f
        }

        // Check 3: Solicitation of PIN, OTP, Password
        if (lower.contains("pin") || lower.contains("otp") || lower.contains("password") ||
            lower.contains("4-digit") || lower.contains("code share") || lower.contains("passcode")
        ) {
            reasons.add("خفیہ پن یا او ٹی پی کوڈ کا تقاضا (Suspicious request for secret PIN/OTP)")
            fraudScore += 0.55f
        }

        // Check 4: Unofficial external links (bit.ly, .xyz, apk)
        if (lower.contains("http://") || lower.contains("https://") || lower.contains("bit.ly") ||
            lower.contains(".xyz") || lower.contains("tinyurl") || lower.contains(".apk")
        ) {
            reasons.add("غیر محفوظ اور مشکوک ویب لنک (Suspicious external link)")
            fraudScore += 0.35f
        }

        // Check 5: Personal mobile phone number to call back (03xx)
        val phonePattern = Regex("""\b03[0-9]{2}[-\s]?[0-9]{7}\b""")
        if (phonePattern.containsMatchIn(messageText) && (lower.contains("call") || lower.contains("rabta") || lower.contains("whatsapp"))) {
            reasons.add("سرکاری محکمے کے بجائے نامعلوم موبائل نمبر پر رابطہ کرنے کی ہدایت")
            fraudScore += 0.40f
        }

        // Sanitize preview (mask numbers/CNIC)
        val sanitized = messageText
            .replace(Regex("""\b\d{5}[-\s]?\d{7}[-\s]?\d\b"""), "[CNIC_HIDDEN]")
            .replace(Regex("""\b(?:\d{4}[-\s]?){3}\d{4}\b"""), "[CARD_HIDDEN]")

        val label = when {
            fraudScore >= 0.50f -> FraudVerdict.Label.FRAUD
            fraudScore >= 0.25f -> FraudVerdict.Label.NOT_SURE
            else -> FraudVerdict.Label.SAFE
        }

        val confidence = when (label) {
            FraudVerdict.Label.FRAUD -> minOf(0.99f, 0.70f + fraudScore * 0.25f)
            FraudVerdict.Label.NOT_SURE -> 0.65f
            FraudVerdict.Label.SAFE -> 0.90f
        }

        val finalReasons = if (reasons.isNotEmpty()) reasons else listOf("عام معلوماتی پیغام، کوئی خطرہ نہیں ملا")

        return FraudVerdict(
            label = label,
            confidence = confidence,
            reasons = finalReasons,
            sanitizedPreview = sanitized
        )
    }
}
