import { ExclamationTriangleIcon, PencilIcon } from 'icons'

const MissingData = ({ info }) => {

    return (
        <div className="te-card mt-24 mx-6 border-l-4 border-l-amber-500 p-4">
            <div className="flex flex-col items-center">
                <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <p className="text-md text-[var(--te-text)]">
                        {info}
                    </p>
                </div>
            </div>
        </div>
    )
}


export default MissingData;