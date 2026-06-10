import { useState, Fragment } from 'react';
import { useAuth } from '../../context/AuthContext';


const LearningGroup = ({ subcategory, rawLessons }) => {
    const { userRole } = useAuth();

    let [lessons] = useState(rawLessons);

    const mapPlaylistsToLessons = (lessons) => {
        return lessons.reduce((acc, lesson) => {
            if (!acc[lesson.playlist]) {
                acc[lesson.playlist] = [];
            }
            acc[lesson.playlist].push(lesson);
            return acc;
        }, {});
    };
    let playlistToLessons = mapPlaylistsToLessons(lessons)

    return (
        <div className="px-6 mt-3">
            <>
                <div className="flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <h3 className='text-left font-bold text-[var(--te-text)] '>{subcategory}</h3>
                            <table className="w-5/6 te-card overflow-hidden">
                                <tbody>
                                    {
                                        Object.entries(playlistToLessons).map(([playlist, lessons]) => (
                                            <Fragment key={playlist}>
                                                <tr className="border-t border-[var(--te-border)] border-[var(--te-border)]">
                                                    <th
                                                        colSpan={5}
                                                        scope="colgroup"
                                                        className="bg-[var(--te-surface-alt)] py-2 pl-4 pr-3 text-left text-sm font-semibold text-[var(--te-text)]  sm:pl-3"
                                                    >
                                                        <div className="border-b border-[var(--te-border)]">
                                                            <h5 className="text-left text-sm  text-[var(--te-text)] text-[var(--te-text)]">{playlist}</h5>
                                                        </div>
                                                    </th>
                                                </tr>
                                                {lessons.map((lesson) => (
                                                    <tr key={subcategory + "." + lesson.topic} className="text-left left-3">
                                                        <td className=" break-words w-1/2 py-4 pl-3 pr-3 text-sm text-[var(--te-text)] ">
                                                            {lesson.topic}
                                                        </td>
                                                        <td className=" w-1/4 py-4 text-sm text-[var(--te-text)] text-[var(--te-text)]">
                                                            <a className='te-link decoration-dotted underline' href={lesson.link}>
                                                                {lesson.format === "video" ? "Video" : lesson.format === "document" ? "Document" : "Web page"}
                                                            </a>
                                                        </td>
                                                        {subcategory === "Workshops" && <td className=" w-1/4 py-4 text-sm text-[var(--te-text-dim)] text-[var(--te-text-dim)]">{lesson.year}</td>}
                                                        {userRole === "Admin" &&
                                                            <td className=" break-words w-1/2 py-4 pl-3 pr-3 text-sm text-[var(--te-text)] ">
                                                                Hi
                                                            </td>}
                                                    </tr>
                                                ))}
                                            </Fragment>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </>
        </div>
    )
}


export default LearningGroup;