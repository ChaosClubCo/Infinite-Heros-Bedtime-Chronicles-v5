/**
 * Single-use WebSocket connection tickets.
 *
 * The realtime-media WS upgrade handshake (`server/realtime/ws-server.ts`)
 * cannot reuse `server/auth.ts`'s bearer-token middleware directly — a browser
 * WebSocket client cannot attach an Authorization header to the upgrade
 * request, and the alternative of putting the Supabase JWT in the URL's query
 * string would leak a long-lived credential into server access logs, proxy
 * logs, and the Referer header of any same-origin resource the page loads
 * next. Instead, `POST /api/v1/realtime-media-sessions` (already
 * authenticated via the normal `requireAuth` gate) mints a short-lived,
 * single-use ticket bound to that caller's `uid`, embeds it in the `wsUrl` it
 * returns, and the upgrade handler here consumes it once before accepting the
 * socket. A leaked ticket is worth at most one connection to one session for
 * 5 minutes — a much smaller blast radius than a leaked JWT.
 */

import { randomBytes } from 'node:crypto';

const TICKET_TTL_MS = 5 * 60 * 1000;

interface TicketRecord {
  sessionId: string;
  ownerId: string;
  expiresAt: number;
}

const tickets = new Map<string, TicketRecord>();

/** Issue a single-use ticket for `sessionId`, bound to `ownerId`. */
export function issueConnectionTicket(sessionId: string, ownerId: string): string {
  const ticket = randomBytes(32).toString('hex');
  tickets.set(ticket, { sessionId, ownerId, expiresAt: Date.now() + TICKET_TTL_MS });
  return ticket;
}

/**
 * Consume a ticket: valid exactly once, must match `sessionId`, and must not
 * have expired. Returns the bound `ownerId` on success, `null` otherwise —
 * the ticket is deleted either way so a replay (or a guess) never succeeds
 * even if it happened to be the expiry-check race.
 */
export function consumeConnectionTicket(sessionId: string, ticket: string | undefined): { ownerId: string } | null {
  if (!ticket) return null;
  const record = tickets.get(ticket);
  tickets.delete(ticket);
  if (!record) return null;
  if (record.sessionId !== sessionId) return null;
  if (Date.now() > record.expiresAt) return null;
  return { ownerId: record.ownerId };
}

/** Test-only: clear all tickets between test cases. */
export function _resetConnectionTicketsForTests(): void {
  tickets.clear();
}
