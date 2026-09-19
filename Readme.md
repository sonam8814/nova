# Nova — Production Specification

A browser-based programming language and IDE. Plain-English keywords, symbolic
operators, optional type hints, full OOP, and an editor good enough to solve DSA
problems and build real multi-file projects in.

---

## 0. How to use this document

**This file is the single source of truth. Read it fully before writing code.**

Rules for whoever builds this (human or agent):

1. **Build phases in order.** Each phase has an acceptance test. Do not start
   phase N+1 until phase N's acceptance test passes.
2. **Do not invent syntax.** Section 3 is the complete language. If something is
   ambiguous, pick the reading that is easiest to parse with recursive descent,
   then write it down in a `DECISIONS.md` file at the repo root.
3. **Do not skip the test files.** Every phase ships with tests. The interpreter
   is the kind of software where a silent bug in phase 2 wastes six hours in
   phase 9.
4. **Keep the interpreter free of React.** Nothing in `src/lang/` may import
   React, Monaco, or touch the DOM. It must be runnable from plain Node so it
   can be unit tested. This is non-negotiable and it is the single most
   important architectural rule in this document.
5. **Commit at the end of every phase** with the message `phase N: <name>`.

---

## 1. Project overview

| | |
|---|---|
| Product | nova — a language + web IDE |
| Runs | 100% client-side in the browser. No backend, ever. |
| Target machine | MacBook Air M1, Node 20+ |
| Cost | Zero. Every dependency is free and open source. |
| Deploy | Vercel (primary), GitHub Pages (fallback) |

**What "done" looks like:** a user opens the site, sees a dark editor with
example programs in a sidebar, writes a multi-file program in nova, hits Run,
watches output stream into a terminal panel, sets a breakpoint, steps through
line by line watching variables change, then shares the whole project as a URL.

---

## 2. Constraints

- **No backend.** No server, no database, no API keys. Files live in IndexedDB.
- **No eval / new Function.** The interpreter walks the AST itself. Compiling
  nova to JavaScript is explicitly forbidden — the point of this project is the
  tree-walking interpreter.
- **Execution happens in a Web Worker.** The UI thread must never freeze, even
  on an infinite loop.
- **Plain JavaScript, not TypeScript.** `.js` and `.jsx`. Use JSDoc comments for
  type documentation where it helps.
- **No CSS framework beyond Tailwind v4.** No component libraries, no shadcn, no
  Material. The design in section 5 is hand-built.
- **Every error must report line and column.** No exceptions. A language that
  says "unexpected token" without a location is a language nobody will use.

### Dependency allowlist

```
react, react-dom
vite, @vitejs/plugin-react
tailwindcss, @tailwindcss/vite
@monaco-editor/react, monaco-editor
idb-keyval            (IndexedDB wrapper, ~600 bytes)
lz-string             (URL compression for share links)
vitest                (unit tests)
```

Nothing else without a written justification in `DECISIONS.md`.

---

## 3. The nova language

### 3.1 Files and naming

- Extension: `.nova`
- Entry point: `main.nova`
- Identifiers: letters, digits, underscore. Cannot start with a digit.
  Convention is `snake_case` for variables and functions, `PascalCase` for
  classes, `SCREAMING_SNAKE` for constants. Convention only — not enforced.
- **The language name appears in exactly one place:** `src/lang/config.js`
  exports `LANG_NAME` and `FILE_EXT`. To rename the language, change those two
  strings.

### 3.2 Comments

```nova
note this is a comment and runs to end of line
# this is also a comment
```

`note` is canonical. `#` is the shorthand. There are no block comments — use
consecutive lines.

### 3.3 Values and literals

| Type | Literal | Notes |
|---|---|---|
| number | `42`, `3.14`, `-7`, `1e6` | One numeric type, IEEE 754 double |
| text | `"hello"`, `"line\nbreak"` | Double quotes only |
| truth | `yes`, `no` | Not `true`/`false` |
| nothing | `nothing` | The absence of a value |
| list | `[1, 2, 3]`, `[]` | Ordered, mutable, heterogeneous |
| map | `{"a": 1}`, `{}` | String or number keys, insertion-ordered |
| action | `action with x ... done` | A function value |
| object | `new Dog("Rex")` | Instance of a class |

**Escape sequences in text:** `\n` `\t` `\\` `\"` `\{`

**String interpolation:** `{expression}` inside a text literal is evaluated and
converted to text.

```nova
remember name as "Aditya"
show "Hello, {name}! You have {2 + 3} messages."
note prints: Hello, Aditya! You have 5 messages.
```

### 3.4 Variables

```nova
remember count as 0                 note declare
remember number count as 0          note declare with type hint
constant MAX as 100                 note declare, cannot be reassigned

set count to count + 1              note reassign
set nums[0] to 9                    note reassign a list slot
set ages["bob"] to 31               note reassign a map key
set my.name to "Rex"                note reassign a field
```

- `remember` declares in the current scope. Re-declaring the same name in the
  same scope is an error.
- `set` reassigns an existing binding. Setting an undeclared name is an error.
  This catches typos, which is the whole reason the two keywords are separate.
- `constant` declares an immutable binding. `set` on it is an error.

### 3.5 Operators

| Category | Operators | Assoc |
|---|---|---|
| Arithmetic | `+` `-` `*` `/` `%` `^` | left, `^` right |
| Comparison | `<` `>` `<=` `>=` | left |
| Equality | `==` `!=` and word aliases `is` / `is not` | left |
| Logic | `and` `or` `not` | left, `not` unary |
| Unary | `-` `not` `size of` | right |
| Access | `.` `[]` `()` | left |

**Precedence, lowest binding to highest:**

```
1.  or
2.  and
3.  == != is "is not"
4.  < > <= >=
5.  + -
6.  * / %
7.  ^                       (right associative)
8.  unary  - not "size of"
9.  call/index/property  ()  []  .
10. primary  literals, identifiers, ( ), new, action, [ ], { }
```

Notes:
- `+` on two texts concatenates. `+` on text and number coerces the number to
  text. `+` on anything else with a text is an error with a clear message.
- `/` on two numbers always produces a float. Integer division is the builtin
  `floor(a / b)`.
- `and` and `or` short-circuit and return the deciding operand, not a truth
  value. `remember x as a or 10` gives a default-value idiom.
- Only `no`, `nothing`, `0`, and `""` are falsy. Empty list and empty map are
  truthy.
- `==` compares numbers, texts, truths and nothing by value; lists, maps and
  objects by identity. Use the builtin `same(a, b)` for deep equality.

### 3.6 Conditionals

```nova
check if score >= 90
  show "A"
or if score >= 80
  show "B"
or if score >= 70
  show "C"
otherwise
  show "F"
done
```

`or if` may repeat any number of times. `otherwise` is optional. `done` closes
the whole chain — there is exactly one `done` per `check if`.

### 3.7 Loops

