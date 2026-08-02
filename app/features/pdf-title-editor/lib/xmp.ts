import { formatKeywords } from './metadata'
import type { PdfMetadataForm } from './types'

// A PDF can store the same document properties twice: in the Info dictionary
// and in an XMP packet. Viewers disagree about which one wins, so updating only
// the Info dictionary leaves a file that reports two different titles — and at
// least one major viewer shows the stale one. This module keeps the four
// overlapping XMP properties in step with what the user just set.
//
// It never creates an XMP packet. A PDF without one is left alone, because the
// Info dictionary is then the only answer any viewer can give.

const NS = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  dc: 'http://purl.org/dc/elements/1.1/',
  pdf: 'http://ns.adobe.com/pdf/1.3/',
} as const

type PropertySpec = {
  ns: string
  qualifiedName: string
  // XMP models these as different RDF containers, and readers expect the right
  // one: a language alternative for prose, an ordered list for authorship, an
  // unordered bag for keywords, plain text for the legacy mirror.
  kind: 'langAlt' | 'seq' | 'bag' | 'text'
  value: (metadata: PdfMetadataForm) => string[]
}

const PROPERTIES: PropertySpec[] = [
  {
    ns: NS.dc,
    qualifiedName: 'dc:title',
    kind: 'langAlt',
    value: (m) => (m.title === '' ? [] : [m.title]),
  },
  {
    ns: NS.dc,
    qualifiedName: 'dc:creator',
    kind: 'seq',
    value: (m) => (m.author === '' ? [] : [m.author]),
  },
  {
    ns: NS.dc,
    qualifiedName: 'dc:description',
    kind: 'langAlt',
    value: (m) => (m.subject === '' ? [] : [m.subject]),
  },
  { ns: NS.dc, qualifiedName: 'dc:subject', kind: 'bag', value: (m) => m.keywords },
  {
    // Adobe's own mirror of Info /Keywords. Kept in step so the two cannot
    // contradict each other either.
    ns: NS.pdf,
    qualifiedName: 'pdf:Keywords',
    kind: 'text',
    value: (m) =>
      m.keywords.length === 0 ? [] : [formatKeywords(m.keywords)],
  },
]

function localName(qualifiedName: string): string {
  return qualifiedName.split(':')[1] ?? qualifiedName
}

// XMP allows the same property to appear in any rdf:Description, and simple
// properties may be attributes rather than elements. Clear every form before
// writing the new one, or a leftover copy could win.
function removeEverywhere(
  descriptions: Element[],
  spec: PropertySpec,
): void {
  const local = localName(spec.qualifiedName)
  for (const description of descriptions) {
    const existing = Array.from(
      description.getElementsByTagNameNS(spec.ns, local),
    )
    for (const element of existing) {
      element.parentNode?.removeChild(element)
    }
    if (description.hasAttributeNS(spec.ns, local)) {
      description.removeAttributeNS(spec.ns, local)
    }
  }
}

function buildProperty(
  doc: XMLDocument,
  spec: PropertySpec,
  values: string[],
): Element {
  const property = doc.createElementNS(spec.ns, spec.qualifiedName)
  if (spec.kind === 'text') {
    property.textContent = values[0] ?? ''
    return property
  }
  const containerName =
    spec.kind === 'langAlt' ? 'rdf:Alt' : spec.kind === 'seq' ? 'rdf:Seq' : 'rdf:Bag'
  const container = doc.createElementNS(NS.rdf, containerName)
  for (const value of values) {
    const item = doc.createElementNS(NS.rdf, 'rdf:li')
    if (spec.kind === 'langAlt') {
      item.setAttribute('xml:lang', 'x-default')
    }
    item.textContent = value
    container.appendChild(item)
  }
  property.appendChild(container)
  return property
}

/**
 * Rewrites the overlapping properties of an XMP packet so they match the
 * metadata being written to the Info dictionary. Blank values remove the
 * property rather than writing an empty one.
 *
 * Returns null when the packet cannot be handled safely — unparseable XML, no
 * rdf:Description, or no DOM available. The caller must then leave the original
 * stream untouched: a half-rewritten packet is worse than a stale one.
 */
export function syncXmp(xml: string, metadata: PdfMetadataForm): string | null {
  if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
    return null
  }
  let doc: XMLDocument
  try {
    doc = new DOMParser().parseFromString(xml, 'application/xml')
  } catch {
    return null
  }
  if (doc.getElementsByTagName('parsererror').length > 0) {
    return null
  }
  const descriptions = Array.from(
    doc.getElementsByTagNameNS(NS.rdf, 'Description'),
  )
  const target = descriptions[0]
  if (!target) {
    return null
  }

  for (const spec of PROPERTIES) {
    removeEverywhere(descriptions, spec)
    const values = spec.value(metadata)
    if (values.length > 0) {
      target.appendChild(buildProperty(doc, spec, values))
    }
  }

  try {
    return new XMLSerializer().serializeToString(doc)
  } catch {
    return null
  }
}

function itemValues(property: Element): string[] {
  const items = Array.from(property.getElementsByTagNameNS(NS.rdf, 'li'))
  if (items.length === 0) {
    return [property.textContent?.trim() ?? ''].filter((v) => v !== '')
  }
  return items
    .map((item) => item.textContent?.trim() ?? '')
    .filter((value) => value !== '')
}

function readProperty(doc: XMLDocument, spec: PropertySpec): string[] {
  const local = localName(spec.qualifiedName)
  const element = doc.getElementsByTagNameNS(spec.ns, local)[0]
  if (element) {
    if (spec.kind === 'langAlt') {
      // Prefer the default language, but take whatever is there over nothing.
      const items = Array.from(element.getElementsByTagNameNS(NS.rdf, 'li'))
      const preferred =
        items.find((item) => item.getAttribute('xml:lang') === 'x-default') ??
        items[0]
      const value = preferred?.textContent?.trim() ?? ''
      return value === '' ? [] : [value]
    }
    return itemValues(element)
  }
  // Simple properties may be serialised as an attribute instead.
  for (const description of Array.from(
    doc.getElementsByTagNameNS(NS.rdf, 'Description'),
  )) {
    const attribute = description.getAttributeNS(spec.ns, local)
    if (attribute && attribute.trim() !== '') {
      return [attribute.trim()]
    }
  }
  return []
}

/**
 * Pulls the overlapping properties back out of an XMP packet. Used only to fill
 * fields the Info dictionary leaves blank: without it, a PDF whose title lives
 * solely in XMP would display as untitled here and then have that title
 * silently deleted on save.
 */
export function readXmp(xml: string): Partial<PdfMetadataForm> | null {
  if (typeof DOMParser === 'undefined') {
    return null
  }
  let doc: XMLDocument
  try {
    doc = new DOMParser().parseFromString(xml, 'application/xml')
  } catch {
    return null
  }
  if (doc.getElementsByTagName('parsererror').length > 0) {
    return null
  }
  const [title] = readProperty(doc, PROPERTIES[0]!)
  const [author] = readProperty(doc, PROPERTIES[1]!)
  const [subject] = readProperty(doc, PROPERTIES[2]!)
  const keywords = readProperty(doc, PROPERTIES[3]!)
  return {
    title: title ?? '',
    author: author ?? '',
    subject: subject ?? '',
    keywords,
  }
}
