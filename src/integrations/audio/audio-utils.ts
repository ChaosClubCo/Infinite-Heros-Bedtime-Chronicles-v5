/** Voice-chat audio utilities for PCM16 playback. */
export function decodePCM16ToFloat32(base64Audio: string): Float32Array {
  const raw = atob(base64Audio);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  const pcm16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768;
  return float32;
}

export async function createAudioPlaybackContext(
  workletPath = "/audio-playback-worklet.js",
  sampleRate = 24000,
): Promise<{ ctx: AudioContext; worklet: AudioWorkletNode }> {
  const ctx = new AudioContext({ sampleRate });
  await ctx.audioWorklet.addModule(workletPath);
  const worklet = new AudioWorkletNode(ctx, "audio-playback-processor");
  worklet.connect(ctx.destination);
  return { ctx, worklet };
}
