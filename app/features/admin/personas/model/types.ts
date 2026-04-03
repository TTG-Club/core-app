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
  type: string;
  typeName: string;
  personaId: string;
  text: string;
  view?: number | null;
  after?: string | null;
  before?: string | null;
  disabled: boolean;
  username?: string;
  createdAt?: string;
}
