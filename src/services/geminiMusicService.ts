export interface GenerateMusicOptions {
  prompt: string;
  modelType?: 'clip' | 'pro';
  imageBase64?: string;
  imageMimeType?: string;
}

export interface GeneratedMusicResult {
  audioUrl: string;
  mimeType: string;
  lyrics?: string;
  modelUsed: string;
}

export async function generateBedtimeMusic(
  options: GenerateMusicOptions
): Promise<GeneratedMusicResult> {
  const response = await fetch('/api/gemini/generate-music', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Music generation failed (${response.status})`);
  }

  return response.json();
}
