import type { Express } from "express";
import { AvatarRequestSchema, SceneRequestSchema } from "../validation";
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
      const prompt = `A children's book illustration portrait of a superhero named "${heroName}" who is "${heroTitle}" with the power of "${heroPower}". ${heroDescription}.
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
      const summary = sceneText.substring(0, 300);
      const sceneStyle = getRandomStyle();
      const prompt = `Children's storybook scene illustration for a bedtime story. The hero is "${heroName}": ${heroDescription?.substring(0, 100) || ""}.
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
