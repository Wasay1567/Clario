package com.madadgar.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.madadgar.app.data.local.dao.HelpSessionDao
import com.madadgar.app.data.local.dao.MessageCheckDao
import com.madadgar.app.data.local.entity.HelpSessionEntity
import com.madadgar.app.data.local.entity.MessageCheckEntity

@Database(
    entities = [HelpSessionEntity::class, MessageCheckEntity::class],
    version = 1,
    exportSchema = false
)
abstract class MadadgarDatabase : RoomDatabase() {

    abstract fun helpSessionDao(): HelpSessionDao
    abstract fun messageCheckDao(): MessageCheckDao

    companion object {
        @Volatile
        private var INSTANCE: MadadgarDatabase? = null

        fun getDatabase(context: Context): MadadgarDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    MadadgarDatabase::class.java,
                    "madadgar_offline_db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
