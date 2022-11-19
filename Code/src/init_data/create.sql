CREATE TABLE ski_mountains (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  ski_pass TEXT NOT NULL,
  total_runs INTEGER NOT NULL DEFAULT 0,
  ease TEXT
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  home_address TEXT,
  account_created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wishlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  ski_mountain_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (ski_mountain_id) REFERENCES ski_mountains (id) ON DELETE CASCADE,
  UNIQUE(user_id, ski_mountain_id)
);