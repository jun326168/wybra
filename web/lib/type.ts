export interface User {
  id: string;
  email: string;
  username: string;
  provider: string;
  personal_info: Record<string, unknown>;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface Chat {
  id: string;
  user_1: string;
  user_2: string;
  last_message_id: string;
  message_count: number;
  chat_info: Record<string, unknown>;
  quiz_info: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  created_at: string;
  message_info: Record<string, unknown>;
}