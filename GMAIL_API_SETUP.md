# Gmail API Setup Guide

This guide will help you set up Gmail API integration for the client email system.

## Prerequisites

- Google Cloud Project
- Gmail API enabled
- OAuth 2.0 credentials

## Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API:
   - Go to APIs & Services > Library
   - Search for "Gmail API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth client ID"
3. Configure consent screen if prompted
4. Choose "Web application"
5. Add authorized redirect URIs (for development):
   - `http://localhost:5173`
6. Copy the Client ID and Client Secret

### 3. Install Required Packages

```bash
npm install googleapis
```

### 4. Configure Environment Variables

Create a `.env` file in your project root:

```env
VITE_GMAIL_CLIENT_ID=your_client_id
VITE_GMAIL_CLIENT_SECRET=your_client_secret
VITE_GMAIL_REDIRECT_URI=http://localhost:5173
```

### 5. Update Email Service

The email service will need to be updated to use the Gmail API for actual email sending. This is currently a placeholder implementation.

## Security Notes

- Never commit `.env` file to version control
- Use environment variables for sensitive data
- Consider using a backend service for production deployments
- Implement proper error handling and rate limiting

## Testing

1. Configure your email in the app settings
2. Add a new client to test new client email
3. Edit a client to test client edit email
4. Schedule an appointment to test reminder email