// react-native-url-polyfill must load before @supabase/supabase-js so the
// Supabase client can parse URLs on React Native (Hermes lacks a complete URL).
import 'react-native-url-polyfill/auto';
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createClient,
  type SupabaseClient,
  type Session,
  type User,
} from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Only initialize Supabase when both client credentials are present.
const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey);

let supabase: SupabaseClient | null = null;

if (hasSupabaseConfig) {
  try {
    supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        // AsyncStorage persists the session across app launches (RN/web).
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // No URL-based session detection on native — there is no browser URL.
        detectSessionInUrl: false,
      },
    });
  } catch (err) {
    console.warn('[Auth] Supabase initialization failed:', err instanceof Error ? err.message : String(err));
  }
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Returns the current Supabase access token (JWT) for the Authorization header, or null. */
  getIdToken: () => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
  getIdToken: async () => null,
  signIn: async () => ({ error: 'Auth not configured' }),
  signUp: async () => ({ error: 'Auth not configured' }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(hasSupabaseConfig);

  useEffect(() => {
    if (!supabase) {
      // Supabase not configured — continue as unauthenticated (app stays usable;
      // in dev the server treats tokenless requests as anonymous).
      setLoading(false);
      return;
    }
    const client = supabase;

    // Hydrate any persisted session, then subscribe to auth state changes
    // (sign-in/out + automatic token refresh).
    client.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[Auth] getSession failed:', err instanceof Error ? err.message : String(err));
        setLoading(false);
      });

    const { data: sub } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const getIdToken = async (): Promise<string | null> => {
    if (!supabase) return null;
    try {
      // getSession() returns the stored token and refreshes it if expired.
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return session?.access_token ?? null;
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!supabase) return { error: 'Auth not configured' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  };

  const signUp = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!supabase) return { error: 'Auth not configured' };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ? error.message : null };
  };

  const signOut = async (): Promise<void> => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Auth] signOut failed:', err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, getIdToken, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
