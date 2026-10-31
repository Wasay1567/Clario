package com.Clario.app.notifications

import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.Clario.app.MainActivity
import org.json.JSONArray

/**
 * Shows help steps ONE AT A TIME as a notification with a "Done" button.
 * Pressing Done shows the next step; after the last step a short "All done" message appears.
 *
 * Usage (call where the AI steps arrive):
 *   StepNotificationManager.start(context, summary, listOf("Step 1 text", "Step 2 text", ...))
 */
object StepNotificationManager {
    const val CHANNEL_STEPS = "Clario_steps"
    const val ACTION_DONE = "com.Clario.app.STEP_DONE"
    const val ACTION_REPOST = "com.Clario.app.STEP_REPOST"
    private const val NOTIFICATION_ID = 2001
    private const val PREFS = "step_flow"

    fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_STEPS, "Step-by-step help", NotificationManager.IMPORTANCE_HIGH
            ).apply { description = "Shows one help step at a time" }
            context.getSystemService(NotificationManager::class.java)
                .createNotificationChannel(channel)
        }
    }

    /** Start a new step-by-step flow and show step 1. */
    fun start(context: Context, summary: String, steps: List<String>) {
        if (steps.isEmpty()) return
        prefs(context).edit()
            .putString("summary", summary)
            .putString("steps", JSONArray(steps).toString())
            .putInt("index", 0)
            .apply()
        show(context)
    }

    /** Quick test helper: shows a sample 4-step flow. */
    fun demo(context: Context) {
        start(
            context,
            "Demo",
            listOf(
                "Open the app you need help with.",
                "Tap the green Join button at the bottom.",
                "Allow the microphone if it asks.",
                "Say hello. You are done!"
            )
        )
    }

    /** Called when the user taps Done. Moves to the next step or finishes. */
    fun markDone(context: Context) {
        val p = prefs(context)
        val steps = JSONArray(p.getString("steps", "[]"))
        val next = p.getInt("index", 0) + 1
        if (next >= steps.length()) {
            finish(context)
        } else {
            p.edit().putInt("index", next).apply()
            show(context)
        }
    }

    /** Shows (or re-shows) the current step. */
    @SuppressLint("MissingPermission")
    fun show(context: Context) {
        createChannel(context) // safe to call repeatedly
        val nm = NotificationManagerCompat.from(context)
        if (!nm.areNotificationsEnabled()) return

        val p = prefs(context)
        val steps = JSONArray(p.getString("steps", "[]"))
        val index = p.getInt("index", 0)
        if (index >= steps.length()) return
        val text = steps.getString(index)

        fun broadcast(action: String) = PendingIntent.getBroadcast(
            context, action.hashCode(),
            Intent(context, StepActionReceiver::class.java).setAction(action),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val open = PendingIntent.getActivity(
            context, 0, Intent(context, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_STEPS)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Step ${index + 1} of ${steps.length()}")
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .setOngoing(true)                            // cannot be swiped away
            .setOnlyAlertOnce(false)                     // pops up again for every step
            .setContentIntent(open)
            .setDeleteIntent(broadcast(ACTION_REPOST))   // if dismissed anyway, bring it back
            .addAction(0, "Done", broadcast(ACTION_DONE))
            .build()

        nm.notify(NOTIFICATION_ID, notification)
    }

    @SuppressLint("MissingPermission")
    private fun finish(context: Context) {
        val nm = NotificationManagerCompat.from(context)
        nm.cancel(NOTIFICATION_ID)
        prefs(context).edit().clear().apply()
        if (!nm.areNotificationsEnabled()) return
        nm.notify(
            NOTIFICATION_ID + 1,
            NotificationCompat.Builder(context, CHANNEL_STEPS)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("All done!")
                .setContentText("You finished every step.")
                .setAutoCancel(true)
                .setTimeoutAfter(10_000)
                .build()
        )
    }

    private fun prefs(c: Context) = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