```nova
repeat 5 times                      note simple counted loop
  show "hi"
done

repeat 5 times as i                 note i goes 0,1,2,3,4
  show i
done

count i from 1 to 10                note inclusive both ends
  show i
done

count i from 10 down to 1
  show i
done

count i from 0 to 100 by 5
  show i
done

for each item in nums               note lists, texts, maps (yields keys)
  show item
done

for each key to value in ages       note maps only
  show "{key} is {value}"
done

while low <= high
  set low to low + 1
done

keep going                          note infinite; exit with stop
  set n to n - 1
  check if n == 0
    stop
  done
done
```

- `skip` — jump to the next iteration (continue).
- `stop` — exit the innermost loop (break).
- Both are errors outside a loop, reported at parse time.

### 3.8 Functions

```nova
define greet
  show "hello"
done

define add with a, b
  give back a + b
done

define add with number a, number b gives number
  give back a + b
done

define greet with name, greeting as "Hello"      note default parameter
  show "{greeting}, {name}"
done

show add(2, 3)
greet("Aditya")
```

- `give back` returns. A function with no `give back` returns `nothing`.
- Parameters with defaults must come after parameters without.
- Functions are first-class values. `remember f as add` then `f(1, 2)`.
- Functions are hoisted within their scope, so mutual recursion works without
  forward declaration.

**Anonymous functions (actions):**

```nova
remember double as action with x
  give back x * 2
done

show nums.map(double)
show nums.map(action with x
  give back x * x
done)
```

Actions capture their enclosing scope (proper closures).

**Recursion:** supported, with a configurable depth limit (default 10000) that
raises a catchable `DepthError` rather than blowing the JS stack.

### 3.9 Lists

```nova
remember nums as [5, 3, 8, 1]

show nums[0]              note 5
show nums[-1]             note 1, negative indexes count from the end
show size of nums         note 4

set nums[0] to 99
nums.add(10)              note append
nums.insert(0, 7)         note insert at index
nums.remove(2)            note remove by index, returns the removed value
nums.pop()                note remove and return last

show nums.index_of(8)     note -1 if absent
show nums.has(8)
show nums.slice(1, 3)     note [start, end) — new list
show nums.join(", ")
show nums.reverse()       note returns a new list
show nums.sort()          note new list, ascending, numbers or texts
show nums.sort_by(action with a
  give back -a
done)
show nums.copy()

show nums.map(f)
show nums.filter(f)
show nums.reduce(f, start)
show nums.sum()
show nums.min()
show nums.max()
show nums.all(f)
show nums.any(f)
```

All methods that return a collection return a **new** list. Only `add`,
`insert`, `remove`, `pop` and index assignment mutate.

### 3.10 Maps

```nova
remember ages as {"aditya": 21, "riya": 23}

show ages["aditya"]
set ages["neel"] to 19
show ages.has("riya")
show ages.keys()          note list
show ages.values()        note list
show ages.entries()       note list of [key, value] lists
ages.remove("riya")
show size of ages

for each name to age in ages
  show "{name} -> {age}"
done
```

Reading a missing key returns `nothing` — it does not raise. Use `.has()` when
you need to distinguish "missing" from "present but nothing".

### 3.11 Text

```nova
remember s as "Hello World"

show size of s
show s[0]                 note "H"
show s.upper()
show s.lower()
show s.trim()
show s.split(" ")         note list of texts
show s.has("World")
show s.starts_with("He")
show s.ends_with("ld")
show s.replace("World", "nova")
show s.slice(0, 5)
show s.index_of("World")
show s.repeat(3)
show s.chars()            note list of single-character texts
show s.code_at(0)         note 72
```

Text is immutable. `set s[0] to "J"` is an error.

### 3.12 Classes

```nova
describe Animal
  has name
  has number age
  has legs as 4                     note field with a default

  define setup with name, age       note constructor, called by new
    set my.name to name
    set my.age to age
  done

  define speak
    show "{my.name} makes a sound"
  done

  define describe_self gives text
    give back "{my.name}, age {my.age}"
  done
done

describe Dog from Animal
  define setup with name, age, breed
    parent.setup(name, age)
    set my.breed to breed
  done

  define speak                      note overrides Animal.speak
    show "{my.name} barks"
  done
done

remember d as new Dog("Rex", 3, "Lab")
d.speak()
show d.describe_self()
show d.legs
show d is a Dog                     note yes
show d is a Animal                  note yes — inheritance aware
```

- `my` refers to the current instance. It is only valid inside a method.
- `parent` calls the superclass version. `parent.setup(...)` inside `setup`,
  `parent.speak()` inside `speak`.
- Single inheritance only. No interfaces, no mixins, no multiple inheritance.
- `has` declares a field. Fields not listed with `has` can still be set, but the
  linter warns.
- Methods are looked up dynamically along the prototype chain at call time.
- `is a` is a binary operator returning a truth.

### 3.13 Errors

```nova
attempt
  remember n as to_number(user_input)
  check if n < 0
    raise "negative numbers are not allowed"
  done
rescue e
  show "Problem: {e.message}"
  show "Kind: {e.kind}"
always
  show "finished"
done
```

- `rescue e` binds the error to `e` for the rescue block only. The binding name
  is required.
- `always` is optional and runs whether or not an error occurred.
- `raise <expression>` throws. If the expression is text, it becomes a
  `UserError` with that message.
- The error object has `.message`, `.kind`, `.line`, `.column`.

**Built-in error kinds:** `NameError`, `TypeError`, `IndexError`, `KeyError`,
`MathError`, `DepthError`, `FileError`, `UserError`.

Every uncaught error prints to the terminal in this shape:

```
TypeError at main.nova line 12, column 9

    show "total: " + nums
                   ^
Cannot add text and list.
Hint: convert the list first with nums.join(", ")
```

The caret column, the source line echo, and the `Hint:` line are all required.
Write the hint text as part of building each error site — do not leave it for
later.

### 3.14 Type hints

Type hints are **optional everywhere**. When present they are checked at
runtime, at the moment of assignment or call.

```nova
remember number x as 5
remember text name as "Aditya"
remember list nums as [1, 2, 3]

define add with number a, number b gives number
  give back a + b
done

describe Point
  has number x
  has number y
done
```

Type names: `number`, `text`, `truth`, `list`, `map`, `action`, `nothing`,
`anything`, plus any class name.

A violated hint raises a `TypeError` with the declared type, the received type,
and the location. `anything` disables checking for that binding.

### 3.15 Modules

```nova
note in main.nova
use "helpers"
use "algorithms/sorting" as sorting

show double(21)
show sorting.quicksort([3, 1, 2])
```

- `use "x"` resolves to `x.nova` relative to the project root and merges its
  top-level names into the current file's scope.
- `use "x" as name` binds a namespace object instead. Preferred — no collisions.
- Every top-level `define`, `describe`, `remember` and `constant` is exported.
  There is no `private`.
- Circular imports are detected and raise a clear error naming the cycle.
- Each module executes once; the result is cached.

### 3.16 Files and input

```nova
save "hello world" to "notes.txt"
remember contents as read "notes.txt"
delete file "notes.txt"
show files()                    note list of file names

remember line as ask "Enter your name: "
remember n as to_number(ask "How many? ")
```

- Files are stored in IndexedDB, scoped to the project. They persist across
  reloads and show up in the file tree under a `data/` folder.
