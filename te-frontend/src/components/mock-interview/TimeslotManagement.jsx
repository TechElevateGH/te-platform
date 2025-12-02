import { useState, useEffect, useCallback } from 'react';
import {
    CalendarIcon,
    ClockIcon,
    PlusIcon,
    TrashIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon
} from '@heroicons/react/20/solid';
import axiosInstance from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { Loading } from '../_custom/Loading';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TimeslotManagement = () => {
    const { accessToken } = useAuth();
    const [timeslots, setTimeslots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ date: '', start_time: '', end_time: '' });

    // Create form state
    const [createMode, setCreateMode] = useState('single'); // 'single' or 'bulk'
    const [singleForm, setSingleForm] = useState({ date: '', start_time: '', end_time: '' });
    const [bulkForm, setBulkForm] = useState({
        start_date: '',
        end_date: '',
        days_of_week: [],
        times: [{ start: '', end: '' }]
    });

    const fetchTimeslots = useCallback(async () => {
        if (!accessToken) return;

        setLoading(true);
        try {
            const response = await axiosInstance.get('/mock-interviews/timeslots/all', {
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

        try {
            await axiosInstance.post('/mock-interviews/timeslots', singleForm, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setSingleForm({ date: '', start_time: '', end_time: '' });
            setShowCreateForm(false);
            fetchTimeslots();
        } catch (error) {
            console.error('Error creating timeslot:', error);
            alert(error.response?.data?.detail || 'Failed to create timeslot');
        } finally {
            setCreating(false);
        }
    };

    const handleCreateBulk = async (e) => {
        e.preventDefault();
        if (bulkForm.days_of_week.length === 0) {
            alert('Please select at least one day of the week');
            return;
        }
        if (bulkForm.times.filter(t => t.start && t.end).length === 0) {
            alert('Please add at least one time slot');
            return;
        }

        setCreating(true);
        try {
            // Transform times array into TimeslotCreate array
            const timeslots = [];
            const startDate = new Date(bulkForm.start_date);
            const endDate = new Date(bulkForm.end_date);
            const dayMap = {
                'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
                'Thursday': 4, 'Friday': 5, 'Saturday': 6
            };

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dayName = Object.keys(dayMap).find(key => dayMap[key] === d.getDay());
                if (bulkForm.days_of_week.includes(dayName)) {
                    const dateStr = d.toISOString().split('T')[0];
                    for (const time of bulkForm.times.filter(t => t.start && t.end)) {
                        timeslots.push({
                            date: dateStr,
                            start_time: time.start,
                            end_time: time.end
                        });
                    }
                }
            }

            await axiosInstance.post('/mock-interviews/timeslots/bulk', { timeslots }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setBulkForm({ start_date: '', end_date: '', days_of_week: [], times: [{ start: '', end: '' }] });
            setShowCreateForm(false);
            fetchTimeslots();
        } catch (error) {
            console.error('Error creating bulk timeslots:', error);
            alert(error.response?.data?.detail || 'Failed to create timeslots');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (timeslotId) => {
        if (!window.confirm('Are you sure you want to delete this timeslot?')) return;

        setDeletingId(timeslotId);
        try {
            await axiosInstance.delete(`/mock-interviews/timeslots/${timeslotId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            fetchTimeslots();
        } catch (error) {
            console.error('Error deleting timeslot:', error);
            alert(error.response?.data?.detail || 'Failed to delete timeslot');
        } finally {
            setDeletingId(null);
        }
    };

    const startEditing = (timeslot) => {
        setEditingId(timeslot.id);
        setEditForm({ date: timeslot.date, start_time: timeslot.start_time, end_time: timeslot.end_time });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({ date: '', start_time: '', end_time: '' });
    };

    const handleUpdate = async (timeslotId) => {
        try {
            await axiosInstance.patch(`/mock-interviews/timeslots/${timeslotId}`, editForm, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            cancelEditing();
            fetchTimeslots();
        } catch (error) {
            console.error('Error updating timeslot:', error);
            alert(error.response?.data?.detail || 'Failed to update timeslot');
        }
    };

    const toggleDayOfWeek = (day) => {
        setBulkForm(prev => ({
            ...prev,
            days_of_week: prev.days_of_week.includes(day)
                ? prev.days_of_week.filter(d => d !== day)
                : [...prev.days_of_week, day]
        }));
    };

    const addTimeSlot = () => {
        setBulkForm(prev => ({ ...prev, times: [...prev.times, { start: '', end: '' }] }));
    };

    const removeTimeSlot = (index) => {
        setBulkForm(prev => ({
            ...prev,
            times: prev.times.filter((_, i) => i !== index)
        }));
    };

    const updateTimeSlot = (index, field, value) => {
        setBulkForm(prev => ({
            ...prev,
            times: prev.times.map((t, i) => i === index ? { ...t, [field]: value } : t)
        }));
    };

    // Group timeslots by date
    const groupedTimeslots = timeslots.reduce((acc, slot) => {
        if (!acc[slot.date]) acc[slot.date] = [];
        acc[slot.date].push(slot);
        return acc;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(groupedTimeslots).sort();

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loading />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Manage Timeslots</h3>
                {!showCreateForm && (
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add Timeslots
                    </button>
                )}
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">Add New Timeslots</h4>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setCreateMode('single')}
                            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${createMode === 'single'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            Single Timeslot
                        </button>
                        <button
                            onClick={() => setCreateMode('bulk')}
                            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${createMode === 'bulk'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            Bulk Create
                        </button>
                    </div>

                    {createMode === 'single' ? (
                        <form onSubmit={handleCreateSingle} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={singleForm.date}
                                        onChange={(e) => setSingleForm(prev => ({ ...prev, date: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
                                    <input
                                        type="time"
                                        value={singleForm.start_time}
                                        onChange={(e) => setSingleForm(prev => ({ ...prev, start_time: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Time</label>
                                    <input
                                        type="time"
                                        value={singleForm.end_time}
                                        onChange={(e) => setSingleForm(prev => ({ ...prev, end_time: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {creating ? 'Creating...' : 'Create Timeslot'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleCreateBulk} className="space-y-4">
                            {/* Date Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={bulkForm.start_date}
                                        onChange={(e) => setBulkForm(prev => ({ ...prev, start_date: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                                    <input
                                        type="date"
                                        value={bulkForm.end_date}
                                        onChange={(e) => setBulkForm(prev => ({ ...prev, end_date: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Days of Week */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Days of Week</label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS_OF_WEEK.map((day) => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDayOfWeek(day)}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${bulkForm.days_of_week.includes(day)
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Times */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Time Slots</label>
                                <div className="space-y-2">
                                    {bulkForm.times.map((time, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                type="time"
                                                value={time.start}
                                                onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                                                placeholder="Start"
                                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                            />
                                            <span className="text-gray-400">to</span>
                                            <input
                                                type="time"
                                                value={time.end}
                                                onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                                                placeholder="End"
                                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                            />
                                            {bulkForm.times.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeTimeSlot(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addTimeSlot}
                                        className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                                    >
                                        + Add another time slot
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {creating ? 'Creating...' : 'Create Timeslots'}
                            </button>
                        </form>
                    )}
                </div>
            )}

            {/* Timeslots List */}
            {sortedDates.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Timeslots</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Add some timeslots for members to book mock interviews.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedDates.map((date) => {
                        const dateObj = new Date(date + 'T00:00:00');
                        const formattedDate = dateObj.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        });

                        return (
                            <div
                                key={date}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                            >
                                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-purple-500" />
                                        {formattedDate}
                                    </h4>
                                </div>
                                <div className="p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {groupedTimeslots[date]
                                            .sort((a, b) => a.start_time.localeCompare(b.start_time))
                                            .map((slot) => (
                                                <div
                                                    key={slot.id}
                                                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${slot.is_available
                                                            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700'
                                                            : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                                        }`}
                                                >
                                                    {editingId === slot.id ? (
                                                        <>
                                                            <input
                                                                type="time"
                                                                value={editForm.start_time}
                                                                onChange={(e) => setEditForm(prev => ({ ...prev, start_time: e.target.value }))}
                                                                className="w-24 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                                                            />
                                                            <span className="text-gray-400 text-sm">-</span>
                                                            <input
                                                                type="time"
                                                                value={editForm.end_time}
                                                                onChange={(e) => setEditForm(prev => ({ ...prev, end_time: e.target.value }))}
                                                                className="w-24 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                                                            />
                                                            <button
                                                                onClick={() => handleUpdate(slot.id)}
                                                                className="p-1 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded"
                                                            >
                                                                <CheckIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={cancelEditing}
                                                                className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                                                            >
                                                                <XMarkIcon className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ClockIcon className={`h-4 w-4 ${slot.is_available ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                                                            <span className={`text-sm font-semibold ${slot.is_available ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                                                {slot.start_time} - {slot.end_time}
                                                            </span>
                                                            {!slot.is_available && (
                                                                <span className="text-xs text-gray-400">(booked)</span>
                                                            )}
                                                            <button
                                                                onClick={() => startEditing(slot)}
                                                                className="p-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                                                            >
                                                                <PencilIcon className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(slot.id)}
                                                                disabled={deletingId === slot.id}
                                                                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                                                            >
                                                                <TrashIcon className="h-3.5 w-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TimeslotManagement;
