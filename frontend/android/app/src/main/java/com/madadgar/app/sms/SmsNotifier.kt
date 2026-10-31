package com.madadgar.app.sms

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.madadgar.app.MadadgarApplication
import com.madadgar.app.MainActivity

/**
 * Shows one notification per checked SMS, colour/priority matched to the verdict:
 *  FRAUD    -> red, heads-up, Keep / Delete buttons
 *  NOT_SURE -> yellow, normal priority, Keep / Delete buttons
 *  SAFE     -> green, quiet, no buttons
 *
 * Privacy: the message body is never put in the notification (it can show on a locked screen).
 * Only the sender and the plain-language reason are shown.
 */
object SmsNotifier {

    const val CHANNEL_NOT_SURE = "madadgar_not_sure_alerts"
    const val CHANNEL_SAFE = "madadgar_safe_messages"

    const val EXTRA_OPEN_FRAUD_TAB = "OPEN_FRAUD_TAB" // same key MainActivity already expects

    fun notify(context: Context, checkId: Long, sender: String, verdict: FraudVerdict) {
        val manager = NotificationManagerCompat.from(context)
        // Android 13+: if the user denied POST_NOTIFICATIONS this is false, so we skip quietly.
        if (!manager.areNotificationsEnabled()) return

        ensureChannels(context)

        val content = contentFor(verdict.label, sender, verdict.reasons.firstOrNull())
        val notificationId = checkId.toInt()

        val builder = NotificationCompat.Builder(context, content.channelId)
            .setSmallIcon(content.icon)
            .setContentTitle(content.title)
            .setContentText(content.shortText)
            .setStyle(NotificationCompat.BigTextStyle().bigText(content.longText))
            .setPriority(content.priority)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setColor(content.color)
            .setAutoCancel(true)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setPublicVersion(
                NotificationCompat.Builder(context, content.channelId)
                    .setSmallIcon(content.icon)
                    .setContentTitle("مددگار")
                    .setContentText("نیا میسج چیک ہو گیا")
                    .build()
            )
            .setContentIntent(openFraudTabIntent(context, notificationId))

        if (verdict.label != FraudVerdict.Label.SAFE) {
            builder.addAction(0, "رکھیں (Keep)", actionIntent(context, checkId, notificationId, NotificationActionReceiver.DECISION_KEEP))
            builder.addAction(0, "ڈیلیٹ کریں (Delete)", actionIntent(context, checkId, notificationId, NotificationActionReceiver.DECISION_DELETE))
        }

        manager.notify(notificationId, builder.build())
    }

    // ---- helpers -------------------------------------------------------------------------

    private data class Content(
        val channelId: String,
        val title: String,
        val shortText: String,
        val longText: String,
        val icon: Int,
        val priority: Int,
        val color: Int
    )

    private fun contentFor(label: FraudVerdict.Label, sender: String, reason: String?): Content =
        when (label) {
            FraudVerdict.Label.FRAUD -> Content(
                channelId = MadadgarApplication.CHANNEL_FRAUD_ALERTS,
                title = "⚠️ فراڈ کا خطرہ! (Scam Alert)",
                shortText = "یہ میسج دھوکہ لگتا ہے۔ لنک نہ کھولیں۔",
                longText = "فرام: $sender\n${reason ?: "فراڈ کا شبہ"}\nکوئی لنک نہ کھولیں اور PIN یا OTP کسی کو نہ بتائیں۔",
                icon = android.R.drawable.ic_dialog_alert,
                priority = NotificationCompat.PRIORITY_MAX,
                color = 0xFFC62828.toInt()
            )
            FraudVerdict.Label.NOT_SURE -> Content(
                channelId = CHANNEL_NOT_SURE,
                title = "🟡 احتیاط کریں (Be careful)",
                shortText = "ہمیں یقین نہیں۔ لنک نہ کھولیں۔",
                longText = "فرام: $sender\n${reason ?: "ہم پورے یقین سے نہیں کہہ سکتے"}\nلنک نہ کھولیں اور کوڈ شیئر نہ کریں۔ شک ہو تو گھر والوں سے پوچھ لیں۔",
                icon = android.R.drawable.ic_dialog_info,
                priority = NotificationCompat.PRIORITY_DEFAULT,
                color = 0xFFF9A825.toInt()
            )
            FraudVerdict.Label.SAFE -> Content(
                channelId = CHANNEL_SAFE,
                title = "✅ یہ میسج ٹھیک لگتا ہے (Looks fine)",
                shortText = "اس میسج میں کوئی خطرہ نہیں ملا۔",
                longText = "فرام: $sender\nاس میسج میں کوئی خطرہ نہیں ملا۔",
                icon = android.R.drawable.ic_dialog_info,
                priority = NotificationCompat.PRIORITY_LOW,
                color = 0xFF2E7D32.toInt()
            )
        }

    private fun openFraudTabIntent(context: Context, requestCode: Int): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_OPEN_FRAUD_TAB, true)
        }
        return PendingIntent.getActivity(
            context, requestCode, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
    }

    private fun actionIntent(context: Context, checkId: Long, notificationId: Int, decision: String): PendingIntent {
        val intent = Intent(context, NotificationActionReceiver::class.java).apply {
            action = NotificationActionReceiver.ACTION_DECISION
            putExtra(NotificationActionReceiver.EXTRA_CHECK_ID, checkId)
            putExtra(NotificationActionReceiver.EXTRA_NOTIFICATION_ID, notificationId)
            putExtra(NotificationActionReceiver.EXTRA_DECISION, decision)
        }
        // Unique request code per (message, decision) so Keep and Delete never overwrite each other.
        val requestCode = notificationId * 2 + if (decision == NotificationActionReceiver.DECISION_KEEP) 0 else 1
        return PendingIntent.getBroadcast(
            context, requestCode, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
    }

    private fun ensureChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val nm = context.getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_NOT_SURE, "Not sure messages", NotificationManager.IMPORTANCE_DEFAULT).apply {
                description = "Messages we could not fully verify"
            }
        )
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_SAFE, "Safe messages", NotificationManager.IMPORTANCE_LOW).apply {
                description = "Quiet confirmation that a message looks fine"
            }
        )
    }
}