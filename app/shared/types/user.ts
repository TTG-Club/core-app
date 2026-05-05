export enum Role {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  WRITER = 'WRITER',
  SUBSCRIBER = 'SUBSCRIBER',
  VTTG = 'VTTG',
  USER = 'USER',
}

export interface UserProfile {
  email: string;
  username: string;
  roles: Role[];
}
