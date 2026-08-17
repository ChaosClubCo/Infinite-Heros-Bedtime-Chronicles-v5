import type { StoryMode } from "@/constants/story-theme";

export interface FeaturedStory {
  id: string;
  title: string;
  category: string;
  duration: string;
  ageRange: string;
  summary: string;
  image: string;
  heroId: string;
  mode: StoryMode;
  badge?: string;
}

// Single catalog for the featured/preset stories shown on the home tab and
// opened in the story-details customizer (was duplicated in both screens).
export const FEATURED_STORIES: FeaturedStory[] = [
  {
    id: "1",
    title: "The Starry Whales",
    category: "Cosmic",
    duration: "12 min",
    ageRange: "Ages 5-8",
    heroId: "hero-1",
    mode: "classic",
    badge: "Featured",
    summary:
      "When the last cosmic whale begins to fade, young Nova must journey through the Starlight Reef to find the ancient Song of Stars that can restore their glow. Along the way, she befriends quirky space creatures and discovers that the greatest light comes from within.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC7yhyLj6n8bFSX8_d1U62Y2R02hWfFHIZdY5YPhSb3Y3VVVMuKgMoqGGfREzX6KVUaKVa-CFbzEIiI8LRNK-89koByLPx6qvtNbznH8X9Lql6r9uHIDaS306SXdsPex3pWn0YNJjmWF2jnTSg8Bc2YiKfekZrijs6EfelrhUWiiEoJBG9I1nQkxGicIetp_4b_GJ2F5F_4WtXgsvxYUy43i7UBN85rJsM2rXrFN3f64c1IzqC7CsZ",
  },
  {
    id: "2",
    title: "The Candy Cloud Kingdom",
    category: "Dreamy",
    duration: "8 min",
    ageRange: "Ages 3-6",
    heroId: "hero-3",
    mode: "classic",
    summary:
      "In a kingdom above the clouds made entirely of sweets, Princess Lollipop must save her candy subjects from the Sour Storm. With courage, kindness, and a sprinkle of sugar magic, she learns that true sweetness comes from friendship.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCsy6pS96BchFV2Rd9FYbAgmUtK8y3g7_bdGiEZgz1ldkMXcKQ10d_OqXfgXFJnPGwEX18QTU9yj_qAZurNUaqVxOjM-q5L7YO7qfiPGB2C8PntKlXsDy2fBqOFzFvR9FkItYsaL62q2F7SsXNhDfvJfA_3vDGd0XOz6yqJ-g_-5JnjkvFBsVUBwOQbDScpoQVCNwUdA4gHyJI646dv7ipngkbi9KJ3SqgckbOo6ajxo2v1nGw8FH7NNiUjPj3xoCym_DCc1Tx5DaA",
  },
  {
    id: "3",
    title: "The Moon Guardian",
    category: "Fantasy",
    duration: "15 min",
    ageRange: "Ages 6-9",
    heroId: "hero-5",
    mode: "classic",
    badge: "Popular",
    summary:
      "Every night, a mysterious guardian watches over sleeping children from the moon. When shadows threaten to steal their dreams, young Kai is chosen to become the new Moon Guardian and must learn to wield the power of moonlight.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAKIeynr-pNPnxzh6yPj8bsFB8g1-td1o4GmLNz5jmpIg_t7gDbOxIbtILsQs4Dx-XBlWmcnkNehMZSnWWew6N1Dx4Y9_cLNY0PZAI0_12iS05d-Gb_j8j5IegKvVFrJs2tJl838VkEvGOxh1g91RhvPMLR_P86wQV6ytV-2CBV--S6HxIXXGGupUbHyWlc0k9K1McwymOGo0nMcSty8qBgqufJy7Z5QMuY89oQZTAiXXaoifXAWzSD-_zNGIYkk7RZLqYd2qqC7sI",
  },
  {
    id: "4",
    title: "The Firefly Symphony",
    category: "Magical",
    duration: "10 min",
    ageRange: "Ages 4-7",
    heroId: "hero-7",
    mode: "classic",
    summary:
      "Deep in the Enchanted Grove, fireflies create music with their light. When their conductor goes missing, a brave little firefly named Flicker must lead the symphony and discover that every voice, no matter how small, makes the music complete.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDhqNuQqkzTwGAhJw53iBqASKJM5WmTUyAsitylylLBDCiyiQySuD4c8uEy4IIX-M_slVeWQDKu81udgQBk3xczFzHl9VX-INVoRf4cv2CqCUaGgGiE__OkqcQjDJUi1X8I0VaC9Eah58JI7u2dX4VSYsqol-sdue-70Ewk8zopVPKYIBICUMELN7J_ft8R0pndpPkXAqAG2ZW53p4Fu8mUW3ywyRMq8UTU62BEoET9xphRhr4HW7uI-NoFHbr_J",
  },
];

export const FEATURED_STORIES_BY_ID: Record<string, FeaturedStory> = Object.fromEntries(
  FEATURED_STORIES.map((s) => [s.id, s]),
);