- `read` on a missing file raises `FileError`.
- `ask` reads one line from the input panel. If the panel is empty, execution
  pauses until the user types and presses Enter.

### 3.17 Keyword reference

| Keyword | Meaning |
|---|---|
| `remember` | declare a variable |
| `constant` | declare an immutable variable |
| `set` / `to` | reassign |
| `as` | binds a value or a name in declarations and loops |
| `show` | print to terminal |
| `ask` | read a line of input |
| `note` | comment |
| `check if` / `or if` / `otherwise` | conditional |
| `while` | conditional loop |
| `repeat` / `times` | counted loop |
| `count` / `from` / `to` / `down` / `by` | range loop |
| `for each` / `in` | iteration |
| `keep going` | infinite loop |
| `skip` | continue |
| `stop` | break |
| `define` / `with` / `gives` | function declaration |
| `give back` | return |
| `action` | anonymous function |
| `describe` / `from` | class declaration / inheritance |
| `has` | field declaration |
| `my` | current instance |
| `parent` | superclass |
| `new` | instantiate |
| `is a` | instance check |
| `attempt` / `rescue` / `always` | error handling |
| `raise` | throw |
| `use` | import module |
| `save` / `read` / `delete file` | file I/O |
| `done` | closes every block |
| `and` `or` `not` `is` | operators |
| `yes` `no` `nothing` | literals |
| `size of` | length operator |
| `number` `text` `truth` `list` `map` `action` `anything` | type names |

### 3.18 Global builtins

```
show(x)  ask(prompt)  files()
to_number(x)  to_text(x)  to_truth(x)  type_of(x)  same(a, b)
abs(n)  min(a, b, ...)  max(a, b, ...)  floor(n)  ceil(n)  round(n, places)
sqrt(n)  power(base, exp)  random()  random_between(lo, hi)
range(start, end, step)        note returns a list
sleep(ms)                      note yields to the worker, does not block UI
time_now()                     note milliseconds since epoch
```

### 3.19 Reserved words

All keywords in 3.17, all builtin names in 3.18, and all type names are
reserved. Using one as an identifier is a parse error that says which word was
taken and suggests an alternative.

### 3.20 Grammar (EBNF)

```ebnf
program        = { statement } ;

statement      = declaration | assignment | show | ask_stmt | conditional
               | loop | function_decl | class_decl | return_stmt
               | attempt | raise | use | file_stmt | expr_stmt
               | "skip" | "stop" ;

declaration    = ( "remember" | "constant" ) [ type ] IDENT "as" expression ;
assignment     = "set" target "to" expression ;
target         = IDENT { "." IDENT | "[" expression "]" }
               | "my" "." IDENT ;

show           = "show" expression { "," expression } ;
ask_stmt       = "ask" expression ;

conditional    = "check" "if" expression block
                 { "or" "if" expression block }
                 [ "otherwise" block ] "done" ;

loop           = while | repeat | count | foreach | forever ;
while          = "while" expression block "done" ;
repeat         = "repeat" expression "times" [ "as" IDENT ] block "done" ;
count          = "count" IDENT "from" expression [ "down" ] "to" expression
                 [ "by" expression ] block "done" ;
foreach        = "for" "each" IDENT [ "to" IDENT ] "in" expression block "done" ;
forever        = "keep" "going" block "done" ;

function_decl  = "define" IDENT [ "with" params ] [ "gives" type ] block "done" ;
params         = param { "," param } ;
param          = [ type ] IDENT [ "as" expression ] ;
return_stmt    = "give" "back" [ expression ] ;

class_decl     = "describe" IDENT [ "from" IDENT ]
                 { field | function_decl } "done" ;
field          = "has" [ type ] IDENT [ "as" expression ] ;

attempt        = "attempt" block "rescue" IDENT block
                 [ "always" block ] "done" ;
raise          = "raise" expression ;

use            = "use" STRING [ "as" IDENT ] ;
file_stmt      = "save" expression "to" expression
               | "delete" "file" expression ;

block          = { statement } ;

expression     = or_expr ;
or_expr        = and_expr { "or" and_expr } ;
and_expr       = equality { "and" equality } ;
equality       = comparison { ( "==" | "!=" | "is" | "is" "not" | "is" "a" ) comparison } ;
comparison     = term { ( "<" | ">" | "<=" | ">=" ) term } ;
term           = factor { ( "+" | "-" ) factor } ;
factor         = power { ( "*" | "/" | "%" ) power } ;
power          = unary [ "^" power ] ;
unary          = ( "-" | "not" | "size" "of" ) unary | postfix ;
postfix        = primary { "(" [ args ] ")" | "[" expression "]" | "." IDENT } ;
primary        = NUMBER | STRING | "yes" | "no" | "nothing" | IDENT | "my"
               | "parent" | "(" expression ")" | list_lit | map_lit
               | action_lit | new_expr | read_expr | ask_expr ;

list_lit       = "[" [ expression { "," expression } [ "," ] ] "]" ;
map_lit        = "{" [ pair { "," pair } [ "," ] ] "}" ;
pair           = expression ":" expression ;
action_lit     = "action" [ "with" params ] block "done" ;
new_expr       = "new" IDENT "(" [ args ] ")" ;
read_expr      = "read" expression ;
ask_expr       = "ask" expression ;
type           = "number" | "text" | "truth" | "list" | "map" | "action"
               | "nothing" | "anything" | IDENT ;
```

**Newlines are insignificant.** The lexer emits no NEWLINE token. Statement
boundaries are determined entirely by the grammar, which is unambiguous because
every statement begins with a distinguishing keyword or an identifier in a
position where an expression cannot continue.

---

## 4. Architecture

### 4.1 Pipeline

```
source text
   │
   ▼  Lexer          src/lang/lexer.js
tokens[]  ──────────────────────────────── each has line, column, start, end
   │
   ▼  Parser         src/lang/parser.js
AST                ──────────────────────── each node carries a loc
   │
   ▼  Resolver       src/lang/resolver.js   (phase 11)
AST + scope depths ──────────────────────── catches undeclared names early
   │
   ▼  Interpreter    src/lang/interpreter.js
side effects  ─────────────────────────────  output events, file writes
```

The interpreter runs inside a Web Worker. It communicates with the UI by posting
messages:

```js
// worker -> ui
{ type: 'output', text, stream: 'out' | 'err' }
{ type: 'error',  error: SerializednovaError }
{ type: 'done',   ms }
{ type: 'paused', line, file, scopes, callStack }   // debugger
{ type: 'needInput', prompt }

// ui -> worker
{ type: 'run',   files, entry, breakpoints }
{ type: 'stop' }
{ type: 'input', text }
{ type: 'step',  mode: 'in' | 'over' | 'out' | 'continue' }
```

### 4.2 Repo layout

