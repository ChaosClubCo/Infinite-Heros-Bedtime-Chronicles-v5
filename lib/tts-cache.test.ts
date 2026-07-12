import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ttsCacheKey,
  getCachedNarrationUri,
  cacheNarration,
  evictIfOverBudget,
  clearNarrationCache,
} from './tts-cache';
import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

// Shared in-memory filesystem the mocked expo-file-system operates on. Declared
// via vi.hoisted so both the vi.mock factory and the tests can reach it.
// (vi.hoisted / vi.mock are hoisted above the imports above by vitest.)
const fsState = vi.hoisted(() => ({
  files: new Map<string, { size: number; mtime: number }>(),
  dirs: new Set<string>(['file:///cache']),
}));

vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { MD5: 'MD5' },
  digestStringAsync: vi.fn(async (_alg: string, data: string) => `md5(${data})`),
}));

vi.mock('expo-file-system', () => {
  const join = (base: string, ...parts: string[]) =>
    [base.replace(/\/$/, ''), ...parts].join('/');

  class Directory {
    uri: string;
    constructor(...args: (string | Directory | File)[]) {
      const parts = args.map((a) => (typeof a === 'string' ? a : a.uri));
      this.uri = parts.length === 1 ? parts[0] : join(parts[0], ...parts.slice(1));
    }
    get exists() { return fsState.dirs.has(this.uri); }
    create() { fsState.dirs.add(this.uri); }
    delete() {
      fsState.dirs.delete(this.uri);
      for (const k of [...fsState.files.keys()]) if (k.startsWith(this.uri + '/')) fsState.files.delete(k);
    }
    list(): File[] {
      return [...fsState.files.keys()]
        .filter((k) => k.startsWith(this.uri + '/'))
        .map((k) => new File(k));
    }
  }

  class File {
    uri: string;
    constructor(...args: (string | Directory | File)[]) {
      const parts = args.map((a) => (typeof a === 'string' ? a : a.uri));
      this.uri = parts.length === 1 ? parts[0] : join(parts[0], ...parts.slice(1));
    }
    get exists() { return fsState.files.has(this.uri); }
    get size() { return fsState.files.get(this.uri)?.size ?? null; }
    get modificationTime() { return fsState.files.get(this.uri)?.mtime ?? null; }
    delete() { fsState.files.delete(this.uri); }
    static downloadFileAsync = vi.fn(async (_url: string, dest: File) => {
      fsState.files.set(dest.uri, { size: 1000, mtime: 1 });
      return new File(dest.uri);
    });
  }

  const Paths = { get cache() { return new Directory('file:///cache'); } };
  return { File, Directory, Paths };
});

const DIR = 'file:///cache/tts-cache';

beforeEach(() => {
  fsState.files.clear();
  fsState.dirs.clear();
  fsState.dirs.add('file:///cache');
  vi.clearAllMocks();
});

describe('ttsCacheKey', () => {
  it('hashes voice:mode:text with MD5 (mirrors the server key)', async () => {
    const key = await ttsCacheKey('moonbeam', 'sleep', 'Once upon a time');
    expect(Crypto.digestStringAsync).toHaveBeenCalledWith('MD5', 'moonbeam:sleep:Once upon a time');
    expect(key).toBe('md5(moonbeam:sleep:Once upon a time)');
  });
});

describe('getCachedNarrationUri', () => {
  it('returns the local URI on a cache hit', () => {
    fsState.files.set(`${DIR}/abc.mp3`, { size: 10, mtime: 1 });
    expect(getCachedNarrationUri('abc')).toBe(`${DIR}/abc.mp3`);
  });

  it('returns null on a miss', () => {
    expect(getCachedNarrationUri('nope')).toBeNull();
  });
});

describe('cacheNarration', () => {
  it('creates the dir, downloads, and returns the local URI', async () => {
    const uri = await cacheNarration('abc', 'https://server/api/tts-audio/abc.mp3');
    expect(uri).toBe(`${DIR}/abc.mp3`);
    expect(fsState.dirs.has(DIR)).toBe(true);
    expect(File.downloadFileAsync).toHaveBeenCalledTimes(1);
  });

  it('reuses an already-cached file without downloading again', async () => {
    fsState.dirs.add(DIR);
    fsState.files.set(`${DIR}/abc.mp3`, { size: 10, mtime: 1 });
    const uri = await cacheNarration('abc', 'https://server/x');
    expect(uri).toBe(`${DIR}/abc.mp3`);
    expect(File.downloadFileAsync).not.toHaveBeenCalled();
  });
});

describe('evictIfOverBudget', () => {
  it('deletes least-recently-written clips until under budget', () => {
    fsState.dirs.add(DIR);
    fsState.files.set(`${DIR}/old.mp3`, { size: 600, mtime: 1 });
    fsState.files.set(`${DIR}/mid.mp3`, { size: 600, mtime: 2 });
    fsState.files.set(`${DIR}/new.mp3`, { size: 600, mtime: 3 });
    // Total 1800 > 1000 budget → evict oldest until <= 1000 (drop old + mid = 600 left).
    evictIfOverBudget(1000);
    expect(fsState.files.has(`${DIR}/old.mp3`)).toBe(false);
    expect(fsState.files.has(`${DIR}/mid.mp3`)).toBe(false);
    expect(fsState.files.has(`${DIR}/new.mp3`)).toBe(true);
  });

  it('does nothing when under budget', () => {
    fsState.dirs.add(DIR);
    fsState.files.set(`${DIR}/a.mp3`, { size: 100, mtime: 1 });
    evictIfOverBudget(1000);
    expect(fsState.files.has(`${DIR}/a.mp3`)).toBe(true);
  });

  it('is a no-op when the cache dir does not exist', () => {
    expect(() => evictIfOverBudget(1000)).not.toThrow();
  });
});

describe('clearNarrationCache', () => {
  it('removes the whole cache directory and its files', () => {
    fsState.dirs.add(DIR);
    fsState.files.set(`${DIR}/a.mp3`, { size: 100, mtime: 1 });
    clearNarrationCache();
    expect(fsState.dirs.has(DIR)).toBe(false);
    expect(fsState.files.has(`${DIR}/a.mp3`)).toBe(false);
  });
});
