/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest'
import { readXmp, syncXmp } from './xmp'
import type { PdfMetadataForm } from './types'

const metadata = (over: Partial<PdfMetadataForm> = {}): PdfMetadataForm => ({
  title: '',
  author: '',
  subject: '',
  keywords: [],
  ...over,
})

const packet = (
  body: string,
) => `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/">
${body}
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`

const withTitle = (title: string) =>
  packet(
    `   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${title}</rdf:li></rdf:Alt></dc:title>`,
  )

describe('syncXmp', () => {
  it('replaces a stale dc:title with the new one', () => {
    const result = syncXmp(withTitle('OLD'), metadata({ title: 'NEW' }))
    expect(result).not.toBeNull()
    expect(result).toContain('NEW')
    expect(result).not.toContain('OLD')
  })

  it('removes the property when the value is cleared', () => {
    const result = syncXmp(withTitle('OLD'), metadata())
    expect(result).not.toContain('dc:title')
    expect(result).not.toContain('OLD')
  })

  it('writes keywords as an rdf:Bag with one entry each', () => {
    const result = syncXmp(
      packet(''),
      metadata({ keywords: ['annual report', '決算'] }),
    )
    expect(result).toContain('rdf:Bag')
    expect(result).toContain('annual report')
    expect(result).toContain('決算')
  })

  it('mirrors keywords into pdf:Keywords as a comma-separated string', () => {
    const result = syncXmp(packet(''), metadata({ keywords: ['a', 'b'] }))
    expect(result).toMatch(/<pdf:Keywords[^>]*>a, b<\/pdf:Keywords>/)
  })

  it('uses an ordered Seq for the author, as XMP expects', () => {
    const result = syncXmp(packet(''), metadata({ author: 'Yoshinya' }))
    expect(result).toContain('rdf:Seq')
    expect(result).toContain('Yoshinya')
  })

  it('leaves unrelated XMP properties alone', () => {
    const source = packet(
      `   <xmp:CreatorTool>Acme Writer</xmp:CreatorTool>
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">OLD</rdf:li></rdf:Alt></dc:title>`,
    )
    const result = syncXmp(source, metadata({ title: 'NEW' }))
    expect(result).toContain('Acme Writer')
    expect(result).not.toContain('OLD')
  })

  it('clears a copy of the property hiding in a second rdf:Description', () => {
    const source = `<?xpacket begin="" ?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/"/>
  <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">HIDDEN OLD</rdf:li></rdf:Alt></dc:title>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>`
    const result = syncXmp(source, metadata({ title: 'NEW' }))
    expect(result).not.toContain('HIDDEN OLD')
    expect(result).toContain('NEW')
  })

  it('removes an attribute-form property too', () => {
    const source = `<?xpacket begin="" ?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/" pdf:Keywords="stale, words"/>
 </rdf:RDF>
</x:xmpmeta>`
    const result = syncXmp(source, metadata({ keywords: ['fresh'] }))
    expect(result).not.toContain('stale, words')
    expect(result).toContain('fresh')
  })

  it('refuses to touch a packet it cannot parse', () => {
    expect(syncXmp('<not xml', metadata({ title: 'NEW' }))).toBeNull()
  })

  it('refuses a packet with no rdf:Description', () => {
    const source = `<?xml version="1.0"?><x:xmpmeta xmlns:x="adobe:ns:meta/"></x:xmpmeta>`
    expect(syncXmp(source, metadata({ title: 'NEW' }))).toBeNull()
  })
})

describe('readXmp', () => {
  it('reads a language alternative, preferring x-default', () => {
    const source = packet(
      `   <dc:title><rdf:Alt><rdf:li xml:lang="fr">Titre</rdf:li><rdf:li xml:lang="x-default">Title</rdf:li></rdf:Alt></dc:title>`,
    )
    expect(readXmp(source)?.title).toBe('Title')
  })

  it('falls back to the first entry when there is no x-default', () => {
    const source = packet(
      `   <dc:title><rdf:Alt><rdf:li xml:lang="fr">Titre</rdf:li></rdf:Alt></dc:title>`,
    )
    expect(readXmp(source)?.title).toBe('Titre')
  })

  it('reads every keyword out of the bag', () => {
    const source = packet(
      `   <dc:subject><rdf:Bag><rdf:li>a</rdf:li><rdf:li>b b</rdf:li></rdf:Bag></dc:subject>`,
    )
    expect(readXmp(source)?.keywords).toEqual(['a', 'b b'])
  })

  it('returns blanks for a packet with none of the properties', () => {
    expect(readXmp(packet(''))).toEqual({
      title: '',
      author: '',
      subject: '',
      keywords: [],
    })
  })

  it('survives what it cannot parse', () => {
    expect(readXmp('<not xml')).toBeNull()
  })

  it('round-trips everything syncXmp writes', () => {
    const source = metadata({
      title: '2026年 決算報告',
      author: 'よしにゃ',
      subject: 'Quarterly',
      keywords: ['annual report', '決算'],
    })
    const written = syncXmp(packet(''), source)
    expect(written).not.toBeNull()
    expect(readXmp(written!)).toEqual(source)
  })
})
