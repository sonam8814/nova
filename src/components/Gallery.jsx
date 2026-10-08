import { useState, useEffect, useCallback } from 'react'
import { EXAMPLES } from '../state/examples.js'

const SHOWCASE = [
  {
    name: 'Fibonacci Sequence',
    description: 'Generate Fibonacci numbers with a while loop',
    files: {
      'main.nova': `remember a as 0
remember b as 1
remember count as 20

show "First {count} Fibonacci numbers:"
remember i as 0
while i < count
  show a
  remember temp as a + b
  set a to b
  set b to temp
  set i to i + 1
done
`,
    },
  },
  {
    name: 'Todo List',
    description: 'OOP with a TodoList class and methods',
    files: {
      'main.nova': `describe Todo
  has title
  has completed

  define setup with title
    set my.title to title
    set my.completed to no
  done

  define toggle
    set my.completed to not my.completed
  done

  define display gives text
    remember status as "[x]"
    check if not my.completed
      set status to "[ ]"
    done
    give back "{status} {my.title}"
  done
done

describe TodoList
  has items

  define setup
    set my.items to []
  done

  define add with title
    remember todo as new Todo(title)
    append(my.items, todo)
    show "Added: {title}"
  done

  define complete with index
    remember todo as my.items[index]
    todo.toggle()
    show "Toggled: {todo.title}"
  done

  define show_all
    show "--- Todo List ---"
    count i from 0 to length(my.items) - 1
      show my.items[i].display()
    done
    show "---"
  done
done

remember list as new TodoList()
list.add("Learn Nova")
list.add("Build a project")
list.add("Share with friends")
list.complete(0)
list.show_all()
`,
    },
  },
  {
    name: 'Number Guessing Game',
    description: 'Interactive guessing game using ask',
    files: {
      'main.nova': `remember secret as floor(random() * 100) + 1
remember guesses as 0
remember found as no

show "I'm thinking of a number between 1 and 100!"

while not found
  remember guess as number(ask "Your guess: ")
  set guesses to guesses + 1
  check if guess == secret
    show "Correct! You got it in {guesses} guesses!"
    set found to yes
  or if guess < secret
    show "Too low! Try again."
  otherwise
    show "Too high! Try again."
  done
done
`,
    },
  },
  {
    name: 'Sorting Algorithms',
    description: 'Bubble sort implementation with lists',
    files: {
      'main.nova': `define bubble_sort with items
  remember n as length(items)
  remember swapped as yes
  while swapped
    set swapped to no
    count i from 0 to n - 2
      check if items[i] > items[i + 1]
        remember temp as items[i]
        set items[i] to items[i + 1]
        set items[i + 1] to temp
        set swapped to yes
      done
    done
    set n to n - 1
  done
  give back items
done

remember numbers as [64, 34, 25, 12, 22, 11, 90]
show "Before: {numbers}"
remember sorted as bubble_sort(numbers)
show "After:  {sorted}"
`,
    },
  },
]

const ALL_ITEMS = [...SHOWCASE, ...EXAMPLES]

export default function Gallery({ onLoad, onClose }) {
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  const handleLoad = useCallback((item) => {
    onLoad(item.files)
    onClose()
  }, [onLoad, onClose])

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 1000,
        overflowY: 'auto',
        padding: '48px 16px',
      }}
    >
      <div
        role="dialog"
        aria-label="Project Gallery"
        style={{
          backgroundColor: 'var(--ink-800)',
          border: '1px solid var(--rule)',
          borderRadius: '3px',
          padding: '24px',
          width: '800px',
          maxWidth: '100%',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}>
          <div style={{
            fontFamily: "'Newsreader', serif",
            fontSize: '20px',
            fontWeight: 500,
            color: 'var(--vellum)',
          }}>
            Project Gallery
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--rule)',
              borderRadius: '3px',
              padding: '4px 12px',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '12px',
              color: 'var(--vellum-dim)',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>

        <div style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '13px',
          color: 'var(--vellum-mid)',
          marginBottom: '20px',
        }}>
          Load an example project to explore Nova's features.
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '12px',
        }}>
          {ALL_ITEMS.map((item, i) => {
            const entryFile = Object.keys(item.files)[0]
            const code = item.files[entryFile] || ''
            const preview = code.split('\n').slice(0, 5).join('\n')
            const isHovered = hovered === i

            return (
              <div
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  backgroundColor: 'var(--ink-750)',
                  border: `1px solid ${isHovered ? 'var(--vellum-dim)' : 'var(--rule)'}`,
                  borderRadius: '3px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onClick={() => handleLoad(item)}
              >
                <div style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--vellum)',
                  marginBottom: '4px',
                }}>
                  {item.name}
                </div>
                <div style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '12px',
                  color: 'var(--vellum-mid)',
                  marginBottom: '10px',
                }}>
                  {item.description}
                </div>
                <pre style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '11px',
                  lineHeight: '16px',
                  color: 'var(--vellum-dim)',
                  backgroundColor: 'var(--ink-800)',
                  borderRadius: '2px',
                  padding: '8px',
                  margin: 0,
                  overflow: 'hidden',
                  whiteSpace: 'pre',
                  textOverflow: 'ellipsis',
                  maxHeight: '88px',
                }}>
                  {preview}
                </pre>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
