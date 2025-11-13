// Centralized event tracking for PostHog
import posthog from 'posthog-js';

/**
 * Track custom events throughout the application
 * Usage: trackEvent.referralRequested({ company: 'Google', role: 'SWE' })
 */

export const trackEvent = {
  // Referral Events
  referralRequested: (properties = {}) => {
    posthog.capture('referral_requested', {
      company: properties.company,
      job_title: properties.job_title,
      level: properties.level,
      ...properties,
    });
  },

  // Resume Events
  resumeReviewRequested: (properties = {}) => {
    posthog.capture('resume_review_requested', {
      job_title: properties.job_title,
      level: properties.level,
      ...properties,
    });
  },
};

// Helper to track page views with custom properties
export const trackPageView = (pageName, properties = {}) => {
  posthog.capture('$pageview', {
    page_name: pageName,
    ...properties,
  });
};

export default trackEvent;
