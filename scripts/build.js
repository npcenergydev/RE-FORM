import fs from 'fs';

// Mirror frontend build artifacts so Vercel can locate public/, dist/, or frontend/dist
const src = 'frontend/dist';
const targets = ['public', 'dist'];

for (const target of targets) {
  try {
    fs.rmSync(target, { recursive: true, force: true });
    fs.cpSync(src, target, { recursive: true });
  } catch (err) {
    console.warn(`[Build] Notice while mirroring to ${target}:`, err.message);
  }
}
console.log('✓ Successfully prepared output directories for Vercel (public/ and dist/)');
