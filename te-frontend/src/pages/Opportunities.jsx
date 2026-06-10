import {
    BriefcaseIcon,
    BellIcon,
    SparklesIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    ClockIcon,
    BuildingOfficeIcon,
    AcademicCapIcon,
    CheckBadgeIcon
} from 'icons'

const platformSignals = [
    { label: 'curated roles', value: '120+', icon: BriefcaseIcon },
    { label: 'remote-first', value: '68%', icon: MapPinIcon },
    { label: 'verified companies', value: '40+', icon: CheckBadgeIcon },
    { label: 'launch status', value: 'soon', icon: ClockIcon }
]

const featurePreview = [
    {
        title: 'Curated Opportunities',
        description: 'Hand-picked job opportunities from top companies, vetted for quality and fit with your skills and experience.',
        icon: BriefcaseIcon
    },
    {
        title: 'Smart Notifications',
        description: 'Get instant alerts when new opportunities matching your preferences become available.',
        icon: BellIcon
    },
    {
        title: 'One-Click Apply',
        description: 'Apply to multiple opportunities quickly using your saved resumes and application materials.',
        icon: SparklesIcon
    },
    {
        title: 'Salary Insights',
        description: 'View transparent salary ranges and compensation details for informed decision-making.',
        icon: CurrencyDollarIcon
    },
    {
        title: 'Company Profiles',
        description: 'Research companies with detailed profiles, culture insights, and employee reviews.',
        icon: BuildingOfficeIcon
    },
    {
        title: 'Skills Matching',
        description: 'See how your skills align with job requirements and get recommendations for improvement.',
        icon: AcademicCapIcon
    }
]

const sampleJobs = [
    {
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        location: 'Remote',
        salary: '$120k - $180k',
        type: 'Full-time',
        tags: ['React', 'Node.js', 'AWS']
    },
    {
        title: 'Frontend Developer',
        company: 'StartupXYZ',
        location: 'New York, NY',
        salary: '$90k - $130k',
        type: 'Full-time',
        tags: ['React', 'TypeScript', 'CSS']
    },
    {
        title: 'Full Stack Engineer',
        company: 'Innovation Labs',
        location: 'San Francisco, CA',
        salary: '$110k - $160k',
        type: 'Full-time',
        tags: ['Python', 'React', 'PostgreSQL']
    }
]

