import { useCallback, useEffect, useState } from 'react'
import { HttpStatusCode } from 'axios'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { getCompanyLogoUrl, handleCompanyLogoError } from '../utils'

import { Loading } from '../components/_custom/Loading'
import SignInPrompt from '../components/_custom/Alert/SignInPrompt'
import {
    PlusIcon,
    MagnifyingGlassIcon,
    BriefcaseIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon as XCircleIconSolid,
    ChevronUpDownIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    AdjustmentsHorizontalIcon,
    TrashIcon,
    ArchiveBoxIcon
} from 'icons'


import axiosInstance from '../axiosConfig'
import ApplicationCreate from '../components/application/ApplicationCreate'
import ApplicationBulkCreate from '../components/application/ApplicationBulkCreate'
import ApplicationInfo from '../components/application/ApplicationInfo'

// Start with empty list; will populate from backend
const initialApplications = [];

const Applications = () => {
    const { userId, accessToken, logout, userRole } = useAuth();
    const { fetchApplications, setFetchApplications, applications: contextApplications } = useData();

    // UserRoles: Guest=0, Member=1, Lead=2, Admin=3
    const isMember = userRole && parseInt(userRole) === 1; // Only Members can track applications

    // Start empty; fetch from backend or context
    const [applications, setApplications] = useState(initialApplications);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [levelFilter, setLevelFilter] = useState('All');
    const [locationFilter, setLocationFilter] = useState('All');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [application, setApplication] = useState(null);
    const [applicationId, setApplicationId] = useState(null);

    const [addApplication, setAddApplication] = useState(false);
    const [addApplications, setAddApplications] = useState(false);
    const [showSignInPrompt, setShowSignInPrompt] = useState(false);

    // Confirmation modal state
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        confirmText: 'Confirm',
        confirmStyle: 'danger' // 'danger' or 'primary'
    });

    // Check if user is authenticated
    useEffect(() => {
        if (!accessToken) {
            setShowSignInPrompt(true);
        }
    }, [accessToken]);

    // Sync context-provided applications if available
    useEffect(() => {
        if (accessToken && contextApplications && contextApplications.length > 0) {
            setApplications(contextApplications.map(a => ({ ...a, selected: false })));
        }
    }, [accessToken, contextApplications]);

    const getUserApplicationsRequest = useCallback(async () => {
        await axiosInstance.get(`/users/${userId}/applications`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }).then((response) => {
            setApplications(response.data.applications.map((application) => ({ ...application, selected: false })));
        }).catch((error) => {
            if (error.response?.status === HttpStatusCode.Unauthorized && userId) {
                logout();
            }
            console.error('Error fetching applications:', error);
        })
    }, [userId, accessToken, setApplications, logout]);

    const archiveUserApplicationRequest = useCallback((applicationIds) => {
        axiosInstance.patch(`/applications/archive`, { application_ids: applicationIds }, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
            .then(() => {
                setFetchApplications(true);
                setApplicationId(null);
            })
            .catch(error => {
                if (error.response?.status === HttpStatusCode.Unauthorized && userId) {
                    logout();
                }
                console.error('Error archiving applications:', error);
            });
    }, [userId, accessToken, setApplicationId, setFetchApplications, logout]);

    const deleteUserApplicationRequest = useCallback((applicationIds) => {
        axiosInstance.delete(`/applications/delete`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            data: { application_ids: applicationIds }
        })
            .then(() => {
                setFetchApplications(true);
                setApplicationId(null);
            })
            .catch(error => {
                if (error.response?.status === HttpStatusCode.Unauthorized && userId) {
                    logout();
                }
                console.error('Error deleting applications:', error);
            });
    }, [userId, accessToken, setFetchApplications, logout]);

    useEffect(() => {
        if (!userId || !accessToken) {
            if (fetchApplications) setFetchApplications(false);
            return;
        }
        if (fetchApplications || applications.length === 0) {
            getUserApplicationsRequest().finally(() => setFetchApplications(false));
        }
    }, [userId, accessToken, fetchApplications, applications.length, getUserApplicationsRequest, setFetchApplications]);

    // Calculate statistics
    const stats = applications.reduce((acc, app) => {
        acc.total++;
        if (app.status === 'Offer') acc.offers++;
        else if (app.status === 'Rejected') acc.rejected++;
        else if (['HR', 'Phone interview', 'Final interview', 'OA'].includes(app.status)) acc.interviewing++;
        else acc.pending++;
        return acc;
    }, { total: 0, offers: 0, interviewing: 0, rejected: 0, pending: 0 });

    // Get unique levels and locations for filters
    const uniqueLevels = ['All', ...new Set(applications.map(app => app.role).filter(Boolean))];
    const uniqueLocations = ['All', ...new Set(applications.map(app => {
        if (app.location?.city && app.location?.country) {
            return `${app.location.city}, ${app.location.country}`;
        }
        return null;
    }).filter(Boolean))];

    // Filter applications
    const filteredApplications = applications.filter(app => {
        const matchesSearch = (app.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (app.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (app.role || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
        const matchesLevel = levelFilter === 'All' || app.role === levelFilter;
        const matchesLocation = locationFilter === 'All' ||
            (app.location?.city ? `${app.location.city}, ${app.location.country}` : app.location?.country) === locationFilter;
        return matchesSearch && matchesStatus && matchesLevel && matchesLocation;
    });

    // Sort applications
    const sortedApplications = [...filteredApplications].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case 'company':
                comparison = (a.company || '').localeCompare(b.company || '');
                break;
            case 'title':
                comparison = a.title.localeCompare(b.title);
                break;
            case 'status':
                comparison = a.status.localeCompare(b.status);
                break;
            case 'date':
                comparison = new Date(a.date) - new Date(b.date);
                break;
            default:
                comparison = 0;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Pagination
    const totalPages = Math.ceil(sortedApplications.length / itemsPerPage);
    const paginatedApplications = sortedApplications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Handle sort
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    // Open application info modal
    const openApplicationModal = (app) => {
        setApplication(app);
        setApplicationId(app.id);
    };

    // Bulk action handlers
    const handleArchiveAll = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Archive All Applications',
            message: 'Are you sure you want to archive all applications? This will move them to your archive.',
            onConfirm: () => {
                const allApplicationIds = applications.map(app => app.id);
                archiveUserApplicationRequest(allApplicationIds);
                setConfirmDialog({ ...confirmDialog, isOpen: false });
            },
            confirmText: 'Archive All',
            confirmStyle: 'primary'
        });
    };

    const handleDeleteAll = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete All Applications',
            message: 'Are you sure you want to delete ALL applications? This action cannot be undone!',
            onConfirm: () => {
                const allApplicationIds = applications.map(app => app.id);
                deleteUserApplicationRequest(allApplicationIds);
                setConfirmDialog({ ...confirmDialog, isOpen: false });
            },
            confirmText: 'Delete All',
            confirmStyle: 'danger'
        });
    };

    // Status badge styling
    const getStatusBadge = (status) => {
        const styles = {
            'Submitted': 'te-chip-gold',
            'HR': 'te-chip-gold',
            'Phone interview': 'te-chip-gold',
            'OA': 'te-chip-gold',
            'Final interview': 'te-chip-gold',
            'Offer': 'te-chip-green',
            'Rejected': 'te-chip-red'
        };
        return styles[status] || 'te-chip';
    };

    return (
        <div className="min-h-screen bg-[var(--te-bg)] text-[var(--te-text)]">
            <header className="sticky top-16 z-30 border-b border-[var(--te-border)] bg-[var(--te-bg)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <span className="te-eyebrow">Applications</span>
                            <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--te-text)]">
                                Application tracker
                            </h1>
                            <p className="mt-2 text-sm sm:text-base leading-relaxed text-[var(--te-text-dim)]">
                                Track every role, recruiter touchpoint, and interview stage in one focused pipeline.
                            </p>
                        </div>
                        {!fetchApplications && isMember && (
                            <div className="flex w-full gap-2 sm:w-auto">
                                <button onClick={() => setAddApplication(true)} className="te-btn-primary te-btn-lg flex-1 sm:flex-none"><PlusIcon className="h-4 w-4" /> New application</button>
                                <button onClick={() => setAddApplications(true)} className="te-btn-secondary te-btn-lg flex-1 sm:flex-none"><PlusIcon className="h-4 w-4" /> Bulk add</button>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--te-text-dim)]" />
                            <input
                                type="text"
                                placeholder="Search company, role, or level..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="te-input w-full pl-9"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {['All', 'Submitted', 'HR', 'OA', 'Phone interview', 'Final interview', 'Offer', 'Rejected'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`te-btn-sm border font-mono ${statusFilter === status ? 'border-[var(--te-accent)] bg-[var(--te-accent-soft)] text-[var(--te-accent)]' : 'te-btn-secondary'}`}
                                >
                                    {status === 'Phone interview' ? 'Phone' : status === 'Final interview' ? 'Final' : status}
                                </button>
                            ))}

                            <details className="relative">
                                <summary className="te-btn-secondary te-btn-sm list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                                    <AdjustmentsHorizontalIcon className="h-4 w-4" />
                                    More filters
                                </summary>
                                <div className="te-card absolute right-0 z-40 mt-2 w-72 p-4">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="te-eyebrow text-[10px]">Level</label>
                                            <select
                                                value={levelFilter}
                                                onChange={(e) => setLevelFilter(e.target.value)}
                                                className="te-select mt-2 w-full text-sm"
                                            >
                                                {uniqueLevels.map(level => (
                                                    <option key={level} value={level}>{level === 'All' ? 'All levels' : level}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="te-eyebrow text-[10px]">Location</label>
                                            <select
                                                value={locationFilter}
                                                onChange={(e) => setLocationFilter(e.target.value)}
                                                className="te-select mt-2 w-full text-sm"
                                            >
                                                {uniqueLocations.map(location => (
                                                    <option key={location} value={location}>{location === 'All' ? 'All locations' : location}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                setStatusFilter('All');
                                                setLevelFilter('All');
                                                setLocationFilter('All');
                                            }}
                                            className="te-btn-secondary te-btn-sm w-full justify-center"
                                        >
                                            Clear filters
                                        </button>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            </header>

            {fetchApplications && (
                <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
                    <Loading />
                </div>
            )}

            {!fetchApplications && (
                <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                    {applications.length > 0 && (
                        <div className="mb-6 overflow-hidden border border-[var(--te-border)] bg-[var(--te-border)]">
                            <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-5">
                                {[
                                    { label: 'Total', value: stats.total, icon: BriefcaseIcon, tone: 'text-[var(--te-text)]' },
                                    { label: 'Offers', value: stats.offers, icon: CheckCircleIcon, tone: 'text-te-green' },
                                    { label: 'Interviewing', value: stats.interviewing, icon: ClockIcon, tone: 'text-te-gold' },
                                    { label: 'Pending', value: stats.pending, icon: ClockIcon, tone: 'text-te-gold' },
                                    { label: 'Rejected', value: stats.rejected, icon: XCircleIconSolid, tone: 'text-te-red' },
                                ].map((item) => (
                                    <div key={item.label} className="bg-[var(--te-surface)] p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="te-eyebrow text-[10px]">{item.label}</span>
                                            <item.icon className={`h-4 w-4 ${item.tone}`} />
                                        </div>
                                        <p className={`mt-4 font-mono text-3xl font-semibold tracking-tight ${item.tone}`}>
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {applications.length > 0 && (
                        <div className="mb-4 te-panel p-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <ArchiveBoxIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                    <span className="font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">
                                        Bulk actions / {applications.length} total
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={handleArchiveAll} className="te-btn-secondary te-btn-sm flex-1 sm:flex-none">
                                        <ArchiveBoxIcon className="h-4 w-4 text-te-red" />
                                        Archive all
                                    </button>
                                    <button onClick={handleDeleteAll} className="te-btn-danger te-btn-sm flex-1 sm:flex-none">
                                        <TrashIcon className="h-4 w-4" />
                                        Delete all
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {sortedApplications.length === 0 ? (
                        <div className="te-card p-10 sm:p-16 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center border border-[var(--te-gold)] bg-[var(--te-gold-soft)]">
                                <BriefcaseIcon className="h-8 w-8 text-te-gold" />
                            </div>
                            <h3 className="mt-6 font-display text-xl font-semibold text-[var(--te-text)]">
                                {searchQuery || statusFilter !== 'All' || levelFilter !== 'All' || locationFilter !== 'All' ? 'No matching applications' : 'No applications yet'}
                            </h3>
                            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--te-text-dim)]">
                                {searchQuery || statusFilter !== 'All' || levelFilter !== 'All' || locationFilter !== 'All'
                                    ? 'Try a different search or clear your filters to return to the full pipeline.'
                                    : 'Add your first application to start building a searchable job-search system.'}
                            </p>
                            {!searchQuery && statusFilter === 'All' && levelFilter === 'All' && locationFilter === 'All' && isMember && (
                                <button onClick={() => setAddApplication(true)} className="te-btn-primary te-btn-lg mt-7">
                                    <PlusIcon className="h-4 w-4" />
                                    Add first application
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-3 md:hidden">
                                {paginatedApplications.map((app) => (
                                    <button
                                        key={app.id}
                                        onClick={() => isMember && openApplicationModal(app)}
                                        className={`te-card-interactive w-full p-4 text-left ${isMember ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                                        title={!isMember ? 'Only Members can edit applications' : ''}
                                    >
                                        <div className="flex items-start gap-3">
                                            <img
                                                src={getCompanyLogoUrl(app.company)}
                                                alt={app.company}
                                                className="h-11 w-11 flex-shrink-0 rounded-lg border border-[var(--te-border)] bg-[var(--te-surface)] object-cover"
                                                onError={handleCompanyLogoError}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="truncate text-sm font-semibold text-[var(--te-text)]">{app.company}</h3>
                                                        <p className="mt-1 truncate text-sm text-[var(--te-text-dim)]">{app.title}</p>
                                                    </div>
                                                    <span className={`te-chip border ${getStatusBadge(app.status)}`}>{app.status}</span>
                                                </div>
                                                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--te-border)] pt-3 text-xs text-[var(--te-text-dim)]">
                                                    <span className="font-mono uppercase tracking-wide">{app.role || 'Level —'}</span>
                                                    <span className="truncate text-right">{app.location?.city ? `${app.location.city}, ${app.location.country}` : app.location?.country || 'Unknown'}</span>
                                                    <span>{new Date(app.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    {app.referred && <span className="text-right"><span className="te-badge-green">Referred</span></span>}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="hidden md:block te-card overflow-hidden">
                                <div className="overflow-x-auto te-scroll">
                                    <table className="w-full">
                                        <thead className="bg-[var(--te-surface-alt)]">
                                            <tr className="border-b border-[var(--te-border)]">
                                                <th onClick={() => handleSort('company')} className="px-6 py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text-dim)] cursor-pointer hover:bg-[var(--te-hover)]">
                                                    <div className="flex items-center gap-2">Company {sortBy === 'company' ? (sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />) : <ChevronUpDownIcon className="h-4 w-4 opacity-40" />}</div>
                                                </th>
                                                <th onClick={() => handleSort('title')} className="px-6 py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text-dim)] cursor-pointer hover:bg-[var(--te-hover)]">
                                                    <div className="flex items-center gap-2">Position {sortBy === 'title' ? (sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />) : <ChevronUpDownIcon className="h-4 w-4 opacity-40" />}</div>
                                                </th>
                                                <th className="px-6 py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text-dim)]">Level</th>
                                                <th onClick={() => handleSort('status')} className="px-6 py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text-dim)] cursor-pointer hover:bg-[var(--te-hover)]">
                                                    <div className="flex items-center gap-2">Status {sortBy === 'status' ? (sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />) : <ChevronUpDownIcon className="h-4 w-4 opacity-40" />}</div>
                                                </th>
                                                <th className="px-6 py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text-dim)]">Location</th>
                                                <th onClick={() => handleSort('date')} className="px-6 py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text-dim)] cursor-pointer hover:bg-[var(--te-hover)]">
                                                    <div className="flex items-center gap-2">Applied {sortBy === 'date' ? (sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />) : <ChevronUpDownIcon className="h-4 w-4 opacity-40" />}</div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--te-border)]">
                                            {paginatedApplications.map((app) => (
                                                <tr
                                                    key={app.id}
                                                    onClick={() => isMember && openApplicationModal(app)}
                                                    className={`transition-colors hover:bg-[var(--te-hover)] ${isMember ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                                                    title={!isMember ? 'Only Members can edit applications' : ''}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={getCompanyLogoUrl(app.company)} alt={app.company} className="h-9 w-9 rounded-lg border border-[var(--te-border)] bg-[var(--te-surface)] object-cover" onError={handleCompanyLogoError} />
                                                            <span className="text-sm font-semibold text-[var(--te-text)]">{app.company}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-[var(--te-text)]">{app.title}</td>
                                                    <td className="px-6 py-4 font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">{app.role}</td>
                                                    <td className="px-6 py-4"><span className={`te-chip border ${getStatusBadge(app.status)}`}>{app.status}</span></td>
                                                    <td className="px-6 py-4 text-sm text-[var(--te-text-dim)]">{app.location?.city ? `${app.location.city}, ${app.location.country}` : app.location?.country || 'Unknown'}</td>
                                                    <td className="px-6 py-4 font-mono text-xs text-[var(--te-text-dim)]">{new Date(app.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {totalPages > 1 && (
                                <div className="mt-4 te-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="font-mono text-xs text-[var(--te-text-dim)]">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, sortedApplications.length)} of {sortedApplications.length}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="te-icon-btn disabled:cursor-not-allowed disabled:opacity-50">
                                            <ChevronLeftIcon className="h-4 w-4" />
                                        </button>
                                        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) pageNum = i + 1;
                                            else if (currentPage <= 3) pageNum = i + 1;
                                            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                            else pageNum = currentPage - 2 + i;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`px-3 py-1.5 font-mono text-xs transition-colors ${currentPage === pageNum ? 'border border-[var(--te-accent)] bg-[var(--te-accent-soft)] text-[var(--te-accent)]' : 'border border-[var(--te-border)] bg-[var(--te-surface)] text-[var(--te-text-dim)] hover:bg-[var(--te-hover)]'}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="te-icon-btn disabled:cursor-not-allowed disabled:opacity-50">
                                            <ChevronRightIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            )}

            {addApplication && (
                <ApplicationCreate setAddApplication={setAddApplication} />
            )}
            {addApplications && <ApplicationBulkCreate setAddApplications={setAddApplications} />}

            {applicationId && (
                <ApplicationInfo
                    applicationId={applicationId}
                    setApplicationId={setApplicationId}
                    application={application}
                    setApplication={setApplication}
                    archiveUserApplicationRequest={archiveUserApplicationRequest}
                    deleteUserApplicationRequest={deleteUserApplicationRequest}
                    refreshApplications={() => setFetchApplications(true)}
                />
            )}

            <SignInPrompt
                isOpen={showSignInPrompt}
                onClose={() => setShowSignInPrompt(false)}
            />

            {confirmDialog.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="te-card w-full max-w-md overflow-hidden">
                        <div className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] px-6 py-4">
                            <span className="te-eyebrow">{confirmDialog.confirmStyle === 'danger' ? '// destructive action' : '// confirm action'}</span>
                            <h3 className="mt-2 font-display text-lg font-semibold text-[var(--te-text)]">{confirmDialog.title}</h3>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-sm leading-relaxed text-[var(--te-text-dim)]">{confirmDialog.message}</p>
                        </div>
                        <div className="flex items-center justify-end gap-3 border-t border-[var(--te-border)] bg-[var(--te-surface-alt)] px-6 py-4">
                            <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="te-btn-secondary">Cancel</button>
                            <button onClick={confirmDialog.onConfirm} className={confirmDialog.confirmStyle === 'danger' ? 'te-btn-danger' : 'te-btn-primary'}>
                                {confirmDialog.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Applications
