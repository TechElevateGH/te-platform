import { useState } from "react";
import { BriefcaseIcon } from '@heroicons/react/20/solid'
import axiosInstance from "../../axiosConfig";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import SlideOverForm from "../_custom/SlideOver/SlideOverCreate";
import { FileUpload } from "../_custom/FormInputs";
import { setNestedPropertyValue } from "../../utils";
import SuccessFeedback from "../_custom/Alert/SuccessFeedback";
import { Loading } from "../_custom/Loading";
import SelectCombobox from "../_custom/SelectCombobox";
import { jobTitles } from "../../data/data";
import Toast from "../_custom/Toast";


const INITIAL_FILE_DATA = {
    role: "",
    notes: "",
    document_type: "Resume", // Default document type
    file: null,
};

const FileCreate = ({ setFileUpload }) => {
    const { accessToken, userId } = useAuth();
    const { setFetchFiles } = useData();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [fileData, setFileData] = useState(() => ({ ...INITIAL_FILE_DATA }));
    const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
    const [continueUploading, setContinueUploading] = useState(false);

    const uploadFileRequest = async () => {
        if (!fileData.file) {
            setToast({ message: "Please select a file to upload", type: "error" });
            return false;
        }
        if (!fileData.role) {
            setToast({ message: "Please specify the target role", type: "error" });
            return false;
        }

        // Validate file is PDF
        const fileName = fileData.file.name.toLowerCase();
        if (!fileName.endsWith('.pdf')) {
            setToast({ message: "Only PDF files are allowed. Please upload a PDF resume.", type: "error" });
            return false;
        }

        const data = new FormData();
        data.append('role', fileData.role);
        data.append('notes', fileData.notes);
        data.append('document_type', fileData.document_type);
        data.append('file', fileData.file);

        setIsSubmitting(true);

        try {
            await axiosInstance.post(`/users/${userId}/resumes`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            setShowSuccessFeedback(true);
            setFetchFiles(true);
            setToast({ message: `${fileData.document_type} successfully uploaded.`, type: "success" });

            if (continueUploading) {
                setFileData(() => ({ ...INITIAL_FILE_DATA }));
            } else {
                // Close modal after a brief delay to show success message
                setTimeout(() => {
                    setFileUpload(false);
                }, 1500);
            }
            return true;
        } catch (error) {
            console.error("Upload error:", error);
            setToast({ message: `Failed to upload resume: ${error.response?.data?.detail || error.message}`, type: "error" });
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleInputChange = ({ field, value }) => {
        setFileData((prevFileData) =>
            setNestedPropertyValue({ ...prevFileData }, field, value)
        );
    };

    const handleFileUploadChange = (event) => {
        handleInputChange({ field: "file", value: event.target.files[0] });
    };

    return (
        <>
            <SlideOverForm
                title={"Upload Member File"}
                setHandler={setFileUpload}
                requestHandler={uploadFileRequest}
                submitButtonText="Upload File"
                shouldReload={false}
                isSubmitting={isSubmitting}
                children={
                    <div className="px-6 py-6 space-y-6">

                        {showSuccessFeedback &&
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <SuccessFeedback
                                    message={`${fileData.document_type} successfully uploaded.`}
                                    setShowSuccessFeedback={setShowSuccessFeedback}
                                />
                            </div>
                        }

                        {/* Continuous Upload Toggle */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Keep uploader open</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Stay on this form after a successful upload so you can immediately add another file.</p>
                            </div>
                            <label className="inline-flex items-center cursor-pointer select-none">
                                <span className="sr-only">Toggle continuous uploads</span>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={continueUploading}
                                    onChange={(event) => setContinueUploading(event.target.checked)}
                                    disabled={isSubmitting}
                                />
                                <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${continueUploading ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'} ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${continueUploading ? 'translate-x-5' : 'translate-x-1'}`} />
                                </span>
                            </label>
                        </div>

                        {
                            isSubmitting ? <Loading /> :
                                <>
                                    {/* File Upload */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {fileData.document_type} File
                                        </h3>
                                        <FileUpload
                                            field="resume-upload"
                                            name="resume"
                                            handleFileUploadChange={handleFileUploadChange}
                                            required={true}
                                            accept=".pdf"
                                        />
                                        <p className="text-xs text-gray-500 font-medium">
                                            Only PDF files are accepted
                                        </p>
                                    </div>

                                    {/* Role Field */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Role Information
                                        </h3>
                                        <SelectCombobox
                                            label="Target Role"
                                            options={jobTitles}
                                            value={fileData.role}
                                            onChange={(value) => handleInputChange({ field: 'role', value })}
                                            placeholder="Type or select a role..."
                                            icon={BriefcaseIcon}
                                            required={true}
                                        />
                                        <p className="mt-1.5 text-xs text-gray-500 font-medium">
                                            What position is this resume tailored for?
                                        </p>
                                    </div>

                                    {/* Notes Field */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Additional Notes
                                        </h3>
                                        <div className="relative">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Notes <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                            </label>
                                            <textarea
                                                value={fileData.notes}
                                                onChange={(e) => handleInputChange({ field: 'notes', value: e.target.value })}
                                                placeholder="Add any notes about this resume version..."
                                                rows={4}
                                                className="w-full px-4 py-2.5 bg-surface dark:bg-surface border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-te-cyan focus:border-transparent transition-all text-sm font-medium resize-none"
                                            />
                                            <p className="mt-1.5 text-xs text-gray-500 font-medium">
                                                Example: Updated for tech companies, emphasized ML projects
                                            </p>
                                        </div>
                                    </div>
                                </>
                        }
                    </div>
                }
            />

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    )
}

export default FileCreate;