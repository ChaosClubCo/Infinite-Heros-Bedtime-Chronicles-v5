package com.example.model

import kotlinx.serialization.Serializable

@Serializable
enum class StoryMode {
    CLASSIC,
    MADLIBS,
    SLEEP
}

@Serializable
enum class ContentTheme(val displayName: String, val colorHex: Long) {
    WONDER("Wonder & Stars", 0xFFB388FF),
    COURAGE("Brave Courage", 0xFFFFD54F),
    KINDNESS("Warm Kindness", 0xFF4DD0E1),
    FRIENDSHIP("True Friendship", 0xFFCE93D8),
    IMAGINATION("Silly Fun & Dreams", 0xFF90CAF9),
    COMFORT("Peaceful Sleep", 0xFFA5D6A7)
}

@Serializable
enum class AgeRange(val label: String) {
    AGE_2_4("Ages 2-4"),
    AGE_4_6("Ages 4-6"),
    AGE_6_8("Ages 6-8"),
    AGE_8_10("Ages 8-10")
}

@Serializable
enum class AmbientSound(val label: String) {
    OCEAN("Ocean Waves"),
    RAIN("Gentle Rain"),
    WIND("Night Breeze"),
    FIRE("Cozy Hearth"),
    TRAIN("Night Train"),
    CRICKETS("Night Crickets"),
    NONE("Quiet Stillness")
}

@Serializable
data class Hero(
    val id: String,
    val name: String,
    val title: String,
    val power: String,
    val description: String,
    val colorHex: Long,
    val constellation: String,
    val iconName: String = "shield"
)

@Serializable
data class StoryChoice(
    val id: String,
    val text: String,
    val action: String,
    val nextSceneId: String
)

@Serializable
data class StoryScene(
    val id: String,
    val sceneNumber: Int,
    val totalScenes: Int = 3,
    val text: String,
    val sleepAffirmation: String? = null,
    val choices: List<StoryChoice> = emptyList(),
    val isFinal: Boolean = false
)

@Serializable
data class Story(
    val id: String,
    val title: String,
    val category: String,
    val theme: ContentTheme,
    val mode: StoryMode,
    val ageRange: AgeRange,
    val heroId: String,
    val heroName: String,
    val summary: String,
    val badge: String? = null,
    val scenes: List<StoryScene> = emptyList(),
    val isCustom: Boolean = false,
    val isSaved: Boolean = false,
    val completedAt: String? = null,
    val audioDurationMinutes: Int = 8
)

@Serializable
data class StorySeed(
    val id: String,
    val title: String,
    val blurb: String,
    val theme: ContentTheme,
    val ageRange: AgeRange,
    val mode: StoryMode,
    val suggestedHeroId: String,
    val setting: String? = null,
    val tone: String? = null,
    val sidekick: String? = null,
    val emoji: String = "✨"
)

@Serializable
data class DreamTheme(
    val id: String,
    val title: String,
    val subtitle: String,
    val description: String,
    val duration: String,
    val ambientSound: AmbientSound,
    val sampleAffirmation: String,
    val category: String,
    val tag: String? = null
)

@Serializable
data class CelestialBadge(
    val id: String,
    val name: String,
    val description: String,
    val iconName: String,
    val colorHex: Long,
    val unlocked: Boolean,
    val unlockedAt: String? = null,
    val category: String = "explorer"
)

@Serializable
data class DreamJournalEntry(
    val id: String,
    val date: String,
    val title: String,
    val content: String,
    val mood: String, // "peaceful", "magical", "adventurous", "cozy"
    val tags: List<String>,
    val sleepRating: Int = 5,
    val bedtimeStoryTitle: String? = null
)

@Serializable
data class BedtimeAffirmation(
    val id: String,
    val phrase: String,
    val theme: String,
    val breathGuidance: String
)

@Serializable
data class ChildProfile(
    val id: String,
    val name: String,
    val age: Int,
    val avatar: String,
    val gentleMode: Boolean = true
)

@Serializable
data class AppSettings(
    val childName: String = "Little Explorer",
    val childAge: Int = 5,
    val childAvatar: String = "fox",
    val gentleMode: Boolean = true,
    val parentPin: String = "1234",
    val ambientSound: AmbientSound = AmbientSound.OCEAN,
    val ambientVolume: Float = 0.5f,
    val autoAdvance: Boolean = true,
    val sleepTimerMinutes: Int = 30,
    val narratorSpeed: String = "gentle"
)

@Serializable
data class UserStats(
    val storiesCompleted: Int = 2,
    val totalReadingMinutes: Int = 14,
    val currentStreak: Int = 3,
    val favoriteHeroId: String = "hero-1"
)

data class MadLibField(
    val key: String,
    val label: String,
    val placeholder: String,
    val suggestions: List<String>
)

data class MadLibTemplate(
    val id: String,
    val title: String,
    val suggestedHeroId: String,
    val fields: List<MadLibField>,
    val generateScenes: (answers: Map<String, String>, heroName: String) -> List<StoryScene>
)
