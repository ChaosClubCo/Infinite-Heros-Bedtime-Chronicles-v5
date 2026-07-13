import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "@/lib/query-client";

export interface OfflineInteraction {
  id: string;
  type: "like" | "unlike" | "story_completion";
  storyId: string;
  timestamp: number;
}

const SYNC_QUEUE_KEY = "@infinity_heroes_offline_queue";
const TOGGLE_TYPES = new Set<OfflineInteraction["type"]>(["like", "unlike"]);

// Serializes all read-modify-write access to the queue so concurrent callers
// (rapid favorite taps, a completion firing mid-drain) can't race on setItem.
let queueLock: Promise<unknown> = Promise.resolve();
function withQueueLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = queueLock.then(fn, fn);
  queueLock = result.catch(() => undefined);
  return result;
}

export async function getQueuedInteractions(): Promise<OfflineInteraction[]> {
  try {
    const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function queueInteraction(
  type: OfflineInteraction["type"],
  storyId: string
): Promise<void> {
  return withQueueLock(async () => {
    try {
      let queue = await getQueuedInteractions();

      if (TOGGLE_TYPES.has(type)) {
        // like/unlike are mutually-exclusive final state per story: drop any
        // earlier toggle for this storyId so the queue always reflects the
        // latest state (an offline like->unlike->like ends up as just `like`).
        queue = queue.filter((item) => !(TOGGLE_TYPES.has(item.type) && item.storyId === storyId));
      } else {
        // story_completion isn't a toggle - keep the existing exact-match dedup.
        const exists = queue.some((item) => item.type === type && item.storyId === storyId);
        if (exists) return;
      }

      const newItem: OfflineInteraction = {
        id: `act_${Math.random().toString(36).substring(2, 11)}`,
        type,
        storyId,
        timestamp: Date.now(),
      };

      queue.push(newItem);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.log(`[Offline Queue] Queued interaction '${type}' for storyId ${storyId}`);
      }
    } catch (error) {
      console.error("[Offline Queue] Failed to queue interaction:", error);
    }
  });
}

export async function clearQueuedInteractions(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
  } catch (error) {
    console.error("[Offline Queue] Failed to clear queue:", error);
  }
}

export async function syncOfflineInteractions(): Promise<boolean> {
  return withQueueLock(async () => {
    try {
      const queue = await getQueuedInteractions();
      if (queue.length === 0) {
        return true;
      }

      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.log(`[Offline Queue] Synchronizing ${queue.length} interactions with server...`);
      }

      const response = await apiRequest("POST", "api/sync/interactions", {
        interactions: queue,
      });

      // apiRequest() throws on any non-2xx response, so reaching here means success.
      const result = await response.json();
      if (result.success) {
        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.log(`[Offline Queue] Successful sync of ${result.syncedCount} interactions. Clearing synced items.`);
        }
        // Only remove the ids that were actually sent - anything queued while
        // this request was in flight (mid-lock, after we snapshotted `queue`)
        // must survive for the next sync rather than being wiped wholesale.
        const sentIds = new Set(queue.map((item) => item.id));
        const remaining = (await getQueuedInteractions()).filter((item) => !sentIds.has(item.id));
        if (remaining.length > 0) {
          await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
        } else {
          await clearQueuedInteractions();
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("[Offline Queue] In-flight synchronization failed:", error);
      return false;
    }
  });
}
