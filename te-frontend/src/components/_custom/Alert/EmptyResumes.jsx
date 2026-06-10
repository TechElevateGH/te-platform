import { DocumentPlusIcon, SparklesIcon } from 'icons'

const EmptyResumes = ({ onUploadClick }) => {
    return (
        <div className="flex items-center justify-center py-16 px-4">
            <div className="text-center max-w-md">
                {/* Animated Icon */}
                <div className="relative inline-flex items-center justify-center mb-6">
                    <div className="absolute inset-0 bg-[var(--te-hover)] rounded-lg opacity-60 animate-pulse" />
                    <div className="relative bg-[var(--te-surface-alt)] border border-[var(--te-border)] rounded-lg p-6">
                        <DocumentPlusIcon className="h-16 w-16 text-[var(--te-text)]" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -top-1 -right-1">
                        <SparklesIcon className="h-6 w-6 text-[var(--te-text-dim)] animate-bounce" />
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-[var(--te-text)] mb-3">
                    No Resumes Yet
                </h3>

                {/* Description */}
                <p className="text-sm text-[var(--te-text-dim)] mb-2">
                    Start building your career toolkit by uploading your first resume.
                </p>
                <p className="text-xs text-[var(--te-text-dim)] mb-8">
                    Keep multiple versions tailored for different roles and easily manage them all in one place.
                </p>

                {/* Upload Button */}
                <button
                    type="button"
                    onClick={onUploadClick}
                    className="te-btn-primary te-btn-lg"
                >
                    <DocumentPlusIcon className="h-5 w-5" />
                    Upload Your First Resume
                </button>

                {/* Tips */}
                <div className="mt-8 pt-8 border-t border-[var(--te-border)]">
                    <p className="te-eyebrow mb-4">
                        Quick Tips
                    </p>
                    <div className="grid gap-3 text-left">
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--te-text-dim)]" />
                            <p className="text-xs text-[var(--te-text-dim)]">
                                <span className="font-semibold">PDF format only</span> - Keep it professional and easy to share
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--te-text-dim)]" />
                            <p className="text-xs text-[var(--te-text-dim)]">
                                <span className="font-semibold">Target roles</span> - Tag each resume with the job you're targeting
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--te-text-dim)]" />
                            <p className="text-xs text-[var(--te-text-dim)]">
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
