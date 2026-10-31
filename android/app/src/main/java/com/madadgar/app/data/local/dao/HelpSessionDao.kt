package com.Clario.app.data.local.dao

import androidx.room.*
import com.Clario.app.data.local.entity.HelpSessionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface HelpSessionDao {

    @Query("SELECT * FROM help_sessions ORDER BY timestamp DESC")
    fun getAllHelpSessions(): Flow<List<HelpSessionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHelpSession(session: HelpSessionEntity): Long

    @Query("DELETE FROM help_sessions WHERE id = :id")
    suspend fun deleteHelpSession(id: Long)

    @Query("DELETE FROM help_sessions")
    suspend fun clearAll()
}
