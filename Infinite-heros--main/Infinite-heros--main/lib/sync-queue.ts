import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "@/lib/query-client";

export interface OfflineInteraction {
  id: string;
  type: "like" | "unlike" | "story_completion";
  storyId: string;
  timestamp: number;
}

const SYNC_QUEUE_KEY = "@infinity_heroes_offline_queue";

export async function getQueuedInteractions(): Promise<OfflineInteraction[]> {
  try {
    const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function queueInteraction(
  type: OfflineInteraction["type"],
  storyId: string
): Promise<void> {
  try {
    const queue = await getQueuedInteractions();

    // De-duplicate same interaction type for same storyId if already in queue
    const exists = queue.some((item) => item.type === type && item.storyId === storyId);
    if (exists) return;

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
}

export async function clearQueuedInteractions(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
  } catch (error) {
    console.error("[Offline Queue] Failed to clear queue:", error);
  }
}

export async function syncOfflineInteractions(): Promise<boolean> {
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

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.log(`[Offline Queue] Successful sync of ${result.syncedCount} interactions. Clearing offline queue.`);
        }
        await clearQueuedInteractions();
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("[Offline Queue] In-flight synchronization failed:", error);
    return false;
  }
}
