import { useState } from 'react'
import { useRunner } from './state/useRunner.js'
import Terminal from './components/Terminal.jsx'

const DEFAULT_PROGRAM = `note Welcome to nova!
remember name as "world"
show "Hello, {name}!"

count i from 1 to 15
  check if i % 15 == 0
    show "FizzBuzz"
  or if i % 3 == 0
    show "Fizz"
  or if i % 5 == 0
    show "Buzz"
  otherwise
    show i
  done
done

show "Done!"
`

export default function App() {
  const [source, setSource] = useState(DEFAULT_PROGRAM)
  const { status, output, error, elapsedMs, run, stop } = useRunner()

  const handleRun = () => {
    run({ 'main.nova': source }, 'main.nova')
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: 'var(--ink-900)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderBottom: '1px solid var(--rule)',
        fontFamily: "'Newsreader', serif",
        fontSize: '20px',
        fontWeight: 500,
        flexShrink: 0,
      }}>
        <span>nova</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleRun}
          disabled={status === 'running'}
          style={{
            padding: '4px 16px',
            borderRadius: '3px',
            border: 'none',
            backgroundColor: 'var(--run)',
            color: 'var(--ink-900)',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            cursor: status === 'running' ? 'default' : 'pointer',
            opacity: status === 'running' ? 0.5 : 1,
          }}
        >
          Run
        </button>
        <button
          onClick={stop}
          disabled={status !== 'running'}
          style={{
            padding: '4px 16px',
            borderRadius: '3px',
            border: 'none',
            backgroundColor: 'var(--halt)',
            color: 'var(--vellum)',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            cursor: status !== 'running' ? 'default' : 'pointer',
            opacity: status !== 'running' ? 0.5 : 1,
          }}
        >
          Stop
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          spellCheck={false}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: 'var(--ink-800)',
            color: 'var(--vellum)',
            border: 'none',
            borderRight: '1px solid var(--rule)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '14px',
            lineHeight: '1.65',
            resize: 'none',
            outline: 'none',
          }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Terminal output={output} status={status} elapsedMs={elapsedMs} />
        </div>
      </div>
    </div>
  )
}
