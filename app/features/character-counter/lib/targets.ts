import type { Counts } from './count';

// The places people are actually counting for. Each names which count decides
// it, because "280 characters" on X and "120 characters" in a meta description
// are not the same 280 and 120.
export type TargetId =
  | 'x'
  | 'titleTag'
  | 'metaDescription'
  | 'youtube'
  | 'instagram';

export type TargetMeasure = 'weighted' | 'fullWidthEquivalent' | 'characters';

export type Target = {
  id: TargetId;
  limit: number;
  measure: TargetMeasure;
};

export const TARGETS: Target[] = [
  { id: 'x', limit: 280, measure: 'weighted' },
  // Search results cut a title off by pixel width, not character count; 30
  // full-width characters is the conventional stand-in for it.
  { id: 'titleTag', limit: 30, measure: 'fullWidthEquivalent' },
  { id: 'metaDescription', limit: 120, measure: 'fullWidthEquivalent' },
  { id: 'youtube', limit: 5000, measure: 'characters' },
  { id: 'instagram', limit: 2200, measure: 'characters' },
];

/**
 * How much of a target's budget the text uses.
 *
 * Full-width equivalence counts a wide character as one and a narrow one as a
 * half, which is how Japanese character limits have always been quoted. The
 * halves are kept rather than rounded, so 31 half-width characters reads as
 * 15.5 rather than silently becoming 16.
 */
export function measureFor(counts: Counts, measure: TargetMeasure): number {
  switch (measure) {
    case 'weighted':
      return counts.weighted;
    case 'fullWidthEquivalent':
      return counts.fullWidth + counts.halfWidth / 2;
    case 'characters':
      return counts.characters;
  }
}

export type TargetResult = {
  id: TargetId;
  limit: number;
  measure: TargetMeasure;
  used: number;
  /** Negative once the text is over the limit, which is what gets shown. */
  remaining: number;
  over: boolean;
  /** 0–1, held at 1 past the limit so the bar cannot run off its track. */
  ratio: number;
};

export function evaluateTargets(counts: Counts): TargetResult[] {
  return TARGETS.map((target) => {
    const used = measureFor(counts, target.measure);
    return {
      ...target,
      used,
      remaining: target.limit - used,
      over: used > target.limit,
      ratio: Math.min(1, used / target.limit),
    };
  });
}
