package com.example.data

import com.example.model.BedtimeAffirmation

object AffirmationsData {
    val AFFIRMATIONS: List<BedtimeAffirmation> = listOf(
        BedtimeAffirmation(
            id = "aff-1",
            phrase = "You are safe, deeply loved, and held by a night sky full of gentle stars.",
            theme = "love",
            breathGuidance = "Breathe in soft golden light, breathe out peaceful quiet."
        ),
        BedtimeAffirmation(
            id = "aff-2",
            phrase = "Your heart is kind, your mind is tranquil, and sleep is waiting with sweet dreams.",
            theme = "peace",
            breathGuidance = "Rest your hands on your chest and feel your calm, gentle heartbeat."
        ),
        BedtimeAffirmation(
            id = "aff-3",
            phrase = "You did so many wonderful things today, and now it is time for a cozy rest.",
            theme = "peace",
            breathGuidance = "Let your shoulders drop down softly like falling stardust."
        ),
        BedtimeAffirmation(
            id = "aff-4",
            phrase = "Like the soft silver moon, you bring a gentle and comforting light wherever you go.",
            theme = "wonder",
            breathGuidance = "Imagine the cool moonbeams wrapping you like a cozy blanket."
        ),
        BedtimeAffirmation(
            id = "aff-5",
            phrase = "You are strong like a mighty oak tree and gentle like fresh falling snow.",
            theme = "courage",
            breathGuidance = "Take one deep breath in... and let all your muscles melt into bed."
        ),
        BedtimeAffirmation(
            id = "aff-6",
            phrase = "Breathe in quiet starlight, breathe out any busy thoughts from today.",
            theme = "peace",
            breathGuidance = "Inhale for 4 twinkling counts... exhale for 4 quiet counts."
        ),
        BedtimeAffirmation(
            id = "aff-7",
            phrase = "You are a shining star in our galaxy, brave, curious, and true.",
            theme = "love",
            breathGuidance = "Smile softly and remember how special and loved you are."
        ),
        BedtimeAffirmation(
            id = "aff-8",
            phrase = "The night is peaceful, the stars are watching over you, and tomorrow brings new joys.",
            theme = "wonder",
            breathGuidance = "Picture the quiet stars blinking goodnight just for you."
        )
    )

    fun getDailyAffirmation(): BedtimeAffirmation {
        val dayOfYear = java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_YEAR)
        return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.size]
    }
}
