import logging
from pathlib import Path
from typing import Any

import emails
from app.core.settings import settings
from emails.template import JinjaTemplate

logger = logging.getLogger(__name__)


def send_email(
    email_to: str,
    subject_template: str = "",
    html_template: str = "",
    environment: dict[str, Any] = {},
) -> bool:
    """
    Send an email using SMTP configuration.

    Returns True if email was sent successfully, False otherwise.
    """
    if not settings.EMAILS_ENABLED:
        logger.warning(f"Emails disabled - skipping email to {email_to}")
        return False

    try:
        message = emails.Message(
            subject=JinjaTemplate(subject_template),
            html=JinjaTemplate(html_template),
            mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
        )

        smtp_options = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT}
        if settings.SMTP_TLS:
            smtp_options["tls"] = True
        if settings.SMTP_USER:
            smtp_options["user"] = settings.SMTP_USER
        if settings.SMTP_PASSWORD:
            smtp_options["password"] = settings.SMTP_PASSWORD

        response = message.send(to=email_to, render=environment, smtp=smtp_options)

        if response.status_code in [250, 200]:
            logger.info(f"Email sent successfully to {email_to}")
            return True
        else:
            logger.error(
                f"Email failed to {email_to}: {response.status_code} - {response.error}"
            )
            return False

    except Exception as e:
        logger.error(f"Email error to {email_to}: {str(e)}")
        return False


def send_test_email(email_to: str) -> None:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Test email"
    with open(Path(settings.EMAIL_TEMPLATES_DIR) / "test_email.html") as f:
        template_str = f.read()
    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={"project_name": settings.PROJECT_NAME, "email": email_to},
    )


