import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require.extensions['.png'] = (module) => {
  module.exports = 1; // Return a dummy number/mock for React Native's ImageSourcePropType (which is normally a resource ID/number)
};

const { HEROES } = await import('../constants/heroes.ts');

const force = process.argv.includes('--force');

async function generate() {
  const assetsDir = path.join(projectRoot, 'assets', 'heroes');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  for (const hero of HEROES) {
    const filePath = path.join(assetsDir, `${hero.id}.png`);
    if (fs.existsSync(filePath) && !force) {
      console.log(`[Hero Avatar] Skip ${hero.name} (exists)`);
      continue;
    }

    console.log(`[Hero Avatar] Generating for ${hero.name}...`);
    try {
      const response = await fetch('http://localhost:5000/api/generate-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heroName: hero.name,
          heroTitle: hero.title,
          heroPower: hero.power,
          heroDescription: hero.description,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.image) {
        throw new Error('No image returned in response');
      }

      const base64Data = data.image.split(';base64,').pop();
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      console.log(`[Hero Avatar] Saved ${hero.name} to ${filePath}`);
    } catch (error) {
      console.error(`[Hero Avatar] Failed to generate for ${hero.name}:`, error.message || error);
      process.exit(1);
    }
  }
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
