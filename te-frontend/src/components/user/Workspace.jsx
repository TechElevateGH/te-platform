import { Fragment, useState, useEffect, useCallback } from 'react'
import {
    FolderIcon,
    XMarkIcon,

} from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'
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
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import Profile from './Profile'


const navigation = [
    { name: 'Applications', type: "app", icon: BriefcaseIcon },
    { name: 'Resume and Referral Essay', type: "app", icon: DocumentIcon },
    { name: 'Referrals', type: "app", icon: FolderIcon },
    { name: 'Opportunities', type: "app", icon: ComputerDesktopIcon },
    { name: 'Learning', type: "learn", icon: BookOpenIcon },
    { name: 'Practice', type: "learn", icon: CodeBracketIcon },
    { name: 'Other files', type: "other", icon: FolderIcon },
]


const Workspace = ({ setLogin }) => {
    const { userId, accessToken, logout } = useAuth();
    const { setUserInfo, setResumes, setOtherFiles, fetchFiles, setFetchFiles } = useData();

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [content, setContent] = useState("Applications")

    const getUserInfoRequest = useCallback(async () => {
        axiosInstance.get(`/users/${userId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
            .then((response) => {
                setUserInfo(response.data.user)
                console.log(response.data.user)
            })
            .catch((error) => {
                if (error.response.status === 401) {
                    logout();
                }
            })
    }, [accessToken, logout, setUserInfo, userId]);

    const getUserFilesRequest = useCallback(async () => {
        axiosInstance.get(`/users/${userId}/files`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
            .then((response) => {
                setResumes(response.data.files.resumes);
                setOtherFiles(response.data.files.other_files);
            })
            .catch((error) => {
                if (error.response.status === 401) {
                    logout();
                }
            })
    }, [accessToken, logout, setOtherFiles, setResumes, userId]);


    useEffect(() => {
        let prevContent = sessionStorage.getItem('content');
        if (prevContent) {
            setContent(prevContent);
        }
    }, [content]);

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
            <div>
                <Transition.Root show={sidebarOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-50 xl:hidden" onClose={setSidebarOpen}>
                        <Transition.Child
                            as={Fragment}
                            enter="transition-opacity ease-linear duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity ease-linear duration-300"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-gray-900/80" />
                        </Transition.Child>

                        <div className="fixed inset-0 flex">
                            <Transition.Child
                                as={Fragment}
                                enter="transition ease-in-out duration-300 transform"
                                enterFrom="-translate-x-full"
                                enterTo="translate-x-0"
                                leave="transition ease-in-out duration-300 transform"
                                leaveFrom="translate-x-0"
                                leaveTo="-translate-x-full"
                            >
                                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                                    <Transition.Child
                                        as={Fragment}
                                        enter="ease-in-out duration-300"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="ease-in-out duration-300"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                                            <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                                                <span className="sr-only">Close sidebar</span>
                                                <XMarkIcon className="h-6 w-6 text-black" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </Transition.Child>

                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition.Root>

                <Sidebar navigation={navigation} content={content} setContent={setContentHandler} setLogin={setLogin} />

                {/* Workspace Navbar */}
                <Navbar onMobileMenuOpen={() => setSidebarOpen(true)} isWorkspace={true} />

                <div className="md:pl-28">
                    <main className="min-h-screen bg-[#fafafa] pt-20">
                        {
                            content === "Profile" ? <Profile /> :
                                content === "Applications" ? <Applications /> :
                                    content === "Resume and Referral Essay" ? <FilesAndEssay /> :
                                        content === "Referrals" ? <Referrals /> :
                                            content === "Opportunities" ? <Opportunities /> :
                                                content === "Practice" ? <Practice /> :
                                                    <Learning />
                        }
                    </main>
                </div>
            </div>
        </>
    )
}


export default Workspace;