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

CREATE TABLE "cart" (
  "id" SERIAL PRIMARY KEY,
  "user" INTEGER NOT NULL
);

CREATE INDEX "idx_cart__user" ON "cart" ("user");

ALTER TABLE "cart" ADD CONSTRAINT "fk_cart__user" FOREIGN KEY ("user") REFERENCES "users" ("id");

CREATE TABLE "cartitem" (
  "id" SERIAL PRIMARY KEY,
  "cart" INTEGER NOT NULL,
  "ski_mountain" INTEGER,
  "hotel" TEXT
);

CREATE INDEX "idx_cartitem__cart" ON "cartitem" ("cart");

CREATE INDEX "idx_cartitem__ski_mountain" ON "cartitem" ("ski_mountain");

ALTER TABLE "cartitem" ADD CONSTRAINT "fk_cartitem__cart" FOREIGN KEY ("cart") REFERENCES "cart" ("id") ON DELETE CASCADE;

ALTER TABLE "cartitem" ADD CONSTRAINT "fk_cartitem__ski_mountain" FOREIGN KEY ("ski_mountain") REFERENCES "ski_mountains" ("id") ON DELETE SET NULL