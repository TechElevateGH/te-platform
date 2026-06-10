import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getCompanyLogoUrl, handleCompanyLogoError } from '../utils';
import ReferralCreate from '../components/referral/ReferralCreate';
import ReferralManagement from '../components/referral/ReferralManagement';
import MyReferrals from '../components/referral/MyReferrals';
import SignInPrompt from '../components/_custom/Alert/SignInPrompt';
import AlertDialog from '../components/_custom/Alert/AlertDialog';
import { CheckCircleIcon, XCircleIcon, BuildingOfficeIcon, DocumentTextIcon, ArrowPathIcon, MagnifyingGlassIcon, FunnelIcon, BellAlertIcon, ArrowDownTrayIcon, ClipboardDocumentIcon } from 'icons';
import { CheckBadgeIcon, ClockIcon } from 'icons';
import { Loading } from '../components/_custom/Loading';
import axiosInstance from '../axiosConfig';

// Mock data for demo purposes
const mockReferralCompanies = [{
  id: 1,
  name: 'Microsoft',
  image: 'https://logo.clearbit.com/microsoft.com',
  referral_link: 'https://forms.microsoft.com/r/sample',
  referral_materials: {
    resume: true,
    essay: true,
    phone_number: true
  }
}, {
  id: 2,
  name: 'Amazon',
  image: 'https://logo.clearbit.com/amazon.com',
  referral_link: 'https://amazon.jobs/referral',
  referral_materials: {
    resume: true,
    essay: false,
    phone_number: true
  }
}, {
  id: 3,
  name: 'Google',
  image: 'https://logo.clearbit.com/google.com',
  referral_link: 'https://goo.gle/techelevate-referral',
  referral_materials: {
    resume: true,
    essay: true,
    phone_number: false
  }
}, {
  id: 4,
  name: 'Apple',
  image: 'https://logo.clearbit.com/apple.com',
  referral_link: '',
  referral_materials: {
    resume: true,
    essay: false,
    phone_number: false
  }
}, {
  id: 5,
  name: 'Netflix',
  image: 'https://logo.clearbit.com/netflix.com',
  referral_link: '',
  referral_materials: {
    resume: false,
    essay: false,
    phone_number: false
  }
}];
const Referrals = () => {
  const {
    userRole,
    accessToken
  } = useAuth();
  const {
    fetchReferralCompanies,
    setFetchReferralCompanies,
    referralCompanies,
    setReferralCompanies,
    resumes,
    userInfo
  } = useData();

  // Determine if user has elevated privileges (Referrer and above)
  // UserRoles: Guest=0, Member=1, Referrer=2, Volunteer=3, Lead=4, Admin=5
  const isLeadOrAdmin = userRole && parseInt(userRole) >= 2;
  const isMember = userRole && parseInt(userRole) === 1; // Only Members can request referrals
  const isReferrer = userRole && parseInt(userRole) === 2; // Referrer role

  // State for view toggle - persist across page refreshes
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('referralsViewMode') || 'companies';
  });
  const [allReferrals, setAllReferrals] = useState([]);
  const [loadingAllReferrals, setLoadingAllReferrals] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedReferralIds, setSelectedReferralIds] = useState([]);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [copiedField, setCopiedField] = useState(null); // Track which field was copied
  const [alertState, setAlertState] = useState({
    show: false,
    message: '',
    type: 'info'
  });
  const [referralCompanyId, setReferralCompanyId] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [myReferralsFeedbackCount, setMyReferralsFeedbackCount] = useState(0);

  // Memoized callback to prevent unnecessary re-renders
  const handleFeedbackCount = useCallback(count => {
    setMyReferralsFeedbackCount(count);
  }, []);
  const handleReferralAction = useCallback(company => {
    if (!isMember) return;
    if (company.referral_link) {
      window.open(company.referral_link, '_blank', 'noopener,noreferrer');
      setSelectedCompany(null);
      setReferralCompanyId(null);
    } else {
      setSelectedCompany(company);
      setReferralCompanyId(company.id);
    }
  }, [isMember, setReferralCompanyId, setSelectedCompany]);

  // Check if user has all required materials for a company
  const hasAllRequirements = useCallback(company => {
    const materials = company.referral_materials || {};

    // Check resume requirement
    if (materials.resume && resumes.length === 0) return false;

    // Check essay requirement
    if (materials.essay && (!userInfo?.referral_essay || userInfo.referral_essay.trim() === '')) return false;

    // Check phone number requirement
    if (materials.phone_number && (!userInfo?.phone_number || userInfo.phone_number.trim() === '')) return false;
    return true;
  }, [resumes, userInfo]); // Filters for All Requests view
  const [statusFilter, setStatusFilter] = useState('Pending'); // Default to Pending
  const [companyFilter, setCompanyFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState('');

  // Persist viewMode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('referralsViewMode', viewMode);
  }, [viewMode]);

  // Check if user is authenticated
  useEffect(() => {
    if (!accessToken) {
      setShowSignInPrompt(true);
    }
  }, [accessToken]);
  useEffect(() => {
    if (accessToken) {
      setFetchReferralCompanies(true);
    }
  }, [accessToken, setFetchReferralCompanies]);
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!fetchReferralCompanies) return;

      // Allow browsing mock data for guests while still supporting real data for members
      if (!accessToken) {
        setReferralCompanies(mockReferralCompanies);
        setFetchReferralCompanies(false);
        return;
      }
      try {
        const response = await axiosInstance.get('/referrals/companies', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        setReferralCompanies(response.data?.companies || []);
      } catch (error) {
        console.error('Error fetching referral companies:', error);
        setReferralCompanies(mockReferralCompanies);
      } finally {
        setFetchReferralCompanies(false);
      }
    };
    if (fetchReferralCompanies) {
      fetchCompanies();
    }
  }, [accessToken, fetchReferralCompanies, setFetchReferralCompanies, setReferralCompanies]);

  // Fetch all referrals for Lead/Admin users
  const fetchAllReferrals = useCallback(async () => {
    if (!isLeadOrAdmin) return;
    setLoadingAllReferrals(true);
    try {
      const response = await axiosInstance.get('/referrals', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      setAllReferrals(response.data.referrals || []);
    } catch (error) {
      console.error('Error fetching all referrals:', error);
      setAllReferrals([]);
    } finally {
      setLoadingAllReferrals(false);
    }
  }, [isLeadOrAdmin, accessToken]);

  // Count pending referrals (Pending status)
  const pendingReferralsCount = allReferrals.filter(r => r && r.status === 'Pending').length;

  // Apply filters to all referrals
  const filteredAllReferrals = allReferrals.filter(referral => {
    if (!referral || !referral.status) return false;

    // Status filter
    if (statusFilter && referral.status !== statusFilter) return false;

    // Company filter (case-insensitive partial match)
    if (companyFilter && !referral.company.name.toLowerCase().includes(companyFilter.toLowerCase())) return false;

    // Member filter (search in both name and email, case-insensitive)
    if (memberFilter) {
      const searchTerm = memberFilter.toLowerCase();
      const nameMatch = referral.user_name?.toLowerCase().includes(searchTerm);
      const emailMatch = referral.user_email?.toLowerCase().includes(searchTerm);
      if (!nameMatch && !emailMatch) return false;
    }
    return true;
  });

  // Handle export to Google Sheets
  const handleExportToSheets = async () => {
    setIsExporting(true);
    try {
      const response = await axiosInstance.post('/referrals/export/google-sheets', {
        referral_ids: selectedReferralIds.length > 0 ? selectedReferralIds : null
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (response.data.sheet_url) {
        // Open the sheet in a new tab
        window.open(response.data.sheet_url, '_blank');
        setAlertState({
          show: true,
          message: 'Referrals exported successfully!',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error exporting to Google Sheets:', error);
      setAlertState({
        show: true,
        message: 'Failed to export to Google Sheets. Please try again.',
        type: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle referral update from management modal
  const handleReferralUpdate = updatedReferral => {
    setAllReferrals(prev => prev.map(ref => ref.id === updatedReferral.id ? updatedReferral : ref));
  };

  // Handle inline status update
  const handleInlineStatusUpdate = async (referralId, newStatus) => {
    try {
      const response = await axiosInstance.patch(`/referrals/${referralId}`, {
        status: newStatus,
        review_note: '' // Empty note for inline updates
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
      setAlertState({
        show: true,
        message: 'Failed to update status. Please try again.',
        type: 'error'
      });
    }
  };

  // Copy to clipboard function
  const copyToClipboard = async (text, fieldId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Toggle referral selection for export
  const toggleReferralSelection = referralId => {
    setSelectedReferralIds(prev => prev.includes(referralId) ? prev.filter(id => id !== referralId) : [...prev, referralId]);
  };
  useEffect(() => {
    if (isLeadOrAdmin && viewMode === 'all-requests') {
      fetchAllReferrals();
    }
  }, [isLeadOrAdmin, viewMode, fetchAllReferrals]);

  // Helper function to check if all requirements are met
  const checkRequirementsMet = company => {
    const materials = company.referral_materials || {};
    const requirements = [];
    // Check actual resumes from context, not displayResumes which includes mock data
    if (materials.resume) requirements.push(resumes.length !== 0);
    if (materials.essay) requirements.push(userInfo?.referral_essay && userInfo.referral_essay.trim() !== '');
    if (materials.cover_letter) requirements.push(userInfo?.cover_letter && userInfo.cover_letter.trim() !== '');
    if (materials.phone_number) requirements.push(userInfo?.phone_number && userInfo.phone_number.trim() !== '');
    if (requirements.length === 0) return 'No Requirements';
    const allMet = requirements.every(req => req);
    const someMet = requirements.some(req => req);
    if (allMet) return 'Ready';
    if (someMet) return 'Incomplete';
    return 'Pending';
  };

  // Filter referral companies
  const filteredCompanies = referralCompanies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });
  return <div className="min-h-screen bg-[var(--te-bg)]">
            {/* Header */}
            <div className="sticky top-16 z-30 border-b border-[var(--te-border)] bg-[var(--te-bg)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <span className="te-eyebrow">{'// referrals'}</span>
                            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--te-text)]">
                                Referral workspace
                            </h1>
                            <p className="mt-1 max-w-2xl text-sm text-[var(--te-text-dim)]">
                                {viewMode === 'companies' ? 'Browse referral-ready companies and request support with the right materials.' : viewMode === 'my-requests' ? 'Track your referral requests, notes, and decisions in one focused queue.' : 'Review member referral requests and keep status updates moving.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* View Toggle */}
                            <div className="inline-flex rounded-md border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-1 font-mono text-sm">
                                <button onClick={() => setViewMode('companies')} className={`relative rounded px-3 py-1.5 transition-colors ${viewMode === 'companies' ? "bg-[var(--te-surface)] text-[var(--te-text)]" : "text-[var(--te-text-dim)] hover:text-[var(--te-text)] hover:bg-[var(--te-hover)]"}`}>


                                    <span className="relative z-10">Companies</span>
                                </button>
                                <button onClick={() => setViewMode('my-requests')} className={`relative rounded px-3 py-1.5 transition-colors ${viewMode === 'my-requests' ? "bg-[var(--te-surface)] text-[var(--te-text)]" : "text-[var(--te-text-dim)] hover:text-[var(--te-text)] hover:bg-[var(--te-hover)]"}`}>


                                    <span className="relative z-10">My Requests</span>
                                    {myReferralsFeedbackCount > 0 && <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-[10px] font-bold bg-rose-500 text-white rounded-md border border-[var(--te-border)] ">
                                            {myReferralsFeedbackCount}
                                        </span>}

                                </button>
                                {isLeadOrAdmin && <button onClick={() => setViewMode('all-requests')} className={`relative rounded px-3 py-1.5 transition-colors ${viewMode === 'all-requests' ? "bg-[var(--te-surface)] text-[var(--te-text)]" : "text-[var(--te-text-dim)] hover:text-[var(--te-text)] hover:bg-[var(--te-hover)]"}`}>


                                        <span className="relative z-10">All Requests</span>
                                        {pendingReferralsCount > 0 && <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-[10px] font-bold bg-rose-500 text-white rounded-md border border-[var(--te-border)] ">
                                                {pendingReferralsCount}
                                            </span>}

                                    </button>}

                            </div>

                            {viewMode === 'all-requests' && !loadingAllReferrals && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--te-surface-alt)] rounded-md border border-[var(--te-border)] transition-colors">
                                    <DocumentTextIcon className="h-3.5 w-3.5 text-[var(--te-text)]" />
                                    <div className="leading-none">
                                        <p className="text-[9px] font-semibold text-[var(--te-text)] uppercase mb-0.5 transition-colors">Total Requests</p>
                                        <p className="text-sm font-semibold text-[var(--te-text)] transition-colors">{allReferrals.length}</p>
                                    </div>
                                </div>}

                        </div>
                    </div>

                    {/* Ultra Compact Statistics Cards - Only for Companies View */}
                    {!fetchReferralCompanies && viewMode === 'companies' && referralCompanies.length > 0 && <div className="grid grid-cols-2 overflow-hidden border border-[var(--te-border)] md:grid-cols-4">
                            <div className="border-b border-r border-[var(--te-border)] bg-[var(--te-surface)] p-4 transition-colors md:border-b-0">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                        <CheckBadgeIcon className="h-3.5 w-3.5 text-[var(--te-text)]" />
                                    </div>
                                    <div className="leading-none">
                                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--te-text-dim)]">Ready</p>
                                        <p className="font-mono text-2xl font-semibold text-[var(--te-text)]">
                                            {referralCompanies.filter(c => checkRequirementsMet(c) === 'Ready').length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-b border-r border-[var(--te-border)] bg-[var(--te-surface)] p-4 transition-colors md:border-b-0">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                        <ClockIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="leading-none">
                                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Incomplete</p>
                                        <p className="font-mono text-2xl font-semibold text-[var(--te-text)]">
                                            {referralCompanies.filter(c => checkRequirementsMet(c) === 'Incomplete').length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-b border-r border-[var(--te-border)] bg-[var(--te-surface)] p-4 transition-colors md:border-b-0">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                        <ArrowPathIcon className="h-3.5 w-3.5 text-[var(--te-text-dim)]" />
                                    </div>
                                    <div className="leading-none">
                                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--te-text-dim)]">Pending</p>
                                        <p className="font-mono text-2xl font-semibold text-[var(--te-text)]">
                                            {referralCompanies.filter(c => checkRequirementsMet(c) === 'Pending').length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-b border-r border-[var(--te-border)] bg-[var(--te-surface)] p-4 transition-colors md:border-b-0">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                        <BuildingOfficeIcon className="h-3.5 w-3.5 text-[var(--te-text)]" />
                                    </div>
                                    <div className="leading-none">
                                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--te-text-dim)]">Total</p>
                                        <p className="font-mono text-2xl font-semibold text-[var(--te-text)]">{referralCompanies.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>}

                </div>
            </div>

            {/* Loading State */}
            {fetchReferralCompanies && <div className="flex justify-center items-center h-64">
                    <Loading />
                </div>}


            {/* Main Content */}
            {!fetchReferralCompanies && <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                    {/* Companies View (for all users) */}
                    {viewMode === 'companies' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Search and Filter Bar */}
                            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
                                <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                                    <div className="flex-1 relative">
                                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--te-text-dim)] pointer-events-none transition-colors" />
                                        <input type="text" placeholder="Search companies..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="te-input pl-11" />

                                    </div>
                                    {searchQuery && <button onClick={() => setSearchQuery('')} className="te-btn-secondary">

                                            <FunnelIcon className="h-4 w-4" />
                                            <span className="hidden sm:inline">Clear</span>
                                        </button>}

                                </div>
                            </div>

                            {/* Companies Table */}
                            {filteredCompanies.length === 0 ? <div className="te-card p-16 text-center transition-colors">
                                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                        <BuildingOfficeIcon className="h-10 w-10 text-[var(--te-text-dim)]" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[var(--te-text)] mb-2 transition-colors">
                                        {searchQuery ? 'No companies found' : 'No referral opportunities available'}
                                    </h3>
                                    <p className="text-[var(--te-text-dim)] max-w-sm mx-auto font-medium transition-colors">
                                        {searchQuery ? 'Try adjusting your search criteria' : 'Check back later for new referral opportunities'}
                                    </p>
                                </div> : <>
                                    {/* Desktop Table */}
                                    <div className="hidden md:block te-card overflow-hidden transition-colors">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                                        <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-[var(--te-text)] uppercase tracking-[0.16em] transition-colors">
                                                            <div className="flex items-center gap-2">
                                                                <BuildingOfficeIcon className="h-4 w-4" />
                                                                Company
                                                            </div>
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-[var(--te-text)] uppercase tracking-[0.16em] transition-colors">
                                                            <div className="flex items-center gap-2">
                                                                <DocumentTextIcon className="h-4 w-4" />
                                                                Requirements
                                                            </div>
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-[var(--te-text)] uppercase tracking-[0.16em]">
                                                            Action
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--te-border)]">
                                                    {filteredCompanies.map((company, index) => {
                    const materials = company.referral_materials || {};
                    const canRequest = isMember && (company.referral_link || hasAllRequirements(company));
                    return <tr key={company.id} onClick={() => canRequest && handleReferralAction(company)} className={`hover:bg-[var(--te-hover)] transition-colors group${canRequest ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`} title={!isMember ? "Only Members can request referrals" : !canRequest ? "Complete requirements first" : "Click to request referral"}>

                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center gap-3">
                                                                        <img src={getCompanyLogoUrl(company.name)} alt={company.name} className="h-10 w-10 rounded-md object-cover border border-[var(--te-border)] transition-colors" onError={handleCompanyLogoError} />

                                                                        <div className="font-semibold text-[var(--te-text)] transition-colors">
                                                                            {company.name}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-col gap-2">
                                                                        {materials.resume && <div className="flex items-center gap-2">
                                                                                {resumes.length !== 0 ? <CheckCircleIcon className="h-4 w-4 text-[var(--te-text)] flex-shrink-0" /> : <XCircleIcon className="h-4 w-4 text-rose-600 flex-shrink-0" />}

                                                                                <span className="text-sm font-medium text-[var(--te-text)]">Resume</span>
                                                                            </div>}

                                                                        {materials.essay && <div className="flex items-center gap-2">
                                                                                {userInfo?.referral_essay && userInfo.referral_essay.trim() !== '' ? <CheckCircleIcon className="h-4 w-4 text-[var(--te-text)] flex-shrink-0" /> : <XCircleIcon className="h-4 w-4 text-rose-600 flex-shrink-0" />}

                                                                                <span className="text-sm font-medium text-[var(--te-text)]">Referral Essay</span>
                                                                            </div>}

                                                                        {materials.cover_letter && <div className="flex items-center gap-2">
                                                                                {userInfo?.cover_letter && userInfo.cover_letter.trim() !== '' ? <CheckCircleIcon className="h-4 w-4 text-[var(--te-text)] flex-shrink-0" /> : <XCircleIcon className="h-4 w-4 text-rose-600 flex-shrink-0" />}

                                                                                <span className="text-sm font-medium text-[var(--te-text)]">Cover Letter</span>
                                                                            </div>}

                                                                        {materials.phone_number && <div className="flex items-center gap-2">
                                                                                {userInfo?.phone_number && userInfo.phone_number.trim() !== '' ? <CheckCircleIcon className="h-4 w-4 text-[var(--te-text)] flex-shrink-0" /> : <XCircleIcon className="h-4 w-4 text-rose-600 flex-shrink-0" />}

                                                                                <span className="text-sm font-medium text-[var(--te-text)]">Contact</span>
                                                                            </div>}

                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                                                    {isMember && (company.referral_link || hasAllRequirements(company)) ? <button onClick={() => handleReferralAction(company)} className="te-btn-primary te-btn-sm">

                                                                            {company.referral_link ? 'Open Referral Link' : 'Request Referral'}
                                                                        </button> : <span className="text-xs text-[var(--te-text-dim)] italic">
                                                                            {!isMember ? 'Members only' : 'Complete requirements'}
                                                                        </span>}

                                                                </td>
                                                            </tr>;
                  })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="md:hidden grid gap-px border border-[var(--te-border)] bg-[var(--te-border)]">
                                        {filteredCompanies.map(company => {
              const materials = company.referral_materials || {};
              return <div key={company.id} className={`te-card-interactive overflow-hidden${isMember ? 'cursor-pointer' : 'opacity-60'}`}>

                                                    {/* Card Header */}
                                                    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[var(--te-surface)] border-b border-[var(--te-border)]">
                                                        <img src={getCompanyLogoUrl(company.name)} alt={company.name} className="h-9 w-9 rounded border border-[var(--te-border)] bg-[var(--te-surface)] p-1 object-contain flex-shrink-0" onError={handleCompanyLogoError} />

                                                        <h3 className="text-sm font-bold text-[var(--te-text)] truncate flex-1">
                                                            {company.name}
                                                        </h3>
                                                    </div>

                                                    {/* Card Body */}
                                                    <div className="px-3 py-2.5">
                                                        {/* Requirements */}
                                                        <div className="mb-2.5">
                                                            <p className="text-[10px] font-medium text-[var(--te-text-dim)] uppercase mb-1.5">Requirements</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {materials.resume && <div className="flex items-center gap-1.5">
                                                                        {resumes.length !== 0 ? <CheckCircleIcon className="h-4 w-4 text-[var(--te-text)]" /> : <XCircleIcon className="h-4 w-4 text-rose-600" />}

                                                                        <span className="text-xs font-medium text-[var(--te-text)]">Resume</span>
                                                                    </div>}

                                                                {materials.essay && <div className="flex items-center gap-1.5">
                                                                        {userInfo?.referral_essay && userInfo.referral_essay.trim() !== '' ? <CheckCircleIcon className="h-4 w-4 text-[var(--te-text)]" /> : <XCircleIcon className="h-4 w-4 text-rose-600" />}

                                                                        <span className="text-xs font-medium text-[var(--te-text)]">Essay</span>
                                                                    </div>}

                                                                {materials.cover_letter && <div className="flex items-center gap-1.5">
                                                                        {userInfo?.cover_letter && userInfo.cover_letter.trim() !== '' ? <CheckCircleIcon className="h-4 w-4 text-[var(--te-text)]" /> : <XCircleIcon className="h-4 w-4 text-rose-600" />}

                                                                        <span className="text-xs font-medium text-[var(--te-text)]">Cover Letter</span>
                                                                    </div>}

                                                                {materials.phone_number && <div className="flex items-center gap-1.5">
                                                                        {userInfo?.phone_number && userInfo.phone_number.trim() !== '' ? <CheckCircleIcon className="h-4 w-4 text-[var(--te-text)]" /> : <XCircleIcon className="h-4 w-4 text-rose-600" />}

                                                                        <span className="text-xs font-medium text-[var(--te-text)]">Contact</span>
                                                                    </div>}

                                                            </div>
                                                        </div>

                                                        {/* Action Button */}
                                                        {isMember && (company.referral_link || hasAllRequirements(company)) ? <button onClick={() => handleReferralAction(company)} className="te-btn-primary te-btn-sm w-full justify-center">

                                                                <span>{company.referral_link ? 'Open Link' : 'Request'}</span>
                                                            </button> : <div className="py-2">
                                                                <span className="text-xs text-[var(--te-text-dim)] italic">
                                                                    {!isMember ? 'Members only' : 'Complete requirements first'}
                                                                </span>
                                                            </div>}

                                                    </div>
                                                </div>;
            })}
                                    </div>
                                </>}

                        </div>}
                            {/* My Requests View (for all authenticated users) */}
                    {viewMode === 'my-requests' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <MyReferrals onFeedbackCount={handleFeedbackCount} />
                        </div>}


                    {/* All Requests View (for Lead/Admin) */}
                    {viewMode === 'all-requests' && isLeadOrAdmin && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Filters */}
                            <div className="mb-4 te-card p-4 transition-colors">
                                <div className="flex items-center gap-4 flex-wrap">
                                    {/* Status Filter - Hidden for Referrers */}
                                    {!isReferrer && <div className="flex-1 min-w-[180px]">
                                            <label className="block text-xs font-semibold text-[var(--te-text)] mb-1.5">
                                                Status
                                            </label>
                                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-[var(--te-border)] rounded-md focus:ring-2 focus:ring-[var(--te-ring)] bg-[var(--te-surface-alt)] text-[var(--te-text)]">

                                                <option value="">All Statuses</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Declined">Declined</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </div>}


                                    {/* Company Filter */}
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-semibold text-[var(--te-text)] mb-1.5">
                                            Company
                                        </label>
                                        <input type="text" placeholder="Search company..." value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-[var(--te-border)] rounded-md focus:ring-2 focus:ring-[var(--te-ring)] bg-[var(--te-surface-alt)] text-[var(--te-text)] placeholder:text-[var(--te-text-dim)]" />

                                    </div>

                                    {/* Member Filter */}
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-semibold text-[var(--te-text)] mb-1.5">
                                            Member
                                        </label>
                                        <input type="text" placeholder="Search member..." value={memberFilter} onChange={e => setMemberFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-[var(--te-border)] rounded-md focus:ring-2 focus:ring-[var(--te-ring)] bg-[var(--te-surface-alt)] text-[var(--te-text)] placeholder:text-[var(--te-text-dim)]" />

                                    </div>

                                    {/* Clear Filters */}
                                    {(!isReferrer && statusFilter !== 'Pending' || companyFilter || memberFilter) && <div className="flex items-end">
                                            <button onClick={() => {
                setStatusFilter('Pending');
                setCompanyFilter('');
                setMemberFilter('');
              }} className="px-4 py-2 text-sm font-semibold text-[var(--te-text-dim)] hover:text-[var(--te-text)] hover:bg-[var(--te-hover)] rounded-md transition-colors">

                                                Clear Filters
                                            </button>
                                        </div>}

                                </div>
                            </div>

                            {/* Export Controls */}
                            {filteredAllReferrals.length > 0 && <>
                                    {/* Tip Banner */}
                                    <div className="mb-4 bg-[var(--te-surface-alt)] border border-amber-400 dark:border-red-500/70 rounded-md p-4 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-[var(--te-text)]" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-[var(--te-text)] mb-1">Quick Tip</h4>
                                                <p className="text-sm text-[var(--te-text)]">
                                                    You can update the status directly in the table. To leave feedback notes, click <span className="font-semibold">"View Details"</span> and add your note before updating.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4 flex items-center justify-between te-card p-4 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <BellAlertIcon className="h-5 w-5 text-[var(--te-text)]" />
                                            <span className="text-sm font-semibold text-[var(--te-text)]">
                                                {pendingReferralsCount} pending request{pendingReferralsCount !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {selectedReferralIds.length > 0 && <span className="text-sm text-[var(--te-text-dim)]">
                                                    {selectedReferralIds.length} selected
                                                </span>}

                                            <button onClick={handleExportToSheets} disabled={isExporting} className="te-btn-primary te-btn-sm">

                                                {isExporting ? <>
                                                        <div className="animate-spin h-4 w-4 border border-[var(--te-on-primary)] border-t-transparent rounded-md" />
                                                        Exporting...
                                                    </> : <>
                                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                                        Export to Sheets
                                                    </>}

                                            </button>
                                        </div>
                                    </div>
                                </>}


                            <div className="te-card overflow-hidden transition-colors">
                                {loadingAllReferrals ? <div className="flex justify-center items-center h-64">
                                        <Loading />
                                    </div> : filteredAllReferrals.length === 0 ? <div className="p-16 text-center">
                                        <div className="w-20 h-20 bg-[var(--te-surface-alt)] rounded-md flex items-center justify-center mx-auto mb-5">
                                            <DocumentTextIcon className="h-10 w-10 text-[var(--te-text-dim)]" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[var(--te-text)] mb-2">
                                            {allReferrals.length === 0 ? 'No referral requests yet' : 'No referrals match your filters'}
                                        </h3>
                                        <p className="text-[var(--te-text-dim)] max-w-sm mx-auto font-medium">
                                            {allReferrals.length === 0 ? 'Referral requests from members will appear here' : 'Try adjusting your filters to see more results'}
                                        </p>
                                    </div> : <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-[var(--te-surface)] border-b border-[var(--te-border)]">
                                                    <th className="px-3 py-4 text-left">
                                                        <input type="checkbox" checked={selectedReferralIds.length === filteredAllReferrals.length && filteredAllReferrals.length > 0} onChange={e => {
                      if (e.target.checked) {
                        setSelectedReferralIds(filteredAllReferrals.map(r => r.id));
                      } else {
                        setSelectedReferralIds([]);
                      }
                    }} className="h-4 w-4 rounded border-[var(--te-border)] text-[var(--te-text)] focus:ring-[var(--te-ring)] bg-[var(--te-surface-alt)]" />

                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-[var(--te-text)] uppercase tracking-[0.16em]">
                                                        Company
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-[var(--te-text)] uppercase tracking-[0.16em]">
                                                        Position
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-[var(--te-text)] uppercase tracking-[0.16em]">
                                                        Member
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-[var(--te-text)] uppercase tracking-[0.16em]">
                                                        Contact
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-[var(--te-text)] uppercase tracking-[0.16em]">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-[var(--te-text)] uppercase tracking-[0.16em]">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--te-border)]">
                                                {filteredAllReferrals.map(referral => <tr key={referral.id} className="group hover:bg-[var(--te-hover)] transition-colors">

                                                        <td className="px-3 py-4">
                                                            <input type="checkbox" checked={selectedReferralIds.includes(referral.id)} onChange={() => toggleReferralSelection(referral.id)} className="h-4 w-4 rounded border-[var(--te-border)] text-[var(--te-text)] focus:ring-[var(--te-ring)] bg-[var(--te-surface-alt)]" />

                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-md border border-[var(--te-border)] bg-[var(--te-surface)] p-1.5 flex items-center justify-center flex-shrink-0">
                                                                    <img src={getCompanyLogoUrl(referral.company?.name)} alt={referral.company?.name} className="h-full w-full object-contain" onError={handleCompanyLogoError} />

                                                                </div>
                                                                <span className="font-semibold text-[var(--te-text)]">{referral.company.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <div className="font-semibold text-[var(--te-text)]">{referral.job_title}</div>
                                                                <div className="text-xs text-[var(--te-text-dim)]">{referral.role}</div>
                                                                {referral.job_id && <div className="text-xs text-[var(--te-text)] mt-0.5 font-mono">ID: {referral.job_id}</div>}

                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-[var(--te-text)] text-sm">{referral.user_name}</span>
                                                                    <button onClick={() => copyToClipboard(referral.user_name, `name-${referral.id}`)} className="p-1 rounded hover:bg-[var(--te-hover)] transition-colors opacity-0 group-hover:opacity-100" title="Copy name">

                                                                        {copiedField === `name-${referral.id}` ? <CheckCircleIcon className="h-3.5 w-3.5 text-[var(--te-text)]" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5 text-[var(--te-text-dim)]" />}

                                                                    </button>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-[var(--te-text-dim)]">{referral.user_email}</span>
                                                                    <button onClick={() => copyToClipboard(referral.user_email, `email-${referral.id}`)} className="p-1 rounded hover:bg-[var(--te-hover)] transition-colors opacity-0 group-hover:opacity-100" title="Copy email">

                                                                        {copiedField === `email-${referral.id}` ? <CheckCircleIcon className="h-3.5 w-3.5 text-[var(--te-text)]" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5 text-[var(--te-text-dim)]" />}

                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {referral.phone_number ? <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-[var(--te-text)]">{referral.phone_number}</span>
                                                                    <button onClick={() => copyToClipboard(referral.phone_number, `contact-${referral.id}`)} className="p-1 rounded hover:bg-[var(--te-hover)] transition-colors opacity-0 group-hover:opacity-100" title="Copy contact">

                                                                        {copiedField === `contact-${referral.id}` ? <CheckCircleIcon className="h-3.5 w-3.5 text-[var(--te-text)]" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5 text-[var(--te-text-dim)]" />}

                                                                    </button>
                                                                </div> : <span className="text-xs text-[var(--te-text-dim)] italic">Not provided</span>}

                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <select value={referral.status} onChange={e => handleInlineStatusUpdate(referral.id, e.target.value)} className={`text-xs font-bold rounded-md border px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${referral.status === 'Completed' ? "bg-[var(--te-surface-alt)] text-[var(--te-text)] border-[var(--te-border)] focus:ring-[var(--te-ring)]" : referral.status === 'Pending' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 focus:ring-amber-500' : referral.status === 'Declined' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700 focus:ring-rose-500' : referral.status === 'Cancelled' ? "bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] border-[var(--te-border)] focus:ring-[var(--te-ring)]" : "bg-[var(--te-surface-alt)] text-[var(--te-text)] border-[var(--te-border)] focus:ring-[var(--te-ring)]"}`}>


                                                                <option value="Pending">Pending</option>
                                                                <option value="Completed">Completed</option>
                                                                <option value="Declined">Declined</option>
                                                                <option value="Cancelled">Cancelled</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button onClick={() => {
                      setSelectedReferral(referral);
                      setIsManagementModalOpen(true);
                    }} className="te-btn-secondary te-btn-sm">

                                                                View Details
                                                            </button>
                                                        </td>
                                                    </tr>)}
                                            </tbody>
                                        </table>
                                    </div>}

                            </div>
                        </div>}

                </div>}


            {/* Referral Create Modal */}
            {referralCompanyId && selectedCompany && <ReferralCreate company={selectedCompany} setReferralCompanyId={setReferralCompanyId} />}



            {/* Referral Management Modal (for Lead/Admin) */}
            {selectedReferral && isManagementModalOpen && <ReferralManagement referral={selectedReferral} isOpen={isManagementModalOpen} setIsOpen={setIsManagementModalOpen} onUpdate={handleReferralUpdate} />}



            <SignInPrompt isOpen={showSignInPrompt} onClose={() => setShowSignInPrompt(false)} />


            <AlertDialog isOpen={alertState.show} onClose={() => setAlertState({
      ...alertState,
      show: false
    })} title={alertState.type === 'error' ? 'Error' : alertState.type === 'success' ? 'Success' : 'Info'} message={alertState.message} type={alertState.type} />

        </div>;
};
export default Referrals;
