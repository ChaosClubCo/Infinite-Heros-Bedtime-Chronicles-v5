package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.example.theme.BedtimeChroniclesTheme
import com.example.ui.navigation.AppNavigation
import com.example.viewmodel.BedtimeViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: BedtimeViewModel by viewModels {
        val app = application as BedtimeApplication
        BedtimeViewModel.Factory(app.repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            BedtimeChroniclesTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF08081E)
                ) {
                    AppNavigation(viewModel = viewModel)
                }
            }
        }
    }
}
