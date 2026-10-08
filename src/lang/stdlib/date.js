import { typeName } from '../values.js'

function dateMapToJs(dateMap, name, error) {
  if (!dateMap || dateMap._type !== 'map') {
    throw error('TypeError', `'${name}' expects a date map, got ${typeName(dateMap)}.`, null, null)
  }
  const e = dateMap.entries
  const year = e.get('year')
  const month = e.get('month')
  const day = e.get('day')
  const hours = e.has('hours') ? e.get('hours') : 0
  const minutes = e.has('minutes') ? e.get('minutes') : 0
  const seconds = e.has('seconds') ? e.get('seconds') : 0
  const ms = e.has('milliseconds') ? e.get('milliseconds') : 0
  if (typeof year !== 'number' || typeof month !== 'number' || typeof day !== 'number') {
    throw error('TypeError', `'${name}' date map must have numeric year, month, and day.`, null, null)
  }
  return new Date(year, month - 1, day, hours, minutes, seconds, ms)
}

function jsToDateMap(d) {
  return {
    _type: 'map',
    entries: new Map([
      ['year', d.getFullYear()],
      ['month', d.getMonth() + 1],
      ['day', d.getDate()],
      ['hours', d.getHours()],
      ['minutes', d.getMinutes()],
      ['seconds', d.getSeconds()],
      ['milliseconds', d.getMilliseconds()],
    ]),
  }
}

function pad(n, len = 2) {
  return String(n).padStart(len, '0')
}

export function getDateBuiltins(error) {
  return {
    date_now: {
      _type: 'function', name: 'date_now', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 0) throw error('TypeError', `'date_now' expects 0 arguments, got ${args.length}.`, null, null)
        return jsToDateMap(new Date())
      }
    },

    date_format: {
      _type: 'function', name: 'date_format', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 1) throw error('TypeError', `'date_format' expects 1 argument, got ${args.length}.`, null, null)
        const d = dateMapToJs(args[0], 'date_format', error)
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      }
    },

    date_parse: {
      _type: 'function', name: 'date_parse', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 1) throw error('TypeError', `'date_parse' expects 1 argument, got ${args.length}.`, null, null)
        if (typeof args[0] !== 'string') throw error('TypeError', `'date_parse' expects text, got ${typeName(args[0])}.`, null, null)
        const d = new Date(args[0])
        if (isNaN(d.getTime())) throw error('ValueError', `Cannot parse "${args[0]}" as a date.`, null, null)
        return jsToDateMap(d)
      }
    },

    date_diff: {
      _type: 'function', name: 'date_diff', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 2) throw error('TypeError', `'date_diff' expects 2 arguments, got ${args.length}.`, null, null)
        const d1 = dateMapToJs(args[0], 'date_diff', error)
        const d2 = dateMapToJs(args[1], 'date_diff', error)
        return d1.getTime() - d2.getTime()
      }
    },

    date_add: {
      _type: 'function', name: 'date_add', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 3) throw error('TypeError', `'date_add' expects 3 arguments (date, amount, unit), got ${args.length}.`, null, null)
        const d = dateMapToJs(args[0], 'date_add', error)
        const amount = args[1]
        const unit = args[2]
        if (typeof amount !== 'number') throw error('TypeError', `'date_add' amount must be a number, got ${typeName(amount)}.`, null, null)
        if (typeof unit !== 'string') throw error('TypeError', `'date_add' unit must be text, got ${typeName(unit)}.`, null, null)

        const multipliers = { days: 86400000, hours: 3600000, minutes: 60000, seconds: 1000 }
        const mult = multipliers[unit]
        if (mult === undefined) {
          throw error('ValueError', `'date_add' unit must be "days", "hours", "minutes", or "seconds", got "${unit}".`, null, null)
        }
        return jsToDateMap(new Date(d.getTime() + amount * mult))
      }
    },
  }
}
