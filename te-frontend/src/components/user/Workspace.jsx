import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    FolderIcon,
    UserGroupIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import axiosInstance from "../../axiosConfig"
import { BriefcaseIcon, DocumentIcon, CodeBracketIcon, ComputerDesktopIcon, BookOpenIcon } from '@heroicons/react/20/solid'
import Applications from '../../pages/Applications'
import Sidebar from '../_custom/Sidebar'
import Navbar from '../home/Navbar'
import ResumesAndEssays from '../../pages/ResumesAndEssays'
import Referrals from '../../pages/Referrals'
import Opportunities from '../../pages/Opportunities'
import Learning from '../../pages/Learning'
import Practice from '../../pages/Practice'
import ApplicationManagement from '../../pages/ApplicationsManagement'
import ReferralsManagement from '../../pages/ReferralsManagement'
import ResumesAndEssaysManagement from '../../pages/ResumesAndEssaysManagement'
import UserAccountManagement from '../../pages/UserAccountManagement'
import LearningAnalytics from '../../pages/LearningAnalytics'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import Profile from './Profile'
import { getUserEndpoint } from '../../utils/userEndpoints'
import { useLocation } from 'react-router-dom'


const Workspace = ({ setLogin }) => {
    const { userId, accessToken, logout, userRole, isGuest } = useAuth();
    const { setUserInfo, setOtherFiles, fetchResumes, setFetchResumes, setResumes } = useData();
    const location = useLocation();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showGuestPrompt, setShowGuestPrompt] = useState(false)

    // Set default content based on role - Guests and Referrers have special defaults
    const userRoleInt = userRole ? parseInt(userRole) : 0;
    const defaultContent = isGuest ? "Learning" : (userRoleInt === 2 ? "Referrals" : (userRoleInt === 3 ? "Resume and Essays" : "Applications"));
    const [content, setContent] = useState(defaultContent)

    // UserRoles: Guest=0, Member=1, Referrer=2, Volunteer=3, Lead=4, Admin=5
    const isLeadOrAdmin = userRole && parseInt(userRole) >= 4;
    const isAdmin = userRole && parseInt(userRole) === 5;
    const isReferrer = userRole && parseInt(userRole) === 2;
    const isVolunteer = userRole && parseInt(userRole) === 3;

    // Dynamic navigation based on role
    const navigation = useMemo(() => {
        // Guests only see Learning and Practice
        if (isGuest) {
            return [
                { name: 'Learning', type: "learn", icon: BookOpenIcon },
                { name: 'Practice', type: "learn", icon: CodeBracketIcon },
            ];
        }

        // Referrers only see Referrals (Profile accessed via navbar)
        if (isReferrer) {
            return [
                { name: 'Referrals', type: "app", icon: FolderIcon },
            ];
        }

        // Volunteers see Resume Reviews, Learning, and Referrals (no Applications or Profile)
        if (isVolunteer) {
            return [
                { name: 'Resume and Essays', type: "app", icon: DocumentIcon },
                { name: 'Referrals', type: "app", icon: FolderIcon },
                { name: 'Learning', type: "learn", icon: BookOpenIcon },
                { name: 'Practice', type: "learn", icon: CodeBracketIcon },
            ];
        }

        const baseNavigation = [
            { name: 'Applications', type: "app", icon: BriefcaseIcon },
            { name: 'Resume and Essays', type: "app", icon: DocumentIcon },
            { name: 'Referrals', type: "app", icon: FolderIcon },
            { name: 'Opportunities', type: "app", icon: ComputerDesktopIcon },
            { name: 'Learning', type: "learn", icon: BookOpenIcon },
            { name: 'Practice', type: "learn", icon: CodeBracketIcon },
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
    }, [isAdmin, isReferrer, isLeadOrAdmin, isGuest, isVolunteer]);

    const getUserInfoRequest = useCallback(async () => {
        // Get effective role with fallback to sessionStorage
        const storedRole = sessionStorage.getItem('userRole');
        const effectiveRole = userRole || parseInt(storedRole);

        // Safety check: Don't fetch user info if we don't have a valid role
        if (!effectiveRole || !userId) {
            console.warn('[Workspace] Skipping getUserInfoRequest - missing role or userId', { effectiveRole, userId });
            return;
        }

        const endpoint = getUserEndpoint(effectiveRole, userId);

        axiosInstance.get(endpoint, {
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
    }, [accessToken, logout, setUserInfo, userId, userRole]);

    const getResumesOnly = useCallback(async () => {
        // Only members (role=1) have resumes
        if (parseInt(userRole) !== 1) {
            return;
        }

        try {
            const resumesResponse = await axiosInstance.get(`/resumes`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    user_id: userId
                }
            });

            // Backend returns { resumes: { resumes: [...] } }
            const resumesData = resumesResponse.data?.resumes?.resumes || [];

            // Update both userInfo and the resumes state in DataContext
            setUserInfo(prevUserInfo => ({
                ...prevUserInfo,
                resumes: resumesData
            }));

            setResumes(resumesData);
        } catch (error) {
            if (error.response?.status === 401) {
                logout();
            }
            console.error('Error fetching resumes:', error);
        }
    }, [accessToken, logout, setUserInfo, setResumes, userId, userRole]);

    const getUserFilesRequest = useCallback(async () => {
        // Only members (role=1) have essays and cover letters
        // Referrers, Volunteers, Leads, and Admins don't have these files
        if (parseInt(userRole) !== 1) {
            return;
        }

        try {
            // Fetch essays and cover letters (resumes come from userInfo.resumes)
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

            const essays = [];
            if (essayResponse.data?.referral_essay) {
                essays.push({
                    id: 'referral-essay',
                    name: 'Referral Essay',
                    type: 'referral_essay',
                    content: essayResponse.data.referral_essay
                });
            }
            if (coverLetterResponse.data?.cover_letter) {
                essays.push({
                    id: 'cover-letter',
                    name: 'Cover Letter',
                    type: 'cover_letter',
                    content: coverLetterResponse.data.cover_letter
                });
            }

            setOtherFiles(essays);
        } catch (error) {
            if (error.response?.status === 401) {
                logout();
            }
            console.error('Error fetching user files:', error);
        }
    }, [accessToken, logout, setOtherFiles, userId, userRole]);


    useEffect(() => {
        const prevContent = sessionStorage.getItem('content');
        if (prevContent && navigation.some((item) => item.name === prevContent)) {
            setContent(prevContent);
        } else {
            sessionStorage.setItem('content', defaultContent);
            setContent(defaultContent);
        }
    }, [location.pathname, navigation, defaultContent]);

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

    useEffect(() => {
        if (!location.search) return;

        const params = new URLSearchParams(location.search);
        const sectionParam = params.get('section');
        if (!sectionParam) return;

        const normalizedSection = sectionParam.trim().toLowerCase();
        const targetNavItem = navigation.find((item) => item.name.toLowerCase() === normalizedSection);

        if (targetNavItem) {
            setContentHandler(targetNavItem.name);
        }

        navigate(location.pathname, { replace: true });
    }, [location.search, location.pathname, navigation, navigate]);

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
            // Also fetch essays and cover letters on initial load
            await getUserFilesRequest();
        }
        // Skip fetching user info for guest users
        if (accessToken && !isGuest) {
            fetchData();
        }
    }, [accessToken, getUserInfoRequest, getUserFilesRequest, isGuest])

    // One-time guest banner display logic

    useEffect(() => {
        if (isGuest) {
            const acknowledged = sessionStorage.getItem('guestPromptAcknowledged') === 'true';
            setShowGuestPrompt(!acknowledged);
        } else {
            setShowGuestPrompt(false);
            sessionStorage.removeItem('guestPromptAcknowledged');
        }
    }, [isGuest]);

    const handleGuestContinue = () => {
        sessionStorage.setItem('guestPromptAcknowledged', 'true');
        setShowGuestPrompt(false);
    };

    const handleGuestSignIn = () => {
        sessionStorage.removeItem('guestPromptAcknowledged');
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const fetchData = async () => {
            // Only fetch resumes using the lightweight endpoint
            await getResumesOnly();
        }
        // Skip fetching resumes for guest users
        if (accessToken && fetchResumes && !isGuest) {
            fetchData();
            setFetchResumes(false);
        }
    }, [accessToken, fetchResumes, getResumesOnly, setFetchResumes, isGuest])





    const setContentHandler = (value) => {
        setContent(value);
        sessionStorage.setItem('content', value);
    }

    if (isGuest && showGuestPrompt) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 flex items-center justify-center px-4">
                <div className="max-w-xl w-full bg-white/90 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl p-8 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-lg">
                            <SparklesIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-sm uppercase tracking-wide text-blue-500 font-semibold">Guest Mode</p>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to TechElevate Workspace</h2>
                        </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        You&apos;re exploring the workspace in guest mode. You can preview Learning and Practice resources,
                        but core career features (Applications, Resumes, Referrals, Opportunities) require a full account.
                    </p>
                    <div className="space-y-4">
                        <button
                            onClick={handleGuestSignIn}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-3 shadow-lg hover:opacity-95 transition"
                        >
                            Sign in to unlock everything
                        </button>
                        <button
                            onClick={handleGuestContinue}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 font-semibold py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                            Continue as Guest
                        </button>
                    </div>
                </div>
            </div>
        );
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
                    <main className="min-h-screen bg-[#fafafa] dark:bg-gray-950 pt-20 transition-colors">
                        {
                            content === "Account Management" ? <UserAccountManagement /> :
                                content === "Learning Analytics" ? <LearningAnalytics /> :
                                    content === "Profile" ? <Profile /> :
                                        content === "Applications" ? (
                                            isLeadOrAdmin ? <ApplicationManagement /> : <Applications />
                                        ) :
                                            content === "Resume and Essays" ? (
                                                (isLeadOrAdmin || isVolunteer) ? <ResumesAndEssaysManagement /> : <ResumesAndEssays />
                                            ) :
                                                content === "Referrals" ? (
                                                    (isLeadOrAdmin || isReferrer || isVolunteer) ? <ReferralsManagement /> : <Referrals />
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