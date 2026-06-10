import {
    AcademicCapIcon,
    UserGroupIcon,
    MicrophoneIcon,
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    CodeBracketSquareIcon,
} from 'icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const features = [
    {
        name: 'Personalized Mentorship',
        description: 'Connect with experienced engineers who guide your journey with tailored advice and accountability.',
        icon: UserGroupIcon,
    },
    {
        name: 'Learning Resources',
        description: 'Curated workshops on data structures, algorithms, and system design — structured like a real curriculum.',
        icon: AcademicCapIcon,
    },
    {
        name: 'Free Mock Interviews',
        description: 'Practice behavioral and technical rounds with people who have interviewed at top tech companies.',
        icon: MicrophoneIcon,
    },
    {
        name: 'Real-World Projects',
        description: 'Build production-grade projects with peers and partner companies to strengthen your profile.',
        icon: CodeBracketSquareIcon,
    },
    {
        name: 'Resume Reviews',
        description: 'Get line-by-line feedback from industry professionals so you stand out to recruiters.',
        icon: DocumentTextIcon,
    },
    {
        name: 'Referral Network',
        description: 'Access exclusive referral opportunities from our network of engineers at top companies.',
        icon: ChatBubbleLeftRightIcon,
    },
];

const Features = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const handleExploreFeatures = () => {
        navigate(isAuthenticated ? '/workspace' : '/login');
    };

    return (
        <section id="features" className="bg-[var(--te-bg)] py-24 sm:py-28 border-b border-[var(--te-border)]">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* Section header */}
                <div className="max-w-2xl">
                    <span className="te-eyebrow">{'// platform'}</span>
                    <h2 className="mt-4 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--te-text)]">
                        Everything you need to ship your career
                    </h2>
                    <p className="mt-4 text-base sm:text-lg leading-relaxed text-[var(--te-text-dim)]">
                        A focused set of tools that take you from first application to signed offer — no noise, no fluff.
                    </p>
                </div>

                {/* Features grid */}
                <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-[var(--te-border)]">
                    {features.map((feature, index) => (
                        <div
                            key={feature.name}
                            className="group relative border-b border-r border-[var(--te-border)] p-8 transition-colors hover:bg-[var(--te-hover)]"
                        >
                            <div className="flex items-center justify-between">
                                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-lg te-tile-${['green', 'gold', 'red'][index % 3]}`}>
                                    <feature.icon className="h-5 w-5" strokeWidth={1.9} />
                                </div>
                                <span className="font-mono text-xs text-[var(--te-gold)]">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                            </div>
                            <h3 className="mt-5 text-base font-semibold text-[var(--te-text)]">
                                {feature.name}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-[var(--te-text-dim)]">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <button onClick={handleExploreFeatures} className="te-btn-primary te-btn-lg">
                        Explore all features <span aria-hidden="true">→</span>
                    </button>
                    <span className="font-mono text-xs text-[var(--te-text-dim)]">
                        {'// join 100+ aspiring tech professionals'}
                    </span>
                </div>
            </div>
        </section>
    );
};

export default Features;
