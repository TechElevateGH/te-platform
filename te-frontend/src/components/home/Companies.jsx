import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowTrendingUpIcon, BriefcaseIcon } from 'icons';
import { featuredCompanies } from '../../data/jobData';

const CompanyLogo = ({ company }) => {
    const [status, setStatus] = useState('loading');
    const handleLoad = useCallback(() => setStatus('loaded'), []);
    const handleError = useCallback(() => setStatus('error'), []);

    return (
        <div className="relative flex h-12 w-12 items-center justify-center">
            {status !== 'error' && (
                <img
                    src={company.logo}
                    alt={`${company.name} logo`}
                    className={`h-full w-full rounded-xl object-contain transition-all duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={handleLoad}
                    onError={handleError}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                />
            )}
            {status !== 'loaded' && (
                <span className={`${status === 'loading' ? 'absolute' : ''} grid h-full w-full place-items-center rounded-xl bg-[var(--te-surface-alt)] text-sm font-extrabold text-[var(--te-text)]`}>
                    {company.name.charAt(0)}
                </span>
            )}
        </div>
    );
};

const Companies = () => {
    const scrollRef = useRef(null);
    const duplicatedCompanies = [...featuredCompanies, ...featuredCompanies];

    useEffect(() => {
        const container = scrollRef.current;
        const prefersReducedMotion = typeof window.matchMedia === 'function'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!container || prefersReducedMotion) return undefined;

        let position = 0;
        let frameId;
        let paused = false;

        const scroll = () => {
            if (!paused) {
                position += 0.6;
                if (position >= container.scrollWidth / 2) position = 0;
                container.scrollLeft = position;
            }
            frameId = requestAnimationFrame(scroll);
        };

        const pause = () => { paused = true; };
        const resume = () => { paused = false; };
        container.addEventListener('mouseenter', pause);
        container.addEventListener('mouseleave', resume);
        frameId = requestAnimationFrame(scroll);

        return () => {
            cancelAnimationFrame(frameId);
            container.removeEventListener('mouseenter', pause);
            container.removeEventListener('mouseleave', resume);
        };
    }, []);

    return (
        <section id="outcomes" className="overflow-hidden border-b border-[var(--te-border)] bg-[var(--te-bg)] py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div className="max-w-2xl">
                        <span className="te-eyebrow">Talent meets opportunity</span>
                        <h2 className="mt-5 text-4xl font-extrabold tracking-[-0.055em] text-[var(--te-text)] sm:text-5xl">
                            Our community is showing up everywhere.
                        </h2>
                        <p className="mt-5 text-lg leading-8 text-[var(--te-text-dim)]">
                            Members have taken their talent from Accra to teams at global technology leaders, fast-growing startups, and category-defining companies.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-[var(--te-border)] bg-[var(--te-surface)] shadow-sm">
                        <div className="border-r border-[var(--te-border)] px-6 py-5">
                            <BriefcaseIcon className="h-4 w-4 text-[var(--te-accent)]" />
                            <p className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--te-text)]">35+</p>
                            <p className="text-xs font-semibold text-[var(--te-text-dim)]">Hiring teams</p>
                        </div>
                        <div className="px-6 py-5">
                            <ArrowTrendingUpIcon className="h-4 w-4 text-[var(--te-gold)]" />
                            <p className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--te-text)]">60+</p>
                            <p className="text-xs font-semibold text-[var(--te-text-dim)]">Career wins</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative mt-16">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[var(--te-bg)] to-transparent sm:w-40" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[var(--te-bg)] to-transparent sm:w-40" />
                <div ref={scrollRef} className="flex gap-3 overflow-x-hidden px-6 py-3" aria-label="Companies where members work">
                    {duplicatedCompanies.map((company, index) => (
                        <div
                            key={`${company.name}-${index}`}
                            className="flex h-28 w-44 flex-shrink-0 flex-col items-center justify-center rounded-2xl border border-[var(--te-border)] bg-[var(--te-surface)] p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--te-border-strong)] hover:shadow-[var(--te-shadow)]"
                        >
                            <CompanyLogo company={company} />
                            <p className="mt-3 max-w-full truncate text-center text-[11px] font-bold text-[var(--te-text-dim)]">{company.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Companies;
