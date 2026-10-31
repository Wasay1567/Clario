package com.madadgar.app.sms

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.madadgar.app.MadadgarApplication
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Handles the Keep / Delete buttons on a verdict notification.
 * Saves the user's choice (used later as model feedback) and dismisses the notification.
 *
 * Note: this records the decision inside Madadgar only. Android does not let a normal app
 * delete SMS from the inbox (see README, section 15).
 */
class NotificationActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_DECISION) return

        val checkId = intent.getLongExtra(EXTRA_CHECK_ID, -1L)
        val notificationId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, -1)
        val decision = intent.getStringExtra(EXTRA_DECISION)

        // Dismiss right away so the user sees an instant response.
        if (notificationId != -1) {
            context.getSystemService(NotificationManager::class.java).cancel(notificationId)
        }

        if (checkId == -1L || (decision != DECISION_KEEP && decision != DECISION_DELETE)) return

        val app = context.applicationContext as MadadgarApplication
        val pending = goAsync() // keeps the process alive until the DB write finishes
        CoroutineScope(Dispatchers.IO).launch {
            try {
                app.repository.updateMessageDecision(checkId, decision)
            } finally {
                pending.finish()
            }
        }
    }

    companion object {
        const val ACTION_DECISION = "com.madadgar.app.action.MESSAGE_DECISION"
        const val EXTRA_CHECK_ID = "check_id"
        const val EXTRA_NOTIFICATION_ID = "notification_id"
        const val EXTRA_DECISION = "decision"
        const val DECISION_KEEP = "KEEP"
        const val DECISION_DELETE = "DELETE"
    }
}