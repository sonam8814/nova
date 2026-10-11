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

## Language features

- **Plain-English syntax** — `remember`, `check if`, `define`, `describe`, `give back`
- **Optional type hints** — `remember number x as 5`, `define f with n gives number`; mismatches are caught at runtime and flagged by the static checker in the editor
- **Full OOP** — classes, single inheritance, `my`/`parent`, constructors
- **First-class functions** — closures, anonymous actions, higher-order functions
- **Tail-call optimization** — deep tail recursion runs without growing the stack
- **Error handling** — `attempt`/`rescue`/`always` with structured error objects
- **Multi-file projects** — `use` imports with namespace support and cycle detection
- **File I/O** — `save`, `read`, and `delete` against the project's virtual files
- **Standard library** — lists, maps, and text methods plus math, date, random, and conversion helpers (see below)
- **Friendly errors** — parser error recovery reports several problems at once instead of stopping at the first

### Standard library highlights

| Area | Functions |
| --- | --- |
| Math | `abs`, `ceil`, `floor`, `round`, `sqrt`, `power`, `min`, `max`, `random`, `random_between` |
| Date | `date_now`, `date_parse`, `date_format`, `date_add`, `date_diff` |
| Random | `random_chance`, `random_id`, `random_pick`, `random_sample`, `random_shuffle` |
| Convert | `to_number`, `to_text`, `to_truth`, `to_list`, `to_map`, `to_json`, `from_json`, `char_from`, `type_of` |
| Lists | `add`, `pop`, `remove`, `slice`, `reverse`, `sort`, `join`, `index_of`, `map`, `filter`, `reduce`, `find`, `has` |
| Maps | `keys`, `values`, `has`, `remove` |
| Text | `upper`, `lower`, `trim`, `split`, `slice`, `replace`, `index_of` |

## IDE features

- **Monaco editor** — syntax highlighting, autocomplete, hover docs, live diagnostics (in a background worker)
- **Step debugger** — breakpoints, step in/over/out, variable inspection, call stack
- **Output and console** — line numbers, elapsed timestamps, word-wrap toggle, run counter, and an interactive console for evaluating expressions
- **Project tools** — file tree, draggable tabs, dirty-file indicators, file switcher, and find-in-project
- **Command palette** — every action in one searchable list
- **Light and dark themes** with a responsive layout
- **Example gallery** — ready-made programs to open and run
- **Autosave** — projects persist in the browser (IndexedDB)

### Sharing and export

- **Share via URL** — the entire project is compressed into the link's hash (`#code/...`)
- **Embed mode** — add `?embed=1` to the URL for a minimal runnable view you can put in an `<iframe>`
- **Export as HTML** — a standalone page containing your project
- **JSON export/import** — move projects between browsers
- **GitHub Gist** — export copies your project as Markdown and opens gist.github.com to paste into; import loads files from a public gist URL

### Offline / PWA

Nova is installable as a Progressive Web App and keeps working offline once the
app has been loaded.

## Keyboard shortcuts

Use `Cmd` on macOS, `Ctrl` elsewhere.

| Shortcut | Action |
| --- | --- |
| `Cmd+Enter` | Run program |
| `Cmd+.` | Stop program |
| `Cmd+S` | Save |
| `Cmd+N` | New file |
| `Cmd+W` | Close tab |
| `Cmd+P` | Go to file |
| `Cmd+Shift+P` | Command palette |
| `Cmd+Shift+F` | Find in project |
| `Cmd+B` | Toggle breakpoint |
| `F10` | Step over |
| `F11` | Step in |
| `Shift+F11` | Step out |

## Run locally

```bash
git clone https://github.com/sonam8814/nova.git
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

## Known limits

- Maximum recursion depth is 1000 calls (see [DECISIONS.md](DECISIONS.md))
- Programs stop after 50,000,000 interpreter steps, which guards against infinite loops
- Single inheritance only
- The interpreter is a tree-walker, so it is built for learning and small projects rather than heavy computation

## Project layout

```
src/lang/      lexer, parser, resolver/type checker, interpreter, stdlib
src/worker/    runner, console, and lint web workers
src/editor/    Monaco language support (tokens, completion, hover, diagnostics)
src/components UI components
src/state/     hooks, storage, sharing, export, examples
public/        PWA manifest, service worker, icons
```

## Tech stack

React, Vite, Monaco Editor, Tailwind CSS v4, idb-keyval, lz-string.
No backend. No TypeScript. No component libraries.

## License

MIT — see [LICENSE](LICENSE).
