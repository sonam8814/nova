import { describe, it, expect } from 'vitest'
import { EXAMPLES } from './examples.js'
import { run } from '../lang/testUtils.js'

describe('built-in examples', () => {
  it('has unique names', () => {
    const names = EXAMPLES.map(e => e.name)
    expect(new Set(names).size).toBe(names.length)
  })

  for (const ex of EXAMPLES) {
    it(`${ex.name} runs without errors`, async () => {
      const { 'main.nova': main, ...files } = ex.files
      const stripped = Object.fromEntries(
        Object.entries(files).map(([k, v]) => [k.replace(/\.nova$/, ''), v])
      )
      const { output, error } = await run(main, {
        input: ['Nova'],
        files: { ...files, ...stripped },
      })
      expect(error).toBeNull()
      expect(output.length).toBeGreaterThan(0)
    })
  }
})
