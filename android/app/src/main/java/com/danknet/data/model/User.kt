package com.danknet.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class User(
    val id: Int,
    val email: String,
    val name: String,
    val picture: String?,
    val role: String
) : Parcelable

data class AuthResponse(
    val token: String,
    val user: User
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class GoogleAuthRequest(
    val token: String
)
