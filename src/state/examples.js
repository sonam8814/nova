export const EXAMPLES = [
  {
    name: 'Hello World',
    description: 'Variables, input, and string interpolation',
    files: {
      'main.nova': `note A friendly greeting
remember name as ask "What is your name?"
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
  has name as text
  has sound as text

  define setup with name, sound
    set my.name to name
    set my.sound to sound
  done

  define speak
    show "{my.name} says {my.sound}!"
  done
done

describe Dog is Animal
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
  show "Caught: {err}"
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
  remember rest as word.slice(1, word.length())
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
fruits.push("grape")
fruits.sort()
show "Sorted: {fruits}"

note Maps
remember scores as {"alice": 95, "bob": 82, "carol": 91}
set scores["dave"] to 88

show ""
show "Scores:"
for each name, score in scores
  check if score >= 90
    show "  {name}: {score} (A)"
  otherwise
    show "  {name}: {score} (B)"
  done
done
`,
    },
  },
]
