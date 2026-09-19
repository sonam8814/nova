import { describe, it, expect } from 'vitest'
import { LANG_NAME, FILE_EXT, MAX_DEPTH, MAX_STEPS } from './config.js'

describe('lang config', () => {
  it('exports the correct language name', () => {
    expect(LANG_NAME).toBe('nova')
  })

  it('exports the correct file extension', () => {
    expect(FILE_EXT).toBe('.nova')
  })

  it('exports depth and step limits', () => {
    expect(MAX_DEPTH).toBe(10000)
    expect(MAX_STEPS).toBe(50_000_000)
  })
})
