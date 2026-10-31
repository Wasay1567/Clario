package com.Clario.app.monitoring

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class WhatsAppNotificationListener : NotificationListenerService() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val recentlySeen = LinkedHashMap<Int, Long>()

    override fun onNotificationPosted(statusBarNotification: StatusBarNotification) {
        val packageName = statusBarNotification.packageName
        if (packageName != WHATSAPP && packageName != WHATSAPP_BUSINESS) return
        val notification = statusBarNotification.notification
        if ((notification.flags and Notification.FLAG_ONGOING_EVENT) != 0) return

        val extras = notification.extras ?: return
        val sender = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.trim().orEmpty()
        val message = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.trim().orEmpty()
        if (sender.isBlank() || message.isBlank() || sender.equals("WhatsApp", true)) return

        val key = (sender + "\u0000" + message).hashCode()
        val now = System.currentTimeMillis()
        synchronized(recentlySeen) {
            recentlySeen.entries.removeIf { now - it.value > DEDUPLICATION_WINDOW_MS }
            if (recentlySeen.containsKey(key)) return
            recentlySeen[key] = now
        }

        scope.launch {
            FraudAnalysisCoordinator.analyzeUnknownNotification(
                context = applicationContext,
                sender = sender,
                message = message,
                source = "WhatsApp"
            )
        }
    }

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }

    companion object {
        private const val WHATSAPP = "com.whatsapp"
        private const val WHATSAPP_BUSINESS = "com.whatsapp.w4b"
        private const val DEDUPLICATION_WINDOW_MS = 30_000L
    }
}
