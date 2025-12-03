import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axiosInstance from '../axiosConfig';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { accessToken, userId, userRole } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [lastChecked, setLastChecked] = useState(null);
    const [dismissedIds, setDismissedIds] = useState(new Set());

    const userRoleInt = userRole ? parseInt(userRole) : 0;
    const isMember = userRoleInt === 1;
    const isVolunteerOrAbove = userRoleInt >= 3;

    // Load dismissed notification IDs from localStorage
    useEffect(() => {
        if (userId) {
            const stored = localStorage.getItem(`dismissedNotifications_${userId}`);
            if (stored) {
                try {
                    setDismissedIds(new Set(JSON.parse(stored)));
                } catch (e) {
                    console.error('Error loading dismissed notifications:', e);
                }
            }
        }
    }, [userId]);

    // Save dismissed notification IDs to localStorage
    const saveDismissedIds = (ids) => {
        if (userId) {
            localStorage.setItem(`dismissedNotifications_${userId}`, JSON.stringify([...ids]));
        }
    };

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        if (!accessToken) return;

        try {
            // For members: check their resume reviews for updates
            if (isMember) {
                const response = await axiosInstance.get('/resumes/reviews', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: { user_id: userId }
                });

                const myReviews = response.data?.reviews || [];
                const lastCheck = lastChecked ? new Date(lastChecked) : new Date(0);

                // Find reviews with new feedback or status changes since last check
                const newNotifications = myReviews
                    .filter(review => {
                        // Check if review was updated after our last check
                        const updateTime = review.updated_at
                            ? new Date(review.updated_at)
                            : review.review_date
                                ? new Date(review.review_date)
                                : review.assigned_date
                                    ? new Date(review.assigned_date)
                                    : null;

                        if (!updateTime) return false;

                        // Only show notification if there's actual content (feedback or non-pending status)
                        const hasUpdate = review.feedback || review.status !== 'Pending';

                        return updateTime > lastCheck && hasUpdate;
                    })
                    .map(review => ({
                        id: `review_${review.id}`,
                        type: 'review_update',
                        title: 'Resume Review Updated',
                        message: review.feedback
                            ? `Your review for "${review.job_title}" has new feedback`
                            : `Your review for "${review.job_title}" status changed to ${review.status}`,
                        link: '/workspace/resume-reviews',
                        timestamp: review.updated_at || review.review_date || review.assigned_date,
                        read: false
                    }))
                    .filter(notification => !dismissedIds.has(notification.id)); // Filter out dismissed

                setNotifications(prev => {
                    // Remove old review_update notifications and add new ones
                    const filtered = prev.filter(n => n.type !== 'review_update');
                    const updated = [...newNotifications, ...filtered];
                    // Update unread count based on all unread notifications
                    setUnreadCount(updated.filter(n => !n.read).length);
                    return updated;
                });

                // For members: check referral request updates
                const referralsResponse = await axiosInstance.get('/referrals', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: { user_id: userId }
                });

                const myReferrals = referralsResponse.data?.referrals || [];
                const referralNotifications = myReferrals
                    .filter(referral => {
                        const feedbackDate = referral.feedback_date
                            ? new Date(referral.feedback_date)
                            : null;

                        if (!feedbackDate) return false;

                        const lastCheck = lastChecked ? new Date(lastChecked) : new Date(0);

                        // Show notification if there's feedback or status changed to Completed/Declined
                        const hasUpdate = referral.review_note ||
                            referral.status === 'Completed' ||
                            referral.status === 'Declined';

                        return feedbackDate > lastCheck && hasUpdate;
                    })
                    .map(referral => ({
                        id: `referral_${referral.id}`,
                        type: 'referral_update',
                        title: 'Referral Request Updated',
                        message: referral.review_note
                            ? `Your referral request for "${referral.job_title}" at ${referral.company?.name} has feedback`
                            : `Your referral request for "${referral.job_title}" at ${referral.company?.name} status changed to ${referral.status}`,
                        link: '/workspace/referrals',
                        timestamp: referral.feedback_date || referral.date,
                        read: false
                    }))
                    .filter(notification => !dismissedIds.has(notification.id));

                setNotifications(prev => {
                    // Remove old referral_update notifications and add new ones
                    const filtered = prev.filter(n => n.type !== 'referral_update');
                    const updated = [...referralNotifications, ...filtered];
                    setUnreadCount(updated.filter(n => !n.read).length);
                    return updated;
                });

                // For members: check interview updates (assigned, confirmed, completed, feedback)
                const interviewsResponse = await axiosInstance.get('/interviews/my-requests', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                const myInterviews = interviewsResponse.data?.interviews || [];
                const interviewNotifications = myInterviews
                    .filter(interview => {
                        const lastCheck = lastChecked ? new Date(lastChecked) : new Date(0);

                        // For completed interviews, check if completed_at is after last check
                        if (interview.status === 'completed' && interview.interviewer_feedback) {
                            const completedTime = interview.completed_at
                                ? new Date(interview.completed_at)
                                : interview.updated_at
                                    ? new Date(interview.updated_at)
                                    : null;
                            return completedTime && completedTime > lastCheck;
                        }

                        // For confirmed interviews, check if confirmed_at is after last check
                        if (interview.status === 'confirmed' && interview.assigned_to_name) {
                            const confirmedTime = interview.confirmed_at
                                ? new Date(interview.confirmed_at)
                                : interview.updated_at
                                    ? new Date(interview.updated_at)
                                    : null;
                            return confirmedTime && confirmedTime > lastCheck;
                        }

                        return false;
                    })
                    .map(interview => ({
                        id: `interview_${interview.id}`,
                        type: 'interview_update',
                        title: interview.status === 'completed' ? 'Meeting Feedback Available' : 'Meeting Confirmed',
                        message: interview.status === 'completed'
                            ? `Your ${interview.interview_type} meeting feedback is ready`
                            : `Your ${interview.interview_type} meeting has been confirmed with ${interview.assigned_to_name}`,
                        link: '/workspace?section=Meetings',
                        timestamp: interview.status === 'completed'
                            ? (interview.completed_at || interview.updated_at || interview.created_at)
                            : (interview.confirmed_at || interview.updated_at || interview.created_at),
                        read: false
                    }))
                    .filter(notification => !dismissedIds.has(notification.id));

                setNotifications(prev => {
                    // Remove old interview_update notifications and add new ones
                    const filtered = prev.filter(n => n.type !== 'interview_update');
                    const updated = [...interviewNotifications, ...filtered];
                    setUnreadCount(updated.filter(n => !n.read).length);
                    return updated;
                });
            }

            // For volunteers+: check for new resume review requests and new referral requests
            if (isVolunteerOrAbove) {
                const response = await axiosInstance.get('/resumes/reviews', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                const allReviews = response.data?.reviews || [];
                const lastCheck = lastChecked ? new Date(lastChecked) : new Date(0);

                // Find new pending requests submitted after last check
                const newRequests = allReviews
                    .filter(review => {
                        const submittedDate = new Date(review.submitted_date);
                        return review.status === 'Pending' && submittedDate > lastCheck;
                    })
                    .map(review => ({
                        id: `request_${review.id}`,
                        type: 'new_request',
                        title: 'New Resume Review Request',
                        message: `${review.user_name} requested review for "${review.job_title}"`,
                        link: '/workspace?section=Resume%20and%20Essays',
                        timestamp: review.submitted_date,
                        read: false
                    }))
                    .filter(notification => !dismissedIds.has(notification.id)); // Filter out dismissed

                setNotifications(prev => {
                    // Remove old new_request notifications and add new ones
                    const filtered = prev.filter(n => n.type !== 'new_request');
                    const updated = [...newRequests, ...filtered];
                    // Update unread count based on all unread notifications
                    setUnreadCount(updated.filter(n => !n.read).length);
                    return updated;
                });

                // Check for new referral requests
                const allReferralsResponse = await axiosInstance.get('/referrals', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                const allReferrals = allReferralsResponse.data?.referrals || [];
                const newReferralRequests = allReferrals
                    .filter(referral => {
                        const submittedDate = new Date(referral.date);
                        return referral.status === 'Pending' && submittedDate > lastCheck;
                    })
                    .map(referral => ({
                        id: `ref_request_${referral.id}`,
                        type: 'new_referral_request',
                        title: 'New Referral Request',
                        message: `${referral.user_name} requested referral for "${referral.job_title}" at ${referral.company?.name}`,
                        link: '/workspace/referrals',
                        timestamp: referral.date,
                        read: false
                    }))
                    .filter(notification => !dismissedIds.has(notification.id));

                setNotifications(prev => {
                    // Remove old new_referral_request notifications and add new ones
                    const filtered = prev.filter(n => n.type !== 'new_referral_request');
                    const updated = [...newReferralRequests, ...filtered];
                    setUnreadCount(updated.filter(n => !n.read).length);
                    return updated;
                });

                // For volunteers+: check for new interview requests and assignments
                const interviewsResponse = await axiosInstance.get('/interviews/all', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                const allInterviews = interviewsResponse.data?.interviews || [];

                // New pending interview requests
                const newInterviewRequests = allInterviews
                    .filter(interview => {
                        const submittedDate = new Date(interview.created_at);
                        return interview.status === 'pending' && submittedDate > lastCheck;
                    })
                    .map(interview => ({
                        id: `interview_request_${interview.id}`,
                        type: 'new_interview_request',
                        title: 'New Meeting Request',
                        message: `${interview.user_name} requested a ${interview.interview_type} meeting`,
                        link: '/workspace?section=Meetings',
                        timestamp: interview.created_at,
                        read: false
                    }))
                    .filter(notification => !dismissedIds.has(notification.id));

                setNotifications(prev => {
                    const filtered = prev.filter(n => n.type !== 'new_interview_request');
                    const updated = [...newInterviewRequests, ...filtered];
                    setUnreadCount(updated.filter(n => !n.read).length);
                    return updated;
                });

                // Check assigned interviews for volunteers
                const assignedResponse = await axiosInstance.get('/interviews/assigned', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                const assignedInterviews = assignedResponse.data?.interviews || [];
                const newAssignments = assignedInterviews
                    .filter(interview => {
                        const assignedDate = interview.assigned_at
                            ? new Date(interview.assigned_at)
                            : interview.updated_at
                                ? new Date(interview.updated_at)
                                : null;

                        if (!assignedDate) return false;

                        // Show notification for newly assigned interviews (pending or confirmed)
                        return assignedDate > lastCheck && (interview.status === 'pending' || interview.status === 'confirmed');
                    })
                    .map(interview => ({
                        id: `interview_assigned_${interview.id}`,
                        type: 'interview_assigned',
                        title: 'Meeting Assigned to You',
                        message: `You've been assigned a ${interview.interview_type} meeting with ${interview.user_name} on ${interview.timeslot_date}`,
                        link: '/workspace?section=Meetings',
                        timestamp: interview.assigned_at || interview.updated_at,
                        read: false
                    }))
                    .filter(notification => !dismissedIds.has(notification.id));

                setNotifications(prev => {
                    const filtered = prev.filter(n => n.type !== 'interview_assigned');
                    const updated = [...newAssignments, ...filtered];
                    setUnreadCount(updated.filter(n => !n.read).length);
                    return updated;
                });
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [accessToken, isMember, isVolunteerOrAbove, lastChecked, dismissedIds, userId]);

    // Poll for notifications every 30 seconds
    useEffect(() => {
        if (!accessToken) return;

        // Don't fetch notifications on OAuth callback page to prevent race conditions
        if (window.location.pathname === '/auth/callback') {
            console.log('Skipping notification fetch on OAuth callback page');
            return;
        }

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);

        return () => clearInterval(interval);
    }, [accessToken, fetchNotifications]);

    // Mark notification as read
    const markAsRead = (notificationId) => {
        const newDismissedIds = new Set(dismissedIds);
        newDismissedIds.add(notificationId);
        setDismissedIds(newDismissedIds);
        saveDismissedIds(newDismissedIds);

        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    // Mark all as read
    const markAllAsRead = () => {
        const newDismissedIds = new Set(dismissedIds);
        notifications.forEach(n => newDismissedIds.add(n.id));
        setDismissedIds(newDismissedIds);
        saveDismissedIds(newDismissedIds);

        setNotifications([]);
        setUnreadCount(0);
        setLastChecked(new Date().toISOString());
        localStorage.setItem(`lastNotificationCheck_${userId}`, new Date().toISOString());
    };

    // Clear all notifications
    const clearAll = () => {
        const newDismissedIds = new Set(dismissedIds);
        notifications.forEach(n => newDismissedIds.add(n.id));
        setDismissedIds(newDismissedIds);
        saveDismissedIds(newDismissedIds);

        setNotifications([]);
        setUnreadCount(0);
        setLastChecked(new Date().toISOString());
        localStorage.setItem(`lastNotificationCheck_${userId}`, new Date().toISOString());
    };

    // Initialize last checked from localStorage
    useEffect(() => {
        if (userId) {
            const stored = localStorage.getItem(`lastNotificationCheck_${userId}`);
            if (stored) {
                setLastChecked(stored);
            }
        }
    }, [userId]);

    const value = {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        fetchNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
