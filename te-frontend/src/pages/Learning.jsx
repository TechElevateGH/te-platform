import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from 'react'
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
    SparklesIcon,
    PlusIcon,
    ChevronDownIcon,
    VideoCameraIcon,
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon
} from 'icons'
import {
    CheckCircleIcon as CheckCircleSolidIcon,
    BookmarkIcon as BookmarkSolidIcon,
    FireIcon as FireSolidIcon,
    TrophyIcon as TrophySolidIcon
} from 'icons'

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
    const [viewMode, setViewMode] = useState('table'); // 'cards' | 'table'
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

    // Detailed progress tracking (streaks, time, activities)
    const [detailedProgress, setDetailedProgress] = useState({
        streak: { current_streak: 0, longest_streak: 0, last_activity_date: null },
        stats: { total_time_seconds: 0, session_count: 0, total_topics_completed: 0 },
        category_progress: {},
        recent_activities: []
    });

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
                // Fetch both basic progress and detailed progress in parallel
                const [progressRes, detailedRes] = await Promise.all([
                    axios.get('/learning/progress'),
                    axios.get('/learning/progress/detailed').catch(() => ({ data: null }))
                ]);

                const progress = progressRes.data;
                setCompletedTopics(new Set(progress.completed_topics || []));
                setBookmarkedTopics(new Set(progress.bookmarked_topics || []));
                setTopicNotes(progress.topic_notes || {});

                // Set detailed progress if available
                if (detailedRes.data) {
                    const detailedData = detailedRes.data;
                    const statsData = detailedData.stats || {};

                    // Convert categories array to an object keyed by category name
                    const categoryProgress = {};
                    (statsData.categories || []).forEach(cat => {
                        categoryProgress[cat.category] = {
                            completed_topics: cat.completed_topics || 0,
                            total_topics: cat.total_topics || 0,
                            in_progress_topics: cat.in_progress_topics || 0,
                            total_time_seconds: cat.total_time_seconds || 0
                        };
                    });

                    setDetailedProgress({
                        streak: detailedData.streak || statsData.streak || { current_streak: 0, longest_streak: 0 },
                        stats: {
                            total_time_seconds: statsData.total_learning_time_seconds || 0,
                            session_count: statsData.session_count || 0,
                            total_topics_completed: statsData.total_completed || 0
                        },
                        category_progress: categoryProgress,
                        recent_activities: detailedData.recent_activities || []
                    });
                }
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
            'Essentials': { level: 'Beginner', color: 'bg-[var(--te-surface-alt)] text-[var(--te-text)] bg-[var(--te-surface-alt)] ', icon: '○' },
            'Time & Space Complexity': { level: 'Beginner', color: 'bg-[var(--te-surface-alt)] text-[var(--te-text)] bg-[var(--te-surface-alt)] ', icon: '○' },
            'Arrays & Strings': { level: 'Easy', color: 'bg-[var(--te-surface-alt)] text-[var(--te-text)] bg-[var(--te-surface-alt)] text-[var(--te-text)]', icon: '○' },
            'Pointers': { level: 'Easy', color: 'bg-[var(--te-surface-alt)] text-[var(--te-text)] bg-[var(--te-surface-alt)] text-[var(--te-text)]', icon: '○' },
            'Linked Lists': { level: 'Easy', color: 'bg-[var(--te-surface-alt)] text-[var(--te-text)] bg-[var(--te-surface-alt)] text-[var(--te-text)]', icon: '○' },
            'Stacks & Queues': { level: 'Easy', color: 'bg-[var(--te-surface-alt)] text-[var(--te-text)] bg-[var(--te-surface-alt)] text-[var(--te-text)]', icon: '○' },
            'Hash Tables & Sets': { level: 'Easy', color: 'bg-[var(--te-surface-alt)] text-[var(--te-text)] bg-[var(--te-surface-alt)] text-[var(--te-text)]', icon: '○' },
            'Searching & Sorting': { level: 'Medium', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', icon: '◐' },
            'Recursion': { level: 'Medium', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', icon: '◐' },
            'Trees & Binary Search Trees': { level: 'Medium', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', icon: '◐' },
            'Tries': { level: 'Medium', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', icon: '◐' },
            'Heaps & Priority Queues': { level: 'Medium', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', icon: '◐' },
            'Backtracking': { level: 'Hard', color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', icon: '●' },
            'Graphs': { level: 'Hard', color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', icon: '●' },
            'Dynamic Programming': { level: 'Hard', color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', icon: '●' },
            'Greedy Algorithms': { level: 'Medium', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', icon: '◐' },
            'Bit Manipulation': { level: 'Medium', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', icon: '◐' },
            'Advanced Topics': { level: 'Hard', color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', icon: '●' }
        };
        return difficultyMap[categoryName] || { level: 'Medium', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', icon: '◐' };
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
                ? 'bg-[var(--te-surface-alt)]'
                : 'bg-[var(--te-surface-alt)]'
                }`}>
                <div className="max-w-md mx-auto p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--te-text)]  mb-3">
                        Access Restricted
                    </h2>
                    <p className="text-[var(--te-text-dim)] mb-6">
                        Learning content is only available for Members and Volunteers. As a Referrer, you have access to referral management features.
                    </p>
                    <button
                        onClick={() => window.location.href = '/referrals'}
                        className="te-btn-primary"
                    >
                        Go to Referrals
                    </button>
                </div>
            </div>
        );
    }

    // ---------------- modern view helpers ----------------
    const TRACKS = [
        { id: 'dsa', label: 'DSA' },
        { id: 'python', label: 'Python' },
        { id: 'system-design', label: 'System Design' },
    ];
    const formatHrs = (s) => `${(((s || 0)) / 3600).toFixed(1)}h`;
    const activeFilterLabel = showBookmarkedOnly ? 'Bookmarked' : showIncompleteOnly ? 'Incomplete' : 'All topics';

    const pyTotal = Object.values(pythonTopics).reduce((n, c) => n + c.topics.length, 0);
    const pyDone = pythonCompletedTopics.size;
    const pyPct = pyTotal ? Math.round((pyDone / pyTotal) * 100) : 0;

    const togglePyComplete = (key) => {
        const n = new Set(pythonCompletedTopics);
        n.has(key) ? n.delete(key) : n.add(key);
        setPythonCompletedTopics(n);
    };
    const togglePyBookmark = (key) => {
        const n = new Set(pythonBookmarkedTopics);
        n.has(key) ? n.delete(key) : n.add(key);
        setPythonBookmarkedTopics(n);
    };
    const togglePyExpand = (key) => {
        const n = new Set(pythonExpandedTopics);
        n.has(key) ? n.delete(key) : n.add(key);
        setPythonExpandedTopics(n);
    };

    const CheckToggle = ({ done, onClick }) => (
        <button
            onClick={onClick}
            className="mt-0.5 flex-shrink-0 text-[var(--te-text-dim)] hover:text-[var(--te-text)] transition-colors"
            aria-label={done ? 'Mark incomplete' : 'Mark complete'}
        >
            {done
                ? <CheckCircleSolidIcon className="h-5 w-5 text-[var(--te-text)]" />
                : <CheckCircleIcon className="h-5 w-5" strokeWidth={1.6} />}
        </button>
    );

    const renderDsaTopic = (category, topic) => {
        const completed = isTopicCompleted(category.category, topic.name);
        const bookmarked = isTopicBookmarked(category.category, topic.name);
        const expanded = isTopicExpanded(category.category, topic.name);
        const lessons = getLessonsForTopic(category.category, topic.name);
        const note = getTopicNote(category.category, topic.name);

        return (
            <div
                key={topic.name}
                className={`group te-card p-4 transition-colors ${completed ? 'bg-[var(--te-surface-alt)]' : 'hover:bg-[var(--te-hover)]'}`}
            >
                <div className="flex items-start gap-3">
                    <CheckToggle done={completed} onClick={() => toggleTopicCompletion(category.category, topic.name)} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <p className={`flex-1 text-sm font-semibold leading-snug ${completed ? 'text-[var(--te-text-dim)] line-through' : 'text-[var(--te-text)]'}`}>
                                {topic.name}
                            </p>
                            <div className="-mr-1.5 -mt-1 flex flex-shrink-0 items-center">
                                <button
                                    onClick={() => toggleBookmark(category.category, topic.name)}
                                    className="te-icon-btn h-7 w-7"
                                    aria-label="Bookmark"
                                >
                                    {bookmarked
                                        ? <BookmarkSolidIcon className="h-4 w-4 text-[var(--te-text)]" />
                                        : <BookmarkIcon className="h-4 w-4" strokeWidth={1.7} />}
                                </button>
                                <button
                                    onClick={() => toggleTopicExpanded(category.category, topic.name)}
                                    className="te-icon-btn h-7 w-7"
                                    aria-label="Expand"
                                >
                                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {(topic.resources?.length > 0 || topic.youtubeId) && (
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                                {topic.youtubeId && (
                                    <a
                                        href={`https://www.youtube.com/watch?v=${topic.youtubeId}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="te-chip hover:bg-[var(--te-hover)]"
                                    >
                                        <VideoCameraIcon className="h-3.5 w-3.5" /> Watch
                                    </a>
                                )}
                                {(topic.resources || []).slice(0, expanded ? 99 : 3).map((r, i) => (
                                    <a
                                        key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                                        className="te-chip hover:bg-[var(--te-hover)]"
                                    >
                                        {r.name} <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                                    </a>
                                ))}
                                {!expanded && topic.resources?.length > 3 && (
                                    <span className="te-chip">+{topic.resources.length - 3}</span>
                                )}
                            </div>
                        )}

                        {expanded && (
                            <div className="mt-3 space-y-3 border-t border-[var(--te-border)] pt-3">
                        <div>
                            <p className="te-eyebrow mb-1.5">{'// notes'}</p>
                            <textarea
                                value={note}
                                onChange={(e) => updateTopicNote(category.category, topic.name, e.target.value)}
                                placeholder="Add notes, key points, or reminders…"
                                rows={3}
                                className="te-textarea text-sm"
                            />
                        </div>

                        {lessons.length > 0 && (
                            <div className="space-y-2">
                                <p className="te-eyebrow">{'// lessons'}</p>
                                {lessons.map((lesson) => (
                                    <div key={lesson.id} className="rounded-md border border-[var(--te-border)] bg-[var(--te-surface)] p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-semibold text-[var(--te-text)]">{lesson.title}</span>
                                            {lesson.difficulty && <span className="te-chip">{lesson.difficulty}</span>}
                                        </div>
                                        {lesson.description && (
                                            <p className="mt-1 text-xs text-[var(--te-text-dim)]">{lesson.description}</p>
                                        )}
                                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-[var(--te-text-dim)]">
                                            {lesson.duration_minutes && <span className="inline-flex items-center gap-1"><ClockIcon className="h-3.5 w-3.5" />{lesson.duration_minutes} min</span>}
                                            {lesson.instructor && <span>by {lesson.instructor}</span>}
                                            {lesson.video_id && (
                                                <a href={`https://www.youtube.com/watch?v=${lesson.video_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-[var(--te-text)]">
                                                    <PlayCircleIcon className="h-3.5 w-3.5" /> video
                                                </a>
                                            )}
                                        </div>
                                        {lesson.resources?.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {lesson.resources.map((r, i) => (
                                                    <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="te-chip hover:bg-[var(--te-hover)]">{r.title}</a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {isAdmin && (
                            <button onClick={() => openCreateLessonModal(category.category, topic.name)} className="te-btn-secondary te-btn-sm">
                                <PlusIcon className="h-4 w-4" /> Add lesson
                            </button>
                        )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderPyTopic = (categoryName, topic) => {
        const key = `${categoryName}::${topic.name}`;
        const completed = pythonCompletedTopics.has(key);
        const bookmarked = pythonBookmarkedTopics.has(key);
        const expanded = pythonExpandedTopics.has(key);

        return (
            <div
                key={topic.name}
                className={`te-card p-4 transition-colors ${completed ? 'bg-[var(--te-surface-alt)]' : 'hover:bg-[var(--te-hover)]'}`}
            >
                <div className="flex items-start gap-3">
                    <CheckToggle done={completed} onClick={() => togglePyComplete(key)} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <p className={`flex-1 text-sm font-semibold leading-snug ${completed ? 'text-[var(--te-text-dim)] line-through' : 'text-[var(--te-text)]'}`}>
                                {topic.name}
                            </p>
                            <div className="-mr-1.5 -mt-1 flex flex-shrink-0 items-center">
                                <button onClick={() => togglePyBookmark(key)} className="te-icon-btn h-7 w-7" aria-label="Bookmark">
                                    {bookmarked ? <BookmarkSolidIcon className="h-4 w-4 text-[var(--te-text)]" /> : <BookmarkIcon className="h-4 w-4" strokeWidth={1.7} />}
                                </button>
                                <button onClick={() => togglePyExpand(key)} className="te-icon-btn h-7 w-7" aria-label="Expand">
                                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        </div>
                        {topic.description && (
                            <p className="mt-1 text-xs leading-relaxed text-[var(--te-text-dim)]">{topic.description}</p>
                        )}
                        {!expanded && topic.resources?.length > 0 && (
                            <p className="mt-2 font-mono text-[11px] text-[var(--te-text-dim)]">
                                {topic.resources.length} resource{topic.resources.length > 1 ? 's' : ''}
                            </p>
                        )}

                        {expanded && (
                            <div className="mt-3 space-y-3 border-t border-[var(--te-border)] pt-3">
                                {topic.keyPoints?.length > 0 && (
                                    <div>
                                        <p className="te-eyebrow mb-1.5">{'// key points'}</p>
                                        <ul className="space-y-1">
                                            {topic.keyPoints.map((point, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-[var(--te-text-dim)]">
                                                    <span className="select-none text-[var(--te-text-dim)]">–</span>{point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {topic.resources?.length > 0 && (
                                    <div>
                                        <p className="te-eyebrow mb-1.5">{'// resources'}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {topic.resources.map((r, i) => (
                                                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="te-chip hover:bg-[var(--te-hover)]">
                                                    {r.type === 'video' ? <VideoCameraIcon className="h-3.5 w-3.5" /> : <BookOpenIcon className="h-3.5 w-3.5" />}
                                                    {r.title}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <p className="te-eyebrow mb-1.5">{'// notes'}</p>
                                    <textarea
                                        value={pythonTopicNotes[key] || ''}
                                        onChange={(e) => setPythonTopicNotes((prev) => ({ ...prev, [key]: e.target.value }))}
                                        placeholder="Add notes, code snippets, or takeaways…"
                                        rows={3}
                                        className="te-textarea text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderDsaTopicRow = (category, topic) => {
        const completed = isTopicCompleted(category.category, topic.name);
        const bookmarked = isTopicBookmarked(category.category, topic.name);
        const expanded = isTopicExpanded(category.category, topic.name);
        const lessons = getLessonsForTopic(category.category, topic.name);
        const note = getTopicNote(category.category, topic.name);
        return (
            <Fragment key={topic.name}>
                <tr className={`transition-colors hover:bg-[var(--te-hover)] ${completed ? 'bg-[var(--te-surface-alt)]' : ''}`}>
                    <td className="w-10 py-2.5 pl-4 align-top">
                        <CheckToggle done={completed} onClick={() => toggleTopicCompletion(category.category, topic.name)} />
                    </td>
                    <td className="py-2.5 pr-3 align-top">
                        <button onClick={() => toggleTopicExpanded(category.category, topic.name)} className="text-left">
                            <span className={`text-sm font-medium ${completed ? 'text-[var(--te-text-dim)] line-through' : 'text-[var(--te-text)]'}`}>{topic.name}</span>
                        </button>
                    </td>
                    <td className="hidden py-2.5 pr-3 align-top lg:table-cell">
                        <div className="flex flex-wrap gap-1.5">
                            {topic.youtubeId && (
                                <a href={`https://www.youtube.com/watch?v=${topic.youtubeId}`} target="_blank" rel="noopener noreferrer" className="te-chip hover:bg-[var(--te-hover)]"><VideoCameraIcon className="h-3.5 w-3.5" /> Watch</a>
                            )}
                            {(topic.resources || []).slice(0, 3).map((r, i) => (
                                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="te-chip hover:bg-[var(--te-hover)]">{r.name} <ArrowTopRightOnSquareIcon className="h-3 w-3" /></a>
                            ))}
                            {topic.resources?.length > 3 && <span className="te-chip">+{topic.resources.length - 3}</span>}
                            {!(topic.resources?.length) && !topic.youtubeId && <span className="font-mono text-[11px] text-[var(--te-text-dim)]">—</span>}
                        </div>
                    </td>
                    <td className="w-20 py-2.5 pr-3 align-top">
                        <div className="flex items-center justify-end gap-0.5">
                            <button onClick={() => toggleBookmark(category.category, topic.name)} className="te-icon-btn h-7 w-7" aria-label="Bookmark">
                                {bookmarked ? <BookmarkSolidIcon className="h-4 w-4 text-[var(--te-text)]" /> : <BookmarkIcon className="h-4 w-4" strokeWidth={1.7} />}
                            </button>
                            <button onClick={() => toggleTopicExpanded(category.category, topic.name)} className="te-icon-btn h-7 w-7" aria-label="Expand">
                                <ChevronDownIcon className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </td>
                </tr>
                {expanded && (
                    <tr className={completed ? 'bg-[var(--te-surface-alt)]' : ''}>
                        <td className="hidden sm:table-cell"></td>
                        <td colSpan={3} className="px-4 pb-4 pt-0 sm:pl-0 sm:pr-4">
                            <div className="space-y-3">
                                {(topic.resources?.length > 0 || topic.youtubeId) && (
                                    <div className="flex flex-wrap gap-1.5 lg:hidden">
                                        {topic.youtubeId && <a href={`https://www.youtube.com/watch?v=${topic.youtubeId}`} target="_blank" rel="noopener noreferrer" className="te-chip hover:bg-[var(--te-hover)]"><VideoCameraIcon className="h-3.5 w-3.5" /> Watch</a>}
                                        {(topic.resources || []).map((r, i) => (<a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="te-chip hover:bg-[var(--te-hover)]">{r.name} <ArrowTopRightOnSquareIcon className="h-3 w-3" /></a>))}
                                    </div>
                                )}
                                <textarea value={note} onChange={(e) => updateTopicNote(category.category, topic.name, e.target.value)} placeholder="Add notes…" rows={2} className="te-textarea text-sm" />
                                {lessons.length > 0 && (
                                    <div className="space-y-2">
                                        {lessons.map((lesson) => (
                                            <div key={lesson.id} className="rounded-md border border-[var(--te-border)] bg-[var(--te-surface)] p-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-sm font-semibold text-[var(--te-text)]">{lesson.title}</span>
                                                    {lesson.difficulty && <span className="te-chip">{lesson.difficulty}</span>}
                                                </div>
                                                {lesson.description && <p className="mt-1 text-xs text-[var(--te-text-dim)]">{lesson.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {isAdmin && (
                                    <button onClick={() => openCreateLessonModal(category.category, topic.name)} className="te-btn-secondary te-btn-sm"><PlusIcon className="h-4 w-4" /> Add lesson</button>
                                )}
                            </div>
                        </td>
                    </tr>
                )}
            </Fragment>
        );
    };

    const renderPyTopicRow = (categoryName, topic) => {
        const key = `${categoryName}::${topic.name}`;
        const completed = pythonCompletedTopics.has(key);
        const bookmarked = pythonBookmarkedTopics.has(key);
        const expanded = pythonExpandedTopics.has(key);
        return (
            <Fragment key={topic.name}>
                <tr className={`transition-colors hover:bg-[var(--te-hover)] ${completed ? 'bg-[var(--te-surface-alt)]' : ''}`}>
                    <td className="w-10 py-2.5 pl-4 align-top">
                        <CheckToggle done={completed} onClick={() => togglePyComplete(key)} />
                    </td>
                    <td className="py-2.5 pr-3 align-top">
                        <button onClick={() => togglePyExpand(key)} className="text-left">
                            <span className={`text-sm font-medium ${completed ? 'text-[var(--te-text-dim)] line-through' : 'text-[var(--te-text)]'}`}>{topic.name}</span>
                        </button>
                    </td>
                    <td className="hidden py-2.5 pr-3 align-top lg:table-cell">
                        <span className="font-mono text-[11px] text-[var(--te-text-dim)]">{topic.resources?.length || 0} resource{(topic.resources?.length || 0) !== 1 ? 's' : ''}</span>
                    </td>
                    <td className="w-20 py-2.5 pr-3 align-top">
                        <div className="flex items-center justify-end gap-0.5">
                            <button onClick={() => togglePyBookmark(key)} className="te-icon-btn h-7 w-7" aria-label="Bookmark">{bookmarked ? <BookmarkSolidIcon className="h-4 w-4 text-[var(--te-text)]" /> : <BookmarkIcon className="h-4 w-4" strokeWidth={1.7} />}</button>
                            <button onClick={() => togglePyExpand(key)} className="te-icon-btn h-7 w-7" aria-label="Expand"><ChevronDownIcon className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} /></button>
                        </div>
                    </td>
                </tr>
                {expanded && (
                    <tr className={completed ? 'bg-[var(--te-surface-alt)]' : ''}>
                        <td className="hidden sm:table-cell"></td>
                        <td colSpan={3} className="px-4 pb-4 pt-0 sm:pl-0 sm:pr-4">
                            <div className="space-y-3">
                                {topic.description && <p className="text-xs leading-relaxed text-[var(--te-text-dim)]">{topic.description}</p>}
                                {topic.keyPoints?.length > 0 && (
                                    <ul className="space-y-1">
                                        {topic.keyPoints.map((p, i) => (<li key={i} className="flex gap-2 text-sm text-[var(--te-text-dim)]"><span className="select-none">–</span>{p}</li>))}
                                    </ul>
                                )}
                                {topic.resources?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {topic.resources.map((r, i) => (<a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="te-chip hover:bg-[var(--te-hover)]">{r.type === 'video' ? <VideoCameraIcon className="h-3.5 w-3.5" /> : <BookOpenIcon className="h-3.5 w-3.5" />}{r.title}</a>))}
                                    </div>
                                )}
                                <textarea value={pythonTopicNotes[key] || ''} onChange={(e) => setPythonTopicNotes((prev) => ({ ...prev, [key]: e.target.value }))} placeholder="Add notes…" rows={2} className="te-textarea text-sm" />
                            </div>
                        </td>
                    </tr>
                )}
            </Fragment>
        );
    };

    return (
        <div className="min-h-screen bg-[var(--te-bg)]">
            {/* ===================== Header ===================== */}
            <div className="sticky top-16 z-30 border-b border-[var(--te-border)] bg-[var(--te-bg)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <span className="te-eyebrow">{'// learning'}</span>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--te-text)]">Curriculum</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {isLeadOrAdmin && setContent && (
                                <button onClick={() => setContent('Learning Analytics')} className="te-btn-secondary te-btn-sm">
                                    <ChartBarIcon className="h-4 w-4" /> Analytics
                                </button>
                            )}
                            {isAdmin && (
                                <button onClick={() => setShowAddLesson(true)} className="te-btn-secondary te-btn-sm">
                                    <PlusIcon className="h-4 w-4" /> Lesson
                                </button>
                            )}
                            {isMember && (
                                <button onClick={() => setShowStats((v) => !v)} className="te-btn-secondary te-btn-sm">
                                    <ChartBarIcon className="h-4 w-4" /> {showStats ? 'Hide stats' : 'Stats'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Track switcher + search + filter */}
                    <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="inline-flex rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-1 font-mono text-sm">
                            {TRACKS.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id)}
                                    className={`rounded-md px-3 py-1.5 transition-colors ${activeTab === t.id ? 'bg-[var(--te-surface)] text-[var(--te-text)] shadow-sm' : 'text-[var(--te-text-dim)] hover:text-[var(--te-text)]'}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {activeTab !== 'system-design' && (
                            <div className="flex flex-1 items-center gap-2">
                                <div className="relative w-full max-w-md">
                                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--te-text-dim)]" />
                                    <input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search topics…"
                                        className="te-input pl-9"
                                    />
                                </div>
                                {activeTab === 'dsa' && (
                                    <details className="relative">
                                        <summary className="te-btn-secondary te-btn-sm list-none cursor-pointer select-none [&::-webkit-details-marker]:hidden">
                                            <AdjustmentsHorizontalIcon className="h-4 w-4" />
                                            <span className="hidden sm:inline">{activeFilterLabel}</span>
                                            <ChevronDownIcon className="h-4 w-4" />
                                        </summary>
                                        <div className="absolute right-0 z-40 mt-2 w-48 te-card p-1 shadow-sm">
                                            {[
                                                { l: 'All topics', on: () => { setShowBookmarkedOnly(false); setShowIncompleteOnly(false); } },
                                                { l: 'Bookmarked', on: () => { setShowBookmarkedOnly(true); setShowIncompleteOnly(false); } },
                                                { l: 'Incomplete', on: () => { setShowIncompleteOnly(true); setShowBookmarkedOnly(false); } },
                                            ].map((o) => (
                                                <button
                                                    key={o.l}
                                                    onClick={(e) => { o.on(); const d = e.currentTarget.closest('details'); if (d) d.open = false; }}
                                                    className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--te-hover)] ${o.l === activeFilterLabel ? 'text-[var(--te-text)] font-medium' : 'text-[var(--te-text-dim)] hover:text-[var(--te-text)]'}`}
                                                >
                                                    {o.l}
                                                </button>
                                            ))}
                                        </div>
                                    </details>
                                )}
                                <div className="ml-auto inline-flex rounded-md border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-0.5 font-mono text-xs">
                                    <button onClick={() => setViewMode('cards')} className={`rounded px-2.5 py-1 transition-colors ${viewMode === 'cards' ? 'bg-[var(--te-surface)] text-[var(--te-text)] shadow-sm' : 'text-[var(--te-text-dim)] hover:text-[var(--te-text)]'}`}>Cards</button>
                                    <button onClick={() => setViewMode('table')} className={`rounded px-2.5 py-1 transition-colors ${viewMode === 'table' ? 'bg-[var(--te-surface)] text-[var(--te-text)] shadow-sm' : 'text-[var(--te-text-dim)] hover:text-[var(--te-text)]'}`}>Table</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                {/* ===================== Stats strip ===================== */}
                {isMember && showStats && (
                    <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--te-border)] bg-[var(--te-border)] sm:grid-cols-4">
                        {[
                            { label: 'Current streak', value: `${detailedProgress.streak?.current_streak || 0}d`, icon: FireSolidIcon },
                            { label: 'Longest streak', value: `${detailedProgress.streak?.longest_streak || 0}d`, icon: TrophySolidIcon },
                            { label: 'Time learning', value: formatHrs(detailedProgress.stats?.total_time_seconds), icon: ClockIcon },
                            { label: 'Topics done', value: stats.completed, icon: CheckCircleSolidIcon },
                        ].map((s) => (
                            <div key={s.label} className="bg-[var(--te-surface)] p-4">
                                <s.icon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                <div className="mt-2 font-mono text-2xl font-bold text-[var(--te-text)]">{s.value}</div>
                                <div className="mt-0.5 text-xs text-[var(--te-text-dim)]">{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {isLoading ? (
                    <div className="py-24 text-center font-mono text-sm text-[var(--te-text-dim)]">loading curriculum…</div>
                ) : (
                    <>
                        {/* ===================== DSA ===================== */}
                        {activeTab === 'dsa' && (
                            <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
                                {/* Category rail */}
                                <aside className="hidden lg:block">
                                    <div className="sticky top-40 te-scroll max-h-[calc(100vh-12rem)] overflow-auto pr-1">
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between font-mono text-xs text-[var(--te-text-dim)]">
                                                <span>progress</span>
                                                <span>{stats.percentage}%</span>
                                            </div>
                                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--te-surface-alt)]">
                                                <div className="h-full rounded-full bg-[var(--te-text)]" style={{ width: `${stats.percentage}%` }} />
                                            </div>
                                            <div className="mt-1 font-mono text-[11px] text-[var(--te-text-dim)]">{stats.completed}/{stats.totalTopics} topics</div>
                                        </div>
                                        <nav className="space-y-0.5">
                                            {displayCategories.map((cat) => {
                                                const active = activeCategory === cat.category;
                                                return (
                                                    <button
                                                        key={cat.category}
                                                        onClick={() => scrollToCategory(cat.category)}
                                                        className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${active ? 'bg-[var(--te-hover)] font-medium text-[var(--te-text)]' : 'text-[var(--te-text-dim)] hover:bg-[var(--te-hover)] hover:text-[var(--te-text)]'}`}
                                                    >
                                                        <span className="truncate">{cat.category}</span>
                                                        <span className="ml-2 font-mono text-[11px] text-[var(--te-text-dim)]">{cat.completed}/{cat.total}</span>
                                                    </button>
                                                );
                                            })}
                                        </nav>
                                    </div>
                                </aside>

                                {/* Topic sections */}
                                <div className="space-y-10">
                                    {!isMember && (
                                        <div className="te-panel flex items-center gap-3 p-4">
                                            <SparklesIcon className="h-5 w-5 flex-shrink-0 text-[var(--te-text-dim)]" />
                                            <p className="text-sm text-[var(--te-text-dim)]">
                                                Browsing as a guest — <a href="/login" className="te-link">sign in</a> to save your progress, bookmarks, and notes.
                                            </p>
                                        </div>
                                    )}
                                    {displayCategories.length === 0 ? (
                                        <div className="py-20 text-center font-mono text-sm text-[var(--te-text-dim)]">no topics match your filters.</div>
                                    ) : (
                                        displayCategories.map((category) => {
                                            const diff = getDifficultyInfo(category.category);
                                            return (
                                                <section
                                                    key={category.category}
                                                    ref={(el) => (categoryRefs.current[category.category] = el)}
                                                    className="scroll-mt-40"
                                                >
                                                    <div className="mb-4 flex items-center justify-between border-b border-[var(--te-border)] pb-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <h2 className="text-lg font-bold text-[var(--te-text)]">{category.category}</h2>
                                                            <span className={`te-chip-${diff.level === 'Hard' ? 'red' : diff.level === 'Medium' ? 'gold' : 'green'}`}>{diff.icon} {diff.level}</span>
                                                        </div>
                                                        <span className="font-mono text-xs text-[var(--te-text-dim)]">{category.completed}/{category.total}</span>
                                                    </div>
                                                    {viewMode === 'table' ? (
                                                        <div className="te-card overflow-hidden">
                                                            <table className="w-full">
                                                                <thead>
                                                                    <tr className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] text-left">
                                                                        <th className="w-10 py-2 pl-4"></th>
                                                                        <th className="py-2 pr-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--te-text-dim)]">Topic</th>
                                                                        <th className="hidden py-2 pr-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--te-text-dim)] lg:table-cell">Resources</th>
                                                                        <th className="w-20 py-2 pr-3"></th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-[var(--te-border)]">
                                                                    {category.topics.map((topic) => renderDsaTopicRow(category, topic))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                            {category.topics.map((topic) => renderDsaTopic(category, topic))}
                                                        </div>
                                                    )}
                                                </section>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ===================== Python ===================== */}
                        {activeTab === 'python' && (
                            <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
                                <aside className="hidden lg:block">
                                    <div className="sticky top-40 te-scroll max-h-[calc(100vh-12rem)] overflow-auto pr-1">
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between font-mono text-xs text-[var(--te-text-dim)]">
                                                <span>progress</span>
                                                <span>{pyPct}%</span>
                                            </div>
                                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--te-surface-alt)]">
                                                <div className="h-full rounded-full bg-[var(--te-text)]" style={{ width: `${pyPct}%` }} />
                                            </div>
                                            <div className="mt-1 font-mono text-[11px] text-[var(--te-text-dim)]">{pyDone}/{pyTotal} topics</div>
                                        </div>
                                        <nav className="space-y-0.5">
                                            {Object.entries(pythonTopics).map(([categoryName, data], idx) => (
                                                <button
                                                    key={categoryName}
                                                    onClick={() => document.getElementById(`py-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                                    className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm text-[var(--te-text-dim)] transition-colors hover:bg-[var(--te-hover)] hover:text-[var(--te-text)]"
                                                >
                                                    <span className="truncate">{categoryName}</span>
                                                    <span className="ml-2 font-mono text-[11px] text-[var(--te-text-dim)]">{data.topics.length}</span>
                                                </button>
                                            ))}
                                        </nav>
                                    </div>
                                </aside>

                                <div className="space-y-10">
                                    {Object.entries(pythonTopics).map(([categoryName, data], idx) => {
                                        const topics = searchQuery.trim()
                                            ? data.topics.filter((t) => t.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
                                            : data.topics;
                                        if (topics.length === 0) return null;
                                        return (
                                            <section key={categoryName} id={`py-${idx}`} className="scroll-mt-40">
                                                <div className="mb-4 flex items-center justify-between border-b border-[var(--te-border)] pb-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <h2 className="text-lg font-bold text-[var(--te-text)]">{categoryName}</h2>
                                                        {data.difficulty?.level && <span className={`te-chip-${/adv|hard/i.test(data.difficulty.level) ? 'red' : /inter|medium/i.test(data.difficulty.level) ? 'gold' : 'green'}`}>{data.difficulty.level}</span>}
                                                    </div>
                                                    <span className="font-mono text-xs text-[var(--te-text-dim)]">{topics.length}</span>
                                                </div>
                                                {viewMode === 'table' ? (
                                                    <div className="te-card overflow-hidden">
                                                        <table className="w-full">
                                                            <thead>
                                                                <tr className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] text-left">
                                                                    <th className="w-10 py-2 pl-4"></th>
                                                                    <th className="py-2 pr-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--te-text-dim)]">Topic</th>
                                                                    <th className="hidden py-2 pr-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--te-text-dim)] lg:table-cell">Resources</th>
                                                                    <th className="w-20 py-2 pr-3"></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-[var(--te-border)]">
                                                                {topics.map((topic) => renderPyTopicRow(categoryName, topic))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                        {topics.map((topic) => renderPyTopic(categoryName, topic))}
                                                    </div>
                                                )}
                                            </section>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ===================== System Design ===================== */}
                        {activeTab === 'system-design' && (
                            <div className="te-panel mx-auto max-w-2xl p-12 text-center">
                                <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                    <AcademicCapIcon className="h-7 w-7 text-[var(--te-text)]" strokeWidth={1.6} />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--te-text)]">System Design</h3>
                                <p className="mx-auto mt-2 max-w-md text-sm text-[var(--te-text-dim)]">
                                    Coming soon — learn to design scalable systems and ace system design interviews. In the meantime, watch our videos.
                                </p>
                                <a
                                    href="https://www.youtube.com/@techelevategh/videos"
                                    target="_blank" rel="noopener noreferrer"
                                    className="te-btn-primary te-btn-sm mt-6"
                                >
                                    <PlayCircleIcon className="h-4 w-4" /> Watch on YouTube
                                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ===================== Modals ===================== */}
            {showAddLesson && isAdmin && (
                <LessonCreate setAddLesson={setShowAddLesson} lessonCategories={{}} />
            )}

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
    );
}

export default Learning;
