package com.example.data

import com.example.model.AmbientSound
import com.example.model.DreamTheme

object DreamThemesData {
    val DREAM_THEMES: List<DreamTheme> = listOf(
        DreamTheme(
            id = "theme-cosmic-voyage",
            title = "Cosmic Voyage",
            subtitle = "Velvet galaxies & sleeping stars",
            description = "Drift through velvet galaxies and sleeping stars as the universe hums a gentle lullaby.",
            duration = "20-45m",
            ambientSound = AmbientSound.WIND,
            sampleAffirmation = "Float weightlessly under a canopy of starlight. Sleep brings peaceful wonder.",
            category = "cosmic",
            tag = "Popular"
        ),
        DreamTheme(
            id = "theme-ancient-forest",
            title = "Ancient Forest",
            subtitle = "Moonlit whispering pines",
            description = "Walk softly beneath ancient canopy boughs where silver moss glows and sleeping owls sing.",
            duration = "15-30m",
            ambientSound = AmbientSound.WIND,
            sampleAffirmation = "With every breath, the gentle forest protects your quiet rest.",
            category = "nature"
        ),
        DreamTheme(
            id = "theme-abyssal-calm",
            title = "Abyssal Calm",
            subtitle = "Weightless bioluminescent deep",
            description = "Submerge into a calm, glowing aquatic sanctuary where glowing whales guide you into sweet slumber.",
            duration = "30-60m",
            ambientSound = AmbientSound.OCEAN,
            sampleAffirmation = "Like a gentle wave rolling onto shore, all worries drift away into peace.",
            category = "nature"
        ),
        DreamTheme(
            id = "theme-sky-citadel",
            title = "Sky Citadel",
            subtitle = "Golden cloud castles at sunset",
            description = "Ascend to the floating islands where the air is pure and bedtime stories are as light as feathers.",
            duration = "25-40m",
            ambientSound = AmbientSound.WIND,
            sampleAffirmation = "You are carried gently on soft clouds as sleep wraps you in warm golden light.",
            category = "fantasy"
        ),
        DreamTheme(
            id = "theme-crystal-cave",
            title = "Crystal Cave",
            subtitle = "Luminescent quartz & singing pools",
            description = "Step into a tranquil cavern lit by glittering amethyst crystals and soothing water drops.",
            duration = "10-25m",
            ambientSound = AmbientSound.RAIN,
            sampleAffirmation = "Shimmering crystal light keeps your dreams bright and safe tonight.",
            category = "fantasy"
        ),
        DreamTheme(
            id = "theme-moonlight-meadow",
            title = "Moonlight Meadow",
            subtitle = "Swaying fireflies & midnight blooms",
            description = "Thousands of golden fireflies illuminate soft clover fields, dancing to a quiet evening breeze.",
            duration = "10-20m",
            ambientSound = AmbientSound.CRICKETS,
            sampleAffirmation = "Soft petals and warm night air cradle you into sweet and peaceful rest.",
            category = "nature"
        ),
        DreamTheme(
            id = "theme-clockwork-dreams",
            title = "Clockwork Dreams",
            subtitle = "Golden gears & gentle rhythmic pendulum",
            description = "A cozy observatory with slow-moving golden brass gears ticking in soothing harmony.",
            duration = "40-75m",
            ambientSound = AmbientSound.TRAIN,
            sampleAffirmation = "Tick, tock, tick, tock. Every slow rhythm guides you closer to slumber.",
            category = "adventure"
        )
    )
}
