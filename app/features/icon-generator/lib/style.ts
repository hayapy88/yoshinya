// The settings that describe how an icon is drawn and what gets exported.
// Everything here is plain data so the SVG builder stays a pure function and
// the whole tool can be tested without a browser.

export type BackgroundShape = 'none' | 'circle' | 'rounded' | 'square';

export const BACKGROUND_SHAPES: BackgroundShape[] = [
  'none',
  'circle',
  'rounded',
  'square',
];

export type IconStyle = {
  // Always a normalized #rrggbb — never the raw text from the input box, which
  // could otherwise close the attribute it is written into.
  color: string;
  strokeWidth: number;
  // The width and height written onto the SVG root, and the pixel resolution a
  // single PNG download uses.
  size: number;
  background: BackgroundShape;
  backgroundColor: string;
  // Space around the icon, in the icon's own 24-unit coordinate space. Only
  // meaningful with a background: padding around nothing is invisible.
  padding: number;
};

export type ExportSettings = {
  svg: boolean;
  png: boolean;
  // Which resolutions a PNG export writes. SVG has no equivalent: one vector
  // file already scales to every size.
  pngSizes: number[];
};

export const SIZE_MIN = 16;
export const SIZE_MAX = 1024;
export const STROKE_MIN = 0.5;
export const STROKE_MAX = 3.5;
export const STROKE_STEP = 0.25;
export const PADDING_MIN = 0;
export const PADDING_MAX = 8;

export const PNG_SIZES = [16, 32, 64, 128, 256, 512];

// Black by default, because that is what someone dropping an icon into a
// document expects to get. The rest are the brand palette followed by the
// colours a status icon usually needs.
export const COLOR_PRESETS = [
  '#000000',
  '#162e64',
  '#fb713c',
  '#ffffff',
  '#6f6b78',
  '#dc2626',
  '#16a34a',
  '#2563eb',
];

export const DEFAULT_STYLE: IconStyle = {
  color: '#000000',
  // Lucide draws at 2. Starting anywhere else would make the tool's own grid
  // look unlike the icons everyone recognises.
  strokeWidth: 2,
  size: 64,
  background: 'none',
  backgroundColor: '#fdf2d0',
  padding: 4,
};

export const DEFAULT_EXPORT: ExportSettings = {
  svg: true,
  png: false,
  pngSizes: [128],
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
