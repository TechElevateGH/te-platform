import { useState, useEffect } from "react";
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    MinusCircleIcon,
    BriefcaseIcon,
    CalendarIcon,
    DocumentTextIcon
} from "@heroicons/react/20/solid";
import axiosInstance from "../../axiosConfig";
import { useAuth } from "../../context/AuthContext";


const MyReferrals = () => {
    const { accessToken, userId } = useAuth();
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);

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
                setReferrals(response.data.referrals || []);
            } catch (error) {
                console.error("Error fetching user referrals:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyReferrals();
    }, [userId, accessToken]);

    const getStatusBadge = (status) => {
        const statusConfig = {
            Completed: {
                bg: "bg-emerald-50",
                text: "text-emerald-700",
                border: "border-emerald-200",
                icon: CheckCircleIcon,
                label: "Completed"
            },
            Pending: {
                bg: "bg-amber-50",
                text: "text-amber-700",
                border: "border-amber-200",
                icon: ClockIcon,
                label: "Pending",
                pulse: true
            },
            Declined: {
                bg: "bg-red-50",
                text: "text-red-700",
                border: "border-red-200",
                icon: XCircleIcon,
                label: "Declined"
            },
            Canceled: {
                bg: "bg-gray-50",
                text: "text-gray-600",
                border: "border-gray-200",
                icon: MinusCircleIcon,
                label: "Canceled"
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (referrals.length === 0) {
        return (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BriefcaseIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                    No Referral Requests Yet
                </h3>
                <p className="text-sm text-gray-600 font-medium">
                    Browse companies and request referrals to get started
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                    My Referral Requests
                </h2>
                <span className="text-sm font-semibold text-gray-500">
                    {referrals.length} {referrals.length === 1 ? 'Request' : 'Requests'}
                </span>
            </div>

            <div className="grid gap-4">
                {referrals.map((referral) => (
                    <div
                        key={referral.id}
                        className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all overflow-hidden"
                    >
                        <div className="p-6">
                            {/* Header with Company and Status */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {referral.company?.image && (
                                        <img
                                            src={referral.company.image}
                                            alt={referral.company.name}
                                            className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                                        />
                                    )}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">
                                            {referral.company?.name || "Company"}
                                        </h3>
                                        <p className="text-sm font-semibold text-blue-600">
                                            {referral.job_title}
                                        </p>
                                    </div>
                                </div>
                                {getStatusBadge(referral.status)}
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <BriefcaseIcon className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-600">
                                        Level: <span className="font-bold text-gray-900">{referral.role}</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-600">
                                        Submitted: <span className="font-bold text-gray-900">{referral.referral_date}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Resume Link */}
                            {referral.resume && (
                                <div className="mb-4">
                                    <a
                                        href={referral.resume}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                    >
                                        <DocumentTextIcon className="h-4 w-4" />
                                        View Resume
                                    </a>
                                </div>
                            )}

                            {/* Request Note */}
                            {referral.request_note && (
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Your Note
                                    </p>
                                    <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                        {referral.request_note}
                                    </p>
                                </div>
                            )}

                            {/* Review Note (only if reviewed) */}
                            {referral.review_note && (
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                                        Review from Team
                                    </p>
                                    <p className="text-sm text-blue-900 font-medium leading-relaxed">
                                        {referral.review_note}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyReferrals;
