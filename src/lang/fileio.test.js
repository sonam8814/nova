import { describe, it, expect } from 'vitest'
import { run, createMemoryFS } from './testUtils.js'

describe('File I/O', async () => {
  it('save writes text to a file', async () => {
    const fs = createMemoryFS()
    const result = await run(`
      save "hello world" to "notes.txt"
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(fs._store.get('notes.txt')).toBe('hello world')
  })

  it('read retrieves file contents', async () => {
    const fs = createMemoryFS({ 'data.txt': 'some data' })
    const result = await run(`
      remember contents as read "data.txt"
      show contents
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['some data'])
  })

  it('save then read round-trips correctly', async () => {
    const fs = createMemoryFS()
    const result = await run(`
      save "hello nova" to "out.txt"
      remember contents as read "out.txt"
      show contents
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['hello nova'])
  })

  it('read on a missing file raises FileError', async () => {
    const fs = createMemoryFS()
    const result = await run(`
      remember x as read "missing.txt"
    `, { fileSystem: fs })

    expect(result.error).not.toBe(null)
    const kind = result.error.kind || result.error.errorData?.kind
    expect(kind).toBe('FileError')
    const msg = result.error.message || result.error.errorData?.message
    expect(msg).toContain('missing.txt')
  })

  it('delete file removes a file', async () => {
    const fs = createMemoryFS({ 'temp.txt': 'temporary' })
    const result = await run(`
      delete file "temp.txt"
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(fs._store.has('temp.txt')).toBe(false)
  })

  it('files() returns a list of file names', async () => {
    const fs = createMemoryFS({ 'a.txt': 'aaa', 'b.txt': 'bbb' })
    const result = await run(`
      remember f as files()
      show f
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['["a.txt", "b.txt"]'])
  })

  it('files() returns empty list when no files exist', async () => {
    const fs = createMemoryFS()
    const result = await run(`
      show files()
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['[]'])
  })

  it('save, delete, then files() reflects the change', async () => {
    const fs = createMemoryFS()
    const result = await run(`
      save "one" to "a.txt"
      save "two" to "b.txt"
      show files()
      delete file "a.txt"
      show files()
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual([
      '["a.txt", "b.txt"]',
      '["b.txt"]',
    ])
  })

  it('save overwrites existing file contents', async () => {
    const fs = createMemoryFS({ 'log.txt': 'old' })
    const result = await run(`
      save "new" to "log.txt"
      show read "log.txt"
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['new'])
  })

  it('read with a non-text path raises TypeError', async () => {
    const fs = createMemoryFS()
    const result = await run(`
      remember x as read 42
    `, { fileSystem: fs })

    expect(result.error).not.toBe(null)
    const kind = result.error.kind || result.error.errorData?.kind
    expect(kind).toBe('TypeError')
  })

  it('save with a non-text content raises TypeError', async () => {
    const fs = createMemoryFS()
    const result = await run(`
      save 42 to "num.txt"
    `, { fileSystem: fs })

    expect(result.error).not.toBe(null)
    const kind = result.error.kind || result.error.errorData?.kind
    expect(kind).toBe('TypeError')
  })

  it('save with a non-text path raises TypeError', async () => {
    const fs = createMemoryFS()
    const result = await run(`
      save "content" to 123
    `, { fileSystem: fs })

    expect(result.error).not.toBe(null)
    const kind = result.error.kind || result.error.errorData?.kind
    expect(kind).toBe('TypeError')
  })

  it('delete file with a non-text path raises TypeError', async () => {
    const fs = createMemoryFS()
    const result = await run(`
      delete file 42
    `, { fileSystem: fs })

    expect(result.error).not.toBe(null)
    const kind = result.error.kind || result.error.errorData?.kind
    expect(kind).toBe('TypeError')
  })

  it('read without a file system raises FileError', async () => {
    const result = await run(`
      remember x as read "file.txt"
    `)

    expect(result.error).not.toBe(null)
    const kind = result.error.kind || result.error.errorData?.kind
    expect(kind).toBe('FileError')
  })

  it('file operations work with interpolated paths', async () => {
    const fs = createMemoryFS()
    const result = await run(`
      remember name as "log"
      save "data" to "{name}.txt"
      show read "{name}.txt"
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['data'])
  })

  it('file operations work inside functions', async () => {
    const fs = createMemoryFS()
    const result = await run(`
      define write_file with name, content
        save content to name
      done

      define read_file with name gives text
        give back read name
      done

      write_file("test.txt", "hello from fn")
      show read_file("test.txt")
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['hello from fn'])
  })

  it('file operations work from imported modules', async () => {
    const fs = createMemoryFS()
    const files = {
      'storage.nova': `
        define store with name, data
          save data to name
        done
        define load with name gives text
          give back read name
        done
      `,
    }

    const result = await run(`
      use "storage"
      store("config.txt", "key=value")
      show load("config.txt")
    `, { files, fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['key=value'])
  })

  it('multiple files can be saved and all listed', async () => {
    const fs = createMemoryFS()
    const result = await run(`
      save "a" to "file1.txt"
      save "b" to "file2.txt"
      save "c" to "file3.txt"
      remember all as files()
      show size of all
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['3'])
  })

  it('read can be used directly in show', async () => {
    const fs = createMemoryFS({ 'msg.txt': 'direct read' })
    const result = await run(`
      show read "msg.txt"
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['direct read'])
  })
})
