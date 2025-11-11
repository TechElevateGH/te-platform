# PostHog Integration Guide

PostHog has been successfully integrated into your React app! 🎉

## Installation

Run this command to install the PostHog library:

```bash
npm install posthog-js
```

## What's Been Set Up

### 1. PostHog Provider (`/src/providers/PostHogProvider.jsx`)
- Initializes PostHog with your credentials
- Automatically tracks page views on route changes
- Wraps your entire app

### 2. Custom Hook (`/src/hooks/usePostHog.js`)
- Provides easy access to PostHog functions throughout your app
- Methods available:
  - `capture(eventName, properties)` - Track custom events
  - `identify(userId, properties)` - Identify users
  - `reset()` - Reset user on logout
  - `setPersonProperties(properties)` - Update user properties
  - `isFeatureEnabled(flagKey)` - Check feature flags

### 3. Auto User Identification
- Users are automatically identified in PostHog when they log in
- User properties tracked: `userId`, `role`, `isPrivileged`
- PostHog session is reset when users log out

## Usage Examples

### Track Custom Events

```jsx
import usePostHog from '../hooks/usePostHog';

function MyComponent() {
  const { capture } = usePostHog();

  const handleButtonClick = () => {
    capture('button_clicked', {
      button_name: 'Submit Application',
      page: 'Applications'
    });
  };

  return <button onClick={handleButtonClick}>Submit</button>;
}
```

### Track Page Views

```jsx
import { usePostHogPageView } from '../hooks/usePostHog';

function MyPage() {
  usePostHogPageView('Custom Page Name', { 
    section: 'dashboard' 
  });

  return <div>My Page</div>;
}
```

### Update User Properties

```jsx
import usePostHog from '../hooks/usePostHog';

function Profile() {
  const { setPersonProperties } = usePostHog();

  const updateProfile = (data) => {
    setPersonProperties({
      name: data.name,
      email: data.email,
      plan: 'premium'
    });
  };
}
```

## Events to Track

Here are some suggested events to track:

### User Actions
- `referral_requested` - When a user requests a referral
- `resume_uploaded` - When a user uploads a resume
- `application_created` - When a user creates a job application
- `review_submitted` - When a review is submitted

### Feature Usage
- `filter_applied` - When filters are used (track which filters)
- `search_performed` - When search is used
- `modal_opened` - Track which modals are opened
- `tab_switched` - Track navigation patterns

### Example Implementation

```jsx
// In Referrals.jsx
const handleReferralRequest = (companyId) => {
  capture('referral_requested', {
    company_id: companyId,
    company_name: company.name,
    timestamp: new Date().toISOString()
  });
};

// In Applications.jsx
const handleCreateApplication = (data) => {
  capture('application_created', {
    company: data.company,
    role: data.role,
    status: data.status
  });
};

// In FilesAndEssay.jsx
const handleResumeUpload = (fileName) => {
  capture('resume_uploaded', {
    file_name: fileName,
    timestamp: new Date().toISOString()
  });
};
```

## Environment Variables

Make sure these are in your `.env` file:

```
VITE_PUBLIC_POSTHOG_KEY=phc_DyZs1fd1LJjtRU8Lv3srORCDWcVyk7s0XFMmNEmz77D
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## What's Automatically Tracked

✅ Page views on route changes
✅ User identification on login
✅ Session reset on logout
✅ User role and privileges

## Next Steps

1. Install the package: `npm install posthog-js`
2. Restart your dev server
3. Start tracking custom events in your components
4. Visit your PostHog dashboard to see the data flowing in!

## PostHog Dashboard

Access your analytics at: https://us.i.posthog.com

Happy tracking! 📊
