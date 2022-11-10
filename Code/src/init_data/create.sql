CREATE TABLE "ski_mountains" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "website" TEXT UNIQUE NOT NULL,
  "address" TEXT UNIQUE NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "resort" TEXT NOT NULL
);

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "is_admin" BOOLEAN NOT NULL DEFAULT FALSE,
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
