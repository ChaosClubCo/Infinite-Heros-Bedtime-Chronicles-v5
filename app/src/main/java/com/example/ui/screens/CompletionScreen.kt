package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Create
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.NightlightRound
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.CelestialBadge
import com.example.model.Story
import com.example.theme.CardBorder
import com.example.theme.StarlightGold
import com.example.theme.SurfaceElevated

@Composable
fun CompletionScreen(
    story: Story,
    streakDays: Int,
    unlockedBadge: CelestialBadge?,
    onSaveStory: () -> Unit,
    onOpenDreamJournal: () -> Unit,
    onOpenNightlight: () -> Unit,
    onReturnHome: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF07071A))
            .testTag("completion_screen")
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(20.dp))

            // Glowing Celestial Moon Icon
            Box(
                modifier = Modifier
                    .size(90.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            listOf(StarlightGold.copy(alpha = 0.4f), Color(0xFF6366F1).copy(alpha = 0.1f))
                        )
                    )
                    .border(2.dp, StarlightGold, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "🌙", fontSize = 42.sp)
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Sweet Dreams, Little Hero!",
                style = MaterialTheme.typography.headlineMedium,
                color = Color.White,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "You completed “${story.title}”",
                style = MaterialTheme.typography.bodyMedium,
                color = StarlightGold,
                fontSize = 14.sp
            )

            // Newly Unlocked Badge Banner
            if (unlockedBadge != null) {
                Spacer(modifier = Modifier.height(20.dp))
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp)),
                    colors = CardDefaults.cardColors(
                        containerColor = Color(0xFF261D4C)
                    ),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(unlockedBadge.colorHex)),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(Color(unlockedBadge.colorHex).copy(alpha = 0.25f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.EmojiEvents,
                                contentDescription = null,
                                tint = Color(unlockedBadge.colorHex),
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "✨ NEW BADGE UNLOCKED!",
                                style = MaterialTheme.typography.labelSmall,
                                color = StarlightGold,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = unlockedBadge.name,
                                style = MaterialTheme.typography.titleMedium,
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = unlockedBadge.description,
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFCBD5E1)
                            )
                        }
                    }
                }
            }

            // Streak & Progress Card
            Spacer(modifier = Modifier.height(20.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.LocalFireDepartment,
                            contentDescription = null,
                            tint = Color(0xFFFB923C),
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "$streakDays Days",
                            style = MaterialTheme.typography.titleMedium,
                            color = StarlightGold,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Bedtime Streak",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF94A3B8)
                        )
                    }
                }

                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.Schedule,
                            contentDescription = null,
                            tint = Color(0xFF38BDF8),
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "+${story.audioDurationMinutes} Mins",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color(0xFF38BDF8),
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Peaceful Rest",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF94A3B8)
                        )
                    }
                }
            }

            // Action Buttons
            Spacer(modifier = Modifier.height(28.dp))

            Button(
                onClick = onOpenNightlight,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .testTag("completion_open_nightlight"),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.NightlightRound, contentDescription = null, tint = StarlightGold)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Turn On Soothing Nightlight",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Button(
                onClick = onOpenDreamJournal,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .testTag("completion_open_dream_journal"),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF261D4C)),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFA855F7)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.Create, contentDescription = null, tint = Color(0xFFCE93D8))
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Record in Dream Journal",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedButton(
                onClick = onSaveStory,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .testTag("completion_save_story"),
                border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.Bookmark, contentDescription = null, tint = StarlightGold)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Save Story to Favorites",
                    color = Color.White,
                    fontWeight = FontWeight.Medium
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Button(
                onClick = onReturnHome,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .testTag("completion_return_home"),
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.Home, contentDescription = null, tint = Color(0xFF94A3B8))
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Return to Bedtime Home",
                    color = Color(0xFF94A3B8),
                    fontWeight = FontWeight.Medium
                )
            }

            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}
