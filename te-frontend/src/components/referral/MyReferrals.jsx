import { useState, useEffect } from "react";
import { ClockIcon, CheckCircleIcon, XCircleIcon, MinusCircleIcon, BriefcaseIcon } from "icons";
import axiosInstance from "../../axiosConfig";
import { useAuth } from "../../context/AuthContext";
import { getCompanyLogoUrl, handleCompanyLogoError } from "../../utils";
import ConfirmDialog from "../_custom/Alert/ConfirmDialog";
import AlertDialog from "../_custom/Alert/AlertDialog";
const MyReferrals = ({
  onFeedbackCount
}) => {
  const {
    accessToken,
    userId
  } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' means Pending + In Review
  const [seenFeedback, setSeenFeedback] = useState(new Set());
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [referralToCancel, setReferralToCancel] = useState(null);
  const [alertState, setAlertState] = useState({
    show: false,
    message: '',
    type: 'error'
  });

  // Load seen feedback from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`seenReferralFeedback_${userId}`);
    if (saved) {
      setSeenFeedback(new Set(JSON.parse(saved)));
    }
  }, [userId]);
  useEffect(() => {
    const fetchMyReferrals = async () => {
      if (!userId || !accessToken) return;
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/referrals?user_id=${userId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        const fetchedReferrals = response.data.referrals || [];
        setReferrals(fetchedReferrals);
      } catch (error) {
        console.error("Error fetching user referrals:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyReferrals();
  }, [userId, accessToken]); // Remove onFeedbackCount from dependencies

  // Update feedback count whenever referrals or seenFeedback changes
  useEffect(() => {
    if (onFeedbackCount && referrals.length > 0) {
      // Only count unseen feedback
      const unseenFeedbackCount = referrals.filter(r => r.review_note && r.review_note.trim() && !seenFeedback.has(r.id)).length;
      onFeedbackCount(unseenFeedbackCount);
    }
  }, [referrals, seenFeedback, onFeedbackCount]);
  const handleReferralClick = referral => {
    setSelectedReferral(referral);

    // Mark this referral's feedback as seen if it has feedback
    if (referral.review_note && referral.review_note.trim() && !seenFeedback.has(referral.id)) {
      const newSeen = new Set(seenFeedback);
      newSeen.add(referral.id);
      setSeenFeedback(newSeen);
      localStorage.setItem(`seenReferralFeedback_${userId}`, JSON.stringify([...newSeen]));
    }
  };
  const handleCancelReferral = async referralId => {
    setReferralToCancel(referralId);
    setShowCancelConfirm(true);
  };
  const confirmCancelReferral = async () => {
    setCancellingId(referralToCancel);
    try {
      await axiosInstance.patch(`/referrals/${referralToCancel}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      // Refresh the referrals list
      const response = await axiosInstance.get(`/referrals?user_id=${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (response.data?.referrals) {
        setReferrals(response.data.referrals);
      }
    } catch (error) {
      console.error("Error cancelling referral:", error);
      setAlertState({
        show: true,
        message: error.response?.data?.detail || "Failed to cancel referral request",
        type: 'error'
      });
    } finally {
      setCancellingId(null);
    }
  };
  const getStatusBadge = status => {
    const statusConfig = {
      Completed: {
        bg: "bg-[var(--te-surface-alt)]",
        text: "text-[var(--te-text)]",
        border: "border-[var(--te-border)]",
        icon: CheckCircleIcon,
        label: "Completed"
      },
      Pending: {
        bg: "bg-amber-50 dark:bg-amber-900/30",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-200 dark:border-amber-700",
        icon: ClockIcon,
        label: "Pending",
        pulse: true
      },
      Declined: {
        bg: "bg-red-50 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-200 dark:border-red-700",
        icon: XCircleIcon,
        label: "Declined"
      },
      Cancelled: {
        bg: "bg-[var(--te-surface-alt)]",
        text: "text-[var(--te-text-dim)]",
        border: "border-[var(--te-border)]",
        icon: MinusCircleIcon,
        label: "Cancelled"
      }
    };
    const config = statusConfig[status] || statusConfig.Pending;
    const Icon = config.icon;
    return <span className={`te-chip ${config.bg} ${config.text} ${config.border} ${config.pulse ? 'animate-pulse' : ''}`}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                {config.label}
            </span>;
  };
  if (loading) {
    return <div className="te-card p-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-md border border-[var(--te-border)] border-t-[var(--te-text)]"></div>
                <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-[var(--te-text-dim)]">Loading referrals</p>
            </div>;
  }
  if (referrals.length === 0) {
    return <div className="te-card p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                    <BriefcaseIcon className="h-10 w-10 text-[var(--te-text-dim)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--te-text)] mb-2">
                    No referral requests yet
                </h3>
                <p className="text-sm text-[var(--te-text-dim)] font-medium">
                    Browse companies and request referrals to get started
                </p>
            </div>;
  }

  // Filter referrals by status
  const filteredReferrals = statusFilter === 'active' ? referrals.filter(r => (r.status === 'Pending' || r.status === 'In Review')) : statusFilter ? referrals.filter(r => r.status === statusFilter) : referrals;
  return <div className="space-y-5">
            {/* Status Filter */}
            <div className="flex flex-col gap-3 border border-[var(--te-border)] bg-[var(--te-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="te-eyebrow">{'// status'}</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="te-select">

                    <option value="active">Active (Pending + In Review)</option>
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Review">In Review</option>
                    <option value="Completed">Completed</option>
                    <option value="Declined">Declined</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
                <span className="font-mono text-xs text-[var(--te-text-dim)]">
                    Showing {filteredReferrals.length} of {referrals.length} requests
                </span>
            </div>

            <div className="te-card overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-[var(--te-text)] uppercase tracking-[0.16em]">
                                    Company
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-[var(--te-text)] uppercase tracking-[0.16em]">
                                    Job Title
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-[var(--te-text)] uppercase tracking-[0.16em]">
                                    Level
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-[var(--te-text)] uppercase tracking-[0.16em]">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-[var(--te-text)] uppercase tracking-[0.16em]">
                                    Date
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-[var(--te-text)] uppercase tracking-[0.16em]">
                                    Notes
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-[var(--te-text)] uppercase tracking-[0.16em]">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--te-border)]">
                            {filteredReferrals.filter(r => r && r.status).map(referral => <tr key={referral.id} onClick={() => handleReferralClick(referral)} className="hover:bg-[var(--te-hover)] transition-colors cursor-pointer">

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-md border border-[var(--te-border)] bg-[var(--te-surface)] p-1.5 flex items-center justify-center flex-shrink-0">
                                                <img src={getCompanyLogoUrl(referral.company?.name)} alt={referral.company?.name} className="h-full w-full object-contain" onError={handleCompanyLogoError} />

                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-[var(--te-text)]">{referral.company?.name || 'Company'}</span>
                                                {referral.review_note && !seenFeedback.has(referral.id) && <span className="inline-flex rounded-md h-2 w-2 bg-rose-500"></span>}

                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-semibold text-[var(--te-text)]">{referral.job_title}</div>
                                            {referral.job_id && <div className="text-xs text-[var(--te-text-dim)] mt-0.5">Job ID: {referral.job_id}</div>}

                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-[var(--te-text)]">{referral.role}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-start">
                                            {getStatusBadge(referral.status)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-[var(--te-text-dim)]">{referral.referral_date}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-[100px]">
                                            {referral.request_note || referral.review_note ? <div className="text-xs text-[var(--te-text-dim)]">
                                                    <span className="truncate block">
                                                        {(referral.request_note || referral.review_note).substring(0, 10)}
                                                        {(referral.request_note || referral.review_note).length > 10 ? '...' : ''}
                                                    </span>
                                                </div> : <span className="text-xs text-[var(--te-text-dim)] italic">—</span>}

                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-start">
                                            {referral.status === 'Pending' && <button onClick={e => {
                    e.stopPropagation();
                    handleCancelReferral(referral.id);
                  }} disabled={cancellingId === referral.id} className="te-btn-danger te-btn-sm">

                                                    <XCircleIcon className="h-3.5 w-3.5" />
                                                    {cancellingId === referral.id ? 'Cancelling...' : 'Cancel'}
                                                </button>}

                                        </div>
                                    </td>
                                </tr>)}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Referral Details Modal */}
            {selectedReferral && <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReferral(null)}>
                    <div className="te-card max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Header with Company Info */}
                        <div className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] px-6 py-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-md border border-[var(--te-border)] bg-[var(--te-surface)] p-2 flex items-center justify-center ">
                                        <img src={getCompanyLogoUrl(selectedReferral.company?.name)} alt={selectedReferral.company?.name} className="h-full w-full object-contain" onError={handleCompanyLogoError} />

                                    </div>
                                    <div>
                                        <h3 className="font-display text-xl font-bold text-[var(--te-text)] mb-1">{selectedReferral.company?.name}</h3>
                                        <p className="text-sm text-[var(--te-text-dim)] font-medium">{selectedReferral.job_title}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedReferral(null)} className="te-icon-btn text-[var(--te-text-dim)] hover:opacity-100 hover:bg-[var(--te-hover)]">

                                    <XCircleIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                {getStatusBadge(selectedReferral.status)}
                                <span className="text-xs text-[var(--te-text-dim)] font-medium">Submitted {selectedReferral.referral_date}</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto te-scroll">
                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="te-panel p-4">
                                    <p className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wider mb-2">Level</p>
                                    <p className="text-base font-bold text-[var(--te-text)]">{selectedReferral.role}</p>
                                </div>
                                {selectedReferral.phone_number && <div className="te-panel p-4">
                                        <p className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wider mb-2">Contact</p>
                                        <p className="text-sm font-semibold text-[var(--te-text)] break-all">{selectedReferral.phone_number}</p>
                                    </div>}

                            </div>

                            {selectedReferral.job_id && <div className="te-panel p-4">
                                    <p className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wider mb-2">Job ID</p>
                                    <p className="text-sm font-mono text-[var(--te-text)]">{selectedReferral.job_id}</p>
                                </div>}


                            {/* Documents */}
                            {(selectedReferral.resume || selectedReferral.essay) && <div>
                                    <p className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wider mb-3">Documents</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedReferral.resume && <a href={selectedReferral.resume} target="_blank" rel="noopener noreferrer" className="te-btn-secondary justify-center">

                                                <BriefcaseIcon className="h-5 w-5" />
                                                Resume
                                            </a>}

                                        {selectedReferral.essay && <a href={selectedReferral.essay} target="_blank" rel="noopener noreferrer" className="te-btn-secondary justify-center">

                                                <BriefcaseIcon className="h-5 w-5" />
                                                Essay
                                            </a>}

                                    </div>
                                </div>}


                            {/* Notes */}
                            {selectedReferral.request_note && <div>
                                    <p className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wider mb-3">Your Note</p>
                                    <div className="te-panel p-4">
                                        <p className="text-sm text-[var(--te-text-dim)] leading-relaxed">{selectedReferral.request_note}</p>
                                    </div>
                                </div>}


                            {selectedReferral.review_note && <div>
                                    <p className="text-xs font-semibold text-[var(--te-text)] uppercase tracking-wider mb-3">Team Feedback</p>
                                    <div className="bg-[var(--te-surface-alt)] rounded-md p-4 border border-[var(--te-border)]">
                                        <p className="text-sm text-[var(--te-text)] leading-relaxed">{selectedReferral.review_note}</p>
                                    </div>
                                </div>}


                            {/* Cancel Button */}
                            {selectedReferral.status === 'Pending' && <button onClick={e => {
            e.stopPropagation();
            setSelectedReferral(null);
            handleCancelReferral(selectedReferral.id);
          }} disabled={cancellingId === selectedReferral.id} className="w-full te-btn-danger">

                                    <XCircleIcon className="h-5 w-5" />
                                    {cancellingId === selectedReferral.id ? 'Cancelling...' : 'Cancel Request'}
                                </button>}

                        </div>
                    </div>
                </div>}


            {/* Confirm Dialog */}
            <ConfirmDialog isOpen={showCancelConfirm} onClose={() => setShowCancelConfirm(false)} onConfirm={confirmCancelReferral} title="Cancel Referral Request" message="Are you sure you want to cancel this referral request?" confirmText="OK" cancelText="Cancel" type="warning" />


            {/* Alert Dialog */}
            <AlertDialog isOpen={alertState.show} onClose={() => setAlertState({
      ...alertState,
      show: false
    })} title={alertState.type === 'error' ? 'Error' : 'Success'} message={alertState.message} type={alertState.type} />

        </div>;
};
export default MyReferrals;
