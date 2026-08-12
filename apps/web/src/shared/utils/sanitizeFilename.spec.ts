import { describe, expect, it } from 'vitest'
import { sanitizeFilename } from './sanitizeFilename'

describe('sanitizeFilename', () => {
  it('returns empty string for null/undefined/empty input', () => {
    expect(sanitizeFilename(null)).toBe('')
    expect(sanitizeFilename(undefined)).toBe('')
    expect(sanitizeFilename('')).toBe('')
  })

  it('preserves clean English filenames', () => {
    expect(sanitizeFilename('lecture1.pdf')).toBe('lecture1.pdf')
  })

  it('preserves clean Arabic filenames', () => {
    expect(sanitizeFilename('الكيمياء والفيزياء.pdf')).toBe('الكيمياء والفيزياء.pdf')
  })

  it('decodes Latin1-mangled UTF-8 Arabic filenames (mojibake)', () => {
    // "الكيمياء.pdf" UTF-8 bytes parsed as Latin1
    const arabicUtf8Bytes = [
      0xd8, 0xa7, 0xd9, 0x84, 0xd9, 0x83, 0xd9, 0x8a, 0xd9, 0x85, 0xd9, 0x8a, 0xd8, 0xa7, 0xd8, 0xa1,
    ]
    const mojibake = String.fromCharCode(...arabicUtf8Bytes) + '.pdf'
    expect(sanitizeFilename(mojibake)).toBe('الكيمياء.pdf')
  })
})
