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
  user_1 UUID NOT NULL, -- conversation starter id
  user_2 UUID NOT NULL, -- receiver id
  message_count INT NOT NULL DEFAULT 0, -- message count
  last_message_id UUID, -- last message id
  last_message_read BOOLEAN NOT NULL DEFAULT false, -- whether the last message has been read by the recipient
  chat_info JSONB NOT NULL DEFAULT '{ "accepted": false, "user_1_progress": 0, "user_2_progress": 0, "user_1_unlocked": false, "user_2_unlocked": false }', -- chat info (accepted, user_1_progress, user_2_progress, user_1_unlocked, user_2_unlocked)
  quiz_info JSONB NOT NULL DEFAULT '{ "user_1_quiz": [], "user_2_quiz": [], "last_quiz_level": 0 }', -- quiz info (user_1_quiz, user_2_quiz, last_quiz_level)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  message_info JSONB NOT NULL DEFAULT '{}',
  FOREIGN KEY (chat_id) REFERENCES chats(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
);