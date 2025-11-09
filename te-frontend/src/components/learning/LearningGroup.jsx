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
    console.log(userRole)

    return (
        <div className="px-6 mt-3">
            <>
                <div className="flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <h3 className='text-left font-bold text-slate-600'>{subcategory}</h3>
                            <table className="w-5/6">
                                <tbody className=" bg-white">
                                    {
                                        Object.entries(playlistToLessons).map(([playlist, lessons]) => (
                                            <Fragment key={playlist}>
                                                <tr className="border-t border-gray-200">
                                                    <th
                                                        colSpan={5}
                                                        scope="colgroup"
                                                        className="bg-gray-50 py-2 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3"
                                                    >
                                                        <div className="border-b border-white /5">
                                                            <h5 className="text-left text-sm  text-sky-500">{playlist}</h5>
                                                        </div>
                                                    </th>
                                                </tr>
                                                {lessons.map((lesson) => (
                                                    <tr key={subcategory + "." + lesson.topic} className="text-left left-3">
                                                        <td className=" break-words w-1/2 py-4 pl-3 pr-3 text-sm  text-gray-900">
                                                            {lesson.topic}
                                                        </td>
                                                        <td className=" w-1/4 py-4 text-sm text-blue-500">
                                                            <a className='visited:text-purple-600 decoration-dotted underline hover:text-green-600' href={lesson.link}>
                                                                {lesson.format === "video" ? "Video" : lesson.format === "document" ? "Document" : "Web page"}
                                                            </a>
                                                        </td>
                                                        {subcategory === "Workshops" && <td className=" w-1/4 py-4 text-sm text-gray-500">{lesson.year}</td>}
                                                        {userRole === "Admin" &&
                                                            <td className=" break-words w-1/2 py-4 pl-3 pr-3 text-sm  text-gray-900">
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