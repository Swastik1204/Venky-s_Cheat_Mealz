#!/usr/bin/env node
/**
 * Build-time WebP conversion for bundled static images actually rendered via
 * <img> in the app (not og-image — social-crawler WebP support is
 * inconsistent for that specific use case, so it stays JPG/PNG; not favicon/
 * apple-touch-icon links either — those have no content-negotiation
 * mechanism and apple-touch-icon specifically requires PNG on iOS).
 *
 * Writes a sibling .webp next to each source; the source itself is left in
 * place as the <picture> fallback for browsers that don't support WebP.
 * Safe to run repeatedly — sharp overwrites the output each time.
 *
 * Run via "prebuild" (see package.json) so it always runs before `vite build`.
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Source images rendered directly as <img> in JSX — add to this list as new
// bundled (non-Cloudinary, non-og-image) images are introduced.
// The git-tracked file is `logo.png` (lowercase) — confirmed via `git
// ls-tree`, not the working-tree listing, which is misleading on a
// case-insensitive filesystem (Windows/macOS): a prior commit
// (f7a1ea2, 2026-09-11) already fixed every reference to lowercase after
// this exact mismatch 404'd og:image and the favicon on the case-sensitive
// (Linux) production host. Use the lowercase path here so the derived
// .webp matches that same, already-proven-correct convention.
const SOURCES = [
  'icons/logo.png',
];

async function run() {
  for (const rel of SOURCES) {
    const src = path.join(PUBLIC_DIR, rel);
    const dest = src.replace(/\.(png|jpe?g)$/i, '.webp');
    try {
      await sharp(src).webp({ quality: 90 }).toFile(dest);
      console.log(`[build-webp-icons] ${rel} -> ${path.basename(dest)}`);
    } catch (err) {
      console.error(`[build-webp-icons] FAILED for ${rel}:`, err.message);
      process.exit(1);
    }
  }
}

run();
