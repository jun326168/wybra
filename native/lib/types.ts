export interface User {
  id: string;
  email: string;
  username: string;
  provider: string;
  personal_info?: {
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
}

