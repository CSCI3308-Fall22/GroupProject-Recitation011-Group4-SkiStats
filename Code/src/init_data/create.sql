CREATE TABLE "SkiMountains" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "website" TEXT UNIQUE NOT NULL,
  "address" TEXT UNIQUE NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "resort" TEXT NOT NULL
);

CREATE TABLE "Users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "admin" BOOLEAN NOT NULL,
  "home_address" TEXT NOT NULL,
  "first_name" TEXT NOT NULL,
  "last_name" TEXT NOT NULL,
  "profile_picture" BOOLEAN,
  "account_created_at" TIMESTAMP NOT NULL
);

CREATE TABLE "skimountain_user" (
  "skimountain" INTEGER NOT NULL,
  "user" INTEGER NOT NULL,
  PRIMARY KEY ("skimountain", "user")
);

CREATE INDEX "idx_skimountain_user" ON "skimountain_user" ("user");

ALTER TABLE "skimountain_user" ADD CONSTRAINT "fk_skimountain_user__skimountain" FOREIGN KEY ("skimountain") REFERENCES "SkiMountains" ("id");

ALTER TABLE "skimountain_user" ADD CONSTRAINT "fk_skimountain_user__user" FOREIGN KEY ("user") REFERENCES "Users" ("id");

CREATE TABLE "trail" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "difficulty" DOUBLE PRECISION NOT NULL,
  "ski_mountain" INTEGER NOT NULL
);

CREATE INDEX "idx_trail__ski_mountain" ON "trail" ("ski_mountain");

ALTER TABLE "trail" ADD CONSTRAINT "fk_trail__ski_mountain" FOREIGN KEY ("ski_mountain") REFERENCES "SkiMountains" ("id") ON DELETE CASCADE
