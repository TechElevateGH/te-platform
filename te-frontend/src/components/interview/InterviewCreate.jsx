import { useState, useEffect } from "react";
import {
    CalendarIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XMarkIcon,
    PlayCircleIcon,
    ArrowRightIcon
} from '@heroicons/react/20/solid'
import axiosInstance from "../../axiosConfig";
import { useAuth } from "../../context/AuthContext";
import { Loading } from "../_custom/Loading";

const INTERVIEW_TYPES = [
    { id: 'system_design', name: 'System Design', duration: 55, description: 'Architecture & system design', color: 'blue' },
    { id: 'behavioral', name: 'Behavioral', duration: 20, description: 'STAR method questions', color: 'green' },
    { id: 'coding', name: 'Coding', duration: 55, description: 'Live coding & algorithms', color: 'orange' },
    { id: 'one_on_one', name: '1-on-1 Mentorship', duration: 20, description: 'General questions & mentorship', color: 'purple' },
];

const TYPE_COLORS = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
};

const PREP_VIDEO_URL = "https://www.youtube.com/watch?v=FYUXYcJfOMM";

const InterviewCreate = ({ onSuccess, onCancel, sessionType = 'interview' }) => {
    const { accessToken } = useAuth();
    const [hasWatchedVideo, setHasWatchedVideo] = useState(false);

    // Filter interview types based on session type
    const availableInterviewTypes = sessionType === 'one_on_one'
        ? INTERVIEW_TYPES.filter(t => t.id === 'one_on_one')
        : INTERVIEW_TYPES.filter(t => t.id !== 'one_on_one');

    const [formData, setFormData] = useState({
        interview_type: sessionType === 'one_on_one' ? 'one_on_one' : 'coding',
        timeslot_id: '',
        pending_companies: [],
        earliest_interview_date: '',
        member_notes: ''
    });

    const [availableTimeslots, setAvailableTimeslots] = useState([]);
    const [loadingTimeslots, setLoadingTimeslots] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [companyInput, setCompanyInput] = useState("");

    // Get selected interview type details
    const selectedType = availableInterviewTypes.find(t => t.id === formData.interview_type);

    // Fetch available timeslots
    useEffect(() => {
        const fetchTimeslots = async () => {
            if (!accessToken) return;

            setLoadingTimeslots(true);
            try {
                const response = await axiosInstance.get('/interviews/timeslots', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setAvailableTimeslots(response.data.timeslots || []);
            } catch (error) {
                console.error('Error fetching timeslots:', error);
                setAvailableTimeslots([]);
            } finally {
                setLoadingTimeslots(false);
            }
        };

        fetchTimeslots();
    }, [accessToken]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addCompany = () => {
        const trimmed = companyInput.trim();
        if (trimmed && !formData.pending_companies.includes(trimmed)) {
            setFormData(prev => ({
                ...prev,
                pending_companies: [...prev.pending_companies, trimmed]
            }));
            setCompanyInput("");
        }
    };

    const removeCompany = (company) => {
        setFormData(prev => ({
            ...prev,
            pending_companies: prev.pending_companies.filter(c => c !== company)
        }));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCompany();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError("");
        setSubmitSuccess(false);

        if (!formData.timeslot_id) {
            setSubmitError("Please select a timeslot");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await axiosInstance.post('/interviews', formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            });

            if (response.data) {
                setSubmitSuccess(true);
                // Reset form
                setFormData({
                    interview_type: 'coding',
                    timeslot_id: '',
                    pending_companies: [],
                    earliest_interview_date: '',
                    member_notes: ''
                });
                // Remove the booked timeslot from available list
                setAvailableTimeslots(prev => prev.filter(t => t.id !== response.data.interview?.timeslot_id));

                // Call onSuccess after a brief delay to show success message
                setTimeout(() => {
                    if (onSuccess) onSuccess(response.data.interview);
                }, 2000);
            }
        } catch (error) {
            console.error("Error creating interview request:", error);
            setSubmitError(error.response?.data?.detail || "Failed to submit interview request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter timeslots based on selected interview type
    const filteredTimeslots = availableTimeslots.filter(slot => {
        // If slot has interview_types array, check if selected type is included
        if (slot.interview_types && slot.interview_types.length > 0) {
            return slot.interview_types.includes(formData.interview_type);
        }
        // If no interview_types specified (old slots), show all slots
        return true;
    });

    // Group timeslots by date
    const groupedTimeslots = filteredTimeslots.reduce((acc, slot) => {
        if (!acc[slot.date]) {
            acc[slot.date] = [];
        }
        acc[slot.date].push(slot);
        return acc;
    }, {});

    // Get user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Helper function to format date with timezone awareness
    const formatDate = (dateStr) => {
        // Parse the date string and display in user's local timezone
        const date = new Date(dateStr + 'T12:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
    };

    // Helper function to format time with timezone
    const formatTime = (timeStr, dateStr) => {
        if (!timeStr) return '';
        // Parse time string as UTC and convert to local
        const [hours, minutes] = timeStr.split(':').map(Number);
        // Use the actual date from the slot for proper timezone conversion
        const date = dateStr || new Date().toISOString().split('T')[0];
        const utcDate = new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`);

        return utcDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Helper function to calculate end time based on interview type
    const calculateEndTime = (startTimeStr, dateStr, interviewType) => {
        if (!startTimeStr) return '';
        const [hours, minutes] = startTimeStr.split(':').map(Number);
        const date = dateStr || new Date().toISOString().split('T')[0];
        const utcDate = new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`);

        // Get duration for interview type
        const duration = selectedType?.duration || 55;
        const endDate = new Date(utcDate.getTime() + duration * 60000);

        return endDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        });
    };

    if (submitSuccess) {
        return (
            <div className="py-6">
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                        <CheckCircleIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Meeting Scheduled!</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                        Your {sessionType === 'one_on_one' ? '1-on-1 session' : 'mock interview'} request has been submitted. You&apos;ll receive a confirmation email once a volunteer is assigned.
                    </p>
                </div>
            </div>
        );
    }

    // Video prerequisite step - only for mock interviews, not 1-on-1 sessions
    if (!hasWatchedVideo && sessionType !== 'one_on_one') {
        return (
            <div className="space-y-6">
                <div className="text-left">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                        Before You Schedule
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Please watch this interview preparation video first. It covers essential tips that will help you make the most of your mock interview session.
                    </p>
                </div>

                {/* Video Embed */}
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-900">
                    <iframe
                        src="https://www.youtube.com/embed/FYUXYcJfOMM?t=1836"
                        title="Interview Preparation Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                    <a
                        href={PREP_VIDEO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        <PlayCircleIcon className="h-4 w-4" />
                        Open in YouTube
                    </a>
                    <button
                        type="button"
                        onClick={() => setHasWatchedVideo(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Continue to Schedule
                        <ArrowRightIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Interview Type Selection - Only show for mock interviews */}
            {sessionType !== 'one_on_one' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-3">
                        Interview Type
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {availableInterviewTypes.map((type) => {
                            const isSelected = formData.interview_type === type.id;
                            const colorClasses = TYPE_COLORS[type.color];
                            return (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => handleInputChange('interview_type', type.id)}
                                    className={`relative p-3 rounded-lg border text-left transition-all ${isSelected
                                        ? colorClasses
                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                        }`}
                                >
                                    {isSelected && (
                                        <CheckCircleIcon className="absolute top-2 right-2 h-4 w-4" />
                                    )}
                                    <p className={`text-sm font-medium ${isSelected ? '' : 'text-gray-900 dark:text-white'}`}>
                                        {type.name}
                                    </p>
                                    <p className={`text-xs mt-0.5 ${isSelected ? 'opacity-80' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {type.duration} min
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Duration Info */}
                    <div className="flex items-start gap-2 mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <InformationCircleIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-600 dark:text-gray-400 text-left">
                            {selectedType?.name} sessions are {selectedType?.duration} minutes long.
                            {selectedType?.id === 'behavioral' && ' Focus on past experiences using the STAR method.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Timeslot Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-2">
                    Select Timeslot <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-left">
                    Times shown in your timezone: {userTimezone}
                </p>

                {loadingTimeslots ? (
                    <div className="flex justify-center py-8">
                        <Loading />
                    </div>
                ) : availableTimeslots.length === 0 ? (
                    <div className="flex flex-col items-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                            <CalendarIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No timeslots available</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Check back later for new slots</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-56 overflow-y-auto">
                        {Object.entries(groupedTimeslots).sort(([a], [b]) => a.localeCompare(b)).map(([date, slots]) => (
                            <div key={date}>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 text-left">
                                    {formatDate(date)}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {slots.sort((a, b) => a.start_time.localeCompare(b.start_time)).map((slot) => {
                                        const isSelected = formData.timeslot_id === slot.id;
                                        return (
                                            <button
                                                key={slot.id}
                                                type="button"
                                                onClick={() => handleInputChange('timeslot_id', slot.id)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${isSelected
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                                                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
                                                    }`}
                                            >
                                                <ClockIcon className={`h-3.5 w-3.5 ${isSelected ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400'}`} />
                                                <span className="font-medium">{formatTime(slot.start_time, slot.date)} - {calculateEndTime(slot.start_time, slot.date, formData.interview_type)}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pending Companies - Only for mock interviews */}
            {sessionType !== 'one_on_one' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1">
                        Pending Interviews <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-left mb-3">
                        List companies you have upcoming interviews with
                    </p>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={companyInput}
                            onChange={(e) => setCompanyInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g., Google, Microsoft"
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={addCompany}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                        >
                            Add
                        </button>
                    </div>

                    {formData.pending_companies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {formData.pending_companies.map((company, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-md"
                                >
                                    {company}
                                    <button
                                        type="button"
                                        onClick={() => removeCompany(company)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        <XMarkIcon className="h-3.5 w-3.5" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Additional Details */}
            <div className="space-y-4">
                {/* Earliest Interview Date - Only for mock interviews */}
                {sessionType !== 'one_on_one' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1">
                            Earliest Interview Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.earliest_interview_date}
                            onChange={(e) => handleInputChange('earliest_interview_date', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left"
                            required
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-left mt-1">
                            When is your earliest real interview? This helps us prioritize.
                        </p>
                    </div>
                )}

                {/* Additional Notes / Discussion Summary */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1">
                        {sessionType === 'one_on_one' ? 'Discussion Summary' : 'Additional Notes'}
                        {sessionType === 'one_on_one' ? <span className="text-red-500"> *</span> : <span className="text-gray-400 font-normal"> (Optional)</span>}
                    </label>
                    <textarea
                        value={formData.member_notes}
                        onChange={(e) => handleInputChange('member_notes', e.target.value)}
                        placeholder={sessionType === 'one_on_one'
                            ? "What would you like to discuss? (career advice, resume review, etc.)"
                            : "Any specific areas you want to focus on..."}
                        rows={3}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        required={sessionType === 'one_on_one'}
                    />
                </div>
            </div>

            {/* Error Message */}
            {submitError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300 text-left">{submitError}</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting || !formData.timeslot_id || (sessionType === 'one_on_one' && !formData.member_notes.trim()) || (sessionType !== 'one_on_one' && (formData.pending_companies.length === 0 || !formData.earliest_interview_date))}
                    className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Scheduling...' : sessionType === 'one_on_one' ? 'Schedule Session' : 'Schedule Meeting'}
                </button>
            </div>
        </form>
    );
};

export default InterviewCreate;
