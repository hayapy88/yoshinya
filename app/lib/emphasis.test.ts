import { describe, expect, it } from 'vitest';
import { splitEmphasis, stripEmphasis } from './emphasis';

describe('splitEmphasis', () => {
  it('returns one plain run when there is no marker', () => {
    expect(splitEmphasis('Press the button.')).toEqual([
      { text: 'Press the button.', strong: false },
    ]);
  });

  it('marks the run between a pair of asterisks', () => {
    expect(splitEmphasis('Press *Merge and download*.')).toEqual([
      { text: 'Press ', strong: false },
      { text: 'Merge and download', strong: true },
      { text: '.', strong: false },
    ]);
  });

  it('handles several markers in one string', () => {
    expect(splitEmphasis('*Name order* and *Reverse* are there.')).toEqual([
      { text: 'Name order', strong: true },
      { text: ' and ', strong: false },
      { text: 'Reverse', strong: true },
      { text: ' are there.', strong: false },
    ]);
  });

  it('marks Japanese runs the same way', () => {
    expect(splitEmphasis('*結合してダウンロード* を押します。')).toEqual([
      { text: '結合してダウンロード', strong: true },
      { text: ' を押します。', strong: false },
    ]);
  });

  it('leaves an unmatched asterisk in the text', () => {
    expect(splitEmphasis('2 * 3 = 6')).toEqual([
      { text: '2 * 3 = 6', strong: false },
    ]);
  });

  it('drops the empty runs a marker at either end would create', () => {
    expect(splitEmphasis('*Reverse*')).toEqual([
      { text: 'Reverse', strong: true },
    ]);
  });
});

describe('stripEmphasis', () => {
  it('removes the markers and changes nothing else', () => {
    expect(stripEmphasis('Press *Work out the split*.')).toBe(
      'Press Work out the split.',
    );
  });

  it('leaves unmarked text alone', () => {
    expect(stripEmphasis('Nothing to do here.')).toBe('Nothing to do here.');
  });

  it('leaves an unmatched asterisk alone', () => {
    expect(stripEmphasis('2 * 3 = 6')).toBe('2 * 3 = 6');
  });
});
