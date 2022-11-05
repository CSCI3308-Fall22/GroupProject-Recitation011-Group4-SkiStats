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
  "admin" BOOLEAN NOT NULL,
  "username" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "home_address" TEXT,
  "account_created_at" TIMESTAMP NOT NULL
);

CREATE TABLE "skimountain_user" (
  "skimountain" INTEGER NOT NULL,
  "user" INTEGER NOT NULL,
  PRIMARY KEY ("skimountain", "user")
);

CREATE INDEX "idx_skimountain_user" ON "skimountain_user" ("user");

ALTER TABLE "skimountain_user" ADD CONSTRAINT "fk_skimountain_user__skimountain" FOREIGN KEY ("skimountain") REFERENCES "ski_mountains" ("id");

ALTER TABLE "skimountain_user" ADD CONSTRAINT "fk_skimountain_user__user" FOREIGN KEY ("user") REFERENCES "users" ("id")

CREATE TABLE "trails" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "difficulty" DOUBLE PRECISION NOT NULL,
  "ski_mountain" INTEGER NOT NULL
);

CREATE INDEX "idx_trails__ski_mountain" ON "trails" ("ski_mountain");

ALTER TABLE "trails" ADD CONSTRAINT "fk_trails__ski_mountain" FOREIGN KEY ("ski_mountain") REFERENCES "ski_mountains" ("id") ON DELETE CASCADE;
