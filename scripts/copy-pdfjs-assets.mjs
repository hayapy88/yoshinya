// Copies pdf.js's runtime data files into public/pdfjs/ so they are served from
// our own origin.
//
// Run automatically before dev and build (see the predev/prebuild scripts).
//
// Why this exists: pdf.js draws page thumbnails, and for three kinds of page it
// needs data that does not live in the library bundle — predefined CMaps for
// CJK text in a font the file does not embed (routine in Japanese business
// PDFs), the 14 standard fonts, and the WebAssembly image decoders. Left
// unconfigured, pdf.js skips them and the thumbnail comes out missing its text.
// Pointed at a CDN, which is the usual fix, every PDF a visitor opens would
// announce itself to someone else's server — the one thing this project does
// not do.
//
// The copies are gitignored: they are vendored bytes, reproduced from the
// pinned pdfjs-dist version on every install.

import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const source = join(root, 'node_modules', 'pdfjs-dist');
const target = join(root, 'public', 'pdfjs');

// Kept in step with the URLs passed to getDocument in app/lib/pdf/render.ts.
const DIRECTORIES = ['cmaps', 'standard_fonts', 'wasm', 'iccs'];

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });

for (const directory of DIRECTORIES) {
  await cp(join(source, directory), join(target, directory), {
    recursive: true,
  });
}

console.log(`pdf.js assets copied to public/pdfjs (${DIRECTORIES.join(', ')})`);
