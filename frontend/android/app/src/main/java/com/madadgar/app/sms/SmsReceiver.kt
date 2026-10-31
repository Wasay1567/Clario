package com.madadgar.app.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.madadgar.app.MadadgarApplication
import com.madadgar.app.data.local.entity.MessageCheckEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * BroadcastReceiver for incoming SMS.
 * Runs the offline fraud detector, saves the verdict, and shows a verdict notification.
 */
class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            if (messages.isNullOrEmpty()) return

            val fullText = StringBuilder()
            val sender = messages[0].displayOriginatingAddress ?: "Unknown"

            for (msg in messages) {
                fullText.append(msg.messageBody)
            }

            val text = fullText.toString()
            val verdict = OfflineFraudDetector.analyze(sender, text)

            // Save to offline Room database, then notify the user
            val app = context.applicationContext as MadadgarApplication
            val pending = goAsync()
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val id = app.repository.saveMessageCheck(
                        MessageCheckEntity(
                            sender = sender,
                            sanitizedText = verdict.sanitizedPreview,
                            label = verdict.label.name,
                            confidence = verdict.confidence,
                            reasons = verdict.reasons.joinToString(" \u2022 "),
                            userDecision = null,
                            timestamp = System.currentTimeMillis()
                        )
                    )
                    SmsNotifier.notify(context, id, sender, verdict)
                } finally {
                    pending.finish()
                }
            }
        }
    }
}