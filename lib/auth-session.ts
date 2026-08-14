export interface AuthSessionClient {
  auth: {
    getSession: () => Promise<{
      data: { session: { access_token: string } | null } | null;
    }>;
    signInAnonymously: () => Promise<{
      data: { session: { access_token: string } | null } | null;
      error: { message: string } | null;
    }>;
  };
}

/**
 * Return the current Supabase access token, creating an anonymous identity only
 * when a protected API call actually needs one.
 *
 * This preserves the parental-consent launch gate: AuthProvider itself does not
 * create an identity on mount. The anonymous account is created lazily by the
 * first token request after the user enters a protected workflow.
 */
export async function getOrCreateAccessToken(client: AuthSessionClient): Promise<string | null> {
  const { data: existing } = await client.auth.getSession();
  if (existing?.session?.access_token) {
    return existing.session.access_token;
  }

  const { data, error } = await client.auth.signInAnonymously();
  if (error) {
    console.warn('[Auth] Anonymous sign-in failed:', error.message);
    return null;
  }

  return data?.session?.access_token ?? null;
}
