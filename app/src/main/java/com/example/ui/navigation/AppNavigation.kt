package com.example.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Create
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.HeroesData
import com.example.model.Story
import com.example.theme.CardBorder
import com.example.theme.LocalBedtimePalette
import com.example.theme.StarlightGold
import com.example.ui.components.DreamJournalDialog
import com.example.ui.components.NightlightModal
import com.example.ui.components.ParentGateDialog
import com.example.ui.components.StarrySkyBackground
import com.example.ui.screens.CompletionScreen
import com.example.ui.screens.DreamJournalScreen
import com.example.ui.screens.HomeScreen
import com.example.ui.screens.LibraryScreen
import com.example.ui.screens.SavedStoriesScreen
import com.example.ui.screens.SettingsScreen
import com.example.ui.screens.StoryCreatorScreen
import com.example.ui.screens.StoryReaderScreen
import com.example.ui.screens.TrophiesScreen
import com.example.viewmodel.BedtimeViewModel

@Composable
fun AppNavigation(
    viewModel: BedtimeViewModel,
    modifier: Modifier = Modifier
) {
    val palette = LocalBedtimePalette.current
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val savedStories by viewModel.savedStories.collectAsStateWithLifecycle()
    val dreamEntries by viewModel.dreamEntries.collectAsStateWithLifecycle()
    val badges by viewModel.badges.collectAsStateWithLifecycle()

    var showDreamDialog by remember { mutableStateOf(false) }
    var showParentGate by remember { mutableStateOf(false) }
    var isSettingsOpen by remember { mutableStateOf(false) }
    var isCompletedScreenActive by remember { mutableStateOf(false) }

    StarrySkyBackground {
        // Overlay 1: Active Story Reader
        if (uiState.activeStory != null && !isCompletedScreenActive) {
            val activeStory = uiState.activeStory!!
            StoryReaderScreen(
                story = activeStory,
                currentSceneIndex = uiState.currentSceneIndex,
                uiState = uiState,
                isSaved = savedStories.any { it.id == activeStory.id },
                onNextScene = { targetSceneId ->
                    viewModel.nextScene(targetSceneId)
                },
                onCompleteStory = {
                    viewModel.completeActiveStory()
                    isCompletedScreenActive = true
                },
                onToggleSave = {
                    viewModel.toggleSaveStory(activeStory)
                },
                onToggleNarration = {
                    viewModel.toggleNarration()
                },
                onToggleAmbient = {
                    viewModel.toggleAmbientSound()
                },
                onClose = {
                    viewModel.startStory(activeStory.copy(id = "")) // resets active story
                }
            )
            return@StarrySkyBackground
        }

        // Overlay 2: Completion Screen
        if (isCompletedScreenActive && uiState.activeStory != null) {
            val activeStory = uiState.activeStory!!
            CompletionScreen(
                story = activeStory,
                streakDays = uiState.stats.currentStreak,
                unlockedBadge = uiState.newlyUnlockedBadge,
                onSaveStory = {
                    viewModel.toggleSaveStory(activeStory)
                },
                onOpenDreamJournal = {
                    showDreamDialog = true
                },
                onOpenNightlight = {
                    viewModel.toggleNightlight(true)
                },
                onReturnHome = {
                    isCompletedScreenActive = false
                    viewModel.dismissBadgeCelebration()
                }
            )
            return@StarrySkyBackground
        }

        // Main App Scaffold with Navigation Bar
        Scaffold(
            modifier = modifier.fillMaxSize(),
            containerColor = Color.Transparent,
            bottomBar = {
                NavigationBar(
                    containerColor = if (palette.isDark) Color(0xFF0C0C27).copy(alpha = 0.95f) else Color(0xFFFFFFFF).copy(alpha = 0.98f),
                    contentColor = palette.textPrimary,
                    tonalElevation = 8.dp,
                    modifier = Modifier
                        .clip(RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp))
                        .border(1.dp, palette.cardBorder, RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp))
                ) {
                    val tabs = listOf(
                        Pair("home", Pair("Home", Icons.Default.Home)),
                        Pair("create", Pair("Create", Icons.Default.Create)),
                        Pair("library", Pair("Library", Icons.Default.MenuBook)),
                        Pair("saved", Pair("Saved", Icons.Default.Bookmark)),
                        Pair("trophies", Pair("Badges", Icons.Default.EmojiEvents))
                    )

                    for ((tabKey, pair) in tabs) {
                        val (label, icon) = pair
                        val isSelected = uiState.currentTab == tabKey && !isSettingsOpen
                        NavigationBarItem(
                            selected = isSelected,
                            onClick = {
                                isSettingsOpen = false
                                viewModel.setTab(tabKey)
                            },
                            icon = {
                                Icon(
                                    imageVector = icon,
                                    contentDescription = label,
                                    tint = if (isSelected) palette.accentGold else palette.textSecondary
                                )
                            },
                            label = {
                                Text(
                                    text = label,
                                    fontSize = 11.sp,
                                    color = if (isSelected) palette.accentGold else palette.textSecondary
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                indicatorColor = if (palette.isDark) Color(0xFF261D4C) else Color(0xFFE0E7FF)
                            ),
                            modifier = Modifier.testTag("nav_tab_$tabKey")
                        )
                    }
                }
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                if (isSettingsOpen) {
                    SettingsScreen(
                        uiState = uiState,
                        onSaveProfile = { name, age, gentleMode ->
                            viewModel.updateChildProfile(name, age, gentleMode)
                            isSettingsOpen = false
                        },
                        onSelectAmbientSound = { sound ->
                            viewModel.setAmbientSound(sound)
                        },
                        onUpdateSleepTimer = { mins ->
                            viewModel.updateSleepTimer(mins)
                        },
                        onToggleTheme = { isDark ->
                            viewModel.toggleDarkMode(isDark)
                        }
                    )
                } else {
                    when (uiState.currentTab) {
                        "home" -> {
                            HomeScreen(
                                uiState = uiState,
                                heroes = viewModel.heroes,
                                featuredStories = viewModel.featuredStories,
                                dreamThemes = viewModel.dreamThemes,
                                savedStories = savedStories,
                                onSelectStory = { story ->
                                    viewModel.startStory(story)
                                },
                                onSaveToggle = { story ->
                                    viewModel.toggleSaveStory(story)
                                },
                                onNavigateTab = { tab ->
                                    viewModel.setTab(tab)
                                },
                                onOpenNightlight = {
                                    viewModel.toggleNightlight(true)
                                },
                                onOpenDreamJournal = {
                                    showDreamDialog = true
                                },
                                onOpenSettings = {
                                    showParentGate = true
                                }
                            )
                        }
                        "create" -> {
                            StoryCreatorScreen(
                                uiState = uiState,
                                heroes = viewModel.heroes,
                                madlibTemplates = viewModel.madlibTemplates,
                                onGenerateStory = { heroId, theme, mode, ageRange, customPrompt, setting, sidekick ->
                                    viewModel.generateAndStartStory(heroId, theme, mode, ageRange, customPrompt, setting, sidekick)
                                },
                                onGenerateMadLib = { template, answers, heroId ->
                                    viewModel.generateMadLibStory(template, answers, heroId)
                                }
                            )
                        }
                        "library" -> {
                            LibraryScreen(
                                featuredStories = viewModel.featuredStories,
                                storySeeds = viewModel.storySeeds,
                                savedStories = savedStories,
                                onSelectStory = { story ->
                                    viewModel.startStory(story)
                                },
                                onSelectSeed = { seed ->
                                    val hero = HeroesData.getHeroById(seed.suggestedHeroId)
                                    viewModel.generateAndStartStory(
                                        heroId = hero.id,
                                        theme = seed.theme,
                                        mode = seed.mode,
                                        ageRange = seed.ageRange,
                                        customPrompt = seed.title,
                                        setting = seed.setting ?: "Peaceful Moonlit Meadow",
                                        sidekick = seed.sidekick ?: "Baby Dragon"
                                    )
                                },
                                onSaveToggle = { story ->
                                    viewModel.toggleSaveStory(story)
                                }
                            )
                        }
                        "saved" -> {
                            SavedStoriesScreen(
                                savedStories = savedStories,
                                onSelectStory = { story ->
                                    viewModel.startStory(story)
                                },
                                onRemoveSaved = { story ->
                                    viewModel.toggleSaveStory(story)
                                },
                                onNavigateTab = { tab ->
                                    viewModel.setTab(tab)
                                }
                            )
                        }
                        "trophies" -> {
                            TrophiesScreen(
                                badges = badges,
                                stats = uiState.stats
                            )
                        }
                        "journal" -> {
                            DreamJournalScreen(
                                dreamEntries = dreamEntries,
                                onAddNewEntry = { showDreamDialog = true },
                                onDeleteEntry = { id -> viewModel.deleteDreamEntry(id) }
                            )
                        }
                    }
                }
            }
        }

        // Nightlight Modal
        if (uiState.showNightlight) {
            NightlightModal(
                initialColorHex = uiState.nightlightColorHex,
                initialBrightness = uiState.nightlightBrightness,
                initialBreathing = uiState.nightlightBreathing,
                ambientSound = uiState.ambientSound,
                onDismiss = { viewModel.toggleNightlight(false) },
                onUpdateSettings = { colorHex, brightness, breathing ->
                    viewModel.updateNightlightSettings(colorHex, brightness, breathing)
                }
            )
        }

        // Dream Journal Dialog
        if (showDreamDialog) {
            DreamJournalDialog(
                onDismiss = { showDreamDialog = false },
                onSave = { title, content, mood, tags, rating ->
                    viewModel.addDreamEntry(title, content, mood, tags, rating)
                    showDreamDialog = false
                }
            )
        }

        // Parent Gate Challenge
        if (showParentGate) {
            ParentGateDialog(
                onDismiss = { showParentGate = false },
                onSuccess = {
                    showParentGate = false
                    isSettingsOpen = true
                }
            )
        }
    }
}
