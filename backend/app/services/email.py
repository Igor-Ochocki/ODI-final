import logging
import aiosmtplib

from app.config import get_settings

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from jinja2 import Template


settings = get_settings()
logger = logging.getLogger(__name__)

PASSWORD_RESET_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ODI Final Project</h1>
        </div>
        <div class="content">
            <h2>Password Reset</h2>
            <p>We have received a request to reset your password.</p>
            <p>Click the button below to reset your password:</p>
            
            <p style="text-align: center;">
                <a href="{{ reset_link }}" class="button">Reset Password</a>
            </p>
            
            <div class="warning">
                <strong>Important:</strong>
                <ul>
                    <li>Link will expire in <strong>1 hour</strong></li>
                    <li>If you did not request a password reset, ignore this message</li>
                    <li>Never share this link with anyone</li>
                </ul>
            </div>
            
            <p>If the button does not work, copy and paste the following link into your browser:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px; font-size: 12px;">
                {{ reset_link }}
            </p>
        </div>
        <div class="footer">
            <p>This message was sent automatically. Do not reply to it.</p>
            <p>© {{ year }} ODI Final Project</p>
        </div>
    </div>
</body>
</html>
"""

PASSWORD_RESET_TEXT_TEMPLATE = """
ODI Final Project - Password Reset
==================================

We have received a request to reset your password for your account.

To set a new password, open the following link:
{{ reset_link }}

Important:
- Link will expire in 1 hour
- If you did not request a password reset, ignore this message
- Never share this link with anyone

---
This message was sent automatically.
© {{ year }} ODI Final Project
"""

class EmailService:
    @staticmethod
    async def send_email(to_email: str, subject: str, html_content: str, text_content: str, sender_email: str = settings.MAIL_FROM) -> bool:
        if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
            logger.warning(f"Email not configured. Would send to {to_email}: {subject}")
            if settings.ENVIRONMENT == "development":
                logger.info(f"[DEV] Email content:\n{text_content}")
                return True
            return False
        
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"ODI Final Project <{sender_email}>"
            message["To"] = to_email

            part1 = MIMEText(text_content, "plain", "utf-8")
            part2 = MIMEText(html_content, "html", "utf-8")

            await aiosmtplib.send(
                message,
                hostname=settings.MAIL_SERVER,
                port=settings.MAIL_PORT,
                username=settings.MAIL_USERNAME,
                password=settings.MAIL_PASSWORD,
                use_tls=settings.MAIL_USE_TLS
            )

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    @staticmethod
    async def send_password_reset_email(to_email: str, reset_token: str) -> bool:
        from datetime import datetime
        
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        year = datetime.now().year
        
        html_template = Template(PASSWORD_RESET_TEMPLATE)
        text_template = Template(PASSWORD_RESET_TEXT_TEMPLATE)
        
        html_content = html_template.render(reset_link=reset_link, year=year)
        text_content = text_template.render(reset_link=reset_link, year=year)
        
        return await EmailService.send_email(
            to_email=to_email,
            subject="ODI Final Project - Password Reset",
            html_content=html_content,
            text_content=text_content
        )

    @staticmethod
    def get_password_reset_preview(reset_token: str) -> dict:
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        return {
            "message": "In development mode, the email is not sent.",
            "reset_link": reset_link,
            "note": "Use the above link to reset your password."
        }
