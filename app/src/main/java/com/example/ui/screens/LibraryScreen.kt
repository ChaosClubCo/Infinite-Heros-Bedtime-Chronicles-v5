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
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.HeroesData
import com.example.model.AgeRange
import com.example.model.ContentTheme
import com.example.model.Story
import com.example.model.StorySeed
import com.example.theme.CardBorder
import com.example.theme.StarlightGold
import com.example.theme.SurfaceElevated
import com.example.ui.components.StoryCard

@Composable
fun LibraryScreen(
    featuredStories: List<Story>,
    storySeeds: List<StorySeed>,
    savedStories: List<Story>,
    onSelectStory: (Story) -> Unit,
    onSelectSeed: (StorySeed) -> Unit,
    onSaveToggle: (Story) -> Unit,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedThemeFilter by remember { mutableStateOf<ContentTheme?>(null) }
    var selectedAgeFilter by remember { mutableStateOf<AgeRange?>(null) }

    val filteredStories = featuredStories.filter { story ->
        val matchesQuery = searchQuery.isBlank() ||
                story.title.contains(searchQuery, ignoreCase = true) ||
                story.summary.contains(searchQuery, ignoreCase = true) ||
                story.heroName.contains(searchQuery, ignoreCase = true)
        val matchesTheme = selectedThemeFilter == null || story.theme == selectedThemeFilter
        val matchesAge = selectedAgeFilter == null || story.ageRange == selectedAgeFilter
        matchesQuery && matchesTheme && matchesAge
    }

    val filteredSeeds = storySeeds.filter { seed ->
        val matchesQuery = searchQuery.isBlank() ||
                seed.title.contains(searchQuery, ignoreCase = true) ||
                seed.blurb.contains(searchQuery, ignoreCase = true)
        val matchesTheme = selectedThemeFilter == null || seed.theme == selectedThemeFilter
        val matchesAge = selectedAgeFilter == null || seed.ageRange == selectedAgeFilter
        matchesQuery && matchesTheme && matchesAge
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("library_screen"),
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
                    text = "Bedtime Library",
                    style = MaterialTheme.typography.headlineMedium,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Explore classical bedtime fables & starlit story seeds",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF94A3B8),
                    fontSize = 13.sp
                )
            }
        }

        // Search Bar
        item {
            Box(modifier = Modifier.padding(horizontal = 20.dp)) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search stories, heroes, or topics...", color = Color(0xFF64748B), fontSize = 14.sp) },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = "Search", tint = StarlightGold)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("library_search_input"),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = StarlightGold,
                        unfocusedBorderColor = CardBorder,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    shape = RoundedCornerShape(16.dp)
                )
            }
        }

        // Filter Chips (Theme)
        item {
            Spacer(modifier = Modifier.height(14.dp))
            LazyRow(
                contentPadding = PaddingValues(horizontal = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    val isAll = selectedThemeFilter == null
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isAll) Color(0xFF6366F1) else SurfaceElevated)
                            .border(1.dp, if (isAll) StarlightGold else CardBorder, RoundedCornerShape(12.dp))
                            .clickable { selectedThemeFilter = null }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "All Themes",
                            color = if (isAll) Color.White else Color(0xFFCBD5E1),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                items(ContentTheme.entries.toList()) { theme ->
                    val isChosen = selectedThemeFilter == theme
                    val tColor = Color(theme.colorHex)
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isChosen) tColor.copy(alpha = 0.3f) else SurfaceElevated)
                            .border(1.dp, if (isChosen) tColor else CardBorder, RoundedCornerShape(12.dp))
                            .clickable { selectedThemeFilter = if (isChosen) null else theme }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = theme.displayName,
                            color = if (isChosen) Color.White else Color(0xFFCBD5E1),
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
            }
        }

        // Filter Chips (Age Range)
        item {
            Spacer(modifier = Modifier.height(8.dp))
            LazyRow(
                contentPadding = PaddingValues(horizontal = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    val isAll = selectedAgeFilter == null
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isAll) Color(0xFF261D4C) else SurfaceElevated)
                            .border(1.dp, if (isAll) Color(0xFFA855F7) else CardBorder, RoundedCornerShape(12.dp))
                            .clickable { selectedAgeFilter = null }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "All Ages",
                            color = if (isAll) Color.White else Color(0xFFCBD5E1),
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }

                items(AgeRange.entries.toList()) { age ->
                    val isChosen = selectedAgeFilter == age
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isChosen) Color(0xFF261D4C) else SurfaceElevated)
                            .border(1.dp, if (isChosen) Color(0xFFA855F7) else CardBorder, RoundedCornerShape(12.dp))
                            .clickable { selectedAgeFilter = if (isChosen) null else age }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = age.label,
                            color = if (isChosen) Color(0xFFCE93D8) else Color(0xFFCBD5E1),
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
            }
        }

        // Section 1: Featured Stories
        item {
            Spacer(modifier = Modifier.height(20.dp))
            Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                Text(
                    text = "Full Length Bedtime Stories (${filteredStories.size})",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
        }

        items(filteredStories) { story ->
            Box(modifier = Modifier.padding(horizontal = 20.dp, vertical = 6.dp)) {
                StoryCard(
                    story = story,
                    isSaved = savedStories.any { it.id == story.id },
                    onSaveToggle = { onSaveToggle(story) },
                    onClick = { onSelectStory(story) }
                )
            }
        }

        // Section 2: Story Seeds (Quick Launcher)
        item {
            Spacer(modifier = Modifier.height(24.dp))
            Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                Text(
                    text = "✨ Bedtime Story Seeds (${filteredSeeds.size})",
                    style = MaterialTheme.typography.titleMedium,
                    color = StarlightGold,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Tap any seed to weave an instant bedtime adventure",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF94A3B8)
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
        }

        items(filteredSeeds) { seed ->
            val hero = HeroesData.getHeroById(seed.suggestedHeroId)
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .clickable { onSelectSeed(seed) }
                    .testTag("story_seed_${seed.id}"),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFF151538)
                ),
                border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF6366F1).copy(alpha = 0.25f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = seed.emoji, fontSize = 22.sp)
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = seed.title,
                            style = MaterialTheme.typography.titleSmall,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = seed.blurb,
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFCBD5E1),
                            maxLines = 2,
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Row {
                            Text(
                                text = "Hero: ${hero.name} • ${seed.ageRange.label}",
                                style = MaterialTheme.typography.labelSmall,
                                color = StarlightGold,
                                fontSize = 10.sp
                            )
                        }
                    }

                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = "Launch",
                        tint = StarlightGold,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
        }
    }
}
