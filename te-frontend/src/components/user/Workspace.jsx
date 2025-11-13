import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    FolderIcon,
    UserGroupIcon,
    UserCircleIcon,

} from '@heroicons/react/24/outline'
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
    const { userId, accessToken, logout, userRole } = useAuth();
    const { setUserInfo, setResumes, setOtherFiles, fetchFiles, setFetchFiles } = useData();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Set default content based on role - Referrers go to Referrals by default
    const userRoleInt = userRole ? parseInt(userRole) : 0;
    const defaultContent = userRoleInt === 2 ? "Referrals" : "Applications";
    const [content, setContent] = useState(defaultContent)

    // UserRoles: Guest=0, Member=1, Referrer=2, Volunteer=3, Lead=4, Admin=5
    const isLeadOrAdmin = userRole && parseInt(userRole) >= 4;
    const isAdmin = userRole && parseInt(userRole) === 5;
    const isReferrer = userRole && parseInt(userRole) === 2;

    // Dynamic navigation based on role
    const navigation = useMemo(() => {
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
    }, [isAdmin, isReferrer, isLeadOrAdmin]);

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
        if (accessToken) {
            fetchData();
        }
    }, [accessToken, getUserInfoRequest])

    useEffect(() => {
        const fetchData = async () => {
            await getUserFilesRequest();
        }
        if (accessToken && fetchFiles) {
            fetchData();
            setFetchFiles(false);
        }
    }, [accessToken, fetchFiles, getUserFilesRequest, setFetchFiles])





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