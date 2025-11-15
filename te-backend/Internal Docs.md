# TechElevate Platform - Internal Documentation

**⚠️ CONFIDENTIAL - INTERNAL USE ONLY**

This document contains sensitive information about platform architecture, role-based access control, administrative functions, and internal operations. **DO NOT SHARE EXTERNALLY.**

---

## Table of Contents
1. [User Roles & Permissions](#user-roles--permissions)
2. [Administrative Functions](#administrative-functions)
3. [Database Access & Credentials](#database-access--credentials)
4. [Internal API Endpoints](#internal-api-endpoints)
5. [Security Considerations](#security-considerations)
6. [Deployment & Configuration](#deployment--configuration)
7. [Monitoring & Analytics](#monitoring--analytics)

---

## User Roles & Permissions

### Role Hierarchy

| Role ID | Role Name | Access Level | Authentication Method |
|---------|-----------|--------------|----------------------|
| 0 | Guest | Public access only | None |
| 1 | Member | Basic platform features | Email + Password |
| 2 | Referrer | Company-specific referral review | Username + Password + `lead_token` |
| 3 | Volunteer | Resume reviews, mentoring | Username + Password + `lead_token` |
| 4 | Lead | Team management, assignments | Username + Password + `lead_token` |
| 5 | **Admin** | **Full system access** | Username + Password + `lead_token` |

### Role 5: Admin Capabilities

**System Administration:**
- Create/modify/delete user accounts at all levels
- Manage Referrer, Volunteer, Lead, and Admin accounts
- Access all user data across the platform
- System configuration and settings management
- Database operations and maintenance

**Data Management:**
- Hard delete resume reviews, referrals, applications
- Bulk data operations and cleanup
- Export/import functionality
- Data analytics and reporting

**Security & Access:**
- View audit logs
- Manage authentication tokens
- Configure API rate limits
- Access internal monitoring dashboards

**User Management Endpoints:**
```http
POST /v1/users/privileged
- Create Referrer, Volunteer, Lead, or Admin accounts
- Requires admin token and role specification
- Body: { username, password, role: 2-5, company_id (optional) }
```

**Delete Operations (Admin Only):**
```http
DELETE /v1/resumes/reviews?review_id={id}
- Permanently delete resume review (no recovery)
- Admin role (5) required

DELETE /v1/referrals/{id}
- Permanently delete referral request
- Admin role (5) required

DELETE /v1/users/{user_id}
- Delete user account and all associated data
- Admin role (5) required
```

**Analytics & Reporting:**
```http
GET /v1/admin/analytics
- Platform-wide usage statistics
- User engagement metrics
- Review/referral conversion rates

GET /v1/admin/audit-logs
- Access logs for all user actions
- System events and errors
- Security incidents
```

### Role 4: Lead Capabilities

**Team Management:**
- Assign resume reviews to Volunteers
- Bulk assign operations
- View team performance metrics
- Manage Volunteer availability

**Operational:**
- Create company profiles for referrals
- Update referral statuses
- View all resume reviews and referrals
- Generate team reports

**Endpoints:**
```http
POST /v1/resumes/reviews/assign?review_id={id}
POST /v1/resumes/reviews/bulk-assign
POST /v1/referrals/companies
GET /v1/referrals/companies/list
```

### Role 3: Volunteer Capabilities

**Resume Reviews:**
- View assigned reviews
- Update review status and feedback
- View all pending resume reviews
- Track review history

**Community:**
- Access member profiles
- View platform statistics
- Participate in forums/discussions

### Role 2: Referrer Capabilities

**Referral Management:**
- View referrals for assigned company only
- Approve/decline referral requests
- Provide feedback to applicants
- Track referral outcomes

**Company-Specific:**
- Filtered by `company_id` field
- Can only act on their company's referrals
- No cross-company visibility

### Role 1: Member Capabilities

**Core Features:**
- Resume upload and management
- Request resume reviews
- Submit referral requests
- Track applications
- Access learning resources

**Limitations:**
- Can only view/edit own data
- Cannot access other members' information
- Cannot perform administrative actions

---

## Administrative Functions

### User Account Management

**Creating Privileged Accounts:**

```bash
# Admin creating a Lead account
POST /v1/users/privileged
Authorization: Bearer <admin_token>

{
  "username": "lead_user",
  "password": "secure_password",
  "role": 4,
  "full_name": "Lead Name",
  "email": "lead@techelevate.org"
}
```

**Lead Token System:**
- Required for roles 2-5
- Stored in environment variable: `LEAD_TOKEN`
- Used to prevent unauthorized privilege escalation
- Validate on account creation

**Account Suspension:**
```http
PATCH /v1/admin/users/{user_id}/suspend
- Temporarily disable account
- Preserve data for potential reactivation
```

### Data Management

**Bulk Operations:**

```python
# Example: Bulk delete old applications
DELETE /v1/admin/bulk-delete
{
  "resource_type": "applications",
  "filter": {
    "status": "rejected",
    "older_than_days": 90
  }
}
```

**Data Export:**
```http
GET /v1/admin/export/users?format=csv
GET /v1/admin/export/reviews?format=json&start_date=2025-01-01
```

### System Configuration

**Environment Variables (Sensitive):**

```bash
# MongoDB
MONGODB_URI=mongodb+srv://te_platform_admin:!ElevatingTech!@te-platform.v91qs4k.mongodb.net/
MONGODB_DB_NAME=te_platform

# Authentication
JWT_SECRET_KEY=<32-character-random-string>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Privileged Access
LEAD_TOKEN=<secure-random-token>
ADMIN_EMAIL=info@techelevate.org
ADMIN_PASSWORD=<hashed-password>

# Google Drive (File Storage)
GDRIVE_RESUMES=<folder-id>
GDRIVE_OTHER_FILES=<folder-id>
GDRIVE_LESSONS=<folder-id>
GOOGLE_SERVICE_ACCOUNT_KEY=<path-to-credentials.json>

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@techelevate.org
SMTP_PASSWORD=<app-password>

# External Services
POSTHOG_API_KEY=<analytics-key>
SENTRY_DSN=<error-tracking-dsn>
```

---

## Database Access & Credentials

### MongoDB Atlas

**Connection:**
- Host: `te-platform.v91qs4k.mongodb.net`
- Database: `te_platform`
- User: `te_platform_admin`
- Password: `!ElevatingTech!` *(Change in production)*

**Collections:**

```javascript
// Sensitive Collections
privileged_users {
  username: String,
  hashed_password: String,
  role: Integer (2-5),
  company_id: ObjectId (optional),
  created_at: Date,
  last_login: Date,
  permissions: Array
}

audit_logs {
  user_id: ObjectId,
  action: String,
  resource: String,
  timestamp: Date,
  ip_address: String,
  user_agent: String
}

system_config {
  key: String,
  value: Mixed,
  updated_by: ObjectId,
  updated_at: Date
}
```

**Backup Schedule:**
- Daily automated backups at 02:00 UTC
- Weekly full backups retained for 30 days
- Manual backup before major updates

**Direct Database Access:**
```bash
# WARNING: Use with extreme caution
mongosh "mongodb+srv://te-platform.v91qs4k.mongodb.net/te_platform" \
  --username te_platform_admin \
  --password '!ElevatingTech!'
```

---

## Internal API Endpoints

### Admin-Only Endpoints

```http
# System Health
GET /v1/admin/health/detailed
Response: {
  "database": "connected",
  "google_drive": "operational",
  "email_service": "operational",
  "memory_usage": "45%",
  "active_users": 127,
  "error_rate": "0.02%"
}

# User Management
GET /v1/admin/users?role=5
GET /v1/admin/users?status=suspended
POST /v1/admin/users/{id}/reset-password
DELETE /v1/admin/users/{id}

# Data Cleanup
POST /v1/admin/cleanup/orphaned-files
POST /v1/admin/cleanup/old-notifications
POST /v1/admin/cleanup/expired-tokens

# Analytics
GET /v1/admin/analytics/dashboard
GET /v1/admin/analytics/user-engagement
GET /v1/admin/analytics/review-pipeline
GET /v1/admin/analytics/referral-conversion

# Audit Logs
GET /v1/admin/audit-logs?user_id={id}
GET /v1/admin/audit-logs?action=delete
GET /v1/admin/audit-logs?date_range=2025-01-01,2025-01-31

# System Configuration
GET /v1/admin/config
PATCH /v1/admin/config
POST /v1/admin/config/reload
```

### Lead-Only Endpoints

```http
# Team Management
GET /v1/lead/team/volunteers
GET /v1/lead/team/performance
POST /v1/lead/team/volunteers/{id}/assign-reviews

# Assignment Management  
GET /v1/lead/assignments/overview
POST /v1/lead/assignments/redistribute

# Company Management
POST /v1/referrals/companies
PATCH /v1/referrals/companies/{id}
GET /v1/referrals/companies/list
```

---

## Security Considerations

### Authentication Flow

**Privileged Users (Roles 2-5):**
1. Login with username + password
2. Verify `lead_token` if provided during registration
3. Check account status (active/suspended)
4. Generate JWT with role embedded
5. Enforce role-based access on each request

**Critical Security Rules:**
- Never expose role IDs in frontend
- Always verify role on backend
- Use `require_admin()`, `require_lead()` dependencies
- Log all administrative actions
- Rate limit authentication endpoints

### Password Security

```python
# Password Requirements
- Minimum 12 characters for admin/lead
- Minimum 8 characters for members
- Must include: uppercase, lowercase, number, special char
- Cannot reuse last 5 passwords
- Hashed with bcrypt (cost factor: 12)
```

### API Security

**Rate Limiting:**
```
Members: 100 requests/hour
Volunteers: 500 requests/hour
Leads: 1000 requests/hour
Admins: 5000 requests/hour
```

**IP Whitelisting (Admin endpoints):**
- Configure in production for `/admin/*` routes
- Add trusted IP ranges in environment config

---

## Deployment & Configuration

### Production Deployment Checklist

```markdown
Pre-Deployment:
- [ ] Rotate all API keys and secrets
- [ ] Update LEAD_TOKEN
- [ ] Change default admin password
- [ ] Configure MongoDB IP whitelist
- [ ] Enable MongoDB encryption at rest
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS allowed origins
- [ ] Enable rate limiting
- [ ] Set up error tracking (Sentry)
- [ ] Configure backup automation

Post-Deployment:
- [ ] Verify all admin endpoints require authentication
- [ ] Test role-based access control
- [ ] Check audit logging functionality
- [ ] Verify email notifications
- [ ] Test file upload to Google Drive
- [ ] Monitor error rates
- [ ] Review security headers
```

### Environment-Specific Settings

**Development:**
```bash
DEBUG=True
ENVIRONMENT=development
LOG_LEVEL=DEBUG
ENABLE_SWAGGER=True
```

**Staging:**
```bash
DEBUG=False
ENVIRONMENT=staging
LOG_LEVEL=INFO
ENABLE_SWAGGER=True
```

**Production:**
```bash
DEBUG=False
ENVIRONMENT=production
LOG_LEVEL=WARNING
ENABLE_SWAGGER=False  # Disable public API docs
REQUIRE_HTTPS=True
```

---

## Monitoring & Analytics

### Key Metrics to Monitor

**Platform Health:**
- API response time (target: <200ms p95)
- Error rate (target: <0.1%)
- Database query performance
- File upload success rate
- Email delivery rate

**User Engagement:**
- Daily/Monthly active users
- Resume review completion rate
- Referral approval rate
- Application submission rate
- Learning module completion

**Admin Dashboards:**
```
/admin/dashboard - Overview
/admin/users - User management
/admin/analytics - Platform analytics
/admin/system - System health
/admin/audit-logs - Security audit
```

### Alerting Rules

**Critical Alerts (PagerDuty):**
- Database connection failure
- API error rate >5%
- Disk space >90%
- Security breach attempts
- Admin unauthorized access attempts

**Warning Alerts (Email):**
- API response time >500ms
- Error rate >1%
- Failed login attempts >10/min
- Unusual data deletion patterns

---

## Emergency Procedures

### System Compromise Response

1. **Immediate Actions:**
   - Rotate all API keys and tokens
   - Force logout all users
   - Disable admin account creation
   - Enable maintenance mode
   - Review audit logs

2. **Investigation:**
   - Check database for unauthorized changes
   - Review access logs
   - Identify compromised accounts
   - Document timeline

3. **Recovery:**
   - Restore from last known good backup
   - Reset all privileged account passwords
   - Update security configurations
   - Notify affected users

### Data Breach Protocol

1. Identify scope of breach
2. Secure affected systems
3. Notify legal team
4. Prepare user communication
5. Implement additional security measures
6. Document incident for compliance

---

## Admin Contacts

**Platform Administrators:**
- Primary Admin: info@techelevate.org
- Technical Lead: [Contact Information]
- Database Admin: [Contact Information]

**Emergency Contact:**
- 24/7 On-Call: [Phone Number]
- Incident Response Team: [Email]

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-15 | 1.0 | Initial internal documentation | System |

---

**Document Classification: CONFIDENTIAL - INTERNAL ONLY**

*Last Updated: November 15, 2025*
*Next Review Date: December 15, 2025*