```
nova/
├── prod.md                       this file
├── DECISIONS.md                  log every deviation from this spec
├── index.html
├── vite.config.js
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── index.css                 tailwind import + font faces + CSS vars
    ├── App.jsx
    │
    ├── lang/                     ZERO React, ZERO DOM, ZERO Monaco
    │   ├── config.js             LANG_NAME, FILE_EXT, limits
    │   ├── tokens.js             TokenType enum, KEYWORDS map
    │   ├── lexer.js
    │   ├── ast.js                node constructors + NodeType enum
    │   ├── parser.js
    │   ├── resolver.js
    │   ├── environment.js        scope chain
    │   ├── values.js             novaList, novaMap, novaFunction,
    │   │                         novaClass, novaInstance, novaError
    │   ├── interpreter.js
    │   ├── stdlib/
    │   │   ├── globals.js
    │   │   ├── list.js
    │   │   ├── map.js
    │   │   ├── text.js
    │   │   └── math.js
    │   ├── errors.js             novaError + formatError(source, err)
    │   └── modules.js            use/import resolution
    │
    ├── worker/
    │   └── runner.worker.js      hosts the interpreter
    │
    ├── editor/
    │   ├── monarch.js            Monaco tokenizer for nova
    │   ├── theme.js              Nightleaf Monaco theme
    │   ├── completion.js         autocomplete provider
    │   ├── hover.js              hover docs provider
    │   └── diagnostics.js        parse-on-idle -> Monaco markers
    │
    ├── state/
    │   ├── useProject.js         files, active tab, dirty state
    │   ├── useRunner.js          worker lifecycle, output buffer
    │   └── storage.js            IndexedDB via idb-keyval
    │
    ├── components/
    │   ├── Shell.jsx             overall layout
    │   ├── TitleBar.jsx
    │   ├── FileTree.jsx
    │   ├── TabBar.jsx
    │   ├── CodeEditor.jsx        Monaco wrapper
    │   ├── Terminal.jsx
    │   ├── InputPanel.jsx
    │   ├── DebugPanel.jsx        call stack + variables
    │   ├── ExampleLibrary.jsx
    │   └── ShareDialog.jsx
    │
    └── examples/
        ├── index.js              registry
        ├── hello.nova
        ├── fizzbuzz.nova
        ├── binary_search.nova
        ├── linked_list.nova
        ├── sorting.nova
        ├── bank_oop.nova
        └── todo_app.nova
```

### 4.3 Data contracts

**Token**

```js
{
  type: 'NUMBER',      // from TokenType
  value: 42,           // cooked value for literals, raw text otherwise
  lexeme: '42',        // exact source text
  line: 3,             // 1-based
  column: 12,          // 1-based
  start: 47,           // absolute offset, for Monaco
  end: 49
}
```

**AST node** — every node is `{ type, ...fields, loc }` where
`loc = { line, column, start, end }`. Never omit `loc`. The debugger and the
error formatter both depend on it.

**novaError**

```js
{
  kind: 'TypeError',
  message: 'Cannot add text and list.',
  hint: 'Convert the list first with nums.join(", ")',
  file: 'main.nova',
  line: 12,
  column: 9,
  stack: [{ name: 'add', file: 'main.nova', line: 4 }]
}
```

---

## 5. Design system — "Nightleaf"

### Concept

Not a hacker terminal. The look is drawn from illuminated manuscripts: scribes
wrote body text in iron-gall ink on vellum and marked significant words in
vermilion, with gold leaf for initials and lapis and verdigris for pigment. That
is precisely what syntax highlighting does, so the palette comes from a
pigment box rather than from a CRT.

The screen is deep ink, the text is warm vellum rather than white, and every
syntax color is a real historical pigment. Nothing glows. No neon.

### Color tokens

Declare these as CSS custom properties in `src/index.css`.

```css
:root {
  /* surfaces — cool blue-black ink, layered */
  --ink-900:    #101219;   /* app background */
  --ink-800:    #161923;   /* editor surface */
  --ink-750:    #1B1F2B;   /* panels: terminal, sidebar */
  --ink-700:    #222633;   /* raised: active tab, hover */
  --rule:       #2C3140;   /* hairline borders */
  --rule-soft:  #232735;   /* subtler dividers */

  /* text — warm vellum, never pure white */
  --vellum:     #E4DED0;   /* primary */
  --vellum-mid: #A9A395;   /* secondary */
  --vellum-dim: #6E6A60;   /* tertiary, line numbers */

  /* pigments — syntax */
  --vermilion:  #E05A4C;   /* keywords: remember, check if, define, done */
  --gold:       #D2A24C;   /* function names, method names */
  --verdigris:  #52B3A4;   /* class names, type names */
  --sage:       #9DBA6E;   /* text literals */
  --lapis:      #6D92D8;   /* numbers, yes/no/nothing */
  --plum:       #B47CAE;   /* builtin functions, my, parent */
  --graphite:   #5F5C55;   /* comments — italic */
  --iron:       #8A8578;   /* operators, punctuation */

  /* state */
  --run:        #7FA65C;   /* run button, success */
  --halt:       #C4564A;   /* stop button, errors */
  --mark:       #D2A24C;   /* breakpoint, current line */
  --focus:      #6D92D8;   /* focus ring */
}
```

### Syntax color assignments

| Element | Token | Color | Style |
|---|---|---|---|
| Keywords | `remember` `set` `check if` `done` `define` `describe` | `--vermilion` | 500 |
| Control flow | `while` `for each` `stop` `skip` `give back` | `--vermilion` | 600 |
| Function name at declaration and call | `add` in `define add` | `--gold` | 500 |
| Class and type names | `Dog` `number` `text` | `--verdigris` | 400 |
| Text literals | `"hello"` | `--sage` | 400 |
| Interpolation braces inside text | `{name}` | `--gold` | 400 |
| Numbers, `yes`, `no`, `nothing` | `42` | `--lapis` | 400 |
| Builtins, `my`, `parent` | `floor` `my` | `--plum` | 400 |
| Comments | `note ...` | `--graphite` | 400 italic |
| Operators, punctuation | `+` `(` `,` | `--iron` | 400 |
| Plain identifiers | `count` | `--vellum` | 400 |

### Typography

| Role | Family | Notes |
|---|---|---|
| Code | **IBM Plex Mono** | 400 / 500 / 600, italic for comments. Humanist and typewriter-adjacent, so plain-English code reads as nova rather than as machine output. 14px, line-height 1.65 — generous, because nova lines are wordier than C-family code. |
| App chrome (title, panel headings, example names) | **Newsreader** | 400 / 500, optical size 16–24. A reading serif, reinforcing the manuscript idea. |
| Small UI (buttons, tabs, file names, status bar) | **IBM Plex Sans** | 400 / 500, 13px. |

Load from Google Fonts with `display=swap`. Self-host in phase 19 if the
Lighthouse score demands it.

Do not use all-caps labels anywhere. Sentence case throughout.

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│  nova            main.nova          ▸ Run   ■ Stop   ⤴ Share │  48px
├──────────┬──────────────────────────────────┬──────────────────┤
│          │ main.nova × │ utils.nova ×     │                  │
│  Files   ├──────────────────────────────────┤   Variables      │
│          │                                  │                  │
│ ▾ src    │   1  note binary search          │   low   0        │
│   main   │   2  define search with list, t  │   high  7        │
│   utils  │   3    remember low as 0         │   mid   3        │
│          │   4    ...                       │                  │
│ ▾ data   │                                  │   Call stack     │
│   out.txt│                                  │   search  line 4 │
│          │                                  │   main    line 21│
│ Examples ├──────────────────────────────────┴──────────────────┤
│  ...     │  Output                                      Input  │
│          │  > 3                                                │
│          │  finished in 2ms                                    │
└──────────┴─────────────────────────────────────────────────────┘
  220px                    flexible                     260px
