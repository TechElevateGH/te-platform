import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    FolderIcon,
    UserGroupIcon,
    UserCircleIcon,
    XMarkIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import axiosInstance from "../../axiosConfig"
import { BriefcaseIcon, DocumentIcon, CodeBracketIcon, ComputerDesktopIcon, BookOpenIcon } from '@heroicons/react/20/solid'
import Applications from '../../pages/Applications'
import Sidebar from '../_custom/Sidebar'
import Navbar from '../home/Navbar'
import FilesAndEssay from '../../pages/FilesAndEssay'
import Referrals from '../../pages/Referrals'
import Opportunities from '../../pages/Opportunities'
import Learning from '../../pages/Learning'
import Practice from '../../pages/Practice'
import ApplicationManagement from '../../pages/ApplicationManagement'
import ReferralsManagement from '../../pages/ReferralsManagement'
import FilesManagement from '../../pages/FilesManagement'
import UserAccountManagement from '../../pages/UserAccountManagement'
import LearningAnalytics from '../../pages/LearningAnalytics'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import Profile from './Profile'
import { useLocation } from 'react-router-dom'


const Workspace = ({ setLogin }) => {
    const { userId, accessToken, logout, userRole, isGuest } = useAuth();
    const { setUserInfo, setResumes, setOtherFiles, fetchFiles, setFetchFiles } = useData();
    const location = useLocation();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showGuestAlert, setShowGuestAlert] = useState(true)

    // Set default content based on role - Guests and Referrers have special defaults
    const userRoleInt = userRole ? parseInt(userRole) : 0;
    const defaultContent = isGuest ? "Learning" : (userRoleInt === 2 ? "Referrals" : "Applications");
    const [content, setContent] = useState(defaultContent)

    // UserRoles: Guest=0, Member=1, Referrer=2, Volunteer=3, Lead=4, Admin=5
    const isLeadOrAdmin = userRole && parseInt(userRole) >= 4;
    const isAdmin = userRole && parseInt(userRole) === 5;
    const isReferrer = userRole && parseInt(userRole) === 2;

    // Dynamic navigation based on role
    const navigation = useMemo(() => {
        // Guests only see Learning and Practice
        if (isGuest) {
            return [
                { name: 'Learning', type: "learn", icon: BookOpenIcon },
                { name: 'Practice', type: "learn", icon: CodeBracketIcon },
            ];
        }

        // Referrers only see Referrals and Profile
        if (isReferrer) {
            return [
                { name: 'Referrals', type: "app", icon: FolderIcon },
                { name: 'Profile', type: "app", icon: UserCircleIcon },
            ];
        }

        const baseNavigation = [
            { name: 'Applications', type: "app", icon: BriefcaseIcon },
            { name: 'Resume and Essays', type: "app", icon: DocumentIcon },
            { name: 'Referrals', type: "app", icon: FolderIcon },
            { name: 'Opportunities', type: "app", icon: ComputerDesktopIcon },
            { name: 'Learning', type: "learn", icon: BookOpenIcon },
            { name: 'Practice', type: "learn", icon: CodeBracketIcon },
            { name: 'Profile', type: "app", icon: UserCircleIcon },
        ];

        // Lead/Admin gets additional admin sections
        if (isLeadOrAdmin) {
            const adminSections = [
                { name: 'Learning Analytics', type: "analytics", icon: BookOpenIcon },
            ];

            // Admin also gets Account Management
            if (isAdmin) {
                adminSections.push({ name: 'Account Management', type: "accounts", icon: UserGroupIcon });
            }

            return [...baseNavigation, ...adminSections];
        }

        return baseNavigation;
    }, [isAdmin, isReferrer, isLeadOrAdmin, isGuest]);

    const getUserInfoRequest = useCallback(async () => {
        axiosInstance.get(`/users/${userId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
            .then((response) => {
                setUserInfo(response.data.user)
            })
            .catch((error) => {
                if (error.response?.status === 401) {
                    logout();
                }
                console.error('Error fetching user info:', error);
            })
    }, [accessToken, logout, setUserInfo, userId]);

    const getUserFilesRequest = useCallback(async () => {
        try {
            // Fetch resumes
            const resumesResponse = await axiosInstance.get(`/users/${userId}/resumes`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            // Fetch essays and cover letters
            const essayResponse = await axiosInstance.get(`/users/${userId}/essay`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const coverLetterResponse = await axiosInstance.get(`/users/${userId}/cover-letter`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            setResumes(resumesResponse.data?.resumes || []);

            const otherFilesList = [];
            if (essayResponse.data?.essay) {
                otherFilesList.push({
                    id: 'essay',
                    name: 'Referral Essay',
                    type: 'essay',
                    content: essayResponse.data.essay
                });
            }
            if (coverLetterResponse.data?.cover_letter) {
                otherFilesList.push({
                    id: 'cover-letter',
                    name: 'Cover Letter',
                    type: 'cover_letter',
                    content: coverLetterResponse.data.cover_letter
                });
            }

            setOtherFiles(otherFilesList);
        } catch (error) {
            if (error.response?.status === 401) {
                logout();
            }
            console.error('Error fetching user files:', error);
        }
    }, [accessToken, logout, setOtherFiles, setResumes, userId]);


    useEffect(() => {
        let prevContent = sessionStorage.getItem('content');
        if (prevContent) {
            setContent(prevContent);
        }
    }, [location.pathname]);

    // Handle URL-based navigation (e.g., /workspace/account-management)
    useEffect(() => {
        if (location.pathname === '/workspace/account-management') {
            setContent('Account Management');
            sessionStorage.setItem('content', 'Account Management');
        } else if (location.pathname === '/workspace/admin-analytics') {
            setContent('Learning Analytics');
            sessionStorage.setItem('content', 'Learning Analytics');
        }
    }, [location]);

    // Listen for custom workspace content change events (e.g., from Navbar)
    useEffect(() => {
        const handleContentChange = (event) => {
            if (event.detail) {
                setContent(event.detail);
                sessionStorage.setItem('content', event.detail);
            }
        };

        window.addEventListener('workspaceContentChange', handleContentChange);
        return () => window.removeEventListener('workspaceContentChange', handleContentChange);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            await getUserInfoRequest();
        }
        // Skip fetching user info for guest users
        if (accessToken && !isGuest) {
            fetchData();
        }
    }, [accessToken, getUserInfoRequest, isGuest])

    useEffect(() => {
        const fetchData = async () => {
            await getUserFilesRequest();
        }
        // Skip fetching user files for guest users
        if (accessToken && fetchFiles && !isGuest) {
            fetchData();
            setFetchFiles(false);
        }
    }, [accessToken, fetchFiles, getUserFilesRequest, setFetchFiles, isGuest])





    const setContentHandler = (value) => {
        setContent(value);
        sessionStorage.setItem('content', value);
    }

    return (
        <>
            <div className="bg-[#fafafa] dark:bg-gray-950 transition-colors">
                <Sidebar
                    navigation={navigation}
                    content={content}
                    setContent={setContentHandler}
                    setLogin={setLogin}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                />

                {/* Workspace Navbar */}
                <Navbar onMobileMenuOpen={() => setSidebarOpen(true)} isWorkspace={true} />

                <div className="md:pl-28">
                    {/* Guest Mode Alert */}
                    {isGuest && showGuestAlert && (
                        <div className="fixed top-20 left-0 right-0 z-40 px-4 md:pl-28">
                            <div className="max-w-4xl mx-auto mt-4 animate-fade-in">
                                <div className="relative bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-2xl shadow-lg backdrop-blur-sm overflow-hidden">
                                    {/* Decorative sparkle icon */}
                                    <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-20">
                                        <SparklesIcon className="h-24 w-24 text-blue-500" />
                                    </div>

                                    <div className="relative p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                                                    <SparklesIcon className="h-6 w-6 text-white" />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                                    Welcome, Guest! 👋
                                                </h3>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                                                    You're exploring in <span className="font-semibold text-blue-600 dark:text-blue-400">Guest Mode</span>.
                                                    Sign in to unlock the full power of TechElevate:
                                                </p>
                                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                                                    <li className="flex items-center gap-2">
                                                        <span className="text-blue-500">✓</span>
                                                        Track job applications and referrals
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="text-blue-500">✓</span>
                                                        Upload and manage resumes
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="text-blue-500">✓</span>
                                                        Access exclusive opportunities
                                                    </li>
                                                </ul>
                                                <button
                                                    onClick={() => {
                                                        logout();
                                                        navigate('/login');
                                                    }}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                                >
                                                    <span>Sign In Now</span>
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => setShowGuestAlert(false)}
                                                className="flex-shrink-0 p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
                                                aria-label="Close alert"
                                            >
                                                <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <main className="min-h-screen bg-[#fafafa] dark:bg-gray-950 pt-20 transition-colors">
                        {
                            content === "Account Management" ? <UserAccountManagement /> :
                                content === "Learning Analytics" ? <LearningAnalytics /> :
                                    content === "Profile" ? <Profile /> :
                                        content === "Applications" ? (
                                            isLeadOrAdmin ? <ApplicationManagement /> : <Applications />
                                        ) :
                                            content === "Resume and Essays" ? (
                                                isLeadOrAdmin ? <FilesManagement /> : <FilesAndEssay />
                                            ) :
                                                content === "Referrals" ? (
                                                    (isLeadOrAdmin || isReferrer) ? <ReferralsManagement /> : <Referrals />
                                                ) :
                                                    content === "Opportunities" ? <Opportunities /> :
                                                        content === "Practice" ? <Practice /> :
                                                            <Learning setContent={setContentHandler} />
                        }
                    </main>
                </div>
            </div>
        </>
    )
}


export default Workspace;