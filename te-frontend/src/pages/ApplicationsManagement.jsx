import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axiosInstance from '../axiosConfig';
import { Loading } from '../components/_custom/Loading';
import DeleteConfirmationModal from '../components/_custom/DeleteConfirmationModal';
import ApplicationInfo from '../components/application/ApplicationInfo';
import { getCompanyLogoUrl, handleCompanyLogoError } from '../utils';
import {
    MagnifyingGlassIcon,
    UserGroupIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    XMarkIcon,
    AdjustmentsHorizontalIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    TrashIcon,
    ChevronUpDownIcon,
    ChevronUpIcon,
    ChevronDownIcon
} from 'icons';

const ApplicationManagement = () => {
    const { accessToken, userRole } = useAuth();
    const toast = useToast();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [memberFilter, setMemberFilter] = useState('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [referredFilter, setReferredFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortField, setSortField] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [selectedApplicationId, setSelectedApplicationId] = useState(null);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);

    // Selection and bulk delete state
    const [selectedItems, setSelectedItems] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const isAdmin = parseInt(userRole) === 5;

    // Column visibility state - default visible columns
    const [visibleColumns, setVisibleColumns] = useState({
        member: true,
        company: true,
        position: true,
        level: true,
        location: false,
        referred: false,
        recruiter: false,
        status: true,
        applied: true
    });

    // Available columns configuration
    const columnConfig = [
        { key: 'member', label: 'Member', default: true },
        { key: 'company', label: 'Company', default: true },
        { key: 'position', label: 'Position', default: true },
        { key: 'level', label: 'Level', default: true },
        { key: 'location', label: 'Location', default: false },
        { key: 'referred', label: 'Referred', default: false },
        { key: 'recruiter', label: 'Recruiter', default: false },
        { key: 'status', label: 'Status', default: true },
        { key: 'applied', label: 'Applied', default: true }
    ];

    const toggleColumn = (columnKey) => {
        setVisibleColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    const resetColumns = () => {
        const defaultColumns = {};
        columnConfig.forEach(col => {
            defaultColumns[col.key] = col.default;
        });
        setVisibleColumns(defaultColumns);
    };

    const showAllColumns = () => {
        const allColumns = {};
        columnConfig.forEach(col => {
            allColumns[col.key] = true;
        });
        setVisibleColumns(allColumns);
    };

    const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length;

    // Fetch all member applications
    const fetchAllApplications = useCallback(async () => {
        setLoading(true);
        try {
            console.log('Fetching applications from /applications...');
            const response = await axiosInstance.get('/applications', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            console.log('Applications response:', response.data);
            setApplications(response.data.applications || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
            console.error('Error details:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    const archiveApplications = useCallback(async (applicationIds) => {
        try {
            await axiosInstance.put('/applications/archive', applicationIds, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            fetchAllApplications();
        } catch (error) {
            console.error('Error archiving applications:', error);
            toast.error('Failed to archive applications. Please try again.');
        }
    }, [accessToken, fetchAllApplications, toast]);

    const deleteApplications = useCallback(async (applicationIds) => {
        try {
            await axiosInstance.put('/applications/delete', applicationIds, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            fetchAllApplications();
        } catch (error) {
            console.error('Error deleting applications:', error);
            toast.error('Failed to delete applications. Please try again.');
        }
    }, [accessToken, fetchAllApplications, toast]);

    const handleInlineStatusUpdate = async (application, status) => {
        if (status === application.status) return;

        setUpdatingStatusId(application.id);
        try {
            await axiosInstance.patch(`/applications/${application.id}/status`, { status }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success('Application status updated');
            await fetchAllApplications();
        } catch (error) {
            console.error('Error updating application status:', error);
            toast.error(error.response?.data?.detail || 'Failed to update application status');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    useEffect(() => {
        if (accessToken) {
            fetchAllApplications();
        }
    }, [accessToken, fetchAllApplications]);

    // Selection handlers
    const toggleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === filteredApplications.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredApplications.map(app => app.id));
        }
    };

    // Delete handlers
    const handleDeleteClick = (application = null) => {
        if (application) {
            setItemToDelete(application);
        } else if (selectedItems.length > 0) {
            setItemToDelete({ bulk: true, count: selectedItems.length });
        }
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            if (itemToDelete?.bulk) {
                await axiosInstance.post('/applications/bulk-delete-admin',
                    { application_ids: selectedItems },
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                setSelectedItems([]);
                toast.success(`Successfully deleted ${itemToDelete.count} application(s)`);
            } else {
                await axiosInstance.post('/applications/bulk-delete-admin',
                    { application_ids: [itemToDelete.id] },
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                toast.success('Application deleted successfully');
            }
            fetchAllApplications();
        } catch (error) {
            console.error('Error deleting application(s):', error);
            toast.error(error.response?.data?.detail || 'Failed to delete');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    // Filter applications
    const filteredApplications = applications.filter(app => {
        const matchesSearch = !searchQuery ||
            app.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.user_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesMember = !memberFilter ||
            app.user_name?.toLowerCase().includes(memberFilter.toLowerCase()) ||
            app.user_email?.toLowerCase().includes(memberFilter.toLowerCase());

        const matchesCompany = !companyFilter ||
            app.company?.toLowerCase().includes(companyFilter.toLowerCase());

        const matchesStatus = !statusFilter || app.status === statusFilter;

        const matchesLevel = !levelFilter || app.role === levelFilter;

        const matchesReferred = !referredFilter ||
            (referredFilter === 'yes' && app.referred) ||
            (referredFilter === 'no' && !app.referred);

        const matchesDateFrom = !dateFrom || new Date(app.date) >= new Date(dateFrom);
        const matchesDateTo = !dateTo || new Date(app.date) <= new Date(dateTo);

        return matchesSearch && matchesMember && matchesCompany && matchesStatus &&
            matchesLevel && matchesReferred && matchesDateFrom && matchesDateTo;
    });

    // Sort applications
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedApplications = [...filteredApplications].sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
            case 'date':
                aValue = new Date(a.date);
                bValue = new Date(b.date);
                break;
            case 'company':
                aValue = a.company || '';
                bValue = b.company || '';
                break;
            case 'member':
                aValue = a.user_name || '';
                bValue = b.user_name || '';
                break;
            case 'position':
                aValue = a.title || '';
                bValue = b.title || '';
                break;
            case 'level':
                aValue = a.role || '';
                bValue = b.role || '';
                break;
            case 'status':
                aValue = a.status || '';
                bValue = b.status || '';
                break;
            default:
                return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Clear all filters
    const clearAllFilters = () => {
        setSearchQuery('');
        setMemberFilter('');
        setCompanyFilter('');
        setStatusFilter('');
        setLevelFilter('');
        setReferredFilter('');
        setDateFrom('');
        setDateTo('');
    };

    // Check if any filters are active
    const hasActiveFilters = searchQuery || memberFilter || companyFilter || statusFilter ||
        levelFilter || referredFilter || dateFrom || dateTo;

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Member', 'Email', 'Company', 'Position', 'Level', 'Location', 'Referred', 'Recruiter', 'Status', 'Applied'];
        const csvData = sortedApplications.map(app => [
            app.user_name || '',
            app.user_email || '',
            app.company || '',
            app.title || '',
            app.role || '',
            app.location?.city && app.location?.country ? `${app.location.city}, ${app.location.country}` : (app.location?.country || app.location?.city || ''),
            app.referred ? 'Yes' : 'No',
            app.recruiter_name || '',
            app.status || '',
            app.date || ''
        ]);

        const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `applications_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Statistics
    const stats = {
        total: applications.length,
        submitted: applications.filter(a => a.status === 'Submitted').length,
        interviewing: applications.filter(a => ['HR', 'Phone interview', 'Final interview', 'OA'].includes(a.status)).length,
        offered: applications.filter(a => a.status === 'Offer').length,
        rejected: applications.filter(a => a.status === 'Rejected').length,
    };

    const getStatusColor = (status) => {
        const colors = {
            'Submitted': 'te-chip-gold',
            'HR': 'te-chip-gold',
            'Phone interview': 'te-chip-gold',
            'OA': 'te-chip-gold',
            'Final interview': 'te-chip-gold',
            'Offer': 'te-chip-green',
            'Rejected': 'te-chip-red',
        };
        return colors[status] || 'te-chip';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--te-bg)] flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--te-bg)] text-[var(--te-text)]">
            <header className="sticky top-16 z-30 border-b border-[var(--te-border)] bg-[var(--te-bg)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <span className="te-eyebrow">Applications admin</span>
                            <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--te-text)]">
                                Member applications
                            </h1>
                            <p className="mt-2 text-sm sm:text-base leading-relaxed text-[var(--te-text-dim)]">
                                Monitor member pipelines, inspect status changes, and export application intelligence.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {isAdmin && selectedItems.length > 0 && (
                                <button onClick={() => handleDeleteClick()} className="te-btn-danger te-btn-sm">
                                    <TrashIcon className="h-4 w-4" />
                                    Delete ({selectedItems.length})
                                </button>
                            )}

                            <details className="relative">
                                <summary className="te-btn-secondary te-btn-sm list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                                    <EyeIcon className="h-4 w-4" />
                                    Columns ({visibleColumnCount}/{columnConfig.length})
                                </summary>
                                <div className="te-card absolute right-0 z-40 mt-2 w-72 overflow-hidden">
                                    <div className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] p-4">
                                        <span className="te-eyebrow">Display</span>
                                        <div className="mt-3 flex gap-2">
                                            <button onClick={showAllColumns} className="te-btn-ghost te-btn-sm flex-1">Show all</button>
                                            <button onClick={resetColumns} className="te-btn-secondary te-btn-sm flex-1">Reset</button>
                                        </div>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto p-2 te-scroll">
                                        {columnConfig.map(column => (
                                            <label key={column.key} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-[var(--te-hover)]">
                                                <input
                                                    type="checkbox"
                                                    checked={visibleColumns[column.key]}
                                                    onChange={() => toggleColumn(column.key)}
                                                    className="h-4 w-4 rounded border-[var(--te-border)] text-[var(--te-primary)] focus:ring-2 focus:ring-[var(--te-ring)]"
                                                />
                                                <span className="flex-1 text-[var(--te-text)]">{column.label}</span>
                                                {!column.default && <span className="font-mono text-[10px] uppercase text-[var(--te-text-dim)]">Optional</span>}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </details>

                            <button onClick={exportToCSV} disabled={sortedApplications.length === 0} className="te-btn-secondary te-btn-sm disabled:cursor-not-allowed disabled:opacity-50">
                                <ArrowDownTrayIcon className="h-4 w-4" />
                                Export CSV
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--te-text-dim)]" />
                            <input
                                type="text"
                                placeholder="Search member, company, or position..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="te-input w-full pl-9"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {['', 'Submitted', 'OA', 'Phone interview', 'Final interview', 'HR', 'Offer', 'Rejected'].map((status) => (
                                <button
                                    key={status || 'All'}
                                    onClick={() => setStatusFilter(status)}
                                    className={`te-btn-sm border font-mono ${statusFilter === status ? 'border-[var(--te-accent)] bg-[var(--te-accent-soft)] text-[var(--te-accent)]' : 'te-btn-secondary'}`}
                                >
                                    {status || 'All'}
                                </button>
                            ))}

                            <details className="relative">
                                <summary className="te-btn-secondary te-btn-sm list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                                    <AdjustmentsHorizontalIcon className="h-4 w-4" />
                                    Filters
                                    {hasActiveFilters && (
                                        <span className="ml-1 border border-[var(--te-border)] px-1.5 py-0.5 font-mono text-[10px]">
                                            {[memberFilter, companyFilter, statusFilter, levelFilter, referredFilter, dateFrom, dateTo].filter(Boolean).length}
                                        </span>
                                    )}
                                </summary>
                                <div className="te-card absolute right-0 z-40 mt-2 w-80 p-4">
                                    <div className="grid gap-3">
                                        <label className="grid gap-1.5">
                                            <span className="te-eyebrow text-[10px]">Member</span>
                                            <input type="text" value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)} className="te-input text-sm" placeholder="Filter by member..." />
                                        </label>
                                        <label className="grid gap-1.5">
                                            <span className="te-eyebrow text-[10px]">Company</span>
                                            <input type="text" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="te-input text-sm" placeholder="Filter by company..." />
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className="grid gap-1.5">
                                                <span className="te-eyebrow text-[10px]">Level</span>
                                                <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="te-select text-sm">
                                                    <option value="">All levels</option>
                                                    <option value="Intern">Intern</option>
                                                    <option value="Entry">Entry</option>
                                                    <option value="Mid">Mid</option>
                                                    <option value="Senior">Senior</option>
                                                </select>
                                            </label>
                                            <label className="grid gap-1.5">
                                                <span className="te-eyebrow text-[10px]">Referred</span>
                                                <select value={referredFilter} onChange={(e) => setReferredFilter(e.target.value)} className="te-select text-sm">
                                                    <option value="">All</option>
                                                    <option value="yes">Referred</option>
                                                    <option value="no">Not referred</option>
                                                </select>
                                            </label>
                                            <label className="grid gap-1.5">
                                                <span className="te-eyebrow text-[10px]">From</span>
                                                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="te-input text-sm" />
                                            </label>
                                            <label className="grid gap-1.5">
                                                <span className="te-eyebrow text-[10px]">To</span>
                                                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="te-input text-sm" />
                                            </label>
                                        </div>
                                        {hasActiveFilters && (
                                            <button onClick={clearAllFilters} className="te-btn-secondary te-btn-sm justify-center">
                                                <XMarkIcon className="h-4 w-4" />
                                                Clear filters
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                <div className="mb-6 overflow-hidden border border-[var(--te-border)] bg-[var(--te-border)]">
                    <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-5">
                        {[
                            { label: 'Total', value: stats.total, icon: UserGroupIcon, tone: 'text-[var(--te-text)]' },
                            { label: 'Offers', value: stats.offered, icon: CheckCircleIcon, tone: 'text-te-green' },
                            { label: 'Interviewing', value: stats.interviewing, icon: ClockIcon, tone: 'text-te-gold' },
                            { label: 'Submitted', value: stats.submitted, icon: ClockIcon, tone: 'text-te-gold' },
                            { label: 'Rejected', value: stats.rejected, icon: XCircleIcon, tone: 'text-te-red' },
                        ].map((item) => (
                            <div key={item.label} className="bg-[var(--te-surface)] p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="te-eyebrow text-[10px]">{item.label}</span>
                                    <item.icon className={`h-4 w-4 ${item.tone}`} />
                                </div>
                                <p className={`mt-4 font-mono text-3xl font-semibold tracking-tight ${item.tone}`}>{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="te-card overflow-hidden">
                    <div className="flex flex-col gap-2 border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">
                            {sortedApplications.length} of {applications.length} applications
                        </p>
                        <p className="text-xs text-[var(--te-text-dim)]">Click any row or card to inspect details</p>
                    </div>

                    <div className="hidden md:block overflow-x-auto te-scroll">
                        <table className="w-full">
                            <thead className="bg-[var(--te-surface-alt)]">
                                <tr className="border-b border-[var(--te-border)]">
                                    {isAdmin && (
                                        <th className="px-4 py-4 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.length === filteredApplications.length && filteredApplications.length > 0}
                                                onChange={toggleSelectAll}
                                                className="rounded border-[var(--te-border)] text-[var(--te-primary)] focus:ring-[var(--te-ring)] bg-[var(--te-surface)]"
                                            />
                                        </th>
                                    )}
                                    {visibleColumns.company && (
                                        <th onClick={() => handleSort('company')} className="px-4 py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text-dim)] cursor-pointer hover:bg-[var(--te-hover)]">
                                            <div className="flex items-center gap-2">Company {sortField === 'company' ? (sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />) : <ChevronUpDownIcon className="h-4 w-4 opacity-40" />}</div>
                                        </th>
                                    )}
                                    {visibleColumns.member && (
                                        <th onClick={() => handleSort('member')} className="px-4 py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text-dim)] cursor-pointer hover:bg-[var(--te-hover)]">
                                            <div className="flex items-center gap-2">Member {sortField === 'member' ? (sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />) : <ChevronUpDownIcon className="h-4 w-4 opacity-40" />}</div>
                                        </th>
                                    )}
                                    {visibleColumns.position && (
                                        <th onClick={() => handleSort('position')} className="px-4 py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text-dim)] cursor-pointer hover:bg-[var(--te-hover)]">
                                            <div className="flex items-center gap-2">Position {sortField === 'position' ? (sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />) : <ChevronUpDownIcon className="h-4 w-4 opacity-40" />}</div>
                                        </th>
                                    )}
                                    {visibleColumns.level && (
                                        <th onClick={() => handleSort('level')} className="px-4 py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text-dim)] cursor-pointer hover:bg-[var(--te-hover)]">
                                            <div className="flex items-center gap-2">Level {sortField === 'level' ? (sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />) : <ChevronUpDownIcon className="h-4 w-4 opacity-40" />}</div>
                                        </th>
                                    )}
                                    {visibleColumns.location && <th className="px-4 py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text-dim)]">Location</th>}
                                    {visibleColumns.referred && <th className="px-4 py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text-dim)]">Referred</th>}
                                    {visibleColumns.recruiter && <th className="px-4 py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text-dim)]">Recruiter</th>}
                                    {visibleColumns.status && (
                                        <th onClick={() => handleSort('status')} className="px-4 py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text-dim)] cursor-pointer hover:bg-[var(--te-hover)]">
                                            <div className="flex items-center gap-2">Status {sortField === 'status' ? (sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />) : <ChevronUpDownIcon className="h-4 w-4 opacity-40" />}</div>
                                        </th>
                                    )}
                                    {visibleColumns.applied && (
                                        <th onClick={() => handleSort('date')} className="px-4 py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text-dim)] cursor-pointer hover:bg-[var(--te-hover)]">
                                            <div className="flex items-center gap-2">Applied {sortField === 'date' ? (sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />) : <ChevronUpDownIcon className="h-4 w-4 opacity-40" />}</div>
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--te-border)]">
                                {sortedApplications.length === 0 ? (
                                    <tr>
                                        <td colSpan={visibleColumnCount + (isAdmin ? 1 : 0)} className="px-4 py-16 text-center">
                                            <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[var(--te-gold)] bg-[var(--te-gold-soft)]">
                                                <BuildingOfficeIcon className="h-7 w-7 text-te-gold" />
                                            </div>
                                            <p className="mt-4 font-display text-lg font-semibold text-[var(--te-text)]">No applications found</p>
                                            <p className="mt-1 text-sm text-[var(--te-text-dim)]">{applications.length === 0 ? 'No member applications yet.' : 'Try adjusting your filters.'}</p>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedApplications.map((app) => (
                                        <tr
                                            key={app.id}
                                            onClick={() => { setSelectedApplication(app); setSelectedApplicationId(app.id); }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setSelectedApplication(app);
                                                    setSelectedApplicationId(app.id);
                                                }
                                            }}
                                            tabIndex={0}
                                            role="button"
                                            aria-label={`View details for application at ${app.company}`}
                                            className="cursor-pointer transition-colors hover:bg-[var(--te-hover)]"
                                        >
                                            {isAdmin && (
                                                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.includes(app.id)}
                                                        onChange={() => toggleSelectItem(app.id)}
                                                        className="rounded border-[var(--te-border)] text-[var(--te-primary)] focus:ring-[var(--te-ring)] bg-[var(--te-surface)]"
                                                    />
                                                </td>
                                            )}
                                            {visibleColumns.company && (
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img src={getCompanyLogoUrl(app.company)} alt={app.company} className="h-8 w-8 rounded-lg border border-[var(--te-border)] bg-[var(--te-surface)] object-cover" onError={handleCompanyLogoError} />
                                                        <span className="text-sm font-semibold text-[var(--te-text)]">{app.company}</span>
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.member && (
                                                <td className="px-4 py-4">
                                                    <p className="text-sm font-medium text-[var(--te-text)]">{app.user_name}</p>
                                                    <p className="text-xs text-[var(--te-text-dim)]">{app.user_email}</p>
                                                </td>
                                            )}
                                            {visibleColumns.position && <td className="px-4 py-4 text-sm text-[var(--te-text)]">{app.title}</td>}
                                            {visibleColumns.level && <td className="px-4 py-4 font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">{app.role}</td>}
                                            {visibleColumns.location && <td className="px-4 py-4 text-sm text-[var(--te-text-dim)]">{app.location?.city && app.location?.country ? `${app.location.city}, ${app.location.country}` : app.location?.country || app.location?.city || '—'}</td>}
                                            {visibleColumns.referred && <td className="px-4 py-4">{app.referred ? <span className="te-badge-green">Yes</span> : <span className="text-xs text-[var(--te-text-dim)]">—</span>}</td>}
                                            {visibleColumns.recruiter && (
                                                <td className="px-4 py-4">
                                                    {app.recruiter_name ? (
                                                        <div>
                                                            <p className="text-sm font-medium text-[var(--te-text)]">{app.recruiter_name}</p>
                                                            {app.recruiter_email && <p className="text-xs text-[var(--te-text-dim)]">{app.recruiter_email}</p>}
                                                        </div>
                                                    ) : <span className="text-xs text-[var(--te-text-dim)]">—</span>}
                                                </td>
                                            )}
                                            {visibleColumns.status && (
                                                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                                    {isAdmin ? (
                                                        <select
                                                            value={app.status}
                                                            onChange={(e) => handleInlineStatusUpdate(app, e.target.value)}
                                                            disabled={updatingStatusId === app.id}
                                                            className={`te-select py-1 text-xs font-semibold ${getStatusColor(app.status)}`}
                                                            aria-label={`Update application status for ${app.company}`}
                                                        >
                                                            <option value="Submitted">Submitted</option>
                                                            <option value="OA">OA</option>
                                                            <option value="Phone interview">Phone interview</option>
                                                            <option value="Final interview">Final interview</option>
                                                            <option value="HR">HR</option>
                                                            <option value="Recruiter call">Recruiter call</option>
                                                            <option value="Offer">Offer</option>
                                                            <option value="Not now">Not now</option>
                                                            <option value="Rejected">Rejected</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`te-chip border ${getStatusColor(app.status)}`}>{app.status}</span>
                                                    )}
                                                </td>
                                            )}
                                            {visibleColumns.applied && <td className="px-4 py-4 font-mono text-xs text-[var(--te-text-dim)]">{app.date}</td>}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid gap-3 p-3 md:hidden">
                        {sortedApplications.length === 0 ? (
                            <div className="p-10 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[var(--te-gold)] bg-[var(--te-gold-soft)]">
                                    <BuildingOfficeIcon className="h-7 w-7 text-te-gold" />
                                </div>
                                <p className="mt-4 font-display text-lg font-semibold text-[var(--te-text)]">No applications found</p>
                                <p className="mt-1 text-sm text-[var(--te-text-dim)]">{applications.length === 0 ? 'No member applications yet.' : 'Try adjusting your filters.'}</p>
                            </div>
                        ) : (
                            sortedApplications.map((app) => (
                                <button
                                    key={app.id}
                                    onClick={() => { setSelectedApplication(app); setSelectedApplicationId(app.id); }}
                                    className="te-card-interactive w-full p-4 text-left"
                                >
                                    <div className="flex items-start gap-3">
                                        {visibleColumns.company && <img src={getCompanyLogoUrl(app.company)} alt={app.company} className="h-10 w-10 rounded-lg border border-[var(--te-border)] bg-[var(--te-surface)] object-cover" onError={handleCompanyLogoError} />}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    {visibleColumns.company && <h3 className="truncate text-sm font-semibold text-[var(--te-text)]">{app.company}</h3>}
                                                    {visibleColumns.position && <p className="mt-1 truncate text-sm text-[var(--te-text-dim)]">{app.title}</p>}
                                                </div>
                                                {visibleColumns.status && <span className={`te-chip border ${getStatusColor(app.status)}`}>{app.status}</span>}
                                            </div>
                                            {visibleColumns.member && (
                                                <div className="mt-3 border-t border-[var(--te-border)] pt-3">
                                                    <p className="text-xs font-semibold text-[var(--te-text)]">{app.user_name}</p>
                                                    <p className="text-xs text-[var(--te-text-dim)]">{app.user_email}</p>
                                                </div>
                                            )}
                                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-wide text-[var(--te-text-dim)]">
                                                {visibleColumns.level && <span>{app.role}</span>}
                                                {visibleColumns.applied && <span>{app.date}</span>}
                                                {visibleColumns.referred && app.referred && <span className="te-badge-green">Referred</span>}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {selectedApplicationId && (
                <ApplicationInfo
                    applicationId={selectedApplicationId}
                    setApplicationId={setSelectedApplicationId}
                    application={selectedApplication}
                    setApplication={setSelectedApplication}
                    archiveUserApplicationRequest={archiveApplications}
                    deleteUserApplicationRequest={deleteApplications}
                    refreshApplications={fetchAllApplications}
                />
            )}

            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Application(s)"
                message={itemToDelete?.bulk
                    ? `You are about to permanently delete ${itemToDelete.count} application(s).`
                    : `You are about to permanently delete the application for "${itemToDelete?.title}" at ${itemToDelete?.company}.`
                }
                itemCount={itemToDelete?.bulk ? itemToDelete.count : 1}
                isDeleting={deleting}
                itemType="application"
            />
        </div>
    );
};

export default ApplicationManagement;
