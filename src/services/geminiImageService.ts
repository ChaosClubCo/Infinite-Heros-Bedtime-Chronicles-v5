export interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  imageSize?: '512px' | '1K' | '2K';
  referenceImage?: string;
  referenceMimeType?: string;
}

export interface GeneratedImageResult {
  imageUrl: string;
  description?: string;
  modelUsed: string;
}

export async function generateOrEditImage(
  options: GenerateImageOptions
): Promise<GeneratedImageResult> {
  const response = await fetch('/api/gemini/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Image generation failed (${response.status})`);
  }

  return response.json();
}
