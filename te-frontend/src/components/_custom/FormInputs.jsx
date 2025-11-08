import { ExclamationCircleIcon } from '@heroicons/react/20/solid'


export const FormSelect = ({ field, label, data, handleInputChange, value, required }) => {

    return (
        <div>
            <label
                htmlFor={field}
                className="block text-sm font-semibold text-gray-700 mb-2"
            >
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <div>
                <select
                    name={field}
                    id={field}
                    className="block w-full rounded-xl border-0 px-3.5 py-2.5 text-gray-900 font-medium shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm transition-all bg-white"
                    defaultValue={value}
                    onChange={(e) => handleInputChange({ field: field, value: e.target.value })}
                    required={required}
                >
                    <option value="">Select {label.toLowerCase()}...</option>
                    {data.map((item, index) => (
                        <option key={index} value={item}>{item}</option>
                    ))}
                </select>
            </div>
        </div>

    )
}


export const FormInput = ({ type, label, field, placeholder, handleInputChange, validation, value, required }) => {
    return (
        <div>
            <label
                htmlFor={field}
                className="block text-sm font-semibold text-gray-700 mb-2"
            >
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <input
                    type={type ?? "text"}
                    name={field}
                    id={field}
                    placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
                    defaultValue={value ?? ""}
                    className="block w-full rounded-xl border-0 px-3.5 py-2.5 text-gray-900 font-medium shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm transition-all"
                    aria-invalid={validation}
                    onChange={(e) => handleInputChange({ field: field, value: e.target.value })}
                    required={required}
                />
                {validation &&
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                    </div>
                }
            </div>
        </div>
    )
}

export const FormTextArea = ({ label, field, handleInputChange, required }) => {
    return (
        <div>
            <label
                htmlFor={field}
                className="block text-sm font-semibold text-gray-700 mb-2"
            >
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div>
                <textarea
                    id={field}
                    name={field}
                    rows={4}
                    className="block w-full rounded-xl border-0 px-3.5 py-2.5 text-gray-900 font-medium shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm transition-all resize-none"
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    defaultValue={''}
                    onChange={(e) => handleInputChange({ field: field, value: e.target.value })}
                    required={required}
                />
            </div>
        </div>
    )
}

export const FileUpload = ({ label, field, handleFileUploadChange, uploadFileRequest, required }) => {
    return (
        <div className="">
            <p className="text-sm leading-6 text-gray-600">{label}</p>
            <div className="mt-6 flex rounded-lg border border-dashed  border-gray-900/25 px-3 py-3">
                <input
                    type="file"
                    id={field}
                    name="filename"
                    accept=".pdf"
                    className='w-2/3 font-serif'
                    onChange={handleFileUploadChange}
                    required={required}
                />

                {uploadFileRequest &&
                    <button
                        type='button'
                        className="flex rounded-full mx-auto text-green-600 bg-green-400/10 ring-green-400/30 ring-1 ring-inset ring-green-500  px-2  py-1.5 text-xs  shadow-sm hover:bg-green-600 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                        onClick={uploadFileRequest} >
                        Upload
                    </button>}

            </div>
        </div>
    )
}

export const FormCheckBox = ({ label, field, handleInputChange }) => {
    return (
        <div className="block text-sm  leading-6 text-black font-semibold">
            <label htmlFor={field} className='mr-2'>{label}</label>
            <input id={field} type="checkbox" onChange={handleInputChange} />
        </div>
    )
}