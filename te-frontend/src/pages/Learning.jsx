import { useState } from 'react'
import {
    AcademicCapIcon,
    ChartBarIcon,
    CubeIcon,
    SparklesIcon,
    ArrowTopRightOnSquareIcon,
    BookOpenIcon,
    StarIcon,
    PlayCircleIcon
} from '@heroicons/react/24/outline'

// Mock data - Replace with actual YouTube video data
// Note: Replace 'dQw4w9WgXcQ' with actual YouTube video IDs from your channel
const videoCategories = [
    {
        id: 'workshops',
        title: 'General Workshops',
        description: 'Comprehensive workshops covering career development, interview prep, and professional growth',
        icon: AcademicCapIcon,
        color: 'from-blue-600 to-cyan-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        videos: [
            {
                id: 1,
                title: 'Career Development Workshop 2024',
                description: 'Learn essential skills for advancing your tech career',
                youtubeId: 'dQw4w9WgXcQ', // Replace with actual video ID
                duration: '1:45:30',
                views: '12K'
            },
            {
                id: 2,
                title: 'Interview Preparation Masterclass',
                description: 'Master technical interviews with proven strategies',
                youtubeId: 'dQw4w9WgXcQ', // Replace with actual video ID
                duration: '2:15:20',
                views: '8.5K'
            }
        ]
    },
    {
        id: 'dsa',
        title: 'Data Structures & Algorithms',
        description: 'Master DSA concepts with clear explanations and practical examples',
        icon: ChartBarIcon,
        color: 'from-purple-600 to-pink-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        videos: [
            {
                id: 3,
                title: 'Arrays & Linked Lists Deep Dive',
                description: 'Understanding fundamental data structures',
                youtubeId: 'dQw4w9WgXcQ', // Replace with actual video ID
                duration: '1:30:15',
                views: '15K'
            },
            {
                id: 4,
                title: 'Trees & Graphs Explained',
                description: 'Complete guide to tree and graph algorithms',
                youtubeId: 'dQw4w9WgXcQ', // Replace with actual video ID
                duration: '2:00:45',
                views: '10K'
            }
        ]
    },
    {
        id: 'system-design',
        title: 'System Design',
        description: 'Learn to design scalable systems and ace system design interviews',
        icon: CubeIcon,
        color: 'from-emerald-600 to-teal-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        videos: [
            {
                id: 5,
                title: 'System Design Fundamentals',
                description: 'Core concepts for building scalable systems',
                youtubeId: 'dQw4w9WgXcQ', // Replace with actual video ID
                duration: '1:50:30',
                views: '20K'
            },
            {
                id: 6,
                title: 'Distributed Systems Architecture',
                description: 'Design patterns for distributed applications',
                youtubeId: 'dQw4w9WgXcQ', // Replace with actual video ID
                duration: '2:30:00',
                views: '18K'
            }
        ]
    }
];

const Learning = () => {
    const [activeCategory, setActiveCategory] = useState('all');

    const filteredCategories = activeCategory === 'all'
        ? videoCategories
        : videoCategories.filter(cat => cat.id === activeCategory);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
            {/* Header */}
            <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Learning
                            </h1>
                            <p className="text-sm text-gray-600">
                                Master technical concepts with our curated video content
                            </p>
                        </div>
                        <a
                            href="https://www.youtube.com/@techelevategh/videos"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg font-semibold hover:from-red-700 hover:to-rose-700 transition-all shadow-md hover:shadow-lg text-sm"
                        >
                            <PlayCircleIcon className="h-5 w-5" />
                            <span>Visit YouTube</span>
                            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        </a>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === 'all'
                                ? 'bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                }`}
                        >
                            All Topics
                        </button>
                        {videoCategories.map(category => (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === category.id
                                    ? `bg-gradient-to-r ${category.color} text-white shadow-md`
                                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                    }`}
                            >
                                {category.title}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="space-y-12">
                    {filteredCategories.map((category) => (
                        <div key={category.id} className="space-y-6">
                            {/* Category Header */}
                            <div className={`flex items-start gap-4 p-6 rounded-2xl border ${category.borderColor} ${category.bgColor}`}>
                                <div className={`p-3 bg-white rounded-xl shadow-sm`}>
                                    <category.icon className={`h-8 w-8 bg-gradient-to-r ${category.color} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent' }} />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        {category.title}
                                    </h2>
                                    <p className="text-gray-600">
                                        {category.description}
                                    </p>
                                </div>
                                <div className={`px-4 py-2 bg-gradient-to-r ${category.color} text-white rounded-full text-sm font-semibold`}>
                                    {category.videos.length} Videos
                                </div>
                            </div>

                            {/* Video Grid */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                                {category.videos.map((video) => (
                                    <div
                                        key={video.id}
                                        className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all duration-300"
                                    >
                                        {/* Embedded YouTube Video */}
                                        <div className="relative aspect-video bg-gray-900">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${video.youtubeId}`}
                                                title={video.title}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="absolute inset-0 w-full h-full"
                                            ></iframe>
                                        </div>

                                        {/* Video Info */}
                                        <div className="p-5">
                                            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                                                {video.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                {video.description}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-500">
                                                        {video.views} views
                                                    </span>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-500">
                                                        {video.duration}
                                                    </span>
                                                </div>
                                                <a
                                                    href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                                >
                                                    YouTube
                                                    <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Book Recommendation for DSA */}
                            {category.id === 'dsa' && (
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-6 shadow-sm">
                                    <div className="flex items-start gap-6">
                                        <div className="flex-shrink-0">
                                            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                                <BookOpenIcon className="h-8 w-8 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <StarIcon className="h-5 w-5 text-amber-500 fill-amber-500" />
                                                <h3 className="text-lg font-bold text-gray-900">Recommended Book</h3>
                                            </div>
                                            <p className="text-xl font-bold text-gray-900 mb-2">
                                                A Common-Sense Guide to Data Structures and Algorithms
                                            </p>
                                            <p className="text-gray-700 mb-1">
                                                <span className="font-semibold">by Jay Wengrow</span>
                                            </p>
                                            <p className="text-sm text-gray-600 mt-3">
                                                This book breaks down complex DSA concepts into easy-to-understand explanations with practical examples. Perfect for mastering the fundamentals!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* View All Link */}
                            <div className="text-center pt-4">
                                <a
                                    href="https://www.youtube.com/@techelevategh/videos"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${category.color} text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 group`}
                                >
                                    <SparklesIcon className="h-5 w-5" />
                                    <span>View All {category.title} Videos</span>
                                    <ArrowTopRightOnSquareIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer CTA */}
                <div className="mt-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-1">
                    <div className="bg-white rounded-3xl p-8 text-center">
                        <SparklesIcon className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Subscribe for More Content
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                            Don't miss out on new tutorials, workshops, and tech insights. Subscribe to our YouTube channel for regular updates!
                        </p>
                        <a
                            href="https://www.youtube.com/@techelevategh/videos"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold hover:from-red-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl text-base"
                        >
                            <PlayCircleIcon className="h-6 w-6" />
                            <span>Subscribe on YouTube</span>
                            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Learning;