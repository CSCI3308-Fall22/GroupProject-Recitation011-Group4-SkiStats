CREATE TABLE "ski_mountains" (
  "State" VARCHAR,
  "Name" VARCHAR PRIMARY KEY,
  "Pass" VARCHAR,
  "Total_runs" INTEGER,
  "Ease" VARCHAR
);

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "is_admin" BOOLEAN NOT NULL,
  "username" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "home_address" TEXT,
  "account_created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "trails" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "difficulty" DOUBLE PRECISION NOT NULL,
  "ski_mountain" INTEGER NOT NULL
);

CREATE INDEX "idx_trails__ski_mountain" ON "trails" ("ski_mountain");

ALTER TABLE "trails" ADD CONSTRAINT "fk_trails__ski_mountain" FOREIGN KEY ("ski_mountain") REFERENCES "ski_mountains" ("id") ON DELETE CASCADE;
