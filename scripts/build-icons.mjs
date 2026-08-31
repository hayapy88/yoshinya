// Generates app/features/icon-generator/lib/icon-data.ts from lucide-static.
//
// Run with: npm run build:icons
//
// Why a generated file rather than a runtime dependency: lucide-static ships
// 2000+ icons, and the tool offers 54. Importing the package would either pull
// all of them into the client bundle or require reading the filesystem during
// SSR, which the Worker cannot do. Extracting the drawing markup once, at
// development time, keeps the bundle to the icons actually offered and leaves
// the output reviewable in a diff.
//
// The generated file is committed. Re-run this script only when the icon list
// or the pinned lucide-static version changes.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const lucide = join(root, 'node_modules', 'lucide-static');
const outFile = join(
  root,
  'app',
  'features',
  'icon-generator',
  'lib',
  'icon-data.ts',
);

// Chosen for how often they turn up in slides, admin screens and corporate
// pages rather than for visual variety. The order within a group is the order
// the grid shows them in.
//
// Lucide ships no numerals, so there are no digit icons here. `equal` sits with
// the other operators in `action` rather than alone in a group of one.
const CATEGORIES = {
  basic: [
    'house',
    'search',
    'settings',
    'user',
    'bell',
    'heart',
    'star',
    'bookmark',
    'menu',
    'layout-grid',
    'list',
    'sun',
    'moon',
  ],
  action: [
    'plus',
    'minus',
    'equal',
    'check',
    'x',
    'circle-check',
    'circle-x',
    'pencil',
    'trash-2',
    'download',
    'upload',
    'refresh-cw',
    'copy',
    'filter',
    'eye',
    'eye-off',
    'link',
    'log-in',
    'log-out',
  ],
  arrow: [
    'arrow-up',
    'arrow-down',
    'arrow-left',
    'arrow-right',
    'arrow-left-right',
    'arrow-up-down',
    'chevron-up',
    'chevron-down',
    'chevron-left',
    'chevron-right',
    'external-link',
    'move',
  ],
  file: [
    'file',
    'file-text',
    'file-down',
    'folder',
    'folder-open',
    'image',
    'camera',
    'paperclip',
    'clipboard',
    'printer',
    'archive',
    'database',
    'package',
  ],
  contact: [
    'mail',
    'phone',
    'message-circle',
    'send',
    'users',
    'calendar',
    'clock',
    'map-pin',
    'globe',
    'headset',
    'video',
    'share-2',
  ],
  business: [
    'briefcase',
    'building-2',
    'trending-up',
    'chart-column',
    'chart-pie',
    'award',
    'handshake',
    'lightbulb',
    'megaphone',
    'lock',
    'key',
    'shield-check',
    'info',
    'triangle-alert',
    'circle-help',
    'zap',
  ],
  money: [
    'japanese-yen',
    'dollar-sign',
    'euro',
    'credit-card',
    'wallet',
    'banknote',
    'coins',
    'piggy-bank',
    'receipt',
    'calculator',
    'percent',
    'shopping-cart',
  ],
  place: [
    'landmark',
    'graduation-cap',
    'school',
    'hospital',
    'store',
    'building',
    'factory',
    'warehouse',
    'hotel',
    'utensils',
  ],
  transport: [
    'car',
    'bus',
    'train-front',
    'plane',
    'bike',
    'ship',
    'truck',
    'fuel',
    'map',
    'navigation',
  ],
  device: [
    'smartphone',
    'tablet',
    'laptop',
    'monitor',
    'wifi',
    'cloud',
    'server',
    'cpu',
    'code',
    'bot',
    'mouse-pointer-click',
  ],
};

// tags.json is keyed by lucide's preferred name for a shape, which is not
// always the file name we ask for. Left alone, circle-help would ship with no
// English search terms at all.
const TAG_ALIASES = {
  'circle-help': 'circle-question-mark',
  filter: 'funnel',
};

// Pulls the drawing elements out of a lucide SVG, dropping the wrapper. The
// wrapper's attributes (stroke, stroke-width, viewBox) are all re-declared by
// the tool from the user's settings, so keeping them would only cause the
// generated icon to fight its own <g>.
function extractMarkup(source, name) {
  const inner = source.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  if (!inner) {
    throw new Error(`${name}: no <svg> element found`);
  }
  const markup = inner[1]
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s+\/>/g, '/>')
    .trim();
  if (markup.length === 0) {
    throw new Error(`${name}: the icon has no drawing elements`);
  }
  // The tool renders this markup with dangerouslySetInnerHTML, so nothing but
  // the shape primitives may get through. A <script>, a style, or an href into
  // a remote document would all be inert in a data URL but not in the page.
  const allowed = /^(?:<(?:path|circle|rect|line|polyline|polygon|ellipse)\b[^>]*\/>)+$/;
  if (!allowed.test(markup)) {
    throw new Error(`${name}: unexpected markup: ${markup.slice(0, 120)}`);
  }
  return markup;
}

async function main() {
  const tags = JSON.parse(await readFile(join(lucide, 'tags.json'), 'utf8'));
  const { version } = JSON.parse(
    await readFile(join(lucide, 'package.json'), 'utf8'),
  );

  const entries = [];
  for (const [category, names] of Object.entries(CATEGORIES)) {
    for (const name of names) {
      const source = await readFile(join(lucide, 'icons', `${name}.svg`), 'utf8');
      entries.push({
        id: name,
        category,
        markup: extractMarkup(source, name),
        // English search terms. The Japanese ones live in the dictionaries,
        // because they are copy rather than data.
        tags: tags[TAG_ALIASES[name] ?? name] ?? [],
      });
    }
  }

  // Everything written into a single-quoted TypeScript literal goes through
  // here. The tag lists are the reason: lucide files graduation-cap under
  // "bachlor's", and an unescaped apostrophe closes the string it sits in.
  const quote = (value) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

  const body = entries
    .map(
      (icon) =>
        `  {\n    id: ${quote(icon.id)},\n    category: ${quote(icon.category)},\n    markup:\n      ${quote(icon.markup)},\n    tags: [${icon.tags.map(quote).join(', ')}],\n  },`,
    )
    .join('\n');

  const file = `// Generated by scripts/build-icons.mjs from lucide-static@${version}.
// Do not edit by hand — run \`npm run build:icons\` instead.
//
// Lucide is ISC licensed; icons derived from Feather are MIT (Cole Bemis).
// The full text of both is vendored at app/features/icon-generator/icons/LICENSE
// and credited on the tool page, which is what those licences require of us.

export type IconCategory =
${Object.keys(CATEGORIES)
  .map((key) => `  | '${key}'`)
  .join('\n')};

export type IconDefinition = {
  id: string;
  category: IconCategory;
  // The bare drawing elements, without an <svg> wrapper: the tool supplies the
  // wrapper so colour, stroke width and size come from the user's settings.
  markup: string;
  tags: string[];
};

export const ICON_CATEGORIES: IconCategory[] = [
${Object.keys(CATEGORIES)
  .map((key) => `  '${key}',`)
  .join('\n')}
];

export const ICONS: IconDefinition[] = [
${body}
];
`;

  await writeFile(outFile, file, 'utf8');
  console.log(`Wrote ${entries.length} icons to ${outFile}`);
}

await main();
