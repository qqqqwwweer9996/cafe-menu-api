// SQLite 데이터베이스 연결 모듈.
// - 앱 전체가 공유하는 단일 better-sqlite3 커넥션을 생성/반환한다.
// - 최초 연결 시 스키마(categories, menus)와 인덱스를 자동 생성한다.
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seedIfEmpty } from "./seedData.js";

// DB 파일 경로. 환경변수로 덮어쓸 수 있고, 기본값은 프로젝트 루트의 data/cafe.db.
const DB_PATH =
  process.env.DATABASE_PATH || path.join(process.cwd(), "data", "cafe.db");

// 테이블/인덱스 정의. categories를 menus가 외래 키로 참조하므로 먼저 생성한다.
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
  price        INTEGER NOT NULL CHECK (price >= 0),        -- 가격은 0 이상 정수(KRW)
  category_id  INTEGER NOT NULL REFERENCES categories(id), -- 카테고리 외래 키
  image_url    TEXT,
  is_available INTEGER NOT NULL DEFAULT 1 CHECK (is_available IN (0, 1)), -- 0/1 불리언
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 자주 필터/정렬되는 컬럼에 인덱스
CREATE INDEX IF NOT EXISTS idx_menus_category_id ON menus (category_id);
CREATE INDEX IF NOT EXISTS idx_menus_price       ON menus (price);
`;

// 새 커넥션을 만들고 스키마를 초기화한다.
function createConnection() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true }); // data 디렉터리 보장
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL"); // 동시 읽기 성능 향상
  db.pragma("foreign_keys = ON"); // 외래 키 제약 활성화(참조 무결성)
  db.exec(SCHEMA);

  // 휘발성 디스크 환경(예: Render 무료 티어)은 부팅 시 DB가 비어 있다.
  // SEED_ON_EMPTY=true면 샘플 데이터를 채워 배포 직후 바로 시연 가능하게 한다.
  if (process.env.SEED_ON_EMPTY === "true") {
    seedIfEmpty(db);
  }

  return db;
}

// 개발 모드에서 Next.js 핫 리로드 때마다 커넥션이 새로 열리는 것을 막기 위해
// globalThis에 캐싱하여 단일 커넥션을 재사용한다(싱글톤).
const globalForDb = globalThis;
const db = globalForDb.__cafeDb ?? createConnection();
if (process.env.NODE_ENV !== "production") {
  globalForDb.__cafeDb = db;
}

export default db;
