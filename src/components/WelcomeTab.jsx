import { EXAMPLES } from '../state/examples.js'

const IS_MAC = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent)
const MOD = IS_MAC ? '⌘' : 'Ctrl+'
const SHIFT = IS_MAC ? '⇧' : 'Shift+'

const SHORTCUTS = [
  { keys: `${MOD}Enter`, label: 'Run program' },
  { keys: `${MOD}.`, label: 'Stop program' },
  { keys: `${MOD}P`, label: 'Go to file' },
  { keys: `${MOD}${SHIFT}P`, label: 'Command palette' },
  { keys: `${MOD}N`, label: 'New file' },
  { keys: `${MOD}W`, label: 'Close tab' },
  { keys: `${MOD}B`, label: 'Toggle breakpoint' },
  { keys: 'F5', label: 'Continue (debug)' },
  { keys: 'F10', label: 'Step over' },
  { keys: 'F11', label: 'Step in' },
]

const SYNTAX = [
  { keyword: 'remember x as 5', desc: 'Declare a variable' },
  { keyword: 'constant PI as 3.14', desc: 'Declare a constant' },
  { keyword: 'show "hello"', desc: 'Print to output' },
  { keyword: 'ask "name? "', desc: 'Read user input' },
  { keyword: 'check if / or if / otherwise', desc: 'Conditionals' },
  { keyword: 'count i from 1 to 10', desc: 'Counting loop' },
  { keyword: 'for each item in list', desc: 'Iterate a collection' },
  { keyword: 'define greet with name', desc: 'Declare a function' },
  { keyword: 'give back value', desc: 'Return from function' },
  { keyword: 'describe Dog from Animal', desc: 'Class with inheritance' },
  { keyword: 'attempt / rescue / always', desc: 'Error handling' },
  { keyword: 'use "helpers"', desc: 'Import a module' },
]

export default function WelcomeTab({ onLoadExample, onDismiss }) {
  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        backgroundColor: 'var(--ink-800)',
        padding: '40px 32px 60px',
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{
            fontFamily: "'Newsreader', serif",
            fontSize: '36px',
            fontWeight: 500,
            color: 'var(--vellum)',
            margin: 0,
            lineHeight: 1.2,
          }}>
            nova
          </h1>
          <p style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '15px',
            color: 'var(--vellum-mid)',
            marginTop: '8px',
            lineHeight: 1.5,
          }}>
            A programming language with plain-English keywords. Write code that reads like sentences, run it instantly in the browser.
          </p>
        </div>

        {/* Examples */}
        <Section title="Start with an example">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '10px',
          }}>
            {EXAMPLES.map((ex, i) => (
              <ExampleCard
                key={i}
                name={ex.name}
                description={ex.description}
                fileCount={Object.keys(ex.files).length}
                onClick={() => {
                  onLoadExample(ex.files)
                  onDismiss()
                }}
              />
            ))}
          </div>
        </Section>

        {/* Two-column: shortcuts + syntax */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginTop: '28px',
        }}>
          {/* Keyboard shortcuts */}
          <Section title="Keyboard shortcuts">
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '12px',
            }}>
              <tbody>
                {SHORTCUTS.map((s, i) => (
                  <tr key={i}>
                    <td style={{
                      padding: '3px 0',
                      color: 'var(--vellum-dim)',
                      whiteSpace: 'nowrap',
                      width: '1%',
                      paddingRight: '12px',
                    }}>
                      <kbd style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '11px',
                        backgroundColor: 'var(--ink-700)',
                        border: '1px solid var(--rule)',
                        borderRadius: '3px',
                        padding: '1px 5px',
                        color: 'var(--vellum-mid)',
                      }}>
                        {s.keys}
                      </kbd>
                    </td>
                    <td style={{
                      padding: '3px 0',
                      color: 'var(--vellum-mid)',
                    }}>
                      {s.label}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* Language reference */}
          <Section title="Language quick reference">
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '12px',
            }}>
              <tbody>
                {SYNTAX.map((s, i) => (
                  <tr key={i}>
                    <td style={{
                      padding: '3px 0',
                      verticalAlign: 'top',
                    }}>
                      <code style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '11px',
                        color: 'var(--sage)',
                      }}>
                        {s.keyword}
                      </code>
                      <div style={{
                        color: 'var(--vellum-dim)',
                        fontSize: '11px',
                        marginTop: '1px',
                      }}>
                        {s.desc}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>

        {/* Dismiss hint */}
        <p style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '12px',
          color: 'var(--vellum-dim)',
          marginTop: '32px',
          textAlign: 'center',
        }}>
          Start typing in the editor to dismiss this screen.
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '0' }}>
      <h2 style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--vellum)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '10px',
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function ExampleCard({ name, description, fileCount, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '12px 14px',
        backgroundColor: 'var(--ink-750)',
        border: '1px solid var(--rule)',
        borderRadius: '5px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.15s, background-color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--verdigris)'
        e.currentTarget.style.backgroundColor = 'var(--ink-700)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--rule)'
        e.currentTarget.style.backgroundColor = 'var(--ink-750)'
      }}
    >
      <span style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--vellum)',
      }}>
        {name}
      </span>
      <span style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '11px',
        color: 'var(--vellum-dim)',
        marginTop: '4px',
        lineHeight: 1.4,
      }}>
        {description}
      </span>
      {fileCount > 1 && (
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '10px',
          color: 'var(--vellum-dim)',
          backgroundColor: 'var(--ink-700)',
          borderRadius: '3px',
          padding: '1px 5px',
          marginTop: '6px',
        }}>
          {fileCount} files
        </span>
      )}
    </button>
  )
}
