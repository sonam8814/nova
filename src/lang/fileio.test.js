import { describe, it, expect } from 'vitest'
import { run, createMemoryFS } from './testUtils.js'

describe('File I/O', () => {
  it('save writes text to a file', () => {
    const fs = createMemoryFS()
    const result = run(`
      save "hello world" to "notes.txt"
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(fs._store.get('notes.txt')).toBe('hello world')
  })

  it('read retrieves file contents', () => {
    const fs = createMemoryFS({ 'data.txt': 'some data' })
    const result = run(`
      remember contents as read "data.txt"
      show contents
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['some data'])
  })

  it('save then read round-trips correctly', () => {
    const fs = createMemoryFS()
    const result = run(`
      save "hello nova" to "out.txt"
      remember contents as read "out.txt"
      show contents
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['hello nova'])
  })

  it('read on a missing file raises FileError', () => {
    const fs = createMemoryFS()
    const result = run(`
      remember x as read "missing.txt"
    `, { fileSystem: fs })

    expect(result.error).not.toBe(null)
    const kind = result.error.kind || result.error.errorData?.kind
    expect(kind).toBe('FileError')
    const msg = result.error.message || result.error.errorData?.message
    expect(msg).toContain('missing.txt')
  })

  it('delete file removes a file', () => {
    const fs = createMemoryFS({ 'temp.txt': 'temporary' })
    const result = run(`
      delete file "temp.txt"
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(fs._store.has('temp.txt')).toBe(false)
  })

  it('files() returns a list of file names', () => {
    const fs = createMemoryFS({ 'a.txt': 'aaa', 'b.txt': 'bbb' })
    const result = run(`
      remember f as files()
      show f
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['["a.txt", "b.txt"]'])
  })

  it('files() returns empty list when no files exist', () => {
    const fs = createMemoryFS()
    const result = run(`
      show files()
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['[]'])
  })

  it('save, delete, then files() reflects the change', () => {
    const fs = createMemoryFS()
    const result = run(`
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

  it('save overwrites existing file contents', () => {
    const fs = createMemoryFS({ 'log.txt': 'old' })
    const result = run(`
      save "new" to "log.txt"
      show read "log.txt"
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['new'])
  })

  it('read with a non-text path raises TypeError', () => {
    const fs = createMemoryFS()
    const result = run(`
      remember x as read 42
    `, { fileSystem: fs })

    expect(result.error).not.toBe(null)
    const kind = result.error.kind || result.error.errorData?.kind
    expect(kind).toBe('TypeError')
  })

  it('save with a non-text content raises TypeError', () => {
    const fs = createMemoryFS()
    const result = run(`
      save 42 to "num.txt"
    `, { fileSystem: fs })

    expect(result.error).not.toBe(null)
    const kind = result.error.kind || result.error.errorData?.kind
    expect(kind).toBe('TypeError')
  })

  it('save with a non-text path raises TypeError', () => {
    const fs = createMemoryFS()
    const result = run(`
      save "content" to 123
    `, { fileSystem: fs })

    expect(result.error).not.toBe(null)
    const kind = result.error.kind || result.error.errorData?.kind
    expect(kind).toBe('TypeError')
  })

  it('delete file with a non-text path raises TypeError', () => {
    const fs = createMemoryFS()
    const result = run(`
      delete file 42
    `, { fileSystem: fs })

    expect(result.error).not.toBe(null)
    const kind = result.error.kind || result.error.errorData?.kind
    expect(kind).toBe('TypeError')
  })

  it('read without a file system raises FileError', () => {
    const result = run(`
      remember x as read "file.txt"
    `)

    expect(result.error).not.toBe(null)
    const kind = result.error.kind || result.error.errorData?.kind
    expect(kind).toBe('FileError')
  })

  it('file operations work with interpolated paths', () => {
    const fs = createMemoryFS()
    const result = run(`
      remember name as "log"
      save "data" to "{name}.txt"
      show read "{name}.txt"
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['data'])
  })

  it('file operations work inside functions', () => {
    const fs = createMemoryFS()
    const result = run(`
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

  it('file operations work from imported modules', () => {
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

    const result = run(`
      use "storage"
      store("config.txt", "key=value")
      show load("config.txt")
    `, { files, fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['key=value'])
  })

  it('multiple files can be saved and all listed', () => {
    const fs = createMemoryFS()
    const result = run(`
      save "a" to "file1.txt"
      save "b" to "file2.txt"
      save "c" to "file3.txt"
      remember all as files()
      show size of all
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['3'])
  })

  it('read can be used directly in show', () => {
    const fs = createMemoryFS({ 'msg.txt': 'direct read' })
    const result = run(`
      show read "msg.txt"
    `, { fileSystem: fs })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['direct read'])
  })
})
