package com.example.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.data.AffirmationsData
import com.example.data.BadgesData
import com.example.data.DreamThemesData
import com.example.data.FeaturedStoriesData
import com.example.data.HeroesData
import com.example.data.MadLibsData
import com.example.data.StorySeedsData
import com.example.data.local.AppRepository
import com.example.model.AgeRange
import com.example.model.AmbientSound
import com.example.model.BedtimeAffirmation
import com.example.model.CelestialBadge
import com.example.model.ContentTheme
import com.example.model.DreamJournalEntry
import com.example.model.DreamTheme
import com.example.model.Hero
import com.example.model.MadLibTemplate
import com.example.model.Story
import com.example.model.StoryMode
import com.example.model.StoryScene
import com.example.model.StorySeed
import com.example.model.UserStats
import com.example.service.StoryGeneratorService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class BedtimeUiState(
    val currentTab: String = "home",
    val activeStory: Story? = null,
    val currentSceneIndex: Int = 0,
    val isNarrating: Boolean = true,
    val isAmbientSoundPlaying: Boolean = true,
    val ambientSound: AmbientSound = AmbientSound.OCEAN,
    val ambientVolume: Float = 0.5f,
    val sleepTimerMinutesRemaining: Int = 30,
    val isSleepTimerActive: Boolean = false,
    val childName: String = "Little Explorer",
    val childAge: Int = 5,
    val gentleMode: Boolean = true,
    val dailyAffirmation: BedtimeAffirmation = AffirmationsData.getDailyAffirmation(),
    val stats: UserStats = UserStats(),
    val newlyUnlockedBadge: CelestialBadge? = null,
    val showNightlight: Boolean = false,
    val nightlightColorHex: Long = 0xFFFFD54F,
    val nightlightBrightness: Float = 0.8f,
    val nightlightBreathing: Boolean = true
)

