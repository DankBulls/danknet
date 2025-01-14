package com.danknet.util

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.danknet.data.model.User
import com.google.gson.Gson
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

@Singleton
class DataStoreManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val gson: Gson
) {
    private object PreferencesKeys {
        val TOKEN = stringPreferencesKey("token")
        val USER = stringPreferencesKey("user")
    }

    suspend fun saveToken(token: String) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.TOKEN] = token
        }
    }

    suspend fun getToken(): String? {
        return context.dataStore.data.map { preferences ->
            preferences[PreferencesKeys.TOKEN]
        }.first()
    }

    suspend fun saveUser(user: User) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.USER] = gson.toJson(user)
        }
    }

    suspend fun getUser(): User? {
        val userJson = context.dataStore.data.map { preferences ->
            preferences[PreferencesKeys.USER]
        }.first()

        return userJson?.let { gson.fromJson(it, User::class.java) }
    }

    suspend fun clearData() {
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}
