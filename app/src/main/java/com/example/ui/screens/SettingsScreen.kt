package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Brightness4
import androidx.compose.material.icons.filled.Brightness7
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.NightlightRound
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.AmbientSound
import com.example.theme.CardBorder
import com.example.theme.LocalBedtimePalette
import com.example.theme.StarlightGold
import com.example.theme.SurfaceElevated
import com.example.viewmodel.BedtimeUiState

@Composable
fun SettingsScreen(
    uiState: BedtimeUiState,
    onSaveProfile: (name: String, age: Int, gentleMode: Boolean) -> Unit,
    onSelectAmbientSound: (AmbientSound) -> Unit,
    onUpdateSleepTimer: (Int) -> Unit,
    onToggleTheme: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    val palette = LocalBedtimePalette.current
    var childName by remember { mutableStateOf(uiState.childName) }
    var childAge by remember { mutableIntStateOf(uiState.childAge) }
    var gentleMode by remember { mutableStateOf(uiState.gentleMode) }
    var selectedSound by remember { mutableStateOf(uiState.ambientSound) }
    var sleepTimer by remember { mutableIntStateOf(uiState.sleepTimerMinutesRemaining) }

    val timerOptions = listOf(15, 30, 45, 60, 90)

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("settings_screen"),
        contentPadding = PaddingValues(bottom = 100.dp)
    ) {
        // Header
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 16.dp)
            ) {
                Text(
                    text = "Bedtime Settings",
                    style = MaterialTheme.typography.headlineMedium,
                    color = palette.textPrimary,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Personalization, daytime readability & soundscape preferences",
                    style = MaterialTheme.typography.bodyMedium,
                    color = palette.textSecondary,
                    fontSize = 13.sp
                )
            }
        }

        // Section 0: Theme Mode (Dark Bedtime vs High Contrast Light)
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .testTag("theme_settings_card"),
                colors = CardDefaults.cardColors(containerColor = palette.cardBackground),
                border = androidx.compose.foundation.BorderStroke(1.dp, palette.cardBorder),
                shape = RoundedCornerShape(20.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(palette.accentGold.copy(alpha = 0.25f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (uiState.isDarkMode) Icons.Default.NightlightRound else Icons.Default.WbSunny,
                                contentDescription = null,
                                tint = palette.accentGold,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Display & Readability Theme",
                                style = MaterialTheme.typography.titleMedium,
                                color = palette.textPrimary,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = if (uiState.isDarkMode) "Current: Cosmic Dark (Night Mode)" else "Current: High Contrast Light (Day Mode)",
                                style = MaterialTheme.typography.labelSmall,
                                color = palette.accentGold,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "High Contrast Light Mode",
                                style = MaterialTheme.typography.bodyMedium,
                                color = palette.textPrimary,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Switch from default dark mode to high contrast light mode for optimal daytime readability",
                                style = MaterialTheme.typography.bodySmall,
                                color = palette.textSecondary,
                                fontSize = 12.sp,
                                lineHeight = 16.sp
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Switch(
                            checked = !uiState.isDarkMode,
                            onCheckedChange = { isLight ->
                                onToggleTheme(!isLight)
                            },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color(0xFFF59E0B),
                                checkedTrackColor = Color(0xFF4F46E5),
                                uncheckedThumbColor = palette.accentGold,
                                uncheckedTrackColor = Color(0xFF2E2E6B)
                            ),
                            modifier = Modifier.testTag("theme_mode_switch")
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Mode Selection Tabs (Dark vs High-Contrast Light)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Dark Mode Button
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (uiState.isDarkMode) Color(0xFF261D4C) else palette.surfaceElevated)
                                .border(
                                    1.dp,
                                    if (uiState.isDarkMode) palette.accentGold else palette.cardBorder,
                                    RoundedCornerShape(12.dp)
                                )
                                .clickable { onToggleTheme(true) }
                                .padding(vertical = 10.dp, horizontal = 12.dp)
                                .testTag("theme_button_dark"),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.NightlightRound,
                                    contentDescription = "Dark Mode",
                                    tint = if (uiState.isDarkMode) palette.accentGold else palette.textSecondary,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Cosmic Dark",
                                    color = if (uiState.isDarkMode) Color.White else palette.textPrimary,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        // High-Contrast Light Mode Button
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (!uiState.isDarkMode) Color(0xFFE0E7FF) else palette.surfaceElevated)
                                .border(
                                    1.dp,
                                    if (!uiState.isDarkMode) Color(0xFF4338CA) else palette.cardBorder,
                                    RoundedCornerShape(12.dp)
                                )
                                .clickable { onToggleTheme(false) }
                                .padding(vertical = 10.dp, horizontal = 12.dp)
                                .testTag("theme_button_light"),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.WbSunny,
                                    contentDescription = "Light Mode",
                                    tint = if (!uiState.isDarkMode) Color(0xFFB45309) else palette.textSecondary,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "High Contrast Light",
                                    color = if (!uiState.isDarkMode) Color(0xFF1E1B4B) else palette.textPrimary,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }

        // Section 1: Child Profile Personalization
        item {
            Spacer(modifier = Modifier.height(10.dp))
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp)
                    .clip(RoundedCornerShape(20.dp)),
                colors = CardDefaults.cardColors(containerColor = palette.cardBackground),
                border = androidx.compose.foundation.BorderStroke(1.dp, palette.cardBorder),
                shape = RoundedCornerShape(20.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(palette.accentPrimary.copy(alpha = 0.25f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = null,
                                tint = palette.accentGold,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Child Profile",
                            style = MaterialTheme.typography.titleMedium,
                            color = palette.textPrimary,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = "Child's First Name",
                        style = MaterialTheme.typography.labelMedium,
                        color = palette.textSecondary
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = childName,
                        onValueChange = { childName = it },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("child_name_input"),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = palette.accentGold,
                            unfocusedBorderColor = palette.cardBorder,
                            focusedTextColor = palette.textPrimary,
                            unfocusedTextColor = palette.textPrimary
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = "Age: $childAge years old",
                        style = MaterialTheme.typography.labelMedium,
                        color = palette.textSecondary
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items((2..10).toList()) { age ->
                            val isChosen = childAge == age
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(if (isChosen) palette.accentPrimary else palette.surfaceElevated)
                                    .border(1.dp, if (isChosen) palette.accentGold else palette.cardBorder, CircleShape)
                                    .clickable { childAge = age }
                                    .padding(8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "$age",
                                    color = if (isChosen) Color.White else palette.textSecondary,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Gentle Sleep Mode",
                                style = MaterialTheme.typography.bodyMedium,
                                color = palette.textPrimary,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Softens story tones for extra cozy winding-down",
                                style = MaterialTheme.typography.bodySmall,
                                color = palette.textSecondary,
                                fontSize = 12.sp
                            )
                        }
                        Switch(
                            checked = gentleMode,
                            onCheckedChange = { gentleMode = it },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = palette.accentGold,
                                checkedTrackColor = palette.accentPrimary
                            )
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = { onSaveProfile(childName, childAge, gentleMode) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("save_profile_button"),
                        colors = ButtonDefaults.buttonColors(containerColor = palette.accentPrimary),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Save Profile Changes", fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }
        }

        // Section 2: Ambient Soundscape & Sleep Timer
        item {
            Spacer(modifier = Modifier.height(10.dp))
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp)
                    .clip(RoundedCornerShape(20.dp)),
                colors = CardDefaults.cardColors(containerColor = palette.cardBackground),
                border = androidx.compose.foundation.BorderStroke(1.dp, palette.cardBorder),
                shape = RoundedCornerShape(20.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF38BDF8).copy(alpha = 0.25f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.VolumeUp,
                                contentDescription = null,
                                tint = Color(0xFF0284C7),
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Soundscape & Sleep Timer",
                            style = MaterialTheme.typography.titleMedium,
                            color = palette.textPrimary,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = "Default Ambient Soundscape",
                        style = MaterialTheme.typography.labelMedium,
                        color = palette.textSecondary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(AmbientSound.entries.toList()) { sound ->
                            val isChosen = selectedSound == sound
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isChosen) (if (palette.isDark) Color(0xFF132042) else Color(0xFFE0F2FE)) else palette.surfaceElevated)
                                    .border(1.dp, if (isChosen) Color(0xFF0284C7) else palette.cardBorder, RoundedCornerShape(12.dp))
                                    .clickable {
                                        selectedSound = sound
                                        onSelectAmbientSound(sound)
                                    }
                                    .padding(horizontal = 12.dp, vertical = 8.dp)
                            ) {
                                Text(
                                    text = sound.label,
                                    color = if (isChosen) Color(0xFF0284C7) else palette.textSecondary,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = if (isChosen) FontWeight.Bold else FontWeight.Normal
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "Sleep Timer Duration",
                        style = MaterialTheme.typography.labelMedium,
                        color = palette.textSecondary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(timerOptions) { mins ->
                            val isChosen = sleepTimer == mins
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isChosen) (if (palette.isDark) Color(0xFF261D4C) else Color(0xFFFEF3C7)) else palette.surfaceElevated)
                                    .border(1.dp, if (isChosen) palette.accentGold else palette.cardBorder, RoundedCornerShape(12.dp))
                                    .clickable {
                                        sleepTimer = mins
                                        onUpdateSleepTimer(mins)
                                    }
                                    .padding(horizontal = 14.dp, vertical = 8.dp)
                            ) {
                                Text(
                                    text = "$mins mins",
                                    color = if (isChosen) palette.accentGold else palette.textSecondary,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }

        // Section 3: Child Safety & Privacy
        item {
            Spacer(modifier = Modifier.height(10.dp))
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp)
                    .clip(RoundedCornerShape(20.dp)),
                colors = CardDefaults.cardColors(containerColor = if (palette.isDark) Color(0xFF151B2E) else Color(0xFFF0FDF4)),
                border = androidx.compose.foundation.BorderStroke(1.dp, if (palette.isDark) Color(0xFF38BDF8).copy(alpha = 0.4f) else Color(0xFF86EFAC)),
                shape = RoundedCornerShape(20.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF10B981).copy(alpha = 0.25f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Security,
                                contentDescription = null,
                                tint = Color(0xFF059669),
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Child Safe & Privacy Compliant",
                            style = MaterialTheme.typography.titleMedium,
                            color = palette.textPrimary,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "Infinite Heroes Bedtime Chronicles is designed strictly for calm, safe bedtime routines. No child personal data is sold or tracked. All generated stories and journal entries are kept safe on this device.",
                        style = MaterialTheme.typography.bodySmall,
                        color = palette.textSecondary,
                        lineHeight = 16.sp
                    )
                }
            }
        }
    }
}

