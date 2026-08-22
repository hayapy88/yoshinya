#!/usr/bin/env node
// Drafts the release post for the Yoshinya X account.
//
// It writes the message and hands it to a compose window; it never posts.
// Posting is an outward-facing action, and the approval step is the act of
// pressing Post — which also leaves room for the small edits a written-out
// draft always turns out to need.
//
//   npm run announce
//   npm run announce -- --title "PNGの減色" --bullet "..." --bullet "..."
//
// What it works out on its own: which tool changed, whether this is a new tool
// or an addition to one, and the URL. The bullets are written by hand, because
// a commit subject explains a change to the person who made it and this post is
// for someone who has never heard of the tool.

import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const SITE = 'https://yoshinya.com/ja';

/**
 * Every tool runs entirely in the browser, so this line belongs on every post
 * and is added rather than retyped. It says what does not happen — the files
 * are not sent — because that is the part someone weighing up a stranger's
 * tool with their own data actually wants to know. `--no-privacy` drops it.
 */
const PRIVACY_BULLET = 'ブラウザ内だけで完結し、サーバーには送られないので安心';
/** Moved after each announcement, so the next run knows where to start. */
const MARKER = 'announced';

function git(command) {
  return execSync(`git ${command}`, { encoding: 'utf8' }).trim();
}

function commitsSinceLastAnnouncement() {
  let range = '';
  try {
    git(`rev-parse --verify ${MARKER}`);
    range = `${MARKER}..HEAD`;
  } catch {
    // Never announced from this checkout: fall back to the last few commits
    // rather than the entire history.
    range = '-10';
  }
  const log = git(`log ${range} --pretty=format:%H%x1f%s%x1f%b%x1e`);
  return log
    .split('\x1e')
    .filter(Boolean)
    .map((entry) => {
      const [hash, subject, body] = entry.replace(/^\n/, '').split('\x1f');
      return { hash, subject, body };
    });
}

const toolSlugs = () =>
  readdirSync('app/features', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

/** Commit types a reader of the post would notice. */
const USER_VISIBLE = /^(feat|fix|perf|style|docs)(\(|:)/;

/**
 * The tool this announcement is about.
 *
 * Only user-visible commits are counted: a release window normally also carries
 * formatting and test work, and letting those vote turns a single-tool release
 * into "touched two tools, cannot tell" — which is what the first run did.
 * Ties and empty results fall back to the site itself, and `--tool` overrides.
 */
function detectTool(commits) {
  const slugs = toolSlugs();
  const counts = new Map();
  for (const commit of commits) {
    if (!USER_VISIBLE.test(commit.subject)) {
      continue;
    }
    const files = git(`show --name-only --pretty=format: ${commit.hash}`);
    for (const slug of slugs) {
      if (files.includes(`app/features/${slug}/`)) {
        counts.set(slug, (counts.get(slug) ?? 0) + 1);
      }
    }
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) {
    return null;
  }
  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) {
    return null;
  }
  return ranked[0][0];
}

/**
 * A brand-new tool is the one case worth telling differently, and it is
 * recognisable: its route file did not exist before.
 */
function detectKind(commits, slug) {
  if (!slug) {
    return 'feature';
  }
  const added = commits.some((commit) =>
    git(`show --name-status --pretty=format: ${commit.hash}`).includes(
      `A\tapp/routes/${slug}.tsx`,
    ),
  );
  if (added) {
    return 'release';
  }
  return commits.some((c) => c.subject.startsWith('feat')) ? 'feature' : 'fix';
}

function warnIfAmbiguous(slug) {
  if (!slug) {
    console.log(
      'Could not tell which tool this is about — the post will link to the site.\n' +
        'Name it with --tool <slug> if it should link to one.',
    );
  }
}

function toolName(slug) {
  // Read from the Japanese dictionary rather than a second list here, so the
  // post cannot end up calling a tool something the site does not.
  const source = execSync(`cat app/i18n/ja.ts`, { encoding: 'utf8' });
  const key = slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + 'Page';
  const block = source.split(`${key}: {`)[1] ?? '';
  const match = block.match(/toolName:\s*'([^']+)'/);
  return match ? match[1] : slug;
}

function buildMessage({ kind, slug, name, title, bullets }) {
  const opening =
    kind === 'release'
      ? `${name}をリリースしたにゃ😺`
      : kind === 'feature'
        ? `${name}に新機能「${title}」を追加したにゃ😺`
        : `${name}を改善したにゃ😺`;

  const listed = bullets.map((line) => `✅ ${line}`).join('\n');

  return [
    opening,
    ...(listed ? ['', listed] : []),
    '',
    'ぜひ使ってみてにゃ🐾',
    '',
    '🔗使ってみる👇',
    slug ? `${SITE}/${slug}` : SITE,
    '',
    '感想や要望があればぜひコメントで教えてにゃ🐾',
  ].join('\n');
}

function parseArgs(argv) {
  const args = { bullets: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const [flag, inline] = argv[i].split('=');
    const value = inline ?? argv[++i];
    if (flag === '--bullet') args.bullets.push(value);
    else if (flag === '--title') args.title = value;
    else if (flag === '--tool') args.tool = value;
    else if (flag === '--kind') args.kind = value;
    // A bare flag: it takes no value, so nothing was consumed above.
    else if (flag === '--no-privacy') {
      args.noPrivacy = true;
      i -= 1;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const commits = commitsSinceLastAnnouncement();

if (commits.length === 0) {
  console.log('Nothing new since the last announcement.');
  process.exit(0);
}

const slug = args.tool ?? detectTool(commits);
const kind = args.kind ?? detectKind(commits, slug);
const name = slug ? toolName(slug) : 'よしにゃ';
const message = buildMessage({
  kind,
  slug,
  name,
  title: args.title ?? '',
  bullets: args.noPrivacy ? args.bullets : [...args.bullets, PRIVACY_BULLET],
});

console.log(`\nCommits since the last announcement (${commits.length}):`);
for (const commit of commits) {
  console.log(`  ${commit.hash.slice(0, 7)}  ${commit.subject}`);
}
console.log(`\nRead as: ${kind}${slug ? ` / ${slug}` : ''}\n`);
warnIfAmbiguous(slug);
console.log('─'.repeat(60));
console.log(message);
console.log('─'.repeat(60));

// X weights CJK at two, which the paid plan's limit makes academic — shown
// because a post that runs long still reads as one.
const weighted = [...message].reduce(
  (n, ch) => n + (/[　-ヿ一-鿿＀-￯]/.test(ch) ? 2 : 1),
  0,
);
console.log(`\nWeighted length: ${weighted}`);

if (args.bullets.length === 0) {
  console.log(
    '\nNo bullets given. Add them with --bullet "…", once per line of the post.',
  );
}

console.log(
  `\nOpen a compose window with this text:\nhttps://x.com/intent/post?text=${encodeURIComponent(message)}\n`,
);
console.log(
  `After posting, record it so the next run starts from here:\n  git tag -f ${MARKER} HEAD\n`,
);
