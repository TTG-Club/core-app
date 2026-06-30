export enum Role {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  WRITER = 'WRITER',
  VTTG = 'VTTG',
  USER = 'USER',
}

export interface UserProfile {
  email: string;
  username: string;
  roles: string[];
}
