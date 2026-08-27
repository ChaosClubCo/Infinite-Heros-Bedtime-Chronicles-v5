package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FormatSize
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.NightlightRound
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.VolumeOff
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material.icons.filled.Waves
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.Story
import com.example.model.StoryMode
import com.example.theme.CardBorder
import com.example.theme.StarlightGold
import com.example.theme.SurfaceElevated
import com.example.viewmodel.BedtimeUiState

@Composable
fun StoryReaderScreen(
    story: Story,
    currentSceneIndex: Int,
    uiState: BedtimeUiState,
    isSaved: Boolean,
    onNextScene: (targetSceneId: String?) -> Unit,
    onCompleteStory: () -> Unit,
    onToggleSave: () -> Unit,
    onToggleNarration: () -> Unit,
    onToggleAmbient: () -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    var fontSizeMultiplier by remember { mutableFloatStateOf(1.0f) }
    val scenes = story.scenes
    val currentScene = scenes.getOrElse(currentSceneIndex) { scenes.firstOrNull() }
    val totalScenes = scenes.size.coerceAtLeast(1)
    val isLastScene = currentSceneIndex >= totalScenes - 1 || currentScene?.isFinal == true

    val progress = (currentSceneIndex + 1).toFloat() / totalScenes.toFloat()

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF07071A))
            .testTag("story_reader_screen")
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // 1. Top Controls Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onClose,
                    modifier = Modifier.testTag("close_reader_button")
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Close Reader", tint = Color.White)
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    // Narration Audio Voice Toggle
                    IconButton(
                        onClick = onToggleNarration,
                        modifier = Modifier.testTag("toggle_narration_button")
                    ) {
                        Icon(
                            imageVector = if (uiState.isNarrating) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                            contentDescription = "Narration Voice",
                            tint = if (uiState.isNarrating) StarlightGold else Color(0xFF64748B)
                        )
                    }

                    // Ambient Waves Toggle
                    IconButton(
                        onClick = onToggleAmbient,
                        modifier = Modifier.testTag("toggle_ambient_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Waves,
                            contentDescription = "Ambient Soundscape",
                            tint = if (uiState.isAmbientSoundPlaying) Color(0xFF38BDF8) else Color(0xFF64748B)
                        )
                    }

                    // Font Size Toggle
                    IconButton(
                        onClick = {
                            fontSizeMultiplier = when (fontSizeMultiplier) {
                                1.0f -> 1.2f
                                1.2f -> 1.4f
                                else -> 1.0f
                            }
                        },
                        modifier = Modifier.testTag("toggle_font_size_button")
                    ) {
                        Icon(Icons.Default.FormatSize, contentDescription = "Font Size", tint = Color.White)
                    }

                    // Bookmark / Save
                    IconButton(
                        onClick = onToggleSave,
                        modifier = Modifier.testTag("save_in_reader_button")
                    ) {
                        Icon(
                            imageVector = if (isSaved) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                            contentDescription = "Save Story",
                            tint = if (isSaved) StarlightGold else Color.White
                        )
                    }
                }
            }

            // Progress Bar
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(4.dp),
                color = if (story.mode == StoryMode.SLEEP) Color(0xFF38BDF8) else Color(0xFFA855F7),
                trackColor = Color(0xFF1E1B4B)
            )

            // Content Scroll
            if (currentScene != null) {
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        Spacer(modifier = Modifier.height(8.dp))
                        // Scene metadata header
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Scene ${currentScene.sceneNumber} of $totalScenes",
                                style = MaterialTheme.typography.labelMedium,
                                color = StarlightGold,
                                fontWeight = FontWeight.Bold
                            )

                            if (uiState.isNarrating) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFF261D4C))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.GraphicEq,
                                        contentDescription = null,
                                        tint = StarlightGold,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Voice Narration Active",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = StarlightGold,
                                        fontSize = 10.sp
                                    )
                                }
                            }
                        }
                    }

                    // Scene Illustration Card
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp)
                                .clip(RoundedCornerShape(20.dp)),
                            colors = CardDefaults.cardColors(
                                containerColor = Color(0xFF16163F)
                            ),
                            border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
                            shape = RoundedCornerShape(20.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(
                                        Brush.radialGradient(
                                            listOf(
                                                Color(story.theme.colorHex).copy(alpha = 0.35f),
                                                Color(0xFF0F0F30)
                                            )
                                        )
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = if (story.mode == StoryMode.SLEEP) "🌙" else "✨",
                                        fontSize = 44.sp
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = story.title,
                                        style = MaterialTheme.typography.titleMedium,
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp
                                    )
                                    Text(
                                        text = "Featuring ${story.heroName}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = StarlightGold,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }
                    }

                    // Scene Story Text
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(20.dp)),
                            colors = CardDefaults.cardColors(
                                containerColor = SurfaceElevated.copy(alpha = 0.8f)
                            ),
                            border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
                            shape = RoundedCornerShape(20.dp)
                        ) {
                            Text(
                                text = currentScene.text,
                                style = MaterialTheme.typography.bodyLarge,
                                color = Color(0xFFF8FAFC),
                                fontSize = (17 * fontSizeMultiplier).sp,
                                lineHeight = (26 * fontSizeMultiplier).sp,
                                modifier = Modifier.padding(20.dp)
                            )
                        }
                    }

                    // Sleep Affirmation / Breathing Cue Banner
                    if (!currentScene.sleepAffirmation.isNullOrBlank()) {
                        item {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp)),
                                colors = CardDefaults.cardColors(
                                    containerColor = Color(0xFF1E1538).copy(alpha = 0.9f)
                                ),
                                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFA855F7).copy(alpha = 0.6f)),
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.NightlightRound,
                                        contentDescription = null,
                                        tint = StarlightGold,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Text(
                                        text = currentScene.sleepAffirmation,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = Color(0xFFE2E8F0),
                                        fontStyle = FontStyle.Italic,
                                        fontSize = (13 * fontSizeMultiplier).sp,
                                        lineHeight = (18 * fontSizeMultiplier).sp
                                    )
                                }
                            }
                        }
                    }

                    // Choices / Navigation Actions
                    item {
                        Spacer(modifier = Modifier.height(10.dp))
                        if (currentScene.choices.isNotEmpty() && !isLastScene) {
                            Text(
                                text = "What should ${story.heroName} do next?",
                                style = MaterialTheme.typography.titleMedium,
                                color = StarlightGold,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(10.dp))

                            for (choice in currentScene.choices) {
                                Button(
                                    onClick = { onNextScene(choice.nextSceneId) },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp)
                                        .testTag("choice_${choice.id}"),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFF261E52)
                                    ),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF6366F1)),
                                    shape = RoundedCornerShape(14.dp)
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = 6.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = choice.text,
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = Color.White,
                                            fontWeight = FontWeight.Medium,
                                            fontSize = (14 * fontSizeMultiplier).sp,
                                            modifier = Modifier.weight(1f)
                                        )
                                        Icon(
                                            imageVector = Icons.Default.ArrowForward,
                                            contentDescription = null,
                                            tint = StarlightGold,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                            }
                        } else if (!isLastScene) {
                            Button(
                                onClick = { onNextScene(null) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp)
                                    .testTag("next_scene_button"),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFF6366F1)
                                ),
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Text(
                                    text = "Continue Journey",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Icon(Icons.Default.ArrowForward, contentDescription = null, tint = Color.White)
                            }
                        } else {
                            // Final Scene: Finish Bedtime Adventure
                            Button(
                                onClick = onCompleteStory,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(54.dp)
                                    .testTag("complete_story_button"),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFF10B981)
                                ),
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color.White)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Complete Story & Sleep Peacefully",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(40.dp))
                    }
                }
            }
        }
    }
}
