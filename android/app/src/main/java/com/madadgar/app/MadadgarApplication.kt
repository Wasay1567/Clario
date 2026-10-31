package com.Clario.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.Clario.app.data.local.ClarioDatabase
import com.Clario.app.data.repository.ClarioRepository

class ClarioApplication : Application() {

    val database by lazy { ClarioDatabase.getDatabase(this) }
    val repository by lazy { ClarioRepository(database.helpSessionDao(), database.messageCheckDao()) }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channelName = "Clario Floating Service"
            val channelDesc = "Keeps the screen helper bubble active over other apps"
            val importance = NotificationManager.IMPORTANCE_LOW
            val channel = NotificationChannel(CHANNEL_BUBBLE_SERVICE, channelName, importance).apply {
                description = channelDesc
            }

            val fraudChannel = NotificationChannel(
                CHANNEL_FRAUD_ALERTS,
                "Fraud & Scam Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Warns immediately about scam SMS messages"
                enableVibration(true)
            }

            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
            manager.createNotificationChannel(fraudChannel)
        }
    }

    companion object {
        const val CHANNEL_BUBBLE_SERVICE = "Clario_bubble_service"
        const val CHANNEL_FRAUD_ALERTS = "Clario_fraud_alerts"
    }
}
