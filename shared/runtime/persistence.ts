/**
 * Bounded persistence health signal independent of a specific database driver.
 */

export type PersistenceHealth = {
  ok: boolean;
  provider: string;
  latencyMs: number;
};
