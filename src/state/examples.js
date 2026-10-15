export const EXAMPLES = [
  {
    name: 'Hello World',
    description: 'Variables, input, and string interpolation',
    files: {
      'main.nova': `note A friendly greeting
remember name as ask "What is your name? "
show "Hello, {name}!"
show "Welcome to Nova."
`,
    },
  },
  {
    name: 'FizzBuzz',
    description: 'Classic loop with conditionals',
    files: {
      'main.nova': `count i from 1 to 100
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
`,
    },
  },
  {
    name: 'Functions',
    description: 'Define and call functions with return values',
    files: {
      'main.nova': `define factorial with n gives number
  check if n <= 1
    give back 1
  done
  give back n * factorial(n - 1)
done

count i from 1 to 10
  show "{i}! = {factorial(i)}"
done
`,
    },
  },
  {
    name: 'Classes',
    description: 'OOP with fields, methods, and inheritance',
    files: {
      'main.nova': `describe Animal
  has name
  has sound

  define setup with name, sound
    set my.name to name
    set my.sound to sound
  done

  define speak
    show "{my.name} says {my.sound}!"
  done
done

describe Dog from Animal
  define setup with name
    parent.setup(name, "Woof")
  done

  define fetch with item
    show "{my.name} fetches the {item}!"
  done
done

remember dog as new Dog("Rex")
dog.speak()
dog.fetch("ball")
`,
    },
  },
  {
    name: 'Error Handling',
    description: 'Attempt/rescue and raising errors',
    files: {
      'main.nova': `define divide with a, b gives number
  check if b == 0
    raise "Cannot divide by zero!"
  done
  give back a / b
done

attempt
  show divide(10, 3)
  show divide(10, 0)
rescue err
  show "Caught: {err["message"]}"
always
  show "Division complete."
done
`,
    },
  },
  {
    name: 'Multi-File',
    description: 'Modules with use/import across files',
    files: {
      'main.nova': `use "helpers"

remember items as ["apples", "bananas", "cherries"]
show "Shopping list:"

count i from 0 to size of items - 1
  show "  {i + 1}. {capitalize(items[i])}"
done

show ""
show "Total: {size of items} items"
`,
      'helpers.nova': `define capitalize with word gives text
  check if word == ""
    give back ""
  done
  remember first as word.upper()
  remember rest as word.slice(1, size of word)
  give back first.slice(0, 1) + rest
done
`,
    },
  },
  {
    name: 'Lists & Maps',
    description: 'Collections, iteration, and built-in methods',
    files: {
      'main.nova': `note Lists
remember fruits as ["mango", "kiwi", "apple", "banana"]
fruits.add("grape")
remember sorted as fruits.sort()
show "Sorted: {sorted}"

note Maps
remember scores as {"alice": 95, "bob": 82, "carol": 91}
set scores["dave"] to 88

show ""
show "Scores:"
for each name to score in scores
  check if score >= 90
    show "  {name}: {score} (A)"
  otherwise
    show "  {name}: {score} (B)"
  done
done
`,
    },
  },
  {
    name: 'Sorting',
    description: 'Bubble, insertion, and merge sort side by side',
    files: {
      'main.nova': `define bubble_sort with items gives list
  remember a as items.copy()
  remember n as size of a
  remember tmp as 0
  count i from 0 to n - 2
    count j from 0 to n - i - 2
      check if a[j] > a[j + 1]
        set tmp to a[j]
        set a[j] to a[j + 1]
        set a[j + 1] to tmp
      done
    done
  done
  give back a
done

define insertion_sort with items gives list
  remember a as items.copy()
  remember key as 0
  remember j as 0
  count i from 1 to size of a - 1
    set key to a[i]
    set j to i - 1
    while j >= 0 and a[j] > key
      set a[j + 1] to a[j]
      set j to j - 1
    done
    set a[j + 1] to key
  done
  give back a
done

define merge with left, right gives list
  remember result as []
  remember i as 0
  remember j as 0
  while i < size of left and j < size of right
    check if left[i] <= right[j]
      result.add(left[i])
      set i to i + 1
    otherwise
      result.add(right[j])
      set j to j + 1
    done
  done
  while i < size of left
    result.add(left[i])
    set i to i + 1
  done
  while j < size of right
    result.add(right[j])
    set j to j + 1
  done
  give back result
done

define merge_sort with items gives list
  check if size of items <= 1
    give back items
  done
  remember mid as floor(size of items / 2)
  give back merge(merge_sort(items.slice(0, mid)), merge_sort(items.slice(mid, size of items)))
done

remember data as [64, 25, 12, 22, 11, 90, 3]
show "Original:  {data}"
show "Bubble:    {bubble_sort(data)}"
show "Insertion: {insertion_sort(data)}"
show "Merge:     {merge_sort(data)}"
`,
    },
  },
  {
    name: 'Graph BFS',
    description: 'Breadth-first search for shortest paths on a graph',
    files: {
      'main.nova': `remember graph as {
  "A": ["B", "C"],
  "B": ["A", "D", "E"],
  "C": ["A", "F"],
  "D": ["B"],
  "E": ["B", "F"],
  "F": ["C", "E"]
}

define bfs with graph, start gives map
  remember dist as {}
  set dist[start] to 0
  remember queue as [start]
  remember head as 0
  remember node as start

  while head < size of queue
    set node to queue[head]
    set head to head + 1
    for each next in graph[node]
      check if not dist.has(next)
        set dist[next] to dist[node] + 1
        queue.add(next)
      done
    done
  done
  give back dist
done

remember dist as bfs(graph, "A")
show "Distances from A:"
for each name to d in dist
  show "  {name}: {d}"
done
`,
    },
  },
  {
    name: 'Dynamic Programming',
    description: 'Memoized Fibonacci, coin change, and longest common subsequence',
    files: {
      'main.nova': `note Fibonacci with a memo map
remember memo as {}
define fib with n gives number
  check if n <= 1
    give back n
  done
  check if memo.has(n)
    give back memo[n]
  done
  remember value as fib(n - 1) + fib(n - 2)
  set memo[n] to value
  give back value
done
show "fib(50) = {fib(50)}"

note Fewest coins to make an amount (bottom-up table)
define coin_change with coins, amount gives number
  remember table as [0]
  remember best as 0
  count a from 1 to amount
    set best to amount + 1
    for each c in coins
      check if c <= a and table[a - c] + 1 < best
        set best to table[a - c] + 1
      done
    done
    table.add(best)
  done
  check if table[amount] > amount
    give back -1
  done
  give back table[amount]
done
show "Fewest coins for 63 using [1, 5, 10, 25]: {coin_change([1, 5, 10, 25], 63)}"

note Longest common subsequence length (2D table)
define lcs with a, b gives number
  remember rows as []
  remember row as []
  count i from 0 to size of a
    set row to []
    count j from 0 to size of b
      row.add(0)
    done
    rows.add(row)
  done
  count i from 1 to size of a
    count j from 1 to size of b
      check if a.slice(i - 1, i) == b.slice(j - 1, j)
        set rows[i][j] to rows[i - 1][j - 1] + 1
      otherwise
        set rows[i][j] to max(rows[i - 1][j], rows[i][j - 1])
      done
    done
  done
  give back rows[size of a][size of b]
done
remember first_word as "ABCBDAB"
remember second_word as "BDCABA"
show "LCS of {first_word} and {second_word}: {lcs(first_word, second_word)}"
`,
    },
  },
  {
    name: 'Linked List',
    description: 'Nodes, a list class, and in-place reversal',
    files: {
      'main.nova': `describe Node
  has value
  has next

  define setup with value
    set my.value to value
    set my.next to nothing
  done
done

describe LinkedList
  has head
  has length

  define setup
    set my.head to nothing
    set my.length to 0
  done

  define push_front with value
    remember node as new Node(value)
    set node.next to my.head
    set my.head to node
    set my.length to my.length + 1
  done

  define push_back with value
    remember node as new Node(value)
    check if my.head == nothing
      set my.head to node
    otherwise
      remember current as my.head
      while current.next != nothing
        set current to current.next
      done
      set current.next to node
    done
    set my.length to my.length + 1
  done

  define reverse
    remember prev as nothing
    remember current as my.head
    remember following as nothing
    while current != nothing
      set following to current.next
      set current.next to prev
      set prev to current
      set current to following
    done
    set my.head to prev
  done

  define to_list gives list
    remember out as []
    remember current as my.head
    while current != nothing
      out.add(current.value)
      set current to current.next
    done
    give back out
  done
done

remember numbers as new LinkedList()
numbers.push_back(2)
numbers.push_back(3)
numbers.push_back(4)
numbers.push_front(1)
show "List:     {numbers.to_list()}"
show "Length:   {numbers.length}"
numbers.reverse()
show "Reversed: {numbers.to_list()}"
`,
    },
  },
  {
    name: 'Stack & Queue Modules',
    description: 'Multi-file project using namespaced imports',
    files: {
      'main.nova': `use "stack" as stack
use "queue" as queue

note Check balanced brackets with a stack
define balanced with word gives truth
  remember s as stack.make()
  remember pairs as {")": "(", "]": "["}
  for each ch in word.split("")
    check if ch == "(" or ch == "["
      stack.push(s, ch)
    or if pairs.has(ch)
      check if stack.is_empty(s) or stack.pop(s) != pairs[ch]
        give back no
      done
    done
  done
  give back stack.is_empty(s)
done

remember good as "([])()"
remember bad as "([)]"
show "{good} balanced? {balanced(good)}"
show "{bad} balanced? {balanced(bad)}"

note Process tasks in arrival order with a queue
remember q as queue.make()
queue.enqueue(q, "write code")
queue.enqueue(q, "run tests")
queue.enqueue(q, "ship it")
while not queue.is_empty(q)
  show "Doing: {queue.dequeue(q)}"
done
`,
      'stack.nova': `define make gives map
  give back {"items": []}
done

define push with s, value
  s["items"].add(value)
done

define pop with s
  give back s["items"].pop()
done

define is_empty with s gives truth
  give back size of s["items"] == 0
done
`,
      'queue.nova': `define make gives map
  give back {"items": [], "head": 0}
done

define enqueue with q, value
  q["items"].add(value)
done

define dequeue with q
  remember value as q["items"][q["head"]]
  set q["head"] to q["head"] + 1
  give back value
done

define is_empty with q gives truth
  give back q["head"] >= size of q["items"]
done
`,
    },
  },
]
