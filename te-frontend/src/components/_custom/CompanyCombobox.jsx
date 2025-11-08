import { Fragment, useState } from 'react'
import { Combobox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, BuildingOfficeIcon } from '@heroicons/react/20/solid'

const CompanyCombobox = ({ companies, value, onChange, required = true }) => {
    const [query, setQuery] = useState('')

    const filteredCompanies =
        query === ''
            ? companies.slice(0, 8) // Show top 8 companies by default
            : companies
                .filter((company) =>
                    company
                        .toLowerCase()
                        .replace(/\s+/g, '')
                        .includes(query.toLowerCase().replace(/\s+/g, ''))
                )
                .slice(0, 8)

    // Check if user is typing a custom company
    const isCustomCompany = query !== '' && !companies.some(
        company => company.toLowerCase() === query.toLowerCase()
    )

    return (
        <Combobox value={value} onChange={(newValue) => {
            onChange(newValue);
            setQuery('');
        }}>
            <div className="relative">
                <Combobox.Label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company {required && <span className="text-red-500">*</span>}
                </Combobox.Label>

                <div className="relative">
                    <div className="relative w-full cursor-default overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-blue-600 transition-all">
                        <BuildingOfficeIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />

                        <Combobox.Input
                            className="w-full border-none py-2.5 pl-11 pr-10 text-sm leading-5 text-gray-900 placeholder:text-gray-400 focus:ring-0 bg-transparent font-medium"
                            displayValue={(company) => company}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && query && isCustomCompany) {
                                    event.preventDefault();
                                    onChange(query);
                                    setQuery('');
                                }
                            }}
                            placeholder="Type or select a company..."
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
                        <Combobox.Options className="absolute z-10 mt-2 max-h-80 w-full overflow-auto rounded-xl bg-white py-1.5 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {filteredCompanies.length === 0 && query !== '' ? (
                                <div className="relative cursor-default select-none px-4 py-3">
                                    {isCustomCompany ? (
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
                                                    <BuildingOfficeIcon className="h-4 w-4 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    Add "{query}"
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Press Enter to add this custom company
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">No companies found.</p>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {isCustomCompany && query !== '' && (
                                        <Combobox.Option
                                            value={query}
                                            className={({ active }) =>
                                                `relative cursor-pointer select-none px-4 py-2.5 transition-colors ${active ? 'bg-blue-50' : ''
                                                }`
                                            }
                                        >
                                            {({ selected, active }) => (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transition-all ${active
                                                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-blue-600/25'
                                                                : 'bg-gray-100'
                                                            }`}>
                                                            <BuildingOfficeIcon className={`h-4 w-4 ${active ? 'text-white' : 'text-gray-600'}`} />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-semibold truncate ${active ? 'text-blue-900' : 'text-gray-900'
                                                            }`}>
                                                            Add "{query}"
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            Custom company
                                                        </p>
                                                    </div>
                                                    {selected && (
                                                        <div className="flex-shrink-0">
                                                            <CheckIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Combobox.Option>
                                    )}

                                    {filteredCompanies.map((company) => (
                                        <Combobox.Option
                                            key={company}
                                            value={company}
                                            className={({ active }) =>
                                                `relative cursor-pointer select-none px-4 py-2.5 transition-colors ${active ? 'bg-blue-50' : ''
                                                }`
                                            }
                                        >
                                            {({ selected, active }) => (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0">
                                                        <img
                                                            src={`https://logo.clearbit.com/${company.toLowerCase().replace(/\s+/g, '')}.com`}
                                                            alt={company}
                                                            className="w-8 h-8 rounded-lg object-cover shadow-sm bg-white"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none'
                                                                e.target.nextSibling.style.display = 'flex'
                                                            }}
                                                        />
                                                        <div
                                                            className={`w-8 h-8 rounded-lg hidden items-center justify-center shadow-sm ${active ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gray-100'
                                                                }`}
                                                        >
                                                            <BuildingOfficeIcon className={`h-4 w-4 ${active ? 'text-white' : 'text-gray-600'}`} />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-semibold truncate ${active ? 'text-blue-900' : 'text-gray-900'
                                                            }`}>
                                                            {company}
                                                        </p>
                                                    </div>
                                                    {selected && (
                                                        <div className="flex-shrink-0">
                                                            <CheckIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Combobox.Option>
                                    ))}
                                </>
                            )}
                        </Combobox.Options>
                    </Transition>
                </div>

                {/* Helpful hint */}
                <p className="mt-1.5 text-xs text-gray-500 font-medium">
                    Select from popular companies or type your own
                </p>
            </div>
        </Combobox>
    )
}

export default CompanyCombobox
