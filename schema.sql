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

CREATE TABLE user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id),
);

CREATE TABLE daily_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feed_date VARCHAR(10) NOT NULL, -- YYYY-MM-DD format
  user_ids JSONB NOT NULL DEFAULT '[]', -- array of user UUIDs in the feed
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, feed_date) -- one feed per user per day
);

CREATE TABLE user_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  is_vip BOOLEAN NOT NULL DEFAULT false,
  reputation_score INT NOT NULL DEFAULT 100, -- Starts at 100. Bans drop this.
  xray_charges INT NOT NULL DEFAULT 1, -- Refills daily
  xray_target UUID, -- Target user ID for X-ray
  charges_refill_date VARCHAR(10), -- YYYY-MM-DD format
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id) -- one access record per user
);

CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(255) NOT NULL,
  invited_user_id UUID NOT NULL,
  used_by_user_id UUID,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, used, revoked
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (invited_user_id) REFERENCES users(id),
  FOREIGN KEY (used_by_user_id) REFERENCES users(id),
  UNIQUE(invited_user_id) -- one invite per user
  UNIQUE(code) -- one code per invite
);

CREATE TABLE user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL, -- user who is reporting
  reported_id UUID NOT NULL, -- user who is being reported
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_id) REFERENCES users(id) ON DELETE CASCADE
);