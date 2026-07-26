import { describe, expect, it } from 'vitest'
import { buildZipEntries } from './zip-entries'
import type { ImageItem, SortingFolder } from './types'

function img(id: string, name: string, folderId: string | null): ImageItem {
  return {
    id,
    file: new File(['x'], name, { type: 'image/png' }),
    name,
    mimeType: 'image/png',
    previewUrl: `blob:${id}`,
    folderId,
    error: false,
  }
}

const folders: SortingFolder[] = [
  { id: 'b1', name: 'Main', order: 0 },
  { id: 'b2', name: 'Detail', order: 1 },
  { id: 'b3', name: 'Empty', order: 2 },
]

describe('buildZipEntries', () => {
  it('groups images into per-folder folders in folder order', () => {
    const images = [
      img('1', 'a.jpg', 'b1'),
      img('2', 'b.jpg', 'b2'),
      img('3', 'c.jpg', 'b1'),
    ]
    expect(buildZipEntries(images, folders)).toEqual([
      { path: 'Main/a.jpg', file: images[0].file },
      { path: 'Main/c.jpg', file: images[2].file },
      { path: 'Detail/b.jpg', file: images[1].file },
    ])
  })

  it('omits empty folders and unsorted images by default', () => {
    const images = [img('1', 'a.jpg', 'b1'), img('2', 'b.jpg', null)]
    const entries = buildZipEntries(images, folders)
    expect(entries).toEqual([{ path: 'Main/a.jpg', file: images[0].file }])
  })

  it('includes unsorted images in their own folder when asked', () => {
    const images = [img('1', 'a.jpg', 'b1'), img('2', 'b.jpg', null)]
    const entries = buildZipEntries(images, folders, {
      includeUnsorted: true,
      unsortedFolderName: 'Unsorted',
    })
    expect(entries).toContainEqual({
      path: 'Unsorted/b.jpg',
      file: images[1].file,
    })
  })

  it('deduplicates file names within a folder so nothing is lost', () => {
    const images = [
      img('1', 'same.jpg', 'b1'),
      img('2', 'same.jpg', 'b1'),
      img('3', 'same.jpg', 'b1'),
    ]
    expect(buildZipEntries(images, folders).map((e) => e.path)).toEqual([
      'Main/same.jpg',
      'Main/same (2).jpg',
      'Main/same (3).jpg',
    ])
  })

  it('uniquifies folder folder names that sanitize to the same value', () => {
    const clashing: SortingFolder[] = [
      { id: 'b1', name: 'a/b', order: 0 },
      { id: 'b2', name: 'a\\b', order: 1 },
    ]
    const images = [img('1', 'x.jpg', 'b1'), img('2', 'y.jpg', 'b2')]
    expect(buildZipEntries(images, clashing).map((e) => e.path)).toEqual([
      'a_b/x.jpg',
      'a_b (2)/y.jpg',
    ])
  })

  it('skips images that failed to load', () => {
    const broken = img('1', 'a.jpg', 'b1')
    broken.error = true
    const images = [broken, img('2', 'b.jpg', 'b1')]
    expect(buildZipEntries(images, folders).map((e) => e.path)).toEqual([
      'Main/b.jpg',
    ])
  })
})
