import { ExclamationCircleIcon } from '@heroicons/react/20/solid'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { Combobox } from '@headlessui/react'
import { useState } from 'react'

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export const FormCombobox = ({ field, label, data, handleInputChange, value, required, placeholder }) => {
    const [query, setQuery] = useState('')

    const filteredData =
        query === ''
            ? data
            : data.filter((item) => {
                return item.toLowerCase().includes(query.toLowerCase())
            })

    return (
        <div>
            {label && (
                <label
                    htmlFor={field}
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors"
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <Combobox
                value={value || ''}
                onChange={(selectedValue) => handleInputChange({ field: field, value: selectedValue })}
            >
                <div className="relative">
                    <Combobox.Input
                        className="block w-full rounded-xl border-0 px-3.5 py-2.5 pr-10 text-gray-900 dark:text-white font-medium shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-500 sm:text-sm transition-all bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
                        onChange={(event) => setQuery(event.target.value)}
                        displayValue={(item) => item}
                        placeholder={placeholder || `Select ${label ? label.toLowerCase() : 'option'}...`}
                        required={required}
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-2 focus:outline-none">
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                    </Combobox.Button>

                    {filteredData.length > 0 && (
                        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-gray-700 py-1 text-sm shadow-lg ring-1 ring-black dark:ring-gray-600 ring-opacity-5 focus:outline-none">
                            {filteredData.map((item, index) => (
                                <Combobox.Option
                                    key={index}
                                    value={item}
                                    className={({ active }) =>
                                        classNames(
                                            'relative cursor-pointer select-none py-2 pl-3 pr-9',
                                            active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-white'
                                        )
                                    }
                                >
                                    {({ active, selected }) => (
                                        <>
                                            <span className={classNames('block truncate', selected && 'font-semibold')}>
                                                {item}
                                            </span>

                                            {selected && (
                                                <span
                                                    className={classNames(
                                                        'absolute inset-y-0 right-0 flex items-center pr-4',
                                                        active ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                                                    )}
                                                >
                                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                            )}
                                        </>
                                    )}
                                </Combobox.Option>
                            ))}
                        </Combobox.Options>
                    )}
                </div>
            </Combobox>
        </div>
    )
}


export const FormSelect = ({ field, label, data, handleInputChange, value, required }) => {

    return (
        <div>
            {label && (
                <label
                    htmlFor={field}
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors"
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div>
                <select
                    name={field}
                    id={field}
                    className="block w-full rounded-xl border-0 px-3.5 py-2.5 text-gray-900 dark:text-white font-medium shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-500 sm:text-sm transition-all bg-white dark:bg-gray-700"
                    value={value || ""}
                    onChange={(e) => handleInputChange({ field: field, value: e.target.value })}
                    required={required}
                >
                    <option value="">Select {label ? label.toLowerCase() : 'option'}...</option>
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
            {label && (
                <label
                    htmlFor={field}
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors"
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    type={type ?? "text"}
                    name={field}
                    id={field}
                    placeholder={placeholder || (label ? `Enter ${label.toLowerCase()}...` : '')}
                    value={value ?? ""}
                    className="block w-full rounded-xl border-0 px-3.5 py-2.5 text-gray-900 dark:text-white font-medium shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-500 sm:text-sm transition-all bg-white dark:bg-gray-700"
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
            {label && (
                <label
                    htmlFor={field}
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors"
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div>
                <textarea
                    id={field}
                    name={field}
                    rows={4}
                    className="block w-full rounded-xl border-0 px-3.5 py-2.5 text-gray-900 dark:text-white font-medium shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-500 sm:text-sm transition-all resize-none bg-white dark:bg-gray-700"
                    placeholder={label ? `Enter ${label.toLowerCase()}...` : ''}
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
            <p className="text-sm leading-6 text-gray-600 dark:text-gray-300 transition-colors">{label}</p>
            <div className="mt-6 flex rounded-lg border border-dashed border-gray-900/25 dark:border-gray-700/50 px-3 py-3 bg-white dark:bg-gray-700/50 transition-colors">
                <input
                    type="file"
                    id={field}
                    name="filename"
                    accept=".pdf"
                    className='w-2/3 font-serif text-gray-900 dark:text-white transition-colors'
                    onChange={handleFileUploadChange}
                    required={required}
                />

                {uploadFileRequest &&
                    <button
                        type='button'
                        className="flex rounded-full mx-auto text-green-600 dark:text-green-400 bg-green-400/10 dark:bg-green-900/30 ring-green-400/30 dark:ring-green-500/30 ring-1 ring-inset ring-green-500 dark:ring-green-600 px-2 py-1.5 text-xs shadow-sm hover:bg-green-600 hover:text-gray-900 dark:hover:bg-green-700 dark:hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 dark:focus-visible:outline-green-500 transition-colors"
                        onClick={uploadFileRequest} >
                        Upload
                    </button>}

            </div>
        </div>
    )
}

export const FormCheckBox = ({ label, field, handleInputChange }) => {
    return (
        <div className="block text-sm leading-6 text-black dark:text-white font-semibold transition-colors">
            <label htmlFor={field} className='mr-2'>{label}</label>
            <input id={field} type="checkbox" onChange={handleInputChange} className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-600 dark:bg-gray-700 dark:checked:bg-blue-600 transition-colors" />
        </div>
    )
}