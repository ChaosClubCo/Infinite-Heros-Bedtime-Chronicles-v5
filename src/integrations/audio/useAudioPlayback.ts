import { useCallback, useRef, useState } from "react";
import { decodePCM16ToFloat32 } from "./audio-utils";

export type PlaybackState = "idle" | "playing" | "ended";

class SequenceBuffer {
  private pending = new Map<number, string[]>();
  private nextSeq = 0;

  push(seq: number, data: string): string[] {
    if (!this.pending.has(seq)) this.pending.set(seq, []);
    this.pending.get(seq)!.push(data);
    const ready: string[] = [];
    while (this.pending.has(this.nextSeq)) {
      ready.push(...this.pending.get(this.nextSeq)!);
      this.pending.delete(this.nextSeq);
      this.nextSeq++;
    }
    return ready;
  }

  reset(): void {
    this.pending.clear();
    this.nextSeq = 0;
  }
}

export function useAudioPlayback(workletPath = "/audio-playback-worklet.js") {
  const [state, setState] = useState<PlaybackState>("idle");
  const ctxRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const readyRef = useRef(false);
  const seqBufferRef = useRef(new SequenceBuffer());

  const init = useCallback(async (): Promise<void> => {
    if (readyRef.current) return;
    const ctx = new AudioContext({ sampleRate: 24000 });
    await ctx.audioWorklet.addModule(workletPath);
    const worklet = new AudioWorkletNode(ctx, "audio-playback-processor");
    worklet.connect(ctx.destination);
    worklet.port.onmessage = (event) => {
      if (event.data.type === "ended") setState("ended");
    };
    ctxRef.current = ctx;
    workletRef.current = worklet;
    readyRef.current = true;
  }, [workletPath]);

  const pushAudio = useCallback((base64Audio: string): void => {
    if (!workletRef.current) return;
    const samples = decodePCM16ToFloat32(base64Audio);
    workletRef.current.port.postMessage({ type: "audio", samples });
    setState("playing");
  }, []);

  const pushSequencedAudio = useCallback((seq: number, base64Audio: string): void => {
    if (!workletRef.current) return;
    const readyChunks = seqBufferRef.current.push(seq, base64Audio);
    for (const chunk of readyChunks) {
      const samples = decodePCM16ToFloat32(chunk);
      workletRef.current.port.postMessage({ type: "audio", samples });
    }
    if (readyChunks.length > 0) setState("playing");
  }, []);

  const signalComplete = useCallback(() => workletRef.current?.port.postMessage({ type: "streamComplete" }), []);
  const clear = useCallback(() => {
    workletRef.current?.port.postMessage({ type: "clear" });
    seqBufferRef.current.reset();
    setState("idle");
  }, []);
  const dispose = useCallback(async (): Promise<void> => {
    workletRef.current?.port.postMessage({ type: "stop" });
    workletRef.current?.disconnect();
    workletRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== "closed") await ctxRef.current.close();
    ctxRef.current = null;
    readyRef.current = false;
    seqBufferRef.current.reset();
    setState("idle");
  }, []);

  return { state, init, pushAudio, pushSequencedAudio, signalComplete, clear, dispose };
}