class BedtimeViewModel(private val repository: AppRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(BedtimeUiState())
    val uiState: StateFlow<BedtimeUiState> = _uiState.asStateFlow()

    val savedStories: StateFlow<List<Story>> = repository.savedStories
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val dreamEntries: StateFlow<List<DreamJournalEntry>> = repository.dreamEntries
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val badges: StateFlow<List<CelestialBadge>> = repository.badges
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), BadgesData.INITIAL_BADGES)

    val heroes: List<Hero> = HeroesData.HEROES
    val featuredStories: List<Story> = FeaturedStoriesData.FEATURED_STORIES
    val storySeeds: List<StorySeed> = StorySeedsData.STORY_SEEDS
    val dreamThemes: List<DreamTheme> = DreamThemesData.DREAM_THEMES
    val madlibTemplates: List<MadLibTemplate> = MadLibsData.MADLIBS_TEMPLATES

    init {
        viewModelScope.launch {
            repository.seedInitialBadgesIfEmpty()
        }
    }

    fun setTab(tab: String) {
        _uiState.value = _uiState.value.copy(currentTab = tab)
    }

    fun startStory(story: Story) {
        _uiState.value = _uiState.value.copy(
            activeStory = story,
            currentSceneIndex = 0,
            isNarrating = true,
            isAmbientSoundPlaying = true,
            newlyUnlockedBadge = null
        )
    }

    fun nextScene(targetSceneId: String? = null) {
        val story = _uiState.value.activeStory ?: return
        val currentIndex = _uiState.value.currentSceneIndex

        if (targetSceneId != null) {
            val foundIndex = story.scenes.indexOfFirst { it.id == targetSceneId }
            if (foundIndex != -1) {
                _uiState.value = _uiState.value.copy(currentSceneIndex = foundIndex)
                return
            }
        }

        if (currentIndex < story.scenes.size - 1) {
            _uiState.value = _uiState.value.copy(currentSceneIndex = currentIndex + 1)
        }
    }

    fun completeActiveStory() {
        val story = _uiState.value.activeStory ?: return
        val currentStats = _uiState.value.stats
        val newStats = currentStats.copy(
            storiesCompleted = currentStats.storiesCompleted + 1,
            totalReadingMinutes = currentStats.totalReadingMinutes + story.audioDurationMinutes,
            currentStreak = currentStats.currentStreak + 1
        )
        _uiState.value = _uiState.value.copy(stats = newStats)

        // Evaluate badge unlocks
        viewModelScope.launch {
            val (updatedBadges, newlyUnlocked) = BadgesData.evaluateUnlocks(story, badges.value, newStats)
            repository.updateBadges(updatedBadges)
            if (newlyUnlocked.isNotEmpty()) {
                _uiState.value = _uiState.value.copy(newlyUnlockedBadge = newlyUnlocked.first())
            }
        }
    }

    fun dismissBadgeCelebration() {
        _uiState.value = _uiState.value.copy(newlyUnlockedBadge = null)
    }

    fun toggleSaveStory(story: Story) {
        viewModelScope.launch {
            val isSaved = repository.isStorySaved(story.id)
            if (isSaved) {
                repository.removeStory(story.id)
            } else {
                repository.saveStory(story)
            }
        }
    }

    fun generateAndStartStory(
        heroId: String,
        theme: ContentTheme,
        mode: StoryMode,
        ageRange: AgeRange,
        customPrompt: String? = null,
        setting: String = "Cosmic Star Reef",
        sidekick: String = "Baby Dragon"
    ) {
        val story = StoryGeneratorService.generateStory(
            heroId = heroId,
            theme = theme,
            mode = mode,
            ageRange = ageRange,
            customPrompt = customPrompt,
            setting = setting,
            sidekick = sidekick,
            childName = _uiState.value.childName
        )
        startStory(story)
    }

    fun generateMadLibStory(
        template: MadLibTemplate,
        answers: Map<String, String>,
        heroId: String
    ) {
        val hero = HeroesData.getHeroById(heroId)
        val scenes = template.generateScenes(answers, hero.name)
        val story = Story(
            id = "madlib-${System.currentTimeMillis()}",
            title = template.title,
            category = "Mad Libs Fun",
            theme = ContentTheme.IMAGINATION,
            mode = StoryMode.MADLIBS,
            ageRange = AgeRange.AGE_4_6,
            heroId = hero.id,
            heroName = hero.name,
            summary = "A funny fill-in-the-blank bedtime tale starring ${hero.name}!",
            badge = "Mad Libs Tale",
            scenes = scenes,
            isCustom = true,
            audioDurationMinutes = 4
        )
        startStory(story)
    }

    fun addDreamEntry(
        title: String,
        content: String,
        mood: String,
        tags: List<String>,
        sleepRating: Int
    ) {
        viewModelScope.launch {
            val entry = DreamJournalEntry(
                id = "dream-${System.currentTimeMillis()}",
                date = "Tonight",
                title = title.ifBlank { "Bedtime Starlight Dream" },
                content = content,
                mood = mood,
                tags = tags,
                sleepRating = sleepRating,
                bedtimeStoryTitle = _uiState.value.activeStory?.title
            )
            repository.addDreamEntry(entry)
        }
    }

    fun deleteDreamEntry(id: String) {
        viewModelScope.launch {
            repository.removeDreamEntry(id)
        }
    }

    fun updateChildProfile(name: String, age: Int, gentleMode: Boolean) {
        _uiState.value = _uiState.value.copy(
            childName = name,
            childAge = age,
            gentleMode = gentleMode
        )
    }

    fun setAmbientSound(sound: AmbientSound) {
        _uiState.value = _uiState.value.copy(ambientSound = sound)
    }

    fun toggleNarration() {
        _uiState.value = _uiState.value.copy(isNarrating = !_uiState.value.isNarrating)
    }

    fun toggleAmbientSound() {
        _uiState.value = _uiState.value.copy(isAmbientSoundPlaying = !_uiState.value.isAmbientSoundPlaying)
    }

    fun toggleNightlight(show: Boolean? = null) {
        val current = _uiState.value.showNightlight
        _uiState.value = _uiState.value.copy(showNightlight = show ?: !current)
    }

    fun updateNightlightSettings(colorHex: Long, brightness: Float, breathing: Boolean) {
        _uiState.value = _uiState.value.copy(
            nightlightColorHex = colorHex,
            nightlightBrightness = brightness,
            nightlightBreathing = breathing
        )
    }

    fun updateSleepTimer(minutes: Int) {
        _uiState.value = _uiState.value.copy(
            sleepTimerMinutesRemaining = minutes,
            isSleepTimerActive = minutes > 0
        )
    }

    class Factory(private val repository: AppRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return BedtimeViewModel(repository) as T
        }
    }
}