```

- Three vertical regions, resizable by dragging the hairline rules.
- The variables/call-stack rail is hidden until a debug session starts.
- The output panel is collapsible, default 30% of the vertical space.
- `border-radius: 3px` on buttons and inputs. `0` on panels. No shadows
  anywhere — depth comes from the `--ink-*` layering, which is how real
  layered ink looks.
- Borders are 1px `--rule`. Active tab gets a 2px `--vermilion` top border,
  not a background change.
- Mobile (<768px): the editor and output stack vertically, the file tree becomes
  a slide-over drawer, and the debug rail is unavailable. Do not try to make a
  three-pane IDE work on a phone.

### Motion

One orchestrated moment only: on first load, the panels fade in over 240ms
staggered by 40ms, left to right. After that, motion exists solely to confirm
user actions — the run button's state change, the terminal auto-scroll, the
debugger's current-line highlight sliding. Respect
`prefers-reduced-motion: reduce` by disabling all of it.

### Copy rules

- Errors state what happened and how to fix it. They do not apologize.
- The empty editor shows: "Start writing, or pick an example from the left."
- The empty terminal shows: "Output appears here when you run."
- Button labels are verbs that match their result: "Run" produces "Running…"
  then "Finished in 3ms".

---

## 6. Build phases

Each phase: **Goal → Build → Acceptance → Do not yet.**

---

### Phase 0 — Scaffold

**Goal.** A running Vite app with Tailwind, fonts, and the Nightleaf tokens
wired up, plus the empty folder structure and a passing test runner.

**Build.**
1. `npm create vite@latest nova -- --template react`
2. `npm install`
3. `npm install @monaco-editor/react monaco-editor idb-keyval lz-string`
4. `npm install -D tailwindcss @tailwindcss/vite vitest`
5. `vite.config.js`: add `react()` and `tailwindcss()` to plugins.
6. `src/index.css`: `@import "tailwindcss";`, the Google Fonts import, and the
   full `:root` block from section 5.
7. Delete `src/App.css` and the Vite boilerplate from `App.jsx`.
8. Create every directory in section 4.2 with a `.gitkeep`.
9. `package.json` scripts: `"test": "vitest"`, `"test:run": "vitest run"`.
10. `src/lang/config.js` exporting `LANG_NAME = "nova"`, `FILE_EXT = ".nova"`,
    `MAX_DEPTH = 10000`, `MAX_STEPS = 50_000_000`.
11. A smoke test `src/lang/config.test.js` asserting `LANG_NAME === "nova"`.

**Acceptance.** `npm run dev` shows a page with `--ink-900` background and
`--vellum` text in Newsreader reading "nova". `npm run test:run` passes one
test. `git log` shows one commit.

**Do not yet.** No Monaco, no interpreter.

---

### Phase 1 — Lexer

**Goal.** Turn source text into a token array with exact positions.

**Build.**

`src/lang/tokens.js`:
- `TokenType` enum: `NUMBER TEXT IDENT KEYWORD TYPE PLUS MINUS STAR SLASH
  PERCENT CARET LT GT LTE GTE EQEQ BANGEQ LPAREN RPAREN LBRACKET RBRACKET
  LBRACE RBRACE COMMA DOT COLON EOF`
- `KEYWORDS`: a Map from the single words in 3.17 to `KEYWORD`.
- `TYPE_NAMES`: a Set of the type names.

`src/lang/lexer.js` — a class `Lexer(source, fileName)` with `tokenize()`:
- Track `pos`, `line`, `column`. Increment `line` and reset `column` on `\n`.
- Skip spaces, tabs, carriage returns, newlines. **Emit no newline token.**
- `note` at the start of a token and `#` both consume to end of line.
- Numbers: digits, optional `.`, optional `e`/`E` exponent. Reject `1.2.3` with
  a clear error.
- Text: `"` to `"`, handling `\n \t \\ \" \{`. Unterminated text is an error
  naming the opening line.
- **Interpolation:** do NOT parse it in the lexer. Store the raw cooked string
  with `{` markers intact plus a flag `hasInterpolation`. The parser splits it.
  This keeps the lexer simple and keeps positions correct.
- Identifiers: `[A-Za-z_][A-Za-z0-9_]*`. Look up in `KEYWORDS`, then
  `TYPE_NAMES`, else `IDENT`.
- Multi-word keywords (`check if`, `for each`, `give back`, `keep going`,
  `size of`, `is not`, `is a`, `or if`, `delete file`, `down to`) are **NOT**
  merged in the lexer. Emit them as separate keyword tokens and let the parser
  match pairs. Merging in the lexer creates ambiguity with identifiers like
  `size_of_list`.
- Two-character operators before one-character: `<=` `>=` `==` `!=`.
- Always end with an `EOF` token carrying the final position.
- Any unrecognized character raises a lexer error with line, column, and the
  character shown.

**Acceptance.** `src/lang/lexer.test.js` with at least 25 cases covering: every
token type, a comment at end of file, an escaped quote, a float with exponent,
an unterminated string, an illegal character, and a 30-line program where you
assert the line and column of the last token.

**Do not yet.** No AST.

---

### Phase 2 — Expression parser

**Goal.** Parse expressions with correct precedence into an AST.

**Build.**

`src/lang/ast.js` — constructor functions, each stamping `loc`:
`Num, Text, Bool, Nothing, Ident, Binary, Unary, Grouping, ListLit, MapLit,
Index, Property, Call, Interpolation`

`src/lang/parser.js` — a `Parser(tokens, fileName)` class with the helpers
`peek() check(type) match(...types) consume(type, message) previous() isAtEnd()`
and one method per precedence level, exactly mirroring section 3.5:

```
expression -> or_expr -> and_expr -> equality -> comparison
           -> term -> factor -> power -> unary -> postfix -> primary
```

- `power` recurses into itself on the right for right associativity.
- `postfix` loops on `(`, `[`, `.` so `a.b[0](x).c` parses.
- `primary` handles literals, `(`, `[`, `{`, identifiers, `my`, `parent`.
- Interpolated text becomes an `Interpolation` node holding an alternating list
  of `Text` nodes and parsed sub-expressions. Parse each `{...}` by running a
  nested `Lexer` + `Parser` on the substring and **offsetting every resulting
  `loc` by the substring's start** so error positions stay accurate.
- Every parse error is a `novaError` with kind `SyntaxError`, a location, and a
  hint. Example: seeing `=` where `as` was expected should say
  `Hint: use "remember x as 5", not "remember x = 5"`.

**Acceptance.** `src/lang/parser.expr.test.js`: assert the tree shape for
`2 + 3 * 4`, `(2 + 3) * 4`, `2 ^ 3 ^ 2` (right assoc), `not a and b`,
`a or b and c`, `-x ^ 2`, `size of nums + 1`, `a.b.c`, `f(1)(2)`, `m["k"][0]`,
`[1, [2, 3]]`, `{"a": {"b": 1}}`, `"hi {n + 1} there"`.

