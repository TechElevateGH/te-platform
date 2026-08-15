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
} from 'icons'
import axiosInstance from "../../axiosConfig";
import { useAuth } from "../../context/AuthContext";
import { Loading } from "../_custom/Loading";

const INTERVIEW_TYPES = [
    { id: 'system_design', name: 'System Design', duration: 55, description: 'Architecture & system design', color: 'mono' },
    { id: 'behavioral', name: 'Behavioral', duration: 20, description: 'STAR method questions', color: 'mono' },
    { id: 'coding', name: 'Coding', duration: 55, description: 'Live coding & algorithms', color: 'mono' },
    { id: 'one_on_one', name: '1-on-1 Mentorship', duration: 20, description: 'General questions & mentorship', color: 'mono' },
];

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
            <div className="py-8">
                <div className="te-panel p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--te-green)] bg-[var(--te-green-soft)]">
                        <CheckCircleIcon className="h-6 w-6 text-te-green" />
                    </div>
                    <p className="te-eyebrow">Submitted</p>
                    <h3 className="mt-2 font-mono text-lg font-semibold text-[var(--te-text)]">Meeting scheduled</h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--te-text-dim)]">
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
                <div>
                    <span className="te-eyebrow">Prerequisite</span>
                    <h3 className="mt-2 font-mono text-base font-semibold text-[var(--te-text)]">
                        Before you schedule
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--te-text-dim)]">
                        Please watch this interview preparation video first. It covers essential tips that will help you make the most of your mock interview session.
                    </p>
                </div>

                {/* Video Embed */}
                <div className="aspect-video w-full overflow-hidden rounded-lg border border-[var(--te-border)] bg-black">
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
                        className="te-link inline-flex items-center gap-1.5 text-sm"
                    >
                        <PlayCircleIcon className="h-4 w-4" />
                        Open in YouTube
                    </a>
                    <button
                        type="button"
                        onClick={() => setHasWatchedVideo(true)}
                        className="te-btn-primary te-btn-sm"
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
                    <label className="mb-3 block font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--te-text-dim)]">
                        Interview Type
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {availableInterviewTypes.map((type) => {
                            const isSelected = formData.interview_type === type.id;
                            return (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => handleInputChange('interview_type', type.id)}
                                    className={`relative rounded-lg border p-3 text-left transition-colors ${isSelected
                                        ? 'border-[var(--te-primary)] bg-[var(--te-primary)] text-[var(--te-on-primary)]'
                                        : 'border-[var(--te-border)] bg-[var(--te-surface)] text-[var(--te-text)] hover:bg-[var(--te-hover)]'
                                        }`}
                                >
                                    {isSelected && (
                                        <CheckCircleIcon className="absolute top-2 right-2 h-4 w-4" />
                                    )}
                                    <p className="font-mono text-sm font-medium">
                                        {type.name}
                                    </p>
                                    <p className={`mt-1 font-mono text-xs ${isSelected ? 'opacity-80' : 'text-[var(--te-text-dim)]'}`}>
                                        {type.duration} min
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Duration Info */}
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-3">
                        <InformationCircleIcon className="h-4 w-4 text-[var(--te-text-dim)] flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-[var(--te-text-dim)] text-left">
                            {selectedType?.name} sessions are {selectedType?.duration} minutes long.
                            {selectedType?.id === 'behavioral' && ' Focus on past experiences using the STAR method.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Timeslot Selection */}
            <div>
                <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--te-text-dim)]">
                    Select Timeslot <span className="text-[var(--te-text-dim)]">*</span>
                </label>
                <p className="text-xs text-[var(--te-text-dim)] mb-3 text-left">
                    Times shown in your timezone: {userTimezone}
                </p>

                {loadingTimeslots ? (
                    <div className="flex justify-center py-8">
                        <Loading />
                    </div>
                ) : availableTimeslots.length === 0 ? (
                    <div className="te-panel flex flex-col items-center py-8">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface)]">
                            <CalendarIcon className="h-6 w-6 text-[var(--te-text-dim)]" />
                        </div>
                        <p className="text-sm font-medium text-[var(--te-text-dim)]">No timeslots available</p>
                        <p className="text-xs text-[var(--te-text-dim)] mt-1">Check back later for new slots</p>
                    </div>
                ) : (
                    <div className="max-h-56 space-y-4 overflow-y-auto te-scroll">
                        {Object.entries(groupedTimeslots).sort(([a], [b]) => a.localeCompare(b)).map(([date, slots]) => (
                            <div key={date}>
                                <p className="mb-2 font-mono text-xs font-medium text-[var(--te-text-dim)]">
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
                                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 font-mono text-sm transition-colors ${isSelected
                                                    ? 'border-[var(--te-primary)] bg-[var(--te-primary)] text-[var(--te-on-primary)]'
                                                    : 'border-[var(--te-border)] bg-[var(--te-surface)] text-[var(--te-text)] hover:bg-[var(--te-hover)]'
                                                    }`}
                                            >
                                                <ClockIcon className={`h-3.5 w-3.5 ${isSelected ? 'text-[var(--te-on-primary)]' : 'text-te-green'}`} />
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
                    <label className="mb-1 block font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--te-text-dim)]">
                        Pending Interviews <span className="text-[var(--te-text-dim)]">*</span>
                    </label>
                    <p className="text-xs text-[var(--te-text-dim)] text-left mb-3">
                        List companies you have upcoming interviews with
                    </p>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={companyInput}
                            onChange={(e) => setCompanyInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g., Google, Microsoft"
                            className="te-input flex-1"
                        />
                        <button
                            type="button"
                            onClick={addCompany}
                            className="te-btn-secondary"
                        >
                            Add
                        </button>
                    </div>

                    {formData.pending_companies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {formData.pending_companies.map((company, index) => (
                                <span
                                    key={index}
                                    className="te-chip"
                                >
                                    {company}
                                    <button
                                        type="button"
                                        onClick={() => removeCompany(company)}
                                        className="text-[var(--te-text-dim)] hover:text-[var(--te-text-dim)]"
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
                        <label className="mb-1 block font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--te-text-dim)]">
                            Earliest Interview Date <span className="text-[var(--te-text-dim)]">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.earliest_interview_date}
                            onChange={(e) => handleInputChange('earliest_interview_date', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="te-input"
                            required
                        />
                        <p className="text-xs text-[var(--te-text-dim)] text-left mt-1">
                            When is your earliest real interview? This helps us prioritize.
                        </p>
                    </div>
                )}

                {/* Additional Notes / Discussion Summary */}
                <div>
                    <label className="mb-1 block font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--te-text-dim)]">
                        {sessionType === 'one_on_one' ? 'Discussion Summary' : 'Additional Notes'}
                        {sessionType === 'one_on_one' ? <span className="text-[var(--te-text-dim)]"> *</span> : <span className="text-[var(--te-text-dim)] font-normal"> (Optional)</span>}
                    </label>
                    <textarea
                        value={formData.member_notes}
                        onChange={(e) => handleInputChange('member_notes', e.target.value)}
                        placeholder={sessionType === 'one_on_one'
                            ? "What would you like to discuss? (career advice, resume review, etc.)"
                            : "Any specific areas you want to focus on..."}
                        rows={3}
                        className="te-textarea"
                        required={sessionType === 'one_on_one'}
                    />
                </div>
            </div>

            {/* Error Message */}
            {submitError && (
                <div className="flex items-start gap-2 rounded-lg border border-[var(--te-red)] bg-[var(--te-red-soft)] p-3">
                    <ExclamationTriangleIcon className="h-4 w-4 text-te-red flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-te-red text-left">{submitError}</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="te-btn-ghost"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting || !formData.timeslot_id || (sessionType === 'one_on_one' && !formData.member_notes.trim()) || (sessionType !== 'one_on_one' && (formData.pending_companies.length === 0 || !formData.earliest_interview_date))}
                    className="te-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSubmitting ? 'Scheduling...' : sessionType === 'one_on_one' ? 'Schedule Session' : 'Schedule Meeting'}
                </button>
            </div>
        </form>
    );
};

export default InterviewCreate;
