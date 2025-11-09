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


const FileCreate = ({ setFileUpload }) => {
    const { accessToken, userId } = useAuth();
    const { setFetchFiles } = useData();

    const [status, setStatus] = useState(null);
    const [fileData, setFileData] = useState({
        role: "",
        notes: "",
        file: null
    })
    const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);

    const uploadFileRequest = async () => {
        const data = new FormData();
        data.append('role', fileData.role);
        data.append('notes', fileData.notes);
        data.append('file', fileData.file);

        setStatus("Loading...")

        axiosInstance.post(`/users/${userId}/files/create`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${accessToken}`,
            },
        }).then((_) => {
            setShowSuccessFeedback(true);
            setStatus(null);
            setFetchFiles(true);
        }
        ).catch((error) => {
            console.log(error);
            setStatus(null);
        })
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
                title={"Upload New Resume"}
                setHandler={setFileUpload}
                requestHandler={uploadFileRequest}
                children={
                    <div className="px-6 py-6 space-y-6">

                        {showSuccessFeedback &&
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <SuccessFeedback
                                    message={"Resume successfully uploaded."}
                                    setShowSuccessFeedback={setShowSuccessFeedback}
                                />
                            </div>
                        }

                        {
                            status === "Loading..." ? <Loading /> :
                                <>
                                    {/* Resume File Upload */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Resume File
                                        </h3>
                                        <FileUpload
                                            handleFileUploadChange={handleFileUploadChange}
                                            required={true}
                                            accept=".pdf,.doc,.docx"
                                        />
                                        <p className="text-xs text-gray-500 font-medium">
                                            Accepted formats: PDF, DOC, DOCX
                                        </p>
                                    </div>

                                    {/* Role Field */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Role Information
                                        </h3>
                                        <div className="relative">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Target Role <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <BriefcaseIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={fileData.role}
                                                    onChange={(e) => handleInputChange({ field: 'role', value: e.target.value })}
                                                    placeholder="e.g., Software Engineer, Data Scientist"
                                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                                                    required
                                                />
                                            </div>
                                            <p className="mt-1.5 text-xs text-gray-500 font-medium">
                                                What position is this resume tailored for?
                                            </p>
                                        </div>
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