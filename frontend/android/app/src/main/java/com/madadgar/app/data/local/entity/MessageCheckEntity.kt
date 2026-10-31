package com.madadgar.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "message_checks")
data class MessageCheckEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val sender: String,
    val sanitizedText: String,
    val label: String, // FRAUD, SAFE, NOT_SURE
    val confidence: Float,
    val reasons: String,
    val userDecision: String?, // KEEP, DELETE
    val timestamp: Long = System.currentTimeMillis()
)
