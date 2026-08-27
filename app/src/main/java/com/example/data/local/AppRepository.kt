package com.example.data.local

import com.example.data.BadgesData
import com.example.model.CelestialBadge
import com.example.model.DreamJournalEntry
import com.example.model.Story
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class AppRepository(private val dao: AppDao) {

    val savedStories: Flow<List<Story>> = dao.getAllSavedStories().map { list ->
        list.map { it.toStory() }
    }

    val dreamEntries: Flow<List<DreamJournalEntry>> = dao.getAllDreamEntries().map { list ->
        list.map { it.toEntry() }
    }

    val badges: Flow<List<CelestialBadge>> = dao.getAllBadges().map { list ->
        if (list.isEmpty()) {
            BadgesData.INITIAL_BADGES
        } else {
            list.map { it.toBadge() }
        }
    }

    suspend fun saveStory(story: Story) {
        dao.insertSavedStory(SavedStoryEntity.fromStory(story.copy(isSaved = true)))
    }

    suspend fun removeStory(id: String) {
        dao.deleteSavedStory(id)
    }

    suspend fun isStorySaved(id: String): Boolean {
        return dao.isStorySaved(id)
    }

    suspend fun addDreamEntry(entry: DreamJournalEntry) {
        dao.insertDreamEntry(DreamJournalEntity.fromEntry(entry))
    }

    suspend fun removeDreamEntry(id: String) {
        dao.deleteDreamEntry(id)
    }

    suspend fun seedInitialBadgesIfEmpty() {
        val initialEntities = BadgesData.INITIAL_BADGES.map { BadgeEntity.fromBadge(it) }
        dao.insertBadges(initialEntities)
    }

    suspend fun updateBadges(badgesList: List<CelestialBadge>) {
        dao.insertBadges(badgesList.map { BadgeEntity.fromBadge(it) })
    }
}
