import React from 'react'

export function Email({ type, client, appointment }) {
  const getEmailHeader = () => {
    switch (type) {
      case 'reminder':
        return 'In 30 minutes'
      case 'newClient':
        return 'New Client Added'
      case 'clientEdit':
        return 'Client Updated'
      default:
        return 'Notification'
    }
  }

  return (
    <div className="email-container" style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        backgroundColor: 'var(--color-primary, #7c3aed)',
        color: 'var(--email-text-color, white)',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>{getEmailHeader()}</h1>
      </div>

      {client && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          color: 'var(--email-body-color, #0f172a)'
        }}>
          <h2 style={{ color: 'var(--color-primary, #7c3aed)', marginTop: 0 }}>Client Details</h2>
          <p><strong>Name:</strong> {client.fullName}</p>
          {client.phone && <p><strong>Phone:</strong> {client.phone}</p>}
          {client.email && <p><strong>Email:</strong> {client.email}</p>}
          <p><strong>Address:</strong> {client.address}</p>
          <p><strong>Rate:</strong> ${client.perCutRate}</p>
          <p><strong>Service Frequency:</strong> {client.serviceFrequency}</p>
          <p><strong>Duration:</strong> {client.cutDurationMinutes} minutes</p>
          {client.notes && <p><strong>Notes:</strong> {client.notes}</p>}
        </div>
      )}

      {appointment && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginTop: '20px',
          color: 'var(--email-body-color, #0f172a)'
        }}>
          <h2 style={{ color: 'var(--color-primary, #7c3aed)', marginTop: 0 }}>Appointment Details</h2>
          <p><strong>Date:</strong> {appointment.date}</p>
          <p><strong>Time:</strong> {appointment.time}</p>
        </div>
      )}
    </div>
  )
}
