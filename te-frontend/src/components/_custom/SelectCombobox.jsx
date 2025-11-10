import { Fragment, useState } from 'react'
import { Combobox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'

const SelectCombobox = ({
    label,
    options = [],
    value,
    onChange,
    required = true,
    placeholder = "Type or select...",
    icon: Icon
}) => {
    const [query, setQuery] = useState('')

    const filteredOptions =
        query === ''
            ? options.slice(0, 10)
            : options
                .filter((option) =>
                    option
                        .toLowerCase()
                        .replace(/\s+/g, '')
                        .includes(query.toLowerCase().replace(/\s+/g, ''))
                )
                .slice(0, 10)

    // Check if user is typing a custom value
    const isCustomValue = query !== '' && !options.some(
        option => option.toLowerCase() === query.toLowerCase()
    )

    return (
        <Combobox value={value} onChange={(newValue) => {
            onChange(newValue);
            setQuery('');
        }}>
            <div className="relative">
                <Combobox.Label className="block text-sm font-semibold text-gray-700 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </Combobox.Label>

                <div className="relative">
                    <div className="relative w-full cursor-default overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-blue-600 transition-all">
                        {Icon && (
                            <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        )}

                        <Combobox.Input
                            className={`w-full border-none py-2.5 ${Icon ? 'pl-11' : 'pl-4'} pr-10 text-sm leading-5 text-gray-900 placeholder:text-gray-400 focus:ring-0 bg-transparent font-medium`}
                            displayValue={(val) => val}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && query) {
                                    event.preventDefault();
                                    // Custom value
                                    if (isCustomValue) {
                                        onChange(query);
                                        setQuery('');
                                        return;
                                    }
                                    // Exact match from options
                                    const exact = options.find(o => o.toLowerCase() === query.toLowerCase());
                                    if (exact) {
                                        onChange(exact);
                                        setQuery('');
                                        return;
                                    }
                                    // Fallback to first filtered option
                                    if (filteredOptions.length > 0) {
                                        onChange(filteredOptions[0]);
                                        setQuery('');
                                    }
                                }
                            }}
                            placeholder={placeholder}
                            required={required}
                        />

                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3 hover:bg-gray-50 transition-colors rounded-r-xl">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </Combobox.Button>
                    </div>

                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Combobox.Options className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white py-1.5 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {/* Always show custom value option if user is typing a new one */}
                            {isCustomValue && query !== '' && (
                                <Combobox.Option
                                    value={query}
                                    className={({ active }) =>
                                        `relative cursor-pointer select-none px-4 py-2.5 transition-colors ${active ? 'bg-blue-50' : ''
                                        }`
                                    }
                                >
                                    {({ selected, active }) => (
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold truncate ${active ? 'text-blue-900' : 'text-gray-900'
                                                    }`}>
                                                    Add "{query}"
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    Press Enter to add custom value
                                                </p>
                                            </div>
                                            {selected && (
                                                <CheckIcon className="h-5 w-5 text-blue-600 ml-3" aria-hidden="true" />
                                            )}
                                        </div>
                                    )}
                                </Combobox.Option>
                            )}

                            {/* Show filtered options */}
                            {filteredOptions.length === 0 && !isCustomValue && query !== '' ? (
                                <div className="relative cursor-default select-none px-4 py-3">
                                    <p className="text-sm text-gray-500">No options found.</p>
                                </div>
                            ) : (
                                filteredOptions.map((option) => (
                                    <Combobox.Option
                                        key={option}
                                        value={option}
                                        className={({ active }) =>
                                            `relative cursor-pointer select-none px-4 py-2.5 transition-colors ${active ? 'bg-blue-50' : ''
                                            }`
                                        }
                                    >
                                        {({ selected, active }) => (
                                            <div className="flex items-center justify-between">
                                                <span className={`block truncate text-sm font-medium ${active ? 'text-blue-900' : 'text-gray-900'
                                                    }`}>
                                                    {option}
                                                </span>
                                                {selected && (
                                                    <CheckIcon className="h-5 w-5 text-blue-600 ml-3" aria-hidden="true" />
                                                )}
                                            </div>
                                        )}
                                    </Combobox.Option>
                                ))
                            )}
                        </Combobox.Options>
                    </Transition>
                </div>

                {/* Helpful hint */}
                <p className="mt-1.5 text-xs text-gray-500 font-medium">
                    Select from options or type your own
                </p>
            </div>
        </Combobox>
    )
}

export default SelectCombobox
