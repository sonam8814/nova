import { describe, it, expect } from 'vitest'
import { run } from '../testUtils.js'

describe('Date builtins', async () => {
  describe('date_now', async () => {
    it('returns a map with year, month, day', async () => {
      const { output } = await run(`
        remember d as date_now()
        show d["year"] > 2000
        show d["month"] >= 1 and d["month"] <= 12
        show d["day"] >= 1 and d["day"] <= 31
      `)
      expect(output).toEqual(['yes', 'yes', 'yes'])
    })

    it('errors on arguments', async () => {
      const r = await run('show date_now(1)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('0 arguments')
    })
  })

  describe('date_format', async () => {
    it('formats a date map to text', async () => {
      const { output } = await run(`
        remember d as {"year": 2026, "month": 3, "day": 5, "hours": 9, "minutes": 7, "seconds": 3, "milliseconds": 0}
        show date_format(d)
      `)
      expect(output).toEqual(['2026-03-05 09:07:03'])
    })

    it('errors on non-map', async () => {
      const r = await run('show date_format("hello")')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('date map')
    })
  })

  describe('date_parse', async () => {
    it('parses an ISO string', async () => {
      const { output } = await run(`
        remember d as date_parse("2026-10-08T14:30:00")
        show d["year"]
        show d["month"]
        show d["day"]
      `)
      expect(output).toEqual(['2026', '10', '8'])
    })

    it('errors on invalid date string', async () => {
      const r = await run('show date_parse("not-a-date")')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('Cannot parse')
    })

    it('errors on non-text', async () => {
      const r = await run('show date_parse(42)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('text')
    })
  })

  describe('date_diff', async () => {
    it('returns difference in milliseconds', async () => {
      const { output } = await run(`
        remember d1 as {"year": 2026, "month": 1, "day": 2, "hours": 0, "minutes": 0, "seconds": 0, "milliseconds": 0}
        remember d2 as {"year": 2026, "month": 1, "day": 1, "hours": 0, "minutes": 0, "seconds": 0, "milliseconds": 0}
        show date_diff(d1, d2)
      `)
      expect(output).toEqual(['86400000'])
    })

    it('errors on wrong argument count', async () => {
      const r = await run('show date_diff({"year": 2026, "month": 1, "day": 1})')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('2 arguments')
    })
  })

  describe('date_add', async () => {
    it('adds days', async () => {
      const { output } = await run(`
        remember d as {"year": 2026, "month": 1, "day": 1, "hours": 0, "minutes": 0, "seconds": 0, "milliseconds": 0}
        remember d2 as date_add(d, 5, "days")
        show d2["day"]
      `)
      expect(output).toEqual(['6'])
    })

    it('adds hours', async () => {
      const { output } = await run(`
        remember d as {"year": 2026, "month": 1, "day": 1, "hours": 10, "minutes": 0, "seconds": 0, "milliseconds": 0}
        remember d2 as date_add(d, 3, "hours")
        show d2["hours"]
      `)
      expect(output).toEqual(['13'])
    })

    it('errors on invalid unit', async () => {
      const r = await run(`
        remember d as {"year": 2026, "month": 1, "day": 1}
        show date_add(d, 1, "weeks")
      `)
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('unit')
    })

    it('errors on non-number amount', async () => {
      const r = await run(`
        remember d as {"year": 2026, "month": 1, "day": 1}
        show date_add(d, "five", "days")
      `)
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('number')
    })
  })
})
