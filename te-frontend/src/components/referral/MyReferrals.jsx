import { useState, useEffect } from "react";
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    MinusCircleIcon,
    BriefcaseIcon
} from "@heroicons/react/20/solid";
import axiosInstance from "../../axiosConfig";
import { useAuth } from "../../context/AuthContext";


const MyReferrals = ({ onFeedbackCount }) => {
    const { accessToken, userId } = useAuth();
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [statusFilter, setStatusFilter] = useState('active'); // 'active' means Pending + In Review
    const [seenFeedback, setSeenFeedback] = useState(new Set());

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
                        Authorization: `Bearer ${accessToken}`,
                    },
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
            const unseenFeedbackCount = referrals.filter(r =>
                r.review_note && r.review_note.trim() && !seenFeedback.has(r.id)
            ).length;
            console.log('MyReferrals - Total referrals:', referrals.length);
            console.log('MyReferrals - Unseen feedback count:', unseenFeedbackCount);
            onFeedbackCount(unseenFeedbackCount);
        }
    }, [referrals, seenFeedback, onFeedbackCount]);

    const handleReferralClick = (referral) => {
        setSelectedReferral(referral);

        // Mark this referral's feedback as seen if it has feedback
        if (referral.review_note && referral.review_note.trim() && !seenFeedback.has(referral.id)) {
            const newSeen = new Set(seenFeedback);
            newSeen.add(referral.id);
            setSeenFeedback(newSeen);
            localStorage.setItem(`seenReferralFeedback_${userId}`, JSON.stringify([...newSeen]));
        }
    };

    const handleCancelReferral = async (referralId) => {
        if (!window.confirm('Are you sure you want to cancel this referral request?')) {
            return;
        }

        setCancellingId(referralId);
        try {
            await axiosInstance.patch(
                `/referrals/${referralId}/cancel`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            // Refresh the referrals list
            const response = await axiosInstance.get(`/referrals?user_id=${userId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (response.data?.referrals) {
                setReferrals(response.data.referrals);
            }
        } catch (error) {
            console.error("Error cancelling referral:", error);
            alert(error.response?.data?.detail || "Failed to cancel referral request");
        } finally {
            setCancellingId(null);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            Completed: {
                bg: "bg-emerald-50 dark:bg-emerald-900/30",
                text: "text-emerald-700 dark:text-emerald-300",
                border: "border-emerald-200 dark:border-emerald-700",
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
                bg: "bg-gray-50 dark:bg-gray-700",
                text: "text-gray-600 dark:text-gray-300",
                border: "border-gray-200 dark:border-gray-600",
                icon: MinusCircleIcon,
                label: "Cancelled"
            }
        };

        const config = statusConfig[status] || statusConfig.Pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border} ${config.pulse ? 'animate-pulse' : ''}`}>
                <Icon className="h-4 w-4" />
                {config.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );
    }

    if (referrals.length === 0) {
        return (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BriefcaseIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    No Referral Requests Yet
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Browse companies and request referrals to get started
                </p>
            </div>
        );
    }

    // Filter referrals by status
    const filteredReferrals = statusFilter === 'active'
        ? referrals.filter(r => r.status === 'Pending' || r.status === 'In Review')
        : statusFilter
            ? referrals.filter(r => r.status === statusFilter)
            : referrals;

    return (
        <div className="space-y-4">
            {/* Status Filter */}
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status:</label>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                    <option value="active">Active (Pending + In Review)</option>
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Review">In Review</option>
                    <option value="Completed">Completed</option>
                    <option value="Declined">Declined</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    Showing {filteredReferrals.length} of {referrals.length} requests
                </span>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700/50 overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                    Company
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                    Job Title
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                    Level
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                    Notes
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredReferrals.filter(r => r && r.status).map((referral) => (
                                <tr
                                    key={referral.id}
                                    onClick={() => handleReferralClick(referral)}
                                    className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-all duration-150 cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1.5 flex items-center justify-center flex-shrink-0">
                                                <img
                                                    src={referral.company?.image}
                                                    alt={referral.company?.name}
                                                    className="h-full w-full object-contain"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900 dark:text-white">{referral.company?.name || 'Company'}</span>
                                                {referral.review_note && !seenFeedback.has(referral.id) && (
                                                    <span className="inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white">{referral.job_title}</div>
                                            {referral.job_id && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Job ID: {referral.job_id}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-700 dark:text-gray-200">{referral.role}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(referral.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600 dark:text-gray-300">{referral.referral_date}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-[100px]">
                                            {referral.request_note || referral.review_note ? (
                                                <div className="text-xs text-gray-700 dark:text-gray-300">
                                                    <span className="truncate block">
                                                        {(referral.request_note || referral.review_note).substring(0, 10)}
                                                        {(referral.request_note || referral.review_note).length > 10 ? '...' : ''}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 dark:text-gray-500 italic">—</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {referral.status === 'Pending' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCancelReferral(referral.id);
                                                }}
                                                disabled={cancellingId === referral.id}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <XCircleIcon className="h-3.5 w-3.5" />
                                                {cancellingId === referral.id ? 'Cancelling...' : 'Cancel'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Referral Details Modal */}
            {selectedReferral && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReferral(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Header with Company Info */}
                        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-700 dark:to-cyan-700 px-6 py-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-xl border-2 border-white/20 bg-white dark:bg-gray-900 p-2 flex items-center justify-center shadow-lg">
                                        <img
                                            src={selectedReferral.company?.image}
                                            alt={selectedReferral.company?.name}
                                            className="h-full w-full object-contain"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">{selectedReferral.company?.name}</h3>
                                        <p className="text-sm text-white/95 font-medium">{selectedReferral.job_title}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedReferral(null)}
                                    className="text-white/70 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
                                >
                                    <XCircleIcon className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                {getStatusBadge(selectedReferral.status)}
                                <span className="text-xs text-white/80 font-medium">Submitted {selectedReferral.referral_date}</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-900/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Level</p>
                                    <p className="text-base font-bold text-gray-900 dark:text-white">{selectedReferral.role}</p>
                                </div>
                                {selectedReferral.contact && (
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-900/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Contact</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">{selectedReferral.contact}</p>
                                    </div>
                                )}
                            </div>

                            {selectedReferral.job_id && (
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-900/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Job ID</p>
                                    <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedReferral.job_id}</p>
                                </div>
                            )}

                            {/* Documents */}
                            {(selectedReferral.resume || selectedReferral.essay) && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Documents</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedReferral.resume && (
                                            <a
                                                href={selectedReferral.resume}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-2 border-blue-200 dark:border-blue-700 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20"
                                            >
                                                <BriefcaseIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                Resume
                                            </a>
                                        )}
                                        {selectedReferral.essay && (
                                            <a
                                                href={selectedReferral.essay}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 border-2 border-purple-200 dark:border-purple-700 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/20"
                                            >
                                                <BriefcaseIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                Essay
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedReferral.request_note && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Your Note</p>
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-900/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selectedReferral.request_note}</p>
                                    </div>
                                </div>
                            )}

                            {selectedReferral.review_note && (
                                <div>
                                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Team Feedback</p>
                                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800 shadow-sm">
                                        <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">{selectedReferral.review_note}</p>
                                    </div>
                                </div>
                            )}

                            {/* Cancel Button */}
                            {selectedReferral.status === 'Pending' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedReferral(null);
                                        handleCancelReferral(selectedReferral.id);
                                    }}
                                    disabled={cancellingId === selectedReferral.id}
                                    className="w-full group flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 border-2 border-red-200 dark:border-red-700 rounded-xl transition-all hover:shadow-lg hover:shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <XCircleIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                    {cancellingId === selectedReferral.id ? 'Cancelling...' : 'Cancel Request'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyReferrals;
