import { describe, expect, it } from 'vitest';
import {
  convertText,
  excludedCharacters,
  type ConvertSettings,
} from './convert';
import { DEFAULT_SETTINGS } from './settings';

function convert(text: string, overrides: Partial<ConvertSettings> = {}) {
  return convertText(text, { ...DEFAULT_SETTINGS, ...overrides });
}

const ALL_HALF: Partial<ConvertSettings> = {
  alnum: 'half',
  kana: 'half',
  symbol: 'half',
  space: 'half',
};
const ALL_FULL: Partial<ConvertSettings> = {
  alnum: 'full',
  kana: 'full',
  symbol: 'full',
  space: 'full',
};

describe('the defaults', () => {
  it('make letters and digits half-width and katakana full-width', () => {
    expect(convert('ＡＢＣ１２３ ｶﾞｲﾄﾞ').output).toBe('ABC123 ガイド');
  });

  it('leave symbols and spaces alone', () => {
    expect(convert('（注）　Ｑ＆Ａ').output).toBe('（注）　Q＆A');
  });

  it('never touch hiragana, kanji, emoji or line breaks', () => {
    const text = 'ひらがな漢字😀\r\n次の行';
    expect(convert(text).output).toBe(text);
  });
});

describe('letters and digits', () => {
  it('convert in both directions', () => {
    expect(convert('ａｚＡＺ０９', { alnum: 'half' }).output).toBe('azAZ09');
    expect(convert('azAZ09', { alnum: 'full' }).output).toBe('ａｚＡＺ０９');
  });

  it('stay put when set to keep', () => {
    expect(convert('Ａa', { alnum: 'keep' }).output).toBe('Ａa');
  });
});

describe('symbols', () => {
  it('convert every printable ASCII symbol and back', () => {
    const ascii = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
    const full = convert(ascii, { symbol: 'full' }).output;
    expect(full).toBe(
      '！＂＃＄％＆＇（）＊＋，－．／：；＜＝＞？＠［＼］＾＿｀｛｜｝～',
    );
    expect(convert(full, { symbol: 'half' }).output).toBe(ascii);
  });

  it('are separate from letters', () => {
    expect(convert('Ａ！', { alnum: 'half', symbol: 'keep' }).output).toBe(
      'A！',
    );
  });
});

describe('spaces', () => {
  it('convert the ideographic space and back', () => {
    expect(convert('a　b', { space: 'half' }).output).toBe('a b');
    expect(convert('a b', { space: 'full' }).output).toBe('a　b');
  });

  it('leave tabs and line breaks alone', () => {
    expect(convert('a\tb\nc', ALL_FULL).output).toBe('ａ\tｂ\nｃ');
  });
});

describe('half-width katakana to full-width', () => {
  it('converts the whole syllabary', () => {
    expect(convert('ｱｲｳｴｵﾜｦﾝｧｨｩｪｫｬｭｮｯｰ').output).toBe(
      'アイウエオワヲンァィゥェォャュョッー',
    );
  });

  it('joins a voicing mark onto the kana before it', () => {
    expect(convert('ｶﾞｷﾞｸﾞｹﾞｺﾞｻﾞｼﾞｽﾞｾﾞｿﾞﾀﾞﾁﾞﾂﾞﾃﾞﾄﾞﾊﾞﾋﾞﾌﾞﾍﾞﾎﾞ').output).toBe(
      'ガギグゲゴザジズゼゾダヂヅデドバビブベボ',
    );
    expect(convert('ﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟ').output).toBe('パピプペポ');
    expect(convert('ｳﾞﾜﾞｦﾞ').output).toBe('ヴヷヺ');
  });

  it('turns a voicing mark that fits nothing into a standalone one', () => {
    expect(convert('ｱﾞﾟ').output).toBe('ア゛゜');
  });

  it('converts half-width kana punctuation', () => {
    expect(convert('｢ｱ､ｲ･ｳ｣｡').output).toBe('「ア、イ・ウ」。');
  });

  it('counts a joined pair as one change', () => {
    expect(convert('ｶﾞ').counts.kana).toBe(1);
  });
});

