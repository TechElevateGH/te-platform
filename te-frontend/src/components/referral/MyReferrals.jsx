import { useState, useEffect } from "react";
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    MinusCircleIcon,
    BriefcaseIcon,
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Company
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Job Title
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Level
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Notes
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {referrals.filter(r => r && r.status).map((referral) => (
                                <tr
                                    key={referral.id}
                                    className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 transition-all duration-150"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg border border-gray-200 bg-white p-1.5 flex items-center justify-center flex-shrink-0">
                                                <img
                                                    src={referral.company?.image}
                                                    alt={referral.company?.name}
                                                    className="h-full w-full object-contain"
                                                />
                                            </div>
                                            <span className="font-semibold text-gray-900">{referral.company?.name || 'Company'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-semibold text-gray-900">{referral.job_title}</div>
                                            {referral.job_id && (
                                                <div className="text-xs text-gray-500 mt-0.5">Job ID: {referral.job_id}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-700">{referral.role}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(referral.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">{referral.referral_date}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-2">
                                            {referral.request_note && (
                                                <div className="text-xs">
                                                    <span className="font-semibold text-gray-500">Your note:</span>
                                                    <p className="text-gray-700 mt-0.5 line-clamp-2">{referral.request_note}</p>
                                                </div>
                                            )}
                                            {referral.review_note && (
                                                <div className="text-xs">
                                                    <span className="font-semibold text-blue-600">Team review:</span>
                                                    <p className="text-blue-900 mt-0.5 line-clamp-2">{referral.review_note}</p>
                                                </div>
                                            )}
                                            {referral.resume && (
                                                <a
                                                    href={referral.resume}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                                                >
                                                    <DocumentTextIcon className="h-3.5 w-3.5" />
                                                    View Resume
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MyReferrals;
