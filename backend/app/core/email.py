from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import aiosmtplib
from app.core.config import settings


class EmailService:
    def __init__(self):
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
        self.from_name = settings.SMTP_FROM_NAME
        self.frontend_url = settings.FRONTEND_URL
    
    @property
    def is_configured(self) -> bool:
        return bool(self.host and self.username and self.password)
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        if not self.is_configured:
            print(f"SMTP not configured. Email not sent to: {to_email}")
            return False
        
        try:
            message = MIMEMultipart("alternative")
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email
            message["Subject"] = subject
            
            if text_content:
                message.attach(MIMEText(text_content, "plain"))
            
            message.attach(MIMEText(html_content, "html"))
            
            await aiosmtplib.send(
                message,
                hostname=self.host,
                port=self.port,
                username=self.username,
                password=self.password,
                start_tls=True,
            )
            
            print(f"Email sent to {to_email}")
            return True
            
        except Exception as e:
            print(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    async def send_password_reset_email(self, to_email: str, reset_token: str) -> bool:
        reset_url = f"{self.frontend_url}/reset-password?token={reset_token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; background: #f8fafc; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #1A9B95, #4490b2); padding: 32px; text-align: center;">
                    <h1 style="color: #fff; margin: 0;">UniPortal</h1>
                </div>
                <div style="padding: 32px;">
                    <h2 style="color: #1e293b;">Reset Your Password</h2>
                    <p style="color: #64748b;">Click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="{reset_url}" style="background: linear-gradient(135deg, #1A9B95, #4490b2); color: #fff; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600;">Reset Password</a>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px;">This link expires in 15 minutes.</p>
                    <p style="color: #94a3b8; font-size: 12px; word-break: break-all;">{reset_url}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"Reset your password: {reset_url}"
        
        if not self.is_configured:
            print(f"Password reset link for {to_email}: {reset_url}")
            return True
        
        return await self.send_email(
            to_email=to_email,
            subject="Reset Your UniPortal Password",
            html_content=html_content,
            text_content=text_content
        )

    async def send_temporary_password_email(self, to_email: str, temp_password: str) -> bool:
        login_url = f"{self.frontend_url}/login"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; background: #f8fafc; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #1A9B95, #4490b2); padding: 32px; text-align: center;">
                    <h1 style="color: #fff; margin: 0;">UniPortal</h1>
                </div>
                <div style="padding: 32px;">
                    <h2 style="color: #1e293b;">Temporary Password</h2>
                    <p style="color: #64748b;">You requested a password reset. Here is your temporary password:</p>
                    <div style="text-align: center; margin: 32px 0;">
                        <div style="background: #f1f5f9; color: #1e293b; padding: 14px 32px; border-radius: 12px; font-family: monospace; font-size: 24px; font-weight: 700; letter-spacing: 2px; display: inline-block; border: 2px dashed #cbd5e1;">
                            {temp_password}
                        </div>
                    </div>
                    <p style="color: #64748b;">Please login with this password and set a new one immediately.</p>
                    <div style="text-align: center; margin-top: 24px;">
                        <a href="{login_url}" style="color: #1A9B95; text-decoration: none; font-weight: 600;">Go to Login Page &rarr;</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"Your temporary password is: {temp_password}\nPlease login at {login_url} and change it immediately."
        
        if not self.is_configured:
            print(f"Temporary password for {to_email}: {temp_password}")
            return True
        
        return await self.send_email(
            to_email=to_email,
            subject="Your Temporary Password - UniPortal",
            html_content=html_content,
            text_content=text_content
        )

    async def send_student_welcome_email(self, to_email: str, name: str, password: str, roll_no: str) -> bool:
        """Send welcome email to new student with credentials."""
        login_url = f"{self.frontend_url}/login"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #2563eb;">Welcome to UniPortal!</h2>
            <p>Dear {name},</p>
            <p>Your student account has been successfully created.</p>
            <div style="background: #eff6ff; padding: 20px; border-radius: 12px; border: 1px solid #dbeafe; margin: 20px 0;">
                <p><strong>Roll Number:</strong> {roll_no}</p>
                <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 1.1em;">{password}</code></p>
            </div>
            <p>Please login and change your password immediately.</p>
            <p><a href="{login_url}" style="background: #2563eb; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; display: inline-block;">Login to Portal</a></p>
        </body>
        </html>
        """
        return await self.send_email(to_email, "Welcome to UniPortal - Your Account Details", html_content)

    async def send_teacher_welcome_email(self, to_email: str, name: str, password: str, designation: str, department: str) -> bool:
        """Send welcome email to new teacher with credentials."""
        login_url = f"{self.frontend_url}/login"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #2563eb;">Welcome to UniPortal, Professor!</h2>
            <p>Dear {name},</p>
            <p>Your teacher account for <strong>{department}</strong> has been successfully created.</p>
            <div style="background: #eff6ff; padding: 20px; border-radius: 12px; border: 1px solid #dbeafe; margin: 20px 0;">
                <p><strong>Designation:</strong> {designation}</p>
                <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 1.1em;">{password}</code></p>
            </div>
            <p>Please login and change your password immediately.</p>
            <p><a href="{login_url}" style="background: #2563eb; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; display: inline-block;">Login to Portal</a></p>
        </body>
        </html>
        """
        return await self.send_email(to_email, "Welcome Faculty - Your Account Details", html_content)

    async def send_exam_schedule_update(self, to_emails: list[str], exam_details: dict) -> bool:
        """Notify students about exam schedule changes."""
        if not to_emails: return True
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #d97706;">Exam Schedule Update</h2>
            <p>The schedule for the following exam has changed:</p>
            <div style="background: #fffbeb; padding: 15px; border-left: 4px solid #d97706; margin: 10px 0;">
                <h3>{exam_details.get('title')}</h3>
                <p><strong>Subject:</strong> {exam_details.get('subject_name')}</p>
                <p><strong>New Date:</strong> {exam_details.get('date')}</p>
                <p><strong>Time:</strong> {exam_details.get('start_time')} - {exam_details.get('end_time')}</p>
            </div>
            <p>Please check your examination portal for more details.</p>
        </body>
        </html>
        """
        # Sending individually to avoid exposing all emails in 'To' header if using bulk
        # For simplicity/speed here, iterating is fine for small batches. 
        # For production large batches, BCC or bulk provider is better.
        for email in to_emails:
            await self.send_email(email, f"UPDATE: Exam Schedule - {exam_details.get('title')}", html_content)
        return True

    async def send_report_card_published(self, to_email: str, result_details: dict) -> bool:
        """Notify student that their results are published."""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #059669;">Results Published</h2>
            <p>Your results for the following exam have been published:</p>
            <div style="background: #ecfdf5; padding: 15px; border-left: 4px solid #059669; margin: 10px 0;">
                <h3>{result_details.get('exam_title')}</h3>
                <p><strong>Subject:</strong> {result_details.get('subject_name')}</p>
                <p><strong>Marks Obtained:</strong> {result_details.get('marks_obtained')}</p>
            </div>
            <p><a href="{self.frontend_url}/dashboard/student/results">View Full Report Card</a></p>
        </body>
        </html>
        """
        return await self.send_email(to_email, "Results Published - UniPortal", html_content)

    async def send_system_maintenance_alert(self, to_emails: list[str], maintenance_details: dict) -> bool:
        """Notify users about system maintenance."""
        if not to_emails: return True
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #dc2626;">System Maintenance Alert</h2>
            <p>The system will be undergoing scheduled maintenance.</p>
            <div style="background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 10px 0;">
                <p><strong>Message:</strong> {maintenance_details.get('message')}</p>
                <p><strong>Start Time:</strong> {maintenance_details.get('start_time')}</p>
                <p><strong>End Time:</strong> {maintenance_details.get('end_time')}</p>
            </div>
            <p>The portal may be unavailable during this period.</p>
        </body>
        </html>
        """
        # Batching or BCC recommended for "all users", but iterating for now
        for email in to_emails:
            await self.send_email(email, "System Maintenance Alert", html_content)
        return True


email_service = EmailService()
