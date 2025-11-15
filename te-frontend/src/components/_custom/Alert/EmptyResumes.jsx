import { DocumentPlusIcon, SparklesIcon } from '@heroicons/react/24/outline'

const EmptyResumes = ({ onUploadClick }) => {
    return (
        <div className="flex items-center justify-center py-16 px-4">
            <div className="text-center max-w-md">
                {/* Animated Icon */}
                <div className="relative inline-flex items-center justify-center mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full blur-2xl opacity-20 animate-pulse" />
                    <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 rounded-full p-6">
                        <DocumentPlusIcon className="h-16 w-16 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -top-1 -right-1">
                        <SparklesIcon className="h-6 w-6 text-green-500 animate-bounce" />
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    No Resumes Yet
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Start building your career toolkit by uploading your first resume.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-8">
                    Keep multiple versions tailored for different roles and easily manage them all in one place.
                </p>

                {/* Upload Button */}
                <button
                    type="button"
                    onClick={onUploadClick}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-semibold rounded-xl hover:from-emerald-700 hover:to-green-700 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-[0.98] transition-all duration-200"
                >
                    <DocumentPlusIcon className="h-5 w-5" />
                    Upload Your First Resume
                </button>

                {/* Tips */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                        Quick Tips
                    </p>
                    <div className="grid gap-3 text-left">
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-semibold">PDF format only</span> - Keep it professional and easy to share
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-semibold">Target roles</span> - Tag each resume with the job you're targeting
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-semibold">Add notes</span> - Track which companies or roles each version is for
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmptyResumes;
