import { useState } from 'react'
import axiosInstance from '../../axiosConfig';

import SlideOverForm from '../_custom/SlideOver/SlideOverCreate'
import { setNestedPropertyValue } from '../../utils'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import SuccessFeedback from '../_custom/Alert/SuccessFeedback'
import { FormSelect, FormInput, FileUpload } from '../_custom/FormInputs'

const lessonFormats = {
    "Video": "video", "Document (File)": "document", "Document (Link)": "document", "Web page": "html"
};
const initialLessonState = { category: "", subcategory: null, format: "", link: "" };

const LessonCreate = ({ setAddLesson, lessonCategories }) => {
    const { accessToken } = useAuth();
    const { setFetchLessons } = useData();

    const [lessonData, setLessonData] = useState({ ...initialLessonState });
    const [file, setFile] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const createLearningLessonRequest = async () => {
        setSubmitError("");
        setShowSuccessFeedback(false);
        setIsSubmitting(true);

        try {
            await axiosInstance.post("/learning/lessons", { ...lessonData, format: lessonFormats[lessonData.format] },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

            setFetchLessons(true);
            setShowSuccessFeedback(true);
            setLessonData({ ...initialLessonState });
            setFile(null);

            return true;
        } catch (error) {
            console.error('Error creating lesson:', error);
            setSubmitError(error.response?.data?.detail || 'Failed to create lesson. Please try again.');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }

    const uploadFileRequest = async () => {
        if (file) {
            setSubmitError("");
            setUploadingFile(true);
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await axiosInstance.post("/learning/file/upload", formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                handleInputChange({ field: "link", value: response.data.file.link });
            } catch (error) {
                console.error('Error uploading file:', error);
                setSubmitError(error.response?.data?.detail || 'Failed to upload file. Please try again.');
            } finally {
                setUploadingFile(false);
            }
        }
    }

    const handleInputChange = ({ field, value }) => {
        setLessonData((prevLessonData) =>
            setNestedPropertyValue({ ...prevLessonData }, field, value)
        );
    };

    const handleFileUploadChange = (event) => {
        setFile(event.target.files[0]);
    };

    return (
        <SlideOverForm
            title={"New Lesson"}
            setHandler={setAddLesson}
            requestHandler={createLearningLessonRequest}
            isSubmitting={isSubmitting}
            children={<div className="flex flex-1 flex-col justify-between">
                <div className="divide-y divide-gray-200 px-4 sm:px-6">
                    <div className="space-y-6 pb-5 pt-6">

                        {showSuccessFeedback &&
                            <SuccessFeedback
                                message={"Lesson successfully added."}
                                setShowSuccessFeedback={setShowSuccessFeedback}
                            />
                        }

                        {submitError && (
                            <div className="rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm font-semibold text-red-900 dark:text-red-200">
                                {submitError}
                            </div>
                        )}

                        <FormInput label="Topic" field="topic" handleInputChange={handleInputChange} required={true} />
                        <FormSelect label="Category" field="category" data={Object.keys(lessonCategories)} handleInputChange={handleInputChange} required={true} />

                        {lessonData?.category && (lessonData.category === "Workshops" ?
                            <>
                                <FormSelect label="Subcategory" field="subcategory" data={Object.keys(lessonCategories[lessonData.category]) ?? []} handleInputChange={handleInputChange} required={true} />
                                {lessonData.subcategory && <FormSelect label="Playlist" field="playlist" data={lessonCategories[lessonData.subcategory] ?? []} handleInputChange={handleInputChange} required={true} />}
                            </> :
                            <FormSelect label="Playlist" field="playlist" data={lessonCategories[lessonData.category] ?? []} handleInputChange={handleInputChange} required={true} />
                        )}

                        {
                            lessonData?.category === "Workshops" &&
                            <>
                                <FormInput label="Instructor" field="instructor" handleInputChange={handleInputChange} />
                            </>
                        }

                        <FormSelect label="Format" field="format" data={Object.keys(lessonFormats)} handleInputChange={handleInputChange} />
                        {
                            lessonData.format === "Document (File)" ?
                                (lessonData.link === "" ?
                                    <FileUpload
                                        label={"Please upload file first"}
                                        field={"lesson-file"}
                                        name="lesson-file"
                                        handleFileUploadChange={handleFileUploadChange}
                                        uploadFileRequest={uploadFileRequest}
                                    /> :
                                    <div className='flex'>
                                        <p className="mt-1 text-sm  text-gray-600 w-2/3">{file.name ?? ""}</p>
                                        <button onClick={() => handleInputChange({ field: "link", value: "" })}>X</button>
                                    </div>
                                ) :
                                <FormInput label="Link" field="link" handleInputChange={handleInputChange} />
                        }

                        {(lessonData.format === "Document (File)" && uploadingFile) &&
                            <div className="flex text-sm -mt-6">
                                <span className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                    🌎
                                </span>
                                Uploading
                            </div>
                        }
                    </div>
                </div>
            </div >}
        />
    )
}


export default LessonCreate;

