package com.Clario.app.sms

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import androidx.core.app.NotificationCompat
import com.Clario.app.MainActivity
import com.Clario.app.ClarioApplication
import com.Clario.app.data.local.entity.MessageCheckEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * BroadcastReceiver for incoming SMS.
 * Automatically runs the offline fraud detector and raises urgent alerts for scams.
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

            // Save to offline Room database
            val app = context.applicationContext as ClarioApplication
            CoroutineScope(Dispatchers.IO).launch {
                val entity = MessageCheckEntity(
                    sender = sender,
                    sanitizedText = verdict.sanitizedPreview,
                    label = verdict.label.name,
                    confidence = verdict.confidence,
                    reasons = verdict.reasons.joinToString(" • "),
                    userDecision = null,
                    timestamp = System.currentTimeMillis()
                )
                app.repository.saveMessageCheck(entity)
            }

            // If FRAUD detected, trigger immediate prominent alert
            if (verdict.label == FraudVerdict.Label.FRAUD) {
                showFraudNotification(context, sender, verdict)
            }
        }
    }

    private fun showFraudNotification(context: Context, sender: String, verdict: FraudVerdict) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("OPEN_FRAUD_TAB", true)
        }

        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(context, ClarioApplication.CHANNEL_FRAUD_ALERTS)
            .setContentTitle("⚠️ فراڈ کا خطرہ! (Scam Alert)")
            .setContentText("یہ میسج مشکوک ہے: ${verdict.reasons.firstOrNull() ?: "فراڈ کا شبہ"}")
            .setStyle(NotificationCompat.BigTextStyle().bigText("فرام: $sender\nیہ میسج دھوکہ دہی پر مبنی ہے۔ کوئی بھی لنک نہ کھولیں اور PIN یا OTP مت دیں۔"))
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(System.currentTimeMillis().toInt(), notification)
    }
}
