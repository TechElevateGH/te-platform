import {
    AcademicCapIcon,
    UserGroupIcon,
    BriefcaseIcon,
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    ChartBarIcon,
    SparklesIcon,
    RocketLaunchIcon,
} from '@heroicons/react/24/outline';

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
        name: 'Application Tracking',
        description: 'Organize and track all your job applications in one place with status updates and deadline reminders.',
        icon: BriefcaseIcon,
        color: 'from-green-500 to-emerald-500',
        bgColor: 'bg-green-50',
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
    {
        name: 'Progress Analytics',
        description: 'Track your growth with detailed analytics and insights on your job search and skill development.',
        icon: ChartBarIcon,
        color: 'from-indigo-500 to-purple-500',
        bgColor: 'bg-indigo-50',
    },
];

const Features = () => {
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
                                <div className="relative h-full p-8 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                    {/* Icon container */}
                                    <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <feature.icon className="h-7 w-7 text-white" />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {feature.name}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {feature.description}
                                    </p>

                                    {/* Hover gradient border effect */}
                                    <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${feature.color} -z-10 blur-xl`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-20 text-center">
                    <div className="inline-flex flex-col sm:flex-row gap-4 items-center">
                        <button className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                            <span className="flex items-center gap-2">
                                Explore All Features
                                <RocketLaunchIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Join 500+ aspiring tech professionals</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Features;
