export interface GenerateVideoOptions {
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
}

export interface AnimateImageOptions {
  imageBase64: string;
  imageMimeType?: string;
  prompt?: string;
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
}

export interface VideoJobStatus {
  done: boolean;
  hasError?: boolean;
  error?: any;
}

export async function startTextToVideo(options: GenerateVideoOptions): Promise<string> {
  const response = await fetch('/api/gemini/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to start video generation (${response.status})`);
  }

  const data = await response.json();
  return data.operationName;
}

export async function startAnimateImage(options: AnimateImageOptions): Promise<string> {
  const response = await fetch('/api/gemini/animate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to start image animation (${response.status})`);
  }

  const data = await response.json();
  return data.operationName;
}

export async function pollVideoStatus(operationName: string): Promise<VideoJobStatus> {
  const response = await fetch('/api/gemini/video-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to check video status');
  }

  return response.json();
}

export async function downloadGeneratedVideoBlob(operationName: string): Promise<Blob> {
  const response = await fetch('/api/gemini/video-download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to download video stream');
  }

  return response.blob();
}
