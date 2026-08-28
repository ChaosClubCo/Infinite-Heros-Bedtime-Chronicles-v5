import OpenAI, { toFile } from "openai";
import { Buffer } from "node:buffer";

let openAIClient: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OpenAI is not configured. OPENAI_API_KEY is required.");
  if (!openAIClient) openAIClient = new OpenAI({ apiKey });
  return openAIClient;
}

export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const client = getOpenAIClient() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});

export type AudioFormat = "wav" | "mp3" | "webm" | "mp4" | "ogg" | "unknown";
export function detectAudioFormat(buffer: Buffer): AudioFormat {
  if (buffer.length < 12) return "unknown";
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return "wav";
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) return "webm";
  if ((buffer[0] === 0xff && [0xfb, 0xfa, 0xf3].includes(buffer[1])) || (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33)) return "mp3";
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) return "mp4";
  if (buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) return "ogg";
  return "unknown";
}

export async function ensureCompatibleFormat(audioBuffer: Buffer): Promise<{ buffer: Buffer; format: "wav" | "mp3" | "webm" | "mp4" | "ogg" }> {
  const detected = detectAudioFormat(audioBuffer);
  return { buffer: audioBuffer, format: detected === "unknown" ? "wav" : detected };
}

export async function voiceChat(
  audioBuffer: Buffer,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy",
  inputFormat: "wav" | "mp3" = "wav",
  outputFormat: "wav" | "mp3" = "mp3",
): Promise<{ transcript: string; audioResponse: Buffer }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-audio-preview",
    modalities: ["text", "audio"],
    audio: { voice, format: outputFormat },
    messages: [{ role: "user", content: [{ type: "input_audio", input_audio: { data: audioBuffer.toString("base64"), format: inputFormat } }] }],
  });
  const message = response.choices[0]?.message as { audio?: { transcript?: string; data?: string }; content?: string | null } | undefined;
  return { transcript: message?.audio?.transcript || message?.content || "", audioResponse: Buffer.from(message?.audio?.data || "", "base64") };
}

export async function voiceChatStream(
  audioBuffer: Buffer,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy",
  inputFormat: "wav" | "mp3" = "wav",
): Promise<AsyncIterable<{ type: "transcript" | "audio"; data: string }>> {
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-audio-preview",
    modalities: ["text", "audio"],
    audio: { voice, format: "pcm16" },
    messages: [{ role: "user", content: [{ type: "input_audio", input_audio: { data: audioBuffer.toString("base64"), format: inputFormat } }] }],
    stream: true,
  });
  return (async function* () {
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta as { audio?: { transcript?: string; data?: string } } | undefined;
      if (delta?.audio?.transcript) yield { type: "transcript", data: delta.audio.transcript };
      if (delta?.audio?.data) yield { type: "audio", data: delta.audio.data };
    }
  })();
}

export async function textToSpeech(text: string, voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy", format: "wav" | "mp3" | "flac" | "opus" | "pcm16" = "wav"): Promise<Buffer> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-audio-preview",
    modalities: ["text", "audio"],
    audio: { voice, format },
    messages: [{ role: "system", content: "You are an assistant that performs text-to-speech." }, { role: "user", content: `Repeat the following text verbatim: ${text}` }],
  });
  const message = response.choices[0]?.message as { audio?: { data?: string } } | undefined;
  return Buffer.from(message?.audio?.data || "", "base64");
}

export async function textToSpeechStream(text: string, voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy"): Promise<AsyncIterable<string>> {
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-audio-preview",
    modalities: ["text", "audio"],
    audio: { voice, format: "pcm16" },
    messages: [{ role: "system", content: "You are an assistant that performs text-to-speech." }, { role: "user", content: `Repeat the following text verbatim: ${text}` }],
    stream: true,
  });
  return (async function* () {
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta as { audio?: { data?: string } } | undefined;
      if (delta?.audio?.data) yield delta.audio.data;
    }
  })();
}

export async function speechToText(audioBuffer: Buffer, format: "wav" | "mp3" | "webm" | "mp4" | "ogg" = "wav"): Promise<string> {
  const file = await toFile(audioBuffer, `audio.${format}`);
  const response = await openai.audio.transcriptions.create({ file, model: "gpt-4o-mini-transcribe" });
  return response.text;
}

export async function speechToTextStream(audioBuffer: Buffer, format: "wav" | "mp3" | "webm" | "mp4" | "ogg" = "wav"): Promise<AsyncIterable<string>> {
  const file = await toFile(audioBuffer, `audio.${format}`);
  const stream = await openai.audio.transcriptions.create({ file, model: "gpt-4o-mini-transcribe", stream: true });
  return (async function* () { for await (const event of stream) if (event.type === "transcript.text.delta") yield event.delta; })();
}
