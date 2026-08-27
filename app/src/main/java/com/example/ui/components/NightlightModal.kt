package com.example.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.NightlightRound
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material.icons.filled.Waves
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.model.AmbientSound
import com.example.theme.StarlightGold

@Composable
fun NightlightModal(
    initialColorHex: Long = 0xFFFFD54F,
    initialBrightness: Float = 0.8f,
    initialBreathing: Boolean = true,
    ambientSound: AmbientSound = AmbientSound.OCEAN,
    onDismiss: () -> Unit,
    onUpdateSettings: (Long, Float, Boolean) -> Unit
) {
    var selectedColorHex by remember { mutableLongStateOf(initialColorHex) }
    var brightness by remember { mutableFloatStateOf(initialBrightness) }
    var breathingEnabled by remember { mutableStateOf(initialBreathing) }

    val infiniteTransition = rememberInfiniteTransition(label = "nightlight_pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    val lightColor = Color(selectedColorHex)
    val actualScale = if (breathingEnabled) pulseScale else 1.0f

    val palette = listOf(
        Pair("Amber Star", 0xFFFFD54F),
        Pair("Ocean Blue", 0xFF38BDF8),
        Pair("Dream Violet", 0xFFA855F7),
        Pair("Soft Rose", 0xFFEC4899),
        Pair("Forest Mint", 0xFFA5D6A7),
        Pair("Warm Candle", 0xFFFB923C)
    )

    Dialog(
        onDismissRequest = {
            onUpdateSettings(selectedColorHex, brightness, breathingEnabled)
            onDismiss()
        },
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF040412))
                .testTag("nightlight_modal")
        ) {
            // Ambient breathing radiant glow
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .scale(actualScale)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                lightColor.copy(alpha = 0.55f * brightness),
                                lightColor.copy(alpha = 0.25f * brightness),
                                Color.Transparent
                            )
                        )
                    )
            )

            // Header close button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 40.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.NightlightRound,
                        contentDescription = "Nightlight",
                        tint = StarlightGold,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Sound-Reactive Bedtime Nightlight",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                }

                IconButton(
                    onClick = {
                        onUpdateSettings(selectedColorHex, brightness, breathingEnabled)
                        onDismiss()
                    },
                    modifier = Modifier.testTag("close_nightlight")
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = Color.White
                    )
                }
            }

            // Center Breathing Orb
            Column(
                modifier = Modifier
                    .align(Alignment.Center)
                    .padding(bottom = 80.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(160.dp)
                        .scale(actualScale)
                        .clip(CircleShape)
                        .background(
                            Brush.radialGradient(
                                colors = listOf(
                                    Color.White.copy(alpha = 0.9f * brightness),
                                    lightColor.copy(alpha = 0.8f * brightness),
                                    lightColor.copy(alpha = 0.3f * brightness)
                                )
                            )
                        )
                        .border(4.dp, Color.White.copy(alpha = 0.3f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.NightlightRound,
                        contentDescription = null,
                        tint = Color(0xFF1E1B4B),
                        modifier = Modifier.size(64.dp)
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = if (breathingEnabled) "Breathe in as the light glows... breathe out as it dims" else "Peaceful steady glow",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFFE2E8F0),
                    fontSize = 14.sp
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFF1E1E4F).copy(alpha = 0.7f))
                        .padding(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Waves,
                        contentDescription = null,
                        tint = Color(0xFF38BDF8),
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Ambient: ${ambientSound.label}",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFF38BDF8)
                    )
                }
            }

            // Bottom Controls Card
            Card(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(16.dp)
                    .clip(RoundedCornerShape(24.dp)),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFF11112D).copy(alpha = 0.95f)
                ),
                shape = RoundedCornerShape(24.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    // Color swatches
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        for ((_, hex) in palette) {
                            val color = Color(hex)
                            val isChosen = selectedColorHex == hex
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(CircleShape)
                                    .background(color)
                                    .border(
                                        width = if (isChosen) 3.dp else 1.dp,
                                        color = if (isChosen) Color.White else Color.Transparent,
                                        shape = CircleShape
                                    )
                                    .clickable { selectedColorHex = hex }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Brightness slider
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Brightness",
                            style = MaterialTheme.typography.labelMedium,
                            color = Color.White,
                            modifier = Modifier.width(80.dp)
                        )
                        Slider(
                            value = brightness,
                            onValueChange = { brightness = it },
                            valueRange = 0.2f..1.0f,
                            colors = SliderDefaults.colors(
                                thumbColor = StarlightGold,
                                activeTrackColor = StarlightGold,
                                inactiveTrackColor = Color(0xFF2E2E6B)
                            ),
                            modifier = Modifier.weight(1f)
                        )
                    }

                    // Breathing Toggle
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Guided Breathing Pulse (4s cycle)",
                            style = MaterialTheme.typography.labelMedium,
                            color = Color.White
                        )
                        Switch(
                            checked = breathingEnabled,
                            onCheckedChange = { breathingEnabled = it },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = StarlightGold,
                                checkedTrackColor = Color(0xFF6366F1)
                            )
                        )
                    }
                }
            }
        }
    }
}
