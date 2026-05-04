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
      }
    } catch (error) {
      console.error('Error loading EmailJS config:', error)
    }
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
    if (!this.config) {
      return { success: false, error: 'EmailJS not configured. Please configure it in the Email Settings.' }
    }

    const userEmail = this.getUserEmail()
    if (!userEmail) {
      return { success: false, error: 'No user email configured. Please set your email in Email Settings.' }
    }

    try {
      const subject = this.getSubject(data.type)
      const body = this.generateEmailBody(data)

      await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        {
          to_email: userEmail,
          subject: subject,
          message: body,
          client_name: data.client.fullName,
          client_phone: data.client.phone || 'N/A',
          client_address: data.client.address || 'N/A',
          appointment_time: data.appointment?.time || 'N/A',
        },
        this.config.publicKey
      )

      console.log('Email sent successfully to:', userEmail)
      return { success: true }
    } catch (error) {
      console.error('Error sending email:', error)
      return { success: false, error: error.message || 'Failed to send email' }
    }
  }

  getUserEmail() {
    return localStorage.getItem('userEmail')
  }

  isConfigured() {
    return !!this.config && !!this.config.publicKey && !!this.config.serviceId && !!this.config.templateId
  }
}

export const emailService = EmailService.getInstance()
