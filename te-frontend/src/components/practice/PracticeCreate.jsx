import { useState } from 'react'
import axiosInstance from '../../axiosConfig';

import SlideOverForm from '../custom/SlideOver/SlideOverCreate'
import { setNestedPropertyValue } from '../../utils'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import SuccessFeedback from '../custom/Alert/SuccessFeedback'
import { FormSelect, FormInput } from '../custom/FormInputs'

const lessonFormats = {
    "Video": "video", "Document (File)": "document", "Document (Link)": "document", "Web page": "html"
};
const LessonCreate = ({ setAddLesson, lessonCategories }) => {
    const { accessToken } = useAuth();
    const { setFetchLessons } = useData();

    const [lessonData, setLessonData] = useState({ category: "", subcategory: null, format: "", link: "" });
    const [file, setFile] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);

    const createLearningLessonRequest = () => {
        axiosInstance.post("/learning/lessons", { ...lessonData, format: lessonFormats[lessonData.format] },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            .then((_) => {
                setFetchLessons(true);
                setShowSuccessFeedback(true);
                setLessonData({});
            })
            .catch((error) => {
                console.log(error);
            });
    }

    const uploadFileRequest = async () => {
        if (file) {
            setUploadingFile(true)
            const formData = new FormData();
            formData.append('file', file);
            console.log(formData, file)
            axiosInstance.post("/learning/file/upload", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${accessToken}`,
                },
            }).then((response) => {
                console.log(response);
                handleInputChange({ field: "link", value: response.data.file.link });
                setUploadingFile(false);
            }
            ).catch((error) => {
                console.log(error);
            })
        }
    }

    const handleInputChange = ({ field, value }) => {
        setLessonData((prevLessonData) =>
            setNestedPropertyValue({ ...prevLessonData }, field, value)
        );
    };

    const handleFileUploadChange = async (event) => {
        setFile(event.target.files[0]);
    };

    return (
        <SlideOverForm
            title={"New Lesson"}
            setHandler={setAddLesson}
            requestHandler={createLearningLessonRequest}
            children={<div className="flex flex-1 flex-col justify-between">
                <div className="divide-y divide-gray-200 px-4 sm:px-6">
                    <div className="space-y-6 pb-5 pt-6">

                        {showSuccessFeedback &&
                            <SuccessFeedback
                                message={"Lesson successfully added."}
                                setShowSuccessFeedback={setShowSuccessFeedback}
                            />
                        }

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
                                    <div className=" ">
                                        <p className="text-sm leading-6 text-gray-600">Please upload the File first.</p>
                                        <div className="flex">
                                            <input type="file" id="myFile" name="filename" accept=".pdf" className='w-2/3 font-serif' onChange={handleFileUploadChange} />
                                            <button
                                                type='button'
                                                className="flex rounded-full mx-auto text-green-600 bg-green-400/10 ring-green-400/30 ring-1 ring-inset ring-green-500  px-2  py-1.5 text-xs  shadow-sm hover:bg-green-600 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                                                onClick={uploadFileRequest} > Upload</button>
                                        </div>
                                    </div> :
                                    <div className='flex'>
                                        <p className="mt-1 text-sm  text-gray-600 w-2/3">{file.name ?? ""}</p>
                                        <button onClick={() => handleInputChange({ field: "link", value: "" })}>X</button>
                                    </div>
                                ) :
                                <FormInput label="Link" field="link" handleInputChange={handleInputChange} />
                        }

                        {(lessonData.format === "Document (File)" && uploadingFile) &&
                            <div class=" flex text-sm -mt-6" disabled>
                                <span class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
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

