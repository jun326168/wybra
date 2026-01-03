CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  provider VARCHAR(50) NOT NULL, -- google, apple, etc.
  personal_info JSONB NOT NULL DEFAULT '{}', -- gender, bio, age, etc.
  settings JSONB NOT NULL DEFAULT '{}', -- language, preferences, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
);

CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  users UUID[] NOT NULL, -- 2 users
  last_message_id UUID NOT NULL, -- last message id
  chat_info JSONB NOT NULL DEFAULT '{}', -- chat info
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL,
  content TEXT NOT NULL,
  sender_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (chat_id) REFERENCES chats(id),
  FOREIGN KEY (sender_id) REFERENCES users(id),
);