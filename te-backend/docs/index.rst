.. TechElevate documentation master file, created by
   sphinx-quickstart on Tue Jan 10 07:53:47 2023.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

.. https://docs.readthedocs.io/en/stable/intro/getting-started-with-sphinx.html

Welcome to TechElevate Platform Documentation
==============================================

TechElevate is a comprehensive platform designed to help members prepare for technical interviews,
access job opportunities, and receive personalized support throughout their job search journey.

.. toctree::
   :maxdepth: 2
   :caption: Contents:

   overview
   features
   interviews
   applications
   learning
   user_roles


Platform Overview
=================

TechElevate provides a suite of tools and services to help job seekers excel in their technical interview
preparation and job application process. The platform connects members with experienced interviewers,
curates job opportunities, and provides personalized feedback.

Key Features
------------

* **Interview Practice**: Schedule and conduct practice interviews with experienced interviewers
* **Job Applications**: Track and manage job applications with personalized support
* **Learning Resources**: Access curated learning materials for DSA and Python
* **Resume & Essay Reviews**: Get professional feedback on application materials
* **Referral System**: Connect with referrers at target companies


User Roles
==========

The platform supports different user roles with varying levels of access:

Member (Role 1)
---------------
* Can request interview practice sessions
* Submit job applications for review
* Access learning resources
* Track application progress
* Request resume and essay reviews

Volunteer (Role 3)
------------------
All Member permissions, plus:
* Conduct interview practice sessions
* Manage interview availability slots
* View assigned interview requests
* Provide interview feedback

Lead (Role 4+)
--------------
All Volunteer permissions, plus:
* Review and assign interview requests
* Manage all applications
* Access analytics and reports
* Assign interviewers to requests
* Manage platform content


Interview Practice
==================

The Interview Practice feature allows members to schedule practice interviews with experienced volunteers.

For Members
-----------

Requesting an Interview
~~~~~~~~~~~~~~~~~~~~~~~

1. Navigate to the "Mock Interviews" page
2. Click "Request Interview"
3. Select interview type:
   
   * **Behavioral** (20 minutes): Soft skills and situational questions
   * **Coding** (55 minutes): Technical coding problems
   * **System Design** (55 minutes): Architecture and scalability discussions

4. Choose an available time slot
5. Provide companies you're interviewing with (optional)
6. Submit your request

Managing Your Interviews
~~~~~~~~~~~~~~~~~~~~~~~~~

* **View all interviews**: See pending, confirmed, completed, and cancelled interviews
* **Filter by status**: Use the filter tabs to view specific interview states
* **Cancel interviews**: Cancel pending or confirmed interviews with optional reason
* **Join interviews**: Access meeting links for confirmed interviews
* **View feedback**: Read interviewer feedback after completion

Interview Statuses
~~~~~~~~~~~~~~~~~~

* **Pending**: Waiting for interviewer assignment
* **Confirmed**: Scheduled with assigned interviewer
* **Completed**: Interview finished with feedback
* **Cancelled**: Interview cancelled by member or admin

For Volunteers
--------------

Managing Availability
~~~~~~~~~~~~~~~~~~~~~

1. Navigate to "Manage Slots" tab
2. Add availability slots:
   
   * **Single slot**: Add one specific time slot
   * **Bulk slots**: Add multiple slots across date ranges
   
3. View calendar of available and booked slots
4. Delete slots as needed

Conducting Interviews
~~~~~~~~~~~~~~~~~~~~~

1. View "Assigned to Me" tab for scheduled interviews
2. Review member's interview request details
3. Join interview at scheduled time via meeting link
4. After completion, provide detailed feedback
5. Mark interview as complete

For Leads
---------

Managing Requests
~~~~~~~~~~~~~~~~~

1. Access "All Requests" tab
2. View all interview requests across the platform
3. Assign interviewers to pending requests from the interviewer pool
4. Confirm interviews with meeting links
5. Cancel interviews with reasons if needed
6. Mark interviews as completed

The "Assign Interviewer" modal shows all volunteers (Role 3+) available to conduct interviews.


Job Applications
================