**Do not yet.** No statements, no evaluation.

---

### Phase 3 — Statement parser

**Goal.** Parse the full statement grammar from 3.20 except classes, attempt,
and use.

**Build.** Add to `ast.js`: `Program, Declare, Assign, Show, If, While, Repeat,
Count, ForEach, Forever, Block, Skip, Stop, ExprStmt`.

Add to `parser.js`: `parse()` looping `statement()` until EOF, and one method
per statement form. `block()` collects statements until it hits a block
terminator keyword (`done`, `otherwise`, `or`, `rescue`, `always`) — it does not
consume the terminator; the caller does.

Enforce at parse time: `skip` and `stop` outside a loop are errors. Track loop
depth in the parser.

**Acceptance.** `src/lang/parser.stmt.test.js`: parse each loop form, a three-
branch `check if`, nested blocks three deep, and assert clear errors for a
missing `done`, `skip` at top level, and `remember 5 as x`.

**Do not yet.** No interpreter.

---

### Phase 4 — Interpreter core

**Goal.** Execute declarations, assignment, arithmetic, and `show`.

**Build.**

`src/lang/environment.js` — `Environment(parent)` with `declare(name, value,
{constant, type})`, `get(name)`, `assign(name, value)`, `has(name)`. Walks the
parent chain. Throws `NameError` with a "did you mean X?" hint computed by
Levenshtein distance against names in scope. That hint is the difference between
a toy and something usable — build it now, not later.

`src/lang/values.js` — `typeName(v)` returning the nova type name for any
runtime value, and `toDisplay(v)` producing the text `show` prints (lists as
`[1, 2, 3]`, maps as `{"a": 1}`, functions as `<action add>`, instances as
`<Dog Rex>`).

`src/lang/interpreter.js` — an `Interpreter({ output, fileName })` class with
`visit(node)` dispatching on `node.type`. Implement the expression nodes from
phase 2 and the statements from phase 3 that don't involve control flow.

Arithmetic rules from 3.5, including the text coercion rules and the
`MathError` on division by zero.

`output` is an injected callback, not `console.log`. The worker supplies it.

**Acceptance.** `src/lang/interp.core.test.js`: a helper `run(src)` returning
captured output. Assert `show 2 + 3 * 4` prints `14`, string concat works,
`remember` then `set` works, re-declaring raises, `set` on an undeclared name
raises with a suggestion, `set` on a `constant` raises, `10 / 0` raises
`MathError`.

---

### Phase 5 — Control flow

**Goal.** All conditionals and all five loop forms execute correctly.

**Build.** Implement `If`, `While`, `Repeat`, `Count`, `ForEach`, `Forever`.

Use JS exceptions as control-flow signals: `class BreakSignal {}` and
`class ContinueSignal {}` caught inside the loop visitors. Do not use return
codes threaded through every visit — it pollutes the whole interpreter.

Add a step counter incremented in the loop bodies. When it exceeds `MAX_STEPS`,
raise a `RuntimeError` reading "This program ran too long — check for a loop
that never ends." This is the guard against a browser tab hanging.

Truthiness per 3.5.

**Acceptance.** `src/lang/interp.flow.test.js`: FizzBuzz to 20 produces the
right 20 lines, `count i from 10 down to 1 by 3` produces `10 7 4 1`, `skip` and
`stop` work at two levels of nesting, `for each` over a text yields characters,
an infinite `while yes` loop raises the step-limit error rather than hanging.

---

### Phase 6 — Functions and closures

**Goal.** Named functions, anonymous actions, defaults, closures, recursion,
`give back`.

**Build.**
- `novaFunction` in `values.js`: holds the declaration node, a closure
  `Environment`, and an optional bound `this`.
- `Call` evaluates the callee, evaluates arguments left to right, checks arity
  (naming the function, expected count, and received count), creates a child
  `Environment` of the closure, binds parameters, applies defaults, and executes
  the body.
- `ReturnSignal` exception carrying the value.
- Hoisting: on entering any block, do one pass collecting `define` nodes and
  declare them before executing anything else.
- Depth counter guarding `MAX_DEPTH`, raising `DepthError`.
- A call stack array of `{ name, file, line }` maintained on every call and
  attached to any error raised. This is what the terminal prints as a traceback.

**Acceptance.** `src/lang/interp.fn.test.js`: `fib(20) == 6765`, a closure
counter returns 1 then 2 then 3, `define` used before it appears in the file
works, mutual recursion `is_even`/`is_odd` works, an arity mismatch produces
the right message, infinite recursion raises `DepthError` and the JS stack does
not overflow.

---

### Phase 7 — Lists and maps

**Goal.** Every list and map operation in 3.9 and 3.10.

**Build.**
- `novaList` wrapping a JS array; `novaMap` wrapping a JS `Map` to preserve
  insertion order and allow number keys.
- Index reads and writes, including negative indexes on lists.
- `src/lang/stdlib/list.js` and `map.js` exporting method tables. `Property` on
  a list or map looks up the method table and returns a bound native function.
- `size of` works on list, map, and text.
- `for each key to value in map`.
- Bounds violations raise `IndexError` with the index and the actual size.

**Acceptance.** `src/lang/stdlib/list.test.js` and `map.test.js` covering every
listed method, plus: mutation methods mutate in place, non-mutating methods
return new collections and leave the original alone, `nums[10]` on a 3-element
list raises `IndexError`, `sort_by` with a comparator works.

---

### Phase 8 — Text stdlib and interpolation

**Goal.** Every text method in 3.11, and interpolation evaluating at runtime.

**Build.** `src/lang/stdlib/text.js`. Implement the `Interpolation` node:
evaluate each sub-expression, `toDisplay` it, and join. `src/lang/stdlib/math.js`
and `globals.js` for section 3.18.

**Acceptance.** `text.test.js` for every method; a test that
`"a{1+1}b{2+2}c"` yields `a2b4c`; a test that `{` escaped as `\{` stays literal.

---

### Phase 9 — Classes and inheritance

**Goal.** Section 3.12 in full.

**Build.**
- `novaClass` holding name, superclass, field declarations, and a method map.
- `novaInstance` holding a class reference and a field map.
- `new X(args)` creates the instance, initialises `has` defaults down the
  inheritance chain from the root, then calls `setup` if defined.
- Method lookup walks the superclass chain.
- `my` is bound in a method's environment. Using it outside a method is a parse
  error.
- `parent.method(args)` resolves against the superclass of the class that
  lexically declared the running method — not the runtime class. Getting this
  wrong makes two-level inheritance infinite-loop. Store the declaring class on
  each `novaFunction`.
- `is a` walks the chain.
- `toDisplay` on an instance calls a user-defined `to_text` method if present.

**Acceptance.** `src/lang/interp.class.test.js`: the Animal/Dog example prints
correctly; three-level inheritance with `parent` at each level works; an
overridden method called from an inherited method dispatches to the override;
`is a` is true for every ancestor and false for siblings; fields with defaults
initialise; calling a missing method raises a `NameError` listing available
methods.

