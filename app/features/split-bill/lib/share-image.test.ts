import { describe, expect, it } from 'vitest';
import {
  distributeColumns,
  fitText,
  IMAGE_WIDTH,
  layoutShareImage,
  MAX_IMAGE_HEIGHT,
  wrapText,
} from './share-image';

const base = {
  title: 'ワイン会',
  date: '',
  total: '￥37,000',
  summary: '5人 · 立替3件',
  settlementsHeading: '精算方法',
  settlements: [{ from: 'D', to: 'A', amount: '￥5,000' }],
  nothingToSettle: '追加の精算は必要ありません。',
  settlementsNote:
    '※送金の回数ができるだけ少なくなるように組み合わせています。',
  breakdown: {
    heading: '負担・立替内訳',
    columns: ['名前', '割合', '負担額', '立替額', '差額'],
    rows: [['A', '1', '￥10,000', '￥15,000', '受取 ￥5,000']],
    note: '※負担額は、各費用を負担割合に応じて分けた金額の合計です。',
  },
  statements: null,
  expenses: null,
  footer: 'よしにゃに割り勘｜yoshinya.com',
  nameColours: {},
};

const statementsBlock = {
  heading: '各自の内訳',
  columns: { share: '負担割合', amount: '負担額' },
  people: [
    {
      name: 'A',
      total: '￥10,000',
      items: [
        {
          label: 'ワイン',
          share: '1',
          amount: '￥5,000',
          carried: true,
        },
        { label: '食事', share: null, amount: '負担なし', carried: false },
      ],
    },
  ],
};

describe('layoutShareImage', () => {
  it('keeps a fixed width', () => {
    expect(layoutShareImage(base).width).toBe(IMAGE_WIDTH);
  });

  // Twenty people and nineteen transfers must not run off the bottom, and
  // shrinking the type to fit a fixed frame would defeat the point.
  it('grows with the content', () => {
    const small = layoutShareImage(base).height;
    const large = layoutShareImage({
      ...base,
      settlements: Array.from({ length: 19 }, () => ({
        from: 'X',
        to: 'Y',
        amount: '￥1',
      })),
      breakdown: {
        ...base.breakdown,
        rows: Array.from({ length: 20 }, () => ['X', '1', '￥1', '￥1', '￥1']),
      },
    }).height;
    expect(large).toBeGreaterThan(small * 3);
  });

  it('leaves room for a settlement list of one line when there is nothing to settle', () => {
    const empty = layoutShareImage({ ...base, settlements: [] });
    expect(empty.height).toBeGreaterThan(
      empty.settlementsY + empty.settlementHeight,
    );
  });

  it('makes room for a date only when there is one', () => {
    expect(
      layoutShareImage({ ...base, date: '2026-08-24' }).height,
    ).toBeGreaterThan(layoutShareImage(base).height);
  });

  it('puts the footer inside the image', () => {
    const layout = layoutShareImage(base);
    expect(layout.footerY).toBeLessThan(layout.height);
  });
});

describe('the note under the transfers', () => {
  it('sits below the last transfer', () => {
    const layout = layoutShareImage(base);
    expect(layout.noteLines.length).toBeGreaterThan(0);
    expect(layout.noteY).toBeGreaterThan(
      layout.settlementsY + layout.settlementHeight,
    );
  });

  it('takes more room the longer it is', () => {
    const long = layoutShareImage({
      ...base,
      settlementsNote: base.settlementsNote.repeat(4),
    });
    expect(long.noteLines.length).toBeGreaterThan(1);
    expect(long.height).toBeGreaterThan(layoutShareImage(base).height);
  });

  it('is left out when there is nothing to settle', () => {
    expect(layoutShareImage({ ...base, settlements: [] }).noteLines).toEqual(
      [],
    );
  });

  it('is left out when there is none', () => {
    expect(
      layoutShareImage({ ...base, settlementsNote: null }).noteLines,
    ).toEqual([]);
  });
});

describe('the note under the table', () => {
  it('sits below the last row', () => {
    const layout = layoutShareImage(base);
    expect(layout.breakdownNoteLines.length).toBeGreaterThan(0);
    expect(layout.breakdownNoteY).toBeGreaterThan(
      layout.tableY + layout.headerHeight + layout.rowHeight,
    );
  });

  it('adds its own height', () => {
    expect(layoutShareImage(base).height).toBeGreaterThan(
      layoutShareImage({ ...base, breakdown: { ...base.breakdown, note: '' } })
        .height,
    );
  });
});

describe('wrapText', () => {
  it('leaves a short line alone', () => {
    expect(wrapText('あいう', 100, 10)).toEqual(['あいう']);
  });

  it('breaks Japanese between characters', () => {
    expect(wrapText('あいうえお', 30, 10)).toEqual(['あいう', 'えお']);
  });

  it('keeps punctuation off the start of a line', () => {
    expect(wrapText('あいう。えお', 30, 10)).toEqual(['あいう。', 'えお']);
  });

  it('breaks English only between words', () => {
    // 6 units per Latin character at size 10.
    expect(wrapText('one two three', 30, 10)).toEqual(['one', 'two', 'three']);
  });

  it('starts a new line at every line break', () => {
    expect(wrapText('あい\nうえおかき', 30, 10)).toEqual([
      'あい',
      'うえお',
      'かき',
    ]);
  });

  it('never returns an empty line', () => {
    expect(wrapText('', 100, 10)).toEqual([]);
  });
});

