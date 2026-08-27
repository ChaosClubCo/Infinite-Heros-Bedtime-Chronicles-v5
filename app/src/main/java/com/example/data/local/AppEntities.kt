package com.example.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import com.example.model.AgeRange
import com.example.model.AmbientSound
import com.example.model.CelestialBadge
import com.example.model.ContentTheme
import com.example.model.DreamJournalEntry
import com.example.model.Story
import com.example.model.StoryMode
import com.example.model.StoryScene
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Entity(tableName = "saved_stories")
data class SavedStoryEntity(
    @PrimaryKey val id: String,
    val title: String,
    val category: String,
    val theme: String,
    val mode: String,
    val ageRange: String,
    val heroId: String,
    val heroName: String,
    val summary: String,
    val badge: String?,
    val scenesJson: String,
    val isCustom: Boolean,
    val isSaved: Boolean,
    val completedAt: String?,
    val audioDurationMinutes: Int
) {
    fun toStory(): Story {
        val scenes: List<StoryScene> = try {
            Json.decodeFromString(scenesJson)
        } catch (_: Exception) {
            emptyList()
        }
        return Story(
            id = id,
            title = title,
            category = category,
            theme = try { ContentTheme.valueOf(theme) } catch (_: Exception) { ContentTheme.WONDER },
            mode = try { StoryMode.valueOf(mode) } catch (_: Exception) { StoryMode.CLASSIC },
            ageRange = try { AgeRange.valueOf(ageRange) } catch (_: Exception) { AgeRange.AGE_4_6 },
            heroId = heroId,
            heroName = heroName,
            summary = summary,
            badge = badge,
            scenes = scenes,
            isCustom = isCustom,
            isSaved = isSaved,
            completedAt = completedAt,
            audioDurationMinutes = audioDurationMinutes
        )
    }

    companion object {
        fun fromStory(story: Story): SavedStoryEntity {
            return SavedStoryEntity(
                id = story.id,
                title = story.title,
                category = story.category,
                theme = story.theme.name,
                mode = story.mode.name,
                ageRange = story.ageRange.name,
                heroId = story.heroId,
                heroName = story.heroName,
                summary = story.summary,
                badge = story.badge,
                scenesJson = Json.encodeToString(story.scenes),
                isCustom = story.isCustom,
                isSaved = story.isSaved,
                completedAt = story.completedAt,
                audioDurationMinutes = story.audioDurationMinutes
            )
        }
    }
}

@Entity(tableName = "dream_journal")
data class DreamJournalEntity(
    @PrimaryKey val id: String,
    val date: String,
    val title: String,
    val content: String,
    val mood: String,
    val tagsJson: String,
    val sleepRating: Int,
    val bedtimeStoryTitle: String?
) {
    fun toEntry(): DreamJournalEntry {
        val tags: List<String> = try {
            Json.decodeFromString(tagsJson)
        } catch (_: Exception) {
            emptyList()
        }
        return DreamJournalEntry(
            id = id,
            date = date,
            title = title,
            content = content,
            mood = mood,
            tags = tags,
            sleepRating = sleepRating,
            bedtimeStoryTitle = bedtimeStoryTitle
        )
    }

    companion object {
        fun fromEntry(entry: DreamJournalEntry): DreamJournalEntity {
            return DreamJournalEntity(
                id = entry.id,
                date = entry.date,
                title = entry.title,
                content = entry.content,
                mood = entry.mood,
                tagsJson = Json.encodeToString(entry.tags),
                sleepRating = entry.sleepRating,
                bedtimeStoryTitle = entry.bedtimeStoryTitle
            )
        }
    }
}

@Entity(tableName = "user_badges")
data class BadgeEntity(
    @PrimaryKey val id: String,
    val name: String,
    val description: String,
    val iconName: String,
    val colorHex: Long,
    val unlocked: Boolean,
    val unlockedAt: String?,
    val category: String
) {
    fun toBadge(): CelestialBadge {
        return CelestialBadge(
            id = id,
            name = name,
            description = description,
            iconName = iconName,
            colorHex = colorHex,
            unlocked = unlocked,
            unlockedAt = unlockedAt,
            category = category
        )
    }

    companion object {
        fun fromBadge(b: CelestialBadge): BadgeEntity {
            return BadgeEntity(
                id = b.id,
                name = b.name,
                description = b.description,
                iconName = b.iconName,
                colorHex = b.colorHex,
                unlocked = b.unlocked,
                unlockedAt = b.unlockedAt,
                category = b.category
            )
        }
    }
}