---

### Phase 10 — Errors

**Goal.** `attempt` / `rescue` / `always` / `raise`, and the formatted error
output from 3.13.

**Build.**
- Parse the `attempt` statement.
- A `novaThrow` JS exception wrapping a `novaError` value.
- Every internal raise site produces a `novaError` with `kind`, `message`,
  `hint`, `line`, `column`, `file`, and the captured call stack.
- `src/lang/errors.js` exports `formatError(sourcesByFile, error)` producing the
  exact block shown in 3.13: header line, blank line, the offending source line
  indented four spaces, a caret line, the message, and the hint.
- `always` runs on both the normal and the error path, including when the
  `attempt` block returns.

**Acceptance.** `src/lang/errors.test.js`: a caught `raise` binds `e.message`; an
uncaught error's formatted output matches a snapshot exactly, caret column
included; `always` runs after `give back` inside `attempt`; nested `attempt`
blocks rethrow correctly.

---

### Phase 11 — Resolver and type hints

**Goal.** Catch undeclared names before running, and enforce type hints at
runtime.

**Build.**
- `src/lang/resolver.js` walks the AST tracking scopes, and reports: use of an
  undeclared name, declaring the same name twice in one scope, `give back`
  outside a function, `my`/`parent` outside a method, and unreachable code after
  `give back`/`stop`. It returns an array of `novaError`s rather than throwing,
  so the editor can show all of them at once.
- Type checking in `interpreter.js` at three sites: `remember`/`constant` with a
  declared type, parameter binding, and `give back` when `gives` is declared.
  Plus `has` fields on assignment.
- `checkType(value, typeName)` handles the primitives, `anything`, and class
  names via the `is a` walk.

**Acceptance.** `resolver.test.js` returns two errors for a program with two
typos and reports both lines. `types.test.js`: passing text to a `number`
parameter raises with declared type, received type, parameter name, and
location; `anything` accepts everything; a class-typed hint accepts a subclass.

---

### Phase 12 — Modules and files

**Goal.** `use`, multi-file projects, and file I/O.

**Build.**
- `src/lang/modules.js`: a `ModuleLoader` taking a `{ [path]: source }` map.
  `load(path)` lexes, parses, resolves, and interprets in a fresh environment,
  caching by path. Detects cycles with a loading set and raises
  `FileError: circular use — main.nova -> a.nova -> main.nova`.
- `use "x"` merges the module environment's bindings. `use "x" as n` binds a
  namespace object whose `Property` reads look up the module environment.
- File statements `save ... to ...`, `read ...`, `delete file ...`, `files()`
  call into an injected `fileSystem` interface, so tests can pass an in-memory
  implementation and the app passes an IndexedDB one:

```js
{ read(path), write(path, text), remove(path), list() }
```

**Acceptance.** `modules.test.js`: a three-file project where `main` uses `utils`
which uses `math`; a namespace import; a circular import error naming the cycle;
`save`/`read` round trip through a fake filesystem; `read` on a missing path
raises `FileError`.

**This is the end of the language.** From here it is all application code.

---

### Phase 13 — Worker and terminal

**Goal.** Run nova from the browser without freezing the UI.

**Build.**
- `src/worker/runner.worker.js`: receives `run`, builds a `ModuleLoader`, runs
  the entry file, posts `output` messages as `show` executes, posts `error` with
  the formatted block, posts `done` with elapsed ms.
- `ask` posts `needInput` and awaits an `input` message. Implement the
  interpreter's `ask` as an async boundary — the cleanest approach is to make
  `visit` async throughout, which is worth doing now rather than retrofitting.
  Measure first: if async `visit` costs more than 3x on `fib(25)`, instead run
  the interpreter synchronously and use `Atomics.wait` on a
  `SharedArrayBuffer` for input. Record the choice in `DECISIONS.md`.
- `stop` terminates the worker and spawns a fresh one.
- `src/state/useRunner.js`: worker lifecycle, an output buffer that batches
  messages with `requestAnimationFrame` so 10,000 `show` calls don't cause
  10,000 React renders.
- `src/components/Terminal.jsx`: monospace, auto-scroll unless the user has
  scrolled up, errors in `--halt`, a status line reading "Finished in 3ms".
- `src/components/InputPanel.jsx`: a single-line input, enabled only when the
  worker is waiting.

**Acceptance.** A program that prints 50,000 lines does not drop a frame. An
infinite loop is stoppable with the Stop button. `ask` pauses, accepts typed
input, and resumes. An uncaught error shows the formatted block with the caret.

---

### Phase 14 — Editor and highlighting

**Goal.** Monaco configured for nova with the Nightleaf theme.

