export interface UserSummary {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  status: 'ACTIVE' | 'INACTIVE';
  email_verified: boolean;
}

export type UserRole = 'ADMIN' | 'CREDITOR' | 'BORROWER';

export interface AuthTokenBundle {
  access_token: string;
  expires_in_seconds: number;
  user: UserSummary;
}

export interface SessionSummary {
  id: string;
  created_at: string;
  last_seen_at: string;
  is_current: boolean;
  user_agent: string;
  ip_address?: string;
  location_hint?: string;
}

export interface Role {
  key: UserRole;
  label: string;
  permissions: string[];
}

export interface BorrowerDirectoryItem {
  id: string;
  name: string;
  email: string;
}
