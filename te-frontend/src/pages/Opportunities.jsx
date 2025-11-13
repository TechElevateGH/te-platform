import { BriefcaseIcon, BellIcon, SparklesIcon } from '@heroicons/react/24/outline'

const Opportunities = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 sm:px-6 transition-colors">
            <div className="max-w-2xl w-full">
                {/* Main Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                    {/* Gradient Header */}
                    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-2"></div>

                    {/* Content */}
                    <div className="p-6 sm:p-8 md:p-12 text-center">
                        {/* Icon */}
                        <div className="relative inline-block mb-4 sm:mb-6">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-full flex items-center justify-center mx-auto shadow-lg">
                                <BriefcaseIcon className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-7 h-7 sm:w-8 sm:h-8 bg-yellow-400 dark:bg-yellow-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-800 dark:text-yellow-900" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                            Opportunities
                        </h1>

                        {/* Subtitle */}
                        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full mb-4 sm:mb-6">
                            <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
                            <span className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300">Coming Soon</span>
                        </div>

                        {/* Description */}
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-lg mx-auto leading-relaxed">
                            We're building something amazing! Soon you'll be able to discover and apply to curated job opportunities tailored just for you.
                        </p>

                        {/* Features Preview */}
                        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200 dark:border-blue-700/50">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-gray-700 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-sm">
                                    <BriefcaseIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1 sm:mb-2">Curated Jobs</h3>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                    Hand-picked opportunities matching your skills
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-200 dark:border-purple-700/50">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-gray-700 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-sm">
                                    <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1 sm:mb-2">Smart Alerts</h3>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                    Get notified when new opportunities arrive
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/30 dark:to-pink-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-pink-200 dark:border-pink-700/50">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-gray-700 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-sm">
                                    <SparklesIcon className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600 dark:text-pink-400" />
                                </div>
                                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1 sm:mb-2">Easy Apply</h3>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                    One-click apply with your saved materials
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4 sm:mt-6 px-4">
                    In the meantime, check out <span className="font-semibold text-gray-700 dark:text-gray-300">Applications</span> and <span className="font-semibold text-gray-700 dark:text-gray-300">Referrals</span> to track your job search progress!
                </p>
            </div>
        </div>
    )
}

export default Opportunities;
