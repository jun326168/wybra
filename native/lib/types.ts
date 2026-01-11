export interface User {
  id: string;
  email: string;
  username: string;
  provider: string;
  personal_info?: {
    ghost_pos?: { x: number; y: number; size: number };
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
    personality?: string;
  };
  settings?: Record<string, unknown>;
  access?: {
    is_vip: boolean;
    reputation_score: number;
    xray_charges: number;
    xray_target: string | null;
    charges_refill_date: string | null;
  };
  created_at?: string;
  has_chat?: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

export interface Chat {
  id: string;
  user_1: string;
  user_2: string;
  last_message_id: string;
  message_count: number;
  last_message_read?: boolean;
  chat_info?: {
    user_1_progress: number;
    user_2_progress: number;
    user_1_unlocked: boolean;
    user_2_unlocked: boolean;
    show_mid_reward: { user_1?: boolean; user_2?: boolean };
    show_quiz_unlock: { user_1?: boolean; user_2?: boolean };
  };
  quiz_info?: {
    user_1_quiz: QuizQuestion[];
    user_2_quiz: QuizQuestion[];
    last_quiz_level: number;
  };
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