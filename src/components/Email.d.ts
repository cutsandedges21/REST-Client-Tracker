export interface EmailProps {
  type: 'reminder' | 'newClient' | 'clientEdit'
  client: any
  appointment?: any
}

export function Email({ type, client, appointment }: EmailProps): JSX.Element