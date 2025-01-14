package com.danknet.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.danknet.data.model.AuthResponse
import com.danknet.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Initial)
    val uiState: StateFlow<LoginUiState> = _uiState

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            try {
                val result = authRepository.login(email, password)
                result.fold(
                    onSuccess = { _uiState.value = LoginUiState.Success(it) },
                    onFailure = { _uiState.value = LoginUiState.Error(it.message ?: "Login failed") }
                )
            } catch (e: Exception) {
                _uiState.value = LoginUiState.Error(e.message ?: "Unknown error occurred")
            }
        }
    }

    fun googleSignIn(token: String) {
        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            try {
                val result = authRepository.googleAuth(token)
                result.fold(
                    onSuccess = { _uiState.value = LoginUiState.Success(it) },
                    onFailure = { _uiState.value = LoginUiState.Error(it.message ?: "Google sign-in failed") }
                )
            } catch (e: Exception) {
                _uiState.value = LoginUiState.Error(e.message ?: "Unknown error occurred")
            }
        }
    }
}

sealed class LoginUiState {
    object Initial : LoginUiState()
    object Loading : LoginUiState()
    data class Success(val authResponse: AuthResponse) : LoginUiState()
    data class Error(val message: String) : LoginUiState()
}