const Opportunities = () => {
    return (
        <div className="min-h-screen bg-[var(--te-bg)]">
            <header className="border-b border-[var(--te-border)] bg-[var(--te-bg)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <span className="te-eyebrow">{'// opportunities'}</span>
                            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--te-text)] sm:text-4xl">
                                Job discovery, engineered.
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--te-text-dim)] sm:text-base">
                                A focused pipeline for vetted roles, company context, compensation signals, and fast applications.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="te-badge font-mono">
                                <ClockIcon className="h-4 w-4" /> coming soon
                            </span>
                            <button disabled className="te-btn-primary te-btn-sm cursor-not-allowed opacity-60">
                                Join waitlist
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative w-full lg:max-w-xl">
                            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--te-text-dim)]" />
                            <input
                                type="text"
                                placeholder="Search role, company, keyword…"
                                disabled
                                className="te-input pl-9 cursor-not-allowed opacity-75"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                            {['Remote', 'Full-time', 'Internship', 'New grad'].map((filter) => (
                                <button
                                    key={filter}
                                    disabled
                                    className="te-btn-secondary te-btn-sm cursor-not-allowed opacity-70"
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--te-border)] bg-[var(--te-border)] lg:grid-cols-4">
                    {platformSignals.map((signal) => {
                        const Icon = signal.icon
                        return (
                            <div key={signal.label} className="bg-[var(--te-surface)] p-4">
                                <Icon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                <div className="mt-2 font-mono text-2xl font-bold text-[var(--te-text)]">{signal.value}</div>
                                <div className="mt-1 text-xs text-[var(--te-text-dim)]">{signal.label}</div>
                            </div>
                        )
                    })}
                </section>

                <section className="mt-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="te-eyebrow">{'// preview'}</span>
                            <h2 className="mt-2 text-xl font-bold tracking-tight text-[var(--te-text)]">Sample opportunity feed</h2>
                            <p className="mt-1 text-sm text-[var(--te-text-dim)]">Flat, scannable cards built for quick role triage.</p>
                        </div>
                        <details className="relative w-full sm:w-auto">
                            <summary className="te-btn-secondary te-btn-sm list-none cursor-pointer select-none justify-between [&::-webkit-details-marker]:hidden">
                                Filters <span aria-hidden="true">⌄</span>
                            </summary>
                            <div className="absolute right-0 z-20 mt-2 w-56 te-card p-1 shadow-sm">
                                {['All roles', 'Remote only', 'Salary listed', 'Verified company'].map((item) => (
                                    <button key={item} disabled className="block w-full rounded-md px-3 py-2 text-left text-sm text-[var(--te-text-dim)] cursor-not-allowed hover:bg-[var(--te-hover)]">
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </details>
                    </div>

                    <div className="mt-4 grid gap-3">
                        {sampleJobs.map((job) => (
                            <article key={`${job.company}-${job.title}`} className="te-card-interactive p-4 opacity-75">
                                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)] font-mono text-sm font-bold text-[var(--te-text)] grayscale">
                                            {job.company.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-base font-semibold text-[var(--te-text)]">{job.title}</h3>
                                                <span className="te-chip font-mono">
                                                    <CheckBadgeIcon className="h-3.5 w-3.5" /> verified
                                                </span>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs text-[var(--te-text-dim)]">
                                                <span className="te-chip"><BuildingOfficeIcon className="h-3.5 w-3.5" />{job.company}</span>
                                                <span className="te-chip"><MapPinIcon className="h-3.5 w-3.5" />{job.location}</span>
                                                <span className="te-chip"><CurrencyDollarIcon className="h-3.5 w-3.5" />{job.salary}</span>
                                                <span className="te-chip"><ClockIcon className="h-3.5 w-3.5" />{job.type}</span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {job.tags.map((tag) => (
                                                    <span key={tag} className="te-badge font-mono">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button disabled className="te-btn-primary te-btn-sm cursor-not-allowed opacity-60 md:justify-self-end">
                                        Apply
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-8 grid grid-cols-1 border-l border-t border-[var(--te-border)] sm:grid-cols-2 lg:grid-cols-3">
                    {featurePreview.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <article key={feature.title} className="border-b border-r border-[var(--te-border)] bg-[var(--te-surface)] p-6 transition-colors hover:bg-[var(--te-hover)]">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)] text-[var(--te-text)]">
                                        <Icon className="h-5 w-5" strokeWidth={1.8} />
                                    </div>
                                    <span className="font-mono text-xs text-[var(--te-text-dim)]">{String(index + 1).padStart(2, '0')}</span>
                                </div>
                                <h3 className="mt-5 text-base font-semibold text-[var(--te-text)]">{feature.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-[var(--te-text-dim)]">{feature.description}</p>
                            </article>
                        )
                    })}
                </section>

                <section className="mt-8 te-panel p-8">
                    <div className="mx-auto flex max-w-xl flex-col items-center text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                            <BriefcaseIcon className="h-5 w-5 text-[var(--te-text)]" />
                        </div>
                        <h3 className="mt-4 font-mono text-lg font-bold text-[var(--te-text)]">opportunities feed initializing</h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--te-text-dim)]">
                            While the marketplace comes online, use Applications and Referrals to keep your search system organized.
                        </p>
                        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                            <a href="/applications" className="te-btn-secondary te-btn-sm">Open Applications</a>
                            <a href="/referrals" className="te-btn-ghost te-btn-sm">Review Referrals</a>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}

export default Opportunities;
