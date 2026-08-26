import { useCallback } from "react";
import { useAudioPlayback } from "./useAudioPlayback";

export interface StreamCallbacks {
  onUserTranscript?: (text: string) => void;
  onTranscript?: (text: string, full: string) => void;
  onComplete?: (transcript: string) => void;
  onError?: (error: Error) => void;
}

export function useVoiceStream(callbacks: StreamCallbacks = {}) {
  const playback = useAudioPlayback();

  const streamVoiceResponse = useCallback(async (url: string, audioBlob: Blob, accessToken?: string): Promise<void> => {
    await playback.init();
    playback.clear();

    const base64Audio = await new Promise<string>((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onerror = () => reject(new Error("Unable to read recorded audio"));
      fileReader.onload = () => {
        const result = fileReader.result;
        if (typeof result !== "string" || !result.includes(",")) {
          reject(new Error("Invalid recorded audio payload"));
          return;
        }
        resolve(result.split(",", 2)[1]);
      };
      fileReader.readAsDataURL(audioBlob);
    });

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const response = await fetch(url, { method: "POST", headers, body: JSON.stringify({ audio: base64Audio }) });
    if (!response.ok) {
      const error = new Error(`Voice request failed (${response.status})`);
      callbacks.onError?.(error);
      throw error;
    }

    const streamReader = response.body?.getReader();
    if (!streamReader) throw new Error("No response body");
    const decoder = new TextDecoder();
    let buffer = "";
    let fullTranscript = "";

    while (true) {
      const { done, value } = await streamReader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6)) as { type?: string; data?: string; transcript?: string; error?: string; seq?: number };
          switch (event.type) {
            case "user_transcript": if (event.data) callbacks.onUserTranscript?.(event.data); break;
            case "transcript":
              if (event.data) {
                fullTranscript += event.data;
                callbacks.onTranscript?.(event.data, fullTranscript);
              }
              break;
            case "audio":
              if (event.data) {
                if (typeof event.seq === "number") playback.pushSequencedAudio(event.seq, event.data);
                else playback.pushAudio(event.data);
              }
              break;
            case "done":
              playback.signalComplete();
              callbacks.onComplete?.(event.transcript || fullTranscript);
              break;
            case "error": throw new Error(event.error || "Voice stream failed");
          }
        } catch (error) {
          if (error instanceof SyntaxError) continue;
          const normalized = error instanceof Error ? error : new Error(String(error));
          callbacks.onError?.(normalized);
          throw normalized;
        }
      }
    }
  }, [playback, callbacks]);

  return { streamVoiceResponse, playbackState: playback.state, disposePlayback: playback.dispose };
}
