import { ChevronRightIcon } from 'icons'
import { MapPinIcon, CalendarIcon } from 'icons'
import { jobStatuses } from './ApplicationInfo'
import { getCompanyLogoUrl, handleCompanyLogoError } from '../../utils'



const classNames = (...classes) => {
    return classes.filter(Boolean).join(' ')
}

const ApplicationItem = ({ allowSelection, addSelectedItem, application, setApplicationId }) => {

    return (
        <div
            className="group cursor-pointer border-b border-[var(--te-border)] bg-[var(--te-surface)] p-4 transition-colors hover:bg-[var(--te-hover)]"
            onClick={() => { !allowSelection && setApplicationId(application.id) }}
        >
            <div className="flex items-start gap-3">
                {/* Checkbox + Logo */}
                {allowSelection && (
                    <input
                        id={`app-${application.id}`}
                        type="checkbox"
                        checked={application.selected}
                        onChange={(e) => {
                            e.stopPropagation();
                            addSelectedItem(application);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-[var(--te-border)] text-[var(--te-primary)] focus:ring-2 focus:ring-[var(--te-ring)]"
                    />
                )}

                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                    <img
                        alt={application.company.name}
                        className="h-7 w-7 object-contain"
                        src={getCompanyLogoUrl(application.company.name)}
                        onError={handleCompanyLogoError}
                    />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between gap-3">
                        <h3 className="truncate text-sm font-semibold text-[var(--te-text)]">
                            {application.company.name}
                        </h3>
                        <div
                            className={classNames(
                                jobStatuses[application.status],
                                'te-chip flex-shrink-0 whitespace-nowrap border'
                            )}
                        >
                            {application.status}
                        </div>
                    </div>

                    <p className="mb-3 truncate text-sm text-[var(--te-text-dim)]">
                        {application.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--te-border)] pt-3 font-mono text-[10px] uppercase tracking-wide text-[var(--te-text-dim)]">
                        {application.location && (
                            <div className="flex items-center gap-1">
                                <MapPinIcon className="h-3 w-3" />
                                <span>{application.location.city}</span>
                            </div>
                        )}
                        <span className="text-[var(--te-border-strong)]">/</span>
                        <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>
                                {new Date(application.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                        {application.referred && (
                            <>
                                <span className="text-[var(--te-border-strong)]">/</span>
                                <span className="te-badge-green">Referred</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Chevron */}
                <ChevronRightIcon className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--te-text-dim)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--te-text)]" />
            </div>
        </div>
    )
}

export default ApplicationItem;