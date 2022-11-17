CREATE TABLE ski_mountain (
  id SERIAL PRIMARY KEY,
  State VARCHAR,
  Name VARCHAR,
  Pass VARCHAR,
  Total_runs INTEGER,
  Ease VARCHAR
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
  userID INTEGER NOT NULL,
  ski_mountainID INTEGER NOT NULL,
  FOREIGN KEY (userID) REFERENCES users (id),
  FOREIGN KEY (ski_mountainID) REFERENCES ski_mountain (id)
);
