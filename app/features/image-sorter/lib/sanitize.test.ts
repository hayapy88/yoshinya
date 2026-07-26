import { describe, expect, it } from 'vitest'
import { sanitizeFolderName, splitExtension, uniquifyName } from './sanitize'

describe('sanitizeFolderName', () => {
  it('keeps a normal name, including spaces and hyphens', () => {
    expect(sanitizeFolderName('Main images')).toBe('Main images')
    expect(sanitizeFolderName('detail-shots')).toBe('detail-shots')
    expect(sanitizeFolderName('メイン画像')).toBe('メイン画像')
  })

  it('replaces path-breaking characters with underscore', () => {
    expect(sanitizeFolderName('a/b\\c:d*e?f"g<h>i|j')).toBe(
      'a_b_c_d_e_f_g_h_i_j',
    )
  })

  it('strips trailing dots and spaces (rejected on Windows)', () => {
    expect(sanitizeFolderName('folder. ')).toBe('folder')
  })

  it('falls back when nothing usable remains', () => {
    expect(sanitizeFolderName('')).toBe('folder')
    expect(sanitizeFolderName('///')).toBe('___')
  })

  it('caps very long names', () => {
    expect(sanitizeFolderName('x'.repeat(300)).length).toBe(100)
  })
})

describe('splitExtension', () => {
  it('splits a normal name', () => {
    expect(splitExtension('IMG_0001.jpg')).toEqual({
      base: 'IMG_0001',
      ext: '.jpg',
    })
  })

  it('treats dotfiles as base only', () => {
    expect(splitExtension('.gitignore')).toEqual({
      base: '.gitignore',
      ext: '',
    })
  })
})

describe('uniquifyName', () => {
  it('returns the name unchanged when unused', () => {
    const used = new Set<string>()
    expect(uniquifyName('a.jpg', used)).toBe('a.jpg')
  })

  it('appends a counter before the extension on collision', () => {
    const used = new Set<string>()
    expect(uniquifyName('a.jpg', used)).toBe('a.jpg')
    expect(uniquifyName('a.jpg', used)).toBe('a (2).jpg')
    expect(uniquifyName('a.jpg', used)).toBe('a (3).jpg')
  })

  it('is case-insensitive', () => {
    const used = new Set<string>()
    uniquifyName('Photo.PNG', used)
    expect(uniquifyName('photo.png', used)).toBe('photo (2).png')
  })
})
