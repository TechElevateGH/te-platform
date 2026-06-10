import {
    ArrowTopRightOnSquareIcon,
    SparklesIcon,
    CodeBracketIcon,
    VideoCameraIcon,
    DocumentMagnifyingGlassIcon,
    ArrowsRightLeftIcon,
    LightBulbIcon,
    BookmarkIcon,
    ClipboardDocumentCheckIcon
} from 'icons'

const resourceCategories = [
    {
        id: 'foundation',
        title: 'Learning Patterns',
        description: 'Master the NeetCode 150 roadmap (Easy + Medium) to internalize every core pattern before touching harder sets.',
        callouts: [
            'Start with NeetCode 150 Easy + Medium. Repeat patterns until you can explain them without notes.',
            'Graduate to NeetCode "All Easy + Medium" with a sprinkling of hard problems once you breeze through the 150 set.'
        ],
        badge: 'Start here',
        difficulty: 'Easy → Medium',
        icon: SparklesIcon,
        url: 'https://neetcode.io/roadmap',
        actionLabel: 'Explore NeetCode roadmap',
        chips: ['Array patterns', 'Two pointers', 'Sliding window', 'Graph traversal'],
        snippet: 'for pattern in roadmap:\n    solve(pattern.easy)\n    revise(+24h, +72h, +7d)'
    },
    {
        id: 'revision',
        title: 'Constant Revision',
        description: 'Revision. Revision. Revision. Rebuild solutions from memory within 24 hours, 3 days, and 1 week.',
        callouts: [
            'Avoid grinding a single question for hours; if you are stuck, review the editorial or video quickly, understand blocks of logic, and then rewrite it from scratch.',
            'Curate code blocks for common subroutines (reverse linked list, binary search template, BFS queue pattern) and drill them until they become second nature.'
        ],
        badge: 'Critical habit',
        difficulty: 'Medium',
        icon: ClipboardDocumentCheckIcon,
        url: 'https://docs.google.com/spreadsheets/d/1Oe9pP9PracticeTemplate',
        actionLabel: 'Download revision tracker',
        chips: ['0-24-72 hour loop', 'Solution blocks', 'Notebook snapshots'],
        snippet: 'if stuck > 20_min:\n    read_editorial()\n    rebuild_without_peeking()'
    },
    {
        id: 'visual',
        title: 'Visualize & Iterate',
        description: 'See your code run step by step. Visual tools help you catch pointer mistakes and understand state transitions.',
        callouts: [
            'Use Python Tutor to step through recursion, pointer movement, and dynamic programming tables.',
            'Keep a literal whiteboard or digital canvas open; diagram the input transformation before coding to cut down on trial-and-error.'
        ],
        badge: 'Stay curious',
        difficulty: 'Hard prep',
        icon: DocumentMagnifyingGlassIcon,
        url: 'https://pythontutor.com/visualize.html#mode=edit',
        actionLabel: 'Open Python Tutor',
        chips: ['Pointer tracing', 'State diagrams', 'Recursion trees'],
        snippet: 'trace = run(sample_input)\nassert state_changes_are_visible(trace)'
    }
];

const companionTips = [
    {
        id: 'language',
        title: 'Choose your language wisely',
        description: 'Practice in the language you are most fluent in so that syntax never slows you down. We recommend Python because its expressive syntax lets you focus on the algorithm, but do not switch if another language already feels natural.',
        icon: CodeBracketIcon
    },
    {
        id: 'solutions',
        title: 'Study solutions with intention',
        description: 'Do not fear looking at official solutions or walkthrough videos. Most interview algorithms are classical. Study the answer quickly, note the core building blocks, and then rebuild them without peeking.',
        icon: VideoCameraIcon
    },
    {
        id: 'patterns',
        title: 'Spot the shared patterns',
        description: 'Group problems by technique. For every new question, ask yourself which pattern family it fits and which code block you can reuse. The goal is to reduce every problem to a familiar template.',
        icon: ArrowsRightLeftIcon
    },
    {
        id: 'notes',
        title: 'Maintain a revision vault',
        description: 'Bookmark solved problems, jot down the mistakes you made, and schedule a quick re-implementation session. Repeated exposure cements the knowledge far faster than grinding new problems nonstop.',
        icon: BookmarkIcon
    }
];

const practiceStats = [
    { label: 'core track', value: '150', icon: SparklesIcon },
    { label: 'revision loop', value: '24/72/7', icon: ClipboardDocumentCheckIcon },
    { label: 'debug mode', value: 'visual', icon: DocumentMagnifyingGlassIcon },
    { label: 'target level', value: 'offer', icon: CodeBracketIcon }
]

