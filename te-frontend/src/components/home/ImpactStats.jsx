import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, GlobeAltIcon, HeartIcon, TrophyIcon } from 'icons';
import { useAuth } from '../../context/AuthContext';

const stats = [
    { name: 'Success stories', value: 60, suffix: '+', icon: TrophyIcon, note: 'people stepped into roles they worked hard for' },
    { name: 'Nationalities', value: 5, suffix: '+', icon: GlobeAltIcon, note: 'perspectives making the community stronger' },
    { name: 'Community members', value: 110, suffix: '+', icon: HeartIcon, note: 'peers, mentors, referrers, and volunteers' },
];

const AnimatedNumber = ({ value, active }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!active) return undefined;
        if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setCount(value);
            return undefined;
        }

        let frame;
        let startedAt;
        const tick = (timestamp) => {
            if (!startedAt) startedAt = timestamp;
            const progress = Math.min((timestamp - startedAt) / 1500, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(value * eased));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [active, value]);

    return count;
};

const ImpactStats = () => {
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return undefined;
        if (typeof IntersectionObserver === 'undefined') {
            setIsVisible(true);
            return undefined;
        }
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.2 });
        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} id="impact" className="relative overflow-hidden bg-[#0b2e21] py-24 text-white sm:py-32">
            <div className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full border-[90px] border-white/[0.025]" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-96 opacity-20 [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]" />
            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                    <div>
                        <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6fdda5] before:h-0.5 before:w-5 before:rounded-full before:bg-current">
                            The human outcome
                        </span>
                        <h2 className="mt-5 text-4xl font-extrabold tracking-[-0.055em] text-white sm:text-5xl">
                            Progress is personal. Impact is collective.
                        </h2>
                    </div>
                    <p className="max-w-2xl text-lg leading-8 text-white/60 lg:justify-self-end">
                        Behind every number is someone who asked a better question, found a generous mentor, practised one more time, and took the next brave step.
                    </p>
                </div>

                <div className="mt-16 grid overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] backdrop-blur sm:grid-cols-3">
                    {stats.map((stat, index) => (
                        <article key={stat.name} className={`p-7 sm:p-8 ${index > 0 ? 'border-t border-white/10 sm:border-l sm:border-t-0' : ''}`}>
                            <div className="flex items-start justify-between">
                                <stat.icon className="h-5 w-5 text-[#6fdda5]" strokeWidth={1.8} />
                                <span className="text-[10px] font-bold text-white/25">0{index + 1}</span>
                            </div>
                            <p className="mt-10 text-5xl font-extrabold tracking-[-0.06em] text-white sm:text-6xl">
                                <AnimatedNumber value={stat.value} active={isVisible} />{stat.suffix}
                            </p>
                            <h3 className="mt-4 text-base font-extrabold text-white">{stat.name}</h3>
                            <p className="mt-2 text-sm leading-6 text-white/50">{stat.note}</p>
                        </article>
                    ))}
                </div>

                <div className="mt-14 flex flex-col items-start justify-between gap-6 rounded-[1.75rem] bg-[#f2bd58] p-7 text-[#0b2e21] sm:flex-row sm:items-center sm:p-9">
                    <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0b2e21]/55">There is room for your story</p>
                        <h3 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#0b2e21] sm:text-3xl">Take the next step with people in your corner.</h3>
                    </div>
                    <button
                        onClick={() => navigate(isAuthenticated ? '/workspace' : '/register')}
                        className="group inline-flex min-h-[48px] flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0b2e21] px-5 py-3 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#123d2d]"
                    >
                        {isAuthenticated ? 'Keep moving' : 'Join TechElevate'}
                        <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ImpactStats;
