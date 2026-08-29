import { useState } from 'react';
import { PlusIcon, TrashIcon } from 'icons';
import axiosInstance from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import SlideOverForm from '../_custom/SlideOver/SlideOverCreate';
import { jobLevels } from '../../data/jobData';
import { jobStatuses } from './ApplicationInfo';

const emptyApplication = () => ({
    company: '',
    title: '',
    role: '',
    status: 'Submitted',
    notes: '',
    recruiter_name: '',
    recruiter_email: '',
    referred: false,
    location: { country: '', city: '' }
});

const ApplicationBulkCreate = ({ setAddApplications }) => {
    const { userId, accessToken } = useAuth();
    const { setFetchApplications } = useData();
    const [applications, setApplications] = useState([emptyApplication(), emptyApplication(), emptyApplication()]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const updateApplication = (index, field, value) => {
        setApplications(current => current.map((application, currentIndex) =>
            currentIndex === index ? { ...application, [field]: value } : application
        ));
    };

    const submitApplications = async () => {
        if (applications.some(application => !application.company.trim() || !application.title.trim() || !application.role)) {
            setSubmitError('Each application needs a company, position, and level.');
            return false;
        }

        setSubmitError('');
        setIsSubmitting(true);
        try {
            await axiosInstance.post(`/users/${userId}/applications/bulk`, { applications }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setFetchApplications(true);
            setAddApplications(false);
            return true;
        } catch (error) {
            setSubmitError(error.response?.data?.detail || 'Failed to add applications. Please try again.');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SlideOverForm
            title="Bulk add applications"
            setHandler={setAddApplications}
            requestHandler={submitApplications}
            submitButtonText={`Add ${applications.length} applications`}
            shouldReload={false}
            isSubmitting={isSubmitting}
            isSubmitDisabled={applications.length === 0}
        >
            <div className="space-y-4 px-6 py-6">
                <p className="text-sm text-[var(--te-text-dim)]">Add several roles at once. You can fill in recruiter details and notes later.</p>
                {submitError && <div className="border border-[var(--te-red)] bg-[var(--te-red-soft)] px-4 py-3 text-sm font-medium text-te-red">{submitError}</div>}
                {applications.map((application, index) => (
                    <div key={index} className="te-panel space-y-3 p-4">
                        <div className="flex items-center justify-between">
                            <h3 className="te-eyebrow">Application {index + 1}</h3>
                            {applications.length > 1 && <button type="button" onClick={() => setApplications(current => current.filter((_, currentIndex) => currentIndex !== index))} className="te-icon-btn" aria-label={`Remove application ${index + 1}`}><TrashIcon className="h-4 w-4" /></button>}
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <input value={application.company} onChange={(event) => updateApplication(index, 'company', event.target.value)} placeholder="Company *" className="te-input" />
                            <input value={application.title} onChange={(event) => updateApplication(index, 'title', event.target.value)} placeholder="Position *" className="te-input" />
                            <select value={application.role} onChange={(event) => updateApplication(index, 'role', event.target.value)} className="te-select"><option value="">Level *</option>{jobLevels.map(level => <option key={level} value={level}>{level}</option>)}</select>
                            <select value={application.status} onChange={(event) => updateApplication(index, 'status', event.target.value)} className="te-select">{Object.keys(jobStatuses).map(status => <option key={status} value={status}>{status}</option>)}</select>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={() => setApplications(current => [...current, emptyApplication()])} className="te-btn-secondary te-btn-sm"><PlusIcon className="h-4 w-4" /> Add another row</button>
            </div>
        </SlideOverForm>
    );
};

export default ApplicationBulkCreate;
