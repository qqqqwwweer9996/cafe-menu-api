import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seedIfEmpty } from "./seedData.js";

const DB_PATH =
  process.env.DATABASE_PATH || path.join(process.cwd(), "data", "cafe.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL UNIQUE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS menus (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  description  TEXT,
  price        INTEGER NOT NULL CHECK (price >= 0),
  category_id  INTEGER NOT NULL REFERENCES categories(id),
  image_url    TEXT,
  is_available INTEGER NOT NULL DEFAULT 1 CHECK (is_available IN (0, 1)),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_menus_category_id ON menus (category_id);
CREATE INDEX IF NOT EXISTS idx_menus_price       ON menus (price);
`;

function createConnection() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);

  // On ephemeral hosts (e.g. Render free tier) the DB starts empty on each boot.
  // Populate sample data so a fresh deployment is immediately demoable.
  if (process.env.SEED_ON_EMPTY === "true") {
    seedIfEmpty(db);
  }

  return db;
}

// Reuse a single connection across Next.js hot reloads in development to avoid
// opening a new file handle on every module evaluation.
const globalForDb = globalThis;
const db = globalForDb.__cafeDb ?? createConnection();
if (process.env.NODE_ENV !== "production") {
  globalForDb.__cafeDb = db;
}

export default db;
