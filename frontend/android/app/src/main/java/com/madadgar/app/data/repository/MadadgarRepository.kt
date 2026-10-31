package com.madadgar.app.data.repository

import com.madadgar.app.data.local.dao.HelpSessionDao
import com.madadgar.app.data.local.dao.MessageCheckDao
import com.madadgar.app.data.local.entity.HelpSessionEntity
import com.madadgar.app.data.local.entity.MessageCheckEntity
import kotlinx.coroutines.flow.Flow

/**
 * Repository coordinating local Room offline database with backend sync.
 */
class MadadgarRepository(
    private val helpSessionDao: HelpSessionDao,
    private val messageCheckDao: MessageCheckDao
) {

    val allHelpSessions: Flow<List<HelpSessionEntity>> = helpSessionDao.getAllHelpSessions()
    val allMessageChecks: Flow<List<MessageCheckEntity>> = messageCheckDao.getAllMessageChecks()

    suspend fun saveHelpSession(session: HelpSessionEntity): Long {
        return helpSessionDao.insertHelpSession(session)
    }

    suspend fun saveMessageCheck(check: MessageCheckEntity): Long {
        return messageCheckDao.insertMessageCheck(check)
    }

    suspend fun updateMessageDecision(id: Long, decision: String) {
        messageCheckDao.updateDecision(id, decision)
    }

    suspend fun getFraudBlockedCount(): Int {
        return messageCheckDao.getFraudBlockedCount()
    }
}
