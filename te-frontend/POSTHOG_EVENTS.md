# PostHog Event Tracking Guide

## Viewing Your Data

Visit: **https://us.i.posthog.com**

### Quick Navigation:
- **Events** tab - See all captured events in real-time
- **Activity** - Live feed of what's happening
- **Insights** - Create custom charts and funnels
- **Persons** - View individual user journeys

---

## Tracking Custom Events

### Usage in Components

Import the event tracker:
```jsx
import { trackEvent } from '../analytics/events';
```

### Example Implementations

#### 1. Referrals Page
```jsx
// When user requests a referral
const handleReferralRequest = async (company) => {
  // Track the event
  trackEvent.referralRequested({
    company: company.name,
    job_title: formData.job_title,
    level: formData.level,
  });

  // Your existing logic...
  await submitReferralRequest();
};

// When user cancels a referral
const handleCancelReferral = (referralId, company) => {
  trackEvent.referralCancelled({
    referral_id: referralId,
    company: company,
  });

  // Your existing logic...
};
```

#### 2. File Upload (Resume)
```jsx
const handleResumeUpload = async (file) => {
  trackEvent.resumeUploaded({
    file_name: file.name,
    file_size: file.size,
  });

  // Your existing upload logic...
};

const handleResumeDelete = (fileName) => {
  trackEvent.resumeDeleted({
    file_name: fileName,
  });

  // Your existing delete logic...
};
```

#### 3. Applications
```jsx
const handleCreateApplication = (data) => {
  trackEvent.applicationCreated({
    company: data.company,
    title: data.title,
    role: data.role,
    status: data.status,
  });

  // Your existing logic...
};

const handleStatusChange = (appId, oldStatus, newStatus) => {
  trackEvent.applicationStatusChanged({
    application_id: appId,
    company: application.company,
    old_status: oldStatus,
    new_status: newStatus,
  });

  // Your existing logic...
};
```

#### 4. Search & Filters
```jsx
const handleSearch = (query) => {
  setSearchQuery(query);
  
  trackEvent.searchPerformed({
    search_query: query,
    page: 'Referrals',
    results_count: filteredResults.length,
  });
};

const handleFilterChange = (filterType, value) => {
  trackEvent.filterApplied({
    filter_type: filterType,
    filter_value: value,
    page: 'Applications',
  });

  setFilter(value);
};
```

#### 5. Tab Switching
```jsx
const handleTabSwitch = (newTab) => {
  trackEvent.tabSwitched({
    from_tab: activeTab,
    to_tab: newTab,
    page: 'Resume & Essays',
  });

  setActiveTab(newTab);
};
```

#### 6. Modals
```jsx
const openModal = () => {
  trackEvent.modalOpened({
    modal_name: 'Create Referral',
    page: 'Referrals',
  });

  setShowModal(true);
};

const closeModal = (action) => {
  trackEvent.modalClosed({
    modal_name: 'Create Referral',
    action: action, // 'submit', 'cancel', or 'close'
  });

  setShowModal(false);
};
```

---

## Quick Integration Checklist

Add tracking to these key actions:

### Referrals
- ✅ Request referral
- ✅ Cancel referral
- ✅ Status change
- ✅ Search companies
- ✅ Apply filters
- ✅ Export to sheets

### Applications
- ✅ Create application
- ✅ Update status
- ✅ Delete application
- ✅ Archive applications
- ✅ Search/filter

### Resume & Essays
- ✅ Upload resume
- ✅ Delete resume
- ✅ Request review
- ✅ Update essay
- ✅ Switch tabs

### Navigation
- ✅ Tab switches
- ✅ Modal opens/closes
- ✅ View changes

---

## Tips for Good Analytics

1. **Be Descriptive**: Use clear event names
2. **Add Context**: Include relevant properties
3. **Track User Intent**: Track both success and failure
4. **Don't Over-Track**: Only track meaningful interactions
5. **Use Consistent Naming**: Use snake_case for event names

---

## Example: Full Implementation

Here's a complete example for the Referrals page:

```jsx
import { trackEvent } from '../analytics/events';

// In your component
const handleReferralRequest = async (company, formData) => {
  try {
    // Track the attempt
    trackEvent.referralRequested({
      company: company.name,
      job_title: formData.job_title,
      level: formData.level,
      has_essay: !!formData.essay,
      has_resume: !!formData.resume,
    });

    const response = await submitReferral(formData);
    
    // Success - could track separately if needed
    console.log('Referral submitted successfully');
  } catch (error) {
    // Track errors
    trackEvent.errorOccurred({
      error_message: error.message,
      error_type: 'referral_submission_failed',
      page: 'Referrals',
    });
  }
};
```

---

## Viewing Your Events

1. Go to https://us.i.posthog.com
2. Click **"Events"** in the sidebar
3. See all events in real-time
4. Click on any event to see its properties
5. Create **Insights** to visualize trends

### Useful Insights to Create:
- Most requested companies
- Conversion funnel (view → request → complete)
- Popular features by user role
- Time between actions
- User retention

Happy tracking! 📊
