import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const voiceScreen = readFileSync(resolve(process.cwd(), 'app/voice-chat.tsx'), 'utf8');
const profileScreen = readFileSync(resolve(process.cwd(), 'app/(tabs)/profile.tsx'), 'utf8');

describe('release voice containment', () => {
  it('contains no client audio runtime or microphone permission path', () => {
    expect(voiceScreen).not.toContain('expo-av');
    expect(voiceScreen).not.toContain('expo-audio');
    expect(voiceScreen).not.toContain('requestPermissionsAsync');
    expect(voiceScreen).not.toContain('Recording');
    expect(voiceScreen).not.toContain('getUserMedia');
  });

  it('contains no voice conversation or audio network path', () => {
    expect(voiceScreen).not.toContain('/api/conversations');
    expect(voiceScreen).not.toContain('api/conversations');
    expect(voiceScreen).not.toContain('api/tts');
    expect(voiceScreen).not.toContain('base64Audio');
    expect(voiceScreen).not.toContain('audio:');
  });

  it('truthfully labels the entry point as unavailable', () => {
    expect(profileScreen).toContain('Voice Chat (Unavailable)');
    expect(profileScreen).toContain('mic-off-outline');
  });
});
