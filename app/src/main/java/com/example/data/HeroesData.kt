package com.example.data

import com.example.model.Hero

object HeroesData {
    val HEROES = listOf(
        Hero(
            id = "hero-1",
            name = "Nova",
            title = "Guardian of Light",
            power = "Starlight Shield",
            description = "Nova protects sleeping children with her magical shield that glows like a thousand stars. She turns nightlights into tiny stars that keep the dark at bay.",
            colorHex = 0xFFFFD54F,
            constellation = "The Shield",
            iconName = "shield"
        ),
        Hero(
            id = "hero-2",
            name = "Coral",
            title = "Heart of the Ocean",
            power = "Kindness Wave",
            description = "Coral swims through moonlit oceans, spreading warmth and kindness wherever she goes. Her tail shimmers with sunset colors and her songs heal lonely hearts.",
            colorHex = 0xFF4DD0E1,
            constellation = "The Wave",
            iconName = "water"
        ),
        Hero(
            id = "hero-3",
            name = "Orion",
            title = "Star of Friendship",
            power = "Constellation Bond",
            description = "Once the loneliest star in the sky, Orion now connects friends across the universe. His constellation reminds everyone that true friends make you shine brighter.",
            colorHex = 0xFFB388FF,
            constellation = "The Bridge",
            iconName = "star"
        ),
        Hero(
            id = "hero-4",
            name = "Luna",
            title = "The Dream Weaver",
            power = "Dream Loom",
            description = "Luna weaves beautiful dreams on her magical loom made of moonbeams and starlight. Each dream is unique and full of the things that make children happiest.",
            colorHex = 0xFFCE93D8,
            constellation = "The Loom",
            iconName = "moon"
        ),
        Hero(
            id = "hero-5",
            name = "Nimbus",
            title = "The Brave Cloud",
            power = "Storm Shield",
            description = "The smallest cloud with the biggest heart. Nimbus proves that you don't need to be big to be brave. He protects gardens and children from scary storms.",
            colorHex = 0xFF90CAF9,
            constellation = "The Cloud",
            iconName = "cloud"
        ),
        Hero(
            id = "hero-6",
            name = "Bloom",
            title = "Garden Keeper",
            power = "Dream Seeds",
            description = "Bloom tends the magical moonlit garden where dreams grow like flowers. Her silver wings scatter dream-seeds across the world, planting beautiful visions in sleeping minds.",
            colorHex = 0xFFA5D6A7,
            constellation = "The Garden",
            iconName = "eco"
        ),
        Hero(
            id = "hero-7",
            name = "Whistle",
            title = "Night Train Conductor",
            power = "Dream Express",
            description = "Every night at bedtime o'clock, Whistle drives the magical Night Train along the Milky Way, carrying dreaming children to wonderful destinations among the stars.",
            colorHex = 0xFFB0BEC5,
            constellation = "The Track",
            iconName = "train"
        ),
        Hero(
            id = "hero-8",
            name = "Shade",
            title = "Shadow Friend",
            power = "Shadow Play",
            description = "Made entirely of shadows, Shade is the gentlest hero of all. He makes funny shadow shapes to show children that the dark is nothing to fear, just a cozy blanket for sleeping.",
            colorHex = 0xFF94A3B8,
            constellation = "The Shadow",
            iconName = "visibility"
        )
    )

    fun getHeroById(id: String): Hero {
        return HEROES.find { it.id == id } ?: HEROES.first()
    }
}
