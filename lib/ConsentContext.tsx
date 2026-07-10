import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { getConsentGiven } from "@/lib/storage";

/**
 * Reactive COPPA-consent state backing the root layout's Stack.Protected
 * guard. Every screen except the launch gate, the consent screen, and the
 * privacy policy is unmountable until consent is granted — this closes the
 * deep-link / restored-state paths that never pass through app/index.tsx.
 *
 * Persistence stays in lib/storage.ts (setParentConsent / clearAllData);
 * call markConsented / markUnconsented right after those writes so the
 * guard flips with the stored state.
 */
interface ConsentState {
  /** False until the stored consent record has been read. */
  isLoaded: boolean;
  isConsented: boolean;
  markConsented: () => void;
  markUnconsented: () => void;
}

const ConsentContext = createContext<ConsentState | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isConsented, setIsConsented] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getConsentGiven()
      // Fail-safe: on a storage error we stay un-consented (COPPA).
      .catch(() => false)
      .then((consented) => {
        if (!cancelled) {
          setIsConsented(consented);
          setIsLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const markConsented = useCallback(() => setIsConsented(true), []);
  const markUnconsented = useCallback(() => setIsConsented(false), []);

  const value = useMemo(
    () => ({ isLoaded, isConsented, markConsented, markUnconsented }),
    [isLoaded, isConsented, markConsented, markUnconsented],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentState {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return ctx;
}
