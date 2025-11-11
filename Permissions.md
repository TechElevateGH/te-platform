# TechElevate Platform - User Permissions & Access Control

## Overview

The TechElevate platform implements a role-based access control (RBAC) system with five distinct user roles. Each role has specific permissions designed to support the platform's mission of helping students secure tech opportunities.

---

## User Roles

| Role | Level | Description |
|------|-------|-------------|
| **Guest** | 0 | Unauthenticated visitors (can view learning content) |
| **Member** | 1 | Students and program participants |
| **Referrer** | 2 | Company referrers and partners |
| **Volunteer** | 3 | Program volunteers and mentors |
| **Lead** | 4 | Program leads and coordinators |
| **Admin** | 5 | System administrators |

---

## Detailed Permissions Matrix

### 👤 Guest (Role = 0)
**Who:** Unauthenticated visitors, prospective members

**Learning & Education:**
- ✅ View all learning content (lessons, videos, resources) for DSA and Python
- ✅ Browse topics and categories
- ❌ Cannot track progress or save data
- ❌ Cannot bookmark topics or take notes
- ❌ Cannot mark topics as completed
- 💡 **Prompt to sign in for personalized features**

**Other Features:**
- ❌ Cannot access any other platform features
- ❌ Must sign in to request referrals, apply to jobs, or upload files

---

### 🎓 Member (Role = 1)
**Who:** Students, program participants, job seekers

**Learning & Education:**
- ✅ **All guest viewing permissions, plus:**
- ✅ Track learning progress across DSA and Python topics
- ✅ Mark topics as completed
- ✅ Bookmark topics for later review
- ✅ Take personal notes on learning materials (synced across devices)
- ✅ View own progress statistics
- ❌ Cannot create or manage learning content
- ❌ Cannot view other members' progress

**Job Applications:**
- ✅ Create and track job applications
- ✅ View own application history
- ✅ Upload resumes (PDF format only)
- ✅ Upload and edit essays
- ✅ Upload and edit cover letters
- ❌ Cannot view other members' applications

**Referrals:**
- ✅ Request referrals from partner companies
- ✅ Track own referral requests
- ✅ Update referral status (submitted/not submitted)
- ✅ View contact information for referrals
- ❌ Cannot view other members' referrals
- ❌ Cannot manage referral companies

**Profile Management:**
- ✅ View and edit own profile information
- ✅ Update personal details (name, contact, university, etc.)
- ✅ Manage resume files
- ❌ Cannot access privileged user features

---

### 🤝 Referrer (Role = 2)
**Who:** Company employees who provide referrals

**Learning & Education:**
- ❌ **Cannot access learning content at all**
- ❌ Blocked from Learning Hub

**Referral Management:**
- ✅ View referral requests for their specific company only
- ✅ Manage referral statuses for their company
- ❌ Cannot add new referral companies
- ❌ Cannot view all referral requests across companies
- ❌ Cannot access referral analytics and reports

**Content Management:**
- ❌ Cannot create or modify learning content

**Administration:**
- ❌ Cannot access admin features
- ❌ Cannot view member progress analytics

---

### 🙋 Volunteer (Role = 3)
**Who:** Program volunteers, mentors, coaches

**Learning & Education:**
- ✅ View all learning content
- ✅ **Create, edit, and delete lessons** (content management)
- ✅ Publish/unpublish lessons
- ❌ Cannot track personal progress (not a learning participant)

**Referral Management:**
- ✅ Add new referral companies to the system
- ✅ View all referral requests
- ✅ Manage referral statuses
- ✅ Can assist with member support
- ❌ Cannot access referral analytics and reports (Lead+ only)

**Administration:**
- ❌ Cannot view member progress analytics
- ❌ Cannot manage user accounts

---

### 👨‍💼 Lead (Role = 4)
**Who:** Program coordinators, team leads

**All Referrer/Volunteer permissions, plus:**

**Learning Analytics:**
- ✅ View all members' learning progress
- ✅ Access learning statistics dashboard
- ✅ View engagement metrics (completion rates, active learners, etc.)
- ✅ See most popular topics and learning trends
- ✅ Export progress reports

**Member Management:**
- ✅ View all member profiles
- ✅ Access member application history
- ✅ View member referral requests
- ✅ Monitor member activity

**Content Management:**
- ✅ Create new learning lessons and topics
- ✅ Edit existing learning content
- ✅ Publish/unpublish lessons
- ✅ Organize learning categories

**Restrictions:**
- ❌ Cannot track personal learning progress
- ❌ Cannot create personal job applications
- ❌ Cannot upload personal files

---

### 👑 Admin (Role = 5)
**Who:** System administrators

**Full System Access:**
- ✅ All Lead permissions
- ✅ Manage user accounts and roles
- ✅ System-wide configuration
- ✅ Access all admin endpoints
- ✅ View and manage all data across the platform

**Learning System:**
- ✅ Full control over learning content
- ✅ Manage all learning categories
- ✅ View comprehensive analytics

**User Management:**
- ✅ Create, update, delete user accounts
- ✅ Assign and modify user roles
- ✅ Manage privileged users

**Restrictions:**
- ❌ Cannot track personal learning progress
- ❌ Cannot create personal job applications
- ❌ Cannot upload personal files
- ⚠️ Admins focus on platform management, not personal features

