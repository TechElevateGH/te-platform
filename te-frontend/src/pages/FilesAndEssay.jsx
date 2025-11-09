import { useState } from "react";
import Essay from "../components/file/Essay";
import { PlusIcon, PaperClipIcon, BriefcaseIcon } from '@heroicons/react/20/solid'
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import { useData } from "../context/DataContext";
// import { useAuth } from "../context/AuthContext"; // Commented out - will add auth checks later
import FileCreate from "../components/file/FileCreate";
import MissingData from "../components/_custom/Alert/MissingData";

const Files = () => {
    // const { accessToken } = useAuth(); // Commented out - will add auth checks later

    const { resumes } = useData();

    const [addFile, setAddFile] = useState(false);

    // Mock resume data with role and notes
    const mockResumes = [
        {
            id: 1,
            name: 'Software_Engineer_Resume.pdf',
            role: 'Software Engineer',
            notes: 'Tailored for FAANG companies, emphasizes distributed systems experience',
            link: '#',
            uploadDate: '2024-01-15',
            size: '245 KB'
        },
        {
            id: 2,
            name: 'Data_Science_Resume.pdf',
            role: 'Data Scientist',
            notes: 'Highlights ML projects and Python expertise',
            link: '#',
            uploadDate: '2024-01-10',
            size: '198 KB'
        }
    ];

    const displayResumes = resumes.length > 0 ? resumes : mockResumes;

    // useEffect(() => {
    //     if (accessToken) {
    //         setTimeout(() => { }, 700);
    //     }
    // }, [accessToken]);


    return (
        <div className="">
            <header className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1.5">
                            Resumes & Essays
                        </h1>
                        <p className="text-xs text-gray-600">
                            Manage your resumes, cover letters, and referral essays
                        </p>
                    </div>
                </div>
            </header>

            <div className="flex mx-6">
                <div className="w-full lg:grid lg:grid-cols-12 lg:gap-x-8">
                    {/* Essay Section */}
                    <div className="pb-24 sm:pb-32 lg:col-span-5 lg:px-0 lg:pb-56 h-screen">
                        <div className="mt-6 text-sm sm:w-96 lg:w-72 xl:w-96 mx-auto text-gray-600">
                            <Essay />
                        </div>
                    </div>

                    {/* Resumes Section */}
                    <div className="w-full lg:col-span-7 xl:relative xl:inset-0 xl:mr-6 h-screen">
                        <header className="flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
                            <h2 className="text-lg font-semibold text-gray-900">My Resumes</h2>
                            <button
                                type="button"
                                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-medium rounded-xl hover:shadow-lg hover:from-blue-700 hover:to-cyan-700 active:scale-95 transition-all duration-200"
                                onClick={() => setAddFile(true)}
                            >
                                <PlusIcon className="h-4 w-4" aria-hidden="true" />
                                Upload Resume
                            </button>
                        </header>

                        <div className="px-4 py-6 sm:col-span-2 sm:px-0">
                            {displayResumes.length === 0 ? (
                                <MissingData info="No resumes uploaded." />
                            ) : (
                                <div className="space-y-3">
                                    {displayResumes.map((resume) => (
                                        <div
                                            key={resume.id}
                                            className="group bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-400 hover:shadow-lg transition-all duration-200"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                {/* Left Section: Icon + Details */}
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    {/* File Icon */}
                                                    <div className="p-2.5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg group-hover:from-blue-100 group-hover:to-cyan-100 transition-all">
                                                        <PaperClipIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
                                                    </div>

                                                    {/* Resume Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h3 className="text-xs font-semibold text-gray-900 truncate">
                                                                {resume.name}
                                                            </h3>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[11px]">
                                                            <div className="flex items-center gap-1.5">
                                                                <BriefcaseIcon className="h-3.5 w-3.5 text-blue-500" />
                                                                <span className="font-medium text-blue-600 truncate">
                                                                    {resume.role}
                                                                </span>
                                                            </div>
                                                            <span className="text-gray-400">•</span>
                                                            <span className="text-gray-500">{resume.size || '0 KB'}</span>
                                                            {resume.uploadDate && (
                                                                <>
                                                                    <span className="text-gray-400">•</span>
                                                                    <span className="text-gray-500">{new Date(resume.uploadDate).toLocaleDateString()}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {resume.notes && (
                                                            <p className="text-[11px] text-gray-600 mt-1.5 line-clamp-1">
                                                                {resume.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right Section: Actions */}
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <a
                                                        href={resume.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-2.5 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-medium rounded-md hover:bg-blue-100 transition-all"
                                                    >
                                                        View
                                                    </a>
                                                    <button
                                                        type="button"
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {addFile && <FileCreate setFileUpload={setAddFile} />}

        </div>
    )
}

export default Files;