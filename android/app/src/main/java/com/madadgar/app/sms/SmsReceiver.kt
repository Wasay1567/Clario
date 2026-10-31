package com.Clario.app.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.Clario.app.monitoring.FraudAnalysisCoordinator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * BroadcastReceiver for incoming SMS.
 * Automatically runs the offline fraud detector and raises urgent alerts for scams.
 */
class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) return

        val sender = messages[0].displayOriginatingAddress ?: return
        val text = messages.joinToString(separator = "") { it.messageBody.orEmpty() }
        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                FraudAnalysisCoordinator.analyzeUnknownNotification(
                    context = context.applicationContext,
                    sender = sender,
                    message = text,
                    source = "SMS"
                )
            } finally {
                pendingResult.finish()
            }
        }
    }
}
