import { describe, expect, it } from 'vitest';
import {
  buildEmail,
  buildPayload,
  buildVCard,
  buildWifi,
  EMPTY_FIELDS,
  escapeVCard,
  escapeWifi,
  normalizeUrl,
} from './payload';

describe('normalizeUrl', () => {
  it('adds a scheme to a bare host, so scanners open it instead of showing text', () => {
    expect(normalizeUrl('yoshinya.com/ja')).toBe('https://yoshinya.com/ja');
  });

  it('leaves an existing scheme alone, including non-http ones', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    expect(normalizeUrl('mailto:hi@example.com')).toBe('mailto:hi@example.com');
    expect(normalizeUrl('tel:+81312345678')).toBe('tel:+81312345678');
  });

  it('returns an empty string for blank input rather than "https://"', () => {
    expect(normalizeUrl('   ')).toBe('');
  });
});

describe('buildWifi', () => {
  it('builds the record a phone expects', () => {
    expect(
      buildWifi({
        ssid: 'yoshinya',
        password: 'pass1234',
        security: 'WPA',
        hidden: false,
      }),
    ).toBe('WIFI:T:WPA;S:yoshinya;P:pass1234;;');
  });

  it('escapes the characters that would end a field early', () => {
    expect(escapeWifi('a;b:c,d"e\\f')).toBe('a\\;b\\:c\\,d\\"e\\\\f');
    expect(
      buildWifi({
        ssid: 'cafe;free',
        password: 'a:b',
        security: 'WPA',
        hidden: false,
      }),
    ).toBe('WIFI:T:WPA;S:cafe\\;free;P:a\\:b;;');
  });

  it('omits the password field entirely on an open network', () => {
    expect(
      buildWifi({
        ssid: 'open',
        password: 'ignored',
        security: 'nopass',
        hidden: false,
      }),
    ).toBe('WIFI:T:nopass;S:open;;');
  });

  it('marks a hidden network only when it is hidden', () => {
    const fields = {
      ssid: 'secret',
      password: 'p',
      security: 'WPA',
      hidden: true,
    } as const;
    expect(buildWifi(fields)).toBe('WIFI:T:WPA;S:secret;P:p;H:true;;');
    expect(buildWifi({ ...fields, hidden: false })).not.toContain('H:true');
  });

  it('returns nothing without an SSID', () => {
    expect(
      buildWifi({ ssid: '  ', password: 'p', security: 'WPA', hidden: false }),
    ).toBe('');
  });
});

describe('buildVCard', () => {
  const base = {
    lastName: '横井',
    firstName: '隼人',
    organization: '',
    title: '',
    phone: '',
    email: '',
    url: '',
  };

  it('writes a vCard 3.0 with CRLF line endings', () => {
    const card = buildVCard(base);
    expect(card.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n')).toBe(true);
    expect(card.endsWith('\r\nEND:VCARD')).toBe(true);
    expect(card).toContain('N:横井;隼人;;;');
    expect(card).toContain('FN:横井 隼人');
  });

  it('includes only the optional fields that were filled in', () => {
    const card = buildVCard({ ...base, phone: '090-1234-5678' });
    expect(card).toContain('TEL;TYPE=CELL:090-1234-5678');
    expect(card).not.toContain('EMAIL:');
    expect(card).not.toContain('ORG:');
  });

  it('escapes commas, semicolons and newlines in a value', () => {
    expect(escapeVCard('a,b;c\nd')).toBe('a\\,b\\;c\\nd');
    expect(buildVCard({ ...base, organization: 'Yoshinya, Inc.' })).toContain(
      'ORG:Yoshinya\\, Inc.',
    );
  });

  it('leaves a URL unescaped, because the browser receives it verbatim', () => {
    expect(
      buildVCard({ ...base, url: 'https://example.com/a,b?x=1;y=2' }),
    ).toContain('URL:https://example.com/a,b?x=1;y=2');
  });

  it('falls back to the organization when no name was given', () => {
    const card = buildVCard({
      ...base,
      lastName: '',
      firstName: '',
      organization: 'よしにゃ',
    });
    expect(card).toContain('FN:よしにゃ');
  });

  it('returns nothing when there is no name and no organization', () => {
    expect(buildVCard({ ...base, lastName: '', firstName: '' })).toBe('');
  });
});

describe('buildEmail', () => {
  it('keeps the address readable and encodes the rest', () => {
    expect(
      buildEmail({ to: 'hi@example.com', subject: 'お問い合わせ', body: 'a b' }),
    ).toBe(
      'mailto:hi@example.com?subject=%E3%81%8A%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B&body=a%20b',
    );
  });

  it('omits the query when nothing but the address was given', () => {
    expect(buildEmail({ to: 'hi@example.com', subject: '', body: '' })).toBe(
      'mailto:hi@example.com',
    );
  });

  it('returns nothing without an address', () => {
    expect(buildEmail({ to: '', subject: 's', body: 'b' })).toBe('');
  });
});

describe('buildPayload', () => {
  it('routes each mode to its builder', () => {
    const fields = {
      ...EMPTY_FIELDS,
      url: 'yoshinya.com',
      text: 'ただのテキスト',
      wifi: { ssid: 'ssid', password: 'pw', security: 'WPA', hidden: false },
    } as const;
    expect(buildPayload('url', fields)).toBe('https://yoshinya.com');
    expect(buildPayload('text', fields)).toBe('ただのテキスト');
    expect(buildPayload('wifi', fields)).toBe('WIFI:T:WPA;S:ssid;P:pw;;');
  });

  it('passes text through untouched, including leading spaces', () => {
    expect(buildPayload('text', { ...EMPTY_FIELDS, text: '  keep  ' })).toBe(
      '  keep  ',
    );
  });
});
