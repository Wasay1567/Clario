package com.Clario.app.data.local

import android.content.Context
import com.Clario.app.data.remote.StoredFraudResult
import com.google.gson.Gson

object FraudResultStore {
    private const val PREFERENCES = "fraud_result_store"
    private const val LATEST_RESULT = "latest_result"
    private val gson = Gson()

    fun save(context: Context, result: StoredFraudResult) {
        context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
            .edit()
            .putString(LATEST_RESULT, gson.toJson(result))
            .apply()
    }

    fun load(context: Context): StoredFraudResult? {
        val json = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
            .getString(LATEST_RESULT, null)
        return json?.let { runCatching { gson.fromJson(it, StoredFraudResult::class.java) }.getOrNull() }
    }
}
