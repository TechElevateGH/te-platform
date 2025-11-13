import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import posthog from 'posthog-js';

export function PostHogProvider({ children }) {
    const location = useLocation();

    useEffect(() => {
        // Initialize PostHog
        const posthogKey = process.env.POSTHOG_KEY;
        const posthogHost = process.env.POSTHOG_HOST;

        if (posthogKey && posthogHost) {
            posthog.init(posthogKey, {
                api_host: posthogHost,
                person_profiles: 'identified_only',
                capture_pageview: false, // We'll capture manually on route change
                capture_pageleave: true,
            });
        } else {
            console.warn('PostHog environment variables not found. Analytics will not be tracked.');
        }
    }, []);

    useEffect(() => {
        // Capture pageview on route change
        if (location.pathname && posthog.__loaded) {
            posthog.capture('$pageview');
        }
    }, [location]);

    return <>{children}</>;
}

export default PostHogProvider;
