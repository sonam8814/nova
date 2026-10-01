import { describe, it, expect } from 'vitest'
import { runProgram } from './runner.worker.js'

async function collect(files, entry) {
  const messages = []
  await runProgram({ files, entry }, (msg) => messages.push(msg), null)
  return messages
}

describe('runner.worker — runProgram', () => {
  it('posts output messages for show statements', async () => {
    const msgs = await collect({ 'main.nova': 'show "hello"\nshow "world"' }, 'main.nova')
    const outputs = msgs.filter(m => m.type === 'output' && m.stream === 'out')
    expect(outputs.map(m => m.text)).toEqual(['hello', 'world'])
  })

  it('posts done with elapsed ms', async () => {
    const msgs = await collect({ 'main.nova': 'show 42' }, 'main.nova')
    const done = msgs.find(m => m.type === 'done')
    expect(done).toBeDefined()
    expect(typeof done.ms).toBe('number')
    expect(done.ms).toBeGreaterThanOrEqual(0)
  })

  it('posts error for runtime errors', async () => {
    const msgs = await collect({ 'main.nova': 'show x' }, 'main.nova')
    const err = msgs.find(m => m.type === 'error')
    expect(err).toBeDefined()
    expect(err.error.kind).toBe('NameError')
  })

  it('posts formatted error text on err stream', async () => {
    const msgs = await collect({ 'main.nova': 'show x' }, 'main.nova')
    const errOutput = msgs.find(m => m.type === 'output' && m.stream === 'err')
    expect(errOutput).toBeDefined()
    expect(errOutput.text).toContain('NameError')
  })

  it('posts done even after an error', async () => {
    const msgs = await collect({ 'main.nova': 'show x' }, 'main.nova')
    const doneMessages = msgs.filter(m => m.type === 'done')
    expect(doneMessages).toHaveLength(1)
  })

  it('handles multi-file projects via ModuleLoader', async () => {
    const files = {
      'main.nova': 'use "utils"\nshow double(5)',
      'utils.nova': 'define double with x\n  give back x * 2\ndone',
    }
    const msgs = await collect(files, 'main.nova')
    const outputs = msgs.filter(m => m.type === 'output' && m.stream === 'out')
    expect(outputs.map(m => m.text)).toEqual(['10'])
  })

  it('handles file I/O operations', async () => {
    const files = {
      'main.nova': 'save "data" to "out.txt"\nshow read "out.txt"',
    }
    const msgs = await collect(files, 'main.nova')
    const outputs = msgs.filter(m => m.type === 'output' && m.stream === 'out')
    expect(outputs.map(m => m.text)).toEqual(['data'])
  })

  it('posts error for missing entry file', async () => {
    const msgs = await collect({}, 'main.nova')
    const err = msgs.find(m => m.type === 'error')
    expect(err).toBeDefined()
    expect(err.error.kind).toBe('FileError')
  })

  it('handles arithmetic and expressions', async () => {
    const files = {
      'main.nova': 'remember x as 10\nset x to x + 5\nshow x',
    }
    const msgs = await collect(files, 'main.nova')
    const outputs = msgs.filter(m => m.type === 'output' && m.stream === 'out')
    expect(outputs.map(m => m.text)).toEqual(['15'])
  })

  it('handles classes and OOP', async () => {
    const files = {
      'main.nova': `
        describe Dog
          has name
          define setup with n
            set my.name to n
          done
          define speak
            give back my.name + " barks"
          done
        done
        remember d as new Dog("Rex")
        show d.speak()
      `,
    }
    const msgs = await collect(files, 'main.nova')
    const outputs = msgs.filter(m => m.type === 'output' && m.stream === 'out')
    expect(outputs.map(m => m.text)).toEqual(['Rex barks'])
  })

  it('formatted error includes caret and source line', async () => {
    const source = 'remember x as 5\nshow y'
    const msgs = await collect({ 'main.nova': source }, 'main.nova')
    const errOutput = msgs.find(m => m.type === 'output' && m.stream === 'err')
    expect(errOutput.text).toContain('show y')
    expect(errOutput.text).toContain('^')
  })

  it('supports ask via waitForInput callback', async () => {
    const inputs = ['Alice']
    const messages = []
    await runProgram(
      { files: { 'main.nova': 'remember name as ask "What is your name?"\nshow "Hello, {name}!"' }, entry: 'main.nova' },
      (msg) => messages.push(msg),
      async () => inputs.shift()
    )
    const outputs = messages.filter(m => m.type === 'output' && m.stream === 'out')
    expect(outputs.map(m => m.text)).toEqual(['What is your name?', 'Hello, Alice!'])
    const needInput = messages.filter(m => m.type === 'needInput')
    expect(needInput).toHaveLength(1)
  })
})
