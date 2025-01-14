package com.danknet.data.api

import com.danknet.data.model.AuthResponse
import com.danknet.data.model.GoogleAuthRequest
import com.danknet.data.model.LoginRequest
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Header

interface ApiService {
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse

    @POST("api/auth/google")
    suspend fun googleAuth(@Body request: GoogleAuthRequest): AuthResponse

    @GET("api/auth/verify")
    suspend fun verifyToken(@Header("Authorization") token: String): AuthResponse
}
