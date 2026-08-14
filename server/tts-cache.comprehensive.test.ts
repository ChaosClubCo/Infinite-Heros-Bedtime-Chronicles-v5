import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { TtsCacheManager } from './tts-cache';

describe('Server TTS Cache Manager Comprehensive Test Suite', () => {
  let tempDir: string;
  let cacheManager: TtsCacheManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tts-cache-test-'));
    cacheManager = new TtsCacheManager({
      cacheDir: tempDir,
      maxAgeMs: 1000, // 1 second for fast testing
      maxSizeBytes: 1024, // 1 KB
    });
    cacheManager.ensureDir();
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('ensures cache directory is created', () => {
    expect(fs.existsSync(tempDir)).toBe(true);
    expect(cacheManager.getMaxSizeBytes()).toBe(1024);
  });

  it('correctly evaluates shouldEvict threshold', () => {
    expect(cacheManager.shouldEvict(500)).toBe(false);
    expect(cacheManager.shouldEvict(1025)).toBe(true);
  });

  it('cleans up expired files past maxAgeMs', async () => {
    const expiredFile = path.join(tempDir, 'expired.mp3');
    fs.writeFileSync(expiredFile, Buffer.alloc(100));

    // Backdate mtime to 2 seconds ago
    const pastTime = (Date.now() - 2000) / 1000;
    fs.utimesSync(expiredFile, pastTime, pastTime);

    const { removedCount, freedBytes } = await cacheManager.cleanup();
    expect(removedCount).toBe(1);
    expect(freedBytes).toBe(100);
    expect(fs.existsSync(expiredFile)).toBe(false);
  });

  it('cleans up oldest files when total cache size exceeds maxSizeBytes', async () => {
    const file1 = path.join(tempDir, 'old1.mp3');
    const file2 = path.join(tempDir, 'new2.mp3');

    fs.writeFileSync(file1, Buffer.alloc(700));
    fs.writeFileSync(file2, Buffer.alloc(700));

    // file1 older than file2
    const timeOld = (Date.now() - 200) / 1000;
    const timeNew = Date.now() / 1000;
    fs.utimesSync(file1, timeOld, timeOld);
    fs.utimesSync(file2, timeNew, timeNew);

    const { removedCount } = await cacheManager.cleanup();
    expect(removedCount).toBe(1);
    expect(fs.existsSync(file1)).toBe(false);
    expect(fs.existsSync(file2)).toBe(true);
  });
});
