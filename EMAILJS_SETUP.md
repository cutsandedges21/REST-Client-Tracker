# EmailJS Setup Guide

## Quick Setup (5 minutes)

### 1. Get Your EmailJS Credentials

1. Go to [emailjs.com](https://www.emailjs.com) and log in
2. Go to **Email Services** → **Add New Service**
3. Choose **Gmail** (recommended) or your preferred email service
4. Follow the setup wizard - it will guide you through connecting your email
5. **Copy your Service ID** (you'll need this)

### 2. Create an Email Template

1. Go to **Email Templates** → **Create New Template**
2. Use this template content:

```
Subject: {{subject}}

To: {{to_email}}

{{message}}

---
Client: {{client_name}}
Phone: {{client_phone}}
Address: {{client_address}}
Appointment Time: {{appointment_time}}
```

3. **Copy your Template ID** (you'll need this)

### 3. Get Your Public Key

1. Go to **Account** → **General**
2. **Copy your Public Key** (this is safe to use in frontend code)

### 4. Configure in Your App

1. Open your app and go to **Email Configuration**
2. Enter the three IDs:
   - **Public Key**: From step 3
   - **Service ID**: From step 1
   - **Template ID**: From step 2
3. Click **Save Configuration**

### 5. Set Your Email Address

1. Go to **Email Settings**
2. Enter your email address
3. Click **Save Email**

### 6. Test It

1. Go to **Email Preview**
2. Select a client and email type
3. Click **Send Test Email**
4. Check your inbox!

## Important Notes

- **Free Tier**: EmailJS free tier allows 200 emails/month
- **Security**: Your Public Key is safe to use in frontend code
- **Testing**: You can test emails from the EmailJS dashboard too
- **Customization**: Edit your email template in EmailJS dashboard to change the design

## Troubleshooting

**Email not sending?**
- Make sure all three IDs are entered correctly
- Check that your email service is connected in EmailJS
- Verify your email address is set in Email Settings

**Template not working?**
- Make sure you're using the correct variable names: `{{subject}}`, `{{message}}`, etc.
- Test your template from the EmailJS dashboard first

**Rate limits?**
- Free tier: 200 emails/month
- Upgrade to paid plan for more emails

## Need Help?

- EmailJS Documentation: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- EmailJS Support: support@emailjs.com
