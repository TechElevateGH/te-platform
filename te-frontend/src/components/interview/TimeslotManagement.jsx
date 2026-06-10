import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    CalendarIcon,
    ClockIcon,
    PlusIcon,
    TrashIcon,
    CheckIcon,
    XMarkIcon,
    UserGroupIcon,
    MinusIcon,
    PencilIcon
} from 'icons';
import {
    ComputerDesktopIcon,
    ChatBubbleLeftRightIcon,
    CodeBracketIcon,
    InformationCircleIcon
} from 'icons';
import axiosInstance from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Loading } from '../_custom/Loading';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Timezone conversion utilities
const convertLocalTimeToUTC = (date, time) => {
    // Create a date object in local timezone
    const localDateTime = new Date(`${date}T${time}:00`);
    // Extract UTC hours and minutes
    const utcHours = String(localDateTime.getUTCHours()).padStart(2, '0');
    const utcMinutes = String(localDateTime.getUTCMinutes()).padStart(2, '0');
    return `${utcHours}:${utcMinutes}`;
};

const convertUTCTimeToLocal = (date, utcTime) => {
    // Parse UTC time and create a UTC date
    const utcDate = new Date(`${date}T${utcTime}:00Z`);
    // Extract local hours and minutes
    const localHours = String(utcDate.getHours()).padStart(2, '0');
    const localMinutes = String(utcDate.getMinutes()).padStart(2, '0');
    return `${localHours}:${localMinutes}`;
};

