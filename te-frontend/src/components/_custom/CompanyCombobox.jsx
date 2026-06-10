import { Fragment, useState } from 'react'
import { Combobox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, BuildingOfficeIcon } from 'icons'
import { getCompanyLogoUrl, handleCompanyLogoError } from '../../utils'

const CompanyCombobox = ({ companies, value, onChange, required = true }) => {
    const [query, setQuery] = useState('')

    const filteredCompanies =
        query === ''
            ? (companies || []).slice(0, 8) // Show top 8 companies by default
            : (companies || [])
                .filter((company) =>
                    company &&
                    company
                        .toLowerCase()
                        .replace(/\s+/g, '')
                        .includes(query.toLowerCase().replace(/\s+/g, ''))
                )
                .slice(0, 8)

    // Check if user is typing a custom company
    const isCustomCompany = query !== '' && !(companies || []).some(
        company => company && company.toLowerCase() === query.toLowerCase()
    )

    return (
        <Combobox value={value} onChange={(newValue) => {
            onChange(newValue);
            setQuery('');
        }}>
            <div className="relative">
                <Combobox.Label className="block mb-2 text-sm font-mono font-semibold text-[var(--te-text)] transition-colors">
                    Company {required && <span className="text-red-500">*</span>}
                </Combobox.Label>

                <div className="relative">
                    <div className="relative w-full cursor-default overflow-hidden rounded-md bg-[var(--te-surface)] text-left border border-[var(--te-border)] focus-within:border-[var(--te-accent)] focus-within:shadow-[0_0_0_3px_var(--te-ring)] transition-colors">
                        <BuildingOfficeIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--te-text-dim)]" />

                        <Combobox.Input
                            className="w-full border-none py-2.5 pl-11 pr-10 text-sm leading-5 text-[var(--te-text)] placeholder:text-[var(--te-text-dim)] focus:ring-0 bg-transparent font-medium"
                            displayValue={(company) => company || ''}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && query) {
                                    event.preventDefault();
                                    // Custom company
                                    if (isCustomCompany) {
                                        onChange(query);
                                        setQuery('');
                                        return;
                                    }
                                    const exact = (companies || []).find(c => c && c.toLowerCase() === query.toLowerCase());
                                    if (exact) {
                                        onChange(exact);
                                        setQuery('');
                                        return;
                                    }
                                    if (filteredCompanies.length > 0) {
                                        onChange(filteredCompanies[0]);
                                        setQuery('');
                                    }
                                }
                            }}
                            placeholder="Type or select a company..."
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
                        <Combobox.Options className="te-scroll absolute z-10 mt-2 max-h-80 w-full overflow-auto rounded-md bg-[var(--te-surface)] py-1.5 text-base shadow-sm border border-[var(--te-border)] focus:outline-none sm:text-sm">
                            {/* Always show custom company option if user is typing a new one */}
                            {isCustomCompany && query !== '' && (
                                <Combobox.Option
                                    value={query}
                                    className={({ active }) =>
                                        `relative cursor-pointer select-none px-4 py-2.5 transition-colors ${active ? 'bg-[var(--te-hover)]' : ''
                                        }`
                                    }
                                >
                                    {({ selected, active }) => (
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0">
                                                <div className={`w-8 h-8 rounded-md flex items-center justify-center border border-[var(--te-border)] transition-colors ${active
                                                    ? 'bg-[var(--te-hover)]'
                                                    : 'bg-[var(--te-surface-alt)]'
                                                    }`}>
                                                    <BuildingOfficeIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold truncate ${active ? 'text-[var(--te-text)]' : 'text-[var(--te-text)]'
                                                    }`}>
                                                    Add "{query}"
                                                </p>
                                                <p className="text-xs text-[var(--te-text-dim)] truncate">
                                                    Press Enter to add this custom company
                                                </p>
                                            </div>
                                            {selected && (
                                                <div className="flex-shrink-0">
                                                    <CheckIcon className="h-5 w-5 text-[var(--te-text)]" aria-hidden="true" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Combobox.Option>
                            )}

                            {/* Show filtered companies */}
                            {filteredCompanies.length === 0 && !isCustomCompany && query !== '' ? (
                                <div className="relative cursor-default select-none px-4 py-3">
                                    <p className="text-sm text-[var(--te-text-dim)]">No companies found.</p>
                                </div>
                            ) : (
                                filteredCompanies.map((company) => company && (
                                    <Combobox.Option
                                        key={company}
                                        value={company}
                                        className={({ active }) =>
                                            `relative cursor-pointer select-none px-4 py-2.5 transition-colors ${active ? 'bg-[var(--te-hover)]' : ''
                                            }`
                                        }
                                    >
                                        {({ selected, active }) => (
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    <img
                                                        src={getCompanyLogoUrl(company)}
                                                        alt={company || ''}
                                                        className="w-8 h-8 rounded-md object-cover bg-[var(--te-surface)] border border-[var(--te-border)]"
                                                        onError={handleCompanyLogoError}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-semibold truncate ${active ? 'text-[var(--te-text)]' : 'text-[var(--te-text)]'
                                                        }`}>
                                                        {company}
                                                    </p>
                                                </div>
                                                {selected && (
                                                    <div className="flex-shrink-0">
                                                        <CheckIcon className="h-5 w-5 text-[var(--te-text)]" aria-hidden="true" />
                                                    </div>
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
                    Select from popular companies or type your own
                </p>
            </div>
        </Combobox>
    )
}

export default CompanyCombobox