describe('full-width katakana to half-width', () => {
  const half = (text: string) => convert(text, { kana: 'half' }).output;

  it('splits voiced kana into a base and a mark', () => {
    expect(half('ガイド')).toBe('ｶﾞｲﾄﾞ');
    expect(half('パヴ')).toBe('ﾊﾟｳﾞ');
  });

  it('leaves kana with no half-width form as they are', () => {
    expect(half('ヮヰヱヵヶ')).toBe('ヮヰヱヵヶ');
  });

  it('keeps Japanese punctuation full-width', () => {
    expect(half('「カナ」、。・')).toBe('「ｶﾅ」、。・');
  });

  it('converts ー only after katakana', () => {
    expect(half('コーヒーとらーめん')).toBe('ｺｰﾋｰとらーめん');
  });

  it('leaves hiragana alone', () => {
    expect(half('ひらがな')).toBe('ひらがな');
  });
});

describe('round trips', () => {
  it('survive all-full and back to all-half', () => {
    const text = 'Hello, World! ｶﾞｲﾄﾞ 123';
    const full = convert(text, ALL_FULL).output;
    expect(full).toBe('Ｈｅｌｌｏ，　Ｗｏｒｌｄ！　ガイド　１２３');
    expect(convert(full, ALL_HALF).output).toBe(text);
  });
});

describe('addresses', () => {
  it('keeps a URL intact when converting to full-width', () => {
    expect(
      convert('詳細はhttps://example.com/a?b=1をご覧ください', ALL_FULL).output,
    ).toBe('詳細はhttps://example.com/a?b=1をご覧ください');
  });

  it('keeps an email address intact', () => {
    expect(convert('連絡先：info@example.co.jp', ALL_FULL).output).toBe(
      '連絡先：info@example.co.jp',
    );
  });

  it('still converts a full stop that ends the sentence after a URL', () => {
    expect(convert('See https://example.com.', ALL_FULL).output).toBe(
      'Ｓｅｅ　https://example.com．',
    );
  });

  it('converts a full-width address to half-width', () => {
    expect(
      convert('ｈｔｔｐｓ：／／ｅｘａｍｐｌｅ．ｃｏｍ', ALL_HALF).output,
    ).toBe('https://example.com');
  });
});

describe('characters to leave alone', () => {
  it('stops conversion from a listed character', () => {
    expect(
      convert('（Ａ）！', { symbol: 'half', exclude: '（）' }).output,
    ).toBe('（A）!');
  });

  it('stops conversion to a listed character', () => {
    expect(convert('(A)', { symbol: 'full', exclude: '（）' }).output).toBe(
      '(A)',
    );
  });

  it('keeps a kana and its voicing mark together when excluded', () => {
    expect(convert('ｶﾞｲ', { exclude: 'ガ' }).output).toBe('ｶﾞイ');
  });

  it('ignores whitespace in the list', () => {
    expect([...excludedCharacters(' （ \n）')]).toEqual(['（', '）']);
    expect(convert('a　b', { space: 'half', exclude: '　' }).output).toBe(
      'a b',
    );
  });
});

describe('the report', () => {
  it('counts changes per kind', () => {
    const { counts } = convert('ＡＢ１ ｶﾅ　！', ALL_HALF);
    expect(counts).toEqual({ alnum: 3, kana: 0, symbol: 1, space: 1 });
    expect(convert('ＡＢ１ ｶﾅ').counts).toEqual({
      alnum: 3,
      kana: 2,
      symbol: 0,
      space: 0,
    });
  });

  it('splits the output into changed and unchanged runs', () => {
    expect(convert('価格はＡＢ円、ｶﾞ').segments).toEqual([
      { text: '価格は', changed: false },
      { text: 'AB', changed: true },
      { text: '円、', changed: false },
      { text: 'ガ', changed: true },
    ]);
  });

  it('reports nothing for empty input', () => {
    const result = convert('');
    expect(result.output).toBe('');
    expect(result.segments).toEqual([]);
  });
});
