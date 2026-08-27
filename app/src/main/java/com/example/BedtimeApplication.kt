package com.example

import android.app.Application
import com.example.data.local.AppDatabase
import com.example.data.local.AppRepository

class BedtimeApplication : Application() {

    val database by lazy { AppDatabase.getDatabase(this) }
    val repository by lazy { AppRepository(database.appDao()) }
}
