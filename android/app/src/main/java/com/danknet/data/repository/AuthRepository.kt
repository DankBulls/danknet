package com.danknet.data.repository

import com.danknet.data.api.ApiService
import com.danknet.data.model.AuthResponse
import com.danknet.data.model.GoogleAuthRequest
import com.danknet.data.model.LoginRequest
import com.danknet.util.DataStoreManager
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    private val dataStoreManager: DataStoreManager
) {
    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            val response = apiService.login(LoginRequest(email, password))
            dataStoreManager.saveToken(response.token)
            dataStoreManager.saveUser(response.user)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun googleAuth(token: String): Result<AuthResponse> {
        return try {
            val response = apiService.googleAuth(GoogleAuthRequest(token))
            dataStoreManager.saveToken(response.token)
            dataStoreManager.saveUser(response.user)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun verifyToken(): Result<AuthResponse> {
        return try {
            val token = dataStoreManager.getToken()
            if (token.isNullOrEmpty()) {
                return Result.failure(Exception("No token found"))
            }
            val response = apiService.verifyToken("Bearer $token")
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout() {
        dataStoreManager.clearData()
    }
}
