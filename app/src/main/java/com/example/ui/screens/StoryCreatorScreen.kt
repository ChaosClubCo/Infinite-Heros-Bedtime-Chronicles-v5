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
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bedtime
import androidx.compose.material.icons.filled.Create
import androidx.compose.material.icons.filled.EmojiEmotions
import androidx.compose.material.icons.filled.Nightlight
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Waves
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.AgeRange
import com.example.model.AmbientSound
import com.example.model.ContentTheme
import com.example.model.Hero
import com.example.model.MadLibTemplate
import com.example.model.StoryMode
import com.example.theme.CardBorder
import com.example.theme.StarlightGold
import com.example.theme.SurfaceElevated
import com.example.ui.components.HeroCard
import com.example.ui.components.SleepDurationCard
import com.example.viewmodel.BedtimeUiState

@Composable
fun StoryCreatorScreen(
    uiState: BedtimeUiState,
    heroes: List<Hero>,
    madlibTemplates: List<MadLibTemplate>,
    onGenerateStory: (heroId: String, theme: ContentTheme, mode: StoryMode, ageRange: AgeRange, customPrompt: String?, setting: String, sidekick: String) -> Unit,
    onGenerateMadLib: (template: MadLibTemplate, answers: Map<String, String>, heroId: String) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedTab by remember { mutableIntStateOf(0) } // 0 = Classic, 1 = MadLibs, 2 = Sleep
    var selectedHeroId by remember { mutableStateOf(heroes.firstOrNull()?.id ?: "hero-1") }
    var selectedTheme by remember { mutableStateOf(ContentTheme.WONDER) }
    var selectedAgeRange by remember { mutableStateOf(AgeRange.AGE_4_6) }
    var customPrompt by remember { mutableStateOf("") }
    var selectedSetting by remember { mutableStateOf("Peaceful Moonlit Meadow") }
    var selectedSidekick by remember { mutableStateOf("Baby Dragon") }
    var selectedAmbient by remember { mutableStateOf(AmbientSound.OCEAN) }

    // Madlibs state
    var selectedTemplateIndex by remember { mutableIntStateOf(0) }
    val currentTemplate = madlibTemplates.getOrElse(selectedTemplateIndex) { madlibTemplates.first() }
    val madlibAnswers = remember { mutableStateMapOf<String, String>() }

    val settingsList = listOf(
        "Peaceful Moonlit Meadow",
        "Stardust Archipelago",
        "Whispering Pine Forest",
        "Golden Cloud Kingdom",
        "Glittering Crystal Cavern"
    )

    val sidekicksList = listOf(
        "Baby Dragon",
        "Sleepy Barn Owl",
        "Star Turtle",
        "Pajama Bunny",
        "Glowing Firefly"
    )

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("story_creator_screen"),
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
                    text = "Story Weaver Studio",
                    style = MaterialTheme.typography.headlineMedium,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Craft personalized bedtime tales & calming sleep journeys",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF94A3B8),
                    fontSize = 13.sp
                )
            }
        }

        // Mode Tabs (Classic, Mad Libs, Sleep Journey)
        item {
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color(0xFF131338),
                contentColor = StarlightGold,
                indicator = { tabPositions ->
                    TabRowDefaults.SecondaryIndicator(
                        Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                        color = StarlightGold,
                        height = 3.dp
                    )
                },
                modifier = Modifier
                    .padding(horizontal = 20.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .border(1.dp, CardBorder, RoundedCornerShape(14.dp))
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Create, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Classic Quest", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    },
                    modifier = Modifier.testTag("tab_classic_mode")
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.EmojiEmotions, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Mad Libs", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    },
                    modifier = Modifier.testTag("tab_madlibs_mode")
                )
                Tab(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Nightlight, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Sleep Journey", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    },
                    modifier = Modifier.testTag("tab_sleep_mode")
                )
            }
        }

        // TAB CONTENT: Mad Libs Fun Mode
        if (selectedTab == 1) {
            item {
                Spacer(modifier = Modifier.height(20.dp))
                Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                    Text(
                        text = "1. Choose Mad Libs Story Template",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(madlibTemplates.indices.toList()) { index ->
                            val template = madlibTemplates[index]
                            val isChosen = selectedTemplateIndex == index
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isChosen) Color(0xFF6366F1) else SurfaceElevated)
                                    .border(1.dp, if (isChosen) StarlightGold else CardBorder, RoundedCornerShape(12.dp))
                                    .clickable { selectedTemplateIndex = index }
                                    .padding(horizontal = 14.dp, vertical = 10.dp)
                            ) {
                                Text(
                                    text = template.title,
                                    color = if (isChosen) Color.White else Color(0xFFCBD5E1),
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    Text(
                        text = "2. Fill In The Silly Blanks",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Tap a suggestion or type your own funny words:",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF94A3B8)
                    )
                }
            }

            items(currentTemplate.fields) { field ->
                val currentValue = madlibAnswers[field.key] ?: ""
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = field.label,
                        style = MaterialTheme.typography.labelLarge,
                        color = StarlightGold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = currentValue,
                        onValueChange = { madlibAnswers[field.key] = it },
                        placeholder = { Text(field.placeholder, color = Color(0xFF64748B), fontSize = 13.sp) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("madlib_field_${field.key}"),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = StarlightGold,
                            unfocusedBorderColor = CardBorder,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    // Suggestion pills
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(field.suggestions) { suggestion ->
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF1E1B4B))
                                    .border(1.dp, Color(0xFF4338CA), RoundedCornerShape(8.dp))
                                    .clickable { madlibAnswers[field.key] = suggestion }
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = "+ $suggestion",
                                    color = Color(0xFFCE93D8),
                                    style = MaterialTheme.typography.labelSmall,
                                    fontSize = 10.sp
                                )
                            }
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
                Box(modifier = Modifier.padding(horizontal = 20.dp)) {
                    Button(
                        onClick = {
                            onGenerateMadLib(currentTemplate, madlibAnswers.toMap(), selectedHeroId)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp)
                            .testTag("generate_madlibs_button"),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = StarlightGold)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Create Silly Mad Libs Story!",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        } else {
            // TAB CONTENT: Classic Quest & Sleep Journey Modes

            // 1. Choose Hero
            item {
                Spacer(modifier = Modifier.height(20.dp))
                Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                    Text(
                        text = "1. Choose Your Bedtime Hero",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(heroes) { hero ->
                            val isChosen = selectedHeroId == hero.id
                            val heroColor = Color(hero.colorHex)
                            Box(
                                modifier = Modifier
                                    .width(130.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(if (isChosen) SurfaceElevated else Color(0xFF131338))
                                    .border(if (isChosen) 2.dp else 1.dp, if (isChosen) heroColor else CardBorder, RoundedCornerShape(16.dp))
                                    .clickable { selectedHeroId = hero.id }
                                    .padding(12.dp)
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Box(
                                        modifier = Modifier
                                            .size(40.dp)
                                            .clip(CircleShape)
                                            .background(heroColor.copy(alpha = 0.2f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(text = "✨", fontSize = 18.sp)
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = hero.name,
                                        style = MaterialTheme.typography.labelLarge,
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = hero.title,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = heroColor,
                                        fontSize = 9.sp,
                                        maxLines = 1
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 2. Select Theme & Age
            item {
                Spacer(modifier = Modifier.height(20.dp))
                Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                    Text(
                        text = "2. Story Theme & Age Range",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(ContentTheme.entries.toList()) { theme ->
                            val isChosen = selectedTheme == theme
                            val tColor = Color(theme.colorHex)
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isChosen) tColor.copy(alpha = 0.3f) else SurfaceElevated)
                                    .border(1.dp, if (isChosen) tColor else CardBorder, RoundedCornerShape(12.dp))
                                    .clickable { selectedTheme = theme }
                                    .padding(horizontal = 12.dp, vertical = 8.dp)
                            ) {
                                Text(
                                    text = theme.displayName,
                                    color = if (isChosen) Color.White else Color(0xFFCBD5E1),
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(AgeRange.entries.toList()) { age ->
                            val isChosen = selectedAgeRange == age
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isChosen) Color(0xFF6366F1) else SurfaceElevated)
                                    .border(1.dp, if (isChosen) StarlightGold else CardBorder, RoundedCornerShape(12.dp))
                                    .clickable { selectedAgeRange = age }
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = age.label,
                                    color = if (isChosen) Color.White else Color(0xFFCBD5E1),
                                    style = MaterialTheme.typography.labelSmall
                                )
                            }
                        }
                    }
                }
            }

            // 3. Custom Story Idea (Optional)
            item {
                Spacer(modifier = Modifier.height(20.dp))
                Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                    Text(
                        text = "3. Story Idea or Special Prompt (Optional)",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = customPrompt,
                        onValueChange = { customPrompt = it },
                        placeholder = { Text("e.g. Finding the lost rainbow key, Building a star bridge", color = Color(0xFF64748B), fontSize = 13.sp) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("custom_story_prompt_input"),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = StarlightGold,
                            unfocusedBorderColor = CardBorder,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )
                }
            }

            // 4. Magical Setting & Sleepy Companion
            item {
                Spacer(modifier = Modifier.height(20.dp))
                Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                    Text(
                        text = "4. Magical Setting & Sleep Companion",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(settingsList) { setting ->
                            val isChosen = selectedSetting == setting
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isChosen) Color(0xFF261D4C) else SurfaceElevated)
                                    .border(1.dp, if (isChosen) StarlightGold else CardBorder, RoundedCornerShape(12.dp))
                                    .clickable { selectedSetting = setting }
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = setting,
                                    color = if (isChosen) StarlightGold else Color(0xFFCBD5E1),
                                    style = MaterialTheme.typography.labelSmall
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(sidekicksList) { sidekick ->
                            val isChosen = selectedSidekick == sidekick
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isChosen) Color(0xFF132042) else SurfaceElevated)
                                    .border(1.dp, if (isChosen) Color(0xFF38BDF8) else CardBorder, RoundedCornerShape(12.dp))
                                    .clickable { selectedSidekick = sidekick }
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = "🐾 $sidekick",
                                    color = if (isChosen) Color(0xFF38BDF8) else Color(0xFFCBD5E1),
                                    style = MaterialTheme.typography.labelSmall
                                )
                            }
                        }
                    }
                }
            }

            // 5. Projected Sleep Duration & Wind-Down Estimator
            item {
                Spacer(modifier = Modifier.height(24.dp))
                Box(modifier = Modifier.padding(horizontal = 20.dp)) {
                    SleepDurationCard(
                        storyDurationMinutes = if (selectedTab == 2) 8 else 5,
                        ambientTimerMinutes = 30
                    )
                }
            }

            // 6. Action Button
            item {
                Spacer(modifier = Modifier.height(24.dp))
                Box(modifier = Modifier.padding(horizontal = 20.dp)) {
                    Button(
                        onClick = {
                            val mode = if (selectedTab == 2) StoryMode.SLEEP else StoryMode.CLASSIC
                            onGenerateStory(
                                selectedHeroId,
                                selectedTheme,
                                mode,
                                selectedAgeRange,
                                customPrompt.ifBlank { null },
                                selectedSetting,
                                selectedSidekick
                            )
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp)
                            .testTag("generate_story_button"),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF6366F1)
                        ),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = null,
                            tint = StarlightGold
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (selectedTab == 2) "Begin Guided Sleep Journey" else "Weave Bedtime Adventure",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
