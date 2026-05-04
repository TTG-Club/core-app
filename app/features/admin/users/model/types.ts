export interface AdminRoleResponse {
  id: number;
  name: string;
}

export interface AdminUserResponse {
  id: string;
  username: string;
  email: string;
  enabled: boolean;
  emailVerified: boolean;
  accountLocked: boolean;
  credentialsExpired: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminRoleSelectItem {
  label: string;
  value: number;
}
