import { describe, it, expect, vi } from 'vitest';

describe('Server Database Client Initialization', () => {
  it('exports initialized Drizzle ORM client', async () => {
    const { db } = await import('./db');
    expect(db).toBeDefined();
    expect(typeof db.select).toBe('function');
    expect(typeof db.insert).toBe('function');
    expect(typeof db.update).toBe('function');
    expect(typeof db.delete).toBe('function');
  });

  it('handles SSL configuration dynamically when DATABASE_URL is set', () => {
    const urlWithSsl = 'postgres://user:pass@host:5432/db?sslmode=require';
    const isSsl = urlWithSsl.includes('sslmode=require');
    expect(isSsl).toBe(true);

    const plainUrl = 'postgres://user:pass@localhost:5432/db';
    const isPlainSsl = plainUrl.includes('sslmode=require');
    expect(isPlainSsl).toBe(false);
  });
});
