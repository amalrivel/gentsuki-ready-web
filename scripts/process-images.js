/**
 * Image processing script — development use only.
 *
 * Usage:
 *   npm run process-images
 *
 * What it does:
 *   Scans every subdirectory inside src/assets/raw_images/ for source images,
 *   then outputs six files per image into public/images/:
 *     {stem}.avif       960 px wide  (primary, smallest)
 *     {stem}.webp       960 px wide  (secondary)
 *     {stem}.jpg        960 px wide  (fallback, mozjpeg)
 *     {stem}-sm.avif    480 px wide  (for srcset 480w)
 *     {stem}-sm.webp    480 px wide
 *     {stem}-sm.jpg     480 px wide
 *   And writes src/generated/image-meta.ts with the [width, height] of each
 *   large output, used by <QuizImage> to set width/height and avoid CLS.
 *
 * Skips images whose outputs are already up-to-date (mtime check).
 * This file is never imported by Vite — it is a standalone dev tool.
 */

import { readdir, mkdir, writeFile, stat } from 'node:fs/promises';
import { join, parse, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── paths ───────────────────────────────────────────────────────────────────

const __dirname  = fileURLToPath(new URL('.', import.meta.url));
const ROOT       = resolve(__dirname, '..');
const RAW_ROOT   = join(ROOT, 'src/assets/raw_images');
const OUTPUT_DIR = join(ROOT, 'public/images');
const META_FILE  = join(ROOT, 'src/generated/image-meta.ts');

// ─── config ──────────────────────────────────────────────────────────────────

const SUPPORTED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

/** Max pixel width of the large output (used for ≥ 540 px viewports). */
const LARGE_W = 960;

/** Max pixel width of the small output (used for < 540 px viewports). */
const SMALL_W = 480;

const QUALITY = {
  avif: 60,   // AVIF is very efficient even at 60
  webp: 75,
  jpeg: 82,   // mozjpeg gives better compression than libjpeg at the same quality
};

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true when src is newer than dst (or dst does not exist).
 * Used to skip images that have already been processed.
 */
async function srcIsNewer(srcPath, dstPath) {
  try {
    const [s, d] = await Promise.all([stat(srcPath), stat(dstPath)]);
    return s.mtimeMs > d.mtimeMs;
  } catch {
    return true; // dst missing → needs processing
  }
}

// ─── collect sources from all subdirectories ─────────────────────────────────

const subdirEntries = await readdir(RAW_ROOT, { withFileTypes: true });
const subdirs = subdirEntries
  .filter((d) => d.isDirectory())
  .map((d) => join(RAW_ROOT, d.name));

/** { stem → absolute source path } — last writer wins if stems collide */
const sourceMap = new Map();

for (const dir of subdirs) {
  const files = await readdir(dir);
  for (const file of files) {
    if (!SUPPORTED_EXTS.has(parse(file).ext.toLowerCase())) continue;
    const { name: stem } = parse(file);
    if (sourceMap.has(stem)) {
      console.warn(`  ⚠  Stem collision: "${stem}" found in multiple source dirs. Using latest.`);
    }
    sourceMap.set(stem, join(dir, file));
  }
}

// ─── main ────────────────────────────────────────────────────────────────────

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error(
    '\n  Error: "sharp" is not installed.\n' +
    '  Run: npm install --save-dev sharp\n',
  );
  process.exit(1);
}

await mkdir(OUTPUT_DIR, { recursive: true });
await mkdir(join(ROOT, 'src/generated'), { recursive: true });

if (sourceMap.size === 0) {
  console.log('No source images found under', RAW_ROOT);
  process.exit(0);
}

console.log(`\nFound ${sourceMap.size} source image(s) across ${subdirs.length} director${subdirs.length === 1 ? 'y' : 'ies'}\n`);

/** Final metadata map: { stem → [width, height] } written to image-meta.ts */
const meta = {};
let processed = 0;
let skipped   = 0;
let failed    = 0;

for (const [stem, src] of sourceMap) {
  const lg = {
    avif: join(OUTPUT_DIR, `${stem}.avif`),
    webp: join(OUTPUT_DIR, `${stem}.webp`),
    jpg:  join(OUTPUT_DIR, `${stem}.jpg`),
  };
  const sm = {
    avif: join(OUTPUT_DIR, `${stem}-sm.avif`),
    webp: join(OUTPUT_DIR, `${stem}-sm.webp`),
    jpg:  join(OUTPUT_DIR, `${stem}-sm.jpg`),
  };

  // Check whether any output is missing or outdated
  const flags = await Promise.all([
    srcIsNewer(src, lg.avif),
    srcIsNewer(src, lg.webp),
    srcIsNewer(src, lg.jpg),
    srcIsNewer(src, sm.avif),
    srcIsNewer(src, sm.webp),
    srcIsNewer(src, sm.jpg),
  ]);
  const needsUpdate = flags.some(Boolean);

  if (!needsUpdate) {
    // Outputs are current — read dimensions from existing large webp
    try {
      const { width, height } = await sharp(lg.webp).metadata();
      meta[stem] = [width ?? 0, height ?? 0];
    } catch {
      // Metadata read failed; will just omit this stem from the map
    }
    skipped++;
    continue;
  }

  try {
    // Use rotate() to auto-apply EXIF orientation before any resizing
    const base  = sharp(src).rotate();
    const large = base.clone().resize({ width: LARGE_W, withoutEnlargement: true });
    const small = base.clone().resize({ width: SMALL_W, withoutEnlargement: true });

    // Encode all six outputs in parallel
    const [lgInfo] = await Promise.all([
      large.clone().avif({ quality: QUALITY.avif }).toFile(lg.avif),
      large.clone().webp({ quality: QUALITY.webp }).toFile(lg.webp),
      large.clone().jpeg({ quality: QUALITY.jpeg, mozjpeg: true }).toFile(lg.jpg),
      small.clone().avif({ quality: QUALITY.avif }).toFile(sm.avif),
      small.clone().webp({ quality: QUALITY.webp }).toFile(sm.webp),
      small.clone().jpeg({ quality: QUALITY.jpeg, mozjpeg: true }).toFile(sm.jpg),
    ]);

    meta[stem] = [lgInfo.width, lgInfo.height];
    console.log(`  ✓  ${stem}  (${lgInfo.width}×${lgInfo.height})`);
    processed++;
  } catch (err) {
    console.error(`  ✗  ${stem}: ${err.message}`);
    failed++;
  }
}

// ─── write metadata TypeScript file ─────────────────────────────────────────

const lines = Object.entries(meta)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([k, [w, h]]) => `  "${k}": [${w}, ${h}],`);

const tsContent = [
  '// AUTO-GENERATED by scripts/process-images.js — do not edit manually.',
  '// Run `npm run process-images` after adding or changing source images.',
  'export const IMAGE_META: Record<string, [number, number]> = {',
  ...lines,
  '};',
  '',
].join('\n');

await writeFile(META_FILE, tsContent, 'utf-8');

// ─── summary ─────────────────────────────────────────────────────────────────

console.log(`\n  Processed : ${processed}`);
console.log(`  Skipped   : ${skipped} (up-to-date)`);
if (failed) console.log(`  Failed    : ${failed}`);
console.log(`\n  Metadata  → src/generated/image-meta.ts`);
console.log(`  Images    → public/images/\n`);
