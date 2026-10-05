/**
 * Builds the single string that goes inside the QR code.
 *
 * Every mode is a pure function from the form's fields to that string, which
 * is what makes this file the one worth testing hardest: a QR code that
 * encodes a malformed WiFi record still scans, still looks right, and simply
 * fails to connect. Nothing downstream can notice the mistake.
 */

export type QrMode = 'url' | 'text' | 'wifi' | 'vcard' | 'email';

export const QR_MODES: QrMode[] = ['url', 'text', 'wifi', 'vcard', 'email'];

export type WifiSecurity = 'WPA' | 'WEP' | 'nopass';

export type WifiFields = {
  ssid: string;
  password: string;
  security: WifiSecurity;
  hidden: boolean;
};

export type VCardFields = {
  lastName: string;
  firstName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  url: string;
};

export type EmailFields = {
  to: string;
  subject: string;
  body: string;
};

export type QrFields = {
  url: string;
  text: string;
  wifi: WifiFields;
  vcard: VCardFields;
  email: EmailFields;
};

export const EMPTY_FIELDS: QrFields = {
  url: '',
  text: '',
  wifi: { ssid: '', password: '', security: 'WPA', hidden: false },
  vcard: {
    lastName: '',
    firstName: '',
    organization: '',
    title: '',
    phone: '',
    email: '',
    url: '',
  },
  email: { to: '', subject: '', body: '' },
};

/** Anything of the form `scheme:` — not just http, so `mailto:` or `tel:` pass through. */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * A URL typed by hand rarely carries its scheme, and a QR code holding
 * `yoshinya.com` opens nothing on most scanners — it is read as plain text.
 * The scheme is therefore added rather than demanded of the user.
 */
export function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (!value) {
    return '';
  }
  return HAS_SCHEME.test(value) ? value : `https://${value}`;
}

/**
 * In a WIFI record, `;` ends a field and `:` separates key from value, so an
 * SSID or password containing either has to be escaped or the record silently
 * means something else. `\` and `,` are escaped for the same reason.
 */
export function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

export function buildWifi(fields: WifiFields): string {
  const ssid = fields.ssid.trim();
  if (!ssid) {
    return '';
  }
  const parts = [`T:${fields.security}`, `S:${escapeWifi(ssid)}`];
  // An open network has no password field at all; an empty `P:` makes some
  // scanners prompt for one.
  if (fields.security !== 'nopass' && fields.password) {
    parts.push(`P:${escapeWifi(fields.password)}`);
  }
  // Only when the network really is hidden: `H:true` on a broadcast network
  // makes some phones look for a hidden one and fail to join.
  if (fields.hidden) {
    parts.push('H:true');
  }
  return `WIFI:${parts.join(';')};;`;
}

/** vCard uses `;` and `,` structurally, and a literal newline would end the line. */
export function escapeVCard(value: string): string {
  return value
    .replace(/([\\;,])/g, '\\$1')
    .replace(/\r\n|\r|\n/g, '\\n');
}

export function buildVCard(fields: VCardFields): string {
  const last = fields.lastName.trim();
  const first = fields.firstName.trim();
  if (!last && !first && !fields.organization.trim()) {
    return '';
  }
  const display = [last, first].filter(Boolean).join(' ');
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCard(last)};${escapeVCard(first)};;;`,
    `FN:${escapeVCard(display || fields.organization.trim())}`,
  ];
  const optional: [string, string][] = [
    ['ORG', fields.organization],
    ['TITLE', fields.title],
    ['TEL;TYPE=CELL', fields.phone],
    ['EMAIL', fields.email],
    ['URL', fields.url],
  ];
  for (const [key, value] of optional) {
    const trimmed = value.trim();
    if (trimmed) {
      // A URL is not escaped: its `,` and `;` are part of the address, and
      // scanners hand the value straight to the browser.
      lines.push(`${key}:${key === 'URL' ? trimmed : escapeVCard(trimmed)}`);
    }
  }
  lines.push('END:VCARD');
  // vCard lines are separated by CRLF; LF alone is rejected by some address books.
  return lines.join('\r\n');
}

export function buildEmail(fields: EmailFields): string {
  const to = fields.to.trim();
  if (!to) {
    return '';
  }
  const query: string[] = [];
  if (fields.subject.trim()) {
    query.push(`subject=${encodeURIComponent(fields.subject.trim())}`);
  }
  if (fields.body.trim()) {
    query.push(`body=${encodeURIComponent(fields.body)}`);
  }
  // The address itself is left as typed: percent-encoding `@` gives an address
  // some mail clients refuse to open.
  return `mailto:${to}${query.length ? `?${query.join('&')}` : ''}`;
}

export function buildPayload(mode: QrMode, fields: QrFields): string {
  switch (mode) {
    case 'url':
      return normalizeUrl(fields.url);
    case 'text':
      return fields.text;
    case 'wifi':
      return buildWifi(fields.wifi);
    case 'vcard':
      return buildVCard(fields.vcard);
    case 'email':
      return buildEmail(fields.email);
  }
}
