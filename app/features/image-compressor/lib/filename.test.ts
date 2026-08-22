import { describe, expect, it } from 'vitest'
import { outputFileName, resolveDuplicateNames } from './filename'

describe('outputFileName', () => {
  it('leaves the name alone when the format is unchanged', () => {
    expect(outputFileName('photo.jpg', 'jpeg')).toBe('photo.jpg')
    expect(outputFileName('photo.png', 'png')).toBe('photo.png')
  })

  it('accepts either spelling of the jpeg extension without churn', () => {
    expect(outputFileName('photo.jpeg', 'jpeg')).toBe('photo.jpeg')
  })

  it('swaps the extension when the format changed', () => {
    expect(outputFileName('photo.png', 'webp')).toBe('photo.webp')
    expect(outputFileName('photo.png', 'jpeg')).toBe('photo.jpg')
  })

  it('replaces only the final extension', () => {
    expect(outputFileName('shot.2026.png', 'webp')).toBe('shot.2026.webp')
  })

  it('appends when there is no extension at all', () => {
    expect(outputFileName('screenshot', 'webp')).toBe('screenshot.webp')
  })

  it('is case-insensitive about the existing extension', () => {
    expect(outputFileName('PHOTO.JPG', 'jpeg')).toBe('PHOTO.JPG')
  })

  it('keeps Japanese names intact', () => {
    expect(outputFileName('決算報告.png', 'webp')).toBe('決算報告.webp')
  })
})

describe('resolveDuplicateNames', () => {
  it('leaves unique names alone', () => {
    expect(resolveDuplicateNames(['a.jpg', 'b.jpg'])).toEqual([
      'a.jpg',
      'b.jpg',
    ])
  })

  it('numbers duplicates from 2, keeping the extension', () => {
    expect(resolveDuplicateNames(['a.jpg', 'a.jpg', 'a.jpg'])).toEqual([
      'a.jpg',
      'a-2.jpg',
      'a-3.jpg',
    ])
  })

  it('treats names differing only in case as colliding', () => {
    // They would collide in a ZIP and on most file systems.
    expect(resolveDuplicateNames(['A.jpg', 'a.jpg'])).toEqual([
      'A.jpg',
      'a-2.jpg',
    ])
  })

  it('handles a collision created by converting two formats to one', () => {
    // photo.png and photo.jpg both become photo.webp.
    expect(resolveDuplicateNames(['photo.webp', 'photo.webp'])).toEqual([
      'photo.webp',
      'photo-2.webp',
    ])
  })

  it('does not collide with a name that already looks numbered', () => {
    expect(resolveDuplicateNames(['a.jpg', 'a-2.jpg', 'a.jpg'])).toEqual([
      'a.jpg',
      'a-2.jpg',
      'a-3.jpg',
    ])
  })
})
