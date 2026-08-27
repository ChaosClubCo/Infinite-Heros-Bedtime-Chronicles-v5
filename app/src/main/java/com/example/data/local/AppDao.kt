package com.example.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface AppDao {

    // Saved Stories
    @Query("SELECT * FROM saved_stories ORDER BY id DESC")
    fun getAllSavedStories(): Flow<List<SavedStoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSavedStory(story: SavedStoryEntity)

    @Query("DELETE FROM saved_stories WHERE id = :id")
    suspend fun deleteSavedStory(id: String)

    @Query("SELECT EXISTS(SELECT 1 FROM saved_stories WHERE id = :id)")
    suspend fun isStorySaved(id: String): Boolean

    // Dream Journal
    @Query("SELECT * FROM dream_journal ORDER BY date DESC, id DESC")
    fun getAllDreamEntries(): Flow<List<DreamJournalEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDreamEntry(entry: DreamJournalEntity)

    @Query("DELETE FROM dream_journal WHERE id = :id")
    suspend fun deleteDreamEntry(id: String)

    // Badges
    @Query("SELECT * FROM user_badges")
    fun getAllBadges(): Flow<List<BadgeEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBadges(badges: List<BadgeEntity>)

    @Query("UPDATE user_badges SET unlocked = 1, unlockedAt = :unlockedAt WHERE id = :id")
    suspend fun unlockBadge(id: String, unlockedAt: String)
}
