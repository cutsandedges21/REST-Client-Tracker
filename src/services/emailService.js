import emailjs from '@emailjs/browser'

export class EmailService {
  constructor() {
    this.config = null
    this.loadConfig()
  }

  static getInstance() {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  loadConfig() {
    try {
      const savedConfig = localStorage.getItem('emailjsConfig')
      if (savedConfig) {
        this.config = JSON.parse(savedConfig)
      } else {
        this.config = null
      }
    } catch (error) {
      console.error('Error loading EmailJS config:', error)
      this.config = null
    }
  }

  getConfig() {
    // Always reload from localStorage to get the latest config
    this.loadConfig()
    return this.config
  }

  getSubject(type) {
    switch (type) {
      case 'reminder':
        return 'Reminder: Appointment in 30 minutes'
      case 'newClient':
        return 'New Client Added'
      case 'clientEdit':
        return 'Client Updated'
      default:
        return 'Notification'
    }
  }

  generateEmailBody(data) {
    const { type, client, appointment } = data

    switch (type) {
      case 'reminder':
        return `Reminder: You have an appointment with ${client.fullName} in 30 minutes.\n\n` +
               `Time: ${appointment?.time || 'N/A'}\n` +
               `Address: ${client.address || 'N/A'}\n` +
               `Phone: ${client.phone || 'N/A'}`

      case 'newClient':
        return `New client added:\n\n` +
               `Name: ${client.fullName}\n` +
               `Phone: ${client.phone || 'N/A'}\n` +
               `Email: ${client.email || 'N/A'}\n` +
               `Address: ${client.address || 'N/A'}\n` +
               `Rate: $${client.perCutRate} per visit\n` +
               `Frequency: ${client.serviceFrequency}`

      case 'clientEdit':
        return `Client updated:\n\n` +
               `Name: ${client.fullName}\n` +
               `Phone: ${client.phone || 'N/A'}\n` +
               `Email: ${client.email || 'N/A'}\n` +
               `Address: ${client.address || 'N/A'}`

      default:
        return 'Notification from Client Tracker'
    }
  }

  async sendEmail(data) {
    const config = this.getConfig()
    console.log('[EmailService] Config loaded:', config)
    console.log('[EmailService] Data:', data)

    if (!config) {
      console.error('[EmailService] No config found')
      return { success: false, error: 'EmailJS not configured. Please configure it in the Email Settings.' }
    }

    const userEmail = this.getUserEmail()
    console.log('[EmailService] User email:', userEmail)

    if (!userEmail) {
      console.error('[EmailService] No user email found')
      return { success: false, error: 'No user email configured. Please set your email in Email Settings.' }
    }

    try {
      const subject = this.getSubject(data.type)
      const body = this.generateEmailBody(data)

      // Use specific template for client edit, or fall back to default template
      let templateId = config.templateId
      if (data.type === 'clientEdit' && config.clientEditTemplateId) {
        templateId = config.clientEditTemplateId
      }

      console.log('[EmailService] Sending email with:', {
        serviceId: config.serviceId,
        templateId: templateId,
        publicKey: config.publicKey,
        toEmail: userEmail,
        subject,
        emailType: data.type,
      })

      const result = await emailjs.send(
        config.serviceId,
        templateId,
        {
          to_email: userEmail,
          to_name: userEmail.split('@')[0],
          subject: subject,
          message: body,
          client_name: data.client.fullName,
          client_phone: data.client.phone || 'N/A',
          client_address: data.client.address || 'N/A',
          appointment_time: data.appointment?.time || 'N/A',
          appointment_date: data.appointment?.date || 'N/A',
        },
        config.publicKey
      )

      console.log('Email sent successfully to:', userEmail, 'Result:', result)
      return { success: true }
    } catch (error) {
      console.error('Error sending email:', error)
      console.error('Error details:', {
        status: error.status,
        text: error.text,
        message: error.message
      })
      return { success: false, error: error.text || error.message || 'Failed to send email' }
    }
  }

  getUserEmail() {
    return localStorage.getItem('userEmail')
  }

  isConfigured() {
    const config = this.getConfig()
    return !!config && !!config.publicKey && !!config.serviceId && !!config.templateId
  }
}

export const emailService = EmailService.getInstance()
