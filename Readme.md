# nova

A browser-based programming language and IDE with plain-English keywords,
symbolic operators, optional type hints, full OOP, and an editor good enough
to solve DSA problems and build real multi-file projects in.

Everything runs 100% client-side — no backend, no accounts, no API keys.

## Code sample

```nova
describe Stack
  has items as []

  define setup
    set my.items to []
  done

  define push with value
    my.items.add(value)
  done

  define pop
    check if size of my.items == 0
      raise "Stack is empty"
    done
    give back my.items.pop()
  done

  define peek
    give back my.items[size of my.items - 1]
  done
done

remember s as new Stack()
s.push(10)
s.push(20)
show s.pop()
show s.peek()
```

## Features

- **Plain-English syntax** — `remember`, `check if`, `define`, `describe`, `give back`
- **Full OOP** — classes, single inheritance, `my`/`parent`, constructors
- **First-class functions** — closures, anonymous actions, higher-order functions
- **Error handling** — `attempt`/`rescue`/`always` with structured error objects
- **Multi-file projects** — `use` imports with namespace support and cycle detection
- **Step debugger** — breakpoints, step in/over/out, variable inspection, call stack
- **Monaco editor** — syntax highlighting, autocomplete, hover docs, live diagnostics
- **Share via URL** — entire projects compressed into a shareable link
- **Keyboard-driven** — Cmd+Enter run, Cmd+P file switcher, F10/F11 stepping

## Run locally

```bash
git clone https://github.com/<your-username>/nova.git
cd nova
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Run tests

```bash
npm run test:run
```

## Build for production

```bash
npm run build
npm run preview
```

## Tech stack

React, Vite, Monaco Editor, Tailwind CSS v4, idb-keyval, lz-string.
No backend. No TypeScript. No component libraries.

## License

MIT
