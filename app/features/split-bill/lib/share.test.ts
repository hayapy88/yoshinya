import { describe, expect, it } from 'vitest';
import { calculateResults } from './calculate';
import { buildShareText } from './share';

const labels = {
  title: '割り勘精算結果',
  total: '合計：',
  settlementsHeading: '精算方法',
  breakdownHeading: '負担・立替内訳',
  burden: '負担',
  paid: '立替',
  receive: '受取',
  pay: '支払',
  settled: '精算不要',
  nothingToSettle: '追加の精算は必要ありません。',
  footer: 'よしにゃに割り勘｜yoshinya.com',
};

const participants = [
  { id: 'A', name: 'Aさん', weight: 1 },
  { id: 'B', name: 'Bさん', weight: 1 },
  { id: 'C', name: 'Cさん', weight: 0.5 },
];
const expenses = [
  {
    id: 'e1',
    payerId: 'A',
    description: 'ワイン',
    amountMinor: 5000,
    shares: null,
  },
];

const build = (over: Partial<Parameters<typeof buildShareText>[0]> = {}) =>
  buildShareText({
    eventName: '',
    eventDate: '',
    currency: 'yen',
    locale: 'ja',
    participants,
    result: calculateResults(participants, expenses),
    labels,
    ...over,
  });

describe('buildShareText', () => {
  it('names the event, or falls back rather than printing an empty heading', () => {
    expect(build({ eventName: '8月ワインパーティー' })).toContain(
      '【8月ワインパーティー】',
    );
    expect(build()).toContain('【割り勘精算結果】');
  });

  // A line reading "日付：" tells the reader only that the tool has gaps in it.
  it('leaves out a date that was never entered', () => {
    expect(build()).not.toContain('｜】');
    expect(build({ eventDate: '2026-08-23' })).toContain('｜2026-08-23】');
  });

  it('lists who pays whom', () => {
    expect(build()).toContain('Bさん → Aさん：');
  });

  it('says so when nothing needs settling', () => {
    const even = [
      { id: 'A', name: 'Aさん', weight: 1 },
      { id: 'B', name: 'Bさん', weight: 1 },
    ];
    const text = buildShareText({
      eventName: '',
      eventDate: '',
      currency: 'yen',
      locale: 'ja',
      participants: even,
      result: calculateResults(even, [
        {
          id: 'e1',
          payerId: 'A',
          description: '',
          amountMinor: 1000,
          shares: null,
        },
        {
          id: 'e2',
          payerId: 'B',
          description: '',
          amountMinor: 1000,
          shares: null,
        },
      ]),
      labels,
    });
    expect(text).toContain('追加の精算は必要ありません。');
  });

  it('gives every participant a breakdown line, including those settled up', () => {
    const text = build();
    for (const name of ['Aさん', 'Bさん', 'Cさん']) {
      expect(text).toContain(`${name}：負担`);
    }
  });

  it('signs off with the tool', () => {
    expect(build().trimEnd().endsWith('よしにゃに割り勘｜yoshinya.com')).toBe(
      true,
    );
  });
});
