import { GoogleGenAI, Modality } from "@google/genai";
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("Gemini is not configured. Set AI_INTEGRATIONS_GEMINI_API_KEY or legacy GEMINI_API_KEY.");
  if (!geminiClient) geminiClient = new GoogleGenAI({ apiKey });
  return geminiClient;
}
export const ai: GoogleGenAI = new Proxy({} as GoogleGenAI, {
  get(_target, prop) {
    const client = getGeminiClient() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});
export async function generateImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({ model: "gemini-2.5-flash-image", contents: [{ role: "user", parts: [{ text: prompt }] }], config: { responseModalities: [Modality.TEXT, Modality.IMAGE] } });
  const imagePart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);
  if (!imagePart?.inlineData?.data) throw new Error("No image data in response");
  return `data:${imagePart.inlineData.mimeType || "image/png"};base64,${imagePart.inlineData.data}`;
}
