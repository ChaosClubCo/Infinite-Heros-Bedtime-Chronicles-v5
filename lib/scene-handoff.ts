/**
 * In-memory handoff of generated scene images from the story screen to the
 * completion screen. Scene images are base64 data URIs that can each be
 * hundreds of KB — far too large to serialize through navigation params
 * (which bloats navigation state and is re-parsed on every param read).
 *
 * story.tsx calls setPendingScenes() right before navigating to /completion;
 * completion.tsx takes them exactly once in its mount effect and persists
 * them via saveStoryScene().
 */
let pendingScenes: Record<number, string> | null = null;

export function setPendingScenes(scenes: Record<number, string>): void {
  pendingScenes = { ...scenes };
}

/** Returns the pending scenes and clears them (single-consumer handoff). */
export function takePendingScenes(): Record<number, string> | null {
  const scenes = pendingScenes;
  pendingScenes = null;
  return scenes;
}
