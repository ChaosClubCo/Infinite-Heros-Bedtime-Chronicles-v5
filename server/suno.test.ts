import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'node:path';

const { readdirMock } = vi.hoisted(() => ({
  readdirMock: vi.fn(),
}));

vi.mock('node:fs', () => ({
  default: { readdirSync: readdirMock },
}));

// suno.ts scans assets/music at module load, so each scenario re-imports a
// fresh module instance after configuring the fs mock.
async function loadSuno() {
  return import('./suno');
}

describe('suno music selection', () => {
  beforeEach(() => {
    vi.resetModules();
    readdirMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('groups tracks by mode prefix and counts only matching .mp3 files', async () => {
    readdirMock.mockReturnValue([
      'classic.mp3',
      'classic_2.mp3',
      'classic.wav',
      'sleep.mp3',
      'madlibs.mp3',
      'readme.txt',
    ]);
    const suno = await loadSuno();
    expect(suno.getMusicTrackCount('classic')).toBe(2);
    expect(suno.getMusicTrackCount('sleep')).toBe(1);
    expect(suno.getMusicTrackCount('madlibs')).toBe(1);
  });

  it('returns a deterministic file for a valid track index (sorted order)', async () => {
    readdirMock.mockReturnValue(['classic_2.mp3', 'classic.mp3']);
    const suno = await loadSuno();
    expect(suno.getMusicFileName('classic', 0)).toBe('classic.mp3');
    expect(suno.getMusicFileName('classic', 1)).toBe('classic_2.mp3');
  });

  it('picks randomly from the mode tracks when the index is missing or out of range', async () => {
    readdirMock.mockReturnValue(['classic.mp3', 'classic_2.mp3']);
    const suno = await loadSuno();
    const tracks = ['classic.mp3', 'classic_2.mp3'];
    expect(tracks).toContain(suno.getMusicFileName('classic'));
    expect(tracks).toContain(suno.getMusicFileName('classic', -1));
    expect(tracks).toContain(suno.getMusicFileName('classic', 99));
  });

  it('pins random selection via Math.random', async () => {
    readdirMock.mockReturnValue(['classic.mp3', 'classic_2.mp3']);
    const suno = await loadSuno();
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(suno.getMusicFileName('classic')).toBe('classic_2.mp3');
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(suno.getMusicFileName('classic')).toBe('classic.mp3');
  });

  it('falls back to the classic track list for unknown modes', async () => {
    readdirMock.mockReturnValue(['classic.mp3', 'sleep.mp3', 'madlibs.mp3']);
    const suno = await loadSuno();
    expect(suno.getMusicFileName('jazz')).toBe('classic.mp3');
    expect(suno.getMusicTrackCount('jazz')).toBe(0);
  });

  it('falls back to <mode>.mp3 and warns when the directory scan fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    readdirMock.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    const suno = await loadSuno();
    expect(suno.getMusicFileName('sleep', 0)).toBe('sleep.mp3');
    expect(suno.getMusicTrackCount('classic')).toBe(1);
    expect(warnSpy).toHaveBeenCalledTimes(3);
  });

  it('uses <mode>.mp3 when the directory has no tracks for the mode', async () => {
    readdirMock.mockReturnValue([]);
    const suno = await loadSuno();
    expect(suno.getMusicFileName('classic', 0)).toBe('classic.mp3');
    expect(suno.getMusicTrackCount('classic')).toBe(1);
  });

  it('resolves music file paths under assets/music', async () => {
    readdirMock.mockReturnValue(['classic.mp3']);
    const suno = await loadSuno();
    expect(suno.getMusicFilePath('classic', 0)).toBe(path.resolve('assets', 'music', 'classic.mp3'));
  });
});
