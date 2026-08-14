import { afterEach, describe, expect, it } from 'vitest';
import { getReleaseSha, getReleaseRepo, getReleaseRef, requireReleaseSha } from './release-identity';

const original = {
  APP_RELEASE_SHA: process.env.APP_RELEASE_SHA,
  VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
  GITHUB_SHA: process.env.GITHUB_SHA,
  VERCEL_GIT_REPO_OWNER: process.env.VERCEL_GIT_REPO_OWNER,
  VERCEL_GIT_REPO_SLUG: process.env.VERCEL_GIT_REPO_SLUG,
  VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF,
};

function clearReleaseEnvironment() {
  delete process.env.APP_RELEASE_SHA;
  delete process.env.VERCEL_GIT_COMMIT_SHA;
  delete process.env.GITHUB_SHA;
  delete process.env.VERCEL_GIT_REPO_OWNER;
  delete process.env.VERCEL_GIT_REPO_SLUG;
  delete process.env.VERCEL_GIT_COMMIT_REF;
}

afterEach(() => {
  clearReleaseEnvironment();
  for (const [name, value] of Object.entries(original)) {
    if (value !== undefined) process.env[name] = value;
  }
});

describe('getReleaseSha', () => {
  it('returns a normalized exact 40-character candidate', () => {
    clearReleaseEnvironment();
    process.env.APP_RELEASE_SHA = 'ABCDEF0123456789ABCDEF0123456789ABCDEF01';

    expect(getReleaseSha()).toBe('abcdef0123456789abcdef0123456789abcdef01');
  });

  it('rejects abbreviated SHAs as ambiguous release evidence', () => {
    clearReleaseEnvironment();
    process.env.APP_RELEASE_SHA = 'abcdef0';

    expect(getReleaseSha()).toBeNull();
  });

  it('rejects malformed runtime metadata', () => {
    clearReleaseEnvironment();
    process.env.VERCEL_GIT_COMMIT_SHA = 'not-a-commit';

    expect(getReleaseSha()).toBeNull();
  });

  it('returns null when no provider exposes source identity', () => {
    clearReleaseEnvironment();

    expect(getReleaseSha()).toBeNull();
  });

  it('prefers provider-native commit metadata over APP_RELEASE_SHA', () => {
    clearReleaseEnvironment();
    process.env.APP_RELEASE_SHA = '1111111111111111111111111111111111111111';
    process.env.VERCEL_GIT_COMMIT_SHA = '2222222222222222222222222222222222222222';

    expect(getReleaseSha()).toBe('2222222222222222222222222222222222222222');
  });

  it('falls back to APP_RELEASE_SHA only when provider-native metadata is absent', () => {
    clearReleaseEnvironment();
    process.env.APP_RELEASE_SHA = '3333333333333333333333333333333333333333';

    expect(getReleaseSha()).toBe('3333333333333333333333333333333333333333');
  });
});

describe('getReleaseRepo', () => {
  it('returns owner/name when the git integration exposes both', () => {
    clearReleaseEnvironment();
    process.env.VERCEL_GIT_REPO_OWNER = 'ChaosClubCo';
    process.env.VERCEL_GIT_REPO_SLUG = 'Infinite-Heros-Bedtime-Chronicles-v5';

    expect(getReleaseRepo()).toBe('ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5');
  });

  it('returns null when either half is missing (local dev, CLI uploads)', () => {
    clearReleaseEnvironment();
    process.env.VERCEL_GIT_REPO_OWNER = 'ChaosClubCo';

    expect(getReleaseRepo()).toBeNull();
  });
});

describe('getReleaseRef', () => {
  it('returns the deployment branch when exposed and null otherwise', () => {
    clearReleaseEnvironment();
    expect(getReleaseRef()).toBeNull();

    process.env.VERCEL_GIT_COMMIT_REF = 'main';
    expect(getReleaseRef()).toBe('main');
  });
});

describe('requireReleaseSha', () => {
  it('returns the exact candidate when available', () => {
    clearReleaseEnvironment();
    process.env.GITHUB_SHA = '0123456789abcdef0123456789abcdef01234567';

    expect(requireReleaseSha()).toBe('0123456789abcdef0123456789abcdef01234567');
  });

  it('throws before destructive proof when candidate identity is unavailable', () => {
    clearReleaseEnvironment();

    expect(() => requireReleaseSha()).toThrow('Exact release candidate metadata is unavailable');
  });
});