const formatTimeForDisplay = (utcTime, date) => {
    if (!utcTime || !date) return '';
    const [hours, minutes] = utcTime.split(':').map(Number);
    const utcDate = new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`);
    return utcDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
    });
};

// Interview types with their durations (matching backend)
const INTERVIEW_TYPES = {
    behavioral: {
        label: 'Behavioral',
        duration: 20,
        icon: ChatBubbleLeftRightIcon,
        color: 'mono',
        description: 'Soft skills & situational'
    },
    coding: {
        label: 'Coding',
        duration: 55,
        icon: CodeBracketIcon,
        color: 'mono',
        description: 'Technical coding problems'
    },
    system_design: {
        label: 'System Design',
        duration: 55,
        icon: ComputerDesktopIcon,
        color: 'mono',
        description: 'Architecture & scalability'
    },
    one_on_one: {
        label: '1-on-1 Mentorship',
        duration: 20,
        icon: ChatBubbleLeftRightIcon,
        color: 'mono',
        description: 'General mentorship & questions'
    }
};

// Common time slots for quick selection
const QUICK_TIMES = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '18:00', '19:00', '20:00'];

const TimeslotManagement = () => {
    const { accessToken } = useAuth();
    const toast = useToast();
    const [timeslots, setTimeslots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [editingSlot, setEditingSlot] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [editFormData, setEditFormData] = useState({
        date: '',
        start_time: '',
        interview_types: []
    });

    // Calendar view state
    const [currentMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    // Create form state
    const [selectedInterviewTypes, setSelectedInterviewTypes] = useState(['behavioral', 'coding', 'system_design']); // Multiple types
    const [slotCount, setSlotCount] = useState(1);
    const [formData, setFormData] = useState({
        date: '',
        start_time: '',
        mode: 'single' // 'single' or 'bulk'
    });
    const [bulkData, setBulkData] = useState({
        start_date: '',
        end_date: '',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        times: []
    });

    // Calculate end time based on longest interview type selected
    const calculateEndTime = (startTime) => {
        if (!startTime || selectedInterviewTypes.length === 0) return '';
        const [hours, minutes] = startTime.split(':').map(Number);
        // Find the longest duration among selected types
        const maxDuration = Math.max(...selectedInterviewTypes.map(type => INTERVIEW_TYPES[type]?.duration || 20));
        const endDate = new Date(2000, 0, 1, hours, minutes + maxDuration);
        return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    };

    const toggleInterviewType = (type) => {
        setSelectedInterviewTypes(prev => {
            if (prev.includes(type)) {
                // Don't allow deselecting all types
                if (prev.length === 1) return prev;
                return prev.filter(t => t !== type);
            } else {
                return [...prev, type];
            }
        });
    };

    const fetchTimeslots = useCallback(async () => {
        if (!accessToken) return;

        setLoading(true);
        try {
            const response = await axiosInstance.get('/interviews/timeslots/all', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setTimeslots(response.data.timeslots || []);
        } catch (error) {
            console.error('Error fetching timeslots:', error);
            setTimeslots([]);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchTimeslots();
    }, [fetchTimeslots]);

    const handleCreateSingle = async (e) => {
        e.preventDefault();
        setCreating(true);

        const endTime = calculateEndTime(formData.start_time);

        // Convert local time to UTC for storage
        const utcStartTime = convertLocalTimeToUTC(formData.date, formData.start_time);
        const utcEndTime = convertLocalTimeToUTC(formData.date, endTime);

        try {
            // Create multiple slots based on count
            const slotsToCreate = [];
            for (let i = 0; i < slotCount; i++) {
                slotsToCreate.push({
                    date: formData.date,
                    start_time: utcStartTime,
                    end_time: utcEndTime,
                    interview_types: selectedInterviewTypes
                });
            }

            if (slotsToCreate.length === 1) {
                await axiosInstance.post('/interviews/timeslots', slotsToCreate[0], {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
            } else {
                await axiosInstance.post('/interviews/timeslots/bulk', { timeslots: slotsToCreate }, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
            }

            setFormData({ date: '', start_time: '', mode: 'single' });
            setSlotCount(1);
            setSelectedInterviewTypes(['behavioral', 'coding', 'system_design']);
            setShowCreateForm(false);
            fetchTimeslots();
        } catch (error) {
            console.error('Error creating timeslot:', error);
            toast.error(error.response?.data?.detail || 'Failed to create timeslot');
        } finally {
            setCreating(false);
        }
    };

    const handleCreateBulk = async (e) => {
        e.preventDefault();
        if (bulkData.days.length === 0 || bulkData.times.length === 0) {
            toast.warning('Please select at least one day and one time slot');
            return;
        }

        setCreating(true);
        try {
            const slotsToCreate = [];
            const startDate = new Date(bulkData.start_date);
            const endDate = new Date(bulkData.end_date);
            const dayMap = {
                'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
                'Thursday': 4, 'Friday': 5, 'Saturday': 6
            };

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dayName = Object.keys(dayMap).find(key => dayMap[key] === d.getDay());
                if (bulkData.days.includes(dayName)) {
                    const dateStr = d.toISOString().split('T')[0];
                    for (const time of bulkData.times) {
                        const endTime = calculateEndTime(time);
                        // Convert local times to UTC for storage
                        const utcStartTime = convertLocalTimeToUTC(dateStr, time);
                        const utcEndTime = convertLocalTimeToUTC(dateStr, endTime);
                        for (let i = 0; i < slotCount; i++) {
                            slotsToCreate.push({
                                date: dateStr,
                                start_time: utcStartTime,
                                end_time: utcEndTime,
                                interview_types: selectedInterviewTypes
                            });
                        }
                    }
                }
            }

            await axiosInstance.post('/interviews/timeslots/bulk', { timeslots: slotsToCreate }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            setBulkData({ start_date: '', end_date: '', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], times: [] });
            setSlotCount(1);
            setSelectedInterviewTypes(['behavioral', 'coding', 'system_design']);
            setShowCreateForm(false);
            fetchTimeslots();
        } catch (error) {
            console.error('Error creating bulk timeslots:', error);
            toast.error(error.response?.data?.detail || 'Failed to create timeslots');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (timeslotId) => {
        if (!window.confirm('Delete this timeslot?')) return;

        setDeletingId(timeslotId);
        try {
            await axiosInstance.delete(`/interviews/timeslots/${timeslotId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            fetchTimeslots();
        } catch (error) {
            console.error('Error deleting timeslot:', error);
            toast.error(error.response?.data?.detail || 'Failed to delete timeslot');
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (slot) => {
        setEditingSlot(slot);
        setEditFormData({
            date: slot.date,
            start_time: convertUTCTimeToLocal(slot.date, slot.start_time),
            interview_types: slot.interview_types || []
        });
    };

    const handleUpdateSlot = async () => {
        if (!editingSlot) return;

        setUpdating(true);
        try {
            const utcStartTime = convertLocalTimeToUTC(editFormData.date, editFormData.start_time);
            const endTime = calculateEndTimeForEdit(editFormData.start_time, editFormData.interview_types);
            const utcEndTime = convertLocalTimeToUTC(editFormData.date, endTime);

            await axiosInstance.patch(`/interviews/timeslots/${editingSlot.id}`, {
                date: editFormData.date,
                start_time: utcStartTime,
                end_time: utcEndTime,
                interview_types: editFormData.interview_types
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            toast.success('Timeslot updated successfully');
            setEditingSlot(null);
            fetchTimeslots();
        } catch (error) {
            console.error('Error updating timeslot:', error);
            toast.error(error.response?.data?.detail || 'Failed to update timeslot');
        } finally {
            setUpdating(false);
        }
    };

    const calculateEndTimeForEdit = (startTime, types) => {
        if (!startTime || !types || types.length === 0) return '';
        const [hours, minutes] = startTime.split(':').map(Number);
        const maxDuration = Math.max(...types.map(type => INTERVIEW_TYPES[type]?.duration || 20));
        const endDate = new Date(2000, 0, 1, hours, minutes + maxDuration);
        return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    };

    const toggleEditInterviewType = (type) => {
        setEditFormData(prev => ({
            ...prev,
            interview_types: prev.interview_types.includes(type)
                ? prev.interview_types.filter(t => t !== type)
                : [...prev.interview_types, type]
        }));
    };

    const toggleDay = (day) => {
        setBulkData(prev => ({
            ...prev,
            days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
        }));
    };

    const toggleTime = (time) => {
        setBulkData(prev => ({
            ...prev,
            times: prev.times.includes(time)
                ? prev.times.filter(t => t !== time)
                : [...prev.times, time].sort()
        }));
    };

    // Group timeslots by date
    const groupedTimeslots = useMemo(() => {
        return timeslots.reduce((acc, slot) => {
            if (!acc[slot.date]) acc[slot.date] = [];
            acc[slot.date].push(slot);
            return acc;
        }, {});
    }, [timeslots]);

    // Calendar helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        const startPadding = firstDay.getDay();
        for (let i = 0; i < startPadding; i++) {
            days.push(null);
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(new Date(year, month, d));
        }

        return days;
    };

    getDaysInMonth(currentMonth); // Calendar days computed but view simplified
    const sortedDates = Object.keys(groupedTimeslots).sort();
    const upcomingDates = sortedDates.filter(d => new Date(d) >= new Date(new Date().toDateString()));

    // Stats
    const totalSlots = timeslots.length;
    const availableSlots = timeslots.filter(s => s.is_available).length;
    const bookedSlots = totalSlots - availableSlots;

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loading />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Simple Stats & Action */}
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[var(--te-border)] bg-[var(--te-border)] sm:grid-cols-[1fr_1fr_1fr_auto]">
                <div className="contents">
                    <div className="bg-[var(--te-surface)] p-4"><div className="font-mono text-2xl font-bold text-[var(--te-text)]">{totalSlots}</div><div className="mt-1 text-xs text-[var(--te-text-dim)]">total slots</div></div>
                    
                    <div className="bg-[var(--te-surface)] p-4"><div className="font-mono text-2xl font-bold text-te-green">{availableSlots}</div><div className="mt-1 text-xs text-[var(--te-text-dim)]">available</div></div>
                    
                    <div className="bg-[var(--te-surface)] p-4"><div className="font-mono text-2xl font-bold text-te-gold">{bookedSlots}</div><div className="mt-1 text-xs text-[var(--te-text-dim)]">booked</div></div>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="te-btn-primary m-4 self-center"
                >
                    <PlusIcon className="h-4 w-4" />
                    Add Availability
                </button>
            </div>

            {/* Add Slot Modal */}
            <Transition appear show={showCreateForm} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => {
                    setShowCreateForm(false);
                    setFormData({ date: '', start_time: '', mode: 'single' });
                    setSlotCount(1);
                }}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50 " />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="te-card w-full max-w-2xl transform overflow-hidden transition-all">
                                    {/* Modal Header */}
                                    <div className="px-6 py-4 border-b border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                        <div className="flex items-center justify-between">
                                            <Dialog.Title className="font-mono text-lg font-bold text-[var(--te-text)]">
                                                Add Interview Availability
                                            </Dialog.Title>
                                            <button
                                                onClick={() => {
                                                    setShowCreateForm(false);
                                                    setFormData({ date: '', start_time: '', mode: 'single' });
                                                    setSlotCount(1);
                                                }}
                                                className="te-icon-btn"
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="px-6 py-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto te-scroll">
                                        {/* Interview Type */}
                                        <div>
                                            <label className="mb-3 block font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--te-text-dim)]">
                                                Available Interview Types <span className="text-[var(--te-text-dim)] font-normal">(Select one or more)</span>
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {Object.entries(INTERVIEW_TYPES).map(([key, type]) => {
                                                    const Icon = type.icon;
                                                    const isSelected = selectedInterviewTypes.includes(key);
                                                    return (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => toggleInterviewType(key)}
                                                            className={`p-4 rounded-lg border transition-all ${isSelected
                                                                ? 'border-[var(--te-green)] bg-[var(--te-green-soft)]'
                                                                : 'border-[var(--te-border)] bg-[var(--te-surface)] hover:bg-[var(--te-hover)]'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${isSelected
                                                                    ? 'bg-[var(--te-primary)] border-[var(--te-primary)]'
                                                                    : 'border-[var(--te-border)]'
                                                                    }`}>
                                                                    {isSelected && (
                                                                        <svg className="w-3 h-3 text-[var(--te-on-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                                <Icon className={`h-5 w-5 ${isSelected ? 'text-te-green' : 'text-[var(--te-text-dim)]'}`} />
                                                                <div className="flex-1 text-left">
                                                                    <div className={`text-sm font-semibold ${isSelected ? 'text-te-green' : 'text-[var(--te-text)]'}`}>
                                                                        {type.label}
                                                                    </div>
                                                                    <p className="text-xs text-[var(--te-text-dim)]">{type.duration} min</p>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-xs text-[var(--te-text-dim)] mt-2">
                                                Selected types: {selectedInterviewTypes.map(t => INTERVIEW_TYPES[t].label).join(', ')}
                                            </p>
                                        </div>

                                        {/* Slot Count */}
                                        <div className="flex items-center justify-between p-4 bg-[var(--te-surface-alt)] rounded-lg">
                                            <label className="text-sm font-semibold text-[var(--te-text)]">
                                                Number of Members
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setSlotCount(Math.max(1, slotCount - 1))}
                                                    className="p-2 rounded-lg border border-[var(--te-border)] hover:bg-[var(--te-hover)] transition-colors disabled:opacity-40"
                                                    disabled={slotCount <= 1}
                                                >
                                                    <MinusIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                                </button>
                                                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--te-surface)] rounded-lg border border-[var(--te-border)] min-w-[80px] justify-center">
                                                    <UserGroupIcon className="h-4 w-4 text-[var(--te-text)]" />
                                                    <span className="font-mono text-lg font-bold text-[var(--te-text)]">{slotCount}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSlotCount(slotCount + 1)}
                                                    className="p-2 rounded-lg border border-[var(--te-border)] hover:bg-[var(--te-hover)] transition-colors"
                                                >
                                                    <PlusIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                                </button>
                                                <span className="text-sm text-[var(--te-text-dim)] ml-2">
                                                    {slotCount === 1 ? 'can book' : 'can book'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Schedule Type Toggle */}
                                        <div className="flex items-center justify-between p-4 bg-[var(--te-surface-alt)] rounded-lg">
                                            <label className="text-sm font-semibold text-[var(--te-text)]">
                                                Schedule Type
                                            </label>
                                            <div className="inline-flex rounded-lg bg-[var(--te-hover)] p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, mode: 'single' }))}
                                                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${formData.mode === 'single'
                                                        ? 'bg-[var(--te-green-soft)] text-te-green shadow-sm'
                                                        : 'text-[var(--te-text-dim)] hover:bg-[var(--te-hover)] hover:text-[var(--te-text)]'
                                                        }`}
                                                >
                                                    Single Slot
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, mode: 'bulk' }))}
                                                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${formData.mode === 'bulk'
                                                        ? 'bg-[var(--te-green-soft)] text-te-green shadow-sm'
                                                        : 'text-[var(--te-text-dim)] hover:bg-[var(--te-hover)] hover:text-[var(--te-text)]'
                                                        }`}
                                                >
                                                    Recurring
                                                </button>
                                            </div>
                                        </div>                                        {formData.mode === 'single' ? (
                                            <form onSubmit={handleCreateSingle} className="space-y-5">
                                                <div className="flex items-start gap-2 p-3 bg-[var(--te-hover)] rounded-lg border border-[var(--te-border)]">
                                                    <InformationCircleIcon className="h-5 w-5 text-[var(--te-text)] flex-shrink-0 mt-0.5" />
                                                    <p className="text-sm text-[var(--te-text)]">
                                                        Enter times in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). They will be converted to UTC for storage.
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--te-text-dim)]">
                                                            Date
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={formData.date}
                                                            min={new Date().toISOString().split('T')[0]}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                                            className="te-input"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--te-text-dim)]">
                                                            Start Time (Your Local Time)
                                                        </label>
                                                        <input
                                                            type="time"
                                                            value={formData.start_time}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                                                            className="te-input"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                {formData.start_time && selectedInterviewTypes.length > 0 && (
                                                    <div className="flex items-start gap-3 p-4 bg-[var(--te-surface-alt)] rounded-lg border border-[var(--te-border)]">
                                                        <InformationCircleIcon className="h-5 w-5 text-[var(--te-text)] flex-shrink-0 mt-0.5" />
                                                        <div className="text-sm">
                                                            <p className="font-semibold text-[var(--te-text)] mb-1">
                                                                {formData.start_time} - {calculateEndTime(formData.start_time)}
                                                                <span className="font-normal text-[var(--te-text)]"> (up to {Math.max(...selectedInterviewTypes.map(t => INTERVIEW_TYPES[t]?.duration || 20))} min)</span>
                                                            </p>
                                                            {slotCount > 1 && (
                                                                <p className="text-[var(--te-text)]">
                                                                    {slotCount} members can book this time slot
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <button
                                                    type="submit"
                                                    disabled={creating}
                                                    className="te-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {creating ? 'Creating...' : slotCount > 1 ? `Create ${slotCount} Slots` : 'Create Slot'}
                                                </button>
                                            </form>
                                        ) : (
                                            <form onSubmit={handleCreateBulk} className="space-y-5">
                                                <div className="flex items-start gap-2 p-3 bg-[var(--te-hover)] rounded-lg border border-[var(--te-border)]">
                                                    <InformationCircleIcon className="h-5 w-5 text-[var(--te-text)] flex-shrink-0 mt-0.5" />
                                                    <p className="text-sm text-[var(--te-text)]">
                                                        Enter times in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). They will be converted to UTC for storage.
                                                    </p>
                                                </div>
                                                {/* Date Range */}
                                                <div>
                                                    <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--te-text-dim)]">
                                                        Date Range
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <input
                                                                type="date"
                                                                value={bulkData.start_date}
                                                                min={new Date().toISOString().split('T')[0]}
                                                                onChange={(e) => setBulkData(prev => ({ ...prev, start_date: e.target.value }))}
                                                                className="te-input"
                                                                required
                                                            />
                                                            <p className="text-xs text-[var(--te-text-dim)] mt-1.5">Start date</p>
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="date"
                                                                value={bulkData.end_date}
                                                                min={bulkData.start_date || new Date().toISOString().split('T')[0]}
                                                                onChange={(e) => setBulkData(prev => ({ ...prev, end_date: e.target.value }))}
                                                                className="te-input"
                                                                required
                                                            />
                                                            <p className="text-xs text-[var(--te-text-dim)] mt-1.5">End date</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Days */}
                                                <div>
                                                    <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--te-text-dim)]">
                                                        Select Days
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {DAYS_OF_WEEK.map((day) => (
                                                            <button
                                                                key={day}
                                                                type="button"
                                                                onClick={() => toggleDay(day)}
                                                                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${bulkData.days.includes(day)
                                                                    ? 'border-[var(--te-primary)] bg-[var(--te-primary)] text-[var(--te-on-primary)]'
                                                                    : 'border-[var(--te-border)] bg-[var(--te-surface)] text-[var(--te-text-dim)] hover:bg-[var(--te-hover)]'
                                                                    }`}
                                                            >
                                                                {day.slice(0, 3)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Times */}
                                                <div>
                                                    <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--te-text-dim)]">
                                                        Select Times
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {QUICK_TIMES.map((time) => (
                                                            <button
                                                                key={time}
                                                                type="button"
                                                                onClick={() => toggleTime(time)}
                                                                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${bulkData.times.includes(time)
                                                                    ? 'border-[var(--te-primary)] bg-[var(--te-primary)] text-[var(--te-on-primary)]'
                                                                    : 'border-[var(--te-border)] bg-[var(--te-surface)] text-[var(--te-text-dim)] hover:bg-[var(--te-hover)]'
                                                                    }`}
                                                            >
                                                                {time}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {bulkData.times.length > 0 && bulkData.days.length > 0 && bulkData.start_date && bulkData.end_date && (
                                                    <div className="flex items-start gap-3 p-4 bg-[var(--te-surface-alt)] rounded-lg border border-[var(--te-border)]">
                                                        <InformationCircleIcon className="h-5 w-5 text-[var(--te-text)] flex-shrink-0 mt-0.5" />
                                                        <p className="text-sm font-semibold text-[var(--te-text)]">
                                                            Will create: {bulkData.times.length} time(s) × {bulkData.days.length} day(s) × {slotCount} slot(s)
                                                        </p>
                                                    </div>
                                                )}

                                                <button
                                                    type="submit"
                                                    disabled={creating || bulkData.times.length === 0}
                                                    className="te-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {creating ? 'Creating...' : 'Create Slots'}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Upcoming Slots List */}
            <div className="max-w-4xl">
                <div className="space-y-3">
                    {upcomingDates.length === 0 ? (
                        <div className="te-card flex flex-col items-center py-14">
                            <CalendarIcon className="mb-3 h-10 w-10 text-[var(--te-text-dim)]" />
                            <h4 className="text-base font-semibold text-[var(--te-text)] mb-1">No Upcoming Slots</h4>
                            <p className="text-[var(--te-text-dim)] text-sm mb-4">Create your first availability slot</p>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="te-btn-secondary te-btn-sm"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Add Availability
                            </button>
                        </div>
                    ) : (
                        upcomingDates.slice(0, 10).map((date) => {
                            const dateObj = new Date(date + 'T00:00:00');
                            const isToday = date === new Date().toISOString().split('T')[0];
                            const slots = groupedTimeslots[date].sort((a, b) => a.start_time.localeCompare(b.start_time));

                            return (
                                <div
                                    key={date}
                                    className="te-card overflow-hidden"
                                >
                                    <div className={`px-4 py-2.5 border-b border-[var(--te-border)] flex items-center gap-2 ${isToday ? 'bg-[var(--te-gold-soft)]' : 'bg-[var(--te-surface-alt)]'}`}>
                                        <CalendarIcon className={`h-4 w-4 ${isToday ? 'text-te-gold' : 'text-[var(--te-text-dim)]'}`} />
                                        <span className={`text-sm font-semibold ${isToday ? 'text-[var(--te-text)]' : 'text-[var(--te-text)]'}`}>
                                            {dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            {isToday && <span className="ml-2 text-xs bg-[var(--te-primary)] text-[var(--te-on-primary)] px-2 py-0.5 rounded-md">Today</span>}
                                        </span>
                                        <span className="text-xs text-[var(--te-text-dim)] ml-auto">
                                            {slots.length} slot{slots.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="p-3 flex flex-wrap gap-2">
                                        {slots.map((slot) => {
                                            const slotInterviewTypes = slot.interview_types || [];
                                            return (
                                                <div
                                                    key={slot.id}
                                                    className={`inline-flex flex-col gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${slot.is_available
                                                        ? 'bg-[var(--te-surface)] border border-[var(--te-green)] hover:bg-[var(--te-hover)]'
                                                        : 'bg-[var(--te-red-soft)] border border-[var(--te-red)]'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <ClockIcon className={`h-3.5 w-3.5 ${slot.is_available ? 'text-te-green' : 'text-te-red'}`} />
                                                        <span className={`font-mono font-semibold ${slot.is_available ? 'text-[var(--te-text)]' : 'text-te-red'}`}>
                                                            {formatTimeForDisplay(slot.start_time, slot.date)}
                                                        </span>
                                                        {!slot.is_available && (
                                                            <span className="rounded bg-[var(--te-red-soft)] px-1.5 py-0.5 text-xs font-semibold text-te-red">Booked</span>
                                                        )}
                                                        {slot.is_available && (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleEdit(slot)}
                                                                    className="p-1 text-[var(--te-text-dim)] hover:text-[var(--te-text)] transition-colors rounded hover:bg-[var(--te-hover)]"
                                                                    title="Edit timeslot"
                                                                >
                                                                    <PencilIcon className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(slot.id)}
                                                                    disabled={deletingId === slot.id}
                                                                    className="p-1 text-[var(--te-text-dim)] hover:text-te-red disabled:opacity-50 transition-colors rounded hover:bg-[var(--te-red-soft)]"
                                                                    title="Delete timeslot"
                                                                >
                                                                    <TrashIcon className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {slotInterviewTypes.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {slotInterviewTypes.map(type => {
                                                                const typeInfo = INTERVIEW_TYPES[type];
                                                                if (!typeInfo) return null;
                                                                return (
                                                                    <span
                                                                        key={type}
                                                                        className={`text-xs px-1.5 py-0.5 rounded ${slot.is_available
                                                                            ? 'bg-[var(--te-green-soft)] text-te-green'
                                                                            : 'bg-[var(--te-red-soft)] text-te-red'
                                                                            }`}
                                                                    >
                                                                        {typeInfo.label}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Edit Timeslot Modal */}
            <Transition appear show={editingSlot !== null} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setEditingSlot(null)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50 " />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="te-card w-full max-w-lg transform overflow-hidden transition-all">
                                    <div className="p-6">
                                        <Dialog.Title className="text-xl font-bold text-[var(--te-text)] mb-4">
                                            Edit Timeslot
                                        </Dialog.Title>

                                        <div className="space-y-4">
                                            {/* Date */}
                                            <div>
                                                <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--te-text-dim)]">
                                                    Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={editFormData.date}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                                                    className="te-input"
                                                />
                                            </div>

                                            {/* Time */}
                                            <div>
                                                <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--te-text-dim)]">
                                                    Start Time
                                                </label>
                                                <input
                                                    type="time"
                                                    value={editFormData.start_time}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, start_time: e.target.value }))}
                                                    className="te-input"
                                                />
                                            </div>

                                            {/* Interview Types */}
                                            <div>
                                                <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--te-text-dim)]">
                                                    Interview Types
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {Object.entries(INTERVIEW_TYPES).map(([key, type]) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => toggleEditInterviewType(key)}
                                                            className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                                                                editFormData.interview_types.includes(key)
                                                                    ? 'border-[var(--te-green)] bg-[var(--te-green-soft)]'
                                                                    : 'border-[var(--te-border)] bg-[var(--te-surface)] hover:bg-[var(--te-hover)]'
                                                            }`}
                                                        >
                                                            {editFormData.interview_types.includes(key) && (
                                                                <CheckIcon className="h-4 w-4 text-te-green" />
                                                            )}
                                                            <span className={`text-sm font-medium ${
                                                                editFormData.interview_types.includes(key)
                                                                    ? 'text-te-green'
                                                                    : 'text-[var(--te-text)]'
                                                            }`}>
                                                                {type.label}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-[var(--te-surface-alt)] px-6 py-4 flex gap-3 justify-end">
                                        <button
                                            onClick={() => setEditingSlot(null)}
                                            disabled={updating}
                                            className="te-btn-secondary disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleUpdateSlot}
                                            disabled={updating || !editFormData.date || !editFormData.start_time || editFormData.interview_types.length === 0}
                                            className="te-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {updating ? 'Updating...' : 'Update Timeslot'}
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default TimeslotManagement;