**Build.**
- `src/editor/monarch.js`: a Monarch tokenizer covering every category in
  section 5's table. Two details that are easy to get wrong: `define NAME` and
  `describe NAME` must tokenize the following identifier as `function` and
  `class` respectively (use Monarch's lookahead states), and `{...}` inside a
  text literal must switch to an embedded state so interpolations color
  differently from the surrounding string.
- `src/editor/theme.js`: `monaco.editor.defineTheme('nightleaf', ...)` mapping
  every token scope to the pigment hexes.
- `src/components/CodeEditor.jsx`: `@monaco-editor/react` with
  `language: 'nova'`, `fontFamily: 'IBM Plex Mono'`, `fontSize: 14`,
  `lineHeight: 23`, `minimap: { enabled: false }`, `renderWhitespace: 'none'`,
  `bracketPairColorization: { enabled: false }` (the pigments carry it),
  `cursorBlinking: 'solid'`, `smoothScrolling: true`.
- Language configuration: comment token `note`, bracket pairs, auto-closing
  pairs, and an indentation rule that indents after any block-opening keyword
  and dedents on `done`, `otherwise`, `or if`, `rescue`, `always`.
- `src/components/Shell.jsx`, `TitleBar.jsx`, `FileTree.jsx`, `TabBar.jsx` per
  the layout in section 5. Resizable panes via pointer events on the rules — do
  not add a dependency for this.
- `src/state/useProject.js` + `storage.js`: files in IndexedDB, autosave
  debounced 500ms, restore on reload.

**Acceptance.** Every syntax category renders in its assigned pigment. `done`
dedents automatically. Files persist across a reload. Panes resize. The layout
holds at 1280px and at 390px.

---

### Phase 15 — Autocomplete, hover, diagnostics

**Goal.** The editor helps you write, and shows mistakes as you type.

**Build.**
- `src/editor/diagnostics.js`: on a 400ms idle after typing, lex + parse +
  resolve in the worker (a second, separate worker — never block on the runner),
  and set Monaco markers for every returned `novaError`. Red squiggles for
  errors, and the hint in the marker's message so hovering explains the fix.
- `src/editor/completion.js`: complete keywords, builtins, every name in scope
  at the cursor (from the resolver's scope data), list/map/text methods after a
  `.`, and class names after `new`. Provide snippet completions for the block
  forms so typing `check` and pressing Tab produces the full `check if` /
  `done` skeleton with tab stops.
- `src/editor/hover.js`: hovering a builtin shows its signature and a one-line
  description; hovering a user function shows its declared parameters and
  `gives` type; hovering a variable shows its inferred or declared type.

**Acceptance.** Typing `remmber` shows a squiggle within half a second reading
"Unknown word 'remmber'. Hint: did you mean 'remember'?". `nums.` offers the
list methods. `check` + Tab expands. Hovering `floor` shows its signature.
Typing fast never stutters.

---

### Phase 16 — Step debugger

**Goal.** Breakpoints, stepping, variable inspection, call stack.

**Build.**
- Monaco glyph margin click toggles a breakpoint; render a `--mark` dot.
- The interpreter gains a `debugHook(node, env, callStack)` called before every
  **statement** (not every expression — too slow, too noisy).
- Run modes: `continue` runs until a breakpoint; `step in` stops at the next
  statement anywhere; `step over` stops at the next statement at the same or
  shallower call depth; `step out` runs until the current function returns.
- On pause the worker posts `paused` with the file, line, a serialized snapshot
  of every scope in the chain, and the call stack. Serialization must be
  depth-limited and cycle-safe.
- `src/components/DebugPanel.jsx`: the scope chain as collapsible sections,
  the call stack as a clickable list that jumps the editor to that frame.
- The paused line gets a `--mark` background in the editor.

**Acceptance.** Set a breakpoint inside a recursive `fib`, run, and the call
stack shows the correct depth. Step over a function call and execution does not
enter it. Variables update as you step. Inspecting a list shows its elements.
Stepping through a 200-statement program stays responsive.

---

### Phase 17 — Examples library

**Goal.** Seven working programs that prove the language is real.

**Build.** Write each in `src/examples/` and make each one an acceptance test —
if an example crashes, the phase is not done.

| File | Proves |
|---|---|
| `hello.nova` | show, interpolation, ask |
| `fizzbuzz.nova` | loops, conditionals, modulo |
| `binary_search.nova` | lists, while, integer math, functions |
| `sorting.nova` | recursion, list slicing, comparators — quicksort and mergesort |
| `linked_list.nova` | classes, `nothing`, traversal, `to_text` |
| `bank_oop.nova` | inheritance, `parent`, fields, errors, `attempt` |
| `todo_app.nova` | multi-file with `use`, maps, file save/read, `ask` loop |

`ExampleLibrary.jsx` lists them in the sidebar under a "Examples" heading;
clicking one loads it into a fresh project (with a confirm if the current
project is dirty).

**Acceptance.** `src/examples/examples.test.js` runs every `.nova` file through
the interpreter with scripted input and asserts its output. All seven pass.

---

### Phase 18 — Share links

**Goal.** A URL that reconstructs a whole project.

**Build.** Serialize `{ files, entry }` to JSON, `lz-string`
`compressToEncodedURIComponent`, put it in the hash: `/#p=...`. On load, if the
hash is present, decode and open it read-only until the user clicks "Make a
copy". Warn in the share dialog when the URL exceeds 8000 characters, since some
clients truncate. `ShareDialog.jsx` shows the URL with a copy button and a
character count.

**Acceptance.** A three-file project round-trips through a URL byte-for-byte. A
malformed hash shows "That link is damaged" and opens an empty project instead
of crashing.

---

### Phase 19 — Harden and ship

**Goal.** Live on the internet, fast, and not broken.

**Build.**
1. **Performance pass.** Benchmark `fib(27)`, bubble sort on 2,000 elements, and
   a 1,000,000-iteration loop. Profile and fix the top three costs. Expect the
   `Environment` lookup chain and per-node object allocation to dominate; the
   usual fix is resolving variable slots at resolve time so lookup is an array
   index instead of a Map walk up N parents.
2. **Keyboard.** `Cmd+Enter` run, `Cmd+.` stop, `Cmd+S` save, `Cmd+B` toggle
   breakpoint, `F10`/`F11` step over/in, `Cmd+P` file switcher.
3. **Accessibility.** Visible focus rings in `--focus`, every icon button
   labelled, terminal output in an `aria-live="polite"` region,
   `prefers-reduced-motion` respected.
4. **Empty and error states** per the copy rules in section 5.
5. **Self-host the fonts** if Lighthouse penalises the Google Fonts request.
6. **README.md**: what nova is, a code sample, how to run locally, and a link
   to the live site.
7. **Deploy.** `npm run build`, then Vercel: import the repo, framework preset
   Vite, no environment variables. Verify the Web Worker loads on the deployed
   origin — this is the one thing that commonly breaks in production and not in
   dev.

**Acceptance.** Lighthouse performance ≥ 90 and accessibility ≥ 95. `fib(27)`
under two seconds. Every example runs on the deployed URL. A share link opens
correctly on a phone.

---

## 7. Testing

- **Vitest**, colocated `*.test.js` files next to the code they test.
- **The golden helper**, in `src/lang/testUtils.js`:

```js
export function run(source, { input = [], files = {} } = {}) {
  // returns { output: string[], error: novaError | null }
}
```

  Almost every interpreter test is `expect(run(src).output).toEqual([...])`.
- **Snapshot the formatted errors.** Error text is a feature; regressions in it
  should fail a test.
- **A `.nova` corpus.** `src/lang/__fixtures__/` holds small programs with an
  expected-output comment at the top; one test iterates the whole directory.
  Every bug you fix gets a fixture, permanently.
- Run `npm run test:run` before every commit.

---

## 8. Definition of done

- [ ] Every phase's acceptance test passes.
- [ ] All seven examples run on the deployed site.
- [ ] Binary search, quicksort, mergesort, BFS on a map-based graph, and a
      recursive tree traversal are all writable and correct in nova.
- [ ] A multi-file project with classes, inheritance, `use`, and file
      persistence works end to end.
- [ ] No error message anywhere lacks a line, a column, and a hint.
- [ ] `src/lang/` imports nothing from React, Monaco, or the DOM.
- [ ] The UI is usable at 390px wide.
- [ ] `DECISIONS.md` records every deviation from this document.

---

## 9. Known traps

Collected so they don't cost you a day each.

1. **Newlines.** The grammar is newline-insensitive, which works only because
   statements start with distinguishing keywords. If you ever add a statement
   that can start with an expression, this breaks. Don't.
2. **`parent` resolution.** Bind it to the declaring class, not the instance's
   class, or three-level inheritance loops forever.
3. **Interpolation positions.** Offset the sub-parser's `loc` values, or every
   error inside a `{...}` points at the wrong column.
4. **Worker output flooding.** Batch with `requestAnimationFrame` from the
   start. Retrofitting it after the terminal is built is miserable.
5. **`always` on the return path.** A `give back` inside `attempt` must still
   run `always`. Test it explicitly.
6. **Monaco disposal.** Dispose completion, hover, and diagnostic providers on
   unmount or React strict mode registers them twice and you get doubled
   suggestions.
7. **Negative list indexes.** Decide once whether `-1` is the last element
   (it is, per 3.9) and apply it in reads, writes, and `slice` identically.
8. **The step limit is not the depth limit.** Both exist, they catch different
   bugs, and they need different messages.