import { useCallback, useRef, useState } from "react";

export type RecordingState = "idle" | "recording" | "stopped";
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"] as const;

function selectRecorderMimeType(): string | undefined {
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

export function useVoiceRecorder() {
  const [state, setState] = useState<RecordingState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async (): Promise<void> => {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Audio recording is not supported in this browser");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = selectRecorderMimeType();
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
    recorder.start(100);
    setState("recording");
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => new Promise((resolve, reject) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") {
      reject(new Error("No active voice recording"));
      return;
    }
    recorder.onerror = () => reject(new Error("Voice recording failed"));
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      recorder.stream.getTracks().forEach((track) => track.stop());
      setState("stopped");
      resolve(blob);
    };
    recorder.stop();
  }), []);

  return { state, startRecording, stopRecording };
}
