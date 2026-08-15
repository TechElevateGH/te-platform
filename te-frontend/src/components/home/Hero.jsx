import { useNavigate } from 'react-router-dom';
import {
    AcademicCapIcon,
    ArrowRightIcon,
    BriefcaseIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    SparklesIcon,
} from 'icons';
import { useAuth } from '../../context/AuthContext';

const applicationSteps = [
    { company: 'Hubtel', role: 'Software engineer', status: 'Final round', tone: 'gold' },
    { company: 'Microsoft', role: 'Cloud engineer', status: 'Interview', tone: 'green' },
    { company: 'Flutterwave', role: 'Frontend engineer', status: 'Applied', tone: 'neutral' },
];

const Hero = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    return (
        <section id="home" className="relative overflow-hidden border-b border-[var(--te-border)] bg-[var(--te-bg)] pt-16">
            <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-[var(--te-green-soft)] blur-3xl" />
            <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[var(--te-gold-soft)] blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(var(--te-border)_0.8px,transparent_0.8px)] [background-size:24px_24px]" />

            <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] min-w-0 max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-24">
                <div className="min-w-0 max-w-2xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--te-border)] bg-[color:color-mix(in_srgb,var(--te-surface)_82%,transparent)] px-3 py-1.5 text-xs font-bold text-[var(--te-text-dim)] shadow-sm backdrop-blur">
                        <SparklesIcon className="h-3.5 w-3.5 text-[var(--te-gold)]" />
                        Built for ambitious talent everywhere.
                    </div>

                    <h1 className="mt-7 max-w-3xl break-words text-[clamp(3.2rem,7vw,6.4rem)] font-extrabold leading-[0.96] tracking-[-0.075em] text-[var(--te-text)]">
                        Make your next
                        <span className="relative ml-[0.18em] inline-block text-[var(--te-accent)]">
                            move count.
                            <svg className="absolute -bottom-2 left-1 h-3 w-[96%] text-[var(--te-gold)]" viewBox="0 0 320 18" fill="none" aria-hidden="true">
                                <path d="M4 12.5C76 3 201 4 316 9" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity=".65" />
                            </svg>
                        </span>
                    </h1>

                    <p className="mt-8 max-w-xl text-lg leading-8 text-[var(--te-text-dim)] sm:text-xl">
                        One focused place to build skills, sharpen your story, meet the right people, and turn momentum into the role you deserve.
                    </p>

                    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                        <button
                            onClick={() => navigate(isAuthenticated ? '/workspace' : '/register')}
                            className="te-btn-primary te-btn-lg group w-full px-6 sm:w-auto"
                        >
                            {isAuthenticated ? 'Open your workspace' : 'Start building for free'}
                            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
                        <button
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            className="te-btn-secondary te-btn-lg w-full px-6 sm:w-auto"
                        >
                            See how it works
                        </button>
                    </div>

                    <div className="mt-10 flex flex-col gap-5 border-t border-[var(--te-border)] pt-6 sm:flex-row sm:items-center">
                        <div className="flex -space-x-2">
                            {['AM', 'KO', 'EN', 'YA'].map((initials, index) => (
                                <span
                                    key={initials}
                                    className="grid h-9 w-9 place-items-center rounded-full border-2 border-[var(--te-bg)] text-[10px] font-extrabold text-white shadow-sm"
                                    style={{ background: ['#0d7c4c', '#d19022', '#c63f4c', '#315b49'][index] }}
                                >
                                    {initials}
                                </span>
                            ))}
                        </div>
                        <div>
                            <div className="flex items-center gap-1 text-[var(--te-gold)]" aria-label="Rated five stars">
                                {'★★★★★'.split('').map((star, index) => <span key={index} className="text-xs">{star}</span>)}
                            </div>
                            <p className="mt-0.5 text-xs font-semibold text-[var(--te-text-dim)]">110+ people growing together</p>
                        </div>
                        <div className="hidden h-9 w-px bg-[var(--te-border)] sm:block" />
                        <p className="text-xs font-semibold leading-5 text-[var(--te-text-dim)]">
                            Free mentorship<br />No hidden fees
                        </p>
                    </div>
                </div>

                <div className="relative mx-auto min-w-0 w-full max-w-[590px] lg:mx-0">
                    <div className="absolute -left-6 top-16 hidden rounded-2xl border border-white/15 bg-[#123d2d] p-3 text-white shadow-xl xl:block">
                        <div className="flex items-center gap-2">
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10">
                                <CheckCircleIcon className="h-4 w-4 text-[#74dea8]" />
                            </span>
                            <div>
                                <p className="text-[10px] font-semibold text-white/55">Resume review</p>
                                <p className="text-xs font-bold">Feedback ready</p>
                            </div>
                        </div>
                    </div>

                    <div className="absolute -right-5 bottom-20 z-20 hidden rounded-2xl border border-[var(--te-border)] bg-[var(--te-surface)] p-4 shadow-[var(--te-shadow-lg)] sm:block">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">Weekly momentum</p>
                        <div className="mt-2 flex items-end gap-1.5">
                            {[32, 48, 38, 66, 57, 82, 72].map((height, index) => (
                                <span
                                    key={index}
                                    className={`w-2.5 rounded-full ${index === 5 ? 'bg-[var(--te-gold)]' : 'bg-[var(--te-green)]/25'}`}
                                    style={{ height: `${height * 0.42}px` }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="relative rounded-[2rem] bg-[#0b2e21] p-2.5 shadow-[0_36px_90px_-34px_rgba(5,45,29,0.65)]">
                        <div className="overflow-hidden rounded-[1.55rem] border border-white/10 bg-[var(--te-surface)]">
                            <div className="flex items-center justify-between border-b border-[var(--te-border)] px-5 py-4 sm:px-6">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--te-text-dim)]">Good afternoon, Ama</p>
                                    <p className="mt-1 text-sm font-extrabold text-[var(--te-text)]">Your career command center</p>
                                </div>
                                <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--te-gold-soft)] text-xs font-extrabold text-[var(--te-gold)]">AA</div>
                            </div>

                            <div className="space-y-4 p-4 sm:p-6">
                                <div className="grid gap-3 sm:grid-cols-[1.35fr_0.65fr]">
                                    <div className="rounded-2xl bg-[#0b2e21] p-5 text-white">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">Career readiness</p>
                                                <p className="mt-2 text-2xl font-extrabold tracking-tight text-white">You&apos;re on a roll.</p>
                                                <p className="mt-1 max-w-[230px] text-xs leading-5 text-white/60">Two focused actions will keep this week moving.</p>
                                            </div>
                                            <div className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-full p-1" style={{ background: 'conic-gradient(#63d69b 0 72%, rgba(255,255,255,.12) 72% 100%)' }}>
                                                <div className="grid h-full w-full place-items-center rounded-full bg-[#0b2e21] text-sm font-extrabold">72%</div>
                                            </div>
                                        </div>
                                        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                                            <div className="h-full w-[72%] rounded-full bg-[#63d69b]" />
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-4">
                                        <CalendarDaysIcon className="h-5 w-5 text-[var(--te-gold)]" />
                                        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--te-text-dim)]">Up next</p>
                                        <p className="mt-1 text-sm font-extrabold text-[var(--te-text)]">Mock interview</p>
                                        <p className="mt-1 text-xs text-[var(--te-text-dim)]">Today · 4:00 PM</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                    {[
                                        { label: 'Applications', value: '12', icon: BriefcaseIcon },
                                        { label: 'Lessons done', value: '28', icon: AcademicCapIcon },
                                        { label: 'Active referrals', value: '5', icon: SparklesIcon },
                                    ].map((stat) => (
                                        <div key={stat.label} className="min-w-0 rounded-2xl border border-[var(--te-border)] bg-[var(--te-surface)] p-3 sm:p-4">
                                            <stat.icon className="h-4 w-4 text-[var(--te-accent)]" />
                                            <p className="mt-3 text-xl font-extrabold tracking-tight text-[var(--te-text)]">{stat.value}</p>
                                            <p className="mt-0.5 truncate text-[9px] font-semibold text-[var(--te-text-dim)] sm:text-[10px]">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-2xl border border-[var(--te-border)] bg-[var(--te-surface)] p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-extrabold text-[var(--te-text)]">Application pipeline</p>
                                        <span className="text-[10px] font-bold text-[var(--te-accent)]">View all</span>
                                    </div>
                                    <div className="mt-3 divide-y divide-[var(--te-border)]">
                                        {applicationSteps.map((application) => (
                                            <div key={application.company} className="flex items-center gap-3 py-2.5">
                                                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--te-surface-alt)] text-[10px] font-extrabold text-[var(--te-text)]">
                                                    {application.company.slice(0, 2).toUpperCase()}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-[11px] font-extrabold text-[var(--te-text)]">{application.company}</p>
                                                    <p className="truncate text-[9px] text-[var(--te-text-dim)]">{application.role}</p>
                                                </div>
                                                <span className={`te-chip text-[9px] ${
                                                    application.tone === 'gold'
                                                        ? 'te-chip-gold'
                                                        : application.tone === 'green'
                                                            ? 'te-chip-green'
                                                            : ''
                                                }`}>
                                                    {application.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
