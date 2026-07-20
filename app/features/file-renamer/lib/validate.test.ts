import { describe, expect, it } from 'vitest'

import { validateTextValue } from './validate'

describe('validateTextValue', () => {
  it.each(['/', '\\', ':', '*', '?', '"', '<', '>', '|'])(
    'rejects the forbidden character %s',
    (char) => {
      expect(validateTextValue(`photo${char}1`)).toEqual({
        code: 'invalidChars',
        chars: char,
      })
    },
  )

  it('accepts a normal string', () => {
    expect(validateTextValue('photo_2026 (1)')).toBeNull()
  })

  it('accepts an empty string', () => {
    expect(validateTextValue('')).toBeNull()
  })

  it('lists each offending character once', () => {
    expect(validateTextValue('a/b/c:d')).toEqual({
      code: 'invalidChars',
      chars: '/ :',
    })
  })
})
