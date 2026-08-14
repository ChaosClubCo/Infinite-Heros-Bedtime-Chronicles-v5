import { describe, it, expect } from 'vitest';
import type { Request } from 'express';
import { getClientIp, ttsCachePathFor } from './helpers';

describe('Server Route Helper Utilities', () => {
  it('extracts user ID when authenticated user is present', () => {
    const req = { user: { uid: 'user_12345' } } as unknown as Request;
    expect(getClientIp(req)).toBe('user_12345');
  });

  it('extracts and strips IPv6 scope from client IP', () => {
    const req = { ip: 'fe80::1%eth0' } as unknown as Request;
    expect(getClientIp(req)).toBe('fe80::1');
  });

  it('falls back to socket remoteAddress or unknown', () => {
    const req = { socket: { remoteAddress: '192.168.1.1' } } as unknown as Request;
    expect(getClientIp(req)).toBe('192.168.1.1');

    const emptyReq = {} as unknown as Request;
    expect(getClientIp(emptyReq)).toBe('unknown');
  });

  it('computes deterministic MD5 cache filename for TTS cache key', () => {
    const { fileName, filePath } = ttsCachePathFor('Nova:Gentle:Part1');
    expect(fileName).toMatch(/^[a-f0-9]{32}\.mp3$/);
    expect(filePath).toContain(fileName);
  });
});