describe('fitText', () => {
  // One unit per character, so the arithmetic is easy to follow.
  const measure = (text: string) => [...text].length;

  it('leaves text that already fits alone', () => {
    expect(fitText(measure, 'abc', 10)).toBe('abc');
  });

  it('cuts to the limit and marks the cut', () => {
    expect(fitText(measure, 'abcdefghij', 5)).toBe('abcd…');
  });

  it('counts a character as a character, not a byte', () => {
    expect(fitText(measure, 'あいうえおかきくけこ', 4)).toBe('あいう…');
  });

  it('copes with a limit too small for anything', () => {
    expect(fitText(measure, 'abcdef', 1)).toBe('…');
  });
});

describe('the two versions', () => {
  // One for the group chat, one for anyone checking the figures.
  it('leaves the table out of the short version', () => {
    const short = layoutShareImage({ ...base, breakdown: null });
    const long = layoutShareImage(base);
    expect(short.height).toBeLessThan(long.height);
  });

  it('still shows the settlements in the short version', () => {
    const short = layoutShareImage({ ...base, breakdown: null });
    expect(short.settlementsY).toBeGreaterThan(0);
    expect(short.footerY).toBeGreaterThan(short.settlementsY);
  });

  it('grows the short version with the number of transfers, not the table', () => {
    const one = layoutShareImage({ ...base, breakdown: null }).height;
    const many = layoutShareImage({
      ...base,
      breakdown: null,
      settlements: Array.from({ length: 10 }, () => ({
        from: 'X',
        to: 'Y',
        amount: '￥1',
      })),
    }).height;
    expect(many).toBeGreaterThan(one);
  });
});

describe('the itemised version', () => {
  it('is taller than the one with just the table', () => {
    const withTable = layoutShareImage(base).height;
    const withItems = layoutShareImage({
      ...base,
      statements: statementsBlock,
    }).height;
    expect(withItems).toBeGreaterThan(withTable);
  });

  it('grows with the number of lines each person has', () => {
    const short = layoutShareImage({
      ...base,
      statements: statementsBlock,
    }).height;
    const long = layoutShareImage({
      ...base,
      statements: {
        ...statementsBlock,
        people: [
          {
            ...statementsBlock.people[0],
            items: Array.from({ length: 20 }, () => ({
              label: 'x',
              share: null,
              amount: '￥1',
              carried: true,
            })),
          },
        ],
      },
    }).height;
    expect(long).toBeGreaterThan(short);
  });

  // Safari limits a canvas by area, and beyond it returns a blank image rather
  // than an error — so the size is checked before anything is drawn.
  it('goes past the safe height for a large event', () => {
    const huge = layoutShareImage({
      ...base,
      statements: {
        heading: '各自の内訳',
        columns: { share: '負担割合', amount: '負担額' },
        people: Array.from({ length: 20 }, () => ({
          name: 'X',
          total: '￥1',
          items: Array.from({ length: 100 }, () => ({
            label: 'x',
            share: null,
            amount: '￥1',
            carried: true,
          })),
        })),
      },
    }).height;
    expect(huge).toBeGreaterThan(MAX_IMAGE_HEIGHT);
  });

  it('stays within it for an ordinary event', () => {
    const ordinary = layoutShareImage({
      ...base,
      statements: {
        heading: '各自の内訳',
        columns: { share: '負担割合', amount: '負担額' },
        people: Array.from({ length: 8 }, () => ({
          name: 'X',
          total: '￥1',
          items: Array.from({ length: 12 }, () => ({
            label: 'x',
            share: null,
            amount: '￥1',
            carried: true,
          })),
        })),
      },
    }).height;
    expect(ordinary).toBeLessThan(MAX_IMAGE_HEIGHT);
  });
});

describe('who paid for what', () => {
  const expensesBlock = {
    heading: '立替明細',
    rows: [
      { payer: 'A', label: 'ワイン', amount: '￥3,000' },
      { payer: 'B', label: '食事', amount: '￥6,000' },
    ],
  };

  it('adds height for each payment listed', () => {
    const without = layoutShareImage(base).height;
    const with_ = layoutShareImage({ ...base, expenses: expensesBlock }).height;
    expect(with_).toBeGreaterThan(without);
  });

  it('is counted against the safe height like everything else', () => {
    const huge = layoutShareImage({
      ...base,
      expenses: {
        heading: '立替明細',
        rows: Array.from({ length: 400 }, () => ({
          payer: 'A',
          label: 'x',
          amount: '￥1',
        })),
      },
    }).height;
    expect(huge).toBeGreaterThan(MAX_IMAGE_HEIGHT);
  });
});

describe('distributeColumns', () => {
  it('gives every column what it asked for when there is room', () => {
    const result = distributeColumns([100, 150, 150, 200], 952, 220, 180);
    expect(result.numeric).toEqual([100, 150, 150, 200]);
    expect(result.name).toBe(952 - 600);
  });

  // English needs far more room than Japanese for the same row — "Receives JPY
  // 3,386" against "受取 ￥3,386" — which is what cut the balance short.
  it('squeezes every column by the same proportion when they do not fit', () => {
    const result = distributeColumns([200, 300, 300, 400], 952, 300, 180);
    const total = result.numeric.reduce((sum, w) => sum + w, 0);
    expect(Math.round(total + result.name)).toBe(952);
    expect(result.numeric[3] / result.numeric[0]).toBeCloseTo(2, 5);
  });

  it('keeps a floor under the name column', () => {
    const result = distributeColumns([400, 400, 400, 400], 952, 400, 180);
    expect(result.name).toBe(180);
  });

  it('does not hand back a negative width', () => {
    const result = distributeColumns([900, 900], 952, 400, 180);
    expect(result.numeric.every((w) => w > 0)).toBe(true);
    expect(result.name).toBeGreaterThan(0);
  });
});
