import { describe, expect, it } from 'vitest';
import { countText } from './count';
import { evaluateTargets, measureFor, TARGETS } from './targets';

function target(text: string, id: string) {
  const result = evaluateTargets(countText(text)).find(
    (entry) => entry.id === id,
  );
  if (!result) {
    throw new Error(`no target ${id}`);
  }
  return result;
}

describe('evaluateTargets', () => {
  it('reports every target', () => {
    expect(evaluateTargets(countText('')).map((t) => t.id)).toEqual(
      TARGETS.map((t) => t.id),
    );
  });

  it('is empty and unexceeded for an empty string', () => {
    for (const result of evaluateTargets(countText(''))) {
      expect(result.used).toBe(0);
      expect(result.over).toBe(false);
      expect(result.ratio).toBe(0);
      expect(result.remaining).toBe(result.limit);
    }
  });

  it('judges an X post by weighted length', () => {
    expect(target('あ'.repeat(140), 'x')).toMatchObject({
      used: 280,
      remaining: 0,
      over: false,
      ratio: 1,
    });
    expect(target('あ'.repeat(141), 'x')).toMatchObject({
      used: 282,
      remaining: -2,
      over: true,
    });
  });

  it('judges a title tag in full-width equivalents', () => {
    expect(target('あ'.repeat(30), 'titleTag')).toMatchObject({
      used: 30,
      over: false,
    });
    // Half-width characters cost half, and the half is kept.
    expect(target('a'.repeat(61), 'titleTag')).toMatchObject({
      used: 30.5,
      over: true,
    });
  });

  it('judges long-form limits on plain character count', () => {
    expect(target('あ'.repeat(2200), 'instagram').over).toBe(false);
    expect(target('あ'.repeat(2201), 'instagram').over).toBe(true);
  });

  it('holds the bar at full once over the limit', () => {
    expect(target('あ'.repeat(500), 'x').ratio).toBe(1);
  });
});

describe('measureFor', () => {
  it('counts an emoji as one full-width character, not as its code points', () => {
    const counts = countText('👨‍👩‍👧');
    expect(measureFor(counts, 'fullWidthEquivalent')).toBe(1);
    expect(measureFor(counts, 'characters')).toBe(1);
    expect(measureFor(counts, 'weighted')).toBe(2);
  });
});
