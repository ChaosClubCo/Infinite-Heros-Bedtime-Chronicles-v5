import { useState, useEffect, useCallback } from 'react';
import { Story } from '../types';
import { FEATURED_STORIES } from '../data/featuredStories';

export const OFFLINE_STORIES_STORAGE_KEY = 'infinite_heroes_offline_cached_stories';
export const OFFLINE_CACHE_VERSION = 'v1';


export interface NetworkStatus {
  isOnline: boolean;
  since: Date;
  effectiveType?: string;
  isServiceWorkerReady: boolean;
}

/**
 * Register the Service Worker for offline caching
 */
export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }

  // Avoid registering in development if not supported or disabled
  return navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      console.log('[Service Worker] Registered successfully with scope:', registration.scope);

      // Check for updates
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[Service Worker] New bedtime chronicles update available');
            }
          };
        }
      };

      return registration;
    })
    .catch((err) => {
      console.warn('[Service Worker] Registration failed:', err);
      return null;
    });
}

/**
 * Save stories to offline storage cache
 */
export function cacheStoriesForOffline(stories: Story[]): void {
  try {
    const existing = getOfflineCachedStories();
    const map = new Map<string, Story>();

    // Add featured stories by default
    FEATURED_STORIES.forEach((s) => map.set(s.id, s));

    // Add existing cached
    existing.forEach((s) => map.set(s.id, s));

    // Add new stories
    stories.forEach((s) => {
      if (s && s.id) {
        map.set(s.id, s);
      }
    });

    const combined = Array.from(map.values());
    localStorage.setItem(OFFLINE_STORIES_STORAGE_KEY, JSON.stringify(combined));

    // Inform service worker if active
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_STORIES',
        payload: combined,
      });
    }
  } catch (e) {
    console.warn('[Offline Cache] Failed to cache stories in storage:', e);
  }
}

/**
 * Retrieve all offline cached stories
 */
export function getOfflineCachedStories(): Story[] {
  try {
    const raw = localStorage.getItem(OFFLINE_STORIES_STORAGE_KEY);
    if (!raw) {
      // Seed with featured stories initially
      cacheStoriesForOffline(FEATURED_STORIES);
      return FEATURED_STORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : FEATURED_STORIES;
  } catch {
    return FEATURED_STORIES;
  }
}

/**
 * Check if a specific story is cached for offline reading
 */
export function isStoryCachedOffline(storyId: string): boolean {
  if (!storyId) return false;
  // Featured stories are always offline-ready
  if (FEATURED_STORIES.some((s) => s.id === storyId)) return true;
  const cached = getOfflineCachedStories();
  return cached.some((s) => s.id === storyId);
}

/**
 * React Hook for real-time Network Status and Offline detection
 */
export function useNetworkStatus(): {
  isOnline: boolean;
  wasOffline: boolean;
  clearWasOffline: () => void;
  cachedStoryCount: number;
  isServiceWorkerReady: boolean;
  refreshOfflineCache: () => void;
} {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  });

  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [cachedStoryCount, setCachedStoryCount] = useState<number>(() => {
    return getOfflineCachedStories().length;
  });

  const refreshOfflineCache = useCallback(() => {
    setCachedStoryCount(getOfflineCachedStories().length);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      // Mark that we were offline so UI can show a brief "Back Online" confirmation
      setWasOffline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsServiceWorkerReady(true);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const clearWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  return {
    isOnline,
    wasOffline,
    clearWasOffline,
    cachedStoryCount,
    isServiceWorkerReady,
    refreshOfflineCache,
  };
}
