import { createContext, useContext, useState } from 'react';
import { companies as companiesList } from '../data/jobData';

const DataContext = createContext();

export const useData = () => {
    return useContext(DataContext);
}


export const DataProvider = ({ children }) => {

    const [userInfo, setUserInfo] = useState({});

    const [workshopLessons, setWorkshopLessons] = useState([]);
    const [otherLessons, setOtherLessons] = useState([]);
    const [fetchLessons, setFetchLessons] = useState(true);

    const [applications, setApplications] = useState([]);
    const [fetchApplications, setFetchApplications] = useState(true);

    const [referrals, setReferrals] = useState([]);
    const [fetchReferralCompanies, setFetchReferralCompanies] = useState(true);
    const [referralCompanies, setReferralCompanies] = useState([]);

    const [fetchFiles, setFetchFiles] = useState(true);
    const [resumes, setResumes] = useState([]);
    const [otherFiles, setOtherFiles] = useState([]);


    const [fetchCompanies, setFetchCompanies] = useState(true);
    const [companies, setCompanies] = useState(companiesList);




    return (
        <DataContext.Provider value={{
            userInfo,
            setUserInfo,
            fetchLessons,
            setFetchLessons,
            workshopLessons,
            setWorkshopLessons,
            otherLessons,
            setOtherLessons,
            fetchCompanies,
            setFetchCompanies,
            companies,
            setCompanies,
            fetchApplications,
            setFetchApplications,
            applications,
            setApplications,
            referrals,
            setReferrals,
            fetchReferralCompanies,
            setFetchReferralCompanies,
            referralCompanies,
            setReferralCompanies,
            fetchFiles,
            setFetchFiles,
            resumes,
            setResumes,
            otherFiles,
            setOtherFiles,
        }}>
            {children}
        </DataContext.Provider>
    );
}
