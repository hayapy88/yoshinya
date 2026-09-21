// The six schema types the tool offers, declared as data. Adding a type is a
// matter of listing its fields here and their labels in the dictionaries; the
// builder, the form, and the storage code never mention a type by name.

export type SchemaTypeId =
  | 'article'
  | 'organization'
  | 'localBusiness'
  | 'faq'
  | 'breadcrumb'
  | 'product';

export const SCHEMA_TYPE_IDS: SchemaTypeId[] = [
  'article',
  'organization',
  'localBusiness',
  'faq',
  'breadcrumb',
  'product',
];

// What kind of control a field is drawn as, and how its value is read.
//   lines  — a textarea whose non-empty lines become an array
//   number — output as a JSON number; anything that does not parse is dropped
//   select — one of `options`; the first option is the default
export type FieldKind =
  | 'text'
  | 'url'
  | 'textarea'
  | 'lines'
  | 'date'
  | 'number'
  | 'select';

export type Field = {
  id: string;
  // Where the value lands in the output, e.g. ['address', 'streetAddress'].
  // A path of ['@type'] makes the field choose the node's own type.
  path: string[];
  kind: FieldKind;
  // Google lists it as required for the rich result. Shown as a badge; never
  // enforced, because the tool emits whatever was filled in.
  required?: boolean;
  options?: string[];
  // Select values that are shorthand for a full URL, such as schema.org's
  // ItemAvailability. The option is shown, the URL is emitted.
  optionPrefix?: string;
  // Takes the full row: for the one field whose value is a sentence.
  wide?: boolean;
};

// A group of sub-fields repeated any number of times, such as FAQ entries.
export type RepeatField = {
  id: string;
  path: string[];
  kind: 'repeat';
  itemType: string;
  fields: Field[];
  // Each item gets a 1-based `position`, as BreadcrumbList requires.
  autoPosition?: boolean;
  nestedTypes?: Record<string, string>;
};

export type AnyField = Field | RepeatField;

export type SchemaType = {
  id: SchemaTypeId;
  // The default @type. A field with path ['@type'] can override it.
  type: string;
  fields: AnyField[];
  // The @type to stamp on each nested object once it has any content, keyed by
  // its dotted path from the root.
  nestedTypes: Record<string, string>;
};

// Largest unit first, the way a Japanese address is written; the output order
// does not matter to a parser, and the form reads naturally in the primary
// market.
const ADDRESS_FIELDS: Field[] = [
  { id: 'postalCode', path: ['address', 'postalCode'], kind: 'text' },
  { id: 'addressRegion', path: ['address', 'addressRegion'], kind: 'text' },
  { id: 'addressLocality', path: ['address', 'addressLocality'], kind: 'text' },
  { id: 'streetAddress', path: ['address', 'streetAddress'], kind: 'text' },
  { id: 'addressCountry', path: ['address', 'addressCountry'], kind: 'text' },
];

const ARTICLE: SchemaType = {
  id: 'article',
  type: 'Article',
  fields: [
    {
      id: 'articleType',
      path: ['@type'],
      kind: 'select',
      options: ['Article', 'NewsArticle', 'BlogPosting'],
    },
    {
      id: 'headline',
      path: ['headline'],
      kind: 'text',
      required: true,
      wide: true,
    },
    { id: 'image', path: ['image'], kind: 'lines' },
    { id: 'datePublished', path: ['datePublished'], kind: 'date' },
    { id: 'dateModified', path: ['dateModified'], kind: 'date' },
    {
      id: 'authorType',
      path: ['author', '@type'],
      kind: 'select',
      options: ['Person', 'Organization'],
    },
    { id: 'authorName', path: ['author', 'name'], kind: 'text' },
    { id: 'authorUrl', path: ['author', 'url'], kind: 'url' },
    { id: 'publisherName', path: ['publisher', 'name'], kind: 'text' },
    { id: 'publisherLogo', path: ['publisher', 'logo', 'url'], kind: 'url' },
    { id: 'description', path: ['description'], kind: 'textarea' },
    { id: 'url', path: ['mainEntityOfPage'], kind: 'url' },
  ],
  nestedTypes: {
    publisher: 'Organization',
    'publisher.logo': 'ImageObject',
  },
};

const ORGANIZATION: SchemaType = {
  id: 'organization',
  type: 'Organization',
  fields: [
    { id: 'name', path: ['name'], kind: 'text', required: true },
    { id: 'url', path: ['url'], kind: 'url', required: true },
    { id: 'logo', path: ['logo'], kind: 'url' },
    { id: 'description', path: ['description'], kind: 'textarea' },
    { id: 'telephone', path: ['telephone'], kind: 'text' },
    { id: 'email', path: ['email'], kind: 'text' },
    ...ADDRESS_FIELDS,
    { id: 'sameAs', path: ['sameAs'], kind: 'lines' },
  ],
  nestedTypes: { address: 'PostalAddress' },
};