def send_password_reset_email(email_to: str, code: str, reset_link: str) -> None:
    """Send password reset email containing verification code and CTA link."""

    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Reset your password"
    html_template = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                margin: 0;
                padding: 0;
                background: #f8fafc;
                color: #0f172a;
            }}
            .wrapper {{
                max-width: 600px;
                margin: 0 auto;
                padding: 32px 20px;
            }}
            .card {{
                background: #ffffff;
                border-radius: 20px;
                padding: 36px;
                box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
                border: 1px solid rgba(15, 23, 42, 0.06);
            }}
            .badge {{
                display: inline-block;
                padding: 6px 12px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                background: rgba(59, 130, 246, 0.12);
                color: #2563eb;
                border-radius: 999px;
                margin-bottom: 18px;
            }}
            .code {{
                font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
                font-size: 36px;
                font-weight: 700;
                letter-spacing: 12px;
                text-align: center;
                color: #0f172a;
                background: #f1f5f9;
                border-radius: 16px;
                padding: 18px 12px;
                border: 1px solid rgba(148, 163, 184, 0.45);
            }}
            .cta {{
                display: inline-block;
                margin-top: 24px;
                padding: 14px 28px;
                border-radius: 999px;
                text-decoration: none;
                font-weight: 600;
                background: linear-gradient(135deg, #2563eb, #06b6d4);
                color: white;
            }}
            .footer {{
                margin-top: 32px;
                text-align: center;
                font-size: 13px;
                color: #64748b;
            }}
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="card">
                <span class="badge">Password Reset</span>
                <h2 style="margin: 0 0 12px 0;">Hi there,</h2>
                <p style="margin: 0 0 18px 0;">
                    Use the one-time code below to reset your TechElevate password. This code
                    will expire in 15 minutes.
                </p>
                <div class="code">{code}</div>
                <p style="margin: 22px 0 12px 0;">
                    Or click the button below to continue the reset flow:
                </p>
                <a href="{reset_link}" class="cta">Continue password reset</a>
                <p style="margin: 24px 0 0 0; color: #94a3b8; font-size: 13px;">
                    If you did not request this reset, you can safely ignore this email.
                </p>
            </div>
            <p class="footer">© {project_name} — Secure talent enablement platform</p>
        </div>
    </body>
    </html>
    """

    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=html_template,
        environment={},
    )


def send_new_account_email(email_to: str, username: str, password: str) -> None:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - New account for user {username}"
    with open(Path(settings.EMAIL_TEMPLATES_DIR) / "new_account.html") as f:
        template_str = f.read()
    link = settings.SERVER_HOST
    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            "password": password,
            "email": email_to,
            "link": link,
        },
    )


def send_verification_email(
    email_to: str, code: str, verification_type: str = "registration"
) -> None:
    """
    Send email verification code.

    Args:
        email_to: Email address to send to
        code: 6-digit verification code
        verification_type: "registration" or "email_change"
    """
    project_name = settings.PROJECT_NAME

    if verification_type == "email_change":
        subject = f"{project_name} - Verify Your Email Change"
        purpose = "verify your email change"
    else:
        subject = f"{project_name} - Verify Your Email"
        purpose = "complete your registration"

    # Use simple HTML template
    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f3f4f6;
            }}
            .container {{
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }}
            .header {{
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: -0.5px;
            }}
            .header p {{
                margin: 8px 0 0 0;
                font-size: 14px;
                opacity: 0.95;
            }}
            .content {{
                padding: 40px 30px;
                background-color: #ffffff;
            }}
            .greeting {{
                font-size: 18px;
                font-weight: 600;
                color: #111827;
                margin: 0 0 20px 0;
            }}
            .message {{
                color: #4b5563;
                margin: 0 0 30px 0;
                font-size: 15px;
                line-height: 1.7;
            }}
            .code-container {{
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border: 2px solid #3b82f6;
                border-radius: 12px;
                padding: 30px;
                margin: 30px 0;
                text-align: center;
            }}
            .code-label {{
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #1d4ed8;
                margin: 0 0 12px 0;
            }}
            .code {{
                font-size: 42px;
                font-weight: 800;
                letter-spacing: 12px;
                color: #1e40af;
                margin: 0;
                font-family: 'Courier New', monospace;
            }}
            .expiry {{
                margin: 12px 0 0 0;
                font-size: 13px;
                color: #6b7280;
            }}
            .warning {{
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border-left: 4px solid #f59e0b;
                padding: 16px 20px;
                margin: 30px 0;
                border-radius: 8px;
            }}
            .warning-title {{
                font-weight: 700;
                color: #92400e;
                margin: 0 0 4px 0;
                font-size: 14px;
            }}
            .warning-text {{
                color: #78350f;
                margin: 0;
                font-size: 13px;
                line-height: 1.6;
            }}
            .signature {{
                margin: 30px 0 0 0;
                color: #6b7280;
                font-size: 14px;
            }}
            .signature strong {{
                color: #1f2937;
            }}
            .footer {{
                background-color: #f9fafb;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
                line-height: 1.5;
            }}
            .divider {{
                height: 1px;
                background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
                margin: 30px 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>{{{{ project_name }}}}</h1>
                <p>Email Verification</p>
            </div>
            <div class="content">
                <p class="greeting">Hello!</p>
                <p class="message">Thank you for being a part of {{{{ project_name }}}}! To {purpose}, please use the verification code below:</p>
                
                <div class="code-container">
                    <p class="code-label">Your Verification Code</p>
                    <p class="code">{{{{ code }}}}</p>
                    <p class="expiry">⏱ Expires in 15 minutes</p>
                </div>
                
                <div class="divider"></div>
                
                <div class="warning">
                    <p class="warning-title">🔒 Security Notice</p>
                    <p class="warning-text">If you didn't request this verification code, please ignore this email. Someone may have entered your email address by mistake.</p>
                </div>
                
                <p class="signature">
                    Best regards,<br>
                    <strong>The {{{{ project_name }}}} Team</strong>
                </p>
            </div>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>© 2025 {{{{ project_name }}}}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=html_template,
        environment={
            "project_name": settings.PROJECT_NAME,
            "code": code,
        },
    )


def send_resume_review_completed_email(
    email_to: str, member_name: str, reviewer_name: str, job_title: str
) -> None:
    """
    Send notification when a resume review has been completed.

    Args:
        email_to: Member's email address
        member_name: Name of the member who submitted the resume
        reviewer_name: Name of the reviewer who completed the review
        job_title: Job title the resume was for
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Your Resume Review is Complete"

    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f3f4f6;
            }}
            .container {{
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }}
            .header {{
                background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: -0.5px;
            }}
            .header p {{
                margin: 8px 0 0 0;
                font-size: 14px;
                opacity: 0.95;
            }}
            .content {{
                padding: 40px 30px;
                background-color: #ffffff;
            }}
            .greeting {{
                font-size: 18px;
                font-weight: 600;
                color: #111827;
                margin: 0 0 20px 0;
            }}
            .message {{
                color: #4b5563;
                margin: 0 0 20px 0;
                font-size: 15px;
                line-height: 1.7;
            }}
            .info-box {{
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border-left: 4px solid #10b981;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }}
            .info-box p {{
                margin: 8px 0;
                color: #065f46;
                font-size: 14px;
            }}
            .info-box strong {{
                color: #047857;
            }}
            .cta-button {{
                display: inline-block;
                margin: 30px 0;
                padding: 14px 28px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                text-align: center;
            }}
            .signature {{
                margin: 30px 0 0 0;
                color: #6b7280;
                font-size: 14px;
            }}
            .signature strong {{
                color: #1f2937;
            }}
            .footer {{
                background-color: #f9fafb;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
                line-height: 1.5;
            }}
            .divider {{
                height: 1px;
                background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
                margin: 30px 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✓ Review Complete</h1>
                <p>Your resume has been reviewed</p>
            </div>
            <div class="content">
                <p class="greeting">Hi {{{{ member_name }}}},</p>
                <p class="message">Great news! Your resume review has been completed by {{{{ reviewer_name }}}}.</p>
                
                <div class="info-box">
                    <p><strong>Position:</strong> {{{{ job_title }}}}</p>
                    <p><strong>Reviewed by:</strong> {{{{ reviewer_name }}}}</p>
                </div>
                
                <p class="message">Log in to your TechElevate account to view the detailed feedback and recommendations.</p>
                
                <a href="{settings.SERVER_HOST}/resumes" class="cta-button">View Your Feedback</a>
                
                <div class="divider"></div>
                
                <p class="signature">
                    Best regards,<br>
                    <strong>The {{{{ project_name }}}} Team</strong>
                </p>
            </div>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>© 2025 {{{{ project_name }}}}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=html_template,
        environment={
            "project_name": settings.PROJECT_NAME,
            "member_name": member_name,
            "reviewer_name": reviewer_name,
            "job_title": job_title,
        },
    )


def send_resume_review_request_email(
    member_name: str, member_email: str, job_title: str, level: str
) -> None:
    """
    Send notification to info@techelevate.org when a new resume review is requested.

    Args:
        member_name: Name of the member requesting review
        member_email: Email of the member
        job_title: Job title for the resume
        level: Experience level (entry, mid, senior)
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - New Resume Review Request"
    admin_email = "info@techelevate.org"

    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f3f4f6;
            }}
            .container {{
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }}
            .header {{
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: -0.5px;
            }}
            .header p {{
                margin: 8px 0 0 0;
                font-size: 14px;
                opacity: 0.95;
            }}
            .content {{
                padding: 40px 30px;
                background-color: #ffffff;
            }}
            .greeting {{
                font-size: 18px;
                font-weight: 600;
                color: #111827;
                margin: 0 0 20px 0;
            }}
            .message {{
                color: #4b5563;
                margin: 0 0 20px 0;
                font-size: 15px;
                line-height: 1.7;
            }}
            .info-box {{
                background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
                border-left: 4px solid #f59e0b;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }}
            .info-box p {{
                margin: 8px 0;
                color: #78350f;
                font-size: 14px;
            }}
            .info-box strong {{
                color: #92400e;
            }}
            .cta-button {{
                display: inline-block;
                margin: 30px 0;
                padding: 14px 28px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
                text-align: center;
            }}
            .signature {{
                margin: 30px 0 0 0;
                color: #6b7280;
                font-size: 14px;
            }}
            .signature strong {{
                color: #1f2937;
            }}
            .footer {{
                background-color: #f9fafb;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
                line-height: 1.5;
            }}
            .divider {{
                height: 1px;
                background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
                margin: 30px 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📝 New Resume Review</h1>
                <p>Action required</p>
            </div>
            <div class="content">
                <p class="greeting">TechElevate Team,</p>
                <p class="message">A new resume review request has been submitted and is waiting for assignment.</p>
                
                <div class="info-box">
                    <p><strong>Member:</strong> {{{{ member_name }}}} ({{{{ member_email }}}})</p>
                    <p><strong>Position:</strong> {{{{ job_title }}}}</p>
                    <p><strong>Level:</strong> {{{{ level }}}}</p>
                </div>
                
                <p class="message">Please log in to the admin panel to assign a reviewer.</p>
                
                <a href="{settings.SERVER_HOST}/admin/resumes" class="cta-button">Manage Reviews</a>
                
                <div class="divider"></div>
                
                <p class="signature">
                    Best regards,<br>
                    <strong>{{{{ project_name }}}} Automated System</strong>
                </p>
            </div>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>© 2025 {{{{ project_name }}}}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    send_email(
        email_to=admin_email,
        subject_template=subject,
        html_template=html_template,
        environment={
            "project_name": settings.PROJECT_NAME,
            "member_name": member_name,
            "member_email": member_email,
            "job_title": job_title,
            "level": level,
        },
    )


def send_referral_request_email(
    member_name: str, member_email: str, company_name: str, position: str, level: str
) -> None:
    """
    Send notification to info@techelevate.org when a new referral is requested.

    Args:
        member_name: Name of the member requesting referral
        member_email: Email of the member
        company_name: Company name for the referral
        position: Position/job title
        level: Experience level (Intern, New grad, etc.)
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - New Referral Request"
    admin_email = "info@techelevate.org"

    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f3f4f6;
            }}
            .container {{
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }}
            .header {{
                background: linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: -0.5px;
            }}
            .header p {{
                margin: 8px 0 0 0;
                font-size: 14px;
                opacity: 0.95;
            }}
            .content {{
                padding: 40px 30px;
                background-color: #ffffff;
            }}
            .greeting {{
                font-size: 18px;
                font-weight: 600;
                color: #111827;
                margin: 0 0 20px 0;
            }}
            .message {{
                color: #4b5563;
                margin: 0 0 20px 0;
                font-size: 15px;
                line-height: 1.7;
            }}
            .info-box {{
                background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%);
                border-left: 4px solid #06b6d4;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }}
            .info-box p {{
                margin: 8px 0;
                color: #164e63;
                font-size: 14px;
            }}
            .info-box strong {{
                color: #0e7490;
            }}
            .cta-button {{
                display: inline-block;
                margin: 30px 0;
                padding: 14px 28px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                background: linear-gradient(135deg, #06b6d4, #0891b2);
                color: white;
                text-align: center;
            }}
            .signature {{
                margin: 30px 0 0 0;
                color: #6b7280;
                font-size: 14px;
            }}
            .signature strong {{
                color: #1f2937;
            }}
            .footer {{
                background-color: #f9fafb;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
                line-height: 1.5;
            }}
            .divider {{
                height: 1px;
                background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
                margin: 30px 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤝 New Referral Request</h1>
                <p>Action required</p>
            </div>
            <div class="content">
                <p class="greeting">TechElevate Team,</p>
                <p class="message">A new referral request has been submitted and is waiting to be processed.</p>
                
                <div class="info-box">
                    <p><strong>Member:</strong> {{{{ member_name }}}} ({{{{ member_email }}}})</p>
                    <p><strong>Company:</strong> {{{{ company_name }}}}</p>
                    <p><strong>Position:</strong> {{{{ position }}}}</p>
                    <p><strong>Level:</strong> {{{{ level }}}}</p>
                </div>
                
                <p class="message">Please log in to the admin panel to review and assign this referral request.</p>
                
                <a href="{settings.SERVER_HOST}/admin/referrals" class="cta-button">Manage Referrals</a>
                
                <div class="divider"></div>
                
                <p class="signature">
                    Best regards,<br>
                    <strong>{{{{ project_name }}}} Automated System</strong>
                </p>
            </div>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>© 2025 {{{{ project_name }}}}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    send_email(
        email_to=admin_email,
        subject_template=subject,
        html_template=html_template,
        environment={
            "project_name": settings.PROJECT_NAME,
            "member_name": member_name,
            "member_email": member_email,
            "company_name": company_name,
            "position": position,
            "level": level,
        },
    )


def send_referral_update_email(
    email_to: str, member_name: str, company_name: str, position: str, feedback: str
) -> None:
    """
    Send notification when a referral has been updated with feedback.

    Args:
        email_to: Member's email address
        member_name: Name of the member
        company_name: Company name
        position: Position they were referred for
        feedback: Feedback/review note from the referrer
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Referral Update"

    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f3f4f6;
            }}
            .container {{
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }}
            .header {{
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: -0.5px;
            }}
            .header p {{
                margin: 8px 0 0 0;
                font-size: 14px;
                opacity: 0.95;
            }}
            .content {{
                padding: 40px 30px;
                background-color: #ffffff;
            }}
            .greeting {{
                font-size: 18px;
                font-weight: 600;
                color: #111827;
                margin: 0 0 20px 0;
            }}
            .message {{
                color: #4b5563;
                margin: 0 0 20px 0;
                font-size: 15px;
                line-height: 1.7;
            }}
            .info-box {{
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border-left: 4px solid #3b82f6;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }}
            .info-box p {{
                margin: 8px 0;
                color: #1e40af;
                font-size: 14px;
            }}
            .info-box strong {{
                color: #1e3a8a;
            }}
            .feedback-box {{
                background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
                border-left: 4px solid #f59e0b;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }}
            .feedback-box p {{
                margin: 0;
                color: #78350f;
                font-size: 14px;
                font-style: italic;
            }}
            .cta-button {{
                display: inline-block;
                margin: 30px 0;
                padding: 14px 28px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                color: white;
                text-align: center;
            }}
            .signature {{
                margin: 30px 0 0 0;
                color: #6b7280;
                font-size: 14px;
            }}
            .signature strong {{
                color: #1f2937;
            }}
            .footer {{
                background-color: #f9fafb;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
                line-height: 1.5;
            }}
            .divider {{
                height: 1px;
                background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
                margin: 30px 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📝 Referral Update</h1>
                <p>Your referral has been reviewed</p>
            </div>
            <div class="content">
                <p class="greeting">Hi {{{{ member_name }}}},</p>
                <p class="message">Great news! Your referral request has been reviewed and updated.</p>
                
                <div class="info-box">
                    <p><strong>Company:</strong> {{{{ company_name }}}}</p>
                    <p><strong>Position:</strong> {{{{ position }}}}</p>
                </div>
                
                <div class="feedback-box">
                    <p><strong>Feedback:</strong></p>
                    <p>{{{{ feedback }}}}</p>
                </div>
                
                <p class="message">Please check your referral dashboard for more details and next steps.</p>
                
                <a href="{settings.SERVER_HOST}/referrals" class="cta-button">View Your Referrals</a>
                
                <div class="divider"></div>
                
                <p class="signature">
                    Best regards,<br>
                    <strong>The {{{{ project_name }}}} Team</strong>
                </p>
            </div>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>© 2025 {{{{ project_name }}}}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=html_template,
        environment={
            "project_name": settings.PROJECT_NAME,
            "member_name": member_name,
            "company_name": company_name,
            "position": position,
            "feedback": feedback,
        },
    )


# ============== Mock Interview Email Functions ==============


def send_interview_request_email(
    member_name: str,
    member_email: str,
    interview_type: str,
    timeslot_date: str,
    timeslot_time: str,
    pending_companies: list[str],
) -> None:
    """
    Send notification to info@techelevate.org when a new interview is requested.
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - New Interview Request"
    admin_email = "info@techelevate.org"

    # Only show pending companies for mock interviews (not 1-on-1 sessions)
    is_one_on_one = interview_type.lower() == 'one_on_one' or interview_type.lower() == '1-on-1 mentorship'
    companies_section = ""
    if not is_one_on_one and pending_companies:
        companies_str = ", ".join(pending_companies)
        companies_section = f'<p><strong>Pending Companies:</strong> {companies_str}</p>'

    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f3f4f6;
            }}
            .container {{
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }}
            .content {{
                padding: 40px 30px;
            }}
            .info-box {{
                background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%);
                border-left: 4px solid #06b6d4;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }}
            .info-box p {{
                margin: 8px 0;
                color: #164e63;
                font-size: 14px;
            }}
            .cta-button {{
                display: inline-block;
                margin: 30px 0;
                padding: 14px 28px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                background: linear-gradient(135deg, #06b6d4, #0891b2);
                color: white;
            }}
            .footer {{
                background-color: #f9fafb;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎤 New Interview Request</h1>
                <p>Action required</p>
            </div>
            <div class="content">
                <p class="greeting">TechElevate Team,</p>
                <p>A new interview request has been submitted.</p>
                
                <div class="info-box">
                    <p><strong>Member:</strong> {member_name} ({member_email})</p>
                    <p><strong>Interview Type:</strong> {interview_type}</p>
                    <p><strong>Date:</strong> {timeslot_date}</p>
                    <p><strong>Time:</strong> {timeslot_time}</p>
                    {companies_section}
                </div>
                
                <p>Please log in to the admin panel to assign an interviewer.</p>
                
                <a href="{settings.SERVER_HOST}/workspace?section=mock%20interviews" class="cta-button">Manage Interviews</a>
            </div>
            <div class="footer">
                <p>© 2025 {project_name}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    send_email(
        email_to=admin_email,
        subject_template=subject,
        html_template=html_template,
        environment={},
    )


def send_interview_assigned_email(
    email_to: str,
    interviewer_name: str,
    member_name: str,
    interview_type: str,
    timeslot_date: str,
    timeslot_time: str,
    duration_minutes: int,
) -> None:
    """
    Send notification to the assigned interviewer.
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - You've Been Assigned a Mock Interview"

    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f3f4f6;
            }}
            .container {{
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }}
            .content {{
                padding: 40px 30px;
            }}
            .info-box {{
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border-left: 4px solid #3b82f6;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }}
            .info-box p {{
                margin: 8px 0;
                color: #1e40af;
                font-size: 14px;
            }}
            .footer {{
                background-color: #f9fafb;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📋 Interview Assignment</h1>
                <p>You've been assigned as an interviewer</p>
            </div>
            <div class="content">
                <p>Hi {interviewer_name},</p>
                <p>You've been assigned to conduct a mock interview.</p>
                
                <div class="info-box">
                    <p><strong>Member:</strong> {member_name}</p>
                    <p><strong>Interview Type:</strong> {interview_type}</p>
                    <p><strong>Date:</strong> {timeslot_date}</p>
                    <p><strong>Time:</strong> {timeslot_time}</p>
                    <p><strong>Duration:</strong> {duration_minutes} minutes</p>
                </div>
                
                <p>Please prepare accordingly and reach out if you have any questions.</p>
            </div>
            <div class="footer">
                <p>© 2025 {project_name}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=html_template,
        environment={},
    )


def send_interview_confirmed_email(
    email_to: str,
    member_name: str,
    interview_type: str,
    timeslot_date: str,
    timeslot_time: str,
    duration_minutes: int,
    interviewer_name: str,
    meeting_link: str,
    confirmation_message: str = "",
) -> None:
    """
    Send confirmation email to the member when their interview is confirmed.
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Your Mock Interview is Confirmed!"

    meeting_section = (
        f'<p><strong>Meeting Link:</strong> <a href="{meeting_link}">{meeting_link}</a></p>'
        if meeting_link
        else ""
    )
    message_section = (
        f"<p><strong>Message:</strong> {confirmation_message}</p>"
        if confirmation_message
        else ""
    )

    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f3f4f6;
            }}
            .container {{
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }}
            .content {{
                padding: 40px 30px;
            }}
            .info-box {{
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border-left: 4px solid #10b981;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }}
            .info-box p {{
                margin: 8px 0;
                color: #065f46;
                font-size: 14px;
            }}
            .footer {{
                background-color: #f9fafb;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Interview Confirmed!</h1>
                <p>Your mock interview is scheduled</p>
            </div>
            <div class="content">
                <p>Hi {member_name},</p>
                <p>Great news! Your mock interview has been confirmed.</p>
                
                <div class="info-box">
                    <p><strong>Interview Type:</strong> {interview_type}</p>
                    <p><strong>Date:</strong> {timeslot_date}</p>
                    <p><strong>Time:</strong> {timeslot_time}</p>
                    <p><strong>Duration:</strong> {duration_minutes} minutes</p>
                    <p><strong>Interviewer:</strong> {interviewer_name}</p>
                    {meeting_section}
                    {message_section}
                </div>
                
                <p>Please be ready a few minutes before the scheduled time. Good luck!</p>
            </div>
            <div class="footer">
                <p>© 2025 {project_name}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=html_template,
        environment={},
    )


def send_interview_completed_email(
    email_to: str,
    member_name: str,
    interview_type: str,
    interviewer_name: str,
    feedback: str,
) -> None:
    """
    Send feedback email to the member when their interview is completed.
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Your Mock Interview Feedback"

    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f3f4f6;
            }}
            .container {{
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }}
            .content {{
                padding: 40px 30px;
            }}
            .feedback-box {{
                background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
                border-left: 4px solid #f59e0b;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }}
            .feedback-box p {{
                margin: 8px 0;
                color: #78350f;
                font-size: 14px;
                white-space: pre-wrap;
            }}
            .footer {{
                background-color: #f9fafb;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📝 Interview Feedback</h1>
                <p>Your {interview_type} mock interview is complete</p>
            </div>
            <div class="content">
                <p>Hi {member_name},</p>
                <p>Thank you for participating in your mock interview with {interviewer_name}. Here's your feedback:</p>
                
                <div class="feedback-box">
                    <p>{feedback}</p>
                </div>
                
                <p>Keep practicing and best of luck with your upcoming interviews!</p>
            </div>
            <div class="footer">
                <p>© 2025 {project_name}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=html_template,
        environment={},
    )


def send_interview_cancelled_email(
    email_to: str,
    member_name: str,
    interview_type: str,
    timeslot_date: str,
    timeslot_time: str,
    cancellation_reason: str = "",
) -> None:
    """
    Send cancellation notification to the member.
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Mock Interview Cancelled"

    reason_section = (
        f"<p><strong>Reason:</strong> {cancellation_reason}</p>"
        if cancellation_reason
        else ""
    )

    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f3f4f6;
            }}
            .container {{
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }}
            .content {{
                padding: 40px 30px;
            }}
            .info-box {{
                background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                border-left: 4px solid #ef4444;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }}
            .info-box p {{
                margin: 8px 0;
                color: #7f1d1d;
                font-size: 14px;
            }}
            .cta-button {{
                display: inline-block;
                margin: 30px 0;
                padding: 14px 28px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                color: white;
            }}
            .footer {{
                background-color: #f9fafb;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>❌ Interview Cancelled</h1>
                <p>Your mock interview has been cancelled</p>
            </div>
            <div class="content">
                <p>Hi {member_name},</p>
                <p>Your scheduled mock interview has been cancelled.</p>
                
                <div class="info-box">
                    <p><strong>Interview Type:</strong> {interview_type}</p>
                    <p><strong>Date:</strong> {timeslot_date}</p>
                    <p><strong>Time:</strong> {timeslot_time}</p>
                    {reason_section}
                </div>
                
                <p>You can schedule a new mock interview at any time.</p>
                
                <a href="{settings.SERVER_HOST}/workspace?section=mock%20interviews" class="cta-button">Schedule New Interview</a>
            </div>
            <div class="footer">
                <p>© 2025 {project_name}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=html_template,
        environment={},
    )


def send_referral_completed_email(
    email_to: str, member_name: str, company_name: str, position: str
) -> None:
    """
    Send notification when a referral status is marked as completed.

    Args:
        email_to: Member's email address
        member_name: Name of the member
        company_name: Company name
        position: Position they were referred for
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Referral Complete"

    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f3f4f6;
            }}
            .container {{
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }}
            .header {{
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: -0.5px;
            }}
            .header p {{
                margin: 8px 0 0 0;
                font-size: 14px;
                opacity: 0.95;
            }}
            .content {{
                padding: 40px 30px;
                background-color: #ffffff;
            }}
            .greeting {{
                font-size: 18px;
                font-weight: 600;
                color: #111827;
                margin: 0 0 20px 0;
            }}
            .message {{
                color: #4b5563;
                margin: 0 0 20px 0;
                font-size: 15px;
                line-height: 1.7;
            }}
            .info-box {{
                background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
                border-left: 4px solid #8b5cf6;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }}
            .info-box p {{
                margin: 8px 0;
                color: #5b21b6;
                font-size: 14px;
            }}
            .info-box strong {{
                color: #6d28d9;
            }}
            .cta-button {{
                display: inline-block;
                margin: 30px 0;
                padding: 14px 28px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                color: white;
                text-align: center;
            }}
            .signature {{
                margin: 30px 0 0 0;
                color: #6b7280;
                font-size: 14px;
            }}
            .signature strong {{
                color: #1f2937;
            }}
            .footer {{
                background-color: #f9fafb;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
                line-height: 1.5;
            }}
            .divider {{
                height: 1px;
                background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
                margin: 30px 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Referral Complete!</h1>
                <p>Your referral has been processed</p>
            </div>
            <div class="content">
                <p class="greeting">Hi {{{{ member_name }}}},</p>
                <p class="message">Congratulations! Your referral has been successfully completed.</p>
                
                <div class="info-box">
                    <p><strong>Company:</strong> {{{{ company_name }}}}</p>
                    <p><strong>Position:</strong> {{{{ position }}}}</p>
                </div>
                
                <p class="message">Thank you for using TechElevate's referral network. We hope this connection leads to great opportunities!</p>
                
                <a href="{settings.SERVER_HOST}/referrals" class="cta-button">View Your Referrals</a>
                
                <div class="divider"></div>
                
                <p class="signature">
                    Best regards,<br>
                    <strong>The {{{{ project_name }}}} Team</strong>
                </p>
            </div>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>© 2025 {{{{ project_name }}}}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=html_template,
        environment={
            "project_name": settings.PROJECT_NAME,
            "member_name": member_name,
            "company_name": company_name,
            "position": position,
        },
    )


def send_meeting_reminder_email(
    email_to: str,
    recipient_name: str,
    member_name: str,
    interview_type: str,
    timeslot_date: str,
    timeslot_time: str,
    duration_minutes: int,
    meeting_notes: str = "",
) -> None:
    """
    Send reminder email 30 minutes before a scheduled meeting.

    Args:
        email_to: Email address to send to (volunteer+ or admin)
        recipient_name: Name of the recipient
        member_name: Name of the member being interviewed
        interview_type: Type of interview (Behavioral, Technical, etc.)
        timeslot_date: Date of the meeting (YYYY-MM-DD)
        timeslot_time: Time of the meeting (HH:MM)
        duration_minutes: Duration in minutes
        meeting_notes: Optional meeting notes
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Meeting Reminder: {interview_type} in 30 Minutes"

    notes_section = (
        f"""
                <div class="notes-box">
                    <p><strong>Notes:</strong></p>
                    <p>{meeting_notes}</p>
                </div>
                """
        if meeting_notes
        else ""
    )

    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f3f4f6;
            }}
            .container {{
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }}
            .header p {{
                margin: 8px 0 0 0;
                font-size: 14px;
                opacity: 0.95;
            }}
            .content {{
                padding: 40px 30px;
            }}
            .reminder-badge {{
                display: inline-block;
                padding: 8px 16px;
                background: linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%);
                color: #164e63;
                border-radius: 999px;
                font-weight: 700;
                font-size: 14px;
                margin-bottom: 20px;
                border: 2px solid #06b6d4;
            }}
            .info-box {{
                background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%);
                border-left: 4px solid #06b6d4;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }}
            .info-box p {{
                margin: 8px 0;
                color: #164e63;
                font-size: 15px;
            }}
            .info-box strong {{
                color: #0e7490;
            }}
            .notes-box {{
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border-left: 4px solid #3b82f6;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }}
            .notes-box p {{
                margin: 8px 0;
                color: #1e40af;
                font-size: 14px;
            }}
            .cta-button {{
                display: inline-block;
                margin: 30px 0;
                padding: 14px 28px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                background: linear-gradient(135deg, #06b6d4, #0891b2);
                color: white;
            }}
            .footer {{
                background-color: #f9fafb;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏰ Meeting Reminder</h1>
                <p>Your meeting starts in 30 minutes</p>
            </div>
            <div class="content">
                <span class="reminder-badge">🔔 STARTS IN 30 MINUTES</span>
                
                <p>Hi {recipient_name},</p>
                <p>This is a friendly reminder about your upcoming mock interview.</p>
                
                <div class="info-box">
                    <p><strong>Member:</strong> {member_name}</p>
                    <p><strong>Interview Type:</strong> {interview_type}</p>
                    <p><strong>Date:</strong> {timeslot_date}</p>
                    <p><strong>Time:</strong> {timeslot_time}</p>
                    <p><strong>Duration:</strong> {duration_minutes} minutes</p>
                </div>
                {notes_section}
                
                <p>Please be ready a few minutes early. Good luck!</p>
                
                <a href="{settings.SERVER_HOST}/workspace?section=mock%20interviews" class="cta-button">View Details</a>
            </div>
            <div class="footer">
                <p>© 2025 {project_name}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=html_template,
        environment={},
    )
