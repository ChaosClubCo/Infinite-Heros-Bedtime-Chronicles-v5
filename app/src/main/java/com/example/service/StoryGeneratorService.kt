package com.example.service

import com.example.data.HeroesData
import com.example.model.AgeRange
import com.example.model.ContentTheme
import com.example.model.Story
import com.example.model.StoryChoice
import com.example.model.StoryMode
import com.example.model.StoryScene

object StoryGeneratorService {

    fun generateStory(
        heroId: String,
        theme: ContentTheme,
        mode: StoryMode,
        ageRange: AgeRange,
        customPrompt: String? = null,
        setting: String = "Cosmic Star Reef",
        sidekick: String = "Baby Dragon",
        childName: String = "Little Explorer"
    ): Story {
        val hero = HeroesData.getHeroById(heroId)
        val timestamp = System.currentTimeMillis()
        val titleThemeWords = when (theme) {
            ContentTheme.COURAGE -> listOf("The Brave Constellation", "Shield of the Midnight Sky", "The Golden Star Spark")
            ContentTheme.KINDNESS -> listOf("The Warm Starlight Gift", "Waves of Gentleness", "The Shared Moonbeam")
            ContentTheme.FRIENDSHIP -> listOf("Bridge Across the Stars", "The Cosmic Playmates", "Tale of Two Moons")
            ContentTheme.WONDER -> listOf("The Secret Nebula Bloom", "Chimes of the Aurora", "The Sparkling Horizon")
            ContentTheme.IMAGINATION -> listOf("The Cloud Castle Journey", "Colors of the Velvet Sky", "The Whimsical Comet")
            ContentTheme.COMFORT -> listOf("The Sleepy Stardust Blanket", "Cradle of the Moon", "The Dreamland Express")
        }

        val baseTitle = if (!customPrompt.isNullOrBlank()) {
            "${hero.name} and $customPrompt"
        } else {
            "${hero.name} and ${titleThemeWords.random()}"
        }

        if (mode == StoryMode.SLEEP) {
            return Story(
                id = "story-$timestamp",
                title = baseTitle,
                category = "Sleep Journey",
                theme = theme,
                mode = StoryMode.SLEEP,
                ageRange = ageRange,
                heroId = hero.id,
                heroName = hero.name,
                summary = "A soothing, rhythmic bedtime meditation where ${hero.name} guides $childName into quiet relaxation and sweet starlit slumber.",
                badge = "Sleep Journey",
                isCustom = true,
                audioDurationMinutes = 6,
                scenes = listOf(
                    StoryScene(
                        id = "scene-1",
                        sceneNumber = 1,
                        totalScenes = 3,
                        text = "The evening sky is turning a deep, comforting velvet indigo. ${hero.name} floats down on a gentle beam of starlight and smiles warmly at $childName. '${hero.power} is here to keep you safe and peaceful tonight,' ${hero.name} whispers softly. Take a deep, gentle breath in... and slowly let it go.",
                        sleepAffirmation = "Inhale calm peace... Exhale and feel completely safe.",
                        choices = listOf(
                            StoryChoice(
                                id = "ch-1",
                                text = "Drift together with ${hero.name} into the $setting",
                                action = "drift_setting",
                                nextSceneId = "scene-2"
                            )
                        )
                    ),
                    StoryScene(
                        id = "scene-2",
                        sceneNumber = 2,
                        totalScenes = 3,
                        text = "In the quiet stillness of the $setting, every blade of grass is dusted with warm silver moonlight. $sidekick cuddles up close, humming a slow, rhythmic lullaby. Feel your eyelids growing heavy and soft, like feathers settling on warm velvet cushions.",
                        sleepAffirmation = "Every thought is slowing down into deep stillness.",
                        choices = listOf(
                            StoryChoice(
                                id = "ch-2",
                                text = "Weave the soft blanket of starlight over your bed",
                                action = "starlight_blanket",
                                nextSceneId = "scene-3"
                            )
                        )
                    ),
                    StoryScene(
                        id = "scene-3",
                        sceneNumber = 3,
                        totalScenes = 3,
                        isFinal = true,
                        text = "${hero.name} gently wraps a glowing blanket of moonbeams around $childName. The stars outside your window blink with sleepy love. 'You are brave, you are kind, and you are loved,' ${hero.name} murmurs into the peaceful night. 'Rest deeply now. Goodnight, little dreamer.'",
                        sleepAffirmation = "You are deeply relaxed, safe, and ready for beautiful dreams."
                    )
                )
            )
        }

        // Classic interactive mode
        return Story(
            id = "story-$timestamp",
            title = baseTitle,
            category = theme.displayName,
            theme = theme,
            mode = StoryMode.CLASSIC,
            ageRange = ageRange,
            heroId = hero.id,
            heroName = hero.name,
            summary = "${hero.name} and $sidekick explore the magical $setting on a quest of ${theme.displayName} and wonder.",
            badge = "Custom Quest",
            isCustom = true,
            audioDurationMinutes = 5,
            scenes = listOf(
                StoryScene(
                    id = "scene-1",
                    sceneNumber = 1,
                    totalScenes = 4,
                    text = "Underneath a sky full of dancing constellations, ${hero.name} and $sidekick discovered a mysterious glowing path winding through the $setting. A soft shimmering crystal beacon was asking for help to light up the night!",
                    sleepAffirmation = "Feel your body relaxing as the adventure begins.",
                    choices = listOf(
                        StoryChoice(
                            id = "ch-1a",
                            text = "Use ${hero.power} to illuminate the starlit trail",
                            action = "use_power",
                            nextSceneId = "scene-2a"
                        ),
                        StoryChoice(
                            id = "ch-1b",
                            text = "Ask $sidekick to lead the way with a cheerful bedtime song",
                            action = "sing_song",
                            nextSceneId = "scene-2b"
                        )
                    )
                ),
                StoryScene(
                    id = "scene-2a",
                    sceneNumber = 2,
                    totalScenes = 4,
                    text = "${hero.name} activated ${hero.power}! A dazzling wave of gentle light shimmered across the ground, revealing hidden stepping stones of sparkling moon-glass. Friendly night creatures cheered with quiet delight!",
                    sleepAffirmation = "Kindness and courage light up every shadow.",
                    choices = listOf(
                        StoryChoice(
                            id = "ch-2a-next",
                            text = "Step across the moon-glass to the Celestial Heart",
                            action = "cross_bridge",
                            nextSceneId = "scene-3"
                        )
                    )
                ),
                StoryScene(
                    id = "scene-2b",
                    sceneNumber = 2,
                    totalScenes = 4,
                    text = "$sidekick chirped a melodious nighttime tune. As the song echoed through the $setting, glowing fireflies gathered together, forming an archway of pure golden light to guide the way safely.",
                    sleepAffirmation = "Harmony and friendship make every journey sweet.",
                    choices = listOf(
                        StoryChoice(
                            id = "ch-2b-next",
                            text = "Walk beneath the archway toward the peaceful center",
                            action = "walk_archway",
                            nextSceneId = "scene-3"
                        )
                    )
                ),
                StoryScene(
                    id = "scene-3",
                    sceneNumber = 3,
                    totalScenes = 4,
                    text = "At the center stood the Great Dream Star. With a gentle touch of warmth, ${hero.name} and $childName restored its golden glow. A slow, warm wave of bedtime magic cascaded across the universe, turning every night sky into a cozy cradle.",
                    sleepAffirmation = "Peace and warmth surround you everywhere.",
                    choices = listOf(
                        StoryChoice(
                            id = "ch-3-final",
                            text = "Cuddle into bed under the glowing Dream Star",
                            action = "cuddle_bed",
                            nextSceneId = "scene-4"
                        )
                    )
                ),
                StoryScene(
                    id = "scene-4",
                    sceneNumber = 4,
                    totalScenes = 4,
                    isFinal = true,
                    text = "${hero.name} watched with a proud and gentle smile as the stars settled into place. 'You did wonderfully today, $childName,' said ${hero.name}. 'Now let your eyes rest and let your dreams soar among the constellations.'",
                    sleepAffirmation = "Sleep tight, sweet dreams, and rest peacefully tonight."
                )
            )
        )
    }
}
