import {
    CodeBracketIcon,
    AcademicCapIcon,
    ChartBarIcon,
    ArrowTopRightOnSquareIcon,
    SparklesIcon,
    CheckCircleIcon,
    RocketLaunchIcon
} from '@heroicons/react/24/outline'

const platforms = [
    {
        id: 'neetcode',
        name: 'NeetCode',
        description: 'Curated list of 150 best LeetCode problems for coding interviews',
        url: 'https://neetcode.io',
        icon: '🎯',
        color: 'from-blue-600 to-cyan-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        features: [
            'Roadmap for interview prep',
            'Video explanations for each problem',
            'Organized by patterns',
            'Beginner-friendly approach'
        ],
        recommended: true
    },
    {
        id: 'leetcode',
        name: 'LeetCode',
        description: 'The ultimate platform for practicing coding problems and preparing for technical interviews',
        url: 'https://leetcode.com',
        icon: '💻',
        color: 'from-orange-600 to-amber-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        features: [
            'Thousands of coding problems',
            'Company-specific questions',
            'Mock interviews',
            'Global contest rankings'
        ],
        recommended: true
    },
    {
        id: 'educative',
        name: 'Educative',
        description: 'Interactive courses and hands-on practice for mastering coding interviews',
        url: 'https://www.educative.io',
        icon: '📚',
        color: 'from-purple-600 to-pink-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        features: [
            'Interactive coding environment',
            'Grokking the Coding Interview',
            'System design courses',
            'Text-based learning'
        ],
        recommended: false
    }
];

const Practice = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
            {/* Header */}
            <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                            Practice
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-600">
                            Master coding interviews with these recommended platforms
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-1 mb-12">
                    <div className="bg-white rounded-3xl p-8 md:p-12">
                        <div className="flex items-start gap-6">
                            <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl">
                                <RocketLaunchIcon className="h-12 w-12 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                                    Level Up Your Coding Skills
                                </h2>
                                <p className="text-lg text-gray-600 mb-4">
                                    Consistent practice is the key to acing technical interviews. We've curated the best platforms
                                    to help you master data structures, algorithms, and problem-solving patterns.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-200">
                                        <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                                        <span className="text-sm font-semibold text-emerald-700">Trusted Resources</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
                                        <SparklesIcon className="h-5 w-5 text-blue-600" />
                                        <span className="text-sm font-semibold text-blue-700">Interview-Focused</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Platforms Grid */}
                <div className="space-y-8">
                    {platforms.map((platform) => (
                        <div
                            key={platform.id}
                            className={`relative bg-white rounded-3xl border-2 ${platform.borderColor} overflow-hidden hover:shadow-2xl transition-all duration-300 group`}
                        >
                            {/* Recommended Badge */}
                            {platform.recommended && (
                                <div className="absolute top-6 right-6 z-10">
                                    <div className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${platform.color} text-white rounded-full shadow-lg`}>
                                        <SparklesIcon className="h-4 w-4" />
                                        <span className="text-sm font-bold">Highly Recommended</span>
                                    </div>
                                </div>
                            )}

                            <div className="p-8 md:p-10">
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Left: Icon and Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className={`text-6xl`}>
                                                {platform.icon}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                                                    {platform.name}
                                                </h3>
                                                <p className="text-gray-600 text-lg">
                                                    {platform.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Features List */}
                                        <div className={`${platform.bgColor} rounded-2xl p-6 mb-6`}>
                                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <ChartBarIcon className="h-5 w-5" />
                                                Key Features
                                            </h4>
                                            <ul className="space-y-3">
                                                {platform.features.map((feature, index) => (
                                                    <li key={index} className="flex items-start gap-3">
                                                        <CheckCircleIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 bg-gradient-to-r ${platform.color} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent' }} />
                                                        <span className="text-gray-700">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* CTA Button */}
                                        <a
                                            href={platform.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r ${platform.color} text-white rounded-xl font-bold hover:shadow-lg transition-all duration-200 group-hover:scale-105 text-lg`}
                                        >
                                            <CodeBracketIcon className="h-6 w-6" />
                                            <span>Start Practicing on {platform.name}</span>
                                            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                                        </a>
                                    </div>

                                    {/* Right: Visual Element */}
                                    <div className="md:w-64 flex items-center justify-center">
                                        <div className={`w-48 h-48 bg-gradient-to-br ${platform.color} rounded-3xl flex items-center justify-center transform rotate-6 group-hover:rotate-12 transition-transform duration-300 shadow-xl`}>
                                            <span className="text-8xl transform -rotate-6">
                                                {platform.icon}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative gradient border bottom */}
                            <div className={`h-2 bg-gradient-to-r ${platform.color}`}></div>
                        </div>
                    ))}
                </div>

                {/* Tips Section */}
                <div className="mt-16 grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl border border-blue-200 p-6 hover:shadow-lg transition-all">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                            <ChartBarIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">Start with Patterns</h3>
                        <p className="text-sm text-gray-600">
                            Focus on learning problem-solving patterns rather than memorizing individual solutions. NeetCode's roadmap is perfect for this.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-purple-200 p-6 hover:shadow-lg transition-all">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                            <AcademicCapIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">Consistency Over Intensity</h3>
                        <p className="text-sm text-gray-600">
                            Solve 1-2 problems daily rather than cramming. Regular practice builds muscle memory and pattern recognition.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-emerald-200 p-6 hover:shadow-lg transition-all">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                            <RocketLaunchIcon className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">Track Your Progress</h3>
                        <p className="text-sm text-gray-600">
                            Keep a log of problems solved and revisit difficult ones. LeetCode's tracking features help you stay organized.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Practice;
