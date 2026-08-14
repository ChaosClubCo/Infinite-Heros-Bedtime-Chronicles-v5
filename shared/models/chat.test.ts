import { describe, it, expect } from 'vitest';
import {
  conversations,
  messages,
  insertConversationSchema,
  insertMessageSchema,
} from './chat';

describe('Shared Voice Chat Database Schema & Models', () => {
  it('validates conversation and message table definitions', () => {
    expect(conversations).toBeDefined();
    expect(messages).toBeDefined();
  });

  it('validates insertConversationSchema validation rules', () => {
    const valid = insertConversationSchema.safeParse({
      title: 'Bedtime Chat with Nova',
    });
    expect(valid.success).toBe(true);

    const invalid = insertConversationSchema.safeParse({});
    expect(invalid.success).toBe(false);
  });

  it('validates insertMessageSchema validation rules', () => {
    const valid = insertMessageSchema.safeParse({
      conversationId: 42,
      role: 'user',
      content: 'Tell me a story about stars',
    });
    expect(valid.success).toBe(true);

    const missingContent = insertMessageSchema.safeParse({
      conversationId: 42,
      role: 'assistant',
    });
    expect(missingContent.success).toBe(false);
  });
});
