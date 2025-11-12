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


const FileCreate = ({ setFileUpload }) => {
    const { accessToken, userId } = useAuth();
    const { setFetchFiles } = useData();

    const [status, setStatus] = useState(null);
    const [fileData, setFileData] = useState({
        role: "",
        notes: "",
        document_type: "Resume", // Default document type
        file: null
    })
    const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);

    const uploadFileRequest = async () => {
        if (!fileData.file) {
            alert("Please select a file to upload");
            return;
        }
        if (!fileData.role) {
            alert("Please specify the target role");
            return;
        }

        // Validate file is PDF
        const fileName = fileData.file.name.toLowerCase();
        if (!fileName.endsWith('.pdf')) {
            alert("Only PDF files are allowed. Please upload a PDF resume.");
            return;
        }

        const data = new FormData();
        data.append('role', fileData.role);
        data.append('notes', fileData.notes);
        data.append('document_type', fileData.document_type);
        data.append('file', fileData.file);

        setStatus("Loading...")

        try {
            await axiosInstance.post(`/users/${userId}/resumes`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            setShowSuccessFeedback(true);
            setStatus(null);
            setFetchFiles(true);
            // Close modal after a brief delay to show success message
            setTimeout(() => {
                setFileUpload(false);
            }, 1500);
        } catch (error) {
            console.error("Upload error:", error);
            alert(`Failed to upload resume: ${error.response?.data?.detail || error.message}`);
            setStatus(null);
        }
    }

    const handleInputChange = ({ field, value }) => {
        setFileData((prevFileData) =>
            setNestedPropertyValue({ ...prevFileData }, field, value)
        );
    };

    const handleFileUploadChange = async (event) => {
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

                        {
                            status === "Loading..." ? <Loading /> :
                                <>
                                    {/* Document Type Selection */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Document Type
                                        </h3>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['Resume', 'Referral Essay', 'Cover Letter'].map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => handleInputChange({ field: 'document_type', value: type })}
                                                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${fileData.document_type === type
                                                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* File Upload */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {fileData.document_type} File
                                        </h3>
                                        <FileUpload
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
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium resize-none"
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
        </>
    )
}

export default FileCreate;