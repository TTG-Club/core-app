export interface PersonaResponse {
  id: string;
  name: string;
  image: string;
  disabled: boolean;
  username: string;
  createdAt: string;
}

export interface NotificationAdminResponse {
  id: number;
  type: 'PHRASE' | 'NEWS' | 'ADVERTISING';
  typeName: string;
  personaId: string;
  text: unknown;
  view?: number | null;
  after?: string | null;
  before?: string | null;
  disabled: boolean;
  username?: string;
  createdAt?: string;
}

export interface NotificationTypeOption {
  label: string;
  value: string;
}
