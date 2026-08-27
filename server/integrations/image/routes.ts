import type { Express, Request, Response } from "express";
import { Modality } from "@google/genai";
import { ai } from "./client";

export function registerImageRoutes(app: Express): void {
  app.post("/api/generate-image", async (req: Request, res: Response) => {
    try {
      const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
      if (!prompt) return res.status(400).json({ error: "Prompt is required" });
      if (prompt.length > 8_000) return res.status(400).json({ error: "Prompt is too long" });
      const response = await ai.models.generateContent({ model: "gemini-2.5-flash-image", contents: [{ role: "user", parts: [{ text: prompt }] }], config: { responseModalities: [Modality.TEXT, Modality.IMAGE] } });
      const imagePart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);
      if (!imagePart?.inlineData?.data) return res.status(502).json({ error: "No image data in response" });
      res.json({ b64_json: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType || "image/png" });
    } catch (error) { console.error("Error generating image:", error); res.status(500).json({ error: "Failed to generate image" }); }
  });
}
