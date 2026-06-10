import { ExclamationCircleIcon } from 'icons'
import { CheckIcon, ChevronUpDownIcon } from 'icons'
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
                    className="block mb-2 text-sm font-mono font-semibold text-[var(--te-text)] transition-colors"
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
                        className="te-input pr-10 font-medium"
                        onChange={(event) => setQuery(event.target.value)}
                        displayValue={(item) => item}
                        placeholder={placeholder || `Select ${label ? label.toLowerCase() : 'option'}...`}
                        required={required}
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 hover:bg-[var(--te-hover)] focus:outline-none">
                        <ChevronUpDownIcon className="h-5 w-5 text-[var(--te-text-dim)]" aria-hidden="true" />
                    </Combobox.Button>

                    {filteredData.length > 0 && (
                        <Combobox.Options className="te-scroll absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[var(--te-surface)] py-1 text-sm shadow-sm border border-[var(--te-border)] focus:outline-none">
                            {filteredData.map((item, index) => (
                                <Combobox.Option
                                    key={index}
                                    value={item}
                                    className={({ active }) =>
                                        classNames(
                                            'relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors',
                                            active ? 'bg-[var(--te-hover)] text-[var(--te-text)]' : 'text-[var(--te-text)]'
                                        )
                                    }
                                >
                                    {({ active, selected }) => (
                                        <>
                                            <span className={classNames('block truncate', active ? 'text-[var(--te-text)]' : 'text-[var(--te-text)]', selected && 'font-semibold')}>
                                                {item}
                                            </span>

                                            {selected && (
                                                <span
                                                    className={classNames(
                                                        'absolute inset-y-0 right-0 flex items-center pr-4',
                                                        'text-[var(--te-text)]'
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
                    className="block mb-2 text-sm font-mono font-semibold text-[var(--te-text)] transition-colors"
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div>
                <select
                    name={field}
                    id={field}
                    className="te-select font-medium"
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
                    className="block mb-2 text-sm font-mono font-semibold text-[var(--te-text)] transition-colors"
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
                    className="te-input font-medium"
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
                    className="block mb-2 text-sm font-mono font-semibold text-[var(--te-text)] transition-colors"
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div>
                <textarea
                    id={field}
                    name={field}
                    rows={4}
                    className="te-textarea resize-none font-medium"
                    placeholder={label ? `Enter ${label.toLowerCase()}...` : ''}
                    defaultValue={''}
                    onChange={(e) => handleInputChange({ field: field, value: e.target.value })}
                    required={required}
                />
            </div>
        </div>
    )
}

export const FileUpload = ({
    label,
    field,
    handleFileUploadChange,
    uploadFileRequest,
    required,
    accept = '.pdf',
    name,
}) => {
    const inputId = field || 'file-upload-input';

    return (
        <div className="">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block mb-2 text-sm font-mono font-semibold text-[var(--te-text)] transition-colors"
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="mt-6 flex rounded-lg border border-dashed border-[var(--te-border)] px-3 py-3 bg-[var(--te-surface)] transition-colors">
                <input
                    type="file"
                    id={inputId}
                    name={name || inputId}
                    accept={accept}
                    className='w-2/3 text-[var(--te-text)] transition-colors'
                    onChange={handleFileUploadChange}
                    required={required}
                />

                {uploadFileRequest &&
                    <button
                        type='button'
                        className="te-btn-secondary te-btn-sm mx-auto"
                        onClick={uploadFileRequest} >
                        Upload
                    </button>}

            </div>
        </div>
    )
}

export const FormCheckBox = ({ label, field, handleInputChange, checked = false }) => {
    const checkboxId = field.replace(/\./g, '-');

    return (
        <div className="block text-sm leading-6 text-[var(--te-text)] font-mono font-semibold transition-colors">
            <label htmlFor={checkboxId} className='mr-2'>{label}</label>
            <input
                id={checkboxId}
                type="checkbox"
                checked={checked}
                onChange={(event) => handleInputChange({ field, value: event.target.checked })}
                className="rounded border-[var(--te-border)] text-[var(--te-text)] focus:ring-[var(--te-ring)] bg-[var(--te-surface)] checked:bg-[var(--te-primary)] transition-colors"
            />
        </div>
    )
}