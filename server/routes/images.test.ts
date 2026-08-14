import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { registerImageGenRoutes } from './images';
import { aiRouter } from './context';

describe('Image Generation Routes (/api/generate-avatar, /api/generate-scene)', () => {
  const app = express();
  app.use(express.json());
  registerImageGenRoutes(app);

  it('rejects invalid avatar request body with 400 Bad Request', async () => {
    const res = await request(app).post('/api/generate-avatar').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('rejects invalid scene request body with 400 Bad Request', async () => {
    const res = await request(app).post('/api/generate-scene').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('generates avatar successfully with valid payload', async () => {
    vi.spyOn(aiRouter, 'generateImage').mockResolvedValueOnce({
      imageDataUri: 'data:image/png;base64,mockAvatarUri',
      provider: 'gemini',
      model: 'gemini-2.5-flash-image',
    } as any);

    const res = await request(app)
      .post('/api/generate-avatar')
      .send({
        heroName: 'Nova',
        heroTitle: 'Guardian of Light',
        heroPower: 'Starlight Shield',
        heroDescription: 'Protects children in dreams',
      });

    expect(res.status).toBe(200);
    expect(res.body.image).toBe('data:image/png;base64,mockAvatarUri');
  });

  it('generates scene illustration successfully with valid payload', async () => {
    vi.spyOn(aiRouter, 'generateImage').mockResolvedValueOnce({
      imageDataUri: 'data:image/png;base64,mockSceneUri',
      provider: 'gemini',
      model: 'gemini-2.5-flash-image',
    } as any);

    const res = await request(app)
      .post('/api/generate-scene')
      .send({
        heroName: 'Nova',
        sceneText: 'Nova flew over the starry clouds and found a lost moonbeam.',
        heroDescription: 'A starry superhero',
      });

    expect(res.status).toBe(200);
    expect(res.body.image).toBe('data:image/png;base64,mockSceneUri');
  });
});
