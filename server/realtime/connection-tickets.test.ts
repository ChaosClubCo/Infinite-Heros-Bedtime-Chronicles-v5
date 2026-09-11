import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { issueConnectionTicket, consumeConnectionTicket, _resetConnectionTicketsForTests } from "./connection-tickets";

beforeEach(() => {
  _resetConnectionTicketsForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("connection tickets", () => {
  it("issues a ticket that consumes once for the matching session and owner", () => {
    const ticket = issueConnectionTicket("session-1", "owner-1");
    expect(consumeConnectionTicket("session-1", ticket)).toEqual({ ownerId: "owner-1" });
  });

  it("cannot be consumed a second time (single-use)", () => {
    const ticket = issueConnectionTicket("session-1", "owner-1");
    consumeConnectionTicket("session-1", ticket);
    expect(consumeConnectionTicket("session-1", ticket)).toBeNull();
  });

  it("rejects a ticket presented for a different session id", () => {
    const ticket = issueConnectionTicket("session-1", "owner-1");
    expect(consumeConnectionTicket("session-2", ticket)).toBeNull();
  });

  it("rejects an unknown ticket", () => {
    expect(consumeConnectionTicket("session-1", "not-a-real-ticket")).toBeNull();
  });

  it("rejects a missing ticket", () => {
    expect(consumeConnectionTicket("session-1", undefined)).toBeNull();
  });

  it("rejects an expired ticket", () => {
    vi.useFakeTimers();
    const ticket = issueConnectionTicket("session-1", "owner-1");
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(consumeConnectionTicket("session-1", ticket)).toBeNull();
  });

  it("issues distinct tickets for distinct sessions", () => {
    const a = issueConnectionTicket("session-a", "owner-1");
    const b = issueConnectionTicket("session-b", "owner-1");
    expect(a).not.toBe(b);
  });
});