---

## Feature Availability by Role

### Learning Progress Tracking

| Feature | Guest | Member | Referrer | Volunteer | Lead | Admin |
|---------|-------|--------|----------|-----------|------|-------|
| View learning content | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Mark topics complete | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Bookmark topics | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Take notes | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View own progress | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View all members' progress | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| View analytics dashboard | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Create/Edit lessons | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

### Job Applications

| Feature | Member | Referrer | Volunteer | Lead | Admin |
|---------|--------|----------|-----------|------|-------|
| Create applications | ✅ | ❌ | ❌ | ❌ | ❌ |
| View own applications | ✅ | ❌ | ❌ | ❌ | ❌ |
| View all applications | ❌ | ❌ | ❌ | ✅ | ✅ |

### Referrals

| Feature | Member | Referrer | Volunteer | Lead | Admin |
|---------|--------|----------|-----------|------|-------|
| Request referrals | ✅ | ❌ | ❌ | ❌ | ❌ |
| View own referrals | ✅ | ✅ (own company) | ✅ | ✅ | ✅ |
| Add companies | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage all referrals | ❌ | ❌ | ✅ | ✅ | ✅ |
| View analytics/reports | ❌ | ❌ | ❌ | ✅ | ✅ |

### File Management

| Feature | Member | Referrer | Volunteer | Lead | Admin |
|---------|--------|----------|-----------|------|-------|
| Upload resume | ✅ | ❌ | ❌ | ❌ | ❌ |
| Upload essay | ✅ | ❌ | ❌ | ❌ | ❌ |
| Upload cover letter | ✅ | ❌ | ❌ | ❌ | ❌ |
| View all member files | ❌ | ❌ | ❌ | ✅ | ✅ |

### Content Management

| Feature | Guest | Member | Referrer | Volunteer | Lead | Admin |
|---------|-------|--------|----------|-----------|------|-------|
| View learning content | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Create lessons | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Edit lessons | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Delete lessons | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Publish/unpublish | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## API Endpoints by Permission Level

### Member-Only Endpoints

```http
GET    /v1/learning/progress          # Get own progress
POST   /v1/learning/progress          # Update progress
PATCH  /v1/learning/progress/complete # Toggle topic completion
PATCH  /v1/learning/progress/bookmark # Toggle topic bookmark
POST   /v1/learning/progress/note     # Update topic notes

POST   /v1/referrals                  # Request referral
POST   /v1/applications               # Create application
POST   /v1/files                      # Upload files
POST   /v1/users/{user_id}/essay      # Update essay
POST   /v1/users/{user_id}/cover-letter # Update cover letter
```

### Volunteer+ Endpoints

```http
POST   /v1/companies                  # Add referral company (Volunteer and above)
GET    /v1/companies/referrals        # View companies for referrals
```

### Lead/Admin-Only Endpoints

```http
GET    /v1/learning/admin/all-progress    # View all member progress
GET    /v1/learning/admin/statistics      # View learning analytics
POST   /v1/learning/lessons               # Create lessons
PUT    /v1/learning/lessons/{id}          # Update lessons
DELETE /v1/learning/lessons/{id}          # Delete lessons
GET    /v1/referrals/analytics            # View referral analytics
```

### Referrer Endpoints

```http
GET    /v1/referrals?company_id={id}  # View referrals for specific company only
PATCH  /v1/referrals/{id}              # Update referral status
```

---

## Error Responses

When users attempt to access features outside their permission level:

### 403 Forbidden
```json
{
  "detail": "This feature is only available for Members"
}
```

### 403 Forbidden (Privileged feature)
```json
{
  "detail": "Lead access required"
}
```

### 403 Forbidden (Admin feature)
```json
{
  "detail": "Admin access required"
}
```

---

## Implementation Notes

### Backend
- Role-based dependencies in `/app/ents/user/dependencies.py`:
  - `get_current_user()` - Any authenticated user
  - `get_current_member_only()` - Members only (role=1)
  - `get_current_user_by_role()` - Members and above (role≥1)
  - `get_current_lead()` - Leads and Admins (role≥4)
  - `get_current_admin()` - Admins only (role≥5)

### Frontend
- Role detection using `authState.userRole`
- Conditional UI rendering based on user role
- Member-specific features hidden for privileged users
- Admin features shown only to Leads and Admins

### Database
- `member_users` collection: Contains Member accounts (role=1)
- `privileged_users` collection: Contains Referrer, Volunteer, Lead, Admin accounts (role≥2)

---

## Security Considerations

1. **Separation of Concerns**: Members focus on learning and applications; privileged users manage the platform
2. **No Privilege Escalation**: Members cannot access admin features even if they modify frontend code
3. **Backend Validation**: All permission checks enforced at API level
4. **Token-Based Auth**: JWT tokens contain role information, validated on every request
5. **Audit Trail**: All actions are logged with user ID and role information

---

## Future Enhancements

- [ ] Fine-grained permissions per feature
- [ ] Custom role creation
- [ ] Temporary permission grants
- [ ] Permission audit logs
- [ ] Role-based data isolation
- [ ] Multi-tenancy support

---

**Last Updated:** November 10, 2025  
**Version:** 1.0  
**Maintained By:** TechElevate Platform Team