Members can submit job applications for tracking and support. The platform helps:

* Track application status
* Receive personalized feedback
* Get resume and essay reviews
* Monitor progress across multiple applications

Application Workflow
--------------------

1. **Submission**: Member submits application details
2. **Review**: Lead reviews and provides guidance
3. **Tracking**: Status updates as application progresses
4. **Support**: Ongoing help with follow-ups and preparation


Learning Resources
==================

Access curated learning materials to prepare for technical interviews:

Topics Covered
--------------

* Data Structures and Algorithms (DSA)
* Python programming
* System Design concepts
* Behavioral interview preparation

Features
--------

* Organized topic hierarchy
* Progress tracking
* Recommended study paths
* Practice resources


Resume & Essay Reviews
=======================

Get professional feedback on your application materials:

* Resume reviews
* Cover letter feedback
* Essay editing
* LinkedIn profile optimization

Review Process
--------------

1. Submit materials for review
2. Receive detailed feedback from experienced reviewers
3. Make revisions based on feedback
4. Resubmit for follow-up review if needed


Referral System
===============

Connect with referrers who work at your target companies:

* Browse available referrers
* Request referrals for specific companies
* Track referral status
* Receive interview preparation tips from employees


API Documentation
=================

The platform is built on a RESTful API with the following main endpoints:

Interview Endpoints
-------------------

* ``GET /v1/interviews/timeslots`` - Get available interview slots
* ``POST /v1/interviews`` - Create interview request
* ``GET /v1/interviews/my-requests`` - Get user's interviews
* ``GET /v1/interviews/assigned`` - Get assigned interviews (Volunteer+)
* ``GET /v1/interviews/all`` - Get all interviews (Lead+)
* ``GET /v1/interviews/interviewers`` - Get available interviewers
* ``POST /v1/interviews/{id}/assign`` - Assign interviewer (Lead+)
* ``POST /v1/interviews/{id}/cancel`` - Cancel interview
* ``PATCH /v1/interviews/{id}`` - Update interview status

Application Endpoints
---------------------

* ``GET /v1/applications`` - Get applications
* ``POST /v1/applications`` - Create application
* ``PATCH /v1/applications/{id}`` - Update application
* ``DELETE /v1/applications/{id}`` - Delete application

User Endpoints
--------------

* ``POST /v1/users/signup`` - User registration
* ``POST /v1/users/login`` - User authentication
* ``GET /v1/users/me`` - Get current user
* ``PATCH /v1/users/me`` - Update user profile


Technical Details
=================

Technology Stack
----------------

Backend
~~~~~~~

* **Framework**: FastAPI (Python)
* **Database**: MongoDB
* **Authentication**: JWT tokens
* **Email**: SMTP with custom templates
* **Documentation**: Sphinx

Frontend
~~~~~~~~

* **Framework**: React
* **Routing**: React Router
* **State**: Context API
* **Styling**: Tailwind CSS
* **UI Components**: Headless UI
* **Icons**: Heroicons

Database Schema
---------------

Collections
~~~~~~~~~~~

* ``users`` - User accounts and profiles
* ``mock_interview_requests`` - Interview requests
* ``mock_interview_timeslots`` - Available interview slots
* ``applications`` - Job applications
* ``referrals`` - Referral requests
* ``learning_progress`` - User learning progress

Key Fields
~~~~~~~~~~

Interview Request::

    {
        "_id": ObjectId,
        "user_id": ObjectId,
        "interview_type": "behavioral" | "coding" | "system_design",
        "timeslot_id": ObjectId,
        "timeslot_date": str,
        "timeslot_time": str,
        "assigned_to": ObjectId | null,
        "status": "pending" | "confirmed" | "completed" | "cancelled",
        "pending_companies": [str],
        "meeting_link": str | null,
        "interviewer_feedback": str | null,
        "cancellation_reason": str | null,
        "created_at": datetime
    }


Support & Contact
=================

For questions, issues, or support:

* **Email**: info@techelevate.org
* **Platform**: Submit feedback through the app
* **Documentation**: Check this documentation for guidance


Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
