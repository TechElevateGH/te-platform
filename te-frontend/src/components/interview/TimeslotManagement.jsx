import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    CalendarIcon,
    ClockIcon,
    PlusIcon,
    TrashIcon,
    CheckIcon,
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    UserGroupIcon,
    MinusIcon
} from '@heroicons/react/20/solid';
import {
    ComputerDesktopIcon,
    ChatBubbleLeftRightIcon,
    CodeBracketIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
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
    const [hours, minutes] = utcTime.split(':').map(Number);
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
        color: 'emerald',
        description: 'Soft skills & situational'
    },
    coding: {
        label: 'Coding',
        duration: 55,
        icon: CodeBracketIcon,
        color: 'blue',
        description: 'Technical coding problems'
    },
    system_design: {
        label: 'System Design',
        duration: 55,
        icon: ComputerDesktopIcon,
        color: 'indigo',
        description: 'Architecture & scalability'
    },
    one_on_one: {
        label: '1-on-1 Mentorship',
        duration: 20,
        icon: ChatBubbleLeftRightIcon,
        color: 'purple',
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

    // Calendar view state
    const [currentMonth, setCurrentMonth] = useState(() => {
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

    const calendarDays = getDaysInMonth(currentMonth);
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
        <div className="space-y-6 max-w-7xl">
            {/* Simple Stats & Action */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-white">{totalSlots}</span> total
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{availableSlots}</span> available
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-amber-600 dark:text-amber-400">{bookedSlots}</span> booked
                    </span>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
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
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all border border-gray-200 dark:border-gray-700">
                                    {/* Modal Header */}
                                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
                                        <div className="flex items-center justify-between">
                                            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                                                Add Interview Availability
                                            </Dialog.Title>
                                            <button
                                                onClick={() => {
                                                    setShowCreateForm(false);
                                                    setFormData({ date: '', start_time: '', mode: 'single' });
                                                    setSlotCount(1);
                                                }}
                                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="px-6 py-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                                        {/* Interview Type */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                                Available Interview Types <span className="text-gray-500 font-normal">(Select one or more)</span>
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
                                                            className={`p-4 rounded-xl border-2 transition-all ${isSelected
                                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected
                                                                    ? 'bg-blue-500 border-blue-500'
                                                                    : 'border-gray-300 dark:border-gray-600'
                                                                    }`}>
                                                                    {isSelected && (
                                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                                <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                                                                <div className="flex-1 text-left">
                                                                    <div className={`text-sm font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                                        {type.label}
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{type.duration} min</p>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                Selected types: {selectedInterviewTypes.map(t => INTERVIEW_TYPES[t].label).join(', ')}
                                            </p>
                                        </div>

                                        {/* Slot Count */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Number of Members
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setSlotCount(Math.max(1, slotCount - 1))}
                                                    className="p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
                                                    disabled={slotCount <= 1}
                                                >
                                                    <MinusIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                </button>
                                                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 min-w-[80px] justify-center">
                                                    <UserGroupIcon className="h-4 w-4 text-blue-500" />
                                                    <span className="text-lg font-bold text-gray-900 dark:text-white">{slotCount}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSlotCount(slotCount + 1)}
                                                    className="p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    <PlusIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                </button>
                                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                                    {slotCount === 1 ? 'can book' : 'can book'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Schedule Type Toggle */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Schedule Type
                                            </label>
                                            <div className="inline-flex rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, mode: 'single' }))}
                                                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${formData.mode === 'single'
                                                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                                        }`}
                                                >
                                                    Single Slot
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, mode: 'bulk' }))}
                                                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${formData.mode === 'bulk'
                                                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                                        }`}
                                                >
                                                    Recurring
                                                </button>
                                            </div>
                                        </div>                                        {formData.mode === 'single' ? (
                                            <form onSubmit={handleCreateSingle} className="space-y-5">
                                                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                                    <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                                        Enter times in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). They will be converted to UTC for storage.
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                            Date
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={formData.date}
                                                            min={new Date().toISOString().split('T')[0]}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                            Start Time (Your Local Time)
                                                        </label>
                                                        <input
                                                            type="time"
                                                            value={formData.start_time}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                {formData.start_time && selectedInterviewTypes.length > 0 && (
                                                    <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                                        <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                        <div className="text-sm">
                                                            <p className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                                                                {formData.start_time} - {calculateEndTime(formData.start_time)}
                                                                <span className="font-normal text-blue-700 dark:text-blue-300"> (up to {Math.max(...selectedInterviewTypes.map(t => INTERVIEW_TYPES[t]?.duration || 20))} min)</span>
                                                            </p>
                                                            {slotCount > 1 && (
                                                                <p className="text-blue-700 dark:text-blue-300">
                                                                    {slotCount} members can book this time slot
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <button
                                                    type="submit"
                                                    disabled={creating}
                                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {creating ? 'Creating...' : slotCount > 1 ? `Create ${slotCount} Slots` : 'Create Slot'}
                                                </button>
                                            </form>
                                        ) : (
                                            <form onSubmit={handleCreateBulk} className="space-y-5">
                                                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                                    <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                                        Enter times in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). They will be converted to UTC for storage.
                                                    </p>
                                                </div>
                                                {/* Date Range */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                        Date Range
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <input
                                                                type="date"
                                                                value={bulkData.start_date}
                                                                min={new Date().toISOString().split('T')[0]}
                                                                onChange={(e) => setBulkData(prev => ({ ...prev, start_date: e.target.value }))}
                                                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                                required
                                                            />
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Start date</p>
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="date"
                                                                value={bulkData.end_date}
                                                                min={bulkData.start_date || new Date().toISOString().split('T')[0]}
                                                                onChange={(e) => setBulkData(prev => ({ ...prev, end_date: e.target.value }))}
                                                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                                required
                                                            />
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">End date</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Days */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                        Select Days
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {DAYS_OF_WEEK.map((day) => (
                                                            <button
                                                                key={day}
                                                                type="button"
                                                                onClick={() => toggleDay(day)}
                                                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${bulkData.days.includes(day)
                                                                    ? 'bg-blue-600 text-white shadow-md'
                                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                                    }`}
                                                            >
                                                                {day.slice(0, 3)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Times */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                        Select Times
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {QUICK_TIMES.map((time) => (
                                                            <button
                                                                key={time}
                                                                type="button"
                                                                onClick={() => toggleTime(time)}
                                                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${bulkData.times.includes(time)
                                                                    ? 'bg-blue-600 text-white shadow-md'
                                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                                    }`}
                                                            >
                                                                {time}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {bulkData.times.length > 0 && bulkData.days.length > 0 && bulkData.start_date && bulkData.end_date && (
                                                    <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                                        <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                                                            Will create: {bulkData.times.length} time(s) × {bulkData.days.length} day(s) × {slotCount} slot(s)
                                                        </p>
                                                    </div>
                                                )}

                                                <button
                                                    type="submit"
                                                    disabled={creating || bulkData.times.length === 0}
                                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                            <CalendarIcon className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No Upcoming Slots</h4>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Create your first availability slot</p>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
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
                                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
                                >
                                    <div className={`px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-900/50'}`}>
                                        <CalendarIcon className={`h-4 w-4 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                                        <span className={`text-sm font-semibold ${isToday ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            {isToday && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Today</span>}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
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
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                                                        : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <ClockIcon className={`h-3.5 w-3.5 ${slot.is_available ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}`} />
                                                        <span className={`font-semibold ${slot.is_available ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                                            {formatTimeForDisplay(slot.start_time, slot.date)}
                                                        </span>
                                                        {!slot.is_available && (
                                                            <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded text-amber-700 dark:text-amber-300">Booked</span>
                                                        )}
                                                        {slot.is_available && (
                                                            <button
                                                                onClick={() => handleDelete(slot.id)}
                                                                disabled={deletingId === slot.id}
                                                                className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            >
                                                                <TrashIcon className="h-3.5 w-3.5" />
                                                            </button>
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
                                                                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                                                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
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
        </div>
    );
};

export default TimeslotManagement;
