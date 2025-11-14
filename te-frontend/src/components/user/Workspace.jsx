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
    // Show compact guest banner only once per guest session
    const [showGuestAlert, setShowGuestAlert] = useState(false)

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

    // One-time guest banner display logic
    useEffect(() => {
        if (isGuest) {
            const shown = localStorage.getItem('guestWelcomeShown') === 'true';
            if (!shown) {
                setShowGuestAlert(true);
                localStorage.setItem('guestWelcomeShown', 'true');
            }
        } else {
            // Reset flag when not in guest mode so future guest sessions see it again
            localStorage.removeItem('guestWelcomeShown');
        }
    }, [isGuest]);

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
                    {/* Compact one-time Guest Banner */}
                    {isGuest && showGuestAlert && (
                        <div className="fixed top-16 left-0 right-0 z-40 px-4 md:pl-28">
                            <div className="max-w-3xl mx-auto mt-2 animate-fade-in">
                                <div className="flex items-center gap-3 rounded-xl border border-blue-200 dark:border-blue-700 bg-white/90 dark:bg-blue-900/40 backdrop-blur px-4 py-2 shadow">
                                    <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-sm">
                                        <SparklesIcon className="h-5 w-5" />
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-100 flex-1">
                                        Guest Mode: limited features. Sign in to track applications & resumes.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setShowGuestAlert(false);
                                            logout();
                                            navigate('/login');
                                        }}
                                        className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition"
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        onClick={() => setShowGuestAlert(false)}
                                        aria-label="Dismiss guest banner"
                                        className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/50"
                                    >
                                        <XMarkIcon className="h-4 w-4 text-gray-500 dark:text-gray-300" />
                                    </button>
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