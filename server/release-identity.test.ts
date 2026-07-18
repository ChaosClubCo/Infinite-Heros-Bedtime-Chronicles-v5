import { afterEach, describe, expect, it } from 'vitest';
import { getReleaseSha } from './release-identity';

const original = {
  APP_RELEASE_SHA: process.env.APP_RELEASE_SHA,
  VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
  GITHUB_SHA: process.env.GITHUB_SHA,
};

function clearReleaseEnvironment() {
  delete process.env.APP_RELEASE_SHA;
  delete process.env.VERCEL_GIT_COMMIT_SHA;
  delete process.env.GITHUB_SHA;
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
});
