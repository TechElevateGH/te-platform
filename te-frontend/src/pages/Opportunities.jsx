import {
    BriefcaseIcon,
    BellIcon,
    SparklesIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    ClockIcon,
    BuildingOfficeIcon,
    AcademicCapIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline'

const Opportunities = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
            {/* Professional Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Opportunities</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Discover curated job opportunities matching your profile</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium border border-emerald-200 dark:border-emerald-800">
                                <ClockIcon className="h-4 w-4" />
                                Coming Soon
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search Bar Placeholder */}
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search job titles, companies, or keywords..."
                                disabled
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1 md:w-48">
                                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Location"
                                    disabled
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <button
                                disabled
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors cursor-not-allowed opacity-50"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </div>

                {/* Feature Preview Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4">
                            <BriefcaseIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Curated Opportunities</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Hand-picked job opportunities from top companies, vetted for quality and fit with your skills and experience.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                            <BellIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Smart Notifications</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Get instant alerts when new opportunities matching your preferences become available.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                            <SparklesIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">One-Click Apply</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Apply to multiple opportunities quickly using your saved resumes and application materials.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4">
                            <CurrencyDollarIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Salary Insights</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            View transparent salary ranges and compensation details for informed decision-making.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                            <BuildingOfficeIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Company Profiles</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Research companies with detailed profiles, culture insights, and employee reviews.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6">
                        <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-4">
                            <AcademicCapIcon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Skills Matching</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            See how your skills align with job requirements and get recommendations for improvement.
                        </p>
                    </div>
                </div>

                {/* Sample Job Listings */}
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preview: Sample Opportunities</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Examples of what you'll see when this feature launches</p>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-slate-800">
                        {[
                            {
                                title: "Senior Software Engineer",
                                company: "Tech Corp",
                                location: "Remote",
                                salary: "$120k - $180k",
                                type: "Full-time",
                                tags: ["React", "Node.js", "AWS"]
                            },
                            {
                                title: "Frontend Developer",
                                company: "StartupXYZ",
                                location: "New York, NY",
                                salary: "$90k - $130k",
                                type: "Full-time",
                                tags: ["React", "TypeScript", "CSS"]
                            },
                            {
                                title: "Full Stack Engineer",
                                company: "Innovation Labs",
                                location: "San Francisco, CA",
                                salary: "$110k - $160k",
                                type: "Full-time",
                                tags: ["Python", "React", "PostgreSQL"]
                            }
                        ].map((job, index) => (
                            <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors opacity-60 cursor-not-allowed">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium">
                                                <CheckBadgeIcon className="h-3 w-3" />
                                                Verified
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            <span className="flex items-center gap-1">
                                                <BuildingOfficeIcon className="h-4 w-4" />
                                                {job.company}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPinIcon className="h-4 w-4" />
                                                {job.location}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <CurrencyDollarIcon className="h-4 w-4" />
                                                {job.salary}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ClockIcon className="h-4 w-4" />
                                                {job.type}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {job.tags.map((tag, i) => (
                                                <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        disabled
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors cursor-not-allowed opacity-50"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-8 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 p-8 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Stay Tuned!</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        We're working hard to bring you the best job discovery experience. In the meantime, explore <span className="font-semibold">Applications</span> and <span className="font-semibold">Referrals</span> to track your job search.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Opportunities;
