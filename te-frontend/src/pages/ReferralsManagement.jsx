import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import axiosInstance from '../axiosConfig';
import { Loading } from '../components/_custom/Loading';
import DeleteConfirmationModal from '../components/_custom/DeleteConfirmationModal';
import ReferralManagement from '../components/referral/ReferralManagement';
import { getCompanyLogoUrl, handleCompanyLogoError } from '../utils';
import { PlusIcon, BuildingOfficeIcon, ClockIcon, CheckCircleIcon, PaperAirplaneIcon, XMarkIcon, AdjustmentsHorizontalIcon, ChartBarIcon, ArrowDownTrayIcon, PencilIcon, TrashIcon } from 'icons';
import { ClipboardDocumentIcon } from 'icons';
const ReferralsManagement = () => {
  const {
    accessToken,
    userRole
  } = useAuth();
  const {
    userInfo
  } = useData();
  const toast = useToast();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending'); // Default to Pending status
  const [memberFilter, setMemberFilter] = useState('');
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  // Selection and bulk delete state
  const [selectedItems, setSelectedItems] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Check if user is a referrer (role = 2) - use sessionStorage as fallback for immediate availability
  const storedRole = sessionStorage.getItem('userRole');
  const effectiveRole = userRole || parseInt(storedRole) || 0;
  const isReferrer = effectiveRole === 2;
  const isLead = effectiveRole >= 3; // Volunteers, Leads, Admins
  const isAdmin = effectiveRole >= 4; // Leads and Admins

  // Company filter - only initialize for non-referrers
  const [companyFilter, setCompanyFilter] = useState('');

  // Clear company filter immediately if user is a referrer
  useEffect(() => {
    if (isReferrer) {
      setCompanyFilter('');
    }
  }, [isReferrer]);

  // Show welcome message for referrers once per session and auto-hide after 3 seconds
  useEffect(() => {
    if (isReferrer) {
      const hasSeenWelcome = sessionStorage.getItem('hasSeenReferrerWelcome');
      if (!hasSeenWelcome) {
        setShowWelcomeMessage(true);
        sessionStorage.setItem('hasSeenReferrerWelcome', 'true');
        const timer = setTimeout(() => {
          setShowWelcomeMessage(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isReferrer]);

  // Advanced Features State - Sort controls hidden for referrers but sorting logic still active with defaults
  const [sortField] = useState('date'); // Default sort by date for referrers
  const [sortOrder] = useState('desc'); // Default descending order for referrers
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    company: true,
    jobTitle: true,
    member: true,
    phone_number: true,
    status: true,
    actions: true,
    email: false,
    resume: false,
    essay: false
  });

  // Tab Management
  const [activeTab, setActiveTab] = useState('referrals'); // 'referrals' or 'companies'
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Column Management
  const toggleColumn = column => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };
  const resetColumns = () => {
    setVisibleColumns({
      company: true,
      jobTitle: true,
      member: true,
      phone_number: true,
      status: true,
      actions: true,
      email: false,
      resume: false,
      essay: false
    });
  };
  const showAllColumns = () => {
    setVisibleColumns({
      company: true,
      jobTitle: true,
      member: true,
      email: true,
      phone_number: true,
      status: true,
      resume: true,
      essay: true,
      actions: true
    });
  };

  // Add Company Form
  const [companyForm, setCompanyForm] = useState({
    name: '',
    image: '',
    description: '',
    website: '',
    industry: '',
    size: '',
    headquarters: '',
    referral_link: '',
    requires_resume: true,
    requires_phone_number: true,
    requires_essay: true
  });

  // Edit Company State
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editCompanyForm, setEditCompanyForm] = useState({
    name: '',
    image: '',
    description: '',
    website: '',
    industry: '',
    size: '',
    headquarters: '',
    referral_link: '',
    requires_resume: true,
    requires_phone_number: true,
    requires_essay: true
  });

  // Fetch all referrals
  const fetchAllReferrals = useCallback(async () => {
    try {
      // Calculate role inside callback to avoid stale closure
      const currentRole = parseInt(userRole || sessionStorage.getItem('userRole') || '0');
      const currentIsReferrer = currentRole === 2;

      // Build endpoint: for referrers explicitly include company_id
      let endpoint = '/referrals';
      if (currentIsReferrer && userInfo?.company_id) {
        endpoint = `/referrals?company_id=${userInfo.company_id}`;
      }
      const response = await axiosInstance.get(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const rawReferrals = response.data?.referrals || [];
      const enriched = rawReferrals.map(r => ({
        ...r,
        submitted_date: r.submitted_date || r.date || '',
        has_resume: r.has_resume !== undefined ? r.has_resume : Boolean(r.resume),
        has_essay: r.has_essay !== undefined ? r.has_essay : Boolean(r.essay)
      }));
      setReferrals(enriched);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      setReferrals([]);
    }
  }, [accessToken, userRole, userInfo?.company_id]);

  // Fetch all companies
  const fetchCompanies = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/referrals/companies', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      setCompanies(response.data?.companies || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  }, [accessToken]);

  // Unified initial + role-change fetch (runs when accessToken/role ready)
  useEffect(() => {
    if (!accessToken) return;

    // Wait for userRole to load from AuthContext (comes from localStorage on mount)
    if (!userRole && !sessionStorage.getItem('userRole')) return;
    const currentRole = parseInt(userRole || sessionStorage.getItem('userRole') || '0');
    const currentIsReferrer = currentRole === 2;
    const currentIsLead = currentRole >= 3;
    const currentIsAdmin = currentRole >= 4;
    setLoading(true);
    const run = async () => {
      try {
        if (currentIsReferrer || currentIsLead || currentIsAdmin) {
          await fetchAllReferrals();
          if (currentIsLead || currentIsAdmin) {
            await fetchCompanies();
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [accessToken, userRole, userInfo?.company_id, fetchAllReferrals, fetchCompanies]);

  // Safety re-fetch: If initial render missed because role/userInfo wasn't ready yet
  useEffect(() => {
    if (!accessToken) return;
    if (isReferrer && userInfo?.company_id && referrals.length === 0 && !loading) {
      fetchAllReferrals();
    }
  }, [accessToken, isReferrer, userInfo?.company_id, referrals.length, loading, fetchAllReferrals]);

  // Refetch when company_id appears (covers race: referrals fetch ran before userInfo hydrated)
  useEffect(() => {
    if (isReferrer && accessToken && userInfo?.company_id && referrals.length === 0) {
      fetchAllReferrals();
    }
  }, [isReferrer, accessToken, userInfo?.company_id, referrals.length, fetchAllReferrals]);

  // Add new company
  const handleAddCompany = async e => {
    e.preventDefault();
    try {
      await axiosInstance.post('/referrals/companies', companyForm, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      setCompanyForm({
        name: '',
        referral_link: '',
        requires_resume: true,
        requires_phone_number: true,
        requires_essay: true
      });
      setShowAddCompany(false);
      toast.success('Referral company added successfully!');
    } catch (error) {
      console.error('Error adding referral company:', error);
      toast.error('Failed to add referral company. Please try again.');
    }
  };

  // Handle opening edit company modal
  const handleEditCompanyOpen = company => {
    setEditingCompany(company);
    // Populate form with company data
    setEditCompanyForm({
      name: company.name || '',
      image: company.image || '',
      description: company.metadata?.description || '',
      website: company.domain || '',
      industry: company.metadata?.industry || '',
      size: company.metadata?.size || '',
      headquarters: company.metadata?.headquarters || '',
      referral_link: company.referral_link || '',
      requires_resume: company.referral_materials?.resume ?? true,
      requires_phone_number: company.referral_materials?.phone_number ?? true,
      requires_essay: company.referral_materials?.essay ?? true
    });
    setShowEditCompany(true);
  };

  // Handle edit company submission
  const handleEditCompany = async e => {
    e.preventDefault();
    if (!editingCompany) return;
    try {
      await axiosInstance.patch(`/referrals/companies/${editingCompany.id}`, editCompanyForm, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      setShowEditCompany(false);
      setEditingCompany(null);
      toast.success('Company updated successfully!');
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error(error.response?.data?.detail || 'Failed to update company. Please try again.');
    }
  };

  // Handle referral update from modal
  // Handle referral update from modal
  const handleReferralUpdate = updatedReferral => {
    setReferrals(prevReferrals => prevReferrals.map(ref => ref.id === updatedReferral.id ? updatedReferral : ref));
  };

  // Handle inline status update
  const handleInlineStatusUpdate = async (referralId, newStatus) => {
    try {
      const response = await axiosInstance.patch(`/referrals/${referralId}`, {
        status: newStatus
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (response.data.referral) {
        handleReferralUpdate(response.data.referral);
      }
    } catch (error) {
      console.error('Error updating referral status:', error);
      toast.error('Failed to update status. Please try again.');
    }
  };

  // Copy to clipboard function
  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Selection handlers
  const toggleSelectItem = id => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    if (selectedItems.length === filteredReferrals.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredReferrals.map(ref => ref.id));
    }
  };

  // Delete handlers
  const handleDeleteClick = (referral = null) => {
    if (referral) {
      setItemToDelete(referral);
    } else if (selectedItems.length > 0) {
      setItemToDelete({
        bulk: true,
        count: selectedItems.length
      });
    }
    setShowDeleteModal(true);
  };
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      if (itemToDelete?.bulk) {
        // Bulk delete
        await axiosInstance.post('/referrals/bulk-delete', {
          referral_ids: selectedItems
        }, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        setSelectedItems([]);
        toast.success(`Successfully deleted ${itemToDelete.count} referral(s)`);
      } else {
        // Single delete
        await axiosInstance.delete(`/referrals/${itemToDelete.id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        toast.success('Referral deleted successfully');
      }
      fetchAllReferrals();
    } catch (error) {
      console.error('Error deleting referral(s):', error);
      toast.error(error.response?.data?.detail || 'Failed to delete');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  // Filter referrals
  const filteredReferrals = referrals.filter(ref => {
    const matchesSearch = !searchQuery || ref.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || ref.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) || ref.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || ref.status === statusFilter;
    const matchesMember = !memberFilter || ref.user_name?.toLowerCase().includes(memberFilter.toLowerCase()) || ref.user_email?.toLowerCase().includes(memberFilter.toLowerCase());

    // Only apply company filter for non-referrers
    const matchesCompany = isReferrer || !companyFilter || ref.company?.name?.toLowerCase().includes(companyFilter.toLowerCase());
    const matchesDateRange = (!dateRange.start || new Date(ref.submitted_date) >= new Date(dateRange.start)) && (!dateRange.end || new Date(ref.submitted_date) <= new Date(dateRange.end));
    return matchesSearch && matchesStatus && matchesMember && matchesCompany && matchesDateRange;
  });

  // Sorting logic
  const sortedReferrals = [...filteredReferrals].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'date':
        comparison = new Date(a.submitted_date || 0) - new Date(b.submitted_date || 0);
        break;
      case 'company':
        comparison = (a.company?.name || '').localeCompare(b.company?.name || '');
        break;
      case 'member':
        comparison = (a.user_name || '').localeCompare(b.user_name || '');
        break;
      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '');
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setMemberFilter('');
    if (!isReferrer) {
      setCompanyFilter('');
    }
    setDateRange({
      start: '',
      end: ''
    });
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = ['Company', 'Job Title', 'Member', 'Email', 'Phone Number', 'Status', 'Resume', 'Essay'];
    const rows = sortedReferrals.map(ref => [ref.company?.name || '', ref.job_title || '', ref.user_name || '', ref.user_email || '', ref.phone_number || '', ref.status || '', ref.has_resume ? 'Yes' : 'No', ref.has_essay ? 'Yes' : 'No']);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referrals_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Statistics
  const stats = {
    total: referrals.length,
    pending: referrals.filter(r => r?.status === 'Pending').length,
    approved: referrals.filter(r => r?.status === 'Approved').length,
    declined: referrals.filter(r => r?.status === 'Declined').length,
    completed: referrals.filter(r => r?.status === 'Completed').length
  };
  if (loading) {
    return <div className="flex justify-center items-center h-screen">
                <Loading />
            </div>;
  }
  return <div className="min-h-screen h-full bg-[var(--te-bg)] pb-20 md:pb-4 overflow-x-hidden">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-[var(--te-border)] bg-[var(--te-bg)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <span className="te-eyebrow">{'// referrals'}</span>
                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                                <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--te-text)] flex items-center gap-2">
                                    <PaperAirplaneIcon className="h-5 w-5 text-[var(--te-text)]" />
                                    <span>Referral management</span>
                                </h1>
                                {/* Company Pill for Referrers */}
                                {isReferrer && userInfo?.company_name && <div className="te-chip">
                                        <BuildingOfficeIcon className="h-3 w-3 md:h-4 md:w-4" />
                                        <span className="font-semibold">
                                            {userInfo.company_name}
                                        </span>
                                    </div>}

                            </div>
                            <p className="mt-1 max-w-2xl text-sm text-[var(--te-text-dim)]">
                                {isReferrer ? 'View and manage referral requests for your company' : 'Process member referral requests and manage companies'}
                            </p>
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0 overflow-x-auto">
                            {/* Column Selector */}
                            <div className="relative">
                                <button onClick={() => setShowColumnSelector(!showColumnSelector)} className="te-btn-secondary te-btn-sm gap-1 md:gap-1.5 whitespace-nowrap">

                                    <AdjustmentsHorizontalIcon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                    <span className="hidden sm:inline">Columns</span>
                                </button>
                                {showColumnSelector && <div className="absolute right-0 mt-2 w-56 te-card p-3 z-50">
                                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--te-border)]">
                                            <span className="text-left text-xs font-bold text-[var(--te-text)]">Visible Columns</span>
                                            <button onClick={() => setShowColumnSelector(false)} className="te-icon-btn">
                                                <XMarkIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-2 max-h-80 overflow-y-auto">
                                            {Object.keys(visibleColumns).map(col => <label key={col} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--te-hover)] rounded cursor-pointer">
                                                    <input type="checkbox" checked={visibleColumns[col]} onChange={() => toggleColumn(col)} className="rounded bg-[var(--te-surface)] text-[var(--te-text)] focus:ring-[var(--te-ring)]" />

                                                    <span className="text-left text-sm text-[var(--te-text-dim)] capitalize">{col.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                </label>)}
                                        </div>
                                        <div className="flex gap-2 mt-3 pt-2 border-t border-[var(--te-border)]">
                                            <button onClick={resetColumns} className="flex-1 te-btn-secondary te-btn-sm">Reset</button>
                                            <button onClick={showAllColumns} className="flex-1 te-btn-primary te-btn-sm">Show All</button>
                                        </div>
                                    </div>}

                            </div>

                            {/* Export CSV */}
                            <button onClick={exportToCSV} className="te-btn-secondary te-btn-sm gap-1 md:gap-1.5 whitespace-nowrap">

                                <ArrowDownTrayIcon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                <span className="hidden sm:inline">Export</span>
                            </button>

                            {/* Bulk Delete - Admin Only */}
                            {isAdmin && selectedItems.length > 0 && <button onClick={() => handleDeleteClick()} className="te-btn-danger te-btn-sm gap-1 md:gap-1.5 whitespace-nowrap">

                                    <TrashIcon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                    <span className="hidden sm:inline">Delete ({selectedItems.length})</span>
                                    <span className="sm:hidden">Del ({selectedItems.length})</span>
                                </button>}


                            {/* Add Company Button - Only for non-referrers */}
                            {!isReferrer && <button onClick={() => setShowAddCompany(true)} className="te-btn-primary te-btn-sm gap-1 md:gap-1.5 whitespace-nowrap">

                                    <PlusIcon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                    <span className="hidden sm:inline">Add Company</span>
                                    <span className="sm:hidden">Add</span>
                                </button>}

                        </div>
                    </div>
                </div>
            </header>

            {/* Welcome Message for Referrers */}
            {isReferrer && showWelcomeMessage && <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-4">
                    <div className="te-card max-w-md w-full border-[var(--te-border-strong)] p-5 pointer-events-auto">
                        <div className="flex items-start gap-2 md:gap-3">
                            <div className="flex-1">
                                <h3 className="font-bold text-base md:text-lg mb-1">Thank you</h3>
                                <p className="text-xs md:text-sm text-[var(--te-text-dim)]">
                                    Thank you for referring members of our community. We greatly appreciate you!
                                </p>
                            </div>
                            <button onClick={() => setShowWelcomeMessage(false)} className="te-icon-btn flex-shrink-0">

                                <XMarkIcon className="h-4 w-4 md:h-5 md:w-5" />
                            </button>
                        </div>
                    </div>
                </div>}


            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">

                {/* Tabs - Only for Lead+ users */}
                {(isLead || isAdmin) && <div className="mb-6">
                        <div className="inline-flex rounded-md border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-1 font-mono text-sm">
                            <nav className="flex gap-1" aria-label="Tabs">
                                <button onClick={() => setActiveTab('referrals')} className={`${activeTab === 'referrals' ? "bg-[var(--te-surface)] text-[var(--te-text)]" : "text-[var(--te-text-dim)] hover:text-[var(--te-text)] hover:bg-[var(--te-hover)]"} rounded px-3 py-1.5 transition-colors`}>


                                    Member Referrals
                                </button>
                                <button onClick={() => setActiveTab('companies')} className={`${activeTab === 'companies' ? "bg-[var(--te-surface)] text-[var(--te-text)]" : "text-[var(--te-text-dim)] hover:text-[var(--te-text)] hover:bg-[var(--te-hover)]"} rounded px-3 py-1.5 transition-colors`}>


                                    Companies
                                </button>
                            </nav>
                        </div>
                    </div>}


                {/* Stats + Filters for Member Referrals Tab */}
                {activeTab === 'referrals' && <div className="mb-6 te-card overflow-hidden">
                        {/* Stats Section - Mobile: Full Width, Desktop: Side by Side */}
                        <div className="flex flex-col gap-4 p-4 md:flex-row md:items-end">
                            {/* Stats - Horizontal scroll on mobile */}
                            <div className="grid grid-cols-3 overflow-hidden border border-[var(--te-border)] font-mono text-xs md:min-w-80">
                                {!isReferrer && <>
                                        <div className="border-r border-[var(--te-border)] bg-[var(--te-surface)] p-3">
                                            <ChartBarIcon className="h-3 w-3 md:h-3.5 md:w-3.5 text-[var(--te-text-dim)]" />
                                            <span className="text-[var(--te-text-dim)]">Total:</span>
                                            <span className="font-bold text-[var(--te-text)]">{stats.total}</span>
                                        </div>
                                        <div className="hidden"></div>
                                    </>}

                                <div className="border-r border-[var(--te-border)] bg-[var(--te-surface)] p-3">
                                    <ClockIcon className="h-3 w-3 md:h-3.5 md:w-3.5 text-te-gold" />
                                    <span className="text-[var(--te-text-dim)]">Pending:</span>
                                    <span className="font-bold text-te-gold">{stats.pending}</span>
                                </div>
                                <div className="hidden"></div>
                                <div className="border-r border-[var(--te-border)] bg-[var(--te-surface)] p-3">
                                    <CheckCircleIcon className="h-3 w-3 md:h-3.5 md:w-3.5 text-te-green" />
                                    <span className="text-[var(--te-text-dim)]">Completed:</span>
                                    <span className="font-bold text-te-green">{stats.completed}</span>
                                </div>
                            </div>

                            {/* Vertical Divider - Hidden on mobile and for referrers */}
                            {!isReferrer && <div className="hidden"></div>}

                            {/* Filters Section - Only for non-referrers */}
                            {!isReferrer && <div className="flex-1 grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                                    {/* Status Filter */}
                                    <div className="col-span-1 md:col-span-2">
                                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="te-select w-full">

                                            <option value="">All Status</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Declined">Declined</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    {/* Company Filter */}
                                    <div className="col-span-1 md:col-span-3">
                                        <input type="text" placeholder="Company..." value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="te-input w-full" />

                                    </div>

                                    {/* Member Filter */}
                                    <div className="col-span-1 md:col-span-3">
                                        <input type="text" placeholder="Member..." value={memberFilter} onChange={e => setMemberFilter(e.target.value)} className="te-input w-full" />

                                    </div>

                                    {/* Date Range Toggle */}
                                    <div className="col-span-2 md:col-span-1">
                                        <button onClick={() => setShowDateFilter(!showDateFilter)} className={`te-btn-secondary w-full justify-center ${showDateFilter || dateRange.start || dateRange.end ? "bg-[var(--te-surface)]" : ""}`} title="Date Range Filter">

                                            <span>📅</span>
                                            <span className="hidden sm:inline text-xs">Date</span>
                                            {(dateRange.start || dateRange.end) && <span className="text-xs">●</span>}
                                        </button>
                                    </div>
                                </div>}


                            {/* Simple Filters for Referrers - Just Status and Member */}
                            {isReferrer && <div className="flex-1 flex flex-col sm:flex-row gap-2">
                                    {/* Status Filter */}
                                    <div className="flex-1">
                                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="te-select w-full">

                                            <option value="">All Status</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>

                                    {/* Member Filter */}
                                    <div className="flex-1">
                                        <input type="text" placeholder="Search by member name..." value={memberFilter} onChange={e => setMemberFilter(e.target.value)} className="te-input w-full" />

                                    </div>
                                </div>}

                        </div>

                        {/* Date Range - Collapsible Section - Only for non-referrers */}
                        {!isReferrer && showDateFilter && <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mt-2 pt-2 border-t border-[var(--te-border)]">
                                <div className="md:col-span-6">
                                    <label className="block text-left text-xs font-medium text-[var(--te-text-dim)] mb-1">
                                        Date Range
                                    </label>
                                    <div className="flex gap-2">
                                        <input type="date" value={dateRange.start} onChange={e => setDateRange({
                ...dateRange,
                start: e.target.value
              })} placeholder="Start date" className="te-input flex-1 text-xs py-1.5" />

                                        <input type="date" value={dateRange.end} onChange={e => setDateRange({
                ...dateRange,
                end: e.target.value
              })} placeholder="End date" className="te-input flex-1 text-xs py-1.5" />

                                    </div>
                                </div>
                            </div>}


                        {/* Active Filters & Clear - Simplified for referrers */}
                        {(searchQuery || statusFilter || memberFilter || (!isReferrer && (companyFilter || dateRange.start || dateRange.end))) && <div className="mt-2 pt-2 border-t border-[var(--te-border)] flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-left text-xs text-[var(--te-text-dim)]">Active:</span>
                                    {statusFilter && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-[var(--te-surface-alt)] text-[var(--te-text)] rounded">
                                            Status: {statusFilter}
                                        </span>}

                                    {!isReferrer && companyFilter && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-[var(--te-surface-alt)] text-[var(--te-text)] rounded">
                                            Company: {companyFilter}
                                        </span>}

                                    {memberFilter && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-[var(--te-surface-alt)] text-[var(--te-text)] rounded">
                                            Member: {memberFilter}
                                        </span>}


                                    {!isReferrer && (dateRange.start || dateRange.end) && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-[var(--te-surface-alt)] text-[var(--te-text)] rounded">
                                            Date: {dateRange.start || '...'} to {dateRange.end || '...'}
                                        </span>}

                                </div>
                                <button onClick={clearAllFilters} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-te-red hover:bg-[var(--te-hover)] rounded transition-colors">

                                    <XMarkIcon className="h-3 w-3" />
                                    Clear All
                                </button>
                            </div>}

                    </div>}


                {/* Referrals Table - Desktop / Cards - Mobile */}
                {activeTab === 'referrals' && <>
                        {/* Desktop Table View - Hidden on mobile */}
                        <div className="hidden md:block">
                            {/* Hint Text */}
                            <div className="mb-2 px-1">
                                <p className="text-xs text-[var(--te-text-dim)]">
                                    💡 Click on any row to view details
                                </p>
                            </div>

                            <div className="te-card overflow-hidden transition-colors">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                                {isAdmin && <th className="px-4 py-3 w-12">
                                                        <input type="checkbox" checked={selectedItems.length === filteredReferrals.length && filteredReferrals.length > 0} onChange={toggleSelectAll} className="rounded border-[var(--te-border)] text-te-green focus:ring-[var(--te-green)] bg-[var(--te-surface-alt)]" />

                                                    </th>}

                                                {visibleColumns.company && <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">
                                                        Company
                                                    </th>}

                                                {visibleColumns.jobTitle && <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">
                                                        Position
                                                    </th>}

                                                {visibleColumns.member && <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">
                                                        Member
                                                    </th>}

                                                {visibleColumns.email && <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">
                                                        Email
                                                    </th>}

                                                {visibleColumns.phone_number && <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">
                                                        Phone Number
                                                    </th>}

                                                {visibleColumns.status && <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">
                                                        Status
                                                    </th>}

                                                {visibleColumns.resume && <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">
                                                        Resume
                                                    </th>}

                                                {visibleColumns.essay && <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">
                                                        Essay
                                                    </th>}

                                                {visibleColumns.actions && <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">
                                                        Actions
                                                    </th>}

                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--te-border)] transition-colors">
                                            {sortedReferrals.length === 0 ? <tr>
                                                    <td colSpan="9" className="px-4 py-12 text-center text-sm text-[var(--te-text-dim)]">
                                                        No referral requests found
                                                    </td>
                                                </tr> : sortedReferrals.map(ref => <tr key={ref.id} onClick={() => {
                    setSelectedReferral(ref);
                    setIsManagementModalOpen(true);
                  }} className="group hover:bg-[var(--te-hover)] transition-colors cursor-pointer">

                                                        {isAdmin && <td className="px-4 py-3 w-12" onClick={e => e.stopPropagation()}>
                                                                <input type="checkbox" checked={selectedItems.includes(ref.id)} onChange={() => toggleSelectItem(ref.id)} className="rounded border-[var(--te-border)] text-te-green focus:ring-[var(--te-green)] bg-[var(--te-surface-alt)]" />

                                                            </td>}

                                                        {visibleColumns.company && <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-8 w-8 rounded border border-[var(--te-border)] bg-[var(--te-surface)] p-0.5 flex-shrink-0">
                                                                        <img src={getCompanyLogoUrl(ref.company?.name)} alt={ref.company?.name} className="h-full w-full object-contain" onError={handleCompanyLogoError} />

                                                                    </div>
                                                                    <span className="text-left font-medium text-[var(--te-text)] text-sm">
                                                                        {ref.company?.name}
                                                                    </span>
                                                                </div>
                                                            </td>}

                                                        {visibleColumns.jobTitle && <td className="px-4 py-3">
                                                                <div>
                                                                    <div className="text-left font-semibold text-[var(--te-text)] text-sm">{ref.job_title}</div>
                                                                    <div className="text-left text-xs text-[var(--te-text-dim)]">{ref.role}</div>
                                                                </div>
                                                            </td>}

                                                        {visibleColumns.member && <td className="px-4 py-3">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-left font-medium text-[var(--te-text)] text-sm">{ref.user_name}</span>
                                                                        <button onClick={e => {
                            e.stopPropagation();
                            copyToClipboard(ref.user_name, `name-${ref.id}`);
                          }} className="p-1 rounded hover:bg-[var(--te-hover)] transition-colors opacity-0 group-hover:opacity-100" title="Copy name">

                                                                            {copiedField === `name-${ref.id}` ? <CheckCircleIcon className="h-3.5 w-3.5 text-[var(--te-text)]" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5 text-[var(--te-text-dim)]" />}

                                                                        </button>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-left text-xs text-[var(--te-text-dim)]">{ref.user_email}</span>
                                                                        <button onClick={e => {
                            e.stopPropagation();
                            copyToClipboard(ref.user_email, `email-${ref.id}`);
                          }} className="p-1 rounded hover:bg-[var(--te-hover)] transition-colors opacity-0 group-hover:opacity-100" title="Copy email">

                                                                            {copiedField === `email-${ref.id}` ? <CheckCircleIcon className="h-3.5 w-3.5 text-[var(--te-text)]" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5 text-[var(--te-text-dim)]" />}

                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </td>}

                                                        {visibleColumns.email && <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-left text-xs text-[var(--te-text-dim)]">{ref.user_email}</span>
                                                                    <button onClick={e => {
                          e.stopPropagation();
                          copyToClipboard(ref.user_email, `email-standalone-${ref.id}`);
                        }} className="p-1 rounded hover:bg-[var(--te-hover)] transition-colors opacity-0 group-hover:opacity-100" title="Copy email">

                                                                        {copiedField === `email-standalone-${ref.id}` ? <CheckCircleIcon className="h-3.5 w-3.5 text-[var(--te-text)]" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5 text-[var(--te-text-dim)]" />}

                                                                    </button>
                                                                </div>
                                                            </td>}

                                                        {visibleColumns.phone_number && <td className="px-4 py-3">
                                                                {ref.phone_number ? <div className="flex items-center gap-2">
                                                                        <span className="text-left text-sm text-[var(--te-text)]">{ref.phone_number}</span>
                                                                        <button onClick={e => {
                          e.stopPropagation();
                          copyToClipboard(ref.phone_number, `phone-${ref.id}`);
                        }} className="p-1 rounded hover:bg-[var(--te-hover)] transition-colors opacity-0 group-hover:opacity-100" title="Copy phone number">

                                                                            {copiedField === `phone-${ref.id}` ? <CheckCircleIcon className="h-3.5 w-3.5 text-[var(--te-text)]" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5 text-[var(--te-text-dim)]" />}

                                                                        </button>
                                                                    </div> : <span className="text-left text-xs text-[var(--te-text-dim)] italic">Not provided</span>}

                                                            </td>}

                                                        {visibleColumns.status && <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                                <div className="flex justify-start">
                                                                    <select value={ref.status} onChange={e => handleInlineStatusUpdate(ref.id, e.target.value)} className={`te-select text-xs font-bold py-1.5 ${(ref.status === 'Approved' || ref.status === 'Completed') ? "bg-[var(--te-green-soft)] text-te-green border-[var(--te-green)] focus:ring-[var(--te-green)]" : ref.status === 'Pending' ? 'bg-[var(--te-gold-soft)] text-te-gold border-[var(--te-gold)] focus:ring-[var(--te-gold)]' : ref.status === 'Declined' ? 'bg-[var(--te-red-soft)] text-te-red border-[var(--te-red)] focus:ring-[var(--te-red)]' : ref.status === 'Cancelled' ? "bg-[var(--te-red-soft)] text-te-red border-[var(--te-red)] focus:ring-[var(--te-red)]" : "bg-[var(--te-surface-alt)] text-[var(--te-text)] border-[var(--te-border)] focus:ring-[var(--te-ring)]"}`}>


                                                                        <option value="Pending">Pending</option>
                                                                        <option value="Completed">Completed</option>
                                                                        {!isReferrer && <option value="Declined">Declined</option>}
                                                                        {!isReferrer && <option value="Cancelled">Cancelled</option>}
                                                                    </select>
                                                                </div>
                                                            </td>}

                                                        {visibleColumns.resume && <td className="px-4 py-3">
                                                                <div className="flex justify-start">
                                                                    {ref.has_resume ? <span className="inline-block px-2 py-1 text-xs font-medium text-[var(--te-text)] bg-[var(--te-surface-alt)] rounded">
                                                                            Yes
                                                                        </span> : <span className="inline-block px-2 py-1 text-xs font-medium text-[var(--te-text-dim)] bg-[var(--te-surface-alt)] rounded">
                                                                            No
                                                                        </span>}

                                                                </div>
                                                            </td>}

                                                        {visibleColumns.essay && <td className="px-4 py-3">
                                                                <div className="flex justify-start">
                                                                    {ref.has_essay ? <span className="inline-block px-2 py-1 text-xs font-medium text-[var(--te-text)] bg-[var(--te-surface-alt)] rounded">
                                                                            Yes
                                                                        </span> : <span className="inline-block px-2 py-1 text-xs font-medium text-[var(--te-text-dim)] bg-[var(--te-surface-alt)] rounded">
                                                                            No
                                                                        </span>}

                                                                </div>
                                                            </td>}

                                                        {visibleColumns.actions && <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                                <div className="flex items-center justify-start gap-2">
                                                                    {/* Actions column available for future use */}
                                                                </div>
                                                            </td>}

                                                    </tr>)}

                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Card View - Hidden on desktop */}
                        <div className="md:hidden">
                            {/* Hint Text */}
                            <div className="mb-2 px-1">
                                <p className="text-xs text-[var(--te-text-dim)]">
                                    💡 Tap on any card to view details
                                </p>
                            </div>

                            <div className="space-y-2.5">
                                {sortedReferrals.length === 0 ? <div className="te-card p-12 text-center">
                                        <p className="text-sm text-[var(--te-text-dim)]">No referral requests found</p>
                                    </div> : sortedReferrals.map(ref => <div key={ref.id} onClick={() => {
              setSelectedReferral(ref);
              setIsManagementModalOpen(true);
            }} className="te-card-interactive overflow-hidden cursor-pointer">

                                            {/* Compact Header */}
                                            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[var(--te-surface)] border-b border-[var(--te-border)]">
                                                {visibleColumns.company && <div className="h-9 w-9 rounded border border-[var(--te-border)] bg-[var(--te-surface)] p-1 flex-shrink-0">
                                                        <img src={getCompanyLogoUrl(ref.company?.name)} alt={ref.company?.name} className="h-full w-full object-contain" onError={handleCompanyLogoError} />

                                                    </div>}

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-bold text-[var(--te-text)] truncate">
                                                        {ref.job_title}
                                                    </h3>
                                                    {visibleColumns.company && <p className="text-[11px] text-[var(--te-text-dim)] truncate">
                                                            {ref.company?.name}
                                                        </p>}

                                                </div>
                                                {/* Compact Status Badge */}
                                                {visibleColumns.status && <select value={ref.status} onChange={e => handleInlineStatusUpdate(ref.id, e.target.value)} onClick={e => e.stopPropagation()} className={`te-select text-[9px] font-bold py-1 ${(ref.status === 'Approved' || ref.status === 'Completed') ? "bg-[var(--te-green-soft)] text-te-green border-[var(--te-green)]" : ref.status === 'Pending' ? 'bg-[var(--te-gold-soft)] text-te-gold border-[var(--te-gold)]' : ref.status === 'Declined' ? 'bg-[var(--te-red-soft)] text-te-red border-[var(--te-red)]' : ref.status === 'Cancelled' ? "bg-[var(--te-red-soft)] text-te-red border-[var(--te-red)]" : "bg-[var(--te-surface-alt)] text-[var(--te-text)] border-[var(--te-border)]"}`}>


                                                        <option value="Pending">Pending</option>
                                                        <option value="Completed">Completed</option>
                                                        {!isReferrer && <option value="Declined">Declined</option>}
                                                        {!isReferrer && <option value="Cancelled">Cancelled</option>}
                                                    </select>}

                                            </div>

                                            {/* Compact Body */}
                                            <div className="px-3 py-2.5">
                                                {/* Member Info - Condensed */}
                                                {visibleColumns.member && <div className="space-y-1 mb-2.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-medium text-[var(--te-text-dim)] uppercase">Member</span>
                                                            <span className="text-xs font-semibold text-[var(--te-text)] truncate ml-2">
                                                                {ref.user_name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-medium text-[var(--te-text-dim)] uppercase">Email</span>
                                                            <span className="text-[10px] text-[var(--te-text-dim)] truncate ml-2">
                                                                {ref.user_email}
                                                            </span>
                                                        </div>
                                                    </div>}


                                                {/* Phone & Materials - Compact */}
                                                {(visibleColumns.phone_number || visibleColumns.resume || visibleColumns.essay) && <div className="flex items-center gap-3 py-2 mb-2.5 border-y border-[var(--te-border)]">
                                                        {visibleColumns.phone_number && ref.phone_number && <div className="flex items-center gap-1.5">
                                                                <span className="text-[10px] text-[var(--te-text-dim)]">📱</span>
                                                                <span className="text-[10px] font-medium text-[var(--te-text-dim)]">
                                                                    {ref.phone_number}
                                                                </span>
                                                            </div>}

                                                        {visibleColumns.resume && <div className="flex items-center gap-1">
                                                                <span className={`text-xs ${ref.has_resume ? "text-[var(--te-text)]" : "text-[var(--te-text-dim)]"}`}>
                                                                    📄
                                                                </span>
                                                                <span className="text-[9px] font-medium text-[var(--te-text-dim)]">
                                                                    {ref.has_resume ? 'Resume' : 'No Resume'}
                                                                </span>
                                                            </div>}

                                                        {visibleColumns.essay && <div className="flex items-center gap-1">
                                                                <span className={`text-xs ${ref.has_essay ? "text-[var(--te-text)]" : "text-[var(--te-text-dim)]"}`}>
                                                                    ✍️
                                                                </span>
                                                                <span className="text-[9px] font-medium text-[var(--te-text-dim)]">
                                                                    {ref.has_essay ? 'Essay' : 'No Essay'}
                                                                </span>
                                                            </div>}

                                                    </div>}


                                                {/* View Button - Removed, click card to view */}
                                            </div>
                                        </div>)}

                            </div>
                        </div>
                    </>}
                        {/* Companies Table - Only for Lead+ */}
                {activeTab === 'companies' && (isLead || isAdmin) && <div className="te-card overflow-hidden transition-colors">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                        <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">
                                            Company
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">
                                            Referral Link
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">
                                            Requirements
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--te-border)]">
                                    {companies.length === 0 ? <tr>
                                            <td colSpan="4" className="px-4 py-8 text-center text-sm text-[var(--te-text-dim)]">
                                                No companies found
                                            </td>
                                        </tr> : companies.map(company => <tr key={company.id} className="hover:bg-[var(--te-hover)] cursor-pointer transition-colors" onClick={() => {
                setSelectedCompany(company);
                setShowCompanyModal(true);
              }}>

                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {company.image && <img src={company.image} alt={company.name} className="h-8 w-8 rounded object-cover" />}


                                                        <div className="flex justify-start">
                                                            <span className="text-sm font-medium text-[var(--te-text)]">
                                                                {company.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-start">
                                                        {company.referral_link ? <a href={company.referral_link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-sm text-[var(--te-text)] hover:underline truncate max-w-xs">

                                                                {company.referral_link}
                                                            </a> : <span className="text-sm text-[var(--te-text-dim)]">-</span>}

                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-start gap-1 flex-wrap">
                                                        {company.referral_materials?.requires_resume && <span className="px-2 py-0.5 text-xs font-medium bg-[var(--te-surface-alt)] text-[var(--te-text)] rounded">
                                                                Resume
                                                            </span>}

                                                        {company.referral_materials?.requires_essay && <span className="px-2 py-0.5 text-xs font-medium bg-[var(--te-surface-alt)] text-[var(--te-text)] rounded">
                                                                Essay
                                                            </span>}

                                                        {company.referral_materials?.requires_phone_number && <span className="px-2 py-0.5 text-xs font-medium bg-[var(--te-surface-alt)] text-[var(--te-text)] rounded">
                                                                Phone
                                                            </span>}

                                                        {!company.referral_materials?.requires_resume && !company.referral_materials?.requires_essay && !company.referral_materials?.requires_phone_number && <span className="text-sm text-[var(--te-text-dim)]">None</span>}

                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex justify-start">
                                                        <button onClick={e => {
                      e.stopPropagation();
                      handleEditCompanyOpen(company);
                    }} className="text-[var(--te-text)] hover:text-[var(--te-text)]">

                                                            <PencilIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>)}

                                </tbody>
                            </table>
                        </div>
                    </div>}


                {/* Results Count */}
                {sortedReferrals.length > 0 && <div className="mt-4 font-mono text-xs text-[var(--te-text-dim)]">
                        Showing {sortedReferrals.length} of {referrals.length} referral requests
                    </div>}

            </div>

            {/* Add Company Modal */}
            {showAddCompany && <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="te-card max-w-md w-full">
                        {/* Header */}
                        <div className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] px-4 py-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BuildingOfficeIcon className="h-5 w-5" />
                                    <h2 className="font-mono text-base font-bold text-[var(--te-text)]">Add referral company</h2>
                                </div>
                                <button onClick={() => setShowAddCompany(false)} className="te-icon-btn">

                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleAddCompany} className="p-4 space-y-3">
                            {/* Company Name */}
                            <div>
                                <label className="block text-left text-xs font-semibold text-[var(--te-text)] mb-1">
                                    Company Name *
                                </label>
                                <input type="text" required value={companyForm.name} onChange={e => setCompanyForm({
              ...companyForm,
              name: e.target.value
            })} className="te-input w-full text-sm py-1.5" placeholder="e.g., Google, Microsoft" />

                                <p className="mt-1 text-left text-xs text-[var(--te-text-dim)]">
                                    Enter the full company name
                                </p>
                            </div>

                            {/* Referral Link */}
                            <div>
                                <label className="block text-left text-xs font-semibold text-[var(--te-text)] mb-1">
                                    Referral Link
                                </label>
                                <input type="url" value={companyForm.referral_link} onChange={e => setCompanyForm({
              ...companyForm,
              referral_link: e.target.value
            })} className="te-input w-full text-sm py-1.5" placeholder="https://company.com/referral-portal" />

                                <p className="mt-1 text-left text-xs text-[var(--te-text-dim)]">
                                    Optional: Direct link to company's referral portal
                                </p>
                            </div>

                            {/* Referral Requirements */}
                            <div>
                                <label className="block text-left text-xs font-semibold text-[var(--te-text)] mb-1.5">
                                    Referral Requirements
                                </label>
                                <div className="bg-[var(--te-surface-alt)] border border-[var(--te-border)] rounded p-2.5 space-y-1.5">
                                    <label className="flex items-start gap-2 cursor-pointer group hover:bg-[var(--te-hover)] p-1.5 rounded transition-colors">
                                        <input type="checkbox" checked={companyForm.requires_resume} onChange={e => setCompanyForm({
                  ...companyForm,
                  requires_resume: e.target.checked
                })} className="mt-0.5 h-4 w-4 text-[var(--te-text)] border-[var(--te-border)] rounded focus:ring-2 focus:ring-[var(--te-ring)] bg-[var(--te-surface-alt)]" />

                                        <span className="text-xs font-medium text-[var(--te-text)]">Resume</span>
                                    </label>

                                    <label className="flex items-start gap-2 cursor-pointer group hover:bg-[var(--te-hover)] p-1.5 rounded transition-colors">
                                        <input type="checkbox" checked={companyForm.requires_phone_number} onChange={e => setCompanyForm({
                  ...companyForm,
                  requires_phone_number: e.target.checked
                })} className="mt-0.5 h-4 w-4 text-[var(--te-text)] border-[var(--te-border)] rounded focus:ring-2 focus:ring-[var(--te-ring)] bg-[var(--te-surface-alt)]" />

                                        <span className="text-xs font-medium text-[var(--te-text)]">Phone Number</span>
                                    </label>

                                    <label className="flex items-start gap-2 cursor-pointer group hover:bg-[var(--te-hover)] p-1.5 rounded transition-colors">
                                        <input type="checkbox" checked={companyForm.requires_essay} onChange={e => setCompanyForm({
                  ...companyForm,
                  requires_essay: e.target.checked
                })} className="mt-0.5 h-4 w-4 text-[var(--te-text)] border-[var(--te-border)] rounded focus:ring-2 focus:ring-[var(--te-ring)] bg-[var(--te-surface-alt)]" />

                                        <span className="text-xs font-medium text-[var(--te-text)]">Referral Essay</span>
                                    </label>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-1">
                                <button type="submit" className="flex-1 te-btn-primary te-btn-sm">

                                    Add Company
                                </button>
                                <button type="button" onClick={() => setShowAddCompany(false)} className="te-btn-secondary te-btn-sm">

                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>}


            {/* View Company Modal */}
            {showCompanyModal && selectedCompany && <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="te-card max-w-2xl w-full max-h-[90vh] overflow-y-auto te-scroll">
                        {/* Header */}
                        <div className="sticky top-0 border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {selectedCompany.image && <img src={selectedCompany.image} alt={selectedCompany.name} className="h-10 w-10 rounded object-cover" />}


                                    <h2 className="font-mono text-lg font-bold text-[var(--te-text)]">{selectedCompany.name}</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => {
                handleEditCompanyOpen(selectedCompany);
                setShowCompanyModal(false);
              }} className="te-icon-btn" title="Edit Company">

                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => {
                setShowCompanyModal(false);
                setSelectedCompany(null);
              }} className="te-icon-btn">

                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Referral Link - Always show */}
                            <div>
                                <h3 className="text-left text-sm font-semibold text-[var(--te-text-dim)] mb-1">Referral Link</h3>
                                {selectedCompany.referral_link ? <a href={selectedCompany.referral_link} target="_blank" rel="noopener noreferrer" className="text-left text-sm text-[var(--te-text)] hover:underline break-all">

                                        {selectedCompany.referral_link}
                                    </a> : <p className="text-left text-sm text-[var(--te-text-dim)]">Not provided</p>}

                            </div>

                            {/* Requirements - Always show */}
                            <div>
                                <h3 className="text-left text-sm font-semibold text-[var(--te-text-dim)] mb-2">Required Materials</h3>
                                <div className="flex gap-2 flex-wrap">
                                    {selectedCompany.referral_materials?.requires_resume && <span className="px-3 py-1 text-sm font-medium bg-[var(--te-surface-alt)] text-[var(--te-text)] rounded">
                                            Resume
                                        </span>}

                                    {selectedCompany.referral_materials?.requires_essay && <span className="px-3 py-1 text-sm font-medium bg-[var(--te-surface-alt)] text-[var(--te-text)] rounded">
                                            Essay
                                        </span>}

                                    {selectedCompany.referral_materials?.requires_phone_number && <span className="px-3 py-1 text-sm font-medium bg-[var(--te-surface-alt)] text-[var(--te-text)] rounded">
                                            Phone Number
                                        </span>}

                                    {!selectedCompany.referral_materials?.requires_resume && !selectedCompany.referral_materials?.requires_essay && !selectedCompany.referral_materials?.requires_phone_number && <span className="text-left text-sm text-[var(--te-text-dim)]">No special requirements</span>}

                                </div>
                            </div>

                            {/* Description */}
                            {selectedCompany.description && <div>
                                    <h3 className="text-left text-sm font-semibold text-[var(--te-text-dim)] mb-2">Description</h3>
                                    <p className="text-left text-sm text-[var(--te-text-dim)]">{selectedCompany.description}</p>
                                </div>}


                            {/* Company Details Grid */}
                            {(selectedCompany.metadata?.industry || selectedCompany.metadata?.size || selectedCompany.metadata?.headquarters) && <div className="grid grid-cols-2 gap-4">
                                    {/* Industry */}
                                    {selectedCompany.metadata?.industry && <div>
                                            <h3 className="text-left text-sm font-semibold text-[var(--te-text-dim)] mb-1">Industry</h3>
                                            <p className="text-left text-sm text-[var(--te-text-dim)]">{selectedCompany.metadata.industry}</p>
                                        </div>}


                                    {/* Size */}
                                    {selectedCompany.metadata?.size && <div>
                                            <h3 className="text-left text-sm font-semibold text-[var(--te-text-dim)] mb-1">Company Size</h3>
                                            <p className="text-left text-sm text-[var(--te-text-dim)]">{selectedCompany.metadata.size}</p>
                                        </div>}


                                    {/* Headquarters */}
                                    {selectedCompany.metadata?.headquarters && <div>
                                            <h3 className="text-left text-sm font-semibold text-[var(--te-text-dim)] mb-1">Headquarters</h3>
                                            <p className="text-left text-sm text-[var(--te-text-dim)]">{selectedCompany.metadata.headquarters}</p>
                                        </div>}

                                </div>}

                        </div>
                    </div>
                </div>}


            {/* Edit Company Modal */}
            {showEditCompany && editingCompany && <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="te-card max-w-md w-full max-h-[90vh] overflow-y-auto te-scroll">
                        {/* Header */}
                        <div className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] px-4 py-3 sticky top-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BuildingOfficeIcon className="h-5 w-5" />
                                    <h2 className="font-mono text-base font-bold text-[var(--te-text)]">Edit Company: {editingCompany.name}</h2>
                                </div>
                                <button onClick={() => {
              setShowEditCompany(false);
              setEditingCompany(null);
            }} className="te-icon-btn">

                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleEditCompany} className="p-4 space-y-3">
                            {/* Company Name */}
                            <div>
                                <label className="block text-left text-xs font-semibold text-[var(--te-text)] mb-1">
                                    Company Name
                                </label>
                                <input type="text" value={editCompanyForm.name} onChange={e => setEditCompanyForm({
              ...editCompanyForm,
              name: e.target.value
            })} className="te-input w-full text-sm py-1.5" placeholder="e.g., Google, Microsoft" />

                            </div>

                            {/* Website */}
                            <div>
                                <label className="block text-left text-xs font-semibold text-[var(--te-text)] mb-1">
                                    Website
                                </label>
                                <input type="url" value={editCompanyForm.website} onChange={e => setEditCompanyForm({
              ...editCompanyForm,
              website: e.target.value
            })} className="te-input w-full text-sm py-1.5" placeholder="https://company.com" />

                            </div>

                            {/* Referral Link */}
                            <div>
                                <label className="block text-left text-xs font-semibold text-[var(--te-text)] mb-1">
                                    Referral Link
                                </label>
                                <input type="url" value={editCompanyForm.referral_link} onChange={e => setEditCompanyForm({
              ...editCompanyForm,
              referral_link: e.target.value
            })} className="te-input w-full text-sm py-1.5" placeholder="https://company.com/referral-portal" />

                            </div>

                            {/* Referral Requirements */}
                            <div>
                                <label className="block text-left text-xs font-semibold text-[var(--te-text)] mb-1.5">
                                    Referral Requirements
                                </label>
                                <div className="bg-[var(--te-surface-alt)] border border-[var(--te-border)] rounded p-2.5 space-y-1.5">
                                    <label className="flex items-start gap-2 cursor-pointer group hover:bg-[var(--te-hover)] p-1.5 rounded transition-colors">
                                        <input type="checkbox" checked={editCompanyForm.requires_resume} onChange={e => setEditCompanyForm({
                  ...editCompanyForm,
                  requires_resume: e.target.checked
                })} className="mt-0.5 h-4 w-4 text-[var(--te-text)] border-[var(--te-border)] rounded focus:ring-2 focus:ring-[var(--te-ring)] bg-[var(--te-surface-alt)]" />

                                        <span className="text-xs font-medium text-[var(--te-text)]">Resume</span>
                                    </label>

                                    <label className="flex items-start gap-2 cursor-pointer group hover:bg-[var(--te-hover)] p-1.5 rounded transition-colors">
                                        <input type="checkbox" checked={editCompanyForm.requires_phone_number} onChange={e => setEditCompanyForm({
                  ...editCompanyForm,
                  requires_phone_number: e.target.checked
                })} className="mt-0.5 h-4 w-4 text-[var(--te-text)] border-[var(--te-border)] rounded focus:ring-2 focus:ring-[var(--te-ring)] bg-[var(--te-surface-alt)]" />

                                        <span className="text-xs font-medium text-[var(--te-text)]">Phone Number</span>
                                    </label>

                                    <label className="flex items-start gap-2 cursor-pointer group hover:bg-[var(--te-hover)] p-1.5 rounded transition-colors">
                                        <input type="checkbox" checked={editCompanyForm.requires_essay} onChange={e => setEditCompanyForm({
                  ...editCompanyForm,
                  requires_essay: e.target.checked
                })} className="mt-0.5 h-4 w-4 text-[var(--te-text)] border-[var(--te-border)] rounded focus:ring-2 focus:ring-[var(--te-ring)] bg-[var(--te-surface-alt)]" />

                                        <span className="text-xs font-medium text-[var(--te-text)]">Referral Essay</span>
                                    </label>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-1">
                                <button type="submit" className="flex-1 te-btn-primary te-btn-sm">

                                    Update Company
                                </button>
                                <button type="button" onClick={() => {
              setShowEditCompany(false);
              setEditingCompany(null);
            }} className="te-btn-secondary te-btn-sm">

                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>}


            {/* Referral Management Modal */}
            {selectedReferral && isManagementModalOpen && <ReferralManagement referral={selectedReferral} isOpen={isManagementModalOpen} setIsOpen={setIsManagementModalOpen} onUpdate={handleReferralUpdate} />}



            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal isOpen={showDeleteModal} onClose={() => {
      setShowDeleteModal(false);
      setItemToDelete(null);
    }} onConfirm={handleDeleteConfirm} title="Delete Referral(s)" message={itemToDelete?.bulk ? `You are about to permanently delete ${itemToDelete.count} referral request(s).` : `You are about to permanently delete the referral request for "${itemToDelete?.job_title}" at ${itemToDelete?.company?.name}.`} itemCount={itemToDelete?.bulk ? itemToDelete.count : 1} isDeleting={deleting} itemType="referral" />

        </div>;
};
export default ReferralsManagement;