const LOCAL_BUSINESS: SchemaType = {
  id: 'localBusiness',
  type: 'LocalBusiness',
  fields: [
    {
      id: 'businessType',
      path: ['@type'],
      kind: 'select',
      options: [
        'LocalBusiness',
        'Restaurant',
        'Store',
        'MedicalClinic',
        'HairSalon',
        'Hotel',
      ],
    },
    { id: 'name', path: ['name'], kind: 'text', required: true },
    // Google requires the address as a whole; the street line stands for it.
    ...ADDRESS_FIELDS.map((field) =>
      field.id === 'streetAddress' ? { ...field, required: true } : field,
    ),
    { id: 'image', path: ['image'], kind: 'lines' },
    { id: 'url', path: ['url'], kind: 'url' },
    { id: 'telephone', path: ['telephone'], kind: 'text' },
    { id: 'priceRange', path: ['priceRange'], kind: 'text' },
    { id: 'latitude', path: ['geo', 'latitude'], kind: 'number' },
    { id: 'longitude', path: ['geo', 'longitude'], kind: 'number' },
    { id: 'openingHours', path: ['openingHours'], kind: 'lines' },
    { id: 'sameAs', path: ['sameAs'], kind: 'lines' },
    { id: 'description', path: ['description'], kind: 'textarea' },
  ],
  nestedTypes: { address: 'PostalAddress', geo: 'GeoCoordinates' },
};

const FAQ: SchemaType = {
  id: 'faq',
  type: 'FAQPage',
  fields: [
    {
      id: 'entries',
      path: ['mainEntity'],
      kind: 'repeat',
      itemType: 'Question',
      fields: [
        { id: 'question', path: ['name'], kind: 'text', required: true },
        {
          id: 'answer',
          path: ['acceptedAnswer', 'text'],
          kind: 'textarea',
          required: true,
        },
      ],
      nestedTypes: { acceptedAnswer: 'Answer' },
    },
  ],
  nestedTypes: {},
};

const BREADCRUMB: SchemaType = {
  id: 'breadcrumb',
  type: 'BreadcrumbList',
  fields: [
    {
      id: 'items',
      path: ['itemListElement'],
      kind: 'repeat',
      itemType: 'ListItem',
      autoPosition: true,
      fields: [
        { id: 'name', path: ['name'], kind: 'text', required: true },
        { id: 'item', path: ['item'], kind: 'url' },
      ],
    },
  ],
  nestedTypes: {},
};

const PRODUCT: SchemaType = {
  id: 'product',
  type: 'Product',
  fields: [
    { id: 'name', path: ['name'], kind: 'text', required: true },
    { id: 'image', path: ['image'], kind: 'lines' },
    { id: 'description', path: ['description'], kind: 'textarea' },
    { id: 'sku', path: ['sku'], kind: 'text' },
    { id: 'brand', path: ['brand', 'name'], kind: 'text' },
    { id: 'price', path: ['offers', 'price'], kind: 'number' },
    {
      id: 'priceCurrency',
      path: ['offers', 'priceCurrency'],
      kind: 'select',
      options: ['JPY', 'USD', 'EUR', 'GBP', 'AUD'],
    },
    {
      id: 'availability',
      path: ['offers', 'availability'],
      kind: 'select',
      options: ['InStock', 'OutOfStock', 'PreOrder'],
      optionPrefix: 'https://schema.org/',
    },
    { id: 'offerUrl', path: ['offers', 'url'], kind: 'url' },
    {
      id: 'ratingValue',
      path: ['aggregateRating', 'ratingValue'],
      kind: 'number',
    },
    {
      id: 'reviewCount',
      path: ['aggregateRating', 'reviewCount'],
      kind: 'number',
    },
  ],
  nestedTypes: {
    brand: 'Brand',
    offers: 'Offer',
    aggregateRating: 'AggregateRating',
  },
};

export const SCHEMA_TYPES: Record<SchemaTypeId, SchemaType> = {
  article: ARTICLE,
  organization: ORGANIZATION,
  localBusiness: LOCAL_BUSINESS,
  faq: FAQ,
  breadcrumb: BREADCRUMB,
  product: PRODUCT,
};

export function isSchemaTypeId(value: unknown): value is SchemaTypeId {
  return typeof value === 'string' && value in SCHEMA_TYPES;
}

// Every field id across every type, in one place, so the dictionaries can be
// typed against the list rather than each type's labels being looked up by
// hand. Ids are shared between types on purpose: "name" means the same thing
// on an Organization and a Product, and gets one label.
export const FIELD_IDS = [
  'articleType',
  'headline',
  'image',
  'datePublished',
  'dateModified',
  'authorType',
  'authorName',
  'authorUrl',
  'publisherName',
  'publisherLogo',
  'description',
  'url',
  'name',
  'logo',
  'telephone',
  'email',
  'streetAddress',
  'addressLocality',
  'addressRegion',
  'postalCode',
  'addressCountry',
  'sameAs',
  'businessType',
  'priceRange',
  'latitude',
  'longitude',
  'openingHours',
  'entries',
  'question',
  'answer',
  'items',
  'item',
  'sku',
  'brand',
  'price',
  'priceCurrency',
  'availability',
  'offerUrl',
  'ratingValue',
  'reviewCount',
] as const;

export type FieldId = (typeof FIELD_IDS)[number];
