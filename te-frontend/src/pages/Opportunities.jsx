import { BriefcaseIcon, BellIcon, SparklesIcon } from '@heroicons/react/24/outline'

const Opportunities = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 transition-colors">
            <div className="max-w-2xl w-full">
                {/* Main Card */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                    {/* Gradient Header */}
                    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-2"></div>

                    {/* Content */}
                    <div className="p-12 text-center">
                        {/* Icon */}
                        <div className="relative inline-block mb-6">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-full flex items-center justify-center mx-auto shadow-lg">
                                <BriefcaseIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 dark:bg-yellow-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                <SparklesIcon className="h-5 w-5 text-yellow-800 dark:text-yellow-900" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                            Opportunities
                        </h1>

                        {/* Subtitle */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full mb-6">
                            <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Coming Soon</span>
                        </div>

                        {/* Description */}
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto leading-relaxed">
                            We're building something amazing! Soon you'll be able to discover and apply to curated job opportunities tailored just for you.
                        </p>

                        {/* Features Preview */}
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700/50">
                                <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                    <BriefcaseIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Curated Jobs</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Hand-picked opportunities matching your skills
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-700/50">
                                <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                    <BellIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Smart Alerts</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Get notified when new opportunities arrive
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/30 dark:to-pink-900/20 rounded-2xl p-6 border border-pink-200 dark:border-pink-700/50">
                                <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                    <SparklesIcon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Easy Apply</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    One-click apply with your saved materials
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    In the meantime, check out <span className="font-semibold text-gray-700 dark:text-gray-300">Applications</span> and <span className="font-semibold text-gray-700 dark:text-gray-300">Referrals</span> to track your job search progress!
                </p>
            </div>
        </div>
    )
}

export default Opportunities;
