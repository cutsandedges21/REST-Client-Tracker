import { SettingsPage } from '../components/SettingsPage'
import { EmailAuth } from '../components/EmailAuth'
import { EmailSettings } from '../components/EmailSettings'

type EmailPageProps = {
  username: string | null
  onBack: () => void
}

export function EmailPage({ username, onBack }: EmailPageProps) {
  return (
    <SettingsPage title="Email" onBack={onBack}>
      <EmailSettings username={username} />
      <EmailAuth />
    </SettingsPage>
  )
}
