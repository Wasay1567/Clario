package com.Clario.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "help_sessions")
data class HelpSessionEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val appContext: String,
    val userQuery: String,
    val language: String,
    val summary: String,
    val stepsJson: String,
    val warning: String?,
    val timestamp: Long = System.currentTimeMillis()
)
