package com.example.data

import com.example.model.CelestialBadge
import com.example.model.ContentTheme
import com.example.model.Story
import com.example.model.StoryMode
import com.example.model.UserStats

object BadgesData {
    val INITIAL_BADGES: List<CelestialBadge> = listOf(
        CelestialBadge(
            id = "badge-first-star",
            name = "First Star",
            description = "Completed your very first bedtime adventure!",
            iconName = "sparkles",
            colorHex = 0xFFF59E0B,
            unlocked = true,
            unlockedAt = "Today",
            category = "starter"
        ),
        CelestialBadge(
            id = "badge-courage",
            name = "Shield of Courage",
            description = "Ventured through a courage story with Nova or Nimbus",
            iconName = "shield",
            colorHex = 0xFF6366F1,
            unlocked = true,
            unlockedAt = "Today",
            category = "theme"
        ),
        CelestialBadge(
            id = "badge-kindness",
            name = "Ocean of Kindness",
            description = "Shared kindness across a story with Coral or Bloom",
            iconName = "heart",
            colorHex = 0xFFEC4899,
            unlocked = false,
            category = "theme"
        ),
        CelestialBadge(
            id = "badge-dream-weaver",
            name = "Master Dream Weaver",
            description = "Listened to soothing sleep journeys with Luna",
            iconName = "moon",
            colorHex = 0xFFA855F7,
            unlocked = false,
            category = "explorer"
        ),
        CelestialBadge(
            id = "badge-night-conductor",
            name = "Night Train Pass",
            description = "Rode the Star Mountain Express with Whistle",
            iconName = "train",
            colorHex = 0xFF38BDF8,
            unlocked = false,
            category = "explorer"
        ),
        CelestialBadge(
            id = "badge-streak-3",
            name = "Starlight Streak (3 Days)",
            description = "Enjoyed bedtime reading 3 nights in a row",
            iconName = "flame",
            colorHex = 0xFFFB923C,
            unlocked = true,
            unlockedAt = "Today",
            category = "streak"
        ),
        CelestialBadge(
            id = "badge-madlibs-master",
            name = "Giggle Alchemist",
            description = "Crafted a hilarious Mad Libs bedtime story",
            iconName = "laugh",
            colorHex = 0xFF10B981,
            unlocked = false,
            category = "explorer"
        ),
        CelestialBadge(
            id = "badge-constellation",
            name = "Celestial Map",
            description = "Explored stories from all bedtime heroes",
            iconName = "compass",
            colorHex = 0xFF8B5CF6,
            unlocked = false,
            category = "explorer"
        )
    )

    fun evaluateUnlocks(
        story: Story,
        currentBadges: List<CelestialBadge>,
        stats: UserStats
    ): Pair<List<CelestialBadge>, List<CelestialBadge>> {
        val updated = currentBadges.toMutableList()
        val newlyUnlocked = mutableListOf<CelestialBadge>()

        fun unlock(id: String) {
            val idx = updated.indexOfFirst { it.id == id }
            if (idx != -1 && !updated[idx].unlocked) {
                val b = updated[idx].copy(unlocked = true, unlockedAt = "Just now")
                updated[idx] = b
                newlyUnlocked.add(b)
            }
        }

        val newCount = stats.storiesCompleted + 1
        if (newCount >= 1) unlock("badge-first-star")
        if (story.theme == ContentTheme.COURAGE || story.heroId == "hero-1" || story.heroId == "hero-5") {
            unlock("badge-courage")
        }
        if (story.theme == ContentTheme.KINDNESS || story.heroId == "hero-2" || story.heroId == "hero-6") {
            unlock("badge-kindness")
        }
        if (story.mode == StoryMode.SLEEP || story.heroId == "hero-4") {
            unlock("badge-dream-weaver")
        }
        if (story.heroId == "hero-7") {
            unlock("badge-night-conductor")
        }
        if (story.mode == StoryMode.MADLIBS) {
            unlock("badge-madlibs-master")
        }
        if (newCount >= 3 || stats.currentStreak >= 3) {
            unlock("badge-streak-3")
        }
        if (newCount >= 5) {
            unlock("badge-constellation")
        }

        return Pair(updated, newlyUnlocked)
    }
}
