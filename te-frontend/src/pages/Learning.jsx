import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import axios from '../axiosConfig'
import {
    PlayCircleIcon,
    BookOpenIcon,
    CheckCircleIcon,
    ClockIcon,
    ArrowTopRightOnSquareIcon,
    AcademicCapIcon,
    ChartBarIcon,
    BookmarkIcon,
    LightBulbIcon,
    TrophyIcon,
    SparklesIcon,
    XMarkIcon,
    PlusIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    PencilSquareIcon,
    Bars3Icon,
    VideoCameraIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import {
    CheckCircleIcon as CheckCircleSolidIcon,
    BookmarkIcon as BookmarkSolidIcon,
    FireIcon as FireSolidIcon
} from '@heroicons/react/24/solid'

import { dsaTopics } from '../data/dsaTopics'
import { pythonTopics } from '../data/pythonTopics'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../context/DarkModeContext'
import LessonCreate from '../components/learning/LessonCreate'
import LessonCreateDSA from '../components/learning/LessonCreateDSA'

// Optimal learning order for DSA topics
const learningPath = [
    'Essentials',
    'Time & Space Complexity',
    'Arrays & Strings',
    'Pointers',
    'Hash Tables & Sets',
    'Linked Lists',
    'Stacks & Queues',
    'Searching & Sorting',
    'Recursion',
    'Trees & Binary Search Trees',
    'Tries',
    'Heaps & Priority Queues',
    'Backtracking',
    'Greedy Algorithms',
    'Graphs',
    'Dynamic Programming',
    'Bit Manipulation',
    'Advanced Topics'
];

const Learning = ({ setContent }) => {
    const { userRole: authUserRole, isAuthenticated, isLoading: authLoading } = useAuth();
    const userRole = authUserRole ? parseInt(authUserRole) : 0;
    const isAdmin = userRole >= 3; // Volunteer and above can manage content
    const isMember = userRole === 1; // Only Members (role=1) can track progress
    const isReferrer = userRole === 2; // Referrers cannot access learning content
    const isLoggedIn = isAuthenticated;
    const isLeadOrAdmin = userRole >= 4; // Lead (4) or Admin (5)

    const { darkMode } = useDarkMode();
    const [showStats, setShowStats] = useState(false);
    const [searchQuery, setSearchQuery] = useState(''); // Search filter for topics
    const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
    const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
    const [showAddLesson, setShowAddLesson] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [activeTab, setActiveTab] = useState('dsa'); // 'dsa', 'python', 'system-design'
    const [expandedTopics, setExpandedTopics] = useState(new Set());
    const [collapsedCategories, setCollapsedCategories] = useState(() => {
        // Collapse all categories by default
        return new Set(learningPath);
    });
    const [topicNotes, setTopicNotes] = useState({});
    const [completedTopics, setCompletedTopics] = useState(new Set());
    const [bookmarkedTopics, setBookmarkedTopics] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);

    // Python-specific progress
    const [pythonCompletedTopics, setPythonCompletedTopics] = useState(new Set());
    const [pythonBookmarkedTopics, setPythonBookmarkedTopics] = useState(new Set());
    const [pythonTopicNotes, setPythonTopicNotes] = useState({});
    const [pythonExpandedTopics, setPythonExpandedTopics] = useState(new Set());
    const [pythonCollapsedCategories, setPythonCollapsedCategories] = useState(() => {
        return new Set(Object.keys(pythonTopics));
    });

    // Lesson management state
    const [allLessons, setAllLessons] = useState([]);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [currentTopicForLesson, setCurrentTopicForLesson] = useState(null);

    const categoryRefs = useRef({});
    const [activeCategory, setActiveCategory] = useState('');
    const saveTimeoutRef = useRef(null);

    // Fetch progress from backend on mount
    useEffect(() => {
        const fetchProgress = async () => {
            if (!isLoggedIn) {
                // Load from localStorage for non-logged-in users
                const savedCompleted = localStorage.getItem('dsaCompletedTopics');
                const savedBookmarked = localStorage.getItem('dsaBookmarkedTopics');
                const savedNotes = localStorage.getItem('dsaTopicNotes');

                setCompletedTopics(savedCompleted ? new Set(JSON.parse(savedCompleted)) : new Set());
                setBookmarkedTopics(savedBookmarked ? new Set(JSON.parse(savedBookmarked)) : new Set());
                setTopicNotes(savedNotes ? JSON.parse(savedNotes) : {});
                setIsLoading(false);
                return;
            }

            try {
                const response = await axios.get('/learning/progress');
                const progress = response.data;

                setCompletedTopics(new Set(progress.completed_topics || []));
                setBookmarkedTopics(new Set(progress.bookmarked_topics || []));
                setTopicNotes(progress.topic_notes || {});
            } catch (error) {
                console.error('Error fetching progress:', error);
                // Fallback to localStorage
                const savedCompleted = localStorage.getItem('dsaCompletedTopics');
                const savedBookmarked = localStorage.getItem('dsaBookmarkedTopics');
                const savedNotes = localStorage.getItem('dsaTopicNotes');

                setCompletedTopics(savedCompleted ? new Set(JSON.parse(savedCompleted)) : new Set());
                setBookmarkedTopics(savedBookmarked ? new Set(JSON.parse(savedBookmarked)) : new Set());
                setTopicNotes(savedNotes ? JSON.parse(savedNotes) : {});
            } finally {
                setIsLoading(false);
            }
        };

        fetchProgress();
    }, [isLoggedIn]);

    // Fetch all lessons
    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const response = await axios.get('/learning/lessons?is_published=true');
                setAllLessons(response.data || []);
            } catch (error) {
                console.error('Error fetching lessons:', error);
                setAllLessons([]);
            }
        };

        fetchLessons();
    }, []);

    // Helper to get lessons for a specific topic
    const getLessonsForTopic = useCallback((category, topic) => {
        return allLessons.filter(
            lesson => lesson.category === category && lesson.topic === topic
        );
    }, [allLessons]);

    // Handle lesson creation/update success
    const handleLessonSuccess = () => {
        // Refresh lessons
        axios.get('/learning/lessons?is_published=true')
            .then(response => setAllLessons(response.data || []))
            .catch(error => console.error('Error refreshing lessons:', error));
    };

    // Open lesson modal for creating new lesson
    const openCreateLessonModal = (category, topic) => {
        setCurrentTopicForLesson({ category, topic });
        setSelectedLesson(null);
        setShowLessonModal(true);
    };

    // Debounced save to backend (only for Members)
    const saveProgressToBackend = useCallback(async (updates) => {
        if (!isLoggedIn || !isMember) return;

        try {
            await axios.post('/learning/progress', updates);
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }, [isLoggedIn, isMember]);

    // Save to localStorage for non-logged-in users or as backup
    useEffect(() => {
        if (!isLoading && isMember) {
            localStorage.setItem('dsaCompletedTopics', JSON.stringify([...completedTopics]));

            // Debounce backend save
            if (isLoggedIn) {
                if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = setTimeout(() => {
                    saveProgressToBackend({ completed_topics: [...completedTopics] });
                }, 1000);
            }
        }
    }, [completedTopics, isLoading, isLoggedIn, isMember, saveProgressToBackend]);

    useEffect(() => {
        if (!isLoading && isMember) {
            localStorage.setItem('dsaBookmarkedTopics', JSON.stringify([...bookmarkedTopics]));

            // Debounce backend save
            if (isLoggedIn && isMember) {
                if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = setTimeout(() => {
                    saveProgressToBackend({ bookmarked_topics: [...bookmarkedTopics] });
                }, 1000);
            }
        }
    }, [bookmarkedTopics, isLoading, isLoggedIn, isMember, saveProgressToBackend]);

    useEffect(() => {
        if (!isLoading && isMember) {
            localStorage.setItem('dsaTopicNotes', JSON.stringify(topicNotes));

            // Debounce backend save
            if (isLoggedIn) {
                if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = setTimeout(() => {
                    saveProgressToBackend({ topic_notes: topicNotes });
                }, 2000); // Longer delay for notes
            }
        }
    }, [topicNotes, isLoading, isLoggedIn, isMember, saveProgressToBackend]);

    useEffect(() => {
        localStorage.setItem('dsaDarkMode', darkMode);
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const toggleTopicCompletion = (categoryName, topicName) => {
        const key = `${categoryName}::${topicName}`;
        const newCompleted = new Set(completedTopics);
        if (newCompleted.has(key)) {
            newCompleted.delete(key);
        } else {
            newCompleted.add(key);
        }
        setCompletedTopics(newCompleted);
    };

    const toggleBookmark = (categoryName, topicName) => {
        const key = `${categoryName}::${topicName}`;
        const newBookmarked = new Set(bookmarkedTopics);
        if (newBookmarked.has(key)) {
            newBookmarked.delete(key);
        } else {
            newBookmarked.add(key);
        }
        setBookmarkedTopics(newBookmarked);
    };

    const isTopicCompleted = useCallback((categoryName, topicName) => {
        return completedTopics.has(`${categoryName}::${topicName}`);
    }, [completedTopics]);

    const isTopicBookmarked = useCallback((categoryName, topicName) => {
        return bookmarkedTopics.has(`${categoryName}::${topicName}`);
    }, [bookmarkedTopics]);

    const toggleTopicExpanded = (categoryName, topicName) => {
        const key = `${categoryName}::${topicName}`;
        const newExpanded = new Set(expandedTopics);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedTopics(newExpanded);
    };

    const isTopicExpanded = (categoryName, topicName) => {
        return expandedTopics.has(`${categoryName}::${topicName}`);
    };

    const updateTopicNote = (categoryName, topicName, note) => {
        const key = `${categoryName}::${topicName}`;
        setTopicNotes(prev => ({
            ...prev,
            [key]: note
        }));
    };

    const getTopicNote = (categoryName, topicName) => {
        const key = `${categoryName}::${topicName}`;
        return topicNotes[key] || '';
    };

    const toggleCategoryCollapse = (categoryName) => {
        const newCollapsed = new Set(collapsedCategories);
        if (newCollapsed.has(categoryName)) {
            newCollapsed.delete(categoryName);
        } else {
            newCollapsed.add(categoryName);
        }
        setCollapsedCategories(newCollapsed);
    };

    const isCategoryCollapsed = (categoryName) => {
        return collapsedCategories.has(categoryName);
    };

    // Smooth scroll to category
    const scrollToCategory = useCallback((categoryName) => {
        const element = categoryRefs.current[categoryName];

        if (element) {
            // Immediately set this category as active
            setActiveCategory(categoryName);

            // Expand the category if it's collapsed
            setCollapsedCategories(prev => {
                const newSet = new Set(prev);
                newSet.delete(categoryName);
                return newSet;
            });

            const headerOffset = 100; // Account for sticky header
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            // Close mobile sidebar after navigation
            if (window.innerWidth < 1024) {
                setShowSidebar(false);
            }
        }
    }, []);    // Get difficulty badge based on category
    const getDifficultyInfo = useCallback((categoryName) => {
        const difficultyMap = {
            'Essentials': { level: 'Beginner', color: 'bg-yellow-100 text-blue-700', icon: '🔵' },
            'Time & Space Complexity': { level: 'Beginner', color: 'bg-yellow-100 text-blue-700', icon: '🔵' },
            'Arrays & Strings': { level: 'Easy', color: 'bg-green-100 text-green-700', icon: '🟢' },
            'Pointers': { level: 'Easy', color: 'bg-green-100 text-green-700', icon: '🟢' },
            'Linked Lists': { level: 'Easy', color: 'bg-green-100 text-green-700', icon: '🟢' },
            'Stacks & Queues': { level: 'Easy', color: 'bg-green-100 text-green-700', icon: '🟢' },
            'Hash Tables & Sets': { level: 'Easy', color: 'bg-green-100 text-green-700', icon: '🟢' },
            'Searching & Sorting': { level: 'Medium', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
            'Recursion': { level: 'Medium', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
            'Trees & Binary Search Trees': { level: 'Medium', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
            'Tries': { level: 'Medium', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
            'Heaps & Priority Queues': { level: 'Medium', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
            'Backtracking': { level: 'Hard', color: 'bg-red-100 text-red-700', icon: '🔴' },
            'Graphs': { level: 'Hard', color: 'bg-red-100 text-red-700', icon: '🔴' },
            'Dynamic Programming': { level: 'Hard', color: 'bg-red-100 text-red-700', icon: '�' },
            'Greedy Algorithms': { level: 'Medium', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
            'Bit Manipulation': { level: 'Medium', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
            'Advanced Topics': { level: 'Hard', color: 'bg-red-100 text-red-700', icon: '🔴' }
        };
        return difficultyMap[categoryName] || { level: 'Medium', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' };
    }, []);

    // Get all topics in optimal learning order
    const orderedTopics = useMemo(() => {
        const ordered = learningPath.map(categoryName => {
            return dsaTopics.find(cat => cat.category === categoryName);
        }).filter(Boolean);
        return ordered;
    }, []);

    // Create a flat list of all topics with metadata
    const allTopicsFlat = useMemo(() => {
        const topics = [];
        orderedTopics.forEach((category, catIndex) => {
            category.topics.forEach((topic, topicIndex) => {
                topics.push({
                    ...topic,
                    category: category.category,
                    categoryColor: category.color,
                    categoryIndex: catIndex,
                    topicIndex: topicIndex,
                    globalIndex: topics.length + 1,
                    difficulty: getDifficultyInfo(category.category)
                });
            });
        });
        return topics;
    }, [orderedTopics, getDifficultyInfo]);

    // Calculate statistics
    const stats = useMemo(() => {
        const totalTopics = allTopicsFlat.length;
        const completed = completedTopics.size;
        const percentage = totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0;

        return {
            totalTopics,
            completed,
            remaining: totalTopics - completed,
            percentage,
            bookmarked: bookmarkedTopics.size
        };
    }, [completedTopics, bookmarkedTopics, allTopicsFlat]);

    // Base categories with progress metadata
    const filteredCategories = useMemo(() => {
        return orderedTopics.map(category => {
            const filteredTopics = category.topics;

            if (filteredTopics.length === 0) return null;

            return {
                ...category,
                topics: filteredTopics,
                difficulty: getDifficultyInfo(category.category),
                completed: filteredTopics.filter(t => isTopicCompleted(category.category, t.name)).length,
                total: filteredTopics.length
            };
        }).filter(Boolean);
    }, [orderedTopics, isTopicCompleted, getDifficultyInfo]);

    // Apply search filtering to topics while retaining category grouping
    const displayCategories = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return filteredCategories.map(cat => {
            let topics = cat.topics;
            if (q) topics = topics.filter(t => t.name.toLowerCase().includes(q));
            if (showBookmarkedOnly) topics = topics.filter(t => isTopicBookmarked(cat.category, t.name));
            if (showIncompleteOnly) topics = topics.filter(t => !isTopicCompleted(cat.category, t.name));
            return { ...cat, topics };
        }).filter(cat => cat.topics.length > 0);
    }, [filteredCategories, searchQuery, showBookmarkedOnly, showIncompleteOnly, isTopicBookmarked, isTopicCompleted]);

    // Scrollspy for sidebar navigation - improved to track topmost visible category
    useEffect(() => {
        const observers = [];
        const visibleCategories = new Map();

        const updateActiveCategory = () => {
            // Get all visible categories and sort by their position on the page
            const visibleEntries = Array.from(visibleCategories.entries())
                .filter(([_, isVisible]) => isVisible)
                .map(([category]) => {
                    const ref = categoryRefs.current[category];
                    const rect = ref?.getBoundingClientRect();
                    return { category, top: rect?.top || Infinity };
                })
                .sort((a, b) => a.top - b.top);

            // Set the topmost visible category as active
            if (visibleEntries.length > 0) {
                setActiveCategory(visibleEntries[0].category);
            }
        };

        Object.entries(categoryRefs.current).forEach(([category, ref]) => {
            if (ref) {
                const observer = new IntersectionObserver(
                    ([entry]) => {
                        visibleCategories.set(category, entry.isIntersecting);
                        updateActiveCategory();
                    },
                    { threshold: 0.1, rootMargin: '-120px 0px -60% 0px' }
                );
                observer.observe(ref);
                observers.push(observer);
            }
        });

        return () => {
            observers.forEach(obs => obs.disconnect());
            visibleCategories.clear();
        };
    }, [displayCategories]);

    // Block Referrers from accessing learning content
    if (isLoggedIn && isReferrer) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode
                ? 'bg-gradient-to-br from-slate-950 via-orange-950/30 to-orange-950/30'
                : 'bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100'
                }`}>
                <div className="max-w-md mx-auto p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        Access Restricted
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Learning content is only available for Members and Volunteers. As a Referrer, you have access to referral management features.
                    </p>
                    <button
                        onClick={() => window.location.href = '/referrals'}
                        className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        Go to Referrals
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-500 ${darkMode
            ? 'dark bg-slate-950'
            : 'bg-gray-50'
            }`}>
            {/* Background pattern */}
            {!darkMode && (
                <>
                    {/* VIBRANT Glowing orbs for light mode */}
                </>
            )}
            {darkMode && (
                <>
                    {/* Glowing orbs for dark mode */}
                </>
            )}

            {/* Animated background pattern */}
            <div className={`absolute inset-0 ${darkMode ? 'opacity-[0.03]' : 'opacity-[0.05]'}`} style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${darkMode ? 'FFFFFF' : '9C92AC'}' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>

            {/* Header (lower z to allow sidebar overlay) */}
            <div className={`sticky top-0 z-30 border-b shadow-sm transition-all duration-300 ${darkMode
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-gray-200'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <button
                                onClick={() => setShowSidebar(!showSidebar)}
                                className="lg:hidden p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all"
                                aria-label="Toggle sidebar"
                            >
                                <Bars3Icon className="w-5 h-5" />
                            </button>
                            <div className="flex-1">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-1 tracking-tight">
                                    Learning Hub
                                </h1>
                                {isMember && (
                                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                        <span className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                            {stats.totalTopics} Topics
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            {stats.completed} Completed
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                            {stats.bookmarked} Saved
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {isMember && (
                                <button
                                    onClick={() => setShowStats(!showStats)}
                                    className="group flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:border-blue-400 dark:hover:border-orange-500 transition-all text-sm"
                                >
                                    <ChartBarIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                    <span className="hidden sm:inline">Stats</span>
                                </button>
                            )}
                            {isLeadOrAdmin && setContent && (
                                <button
                                    onClick={() => setContent('Learning Analytics')}
                                    className="group relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 via-orange-600 to-yellow-600 hover:from-orange-500 hover:via-orange-500 hover:to-yellow-500 text-white rounded-xl font-bold hover:shadow-md hover:shadow-orange-500 shadow-lg transition-all duration-300 text-sm whitespace-nowrap overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-orange-400 to-yellow-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                                    <ChartBarIcon className="h-4 w-4 relative z-10 group-hover:scale-110 transition-transform" />
                                    <span className="relative z-10">Member Analytics</span>
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"></div>
                                </button>
                            )}
                            <a
                                href="https://www.youtube.com/@techelevategh/videos"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 via-rose-500 to-yellow-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-rose-500/30 transition-all text-sm flex-1 sm:flex-initial justify-center"
                            >
                                <PlayCircleIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">YouTube</span>
                            </a>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex gap-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('dsa')}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'dsa'
                                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                Data Structures & Algorithms
                            </button>
                            <button
                                onClick={() => setActiveTab('python')}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'python'
                                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                Python Programming
                            </button>
                            <button
                                onClick={() => setActiveTab('system-design')}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'system-design'
                                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                System Design
                            </button>
                        </nav>
                    </div>

                    {/* Search & Progress (Members) */}
                    {isMember && (
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="relative w-full sm:w-72 md:w-80">
                                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search topics..."
                                    className="w-full pl-9 pr-9 py-2 rounded-lg bg-white/95 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-te-cyan focus:border-transparent transition"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-medium rounded-md bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                                    >Clear</button>
                                )}
                            </div>
                            {/* Filters */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowBookmarkedOnly(b => !b)}
                                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${showBookmarkedOnly ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 shadow-sm' : 'bg-white/90 dark:bg-slate-800/70 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                                    title="Toggle bookmarked filter"
                                >
                                    <BookmarkIcon className="w-3.5 h-3.5" />
                                    Saved
                                </button>
                                <button
                                    onClick={() => setShowIncompleteOnly(b => !b)}
                                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${showIncompleteOnly ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-400 shadow-sm' : 'bg-white/90 dark:bg-slate-800/70 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                                    title="Toggle incomplete filter"
                                >
                                    <ClockIcon className="w-3.5 h-3.5" />
                                    Incomplete
                                </button>
                                {(showBookmarkedOnly || showIncompleteOnly) && (
                                    <button
                                        onClick={() => { setShowBookmarkedOnly(false); setShowIncompleteOnly(false); }}
                                        className="px-2 py-2 text-[10px] font-medium rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                                    >Reset</button>
                                )}
                            </div>
                            {/* Progress */}
                            <div className="flex items-center gap-2 ml-auto min-w-[180px]">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Progress</span>
                                <span className="text-sm font-bold text-gray-800 dark:text-white">{stats.percentage}%</span>
                                <div className="flex-1 h-2 bg-gray-200/60 dark:bg-gray-700/60 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-orange-600 via-orange-600 to-yellow-600 rounded-full transition-all" style={{ width: `${stats.percentage}%` }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Statistics Modal - Member Only */}
            {isMember && showStats && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowStats(false)}>
                    <div className={`rounded-3xl shadow-lg max-w-md w-full border backdrop-blur-sm ${darkMode
                        ? 'bg-slate-900/90 border-slate-700/50'
                        : 'bg-white/90 border-white/20'
                        }`} onClick={(e) => e.stopPropagation()}>
                        <div className={`px-8 py-6 border-b ${darkMode ? 'border-slate-700/50' : 'border-gray-100'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-yellow-600 flex items-center justify-center shadow-lg">
                                        <TrophyIcon className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Progress</h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Keep up the great work!</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowStats(false)}
                                    className="p-2 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                                >
                                    <XMarkIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                                        <CheckCircleIcon className="h-8 w-8 text-white" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 dark:text-white mb-1">{stats.completed}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Done</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg">
                                        <ClockIcon className="h-8 w-8 text-white" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 dark:text-white mb-1">{stats.remaining}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">To Go</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-orange-600 via-orange-600 to-yellow-600 flex items-center justify-center shadow-lg">
                                        <BookmarkIcon className="h-8 w-8 text-white" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 dark:text-white mb-1">{stats.bookmarked}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Saved</p>
                                </div>
                            </div>

                            <div className={`pt-6 border-t ${darkMode ? 'border-slate-700/50' : 'border-gray-100'}`}>
                                <div className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border ${darkMode
                                    ? 'bg-gradient-to-r from-orange-500/30 via-orange-500/30 to-yellow-500/30 border-orange-500/80'
                                    : 'bg-gradient-to-r from-orange-500/20 via-orange-500/20 to-yellow-500/20 border-orange-400/80'
                                    }`}>
                                    <FireSolidIcon className="h-7 w-7 text-orange-500" />
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-700 via-orange-600 to-yellow-600 dark:from-orange-400 dark:to-amber-400">{stats.percentage}%</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Complete</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Book Recommendation & Learning Tip for DSA */}
            {activeTab === "dsa" && !authLoading && !isLoggedIn && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* BOLD Glass Book Card */}
                        <div className="backdrop-blur-sm bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-pink-500/20 dark:from-purple-900/30 dark:via-fuchsia-900/30 dark:to-pink-900/30 border border-purple-400/50 dark:border-fuchsia-500/50 rounded-2xl p-5 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] transition-all duration-300">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-md shadow-purple-500/50">
                                        <BookOpenIcon className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="px-3 py-1 bg-gradient-to-r from-purple-100 via-fuchsia-100 to-pink-100 dark:from-purple-900/60 dark:via-fuchsia-900/60 dark:to-pink-900/60 text-purple-800 dark:text-fuchsia-300 rounded-full text-xs font-bold border border-purple-400 dark:border-fuchsia-500">
                                            📚 Recommended
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                                        A Common-Sense Guide to DSA
                                    </p>
                                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                        by Jay Wengrow
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Learning Tip Card */}
                        <div className="glass dark:bg-gradient-to-br dark:from-blue-900/20 dark:to-orange-900/20 bg-gradient-to-br from-blue-50 to-orange-50 dark:border-blue-700/30 border-blue-200/50 rounded-xl p-4 border shadow-md hover:shadow-lg transition-all">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                                        <LightBulbIcon className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 rounded-full text-xs font-semibold">
                                            💡 Pro Tip
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white mb-0.5">
                                        Practice Daily
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Solve at least one problem every day
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>)}

            {/* Main Content with Sidebar */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
                {/* DSA Tab Content */}
                {activeTab === 'dsa' && (
                    <div className="flex gap-6">
                        {/* Sign-in Prompt for Non-logged-in Users */}
                        {!authLoading && !isLoggedIn && (
                            <div className="w-full glass dark:bg-gradient-to-br dark:from-orange-900/40 dark:via-blue-900/30 dark:to-blue-900/40 bg-gradient-to-br from-orange-50 via-blue-50 to-orange-50 backdrop-blur-sm rounded-2xl border border-orange-300/50 dark:border-orange-600/30 p-8 shadow-md mb-6">
                                <div className="flex items-start gap-6">
                                    <div className="flex-shrink-0 p-4 bg-gradient-to-br from-orange-500 to-blue-600 rounded-2xl shadow-lg">
                                        <AcademicCapIcon className="w-10 h-10 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-orange-900 dark:text-orange-100 mb-2 text-xl">Track Your Learning Progress</h3>
                                        <p className="text-sm text-orange-800 dark:text-orange-200 mb-5 leading-relaxed">
                                            Sign in to save your progress, bookmark topics, take notes, and track your DSA journey. Stay motivated with personalized stats!
                                        </p>
                                        <a
                                            href="/login"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
                                        >
                                            <AcademicCapIcon className="w-5 h-5" />
                                            <span>Sign In to Track Progress</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sidebar Navigation */}
                        {showSidebar && (
                            <>
                                {/* Mobile Overlay (raised z-index) */}
                                <div
                                    className="fixed inset-0 bg-black/50 z-[110] lg:hidden"
                                    onClick={() => setShowSidebar(false)}
                                ></div>

                                {/* Sidebar Container - Fixed on mobile, Sticky on desktop */}
                                <aside className="fixed lg:relative top-0 left-0 h-full lg:h-auto w-64 z-[120] lg:z-auto flex-shrink-0">
                                    <div className="lg:sticky lg:top-24 glass dark:bg-gray-800/95 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-2xl p-5 shadow-lg h-full lg:h-auto lg:max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                                        <div className="flex items-center justify-between mb-4 lg:block">
                                            <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Categories</h3>
                                            <button
                                                onClick={() => setShowSidebar(false)}
                                                className="lg:hidden p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50"
                                                aria-label="Close sidebar"
                                            >
                                                <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                            </button>
                                        </div>
                                        <nav className="space-y-1">
                                            {displayCategories.map((category, idx) => {
                                                const progressPercentage = Math.round((category.completed / category.total) * 100);
                                                const isActive = activeCategory === category.category;

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            scrollToCategory(category.category);
                                                        }}
                                                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${isActive
                                                            ? 'bg-orange-500 text-white shadow-md'
                                                            : 'hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-sm font-medium truncate">{category.category}</span>
                                                            {isMember && (
                                                                <span className="text-xs opacity-75">{category.completed}/{category.total}</span>
                                                            )}
                                                        </div>
                                                        {isMember && (
                                                            <div className="w-full bg-white/30 dark:bg-gray-600/30 rounded-full h-1.5 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${isActive ? 'bg-white' : 'bg-orange-500'
                                                                        }`}
                                                                    style={{ width: `${progressPercentage}%` }}
                                                                ></div>
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </nav>
                                    </div>
                                </aside>
                            </>
                        )}

                        {/* Topics by Category */}
                        <div className="flex-1 min-w-0">
                            {displayCategories.length === 0 ? (
                                <div className="glass dark:bg-gray-800/50 dark:border-gray-700/50 rounded-3xl border border-white/20 shadow-md p-16 text-center">
                                    <SparklesIcon className="h-20 w-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No topics found</h3>
                                    <p className="text-gray-600 dark:text-gray-400">Adjust your search or filter to see results</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {displayCategories.map((category, catIdx) => {
                                        const progressPercentage = Math.round((category.completed / category.total) * 100);

                                        return (
                                            <div
                                                key={catIdx}
                                                id={category.category.replace(/\s+/g, '-')}
                                                ref={(el) => (categoryRefs.current[category.category] = el)}
                                                className={`rounded-2xl border shadow-md overflow-hidden backdrop-blur-sm transition-all duration-300 ${darkMode
                                                    ? 'bg-slate-900/70 border-slate-700/50 hover:bg-slate-900/80 hover:border-slate-600/50'
                                                    : 'bg-white/90 border-white/30 hover:bg-white/90 hover:shadow-lg'
                                                    }`}
                                            >
                                                {/* Category Header */}
                                                <div className={`px-4 py-2.5 border-b cursor-pointer transition-all group/category ${darkMode
                                                    ? 'bg-gradient-to-r from-slate-800/60 to-slate-800/40 border-slate-700/50 hover:from-slate-800/70 hover:to-slate-800/50'
                                                    : 'bg-gradient-to-r from-white/60 to-white/40 border-gray-200/50 hover:from-white/80 hover:to-white/60'
                                                    }`} onClick={() => toggleCategoryCollapse(category.category)}>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <button
                                                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                                aria-label="Toggle category"
                                                            >
                                                                {isCategoryCollapsed(category.category) ? (
                                                                    <ChevronDownIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                                                ) : (
                                                                    <ChevronUpIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                                                )}
                                                            </button>
                                                            <div className="flex items-center gap-3 flex-wrap">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="relative w-10 h-10">
                                                                        {isMember && (
                                                                            <svg className="w-10 h-10 rotate-[-90deg]" viewBox="0 0 36 36">
                                                                                <circle cx="18" cy="18" r="15" fill="none" stroke={darkMode ? '#334155' : '#e2e8f0'} strokeWidth="4" />
                                                                                <circle cx="18" cy="18" r="15" fill="none" stroke="url(#gradProgress)" strokeWidth="4" strokeLinecap="round" strokeDasharray="94" strokeDashoffset={isMember ? 94 - Math.round((category.completed / category.total) * 94) : 94} />
                                                                                <defs>
                                                                                    <linearGradient id="gradProgress" x1="0" y1="0" x2="1" y2="1">
                                                                                        <stop offset="0%" stopColor="#2563EB" />
                                                                                        <stop offset="50%" stopColor="#3B82F6" />
                                                                                        <stop offset="100%" stopColor="#60A5FA" />
                                                                                    </linearGradient>
                                                                                </defs>
                                                                            </svg>
                                                                        )}
                                                                        {isMember && (
                                                                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-orange-600 dark:text-orange-400">
                                                                                {Math.round((category.completed / category.total) * 100)}%
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                                                                        {category.category}
                                                                    </h2>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 text-orange-700 dark:text-orange-300`}>
                                                                        {category.difficulty.level}
                                                                    </span>
                                                                    <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium">
                                                                        {category.total} topics
                                                                    </span>
                                                                    {isMember && category.completed > 0 && (
                                                                        <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md text-xs font-semibold">
                                                                            {category.completed}/{category.total} ✓
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {isMember && category.completed > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-right">
                                                                    <p className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">{progressPercentage}%</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Topics Table */}
                                                {!isCategoryCollapsed(category.category) && (
                                                    <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                                        {category.topics.map((topic, topicIdx) => {
                                                            const isCompleted = isTopicCompleted(category.category, topic.name);
                                                            const isBookmarked = isTopicBookmarked(category.category, topic.name);
                                                            const isExpanded = isTopicExpanded(category.category, topic.name);
                                                            const globalIndex = allTopicsFlat.findIndex(
                                                                t => t.category === category.category && t.name === topic.name
                                                            ) + 1;

                                                            return (
                                                                <div
                                                                    key={topicIdx}
                                                                    className={`transition-all border-l-2 ${isCompleted
                                                                        ? 'bg-emerald-50/40 dark:bg-emerald-900/10 border-emerald-500 dark:border-emerald-400'
                                                                        : isBookmarked
                                                                            ? 'bg-orange-50/30 dark:bg-amber-900/10 border-orange-500 dark:border-amber-400'
                                                                            : 'bg-white/20 dark:bg-gray-800/20 border-transparent hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white/40 dark:hover:bg-gray-800/30'
                                                                        } backdrop-blur-sm`}
                                                                >
                                                                    <div className="px-3 py-2 hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all">
                                                                        <div className="flex items-start gap-2">
                                                                            {/* Number & Status */}
                                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                                <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-orange-600 dark:from-blue-500 dark:to-orange-500 flex items-center justify-center shadow-sm">
                                                                                    <span className="text-white font-bold text-xs">
                                                                                        {globalIndex}
                                                                                    </span>
                                                                                </div>
                                                                                {isMember && (
                                                                                    <button
                                                                                        onClick={() => toggleTopicCompletion(category.category, topic.name)}
                                                                                        className="group/check flex-shrink-0"
                                                                                        aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                                                                                    >
                                                                                        {isCompleted ? (
                                                                                            <CheckCircleSolidIcon className="h-4 w-4 text-emerald-500 dark:text-emerald-400 group-hover/check:scale-110 transition-transform" />
                                                                                        ) : (
                                                                                            <div className="h-4 w-4 border border-gray-300 dark:border-gray-600 rounded-full group-hover/check:border-emerald-500 dark:group-hover/check:border-emerald-400 group-hover/check:scale-110 transition-all"></div>
                                                                                        )}
                                                                                    </button>
                                                                                )}
                                                                            </div>

                                                                            {/* Topic Info */}
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <h3 className={`text-xs font-semibold ${isCompleted ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-gray-900 dark:text-white'
                                                                                            }`}>
                                                                                            {topic.name}
                                                                                        </h3>
                                                                                        <button
                                                                                            onClick={() => toggleTopicExpanded(category.category, topic.name)}
                                                                                            className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                                                            aria-label="Toggle details"
                                                                                        >
                                                                                            {isExpanded ? (
                                                                                                <ChevronUpIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                                                                            ) : (
                                                                                                <ChevronDownIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                                                                            )}
                                                                                        </button>
                                                                                    </div>
                                                                                    {isMember && (
                                                                                        <button
                                                                                            onClick={() => toggleBookmark(category.category, topic.name)}
                                                                                            className="group/bookmark flex-shrink-0 p-0.5 rounded hover:bg-orange-50 dark:hover:bg-amber-900/20 transition-colors"
                                                                                            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                                                                                        >
                                                                                            {isBookmarked ? (
                                                                                                <BookmarkSolidIcon className="h-3.5 w-3.5 text-orange-500 dark:text-amber-400 group-hover/bookmark:scale-110 transition-transform" />
                                                                                            ) : (
                                                                                                <BookmarkIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 group-hover/bookmark:text-orange-500 dark:group-hover/bookmark:text-amber-400 group-hover/bookmark:scale-110 transition-all" />
                                                                                            )}
                                                                                        </button>
                                                                                    )}
                                                                                </div>

                                                                                {/* Resources Grid */}
                                                                                <div className="grid sm:grid-cols-2 gap-1.5">
                                                                                    {/* Video Resource */}
                                                                                    {topic.youtubeId ? (
                                                                                        <a
                                                                                            href={`https://www.youtube.com/watch?v=${topic.youtubeId}`}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-red-50/80 to-rose-50/80 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200/60 dark:border-red-700/30 text-red-700 dark:text-red-300 rounded-md text-xs font-medium hover:shadow-sm hover:scale-[1.01] transition-all group/link backdrop-blur-sm"
                                                                                        >
                                                                                            <PlayCircleIcon className="h-3 w-3 flex-shrink-0" />
                                                                                            <span className="flex-1 truncate">Video</span>
                                                                                            <ArrowTopRightOnSquareIcon className="h-2.5 w-2.5 opacity-60 group-hover/link:opacity-100 transition-opacity" />
                                                                                        </a>
                                                                                    ) : (
                                                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/30 text-gray-400 dark:text-gray-600 rounded-md text-xs backdrop-blur-sm">
                                                                                            <PlayCircleIcon className="h-3 w-3 flex-shrink-0" />
                                                                                            <span className="flex-1 italic text-xs">Soon</span>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Practice Resources */}
                                                                                    {topic.resources && topic.resources.length > 0 && (
                                                                                        <div className="flex flex-wrap gap-1">
                                                                                            {topic.resources.slice(0, 2).map((resource, resIdx) => (
                                                                                                <a
                                                                                                    key={resIdx}
                                                                                                    href={resource.url}
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-white/60 dark:bg-gray-700/40 backdrop-blur-md border border-orange-200/60 dark:border-orange-700/30 text-orange-700 dark:text-orange-300 rounded-md text-xs font-medium hover:bg-orange-50/80 dark:hover:bg-orange-900/20 hover:shadow-sm transition-all group/resource"
                                                                                                >
                                                                                                    <span className="truncate max-w-[90px]">{resource.name}</span>
                                                                                                    <ArrowTopRightOnSquareIcon className="h-2.5 w-2.5 opacity-60 group-hover/resource:opacity-100 transition-opacity flex-shrink-0" />
                                                                                                </a>
                                                                                            ))}
                                                                                            {topic.resources.length > 2 && (
                                                                                                <span className="inline-flex items-center px-2 py-1 bg-gray-100/60 dark:bg-gray-700/40 text-gray-600 dark:text-gray-400 rounded-md text-xs font-medium backdrop-blur-sm">
                                                                                                    +{topic.resources.length - 2}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Expandable Notes Section */}
                                                                    {isExpanded && (
                                                                        <div className="px-6 pb-5 pt-2 bg-white/20 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700/50">
                                                                            <div className="space-y-3">
                                                                                {/* Lessons Section */}
                                                                                {(() => {
                                                                                    const topicLessons = getLessonsForTopic(category.category, topic.name);
                                                                                    return (
                                                                                        <div>
                                                                                            <div className="flex items-center justify-between mb-2">
                                                                                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                                                                    <VideoCameraIcon className="w-4 h-4" />
                                                                                                    Lessons {topicLessons.length > 0 && `(${topicLessons.length})`}
                                                                                                </h4>
                                                                                                {isAdmin && (
                                                                                                    <button
                                                                                                        onClick={() => openCreateLessonModal(category.category, topic.name)}
                                                                                                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-orange-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                                                                                    >
                                                                                                        <PlusIcon className="w-3.5 h-3.5" />
                                                                                                        Add Lesson
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                            {topicLessons.length > 0 ? (
                                                                                                <div className="space-y-2">
                                                                                                    {topicLessons.map((lesson) => (
                                                                                                        <div
                                                                                                            key={lesson.id}
                                                                                                            className="p-3 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-all"
                                                                                                        >
                                                                                                            <div className="flex items-start justify-between gap-3">
                                                                                                                <div className="flex-1">
                                                                                                                    <h5 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                                                                                                                        {lesson.title}
                                                                                                                    </h5>
                                                                                                                    {lesson.description && (
                                                                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                                                                                                            {lesson.description}
                                                                                                                        </p>
                                                                                                                    )}
                                                                                                                    <div className="flex flex-wrap gap-2 items-center">
                                                                                                                        {lesson.video_id && (
                                                                                                                            <a
                                                                                                                                href={`https://www.youtube.com/watch?v=${lesson.video_id}`}
                                                                                                                                target="_blank"
                                                                                                                                rel="noopener noreferrer"
                                                                                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                                                                                                            >
                                                                                                                                <PlayCircleIcon className="w-3.5 h-3.5" />
                                                                                                                                Watch Video
                                                                                                                            </a>
                                                                                                                        )}
                                                                                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${lesson.difficulty === 'Beginner' || lesson.difficulty === 'Easy'
                                                                                                                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                                                                                            : lesson.difficulty === 'Medium'
                                                                                                                                ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                                                                                                                : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                                                                                                            }`}>
                                                                                                                            {lesson.difficulty}
                                                                                                                        </span>
                                                                                                                        {lesson.duration_minutes && (
                                                                                                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                                                                                                <ClockIcon className="w-3 h-3" />
                                                                                                                                {lesson.duration_minutes} min
                                                                                                                            </span>
                                                                                                                        )}
                                                                                                                        {lesson.instructor && (
                                                                                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                                                                                by {lesson.instructor}
                                                                                                                            </span>
                                                                                                                        )}
                                                                                                                    </div>
                                                                                                                    {lesson.resources && lesson.resources.length > 0 && (
                                                                                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                                                                                            {lesson.resources.map((resource, idx) => (
                                                                                                                                <a
                                                                                                                                    key={idx}
                                                                                                                                    href={resource.url}
                                                                                                                                    target="_blank"
                                                                                                                                    rel="noopener noreferrer"
                                                                                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs hover:bg-yellow-100 dark:hover:bg-blue-900/30 transition-colors"
                                                                                                                                >
                                                                                                                                    {resource.title}
                                                                                                                                    <ArrowTopRightOnSquareIcon className="w-2.5 h-2.5" />
                                                                                                                                </a>
                                                                                                                            ))}
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            ) : (
                                                                                                <p className="text-xs text-gray-500 dark:text-gray-400 italic py-2">
                                                                                                    No lessons available yet. {isAdmin && 'Click "Add Lesson" to create one!'}
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })()}

                                                                                {/* All Resources */}
                                                                                {topic.resources && topic.resources.length > 0 && (
                                                                                    <div>
                                                                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                                                            <BookOpenIcon className="w-4 h-4" />
                                                                                            All Practice Resources
                                                                                        </h4>
                                                                                        <div className="flex flex-wrap gap-2">
                                                                                            {topic.resources.map((resource, resIdx) => (
                                                                                                <a
                                                                                                    key={resIdx}
                                                                                                    href={resource.url}
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-700 border border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300 rounded-lg text-xs font-medium hover:shadow-md transition-all"
                                                                                                >
                                                                                                    <span>{resource.name}</span>
                                                                                                    <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                                                                                                </a>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                {/* Notes Editor - Only for Members */}
                                                                                {isMember && (
                                                                                    <div>
                                                                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                                                            <PencilSquareIcon className="w-4 h-4" />
                                                                                            Personal Notes
                                                                                        </label>
                                                                                        <textarea
                                                                                            value={getTopicNote(category.category, topic.name)}
                                                                                            onChange={(e) => updateTopicNote(category.category, topic.name, e.target.value)}
                                                                                            placeholder="Add your notes, key points, or reminders here..."
                                                                                            className="w-full px-4 py-3 bg-surface dark:bg-surface border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-te-cyan focus:border-transparent resize-none transition-all"
                                                                                            rows="4"
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Footer CTA */}
                            <div className="mt-6">
                                <div className="glass dark:bg-gray-800/50 dark:border-gray-700/50 rounded-xl p-6 border border-white/20 shadow-md text-center">
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br from-blue-500 to-orange-600 flex items-center justify-center shadow-lg">
                                        <AcademicCapIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                                        Ready to Master DSA?
                                    </h3>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                                        Subscribe for in-depth tutorials and live workshops
                                    </p>
                                    <a
                                        href="https://www.youtube.com/@techelevategh/videos"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all text-sm"
                                    >
                                        <PlayCircleIcon className="h-4 w-4" />
                                        <span>Subscribe on YouTube</span>
                                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Python Programming Tab Content */}
                {activeTab === 'python' && (
                    <div className="space-y-6">
                        {/* Sign-in Prompt for Non-logged-in Users */}
                        {!authLoading && !isLoggedIn && (
                            <div className="glass dark:bg-gradient-to-br dark:from-orange-900/40 dark:via-blue-900/30 dark:to-blue-900/40 bg-gradient-to-br from-orange-50 via-blue-50 to-orange-50 backdrop-blur-sm rounded-2xl border border-orange-300/50 dark:border-orange-600/30 p-8 shadow-md">
                                <div className="flex items-start gap-6">
                                    <div className="flex-shrink-0 p-4 bg-gradient-to-br from-orange-500 to-blue-600 rounded-2xl shadow-lg">
                                        <AcademicCapIcon className="w-10 h-10 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-orange-900 dark:text-orange-100 mb-2 text-xl">Track Your Learning Progress</h3>
                                        <p className="text-sm text-orange-800 dark:text-orange-200 mb-5 leading-relaxed">
                                            Sign in to save your progress, bookmark topics, and keep notes as you learn Python. Your journey will be synced across all devices!
                                        </p>
                                        <a
                                            href="/login"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
                                        >
                                            <AcademicCapIcon className="w-5 h-5" />
                                            <span>Sign In to Track Progress</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Python Progress Header - Only for Members */}
                        {isMember && (
                            <div className="glass dark:bg-gradient-to-r dark:from-blue-900/30 dark:to-blue-900/30 bg-gradient-to-r from-orange-50 to-blue-50 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/30 shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Python Programming</h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">From beginner to advanced mastery</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                                                {pythonCompletedTopics.size}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                                                {Object.values(pythonTopics).reduce((sum, cat) => sum + cat.topics.length, 0)}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Total Topics</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-orange-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Object.values(pythonTopics).reduce((sum, cat) => sum + cat.topics.length, 0) > 0
                                                    ? (pythonCompletedTopics.size / Object.values(pythonTopics).reduce((sum, cat) => sum + cat.topics.length, 0)) * 100
                                                    : 0}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Python Topics Grid */}
                        <div className="grid gap-6">
                            {Object.entries(pythonTopics).map(([categoryName, categoryData], idx) => {
                                const isCategoryCollapsed = pythonCollapsedCategories.has(categoryName);
                                const categoryCompleted = categoryData.topics.filter(topic =>
                                    pythonCompletedTopics.has(`${categoryName}::${topic.name}`)
                                ).length;

                                return (
                                    <div
                                        key={idx}
                                        className="glass dark:bg-slate-800/60 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                                    >
                                        {/* Category Header */}
                                        <div
                                            className="px-8 py-6 border-b border-gray-200/50 dark:border-slate-700/50 cursor-pointer bg-gradient-to-r from-transparent via-gray-50/30 to-transparent dark:via-slate-700/20 hover:from-orange-50/50 hover:via-blue-50/50 hover:to-orange-50/50 dark:hover:from-blue-900/20 dark:hover:via-blue-900/20 dark:hover:to-blue-900/20 transition-all"
                                            onClick={() => {
                                                const newCollapsed = new Set(pythonCollapsedCategories);
                                                if (newCollapsed.has(categoryName)) {
                                                    newCollapsed.delete(categoryName);
                                                } else {
                                                    newCollapsed.add(categoryName);
                                                }
                                                setPythonCollapsedCategories(newCollapsed);
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className={`flex-shrink-0 transition-transform duration-200 ${isCategoryCollapsed ? '' : 'rotate-0'}`}>
                                                        {isCategoryCollapsed ? (
                                                            <ChevronDownIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                                        ) : (
                                                            <ChevronUpIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                                            {categoryName}
                                                        </h3>
                                                        <div className="flex items-center gap-4">
                                                            <span className={`px-3.5 py-1.5 ${categoryData.difficulty.color} rounded-lg text-xs font-bold shadow-sm uppercase tracking-wide`}>
                                                                {categoryData.difficulty.level}
                                                            </span>
                                                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                                {categoryData.topics.length} {categoryData.topics.length === 1 ? 'Topic' : 'Topics'}
                                                            </span>
                                                            {isMember && categoryCompleted > 0 && (
                                                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold">
                                                                    <CheckCircleSolidIcon className="w-4 h-4" />
                                                                    {categoryCompleted} Completed
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isMember && (
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            <div className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                                                {categoryCompleted}/{categoryData.topics.length}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                                {Math.round((categoryCompleted / categoryData.topics.length) * 100)}% Complete
                                                            </div>
                                                        </div>
                                                        <div className="w-40 bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner">
                                                            <div
                                                                className="bg-gradient-to-r from-orange-500 via-blue-500 to-orange-500 h-3 rounded-full transition-all duration-500 shadow-sm relative overflow-hidden"
                                                                style={{ width: `${(categoryCompleted / categoryData.topics.length) * 100}%` }}
                                                            >
                                                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Topics List */}
                                        {!isCategoryCollapsed && (
                                            <div className="p-6 space-y-3">
                                                {categoryData.topics.map((topic, topicIdx) => {
                                                    const topicKey = `${categoryName}::${topic.name}`;
                                                    const isCompleted = pythonCompletedTopics.has(topicKey);
                                                    const isBookmarked = pythonBookmarkedTopics.has(topicKey);
                                                    const isExpanded = pythonExpandedTopics.has(topicKey);

                                                    return (
                                                        <div
                                                            key={topicIdx}
                                                            className={`group relative rounded-xl border-2 transition-all duration-200 cursor-pointer overflow-hidden ${isCompleted
                                                                ? 'border-green-400 dark:border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20'
                                                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-orange-500 hover:shadow-lg'
                                                                }`}
                                                            onClick={() => {
                                                                const newExpanded = new Set(pythonExpandedTopics);
                                                                if (newExpanded.has(topicKey)) {
                                                                    newExpanded.delete(topicKey);
                                                                } else {
                                                                    newExpanded.add(topicKey);
                                                                }
                                                                setPythonExpandedTopics(newExpanded);
                                                            }}
                                                        >
                                                            {/* Topic Row */}
                                                            <div className="p-5">
                                                                <div className="flex items-center justify-between gap-4">
                                                                    {/* Left side - Topic info */}
                                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                                        {/* Expand/Collapse Icon */}
                                                                        <div className="flex-shrink-0">
                                                                            {isExpanded ? (
                                                                                <ChevronUpIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                                                            ) : (
                                                                                <ChevronDownIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                                                            )}
                                                                        </div>

                                                                        {/* Topic Title and Description */}
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-3 mb-1">
                                                                                <h4 className={`font-bold text-gray-900 dark:text-white text-base ${isCompleted ? 'line-through opacity-70' : ''
                                                                                    }`}>
                                                                                    {topic.name}
                                                                                </h4>
                                                                                {isCompleted && (
                                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-full text-xs font-bold flex-shrink-0">
                                                                                        <CheckCircleSolidIcon className="w-3 h-3" />
                                                                                        Completed
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                                                                {topic.description}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Right side - Actions and badges */}
                                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                                        {/* Resources badge */}
                                                                        {!isExpanded && topic.resources && topic.resources.length > 0 && (
                                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg text-xs font-semibold">
                                                                                <BookOpenIcon className="w-3.5 h-3.5" />
                                                                                {topic.resources.length} resource{topic.resources.length > 1 ? 's' : ''}
                                                                            </span>
                                                                        )}

                                                                        {/* Progress tracking buttons - Only for Members */}
                                                                        {isMember && (
                                                                            <>
                                                                                {/* Bookmark button */}
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        const newBookmarked = new Set(pythonBookmarkedTopics);
                                                                                        if (newBookmarked.has(topicKey)) {
                                                                                            newBookmarked.delete(topicKey);
                                                                                        } else {
                                                                                            newBookmarked.add(topicKey);
                                                                                        }
                                                                                        setPythonBookmarkedTopics(newBookmarked);
                                                                                    }}
                                                                                    className="p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all"
                                                                                    title={isBookmarked ? "Remove bookmark" : "Bookmark topic"}
                                                                                >
                                                                                    {isBookmarked ? (
                                                                                        <BookmarkSolidIcon className="w-5 h-5 text-orange-500" />
                                                                                    ) : (
                                                                                        <BookmarkIcon className="w-5 h-5 text-gray-400 group-hover:text-amber-400" />
                                                                                    )}
                                                                                </button>

                                                                                {/* Complete button */}
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        const newCompleted = new Set(pythonCompletedTopics);
                                                                                        if (newCompleted.has(topicKey)) {
                                                                                            newCompleted.delete(topicKey);
                                                                                        } else {
                                                                                            newCompleted.add(topicKey);
                                                                                        }
                                                                                        setPythonCompletedTopics(newCompleted);
                                                                                    }}
                                                                                    className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-all"
                                                                                    title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                                                                                >
                                                                                    {isCompleted ? (
                                                                                        <CheckCircleSolidIcon className="w-5 h-5 text-green-600 dark:text-green-500" />
                                                                                    ) : (
                                                                                        <CheckCircleIcon className="w-5 h-5 text-gray-400 group-hover:text-green-500" />
                                                                                    )}
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Expanded Content */}
                                                                {isExpanded && (
                                                                    <div className="mt-5 pt-5 border-t-2 border-gray-200 dark:border-gray-700 space-y-5">
                                                                        <div className="grid md:grid-cols-2 gap-6">
                                                                            {/* Key Points */}
                                                                            {topic.keyPoints && topic.keyPoints.length > 0 && (
                                                                                <div className="text-left">
                                                                                    <h5 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                                                                                        <LightBulbIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                                                        Key Concepts
                                                                                    </h5>
                                                                                    <ul className="space-y-2.5 text-left">
                                                                                        {topic.keyPoints.map((point, i) => (
                                                                                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-3 leading-relaxed">
                                                                                                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-orange-500 mt-2"></span>
                                                                                                <span className="flex-1 text-left">{point}</span>
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            )}

                                                                            {/* Resources */}
                                                                            {topic.resources && topic.resources.length > 0 && (
                                                                                <div className="text-left">
                                                                                    <h5 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                                                                                        <BookOpenIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                                                        Learning Resources
                                                                                    </h5>
                                                                                    <div className="space-y-2.5 text-left">
                                                                                        {topic.resources.map((resource, i) => (
                                                                                            <a
                                                                                                key={i}
                                                                                                href={resource.url}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="group/link flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-white dark:from-slate-900/50 dark:to-slate-800/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:border-blue-400 dark:hover:border-orange-500 hover:bg-gradient-to-r hover:from-orange-50 hover:to-blue-50 dark:hover:from-blue-900/20 dark:hover:to-blue-900/20 transition-all shadow-sm hover:shadow-md text-left"
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                            >
                                                                                                {resource.type === 'video' && <VideoCameraIcon className="w-5 h-5 text-red-500 flex-shrink-0" />}
                                                                                                {resource.type === 'article' && <BookOpenIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />}
                                                                                                <span className="flex-1 group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 font-medium text-left">
                                                                                                    {resource.title}
                                                                                                </span>
                                                                                                <ArrowTopRightOnSquareIcon className="w-4 h-4 opacity-50 group-hover/link:opacity-100 flex-shrink-0" />
                                                                                            </a>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Notes Section - Full Width - Only for Members */}
                                                                        {isMember && (
                                                                            <div className="text-left">
                                                                                <label className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2.5 flex items-center gap-2">
                                                                                    <PencilSquareIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                                                                    Personal Notes
                                                                                </label>
                                                                                <textarea
                                                                                    value={pythonTopicNotes[topicKey] || ''}
                                                                                    onChange={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setPythonTopicNotes(prev => ({
                                                                                            ...prev,
                                                                                            [topicKey]: e.target.value
                                                                                        }));
                                                                                    }}
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                    placeholder="Add your notes, code snippets, or key takeaways..."
                                                                                    className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-surface dark:bg-surface text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-te-cyan focus:border-transparent resize-none transition-all leading-relaxed text-left"
                                                                                    rows={4}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* System Design Tab Content */}
                {activeTab === 'system-design' && (
                    <div className="glass dark:bg-gray-800/50 dark:border-gray-700/50 rounded-3xl border border-white/20 shadow-md p-16 text-center">
                        <AcademicCapIcon className="h-20 w-20 text-orange-500 dark:text-orange-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">System Design</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Coming soon! Learn how to design scalable systems and ace system design interviews.</p>
                        <a
                            href="https://www.youtube.com/@techelevategh/videos"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all text-sm"
                        >
                            <PlayCircleIcon className="h-4 w-4" />
                            <span>Watch System Design Videos on YouTube</span>
                            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                        </a>
                    </div>
                )}
            </div>

            {/* Admin FAB */}
            {isAdmin && (
                <button
                    onClick={() => setShowAddLesson(true)}
                    className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-full shadow-lg hover:shadow-orange-500 hover:scale-110 transition-all flex items-center justify-center group z-50"
                    aria-label="Add new lesson"
                >
                    <PlusIcon className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
                </button>
            )}

            {/* Add Lesson Modal */}
            {showAddLesson && isAdmin && (
                <LessonCreate setAddLesson={setShowAddLesson} lessonCategories={{}} />
            )}

            {/* DSA Lesson Create/Edit Modal */}
            {showLessonModal && isAdmin && (
                <LessonCreateDSA
                    isOpen={showLessonModal}
                    onClose={() => {
                        setShowLessonModal(false);
                        setSelectedLesson(null);
                        setCurrentTopicForLesson(null);
                    }}
                    onSuccess={handleLessonSuccess}
                    editLesson={selectedLesson}
                    defaultCategory={currentTopicForLesson?.category}
                    defaultTopic={currentTopicForLesson?.topic}
                />
            )}
        </div>
    )
}

export default Learning;
