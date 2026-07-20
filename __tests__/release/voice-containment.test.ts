import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const voiceScreen = readFileSync(resolve(process.cwd(), 'app/voice-chat.tsx'), 'utf8');
const profileScreen = readFileSync(resolve(process.cwd(), 'app/(tabs)/profile.tsx'), 'utf8');
const appConfig = JSON.parse(readFileSync(resolve(process.cwd(), 'app.json'), 'utf8')) as {
  expo?: {
    android?: { permissions?: string[]; blockedPermissions?: string[] };
    ios?: { infoPlist?: Record<string, unknown> };
  };
};

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

  it('blocks microphone permission in native release metadata', () => {
    expect(appConfig.expo?.android?.permissions ?? []).not.toContain('android.permission.RECORD_AUDIO');
    expect(appConfig.expo?.android?.blockedPermissions).toContain('android.permission.RECORD_AUDIO');
    expect(appConfig.expo?.ios?.infoPlist ?? {}).not.toHaveProperty('NSMicrophoneUsageDescription');
  });

  it('removes the Voice Chat entry point from the release UI', () => {
    expect(profileScreen).not.toContain('/voice-chat');
    expect(profileScreen).not.toContain('Voice Chat');
    expect(profileScreen).not.toContain('mic-outline');
    expect(profileScreen).not.toContain('mic-off-outline');
  });
});
