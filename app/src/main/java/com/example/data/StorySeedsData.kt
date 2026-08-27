package com.example.data

import com.example.model.AgeRange
import com.example.model.ContentTheme
import com.example.model.StoryMode
import com.example.model.StorySeed

object StorySeedsData {
    val STORY_SEEDS: List<StorySeed> = listOf(
        StorySeed(
            id = "courage-pip-sunflower",
            title = "Pip and the Tall Sunflower",
            blurb: "A tiny mouse named Pip finds the courage to climb the tallest sunflower in the garden.",
            theme = ContentTheme.COURAGE,
            ageRange = AgeRange.AGE_2_4,
            mode = StoryMode.CLASSIC,
            suggestedHeroId = "hero-5",
            setting = "Enchanted Sunflower Meadow",
            sidekick = "Ladybug",
            emoji = "🐭"
        ),
        StorySeed(
            id = "courage-nimbus-storm",
            title = "Nimbus and the Stormy Sky",
            blurb = "Nimbus the brave cloud helps a lost baby bird find its nest during a windy storm.",
            theme = ContentTheme.COURAGE,
            ageRange = AgeRange.AGE_4_6,
            mode = StoryMode.CLASSIC,
            suggestedHeroId = "hero-5",
            setting = "Breezy Treetop Forest",
            sidekick = "Wise Owl",
            emoji = "⛈️"
        ),
        StorySeed(
            id = "courage-nova-caves",
            title = "Nova's Crystal Cave Search",
            blurb = "Nova guides her glowing star friend through a dark cavern to find the heart crystal.",
            theme = ContentTheme.COURAGE,
            ageRange = AgeRange.AGE_6_8,
            mode = StoryMode.CLASSIC,
            suggestedHeroId = "hero-1",
            setting = "Glittering Crystal Caverns",
            sidekick = "Baby Dragon",
            emoji = "🛡️"
        ),
        StorySeed(
            id = "kindness-coral-reef",
            title = "Coral Shares Her Sunset Shell",
            blurb = "Coral gives her favorite glowing seashell to a lonely sea star to brighten its home.",
            theme = ContentTheme.KINDNESS,
            ageRange = AgeRange.AGE_2_4,
            mode = StoryMode.CLASSIC,
            suggestedHeroId = "hero-2",
            setting = "Warm Lagoon Reef",
            sidekick = "Tiny Starfish",
            emoji = "🐠"
        ),
        StorySeed(
            id = "kindness-bloom-garden",
            title = "Bloom's Silver Dream Seeds",
            blurb = "Bloom plants magical silver seeds that grow into beautiful flowers of pure happiness.",
            theme = ContentTheme.KINDNESS,
            ageRange = AgeRange.AGE_4_6,
            mode = StoryMode.CLASSIC,
            suggestedHeroId = "hero-6",
            setting = "Moonlit Blossom Meadow",
            sidekick = "Glitter Fairy",
            emoji = "🌷"
        ),
        StorySeed(
            id = "friendship-nova-orbit",
            title = "Nova and the Tiny Moon",
            blurb = "Nova guides a lonely baby planet into a safe, warm orbit around a friendly sun.",
            theme = ContentTheme.FRIENDSHIP,
            ageRange = AgeRange.AGE_2_4,
            mode = StoryMode.SLEEP,
            suggestedHeroId = "hero-1",
            setting = "Golden Solar Ring",
            emoji = "🪐"
        ),
        StorySeed(
            id = "friendship-orion-comet",
            title = "Orion's Cosmic Tag Game",
            blurb = "Orion plays tag with a speedy comet and learns how to share the space lanes.",
            theme = ContentTheme.FRIENDSHIP,
            ageRange = AgeRange.AGE_4_6,
            mode = StoryMode.CLASSIC,
            suggestedHeroId = "hero-3",
            setting = "Star Ribbon Raceway",
            sidekick = "Sparkling Comet",
            emoji = "☄️"
        ),
        StorySeed(
            id = "wonder-luna-sky",
            title = "Luna Paints the Night Sky",
            blurb = "Luna weaves sparkling starlight into the dark sky to create the constellation of the horse.",
            theme = ContentTheme.WONDER,
            ageRange = AgeRange.AGE_2_4,
            mode = StoryMode.SLEEP,
            suggestedHeroId = "hero-4",
            setting = "Velvet Night Canopy",
            emoji = "🌌"
        ),
        StorySeed(
            id = "comfort-bedtime-train",
            title = "The Train to Sleepy Station",
            blurb = "Whistle plays a soft, slow whistle song as the train rolls into the Dreamland station.",
            theme = ContentTheme.COMFORT,
            ageRange = AgeRange.AGE_2_4,
            mode = StoryMode.SLEEP,
            suggestedHeroId = "hero-7",
            setting = "Dreamland Station Platform",
            emoji = "🛌"
        ),
        StorySeed(
            id = "comfort-nimbus-blanket",
            title = "Nimbus Wraps the Sleepy Deer",
            blurb = "Nimbus wraps a cold little deer in a warm, fluffy cloud blanket for a cozy nap.",
            theme = ContentTheme.COMFORT,
            ageRange = AgeRange.AGE_4_6,
            mode = StoryMode.SLEEP,
            suggestedHeroId = "hero-5",
            setting = "Dewy Pine Glade",
            emoji = "🦌"
        )
    )
}
