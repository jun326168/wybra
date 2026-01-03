export interface User {
  id: string;
  email: string;
  username: string;
  provider: string;
  personal_info?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  created_at?: string;
}

