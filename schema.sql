CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  provider VARCHAR(50) NOT NULL, -- google, apple, etc.
  personal_info JSONB NOT NULL DEFAULT '{}', -- gender, bio, age, etc.
  settings JSONB NOT NULL DEFAULT '{}', -- language, preferences, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
);

