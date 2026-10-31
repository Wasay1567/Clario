package com.madadgar.app.data.local.dao

import androidx.room.*
import com.madadgar.app.data.local.entity.MessageCheckEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface MessageCheckDao {

    @Query("SELECT * FROM message_checks ORDER BY timestamp DESC")
    fun getAllMessageChecks(): Flow<List<MessageCheckEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessageCheck(check: MessageCheckEntity): Long

    @Query("UPDATE message_checks SET userDecision = :decision WHERE id = :id")
    suspend fun updateDecision(id: Long, decision: String)

    @Query("DELETE FROM message_checks WHERE id = :id")
    suspend fun deleteMessageCheck(id: Long)

    @Query("SELECT COUNT(*) FROM message_checks WHERE label = 'FRAUD'")
    suspend fun getFraudBlockedCount(): Int
}
