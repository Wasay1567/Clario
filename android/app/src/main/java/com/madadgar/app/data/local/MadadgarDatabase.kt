package com.Clario.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.Clario.app.data.local.dao.HelpSessionDao
import com.Clario.app.data.local.dao.MessageCheckDao
import com.Clario.app.data.local.entity.HelpSessionEntity
import com.Clario.app.data.local.entity.MessageCheckEntity

@Database(
    entities = [HelpSessionEntity::class, MessageCheckEntity::class],
    version = 1,
    exportSchema = false
)
abstract class ClarioDatabase : RoomDatabase() {

    abstract fun helpSessionDao(): HelpSessionDao
    abstract fun messageCheckDao(): MessageCheckDao

    companion object {
        @Volatile
        private var INSTANCE: ClarioDatabase? = null

        fun getDatabase(context: Context): ClarioDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    ClarioDatabase::class.java,
                    "Clario_offline_db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
