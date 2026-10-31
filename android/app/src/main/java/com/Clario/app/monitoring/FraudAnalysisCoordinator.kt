package com.Clario.app.monitoring

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.Clario.app.ClarioApplication
import com.Clario.app.MainActivity
import com.Clario.app.data.local.FraudResultStore
import com.Clario.app.data.local.entity.MessageCheckEntity
import com.Clario.app.data.remote.AnalyzeRequest
import com.Clario.app.data.remote.FraudAnalysisResult
import com.Clario.app.data.remote.FraudApiClient
import com.Clario.app.data.remote.StoredFraudResult
import com.Clario.app.sms.FraudVerdict
import com.Clario.app.sms.OfflineFraudDetector
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object FraudAnalysisCoordinator {
    suspend fun analyzeUnknownNotification(
        context: Context,
        sender: String,
        message: String,
        source: String
    ) = withContext(Dispatchers.IO) {
        if (message.isBlank() || SenderTrustChecker.isKnownContact(context, sender)) return@withContext

        val result = runCatching {
            FraudApiClient.service.analyze(AnalyzeRequest(message = message))
        }.getOrElse {
            val fallback = OfflineFraudDetector.analyze(sender, message)
            FraudAnalysisResult(
                classification = when (fallback.label) {
                    FraudVerdict.Label.FRAUD -> "fraud"
                    FraudVerdict.Label.SAFE -> "safe"
                    FraudVerdict.Label.NOT_SURE -> "under_review"
                },
                fraudProbability = fallback.confidence,
                riskLevel = if (fallback.label == FraudVerdict.Label.FRAUD) "high" else "medium",
                language = "auto",
                riskFactors = fallback.reasons,
                explanation = "The backend could not be reached. This is an offline safety check: ${fallback.reasons.firstOrNull() ?: "No clear risk was detected."}",
                recommendedAction = listOf("Do not share OTPs, PINs, passwords, or verification codes.", "Verify the sender through an official channel."),
                modelVersion = "offline-fallback"
            )
        }

        val stored = StoredFraudResult(sender, source, result, System.currentTimeMillis())
        FraudResultStore.save(context, stored)
        val app = context.applicationContext as ClarioApplication
        app.repository.saveMessageCheck(
            MessageCheckEntity(
                sender = sender,
                sanitizedText = "[message content hidden]",
                label = result.classification.toRoomLabel(),
                confidence = result.fraudProbability,
                reasons = result.riskFactors.joinToString(" • "),
                userDecision = null
            )
        )
        showResultNotification(context, stored)
    }

    private fun String.toRoomLabel(): String = when (lowercase()) {
        "fraud" -> "FRAUD"
        "safe" -> "SAFE"
        else -> "NOT_SURE"
    }

    private fun showResultNotification(context: Context, stored: StoredFraudResult) {
        val result = stored.result
        val openIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("OPEN_FRAUD_TAB", true)
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            stored.timestamp.toInt(),
            openIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val title = when (result.classification.lowercase()) {
            "fraud" -> "Fraud warning"
            "safe" -> "Notification checked"
            else -> "Notification needs review"
        }
        val detail = "${stored.source}: ${result.explanation}"
        val notification = NotificationCompat.Builder(context, ClarioApplication.CHANNEL_FRAUD_ALERTS)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(title)
            .setContentText(result.explanation)
            .setStyle(NotificationCompat.BigTextStyle().bigText(detail))
            .setPriority(if (result.classification.equals("fraud", true)) NotificationCompat.PRIORITY_HIGH else NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()
        context.getSystemService(NotificationManager::class.java)
            .notify(stored.timestamp.toInt(), notification)
    }
}
