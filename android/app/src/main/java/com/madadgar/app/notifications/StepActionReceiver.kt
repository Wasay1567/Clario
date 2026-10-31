package com.Clario.app.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Handles the "Done" button (and re-posts the step if the notification was dismissed). */
class StepActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            StepNotificationManager.ACTION_DONE -> StepNotificationManager.markDone(context)
            StepNotificationManager.ACTION_REPOST -> StepNotificationManager.show(context)
        }
    }
}
