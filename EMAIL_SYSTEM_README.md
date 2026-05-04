# Client Email System

A comprehensive email notification system for the client tracker app.

## Features

- **30-Minute Reminders**: Automatic email reminders before appointments
- **New Client Notifications**: Email alerts when new clients are added
- **Client Update Notifications**: Email alerts when client information is updated
- **Email Preview**: Preview emails before they're sent
- **User Configuration**: Easy email setup and management

## Setup

1. Configure your email address in the app settings
2. The system will automatically send notifications based on your actions
3. Use the Email Preview to test different email types

## Email Types

### Reminder Email
Sent 30 minutes before scheduled appointments.

### New Client Email
Sent immediately after adding a new client.

### Client Edit Email
Sent immediately after updating client information.

## Components

- **Email.jsx**: Main email component with styling
- **EmailSettings.jsx**: User email configuration
- **EmailPreview.jsx**: Email testing and preview
- **emailService.ts**: Email service module
- **reminderScheduler.ts**: Background reminder scheduler

## Future Enhancements

- Gmail API integration for actual email sending
- Customizable reminder times
- Email template customization
- Multiple recipient support
- Email history and logging

## Troubleshooting

**Emails not sending?**
- Verify your email is configured in settings
- Check browser console for errors
- Ensure localStorage is enabled

**Reminders not working?**
- Verify appointments are scheduled correctly
- Check browser console for scheduler activity
- Ensure app is running in browser

## Support

For Gmail API setup, see [GMAIL_API_SETUP.md](./GMAIL_API_SETUP.md)