package com.example.data

import com.example.model.MadLibField
import com.example.model.MadLibTemplate
import com.example.model.StoryScene

object MadLibsData {
    val MADLIBS_TEMPLATES: List<MadLibTemplate> = listOf(
        MadLibTemplate(
            id = "silly-space-picnic",
            title = "The Silly Starlight Picnic",
            suggestedHeroId = "hero-3",
            fields = listOf(
                MadLibField(
                    key = "sillyFood",
                    label = "Funny Snack",
                    placeholder = "e.g. Marshmallow Pizza",
                    suggestions = listOf("Marshmallow Pizza", "Giggle Tacos", "Rainbow Jellybeans", "Bubblegum Pancakes")
                ),
                MadLibField(
                    key = "funnyAnimal",
                    label = "Funny Animal",
                    placeholder = "e.g. Pajama Penguin",
                    suggestions = listOf("Pajama Penguin", "Dancing Hamster", "Snoring Dragon", "Glitter Hippo")
                ),
                MadLibField(
                    key = "goofySound",
                    label = "Silly Sound",
                    placeholder = "e.g. Boing-boing-squish",
                    suggestions = listOf("Boing-boing-squish", "Honk-whistle-pop", "Bloop-a-doop", "Zippity-zap")
                ),
                MadLibField(
                    key = "cozyItem",
                    label = "Cozy Bed Item",
                    placeholder = "e.g. Fuzzy Dino Blanket",
                    suggestions = listOf("Fuzzy Dino Blanket", "Cloud Pillow", "Velvet Bunny Slippers", "Starry Nightcap")
                )
            ),
            generateScenes = { answers, heroName ->
                val food = answers["sillyFood"]?.ifBlank { "Giggle Tacos" } ?: "Giggle Tacos"
                val animal = answers["funnyAnimal"]?.ifBlank { "Pajama Penguin" } ?: "Pajama Penguin"
                val sound = answers["goofySound"]?.ifBlank { "Bloop-a-doop" } ?: "Bloop-a-doop"
                val item = answers["cozyItem"]?.ifBlank { "Fuzzy Dino Blanket" } ?: "Fuzzy Dino Blanket"

                listOf(
                    StoryScene(
                        id = "ml-1",
                        sceneNumber = 1,
                        totalScenes = 3,
                        text = "One evening along the Milky Way, $heroName decided to pack a cosmic picnic basket filled to the brim with $food. Flying through the stardust, they landed on a bouncy purple asteroid where a friendly $animal was doing bedtime stretches.",
                        sleepAffirmation = "Giggle and relax your shoulders."
                    ),
                    StoryScene(
                        id = "ml-2",
                        sceneNumber = 2,
                        totalScenes = 3,
                        text = "Every time the asteroid bounced, it made a hilarious sound: '$sound!' $heroName and the $animal shared the delicious $food until their bellies were full and warm. The stars twinkled like cheerful smiling eyes in the quiet sky.",
                        sleepAffirmation = "Your belly is warm, and your mind is at ease."
                    ),
                    StoryScene(
                        id = "ml-3",
                        sceneNumber = 3,
                        totalScenes = 3,
                        isFinal = true,
                        text = "As the asteroid slowed to a gentle floating glide, $heroName unfolded a giant $item that covered both friends in pure snuggly comfort. 'Time for sweet starry dreams,' yawned the $animal, drifting off into a peaceful sleep.",
                        sleepAffirmation = "Cuddle into your bed, warm and completely cozy. Goodnight!"
                    )
                )
            }
        ),
        MadLibTemplate(
            id = "underwater-bubble-dance",
            title = "The Underwater Bubble Ball",
            suggestedHeroId = "hero-2",
            fields = listOf(
                MadLibField(
                    key = "sillyColor",
                    label = "Glowing Color",
                    placeholder = "e.g. Neon Sparkle Purple",
                    suggestions = listOf("Neon Sparkle Purple", "Golden Sunshine Yellow", "Cotton Candy Blue", "Emerald Mint")
                ),
                MadLibField(
                    key = "sillyDance",
                    label = "Goofy Dance Move",
                    placeholder = "e.g. The Jellyfish Wiggle",
                    suggestions = listOf("The Jellyfish Wiggle", "The Penguin Shimmy", "The Slow Sloth Sway", "The Octopus Twirl")
                ),
                MadLibField(
                    key = "soothingThing",
                    label = "Peaceful Object",
                    placeholder = "e.g. Glowing Pearl Lamp",
                    suggestions = listOf("Glowing Pearl Lamp", "Seashell Lullaby Box", "Warm Tidepool Sponge", "Velvet Seaweed Hammock")
                )
            ),
            generateScenes = { answers, heroName ->
                val color = answers["sillyColor"]?.ifBlank { "Neon Sparkle Purple" } ?: "Neon Sparkle Purple"
                val dance = answers["sillyDance"]?.ifBlank { "The Jellyfish Wiggle" } ?: "The Jellyfish Wiggle"
                val item = answers["soothingThing"]?.ifBlank { "Glowing Pearl Lamp" } ?: "Glowing Pearl Lamp"

                listOf(
                    StoryScene(
                        id = "ml-1",
                        sceneNumber = 1,
                        totalScenes = 3,
                        text = "$heroName dove beneath the moonlit ocean waves into a lagoon glowing in shades of $color. All the gentle sea turtles and friendly sea otters were gathered for the annual Sleepy Bubble Ball.",
                        sleepAffirmation = "Feel floating in gentle, supportive water."
                    ),
                    StoryScene(
                        id = "ml-2",
                        sceneNumber = 2,
                        totalScenes = 3,
                        text = "To start the calm celebration, $heroName showed everyone the funniest slow-motion move: $dance! Everyone laughed quietly underwater with soft, glowing bubbles that floated up to the moon.",
                        sleepAffirmation = "Release all the tension from your hands and feet."
                    ),
                    StoryScene(
                        id = "ml-3",
                        sceneNumber = 3,
                        totalScenes = 3,
                        isFinal = true,
                        text = "At last, $heroName placed the $item in the center of the reef. Its gentle amber glow made every wave whisper a soft bedtime song, tucking every sea creature into sweet and restful slumber.",
                        sleepAffirmation = "Drift gently with the calm tide into peaceful dreams."
                    )
                )
            }
        ),
        MadLibTemplate(
            id = "cloud-castle-slumber",
            title = "The Cloud Castle Slumber Party",
            suggestedHeroId = "hero-1",
            fields = listOf(
                MadLibField(
                    key = "cloudFlavor",
                    label = "Cloud Flavor",
                    placeholder = "e.g. Vanilla Marshmallow",
                    suggestions = listOf("Vanilla Marshmallow", "Lavender Honey", "Cinnamon Cocoa", "Strawberry Stardust")
                ),
                MadLibField(
                    key = "sleepyFriend",
                    label = "Sleepy Sidekick",
                    placeholder = "e.g. Fluffy Cloud Badger",
                    suggestions = listOf("Fluffy Cloud Badger", "Yawning Moon Rabbit", "Sleepy Little Owl", "Dreamy Baby Panda")
                ),
                MadLibField(
                    key = "magicSpell",
                    label = "Bedtime Magic Word",
                    placeholder = "e.g. Puff-puff-snuggle",
                    suggestions = listOf("Puff-puff-snuggle", "Shush-a-bye-zoom", "Tuck-in-twinkle", "Lullaby-loo")
                )
            ),
            generateScenes = { answers, heroName ->
                val flavor = answers["cloudFlavor"]?.ifBlank { "Vanilla Marshmallow" } ?: "Vanilla Marshmallow"
                val friend = answers["sleepyFriend"]?.ifBlank { "Fluffy Cloud Badger" } ?: "Fluffy Cloud Badger"
                val spell = answers["magicSpell"]?.ifBlank { "Puff-puff-snuggle" } ?: "Puff-puff-snuggle"

                listOf(
                    StoryScene(
                        id = "ml-1",
                        sceneNumber = 1,
                        totalScenes = 3,
                        text = "High above the sleepy world, $heroName climbed a rainbow staircase into the kingdom of clouds, where every puffy cloud tasted like delicious $flavor. Waiting at the gates was a $friend wearing tiny velvet nightcaps.",
                        sleepAffirmation = "Feel as light and relaxed as a floating cloud."
                    ),
                    StoryScene(
                        id = "ml-2",
                        sceneNumber = 2,
                        totalScenes = 3,
                        text = "Together, they whispered the ancient bedtime chant: '$spell!' Instantly, the castle's starry windows dimmed to a gentle golden glow, and the breeze began to play a soothing lullaby.",
                        sleepAffirmation = "Let your breath slow down into an easy rhythm."
                    ),
                    StoryScene(
                        id = "ml-3",
                        sceneNumber = 3,
                        totalScenes = 3,
                        isFinal = true,
                        text = "$heroName tucked the $friend into a cozy cotton-candy hammock. With a soft yawn, the stars tucked their light behind silver mist, watching over dreamers everywhere.",
                        sleepAffirmation = "You are snug, warm, and safe in your bed. Goodnight."
                    )
                )
            }
        )
    )
}
