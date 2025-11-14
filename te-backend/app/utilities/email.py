import logging
from pathlib import Path
from typing import Any

import emails
from app.core.settings import settings
from emails.template import JinjaTemplate


def send_email(
    email_to: str,
    subject_template: str = "",
    html_template: str = "",
    environment: dict[str, Any] = {},
) -> None:
    assert settings.EMAILS_ENABLED, "no provided configuration for email variables"

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
    logging.info(f"send email result: {response}")


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
