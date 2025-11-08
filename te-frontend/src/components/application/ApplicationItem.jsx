import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { jobStatuses } from './ApplicationInfo'



const classNames = (...classes) => {
    return classes.filter(Boolean).join(' ')
}

const ApplicationItem = ({ allowSelection, addSelectedItem, application, setApplicationId }) => {

    return (
        <div 
            className="p-4 cursor-pointer group"
            onClick={() => { !allowSelection && setApplicationId(application.id) }}
        >
            <div className="flex gap-3">
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
                        className="h-4 w-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                    />
                )}
                
                <div className="h-10 w-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                        alt={application.company.name}
                        className="h-6 w-6 object-contain"
                        src={application.company.image}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-bold text-gray-900 truncate">
                            {application.company.name}
                        </h3>
                        <div
                            className={classNames(
                                jobStatuses[application.status],
                                'inline-flex rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap flex-shrink-0'
                            )}
                        >
                            {application.status}
                        </div>
                    </div>
                    
                    <p className="text-xs font-medium text-gray-600 mb-2 truncate">
                        {application.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                        {application.location && (
                            <div className="flex items-center gap-1">
                                <MapPinIcon className="h-3 w-3" />
                                <span>{application.location.city}</span>
                            </div>
                        )}
                        <span className="text-gray-300">•</span>
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
                                <span className="text-gray-300">•</span>
                                <span className="text-purple-600 font-semibold">Referred</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Chevron */}
                <ChevronRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
            </div>
        </div>
    )
}

export default ApplicationItem;