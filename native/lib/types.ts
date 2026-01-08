export interface User {
  id: string;
  email: string;
  username: string;
  provider: string;
  personal_info?: {
    real_name: string;
    color: string;
    template: string;
    mbti: string;
    birthday: string;
    gender: string;
    sexual_orientation: string;
    looking_for: string;
    bio: string;
    custom_question: {
      love: string;
      hate: string;
    };
    interests: string[];
    avatar_url: string;
    friends_count: number;
  };
  settings?: Record<string, unknown>;
  created_at?: string;
  has_chat?: boolean;
}

export interface Chat {
  id: string;
  user_1: string;
  user_2: string;
  last_message_id: string;
  message_count: number;
  last_message_read?: boolean;
  chat_info?: Record<string, unknown>;
  quiz_info?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  other_user?: {
    id: string;
    username: string | null;
    personal_info: Record<string, unknown> | null;
  };
  last_message?: {
    id: string;
    content: string | null;
    sender_id: string | null;
    created_at: string | null;
  };
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  created_at: string;
  message_info: Record<string, unknown>;
}