package com.Clario.app.data.remote

import com.google.gson.annotations.SerializedName
import com.Clario.app.BuildConfig
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST


data class AnalyzeRequest(
    val message: String,
    val language: String = "auto"
)

data class FraudAnalysisResult(
    val classification: String,
    @SerializedName("fraud_probability") val fraudProbability: Float,
    @SerializedName("risk_level") val riskLevel: String,
    val language: String,
    @SerializedName("risk_factors") val riskFactors: List<String>,
    val explanation: String,
    @SerializedName("recommended_action") val recommendedAction: List<String>,
    @SerializedName("model_version") val modelVersion: String
)

data class StoredFraudResult(
    val sender: String,
    val source: String,
    val result: FraudAnalysisResult,
    val timestamp: Long
)

interface FraudApiService {
    @POST("api/v1/analyze")
    suspend fun analyze(@Body request: AnalyzeRequest): FraudAnalysisResult
}

object FraudApiClient {
    val service: FraudApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.FRAUD_API_BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(FraudApiService::class.java)
    }
}
