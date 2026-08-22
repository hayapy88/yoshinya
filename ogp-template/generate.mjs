// Generates Japanese and English OGP images (1200x630) for a Yoshinya tool from
// yoshinya-ogp-template.svg. Only the tool name changes between locales; the
// rest of the template is shared. Output is saved to public/brand/ogp/.
//
// Usage (from the repo root):
//   node ogp-template/generate.mjs \
//     --slug image-sorter \
//     --ja "よしにゃに|画像仕分け" --ja-size 68 \
//     --en "Image Sorter|by Yoshinya" --en-size 60
//
// - Use "|" in a name to force a line break (max two lines).
// - --*-size is optional (default 60). See README.md for size guidance
//   (short 68 / medium 60 / long 50).

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from '@playwright/test';

const templateDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(templateDir, '..');
const outDir = path.join(repoRoot, 'public', 'brand', 'ogp');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function dataUri(file) {
  const base64 = fs
    .readFileSync(path.join(templateDir, file))
    .toString('base64');
  return `data:image/png;base64,${base64}`;
}

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Builds the <text> element for the tool name (1 or 2 lines), matching the
// template's position, weight, and colour.
function toolNameSvg(name, size) {
  const lines = name
    .split('|')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 2);
  const lineHeight = Math.round(size * 1.37);
  const y = lines.length === 2 ? 320 : 372;
  const tspans = lines
    .map(
      (line, i) =>
        `<tspan x="72" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join('');
  return (
    `<text x="72" y="${y}" font-family="'Noto Sans JP','Hiragino Sans',sans-serif" ` +
    `font-size="${size}" font-weight="800" letter-spacing="-1.5" fill="#08275F">${tspans}</text>`
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.slug;
  if (!slug || (!args.ja && !args.en)) {
    console.error(
      'Usage: node ogp-template/generate.mjs --slug <slug> --ja "<name>" [--ja-size N] --en "<name>" [--en-size N]',
    );
    process.exit(1);
  }

  // Self-contain the template: inline the two assets as data URIs so rendering
  // does not depend on relative paths.
  let template = fs.readFileSync(
    path.join(templateDir, 'yoshinya-ogp-template.svg'),
    'utf8',
  );
  template = template
    .replace('assets/logo-yoshinya.png', dataUri('assets/logo-yoshinya.png'))
    .replace('assets/yoshinyan-wink.png', dataUri('assets/yoshinyan-wink.png'));

  const jobs = [];
  if (args.ja) {
    jobs.push({
      locale: 'ja',
      name: args.ja,
      size: Number(args['ja-size']) || 60,
    });
  }
  if (args.en) {
    jobs.push({
      locale: 'en',
      name: args.en,
      size: Number(args['en-size']) || 60,
    });
  }

  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const job of jobs) {
      // Replace the placeholder <text> inside the editable group.
      const svg = template.replace(
        /<text x="72" y="320"[\s\S]*?<\/text>/,
        toolNameSvg(job.name, job.size),
      );
      const page = await browser.newPage({
        viewport: { width: 1200, height: 630 },
        deviceScaleFactor: 1,
      });
      await page.setContent(
        `<!doctype html><meta charset="utf-8"><style>*{margin:0}body{width:1200px;height:630px;overflow:hidden}</style>${svg}`,
        { waitUntil: 'networkidle' },
      );
      const out = path.join(outDir, `ogp-${slug}-${job.locale}.png`);
      await page.screenshot({
        path: out,
        clip: { x: 0, y: 0, width: 1200, height: 630 },
      });
      await page.close();
      console.log(`✓ ${path.relative(repoRoot, out)}`);
    }
  } finally {
    await browser.close();
  }
}

main();
