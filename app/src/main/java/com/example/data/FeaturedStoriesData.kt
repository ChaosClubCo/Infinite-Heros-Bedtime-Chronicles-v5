package com.example.data

import com.example.model.AgeRange
import com.example.model.ContentTheme
import com.example.model.Story
import com.example.model.StoryChoice
import com.example.model.StoryMode
import com.example.model.StoryScene

object FeaturedStoriesData {
    val FEATURED_STORIES: List<Story> = listOf(
        Story(
            id = "story-silver-moon-fox",
            title = "The Silver Moon Fox",
            category = "Story of the Night",
            theme = ContentTheme.WONDER,
            mode = StoryMode.SLEEP,
            ageRange = AgeRange.AGE_4_6,
            heroId = "hero-1",
            heroName = "Koda & Nova",
            summary = "Follow Koda on a whispering journey through the starlit forest to find the missing sparkle of the North Star.",
            badge = "Story of the Night",
            audioDurationMinutes = 12,
            scenes = listOf(
                StoryScene(
                    id = "scene-fox-1",
                    sceneNumber = 1,
                    totalScenes = 4,
                    text = "Deep in the whispering Whispering Pines, where silver moss glows like fairy lanterns, Koda the young celestial fox curled his fluffy tail around a slumbering pine cone. High above, the North Star flickered softly, missing its brightest golden sparkle.",
                    sleepAffirmation = "Inhale the quiet midnight forest air. You are safe and snug.",
                    choices = listOf(
                        StoryChoice(
                            id = "cf1",
                            text = "Follow the trail of glowing stardust across the mossy brook",
                            action = "follow_stardust",
                            nextSceneId = "scene-fox-2a"
                        ),
                        StoryChoice(
                            id = "cf2",
                            text = "Ask the sleepy Barn Owl perched in the Ancient Willow",
                            action = "ask_owl",
                            nextSceneId = "scene-fox-2b"
                        )
                    )
                ),
                StoryScene(
                    id = "scene-fox-2a",
                    sceneNumber = 2,
                    totalScenes = 4,
                    text = "Koda padded silently across stepping stones bathed in moonlit water. Each step made tiny ripples of starlight sparkle. The river hummed a gentle lullaby, washing away all the noisy thoughts from the day.",
                    sleepAffirmation = "Let your mind drift like gentle leaves on cool clear water.",
                    choices = listOf(
                        StoryChoice(
                            id = "cf3",
                            text = "Climb the Silver Birch hill to reach the starlight pond",
                            action = "climb_hill",
                            nextSceneId = "scene-fox-3"
                        )
                    )
                ),
                StoryScene(
                    id = "scene-fox-2b",
                    sceneNumber = 2,
                    totalScenes = 4,
                    text = "The old Barn Owl blinked slowly with kind amber eyes. 'The sparkle drifted down into the Moonlit Clearing,' the owl whispered softly. 'Go quietly, little fox, and carry the warmth of your heart.'",
                    sleepAffirmation = "Feel your shoulders soften and your breathing grow slow and steady.",
                    choices = listOf(
                        StoryChoice(
                            id = "cf4",
                            text = "Trot softly toward the shimmering Moonlit Clearing",
                            action = "enter_clearing",
                            nextSceneId = "scene-fox-3"
                        )
                    )
                ),
                StoryScene(
                    id = "scene-fox-3",
                    sceneNumber = 3,
                    totalScenes = 4,
                    text = "In the heart of the clearing, resting gently on a bed of glowing bluebell flowers, was the lost sparkle. Koda nudged it with his velvety silver nose. The sparkle chimed like tiny silver chimes and rose into the sky, settling perfectly atop the North Star.",
                    sleepAffirmation = "The whole night sky is watching over you with peaceful light.",
                    choices = listOf(
                        StoryChoice(
                            id = "cf5",
                            text = "Curl up in the cozy hollow of the crescent moon for sweet dreams",
                            action = "sleep_moon",
                            nextSceneId = "scene-fox-4"
                        )
                    )
                ),
                StoryScene(
                    id = "scene-fox-4",
                    sceneNumber = 4,
                    totalScenes = 4,
                    isFinal = true,
                    text = "Koda nestled down inside the golden cradle of the crescent moon, his silver fur glowing warm and bright. The forest settled into deep, velvety sleep. 'Rest well, little dreamers everywhere,' Koda whispered. 'The stars are shining, and all is well. Goodnight.'",
                    sleepAffirmation = "Close your eyes, breathe gently, and sleep peacefully all night long."
                )
            )
        ),
        Story(
            id = "story-glow-whale",
            title = "The Glow Whale's Song",
            category = "Nature Story",
            theme = ContentTheme.WONDER,
            mode = StoryMode.SLEEP,
            ageRange = AgeRange.AGE_4_6,
            heroId = "hero-2",
            heroName = "Coral",
            summary = "Follow the majestic glowing whale through the celestial ocean as it sings the ancient melody of peaceful sleep.",
            badge = "Nature Story",
            audioDurationMinutes = 8,
            scenes = listOf(
                StoryScene(
                    id = "scene-gw-1",
                    sceneNumber = 1,
                    totalScenes = 3,
                    text = "In the deep tranquil ocean of the night sky, a gentle blue glow began to hum. A majestic celestial whale, its back dappled with twinkling starlight, swam through silent turquoise currents, sending peaceful waves across the cosmos.",
                    sleepAffirmation = "Breathe in the calm cool ocean air. You are peaceful and weightless.",
                    choices = listOf(
                        StoryChoice(
                            id = "cgw1",
                            text = "Listen to the whale's deep soothing lullaby",
                            action = "listen_lullaby",
                            nextSceneId = "scene-gw-2"
                        )
                    )
                ),
                StoryScene(
                    id = "scene-gw-2",
                    sceneNumber = 2,
                    totalScenes = 3,
                    text = "The whale's song resonated like soft chime bowls beneath the water. Luminous jellyfish floated in harmony, illuminating a safe path to the sleepy coral reefs where star-turtles were already dreaming.",
                    sleepAffirmation = "Feel every muscle in your arms and legs growing heavy and relaxed.",
                    choices = listOf(
                        StoryChoice(
                            id = "cgw2",
                            text = "Drift down into the cozy starlight lagoon",
                            action = "drift_lagoon",
                            nextSceneId = "scene-gw-3"
                        )
                    )
                ),
                StoryScene(
                    id = "scene-gw-3",
                    sceneNumber = 3,
                    totalScenes = 3,
                    isFinal = true,
                    text = "The gentle waves rocked the starlight lagoon into tranquil silence. The Glow Whale settled onto a soft seabed of glowing velvet sand, sending one last sleepy ripple to tuck you in. Sweet dreams in the quiet deep.",
                    sleepAffirmation = "Deep, calm, restful sleep until the morning sun."
                )
            )
        ),
        Story(
            id = "story-hollow-tree",
            title = "The Hollow Tree Inn",
            category = "Classic Fable",
            theme = ContentTheme.FRIENDSHIP,
            mode = StoryMode.CLASSIC,
            ageRange = AgeRange.AGE_4_6,
            heroId = "hero-6",
            heroName = "Bloom",
            summary = "Inside the grand glowing ancient oak lies the warmest haven where weary woodland travelers rest among fairy lights.",
            badge = "Classic Fable",
            audioDurationMinutes = 15,
            scenes = listOf(
                StoryScene(
                    id = "scene-ht-1",
                    sceneNumber = 1,
                    totalScenes = 3,
                    text = "High up in the branches of the Great Ancient Oak, glowing lanterns flickered warmly. Mrs. Hedgehog opened the wooden door of The Hollow Tree Inn, welcoming tired squirrel messengers and sleepy dormice to a hearth of crackling cedar embers.",
                    sleepAffirmation = "You are welcomed, warm, and cozy right where you are.",
                    choices = listOf(
                        StoryChoice(
                            id = "cht1",
                            text = "Sip a cup of hot chamomile tea with honey",
                            action = "sip_tea",
                            nextSceneId = "scene-ht-2"
                        )
                    )
                ),
                StoryScene(
                    id = "scene-ht-2",
                    sceneNumber = 2,
                    totalScenes = 3,
                    text = "The fragrant steam of sweet chamomile filled the wooden room. Soft acorn-shell lamps dimmed to a sleepy amber glow as each woodland guest climbed into hammocks lined with goose-down and dried lavender.",
                    sleepAffirmation = "Breathe in warmth and breathe out all worries.",
                    choices = listOf(
                        StoryChoice(
                            id = "cht2",
                            text = "Snuggle into the feather-soft moss bed",
                            action = "moss_bed",
                            nextSceneId = "scene-ht-3"
                        )
                    )
                ),
                StoryScene(
                    id = "scene-ht-3",
                    sceneNumber = 3,
                    totalScenes = 3,
                    isFinal = true,
                    text = "Outside, rain tapped softly against the oak leaves, making the inn feel even more warm and sheltered. Mrs. Hedgehog pulled the woolen quilt up to your chin and smiled. 'Safe and sound in the hollow tree. Sleep well, dear friend.'",
                    sleepAffirmation = "Warm, safe, protected, and deeply relaxed."
                )
            )
        ),
        Story(
            id = "story-library-stars",
            title = "Library of Stars",
            category = "Short Tale",
            theme = ContentTheme.WONDER,
            mode = StoryMode.CLASSIC,
            ageRange = AgeRange.AGE_6_8,
            heroId = "hero-3",
            heroName = "Orion",
            summary = "A celestial owl guides you through corridors of glowing star scrolls and constellations resting in nighttime silence.",
            badge = "Short Tale",
            audioDurationMinutes = 10,
            scenes = listOf(
                StoryScene(
                    id = "scene-ls-1",
                    sceneNumber = 1,
                    totalScenes = 3,
                    text = "Through the floating archway of the Great Celestial Library, tall crystal shelves stretched upward toward infinity. Floating scrolls tied with ribbon made of comet tails gently drifted past in silent reverence.",
                    sleepAffirmation = "Knowledge and peace surround you like a quiet starry night.",
                    choices = listOf(
                        StoryChoice(
                            id = "cls1",
                            text = "Open the Glowing Constellation Book of Sweet Dreams",
                            action = "open_book",
                            nextSceneId = "scene-ls-2"
                        )
                    )
                ),
                StoryScene(
                    id = "scene-ls-2",
                    sceneNumber = 2,
                    totalScenes = 3,
                    text = "As the pages turned, gentle starlight lifted from the paper, forming images of floating clouds, quiet castles, and sleeping dragons. The Grand Celestial Owl fluttered down silently and landed atop the velvet desk.",
                    sleepAffirmation = "Your thoughts are quiet and peaceful now.",
                    choices = listOf(
                        StoryChoice(
                            id = "cls2",
                            text = "Rest on the starlight reading lounge",
                            action = "rest_lounge",
                            nextSceneId = "scene-ls-3"
                        )
                    )
                ),
                StoryScene(
                    id = "scene-ls-3",
                    sceneNumber = 3,
                    totalScenes = 3,
                    isFinal = true,
                    text = "The library's golden chandeliers dimmed one by one, leaving only the soft sapphire glow of distant nebulae. The owl folded its wings and closed its eyes. 'Every story for today is finished,' it hummed. 'Time for your own peaceful dreams to begin.'",
                    sleepAffirmation = "Tomorrow holds new wonders. Rest peacefully tonight."
                )
            )
        )
    )
}
