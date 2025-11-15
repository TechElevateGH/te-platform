import {
    AcademicCapIcon,
    UserGroupIcon,
    MicrophoneIcon,
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    SparklesIcon,
    RocketLaunchIcon,
    CodeBracketSquareIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const features = [
    {
        name: 'Personalized Mentorship',
        description: 'Connect with experienced professionals who guide you through your tech journey with personalized advice and support.',
        icon: UserGroupIcon,
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-50',
    },
    {
        name: 'Learning Resources',
        description: 'Access curated workshops, tutorials, and courses covering data structures, algorithms, system design, and more.',
        icon: AcademicCapIcon,
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-purple-50',
    },
    {
        name: 'Free Mock Interviews',
        description: 'Practice behavioral and technical interviews with insights from professionals who have interviewed at top tech companies.',
        icon: MicrophoneIcon,
        color: 'from-green-500 to-emerald-500',
        bgColor: 'bg-green-50',
    },
    {
        name: 'Real-World Projects',
        description: 'Build real-world projects with members and gain practical experience through partnerships with companies to strengthen your profile.',
        icon: CodeBracketSquareIcon,
        color: 'from-teal-500 to-green-500',
        bgColor: 'bg-teal-50',
    },
    {
        name: 'Resume Reviews',
        description: 'Get expert feedback on your resume from industry professionals to help you stand out to recruiters.',
        icon: DocumentTextIcon,
        color: 'from-orange-500 to-red-500',
        bgColor: 'bg-orange-50',
    },
    {
        name: 'Referral Network',
        description: 'Access exclusive referral opportunities from our network of professionals at top tech companies.',
        icon: ChatBubbleLeftRightIcon,
        color: 'from-cyan-500 to-blue-500',
        bgColor: 'bg-cyan-50',
    },
];

const Features = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const handleExploreFeatures = () => {
        if (isAuthenticated) {
            navigate('/workspace');
        } else {
            navigate('/login');
        }
    };

    return (
        <div id="features" className="relative py-24 sm:py-32 bg-white dark:bg-gray-900 overflow-hidden transition-colors">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-100 dark:bg-blue-500/20 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-purple-100 dark:bg-purple-500/20 rounded-full blur-3xl opacity-30"></div>
            </div>

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                {/* Section header */}
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 mb-4">
                        <SparklesIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Platform Features</span>
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                        Everything you need to{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            succeed in tech
                        </span>
                    </h2>
                    <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                        Our comprehensive platform provides all the tools and support you need to launch and advance your career in technology.
                    </p>
                </div>

                {/* Features grid */}
                <div className="mx-auto mt-16 max-w-7xl">
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, index) => (
                            <div
                                key={feature.name}
                                className="group relative"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="relative h-full p-8 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 group-hover:bg-gradient-to-br group-hover:from-gray-900 group-hover:to-gray-800 group-hover:border-transparent">
                                    {/* Icon container */}
                                    <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 shadow-lg group-hover:scale-125 group-hover:shadow-2xl transition-all duration-300`}>
                                        <feature.icon className="h-7 w-7 text-white" />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-white group-hover:font-extrabold transition-all duration-300">
                                        {feature.name}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed group-hover:text-gray-100 group-hover:font-semibold transition-all duration-300">
                                        {feature.description}
                                    </p>

                                    {/* Hover gradient border effect */}
                                    <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br ${feature.color} -z-10 blur-2xl`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-20 text-center">
                    <div className="inline-flex flex-col sm:flex-row gap-4 items-center">
                        <button
                            onClick={handleExploreFeatures}
                            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                            <span className="flex items-center gap-2">
                                Explore All Features
                                <RocketLaunchIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Join 100+ aspiring tech professionals</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Features;
