import type { Express } from "express";
import { AvatarRequestSchema, SceneRequestSchema, sanitizePromptInput } from "../validation";
import { getRandomStyle } from "../prompts";
import { aiRouter } from "./context";
import { rateLimited, sendRouteError } from "./helpers";

export function registerImageGenRoutes(app: Express): void {
  app.post("/api/generate-avatar", rateLimited(), async (req, res) => {
    const parsed = AvatarRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { heroName, heroTitle, heroPower, heroDescription } = parsed.data;

    try {
      const artStyle = getRandomStyle();
      const prompt = `A children's book illustration portrait of a superhero named "${sanitizePromptInput(heroName, 500)}" who is "${sanitizePromptInput(heroTitle, 500)}" with the power of "${sanitizePromptInput(heroPower, 500)}". ${sanitizePromptInput(heroDescription, 500)}.
Style: ${artStyle}. Close-up friendly portrait, expressive eyes, child-safe content, suitable for ages 3-9. No scary elements, no weapons. Circular portrait composition with a cosmic/starry background.`;

      const result = await aiRouter.generateImage("avatar", { prompt });
      req.log?.info({ provider: result.provider, model: result.model }, 'avatar generated');
      return res.json({ image: result.imageDataUri });
    } catch (error: unknown) {
      sendRouteError(req, res, error, 'avatar generation failed', 'Failed to generate avatar');
    }
  });

  app.post("/api/generate-scene", rateLimited(), async (req, res) => {
    const parsed = SceneRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { heroName, sceneText, heroDescription } = parsed.data;

    try {
      const summary = sanitizePromptInput(sceneText, 300);
      const sceneStyle = getRandomStyle();
      const prompt = `Children's storybook scene illustration for a bedtime story. The hero is "${sanitizePromptInput(heroName, 500)}": ${sanitizePromptInput(heroDescription || "", 100)}.
Scene: ${summary}
Style: ${sceneStyle}. Wide landscape composition, magical atmosphere, child-safe content, suitable for ages 3-9. No scary elements. Warm, cozy, wonder-filled.`;

      const result = await aiRouter.generateImage("scene", { prompt });
      req.log?.info({ provider: result.provider, model: result.model }, 'scene generated');
      return res.json({ image: result.imageDataUri });
    } catch (error: unknown) {
      sendRouteError(req, res, error, 'scene generation failed', 'Failed to generate scene');
    }
  });
}
