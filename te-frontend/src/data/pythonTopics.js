export const pythonTopics = {
    "Getting Started": {
        difficulty: { level: "Beginner", color: "bg-green-100 text-green-800" },
        topics: [
            {
                name: "Introduction to Python",
                description: "What is Python, its history, and why learn it",
                resources: [
                    { type: "video", title: "Python in 100 Seconds", url: "https://www.youtube.com/watch?v=x7X9w_GIm1s" },
                    { type: "article", title: "Official Python Tutorial", url: "https://docs.python.org/3/tutorial/index.html" }
                ],
                keyPoints: [
                    "High-level, interpreted language",
                    "Easy to read and write",
                    "Versatile - web, data science, AI, automation",
                    "Large ecosystem and community"
                ]
            },
            {
                name: "Installation & Setup",
                description: "Installing Python and setting up your development environment",
                resources: [
                    { type: "video", title: "Python Setup Guide", url: "https://www.youtube.com/watch?v=YYXdXT2l-Gg" },
                    { type: "article", title: "VS Code Python Setup", url: "https://code.visualstudio.com/docs/python/python-tutorial" }
                ],
                keyPoints: [
                    "Download Python from python.org",
                    "Install VS Code or PyCharm",
                    "Set up virtual environments",
                    "Use pip for package management"
                ]
            },
            {
                name: "Python REPL & First Program",
                description: "Using the interactive shell and writing your first Python script",
                resources: [
                    { type: "video", title: "Python Hello World", url: "https://www.youtube.com/watch?v=KOdfpbnWLVo" },
                    { type: "article", title: "Python Interactive Shell", url: "https://realpython.com/interacting-with-python/" }
                ],
                keyPoints: [
                    "Interactive Python shell",
                    "Writing .py files",
                    "Running Python scripts",
                    "print() function basics"
                ]
            }
        ]
    },
    "Python Basics": {
        difficulty: { level: "Beginner", color: "bg-green-100 text-green-800" },
        topics: [
            {
                name: "Variables & Data Types",
                description: "Understanding variables, naming conventions, and basic data types",
                resources: [
                    { type: "video", title: "Python Variables Explained", url: "https://www.youtube.com/watch?v=cQT33yu9pY8" },
                    { type: "article", title: "Python Data Types", url: "https://realpython.com/python-data-types/" }
                ],
                keyPoints: [
                    "Variable assignment and naming rules",
                    "int, float, str, bool types",
                    "Type conversion and casting",
                    "Dynamic typing in Python"
                ]
            },
            {
                name: "Operators",
                description: "Arithmetic, comparison, logical, and assignment operators",
                resources: [
                    { type: "video", title: "Python Operators", url: "https://www.youtube.com/watch?v=v5MR5JnKcZI" },
                    { type: "article", title: "Python Operators Guide", url: "https://www.w3schools.com/python/python_operators.asp" }
                ],
                keyPoints: [
                    "Arithmetic: +, -, *, /, //, %, **",
                    "Comparison: ==, !=, <, >, <=, >=",
                    "Logical: and, or, not",
                    "Assignment: =, +=, -=, *=, etc."
                ]
            },
            {
                name: "Strings",
                description: "Working with text data and string manipulation",
                resources: [
                    { type: "video", title: "Python Strings", url: "https://www.youtube.com/watch?v=k9TUPpGqYTo" },
                    { type: "article", title: "String Methods", url: "https://realpython.com/python-strings/" }
                ],
                keyPoints: [
                    "String creation and indexing",
                    "String slicing",
                    "Common methods: upper(), lower(), strip(), split()",
                    "String formatting: f-strings, format()"
                ]
            },
            {
                name: "Input & Output",
                description: "Getting user input and displaying output",
                resources: [
                    { type: "video", title: "Python Input/Output", url: "https://www.youtube.com/watch?v=JR9yY5n7CfA" },
                    { type: "article", title: "Python I/O Tutorial", url: "https://www.programiz.com/python-programming/input-output-import" }
                ],
                keyPoints: [
                    "input() function",
                    "print() with multiple arguments",
                    "Formatting output",
                    "Reading/writing files basics"
                ]
            }
        ]
    },
    "Conditional Statements": {
        difficulty: { level: "Beginner", color: "bg-green-100 text-green-800" },
        topics: [
            {
                name: "If-Elif-Else Statements",
                description: "Conditional logic and decision making",
                resources: [
                    { type: "video", title: "Python Conditionals", url: "https://www.youtube.com/watch?v=DZwmZ8Usvnk" },
                    { type: "article", title: "If Statements Guide", url: "https://realpython.com/python-conditional-statements/" }
                ],
                keyPoints: [
                    "if statement syntax",
                    "elif for multiple conditions",
                    "else clause",
                    "Nested conditionals",
                    "Ternary operator"
                ]
            },
            {
                name: "Comparison Operators",
                description: "Understanding comparison and logical operators",
                resources: [
                    { type: "video", title: "Python Operators", url: "https://www.youtube.com/watch?v=v5MR5JnKcZI" },
                    { type: "article", title: "Operators Guide", url: "https://www.w3schools.com/python/python_operators.asp" }
                ],
                keyPoints: [
                    "==, !=, <, >, <=, >= operators",
                    "Logical operators: and, or, not",
                    "Membership: in, not in",
                    "Identity: is, is not",
                    "Combining conditions"
                ]
            },
            {
                name: "Truthy and Falsy Values",
                description: "Understanding boolean context in Python",
                resources: [
                    { type: "video", title: "Python Booleans", url: "https://www.youtube.com/watch?v=9OK32jb_TdI" },
                    { type: "article", title: "Truth Value Testing", url: "https://docs.python.org/3/library/stdtypes.html#truth-value-testing" }
                ],
                keyPoints: [
                    "Falsy values: None, False, 0, empty sequences",
                    "Truthy values: everything else",
                    "Using bool() function",
                    "Short-circuit evaluation"
                ]
            }
        ]
    },
    "Data Structures": {
        difficulty: { level: "Beginner", color: "bg-green-100 text-green-800" },
        topics: [
            {
                name: "Lists",
                description: "Ordered, mutable sequences",
                resources: [
                    { type: "video", title: "Python Lists", url: "https://www.youtube.com/watch?v=ohCDWZgNIU0" },
                    { type: "article", title: "Lists Tutorial", url: "https://realpython.com/python-lists-tuples/" }
                ],
                keyPoints: [
                    "Creating and accessing lists",
                    "List methods: append(), extend(), insert(), remove()",
                    "List slicing",
                    "List operations: +, *, in",
                    "Sorting: sort(), sorted()"
                ]
            },
            {
                name: "Tuples",
                description: "Ordered, immutable sequences",
                resources: [
                    { type: "video", title: "Python Tuples", url: "https://www.youtube.com/watch?v=NI26dqhs2Rk" },
                    { type: "article", title: "Tuples vs Lists", url: "https://realpython.com/python-lists-tuples/" }
                ],
                keyPoints: [
                    "Creating tuples",
                    "Tuple unpacking",
                    "When to use tuples vs lists",
                    "Named tuples"
                ]
            },
            {
                name: "Dictionaries",
                description: "Key-value pairs for fast lookups",
                resources: [
                    { type: "video", title: "Python Dictionaries", url: "https://www.youtube.com/watch?v=daefaLgNkw0" },
                    { type: "article", title: "Dictionaries Guide", url: "https://realpython.com/python-dicts/" }
                ],
                keyPoints: [
                    "Creating dictionaries",
                    "Accessing and modifying values",
                    "Dictionary methods: get(), keys(), values(), items()",
                    "Dictionary comprehensions",
                    "defaultdict and Counter"
                ]
            },
            {
                name: "Sets",
                description: "Unordered collections of unique elements",
                resources: [
                    { type: "video", title: "Python Sets", url: "https://www.youtube.com/watch?v=sBvaPopWOmQ" },
                    { type: "article", title: "Sets Tutorial", url: "https://realpython.com/python-sets/" }
                ],
                keyPoints: [
                    "Creating sets",
                    "Set operations: union, intersection, difference",
                    "Adding and removing elements",
                    "frozenset for immutable sets"
                ]
            }
        ]
    },
    "Loops": {
        difficulty: { level: "Beginner", color: "bg-green-100 text-green-800" },
        topics: [
            {
                name: "For Loops",
                description: "Iterating over sequences and ranges",
                resources: [
                    { type: "video", title: "Python For Loops", url: "https://www.youtube.com/watch?v=94UHCEmprCY" },
                    { type: "article", title: "For Loop Tutorial", url: "https://realpython.com/python-for-loop/" }
                ],
                keyPoints: [
                    "for loop syntax",
                    "range() function",
                    "Iterating over lists, strings, dictionaries",
                    "enumerate() and zip()",
                    "Loop control: break, continue"
                ]
            },
            {
                name: "While Loops",
                description: "Loops based on conditions",
                resources: [
                    { type: "video", title: "Python While Loops", url: "https://www.youtube.com/watch?v=6iF8Xb7Z3wQ" },
                    { type: "article", title: "While Loop Guide", url: "https://www.w3schools.com/python/python_while_loops.asp" }
                ],
                keyPoints: [
                    "while loop syntax",
                    "Loop conditions",
                    "Infinite loops and how to avoid them",
                    "else clause with loops"
                ]
            },
            {
                name: "Comprehensions",
                description: "List, dict, and set comprehensions for concise code",
                resources: [
                    { type: "video", title: "List Comprehensions", url: "https://www.youtube.com/watch?v=AhSvKGTh28Q" },
                    { type: "article", title: "Comprehensions Guide", url: "https://realpython.com/list-comprehension-python/" }
                ],
                keyPoints: [
                    "List comprehensions",
                    "Dictionary comprehensions",
                    "Set comprehensions",
                    "Conditional comprehensions",
                    "Nested comprehensions"
                ]
            }
        ]
    },
    "Functions": {
        difficulty: { level: "Intermediate", color: "bg-yellow-100 text-yellow-800" },
        topics: [
            {
                name: "Function Basics",
                description: "Defining and calling functions",
                resources: [
                    { type: "video", title: "Python Functions", url: "https://www.youtube.com/watch?v=9Os0o3wzS_I" },
                    { type: "article", title: "Functions Tutorial", url: "https://realpython.com/defining-your-own-python-function/" }
                ],
                keyPoints: [
                    "def keyword",
                    "Parameters and arguments",
                    "Return values",
                    "Docstrings",
                    "Default parameters"
                ]
            },
            {
                name: "Args & Kwargs",
                description: "Variable-length arguments",
                resources: [
                    { type: "video", title: "*args and **kwargs", url: "https://www.youtube.com/watch?v=kB829ciAXo4" },
                    { type: "article", title: "Args & Kwargs Explained", url: "https://realpython.com/python-kwargs-and-args/" }
                ],
                keyPoints: [
                    "*args for variable positional arguments",
                    "**kwargs for variable keyword arguments",
                    "Combining regular, *args, **kwargs",
                    "Unpacking with * and **"
                ]
            },
            {
                name: "Lambda Functions",
                description: "Anonymous functions for simple operations",
                resources: [
                    { type: "video", title: "Lambda Functions", url: "https://www.youtube.com/watch?v=25ovCm9jKfA" },
                    { type: "article", title: "Lambda Guide", url: "https://realpython.com/python-lambda/" }
                ],
                keyPoints: [
                    "Lambda syntax",
                    "When to use lambdas",
                    "Using with map(), filter(), reduce()",
                    "Limitations of lambdas"
                ]
            },
            {
                name: "Scope & Closures",
                description: "Variable scope and nested functions",
                resources: [
                    { type: "video", title: "Python Scope", url: "https://www.youtube.com/watch?v=QVdf0LgmICw" },
                    { type: "article", title: "Scope & Closures", url: "https://realpython.com/python-scope-legb-rule/" }
                ],
                keyPoints: [
                    "Local vs global scope",
                    "global and nonlocal keywords",
                    "Closures and nested functions",
                    "LEGB rule"
                ]
            },
            {
                name: "Decorators",
                description: "Modifying function behavior",
                resources: [
                    { type: "video", title: "Python Decorators", url: "https://www.youtube.com/watch?v=FsAPt_9Bf3U" },
                    { type: "article", title: "Decorators Primer", url: "https://realpython.com/primer-on-python-decorators/" }
                ],
                keyPoints: [
                    "Function decorators",
                    "@decorator syntax",
                    "Creating custom decorators",
                    "functools.wraps",
                    "Common decorators: @property, @staticmethod, @classmethod"
                ]
            }
        ]
    },
    "Object-Oriented Programming": {
        difficulty: { level: "Intermediate", color: "bg-yellow-100 text-yellow-800" },
        topics: [
            {
                name: "Classes & Objects",
                description: "Introduction to OOP concepts",
                resources: [
                    { type: "video", title: "Python OOP Tutorial", url: "https://www.youtube.com/watch?v=JeznW_7DlB0" },
                    { type: "article", title: "OOP in Python", url: "https://realpython.com/python3-object-oriented-programming/" }
                ],
                keyPoints: [
                    "Defining classes",
                    "Creating objects/instances",
                    "__init__ constructor",
                    "Instance vs class attributes",
                    "self parameter"
                ]
            },
            {
                name: "Methods",
                description: "Instance, class, and static methods",
                resources: [
                    { type: "video", title: "Class vs Static Methods", url: "https://www.youtube.com/watch?v=rq8cL2XMM5M" },
                    { type: "article", title: "Instance vs Class vs Static Methods", url: "https://realpython.com/instance-class-and-static-methods-demystified/" }
                ],
                keyPoints: [
                    "Instance methods",
                    "Class methods with @classmethod",
                    "Static methods with @staticmethod",
                    "Special/magic methods (__str__, __repr__)"
                ]
            },
            {
                name: "Inheritance",
                description: "Creating class hierarchies",
                resources: [
                    { type: "video", title: "Python Inheritance", url: "https://www.youtube.com/watch?v=Cn7AkDb4pIU" },
                    { type: "article", title: "Inheritance Guide", url: "https://realpython.com/inheritance-composition-python/" }
                ],
                keyPoints: [
                    "Parent and child classes",
                    "Method overriding",
                    "super() function",
                    "Multiple inheritance",
                    "Method Resolution Order (MRO)"
                ]
            },
            {
                name: "Encapsulation & Abstraction",
                description: "Data hiding and abstract classes",
                resources: [
                    { type: "video", title: "Python Encapsulation", url: "https://www.youtube.com/watch?v=0Hr9Q5cdTZ8" },
                    { type: "article", title: "OOP Concepts", url: "https://realpython.com/python3-object-oriented-programming/" }
                ],
                keyPoints: [
                    "Public, protected, private attributes",
                    "Property decorators",
                    "Abstract base classes (ABC)",
                    "Interfaces in Python"
                ]
            },
            {
                name: "Polymorphism",
                description: "Using objects of different types uniformly",
                resources: [
                    { type: "video", title: "Python Polymorphism", url: "https://www.youtube.com/watch?v=CtCJCrPPXGM" },
                    { type: "article", title: "Polymorphism in Python", url: "https://www.programiz.com/python-programming/polymorphism" }
                ],
                keyPoints: [
                    "Duck typing",
                    "Operator overloading",
                    "Method overriding",
                    "Type hints and protocols"
                ]
            }
        ]
    },
    "File Handling": {
        difficulty: { level: "Intermediate", color: "bg-yellow-100 text-yellow-800" },
        topics: [
            {
                name: "Reading & Writing Files",
                description: "Working with text files",
                resources: [
                    { type: "video", title: "Python File Handling", url: "https://www.youtube.com/watch?v=Uh2ebFW8OYM" },
                    { type: "article", title: "Reading and Writing Files", url: "https://realpython.com/read-write-files-python/" }
                ],
                keyPoints: [
                    "open() function",
                    "Reading: read(), readline(), readlines()",
                    "Writing: write(), writelines()",
                    "Context managers (with statement)"
                ]
            },
            {
                name: "Working with Paths",
                description: "File system operations",
                resources: [
                    { type: "video", title: "Python pathlib", url: "https://www.youtube.com/watch?v=UcKkmwaRbsQ" },
                    { type: "article", title: "Python pathlib Guide", url: "https://realpython.com/python-pathlib/" }
                ],
                keyPoints: [
                    "os and pathlib modules",
                    "Checking file existence",
                    "Creating directories",
                    "Listing directory contents"
                ]
            },
            {
                name: "CSV & JSON",
                description: "Working with structured data formats",
                resources: [
                    { type: "video", title: "Working with CSV and JSON", url: "https://www.youtube.com/watch?v=q5uM4VKywbA" },
                    { type: "article", title: "CSV and JSON in Python", url: "https://realpython.com/python-json/" }
                ],
                keyPoints: [
                    "csv module for CSV files",
                    "json module for JSON data",
                    "Reading and writing CSV",
                    "Parsing and serializing JSON"
                ]
            }
        ]
    },
    "Error Handling": {
        difficulty: { level: "Intermediate", color: "bg-yellow-100 text-yellow-800" },
        topics: [
            {
                name: "Exceptions",
                description: "Understanding and handling errors",
                resources: [
                    { type: "video", title: "Python Exception Handling", url: "https://www.youtube.com/watch?v=NIWwJbo-9_8" },
                    { type: "article", title: "Exception Handling Tutorial", url: "https://realpython.com/python-exceptions/" }
                ],
                keyPoints: [
                    "Common exceptions: ValueError, TypeError, KeyError",
                    "try-except blocks",
                    "except with specific exceptions",
                    "else and finally clauses"
                ]
            },
            {
                name: "Raising Exceptions",
                description: "Creating and raising custom errors",
                resources: [
                    { type: "video", title: "Raising Exceptions", url: "https://www.youtube.com/watch?v=ZsvftkbbrR0" },
                    { type: "article", title: "Custom Exceptions", url: "https://realpython.com/python-exceptions/" }
                ],
                keyPoints: [
                    "raise keyword",
                    "Creating custom exceptions",
                    "Exception chaining",
                    "Best practices for error handling"
                ]
            }
        ]
    },
    "Modules & Packages": {
        difficulty: { level: "Intermediate", color: "bg-yellow-100 text-yellow-800" },
        topics: [
            {
                name: "Importing Modules",
                description: "Using Python's module system",
                resources: [
                    { type: "video", title: "Python Modules", url: "https://www.youtube.com/watch?v=CqvZ3vGoGs0" },
                    { type: "article", title: "Python Modules Tutorial", url: "https://realpython.com/python-modules-packages/" }
                ],
                keyPoints: [
                    "import statement",
                    "from...import syntax",
                    "import...as aliases",
                    "Standard library overview"
                ]
            },
            {
                name: "Creating Modules",
                description: "Organizing code into modules",
                resources: [
                    { type: "video", title: "Creating Python Modules", url: "https://www.youtube.com/watch?v=sugvnHA7ElY" },
                    { type: "article", title: "Python Packages", url: "https://realpython.com/python-modules-packages/" }
                ],
                keyPoints: [
                    "Creating .py module files",
                    "__name__ == '__main__'",
                    "Module search path",
                    "__init__.py for packages"
                ]
            },
            {
                name: "Virtual Environments",
                description: "Managing project dependencies",
                resources: [
                    { type: "video", title: "Python Virtual Environments", url: "https://www.youtube.com/watch?v=APOPm01BVrk" },
                    { type: "article", title: "Virtual Environments Guide", url: "https://realpython.com/python-virtual-environments-a-primer/" }
                ],
                keyPoints: [
                    "Why use virtual environments",
                    "venv module",
                    "pip for package installation",
                    "requirements.txt"
                ]
            }
        ]
    },
    "Advanced Concepts": {
        difficulty: { level: "Advanced", color: "bg-red-100 text-red-800" },
        topics: [
            {
                name: "Iterators & Generators",
                description: "Efficient iteration patterns",
                resources: [
                    { type: "video", title: "Python Generators", url: "https://www.youtube.com/watch?v=bD05uGo_sVI" },
                    { type: "article", title: "Iterators and Generators", url: "https://realpython.com/introduction-to-python-generators/" }
                ],
                keyPoints: [
                    "Iterator protocol (__iter__, __next__)",
                    "Generator functions with yield",
                    "Generator expressions",
                    "itertools module"
                ]
            },
            {
                name: "Context Managers",
                description: "Resource management with 'with' statement",
                resources: [
                    { type: "video", title: "Context Managers", url: "https://www.youtube.com/watch?v=-aKFBoZpiqA" },
                    { type: "article", title: "Context Managers Tutorial", url: "https://realpython.com/python-with-statement/" }
                ],
                keyPoints: [
                    "__enter__ and __exit__ methods",
                    "contextlib module",
                    "@contextmanager decorator",
                    "Creating custom context managers"
                ]
            },
            {
                name: "Regular Expressions",
                description: "Pattern matching with regex",
                resources: [
                    { type: "video", title: "Python Regex", url: "https://www.youtube.com/watch?v=K8L6KVGG-7o" },
                    { type: "article", title: "Regular Expressions Guide", url: "https://realpython.com/regex-python/" }
                ],
                keyPoints: [
                    "re module",
                    "Common patterns and metacharacters",
                    "match(), search(), findall(), sub()",
                    "Regex groups and capturing"
                ]
            },
            {
                name: "Multithreading & Multiprocessing",
                description: "Concurrent and parallel execution",
                resources: [
                    { type: "video", title: "Threading vs Multiprocessing", url: "https://www.youtube.com/watch?v=IEEhzQoKtQU" },
                    { type: "article", title: "Concurrency in Python", url: "https://realpython.com/python-concurrency/" }
                ],
                keyPoints: [
                    "threading module",
                    "multiprocessing module",
                    "GIL (Global Interpreter Lock)",
                    "When to use threads vs processes",
                    "concurrent.futures"
                ]
            },
            {
                name: "Async/Await",
                description: "Asynchronous programming",
                resources: [
                    { type: "video", title: "Async IO in Python", url: "https://www.youtube.com/watch?v=t5Bo1Je9EmE" },
                    { type: "article", title: "Async IO Tutorial", url: "https://realpython.com/async-io-python/" }
                ],
                keyPoints: [
                    "async and await keywords",
                    "asyncio module",
                    "Coroutines",
                    "Event loops",
                    "async for and async with"
                ]
            }
        ]
    },
    "Testing & Debugging": {
        difficulty: { level: "Advanced", color: "bg-red-100 text-red-800" },
        topics: [
            {
                name: "Unit Testing",
                description: "Writing tests for your code",
                resources: [
                    { type: "video", title: "Python Unit Testing", url: "https://www.youtube.com/watch?v=6tNS--WetLI" },
                    { type: "article", title: "Getting Started With Testing", url: "https://realpython.com/python-testing/" }
                ],
                keyPoints: [
                    "unittest module",
                    "pytest framework",
                    "Test cases and assertions",
                    "Test fixtures and setup",
                    "Mocking with unittest.mock"
                ]
            },
            {
                name: "Debugging",
                description: "Finding and fixing bugs",
                resources: [
                    { type: "video", title: "Python Debugging", url: "https://www.youtube.com/watch?v=5AYIe-3cD-s" },
                    { type: "article", title: "Python Debugging Guide", url: "https://realpython.com/python-debug-idle/" }
                ],
                keyPoints: [
                    "pdb debugger",
                    "Breakpoints and stepping",
                    "print debugging",
                    "Logging module",
                    "IDE debugging tools"
                ]
            }
        ]
    },
    "Popular Libraries": {
        difficulty: { level: "Advanced", color: "bg-red-100 text-red-800" },
        topics: [
            {
                name: "NumPy",
                description: "Numerical computing with arrays",
                resources: [
                    { type: "video", title: "NumPy Tutorial", url: "https://www.youtube.com/watch?v=QUT1VHiLmmI" },
                    { type: "article", title: "NumPy Quickstart", url: "https://numpy.org/doc/stable/user/quickstart.html" }
                ],
                keyPoints: [
                    "NumPy arrays",
                    "Array operations",
                    "Broadcasting",
                    "Linear algebra basics"
                ]
            },
            {
                name: "Pandas",
                description: "Data manipulation and analysis",
                resources: [
                    { type: "video", title: "Pandas Tutorial", url: "https://www.youtube.com/watch?v=vmEHCJofslg" },
                    { type: "article", title: "Pandas Guide", url: "https://realpython.com/pandas-python-explore-dataset/" }
                ],
                keyPoints: [
                    "DataFrames and Series",
                    "Reading CSV, Excel files",
                    "Data filtering and grouping",
                    "Data cleaning and transformation"
                ]
            },
            {
                name: "Requests",
                description: "HTTP library for API calls",
                resources: [
                    { type: "video", title: "Python Requests", url: "https://www.youtube.com/watch?v=tb8gHvYlCFs" },
                    { type: "article", title: "Requests Tutorial", url: "https://realpython.com/python-requests/" }
                ],
                keyPoints: [
                    "Making GET and POST requests",
                    "Handling responses",
                    "Working with JSON APIs",
                    "Authentication"
                ]
            },
            {
                name: "Flask/FastAPI",
                description: "Web frameworks for building APIs",
                resources: [
                    { type: "video", title: "FastAPI Tutorial", url: "https://www.youtube.com/watch?v=0sOvCWFmrtA" },
                    { type: "article", title: "Flask Mega-Tutorial", url: "https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-i-hello-world" }
                ],
                keyPoints: [
                    "Creating web servers",
                    "Routes and endpoints",
                    "Request/response handling",
                    "RESTful API design"
                ]
            }
        ]
    },
    "Best Practices": {
        difficulty: { level: "Advanced", color: "bg-red-100 text-red-800" },
        topics: [
            {
                name: "PEP 8 Style Guide",
                description: "Python coding conventions",
                resources: [
                    { type: "video", title: "PEP 8 Tutorial", url: "https://www.youtube.com/watch?v=D4_s3q038I0" },
                    { type: "article", title: "PEP 8 Guide", url: "https://pep8.org/" }
                ],
                keyPoints: [
                    "Naming conventions",
                    "Code layout and indentation",
                    "Comments and docstrings",
                    "Using linters: pylint, flake8, black"
                ]
            },
            {
                name: "Type Hints",
                description: "Static type checking in Python",
                resources: [
                    { type: "video", title: "Type Hints Tutorial", url: "https://www.youtube.com/watch?v=QORvB-_mbZ0" },
                    { type: "article", title: "Python Type Checking", url: "https://realpython.com/python-type-checking/" }
                ],
                keyPoints: [
                    "Type annotations",
                    "typing module",
                    "mypy for type checking",
                    "Optional, Union, List, Dict types"
                ]
            },
            {
                name: "Performance Optimization",
                description: "Making Python code faster",
                resources: [
                    { type: "video", title: "Python Performance Tips", url: "https://www.youtube.com/watch?v=YY7yJHo0M5I" },
                    { type: "article", title: "Optimization Tips", url: "https://realpython.com/python-performance/" }
                ],
                keyPoints: [
                    "Profiling with cProfile",
                    "List comprehensions vs loops",
                    "Using built-in functions",
                    "Caching with lru_cache"
                ]
            }
        ]
    }
};
