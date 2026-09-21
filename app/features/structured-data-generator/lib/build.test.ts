import { describe, expect, it } from 'vitest';
import { buildJsonLd, serializeJsonLd } from './build';
import { SCHEMA_TYPES, SCHEMA_TYPE_IDS } from './schemas';
import { emptyValues, setField, setRepeatField, addRepeatItem } from './values';

describe('buildJsonLd', () => {
  it.each(SCHEMA_TYPE_IDS)(
    '%s with nothing filled in is just the context and type',
    (id) => {
      const schema = SCHEMA_TYPES[id];
      expect(buildJsonLd(schema, emptyValues(schema))).toEqual({
        '@context': 'https://schema.org',
        '@type': schema.type,
      });
    },
  );

  it('emits only the fields that were filled in, in schema order', () => {
    const schema = SCHEMA_TYPES.organization;
    let values = emptyValues(schema);
    values = setField(values, 'url', 'https://example.com');
    values = setField(values, 'name', 'Example Inc.');
    expect(buildJsonLd(schema, values)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Example Inc.',
      url: 'https://example.com',
    });
  });

  it('types a nested object once it has content and drops it otherwise', () => {
    const schema = SCHEMA_TYPES.organization;
    const values = setField(emptyValues(schema), 'addressLocality', 'Sydney');
    expect(buildJsonLd(schema, values).address).toEqual({
      '@type': 'PostalAddress',
      addressLocality: 'Sydney',
    });
  });

  it('a select alone does not bring its object into existence', () => {
    const schema = SCHEMA_TYPES.product;
    // priceCurrency defaults to JPY, availability to InStock: both selects.
    const values = setField(emptyValues(schema), 'name', 'Mug');
    expect(buildJsonLd(schema, values)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Mug',
    });
  });

  it('a select rides along once something else in its object is typed', () => {
    const schema = SCHEMA_TYPES.product;
    let values = setField(emptyValues(schema), 'price', '1200');
    values = setField(values, 'availability', 'PreOrder');
    expect(buildJsonLd(schema, values).offers).toEqual({
      '@type': 'Offer',
      price: 1200,
      priceCurrency: 'JPY',
      availability: 'https://schema.org/PreOrder',
    });
  });

  it('numbers come out as numbers and unparseable ones are dropped', () => {
    const schema = SCHEMA_TYPES.localBusiness;
    let values = setField(emptyValues(schema), 'latitude', '-33.8688');
    values = setField(values, 'longitude', 'about 151');
    expect(buildJsonLd(schema, values).geo).toEqual({
      '@type': 'GeoCoordinates',
      latitude: -33.8688,
    });
  });

  it('splits multi-line fields into an array and ignores blank lines', () => {
    const schema = SCHEMA_TYPES.organization;
    const values = setField(
      emptyValues(schema),
      'sameAs',
      '  https://x.com/a \n\n\nhttps://github.com/a\n',
    );
    expect(buildJsonLd(schema, values).sameAs).toEqual([
      'https://x.com/a',
      'https://github.com/a',
    ]);
  });

  it('lets a select choose the root type', () => {
    const schema = SCHEMA_TYPES.article;
    let values = setField(emptyValues(schema), 'articleType', 'BlogPosting');
    values = setField(values, 'headline', 'Hello');
    expect(buildJsonLd(schema, values)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Hello',
    });
  });

  it('keeps the author type chosen in the select', () => {
    const schema = SCHEMA_TYPES.article;
    let values = setField(emptyValues(schema), 'authorType', 'Organization');
    values = setField(values, 'authorName', 'Yoshinya');
    expect(buildJsonLd(schema, values).author).toEqual({
      '@type': 'Organization',
      name: 'Yoshinya',
    });
  });

  it('types the publisher logo two levels down', () => {
    const schema = SCHEMA_TYPES.article;
    const values = setField(
      emptyValues(schema),
      'publisherLogo',
      'https://example.com/logo.png',
    );
    expect(buildJsonLd(schema, values).publisher).toEqual({
      '@type': 'Organization',
      logo: { '@type': 'ImageObject', url: 'https://example.com/logo.png' },
    });
  });

  it('builds FAQ entries, skipping blank rows', () => {
    const schema = SCHEMA_TYPES.faq;
    let values = emptyValues(schema);
    values = setRepeatField(values, 'entries', 0, 'question', 'Is it free?');
    values = setRepeatField(values, 'entries', 0, 'answer', 'Yes.');
    values = addRepeatItem(values, schema.fields[0] as never);
    values = addRepeatItem(values, schema.fields[0] as never);
    values = setRepeatField(values, 'entries', 2, 'question', 'Sign-up?');
    expect(buildJsonLd(schema, values).mainEntity).toEqual([
      {
        '@type': 'Question',
        name: 'Is it free?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes.' },
      },
      { '@type': 'Question', name: 'Sign-up?' },
    ]);
  });

  it('numbers breadcrumb positions after skipping blank rows', () => {
    const schema = SCHEMA_TYPES.breadcrumb;
    let values = emptyValues(schema);
    values = addRepeatItem(values, schema.fields[0] as never);
    values = addRepeatItem(values, schema.fields[0] as never);
    values = setRepeatField(values, 'items', 0, 'name', 'Home');
    values = setRepeatField(values, 'items', 0, 'item', 'https://example.com/');
    values = setRepeatField(values, 'items', 2, 'name', 'Tools');
    expect(buildJsonLd(schema, values).itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://example.com/',
      },
      { '@type': 'ListItem', position: 2, name: 'Tools' },
    ]);
  });

  it('trims whitespace around values', () => {
    const schema = SCHEMA_TYPES.product;
    const values = setField(emptyValues(schema), 'name', '  Mug  ');
    expect(buildJsonLd(schema, values).name).toBe('Mug');
  });
});

describe('serializeJsonLd', () => {
  const data = { '@context': 'https://schema.org', '@type': 'Thing' };

  it('wraps in a script tag when asked', () => {
    expect(serializeJsonLd(data, { wrap: true })).toBe(
      '<script type="application/ld+json">\n' +
        '{\n  "@context": "https://schema.org",\n  "@type": "Thing"\n}\n' +
        '</script>',
    );
  });

  it('puts the comment above the tag, and nowhere without one', () => {
    expect(
      serializeJsonLd(data, { wrap: true, comment: 'Structured data: Thing' }),
    ).toMatch(/^<!-- Structured data: Thing -->\n<script/);
    expect(
      serializeJsonLd(data, { wrap: false, comment: 'Structured data: Thing' }),
    ).toMatch(/^\{/);
  });

  it('keeps a comment from closing itself early', () => {
    expect(
      serializeJsonLd(data, { wrap: true, comment: 'a -- b --> c' }),
    ).toMatch(/^<!-- a - - b - -> c -->/);
  });

  it('emits bare JSON otherwise', () => {
    expect(JSON.parse(serializeJsonLd(data, { wrap: false }))).toEqual(data);
  });

  it('escapes < so a value cannot close the script tag', () => {
    const out = serializeJsonLd(
      { ...data, name: 'a</script><script>alert(1)</script>' },
      { wrap: true },
    );
    expect(out.match(/<\/script>/g)).toHaveLength(1);
    expect(out).toContain('\\u003c/script>');
    const json = out.replace(/^<script[^>]*>\n/, '').replace(/\n<\/script>$/, '');
    expect(JSON.parse(json).name).toBe('a</script><script>alert(1)</script>');
  });
});
