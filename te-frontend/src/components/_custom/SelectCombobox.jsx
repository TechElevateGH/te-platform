import { Fragment, useState } from 'react'
import { Combobox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from 'icons'

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
                <Combobox.Label className="block mb-2 text-sm font-mono font-semibold text-[var(--te-text)] transition-colors">
                    {label} {required && <span className="text-red-500">*</span>}
                </Combobox.Label>

                <div className="relative">
                    <div className="relative w-full cursor-default overflow-hidden rounded-md bg-[var(--te-surface)] text-left border border-[var(--te-border)] focus-within:border-[var(--te-accent)] focus-within:shadow-[0_0_0_3px_var(--te-ring)] transition-colors">
                        {Icon && (
                            <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--te-text-dim)]" />
                        )}

                        <Combobox.Input
                            className={`w-full border-none py-2.5 ${Icon ? 'pl-11' : 'pl-4'} pr-10 text-sm leading-5 text-[var(--te-text)] placeholder:text-[var(--te-text-dim)] focus:ring-0 bg-transparent font-medium`}
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

                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3 hover:bg-[var(--te-hover)] transition-colors rounded-r-md">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-[var(--te-text-dim)]"
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
                        <Combobox.Options className="te-scroll absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-md bg-[var(--te-surface)] py-1.5 text-base shadow-sm border border-[var(--te-border)] focus:outline-none sm:text-sm">
                            {/* Always show custom value option if user is typing a new one */}
                            {isCustomValue && query !== '' && (
                                <Combobox.Option
                                    value={query}
                                    className={({ active }) =>
                                        `relative cursor-pointer select-none px-4 py-2.5 transition-colors ${active ? 'bg-[var(--te-hover)]' : ''
                                        }`
                                    }
                                >
                                    {({ selected, active }) => (
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold truncate ${active ? 'text-[var(--te-text)]' : 'text-[var(--te-text)]'
                                                    }`}>
                                                    Add "{query}"
                                                </p>
                                                <p className="text-xs text-[var(--te-text-dim)] truncate">
                                                    Press Enter to add custom value
                                                </p>
                                            </div>
                                            {selected && (
                                                <CheckIcon className="h-5 w-5 text-[var(--te-text)] ml-3" aria-hidden="true" />
                                            )}
                                        </div>
                                    )}
                                </Combobox.Option>
                            )}

                            {/* Show filtered options */}
                            {filteredOptions.length === 0 && !isCustomValue && query !== '' ? (
                                <div className="relative cursor-default select-none px-4 py-3">
                                    <p className="text-sm text-[var(--te-text-dim)]">No options found.</p>
                                </div>
                            ) : (
                                filteredOptions.map((option) => (
                                    <Combobox.Option
                                        key={option}
                                        value={option}
                                        className={({ active }) =>
                                            `relative cursor-pointer select-none px-4 py-2.5 transition-colors ${active ? 'bg-[var(--te-hover)]' : ''
                                            }`
                                        }
                                    >
                                        {({ selected, active }) => (
                                            <div className="flex items-center justify-between">
                                                <span className={`block truncate text-sm font-medium ${active ? 'text-[var(--te-text)]' : 'text-[var(--te-text)]'
                                                    }`}>
                                                    {option}
                                                </span>
                                                {selected && (
                                                    <CheckIcon className="h-5 w-5 text-[var(--te-text)] ml-3" aria-hidden="true" />
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
                <p className="mt-1.5 text-xs text-[var(--te-text-dim)] font-medium transition-colors">
                    Select from options or type your own
                </p>
            </div>
        </Combobox>
    )
}

export default SelectCombobox
