import { useEffect } from 'react';
import posthog from 'posthog-js';

export function usePostHog() {
    return {
        // Track custom events
        capture: (eventName, properties = {}) => {
            posthog.capture(eventName, properties);
        },

        // Identify user (call this on login)
        identify: (userId, properties = {}) => {
            posthog.identify(userId, properties);
        },

        // Reset user (call this on logout)
        reset: () => {
            posthog.reset();
        },

        // Set user properties
        setPersonProperties: (properties) => {
            posthog.setPersonProperties(properties);
        },

        // Track page view manually
        capturePageView: (properties = {}) => {
            posthog.capture('$pageview', properties);
        },

        // Feature flags
        isFeatureEnabled: (flagKey) => {
            return posthog.isFeatureEnabled(flagKey);
        },

        getFeatureFlag: (flagKey) => {
            return posthog.getFeatureFlag(flagKey);
        },
    };
}

// Hook to automatically track component mount/unmount
export function usePostHogPageView(pageName, properties = {}) {
    const { capturePageView } = usePostHog();

    useEffect(() => {
        capturePageView({ page: pageName, ...properties });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageName]);
}

export default usePostHog;
