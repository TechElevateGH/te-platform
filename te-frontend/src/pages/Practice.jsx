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
} from '@heroicons/react/24/outline'

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
        icon: SparklesIcon,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        url: 'https://neetcode.io/roadmap',
        actionLabel: 'Explore NeetCode roadmap',
        chips: ['Array patterns', 'Two pointers', 'Sliding window', 'Graph traversal']
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
        icon: ClipboardDocumentCheckIcon,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        url: 'https://docs.google.com/spreadsheets/d/1Oe9pP9PracticeTemplate',
        actionLabel: 'Download revision tracker',
        chips: ['0-24-72 hour loop', 'Solution blocks', 'Notebook snapshots']
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
        icon: DocumentMagnifyingGlassIcon,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        url: 'https://pythontutor.com/visualize.html#mode=edit',
        actionLabel: 'Open Python Tutor',
        chips: ['Pointer tracing', 'State diagrams', 'Recursion trees']
    }
];

const companionTips = [
    {
        id: 'language',
        title: 'Choose your language wisely',
        description: 'Practice in the language you are most fluent in so that syntax never slows you down. We recommend Python because its expressive syntax lets you focus on the algorithm, but do not switch if another language already feels natural.',
        icon: CodeBracketIcon,
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-700'
    },
    {
        id: 'solutions',
        title: 'Study solutions with intention',
        description: 'Do not fear looking at official solutions or walkthrough videos. Most interview algorithms are classical. Study the answer quickly, note the core building blocks, and then rebuild them without peeking.',
        icon: VideoCameraIcon,
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600'
    },
    {
        id: 'patterns',
        title: 'Spot the shared patterns',
        description: 'Group problems by technique. For every new question, ask yourself which pattern family it fits and which code block you can reuse. The goal is to reduce every problem to a familiar template.',
        icon: ArrowsRightLeftIcon,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600'
    },
    {
        id: 'notes',
        title: 'Maintain a revision vault',
        description: 'Bookmark solved problems, jot down the mistakes you made, and schedule a quick re-implementation session. Repeated exposure cements the knowledge far faster than grinding brand-new problems nonstop.',
        icon: BookmarkIcon,
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600'
    }
];

const Practice = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <header className="bg-white/70 backdrop-blur border-b border-slate-200 dark:bg-slate-900/70 dark:border-slate-800">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                    <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Practice Vault</span>
                    <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Practice smarter, not harder</h1>
                    <p className="mt-2 text-sm text-slate-600 max-w-2xl dark:text-slate-300">
                        Focus on the exact resources we trust, revise relentlessly, and build confidence through patterns—not endless blind grinding.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12 text-slate-900 dark:text-slate-100">
                {resourceCategories.length > 0 && (
                    <section className="space-y-6">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Recommended path</span>
                            <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Core resources we actually use</h2>
                            <p className="mt-2 text-sm text-slate-600 max-w-3xl dark:text-slate-300">
                                Every card is a focused starting point. Sprint through the NeetCode roadmap, revise aggressively, visualize your logic, and keep learning loops lightweight.
                            </p>
                        </div>
                        <div className="grid gap-5 md:grid-cols-2">
                            {resourceCategories.map((category) => {
                                const Icon = category.icon;
                                return (
                                    <article
                                        key={category.id}
                                        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80"
                                    >
                                        <div className="p-6 space-y-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${category.iconBg} dark:bg-slate-800/70`}>
                                                    <Icon className={`h-6 w-6 ${category.iconColor} dark:text-slate-200`} />
                                                </div>
                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                                                    {category.badge}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{category.title}</h3>
                                                <p className="mt-2 text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                                                    {category.description}
                                                </p>
                                            </div>
                                            <ul className="space-y-3">
                                                {category.callouts.map((callout, index) => (
                                                    <li key={index} className="flex items-start gap-3">
                                                        <div className="mt-1 flex h-2.5 w-2.5 flex-shrink-0 items-center justify-center rounded-full bg-slate-400 dark:bg-slate-500" />
                                                        <p className="text-sm text-slate-700 leading-relaxed dark:text-slate-200">{callout}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="flex flex-wrap gap-2">
                                                {category.chips.map((chip) => (
                                                    <span key={chip} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                                                        {chip}
                                                    </span>
                                                ))}
                                            </div>
                                            <div>
                                                <a
                                                    href={category.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white"
                                                >
                                                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                                    {category.actionLabel}
                                                </a>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

                {companionTips.length > 0 && (
                    <section className="space-y-6">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Practice principles</span>
                            <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Keep these mindsets in rotation</h2>
                            <p className="mt-2 text-sm text-slate-600 max-w-3xl dark:text-slate-300">
                                Use these reminders to prevent burnout, stay confident, and learn faster than the average grinder.
                            </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {companionTips.map((tip) => {
                                const Icon = tip.icon;
                                return (
                                    <div
                                        key={tip.id}
                                        className="flex gap-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80"
                                    >
                                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${tip.iconBg} dark:bg-slate-800/70`}>
                                            <Icon className={`h-6 w-6 ${tip.iconColor} dark:text-slate-200`} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{tip.title}</h3>
                                            <p className="mt-1 text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                                                {tip.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-8 shadow-lg dark:border-slate-800">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <LightBulbIcon className="h-6 w-6 text-amber-300" />
                            <h2 className="text-xl font-semibold text-white">Revision is everything</h2>
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed">
                            The strongest candidates are shamelessly efficient learners. When a problem stalls you, peek at the editorial, learn the blocks, and rebuild them from scratch later. Use Python Tutor to visualize recursion and pointer movement. Track every revisit with a simple spreadsheet so nothing slips.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href="https://neetcode.io/roadmap"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                            >
                                <SparklesIcon className="h-4 w-4" />
                                NeetCode Easy + Medium first
                            </a>
                            <a
                                href="https://pythontutor.com/visualize.html#mode=edit"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                            >
                                <DocumentMagnifyingGlassIcon className="h-4 w-4" />
                                Visualize every tricky run
                            </a>
                            <a
                                href="https://docs.google.com/spreadsheets/d/1Oe9pP9PracticeTemplate"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                            >
                                <ClipboardDocumentCheckIcon className="h-4 w-4" />
                                Use the revision tracker
                            </a>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}

export default Practice;
