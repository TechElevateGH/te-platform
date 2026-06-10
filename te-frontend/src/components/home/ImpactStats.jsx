import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    GlobeAltIcon,
    TrophyIcon,
    HeartIcon,
} from 'icons';

const stats = [
    {
        id: 0,
        name: 'Success Stories',
        value: 60,
        suffix: '+',
        icon: TrophyIcon,
        description: 'Members who landed their dream jobs',
    },
    {
        id: 1,
        name: 'Nationalities',
        value: 5,
        suffix: '+',
        icon: GlobeAltIcon,
        description: 'Global presence across continents',
    },
    {
        id: 2,
        name: 'Community Members',
        value: 110,
        suffix: '+',
        icon: HeartIcon,
        description: 'Active community participants',
    },
];

const AnimatedNumber = ({ value, duration = 2000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            setCount(Math.floor(value * percentage));
            if (percentage < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return <span>{count}</span>;
};

const ImpactStats = () => {
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        const element = document.getElementById('impact');
        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, []);

    return (
        <section id="impact" className="bg-[var(--te-bg)] py-24 sm:py-28 border-b border-[var(--te-border)]">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* Section header */}
                <div className="max-w-2xl mb-14">
                    <span className="te-eyebrow">{'// impact'}</span>
                    <h2 className="mt-4 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--te-text)]">
                        Real people, real outcomes
                    </h2>
                    <p className="mt-4 text-base sm:text-lg leading-relaxed text-[var(--te-text-dim)]">
                        Every number here is a person who found their path into tech through TechElevate.
                    </p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-px overflow-hidden rounded-lg border border-[var(--te-border)] bg-[var(--te-border)]">
                    {stats.map((stat, i) => {
                        const tone = ['green', 'gold', 'red'][i % 3];
                        return (
                        <div key={stat.id} className="bg-[var(--te-surface)] p-8">
                            <div className="flex items-center justify-between">
                                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg te-tile-${tone}`}>
                                    <stat.icon className="h-5 w-5" strokeWidth={1.9} />
                                </span>
                            </div>
                            <div className={`mt-6 font-mono text-5xl font-bold tracking-tight text-te-${tone}`}>
                                {isVisible ? <AnimatedNumber value={stat.value} /> : 0}
                                {stat.suffix}
                            </div>
                            <div className="mt-3 text-base font-semibold text-[var(--te-text)]">
                                {stat.name}
                            </div>
                            <p className="mt-1 text-sm leading-relaxed text-[var(--te-text-dim)]">
                                {stat.description}
                            </p>
                        </div>
                        );
                    })}
                </div>

                {/* Bottom CTA */}
                <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <button
                        onClick={() => navigate(isAuthenticated ? '/workspace' : '/register')}
                        className="te-btn-primary te-btn-lg"
                    >
                        Be part of our impact <span aria-hidden="true">→</span>
                    </button>
                    <span className="font-mono text-xs text-[var(--te-text-dim)]">
                        {'// join us in changing lives'}
                    </span>
                </div>
            </div>
        </section>
    );
};

export default ImpactStats;
