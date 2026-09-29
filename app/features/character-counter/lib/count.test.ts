import { describe, expect, it } from 'vitest';
import { countText, graphemes, manuscript, weightedLength } from './count';

describe('graphemes', () => {
  it('keeps an emoji built from several code points whole', () => {
    // 8 UTF-16 units, 5 code points, one character to anyone reading it.
    expect('👨‍👩‍👧'.length).toBe(8);
    expect(graphemes('👨‍👩‍👧')).toEqual(['👨‍👩‍👧']);
  });

  it('keeps skin tones, flags and combining marks whole', () => {
    expect(graphemes('👍🏽')).toHaveLength(1);
    expect(graphemes('🇯🇵')).toHaveLength(1);
    expect(graphemes('が')).toHaveLength(1);
    expect(graphemes('が')).toHaveLength(1);
  });
});

describe('countText', () => {
  it('returns zeros for an empty string', () => {
    expect(countText('')).toEqual({
      characters: 0,
      charactersNoWhitespace: 0,
      words: 0,
      lines: 0,
      paragraphs: 0,
      fullWidth: 0,
      halfWidth: 0,
      weighted: 0,
      utf8Bytes: 0,
      manuscript: { sheets: 0, rows: 0 },
    });
  });

  it('counts plain ASCII', () => {
    const counts = countText('Hello world');
    expect(counts.characters).toBe(11);
    expect(counts.charactersNoWhitespace).toBe(10);
    expect(counts.words).toBe(2);
    expect(counts.lines).toBe(1);
    expect(counts.paragraphs).toBe(1);
    expect(counts.halfWidth).toBe(10);
    expect(counts.fullWidth).toBe(0);
    expect(counts.utf8Bytes).toBe(11);
  });

  it('counts Japanese as full width', () => {
    const counts = countText('こんにちは');
    expect(counts.characters).toBe(5);
    expect(counts.fullWidth).toBe(5);
    expect(counts.halfWidth).toBe(0);
    // Three bytes each in UTF-8.
    expect(counts.utf8Bytes).toBe(15);
  });

  it('excludes every kind of whitespace from the no-whitespace count', () => {
    const counts = countText('a b\tc\nd　e');
    expect(counts.characters).toBe(9);
    expect(counts.charactersNoWhitespace).toBe(5);
  });

  it('counts an emoji as one character and as full width', () => {
    const counts = countText('やった👨‍👩‍👧');
    expect(counts.characters).toBe(4);
    expect(counts.fullWidth).toBe(4);
  });

  it('treats a Windows line break as one break', () => {
    const counts = countText('one\r\ntwo');
    expect(counts.characters).toBe(7);
    expect(counts.lines).toBe(2);
  });

  it('counts lines and paragraphs separately', () => {
    const counts = countText('first line\nsecond line\n\nnew paragraph');
    expect(counts.lines).toBe(4);
    expect(counts.paragraphs).toBe(2);
  });

  it('ignores blank blocks when counting paragraphs', () => {
    expect(countText('one\n\n\n\ntwo').paragraphs).toBe(2);
    expect(countText('\n\n   \n\n').paragraphs).toBe(0);
  });

  it('counts Japanese words without spaces to go on', () => {
    // Segmented as 今日 / は / いい / 天気 / です — the point is that it is
    // more than one and fewer than the character count.
    const counts = countText('今日はいい天気です');
    expect(counts.words).toBeGreaterThan(1);
    expect(counts.words).toBeLessThan(counts.characters);
  });

  it('does not count punctuation as a word', () => {
    expect(countText('Hi, there!').words).toBe(2);
  });
});

describe('weightedLength', () => {
  it('counts ASCII as one each', () => {
    expect(weightedLength('a'.repeat(280))).toBe(280);
  });

  it('counts Japanese as two each, so 140 fills a post', () => {
    expect(weightedLength('あ'.repeat(140))).toBe(280);
  });

  it('counts a whole emoji as two, however many code points it has', () => {
    expect(weightedLength('👨‍👩‍👧')).toBe(2);
    expect(weightedLength('👍🏽')).toBe(2);
  });

  it('counts the light ranges as one', () => {
    // Latin-1 and general punctuation stay cheap.
    expect(weightedLength('é')).toBe(1);
    expect(weightedLength('—')).toBe(1);
  });

  it('adds up a mixed string', () => {
    // 5 ASCII + 2 Japanese
    expect(weightedLength('hello日本')).toBe(9);
  });
});

describe('manuscript', () => {
  it('fills one row per 20 characters', () => {
    expect(manuscript(['あ'.repeat(20)])).toEqual({ sheets: 1, rows: 1 });
    expect(manuscript(['あ'.repeat(21)])).toEqual({ sheets: 1, rows: 2 });
  });

  it('gives an empty line its own row', () => {
    expect(manuscript(['', '', ''])).toEqual({ sheets: 1, rows: 3 });
  });

  it('starts a new sheet after 20 rows', () => {
    const lines = Array.from({ length: 20 }, () => 'あ'.repeat(20));
    expect(manuscript(lines)).toEqual({ sheets: 1, rows: 20 });
    expect(manuscript([...lines, 'あ'])).toEqual({ sheets: 2, rows: 21 });
  });

  it('needs more sheets than dividing by 400 when lines are short', () => {
    // 100 lines of one character: 100 characters, but 100 rows — five sheets,
    // where 100 / 400 would have said one.
    const lines = Array.from({ length: 100 }, () => 'あ');
    const counted = countText(lines.join('\n'));
    expect(counted.charactersNoWhitespace).toBe(100);
    expect(counted.manuscript).toEqual({ sheets: 5, rows: 100 });
  });
});
