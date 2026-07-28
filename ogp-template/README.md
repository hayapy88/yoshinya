# Yoshinya OGP image template

A 1200 × 630 px OGP image template for social platforms such as X.

## Generate (recommended, automated)

From the repository root, pass a tool name to generate both the Japanese and
English images at once. Output goes to `public/brand/ogp/`
(`ogp-<slug>-ja.png` / `ogp-<slug>-en.png`).

```
node ogp-template/generate.mjs \
  --slug image-sorter \
  --ja "よしにゃに|画像仕分け" --ja-size 60 \
  --en "Image Sorter|by Yoshinya" --en-size 60
```

- In a tool name, `|` marks a line break (max two lines).
- `--*-size` is optional (defaults to 60). See the size guidance below.
- SVG→PNG rendering uses the repository's existing Playwright
  (Node 22.22 or newer required).

## Manual use (Figma, etc.)

1. Open `yoshinya-ogp-template.svg` in Figma, Illustrator, Affinity Designer,
   or similar.
2. In the `editable-tool-name` group, replace the placeholder
   "Tool name / goes here." with the Japanese or English tool name.
3. Export as PNG at 1200 × 630 px.

## Font size guidance

- Short name: 68 px
- Standard name: 60 px
- Long name: 50 px

Keep tool names to two lines at most. For English names, breaking at a
meaningful phrase boundary reads best.

Everything other than the tool name uses wording shared across the Japanese
and English versions.

## Assets

- `assets/logo-yoshinya.png`
- `assets/yoshinyan-wink.png`

Do not change the relative location of the SVG and the `assets` folder.