const difficultyChipClass = (difficulty) => {
    const normalized = difficulty.toLowerCase()
    if (normalized.includes('hard')) return 'te-chip-red'
    if (normalized.includes('medium')) return 'te-chip-gold'
    if (normalized.includes('easy')) return 'te-chip-green'
    return 'te-chip'
}

const Practice = () => {
    return (
        <div className="min-h-screen bg-[var(--te-bg)]">
            <header className="border-b border-[var(--te-border)] bg-[var(--te-bg)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <span className="te-eyebrow">{'// practice'}</span>
                            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--te-text)] sm:text-4xl">
                                Practice like an engineer.
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--te-text-dim)] sm:text-base">
                                A lean coding-prep cockpit for patterns, revision loops, visual debugging, and reusable solution blocks.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <a href="https://neetcode.io/roadmap" target="_blank" rel="noopener noreferrer" className="te-btn-primary te-btn-sm">
                                Open roadmap <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                            </a>
                            <a href="https://pythontutor.com/visualize.html#mode=edit" target="_blank" rel="noopener noreferrer" className="te-btn-secondary te-btn-sm">
                                Visualize
                            </a>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="inline-flex rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-1 font-mono text-sm">
                            {['Patterns', 'Revision', 'Trace'].map((item, index) => (
                                <button
                                    key={item}
                                    className={`rounded-md px-3 py-1.5 transition-colors ${index === 0 ? 'bg-[var(--te-surface)] text-[var(--te-text)] shadow-sm' : 'text-[var(--te-text-dim)] hover:text-[var(--te-text)]'}`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-2 font-mono text-xs sm:flex">
                            {['Easy', 'Medium', 'Hard'].map((difficulty) => (
                                <span key={difficulty} className={`${difficultyChipClass(difficulty)} justify-center`}>{difficulty}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-[var(--te-text)]">
                <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--te-border)] bg-[var(--te-border)] lg:grid-cols-4">
                    {practiceStats.map((stat, index) => {
                        const Icon = stat.icon
                        const accentClass = index % 2 === 0 ? 'text-te-green' : 'text-te-gold'
                        return (
                            <div key={stat.label} className="bg-[var(--te-surface)] p-4">
                                <Icon className={`h-4 w-4 ${accentClass}`} />
                                <div className={`mt-2 font-mono text-2xl font-bold ${accentClass}`}>{stat.value}</div>
                                <div className="mt-1 text-xs text-[var(--te-text-dim)]">{stat.label}</div>
                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--te-surface-alt)]">
                                    <div className="h-full rounded-full bg-[var(--te-green)]" style={{ width: `${Math.max(55, 88 - index * 10)}%` }} />
                                </div>
                            </div>
                        )
                    })}
                </section>

                {resourceCategories.length > 0 && (
                    <section className="mt-8">
                        <div className="max-w-3xl">
                            <span className="te-eyebrow">{'// recommended path'}</span>
                            <h2 className="mt-2 text-xl font-bold tracking-tight text-[var(--te-text)]">Core resources we actually use</h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--te-text-dim)]">
                                Sprint through the roadmap, revise aggressively, visualize tricky state, and keep every learning loop lightweight.
                            </p>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-3">
                            {resourceCategories.map((category) => {
                                const Icon = category.icon;
                                return (
                                    <article key={category.id} className="te-card-interactive overflow-hidden">
                                        <div className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] px-5 py-3">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface)]">
                                                        <Icon className="h-5 w-5 text-[var(--te-text)]" />
                                                    </div>
                                                    <span className="te-eyebrow">{category.badge}</span>
                                                </div>
                                                <div className="flex flex-wrap justify-end gap-1.5">
                                                    {category.difficulty.split(' → ').map((difficulty) => (
                                                        <span key={difficulty} className={`${difficultyChipClass(difficulty)} font-mono`}>{difficulty}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-lg font-semibold text-[var(--te-text)]">{category.title}</h3>
                                            <p className="mt-2 text-sm leading-6 text-[var(--te-text-dim)]">{category.description}</p>

                                            <pre className="mt-4 overflow-x-auto rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-4 font-mono text-xs leading-6 text-[var(--te-text-dim)]"><code>{category.snippet}</code></pre>

                                            <ul className="mt-4 space-y-2">
                                                {category.callouts.map((callout, index) => (
                                                    <li key={index} className="flex gap-2 text-sm leading-6 text-[var(--te-text-dim)]">
                                                        <span className="select-none font-mono text-[var(--te-text)]">{String(index + 1).padStart(2, '0')}</span>
                                                        <span>{callout}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className="mt-4 flex flex-wrap gap-1.5">
                                                {category.chips.map((chip) => (
                                                    <span key={chip} className="te-badge font-mono">{chip}</span>
                                                ))}
                                            </div>

                                            <a href={category.url} target="_blank" rel="noopener noreferrer" className="mt-5 te-btn-secondary te-btn-sm">
                                                {category.actionLabel} <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                            </a>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

                {companionTips.length > 0 && (
                    <section className="mt-8">
                        <div className="max-w-3xl">
                            <span className="te-eyebrow">{'// practice principles'}</span>
                            <h2 className="mt-2 text-xl font-bold tracking-tight text-[var(--te-text)]">Keep these mindsets in rotation</h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--te-text-dim)]">
                                Use these reminders to prevent burnout, stay confident, and learn faster than the average grinder.
                            </p>
                        </div>
                        <div className="mt-4 grid grid-cols-1 border-l border-t border-[var(--te-border)] md:grid-cols-2">
                            {companionTips.map((tip, index) => {
                                const Icon = tip.icon;
                                return (
                                    <article key={tip.id} className="border-b border-r border-[var(--te-border)] bg-[var(--te-surface)] p-5 transition-colors hover:bg-[var(--te-hover)]">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                                <Icon className="h-5 w-5 text-[var(--te-text)]" />
                                            </div>
                                            <div>
                                                <div className="font-mono text-xs text-[var(--te-text-dim)]">{String(index + 1).padStart(2, '0')}</div>
                                                <h3 className="mt-1 text-base font-semibold text-[var(--te-text)]">{tip.title}</h3>
                                                <p className="mt-2 text-sm leading-6 text-[var(--te-text-dim)]">{tip.description}</p>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section className="mt-8 te-panel overflow-hidden">
                    <div className="grid gap-px bg-[var(--te-border)] lg:grid-cols-[1fr_420px]">
                        <div className="bg-[var(--te-surface)] p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                    <LightBulbIcon className="h-5 w-5 text-[var(--te-text)]" />
                                </div>
                                <div>
                                    <span className="te-eyebrow">{'// terminal note'}</span>
                                    <h2 className="mt-1 text-lg font-semibold text-[var(--te-text)]">Revision is everything</h2>
                                </div>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-[var(--te-text-dim)]">
                                The strongest candidates are shamelessly efficient learners. When a problem stalls you, peek at the editorial, learn the blocks, and rebuild them from scratch later. Use Python Tutor to visualize recursion and pointer movement. Track every revisit with a simple spreadsheet so nothing slips.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <a href="https://neetcode.io/roadmap" target="_blank" rel="noopener noreferrer" className="te-chip hover:bg-[var(--te-hover)]">
                                    <SparklesIcon className="h-4 w-4" /> NeetCode Easy + Medium first
                                </a>
                                <a href="https://pythontutor.com/visualize.html#mode=edit" target="_blank" rel="noopener noreferrer" className="te-chip hover:bg-[var(--te-hover)]">
                                    <DocumentMagnifyingGlassIcon className="h-4 w-4" /> Visualize every tricky run
                                </a>
                                <a href="https://docs.google.com/spreadsheets/d/1Oe9pP9PracticeTemplate" target="_blank" rel="noopener noreferrer" className="te-chip hover:bg-[var(--te-hover)]">
                                    <ClipboardDocumentCheckIcon className="h-4 w-4" /> Use the revision tracker
                                </a>
                            </div>
                        </div>
                        <div className="bg-[var(--te-surface-alt)] p-6 font-mono text-xs leading-6 text-[var(--te-text-dim)]">
                            <div className="mb-3 flex items-center gap-2 border-b border-[var(--te-border)] pb-3">
                                <span className="h-2.5 w-2.5 rounded-full border border-[var(--te-border-strong)]" />
                                <span className="h-2.5 w-2.5 rounded-full border border-[var(--te-border-strong)]" />
                                <span className="h-2.5 w-2.5 rounded-full border border-[var(--te-border-strong)]" />
                                <span className="ml-2">~/practice-loop</span>
                            </div>
                            <p><span className="text-[var(--te-text)]">$</span> te practice --mode deliberate</p>
                            <p>load roadmap: neetcode_150</p>
                            <p>review cadence: 24h / 72h / 7d</p>
                            <p>debugger: python_tutor</p>
                            <p><span className="text-[var(--te-text)]">next:</span> rebuild from memory</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}

export default Practice;
