import {
    AcademicCapIcon,
    ArrowRightIcon,
    ChatBubbleLeftRightIcon,
    CodeBracketSquareIcon,
    DocumentTextIcon,
    MicrophoneIcon,
    UserGroupIcon,
} from 'icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const features = [
    {
        name: 'Mentorship that moves with you',
        description: 'Build a trusted relationship with experienced engineers who understand your goals, context, and next best move.',
        eyebrow: '01 · Guidance',
        icon: UserGroupIcon,
        span: 'lg:col-span-7',
        featured: true,
        detail: 'Personal roadmaps · Accountability · Honest feedback',
    },
    {
        name: 'A curriculum with direction',
        description: 'Structured learning across DSA, systems, and practical engineering—not another pile of disconnected links.',
        eyebrow: '02 · Learn',
        icon: AcademicCapIcon,
        span: 'lg:col-span-5',
        tone: 'green',
    },
    {
        name: 'Practice before it counts',
        description: 'Run realistic technical and behavioral mock interviews with people who know the process.',
        eyebrow: '03 · Prepare',
        icon: MicrophoneIcon,
        span: 'lg:col-span-4',
        tone: 'gold',
    },
    {
        name: 'Proof, not promises',
        description: 'Turn guided projects into credible stories you can share with hiring teams.',
        eyebrow: '04 · Build',
        icon: CodeBracketSquareIcon,
        span: 'lg:col-span-4',
        tone: 'red',
    },
    {
        name: 'A sharper story',
        description: 'Get specific, useful feedback on resumes and essays from people who have reviewed candidates.',
        eyebrow: '05 · Position',
        icon: DocumentTextIcon,
        span: 'lg:col-span-4',
        tone: 'green',
    },
    {
        name: 'Warm doors into great teams',
        description: 'Discover referral opportunities through a community that wants to see talented people win.',
        eyebrow: '06 · Connect',
        icon: ChatBubbleLeftRightIcon,
        span: 'lg:col-span-12',
        horizontal: true,
        tone: 'gold',
    },
];

const toneClasses = {
    green: 'bg-[var(--te-green-soft)] text-[var(--te-green)]',
    gold: 'bg-[var(--te-gold-soft)] text-[var(--te-gold)]',
    red: 'bg-[var(--te-red-soft)] text-[var(--te-red)]',
};

const Features = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    return (
        <section id="features" className="relative border-b border-[var(--te-border)] bg-[var(--te-surface)] py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                    <div>
                        <span className="te-eyebrow">More than a dashboard</span>
                        <h2 className="mt-5 text-4xl font-extrabold tracking-[-0.055em] text-[var(--te-text)] sm:text-5xl">
                            The support system your ambition needs.
                        </h2>
                    </div>
                    <div className="lg:justify-self-end lg:max-w-xl">
                        <p className="text-lg leading-8 text-[var(--te-text-dim)]">
                            Career growth is rarely one breakthrough. TechElevate brings the small, important pieces together so each week creates real momentum.
                        </p>
                        <button
                            onClick={() => navigate(isAuthenticated ? '/workspace' : '/register')}
                            className="te-link group mt-6 inline-flex items-center gap-2 text-sm font-extrabold"
                        >
                            Explore the full workspace
                            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </div>

                <div className="mt-16 grid gap-4 lg:grid-cols-12">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <article
                                key={feature.name}
                                className={`${feature.span} group relative overflow-hidden rounded-[1.75rem] border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--te-shadow)] sm:p-8 ${
                                    feature.featured
                                        ? 'border-[#184c38] bg-[#0b2e21] text-white'
                                        : 'border-[var(--te-border)] bg-[var(--te-bg)]'
                                } ${feature.horizontal ? 'lg:flex lg:items-center lg:gap-10' : ''}`}
                            >
                                {feature.featured && (
                                    <>
                                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#50cb8a]/10 blur-2xl" />
                                        <div className="absolute bottom-0 right-0 h-28 w-56 opacity-20 [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                                    </>
                                )}
                                <div className={`relative grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl ${
                                    feature.featured ? 'bg-white/10 text-[#71dda6]' : toneClasses[feature.tone]
                                }`}>
                                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                                </div>
                                <div className={`relative ${feature.horizontal ? 'mt-6 flex-1 lg:mt-0' : 'mt-10'}`}>
                                    <p className={`text-[10px] font-extrabold uppercase tracking-[0.16em] ${
                                        feature.featured ? 'text-white/45' : 'text-[var(--te-text-dim)]'
                                    }`}>
                                        {feature.eyebrow}
                                    </p>
                                    <h3 className={`mt-3 text-xl font-extrabold tracking-[-0.035em] sm:text-2xl ${
                                        feature.featured ? 'text-white' : 'text-[var(--te-text)]'
                                    }`}>
                                        {feature.name}
                                    </h3>
                                    <p className={`mt-3 max-w-xl text-sm leading-7 ${
                                        feature.featured ? 'text-white/62' : 'text-[var(--te-text-dim)]'
                                    }`}>
                                        {feature.description}
                                    </p>
                                    {feature.detail && (
                                        <p className="mt-8 border-t border-white/10 pt-5 text-xs font-semibold text-white/50">{feature.detail}</p>
                                    )}
                                </div>
                                {feature.horizontal && (
                                    <button
                                        onClick={() => navigate(isAuthenticated ? '/workspace' : '/register')}
                                        className="te-btn-secondary relative mt-7 flex-shrink-0 lg:mt-0"
                                    >
                                        See opportunities
                                        <ArrowRightIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Features;
