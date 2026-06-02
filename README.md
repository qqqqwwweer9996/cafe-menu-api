# ☕ Cafe Menu Management API

Node.js 기반 카페 메뉴 관리 **REST API**입니다. **Next.js(App Router) Route Handlers** + **SQLite(better-sqlite3)** 로 구현했으며, 메뉴 CRUD · 카테고리 필터링 · 가격 정렬 · 검색 · 페이지네이션과 **Swagger 인터랙티브 문서**, **zod 입력 검증**, **통일된 에러 응답**을 제공합니다.

> 🔗 **라이브 API**: <https://cafe-menu-api-lchp.onrender.com>
> 📘 **Swagger 문서**: <https://cafe-menu-api-lchp.onrender.com/api-docs>
>
> *Render 무료 티어 — 비활성 후 첫 요청은 콜드 스타트로 수십 초 지연될 수 있습니다.*

---

## ✅ 요구사항별 구현

| 요구사항 | 구현 |
|----------|------|
| **Node.js + Next.js API Routes** | Next.js 16 App Router의 **Route Handlers**(`src/app/api/**/route.js`)가 각 HTTP 메서드(`GET`/`POST`/`PUT`/`PATCH`/`DELETE`)를 export |
| **메뉴 CRUD (생성/조회/수정/삭제)** | 생성 `POST /api/menus` · 조회 `GET /api/menus`·`/:id` · 수정 `PUT\|PATCH /api/menus/:id` · 삭제 `DELETE /api/menus/:id` — 데이터 접근은 `src/lib/repository.js`의 prepared statement |
| **카테고리별 필터링** | `GET /api/menus?category=coffee` — `categories` 테이블과 JOIN하여 `WHERE c.name = @category` 동적 필터 |
| **가격 정렬 (오름/내림차순)** | `?sort=price&order=asc\|desc` — 정렬 컬럼을 화이트리스트로 매핑 후 `ORDER BY price ASC\|DESC` |
| **이미지 URL 저장** | `image_url`(TEXT) 컬럼에 저장, 입력 시 zod `.url()`로 URL 형식 검증 |
| **SQLite 사용** | `better-sqlite3`로 `data/cafe.db` 연결. `categories`·`menus` 정규화 스키마(FK)·인덱스 자동 생성(`src/lib/db.js`) |

---

## 🧱 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| 런타임 | Node.js 18+ |
| 프레임워크 | Next.js 16 (App Router · Route Handlers) · React 19 |
| 데이터베이스 | SQLite (`better-sqlite3`) |
| 검증 | `zod` |
| 문서 | OpenAPI 3.0 + Swagger UI |
| 언어 | JavaScript (ESM) |

---

## 🚀 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. (선택) 샘플 데이터 시드
npm run seed

# 3. 개발 서버 실행
npm run dev
# → http://localhost:3000
```

| 주소 | 설명 |
|------|------|
| `http://localhost:3000/` | 랜딩 페이지 (엔드포인트 목록) |
| `http://localhost:3000/api-docs` | **Swagger 인터랙티브 문서** |
| `http://localhost:3000/api/docs` | OpenAPI 3.0 JSON |

> 데이터베이스 파일은 `./data/cafe.db` 에 자동 생성됩니다. 경로는 `.env` 의 `DATABASE_PATH` 로 변경할 수 있습니다.

### 데이터베이스 스키마 (SQLite)

서버/시드 최초 실행 시 `src/lib/db.js`가 아래 SQL을 자동 실행하므로 **수동 SQL 작업은 필요 없습니다.** (참고용 전문)

```sql
-- 카테고리 (정규화 테이블)
CREATE TABLE IF NOT EXISTS categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL UNIQUE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 메뉴 (categories 를 외래 키로 참조)
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
```

DB 파일을 직접 조회하려면 (선택):

```bash
sqlite3 data/cafe.db \
  "SELECT m.id, m.name, m.price, c.name AS category
   FROM menus m JOIN categories c ON c.id = m.category_id
   ORDER BY m.price;"
```

### 프로덕션 빌드

```bash
npm run build && npm start
```

---

## 📦 데이터 모델

정규화된 2개 테이블로 구성됩니다 — `categories` *1 : N* `menus`.

**`categories`**

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | integer | 기본 키 |
| `name` | string | 카테고리명 (UNIQUE, 1–50자) |
| `created_at` | string | 생성 시각 |

**`menus`**

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `id` | integer | auto | 기본 키 (자동 증가) |
| `name` | string | ✅ | 메뉴명 (1–100자) |
| `description` | string \| null | | 설명 (최대 500자) |
| `price` | integer | ✅ | 가격 (KRW, 0 이상 정수) |
| `category_id` | integer | ✅ | `categories(id)` 외래 키 |
| `image_url` | string(URL) \| null | | 이미지 URL |
| `is_available` | boolean | | 판매 여부 (기본값 `true`) |
| `created_at` / `updated_at` | string | auto | 생성/수정 시각 |

> **API 입출력 규칙**: 생성/수정 요청은 `category`(이름 문자열)를 받아 **없으면 자동 생성**한 뒤 `category_id`로 연결합니다. 조회 응답에는 `categoryId`와 `category`(이름)를 함께 반환합니다.

---

## 📐 응답 규격

모든 응답은 일관된 envelope 형식을 따릅니다.

**성공**
```json
{ "success": true, "data": { ... }, "meta": { ... } }
```

**실패**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "path": "price", "message": "price must be 0 or greater" }]
  }
}
```

| code | HTTP | 의미 |
|------|:----:|------|
| `VALIDATION_ERROR` | 400 | 입력/쿼리 검증 실패 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `INTERNAL_ERROR` | 500 | 서버 오류 |

---

## 📚 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/menus` | 메뉴 목록 (필터·정렬·검색·페이지네이션) |
| `POST` | `/api/menus` | 메뉴 생성 |
| `GET` | `/api/menus/:id` | 메뉴 단건 조회 |
| `PUT` | `/api/menus/:id` | 메뉴 수정 |
| `PATCH` | `/api/menus/:id` | 메뉴 부분 수정 (PUT과 동일) |
| `DELETE` | `/api/menus/:id` | 메뉴 삭제 |
| `GET` | `/api/menus/stats` | 메뉴 통계 |
| `GET` | `/api/categories` | 카테고리 목록 (메뉴 수 포함) |
| `POST` | `/api/categories` | 카테고리 생성 |
| `DELETE` | `/api/categories/:id` | 카테고리 삭제 (참조 메뉴 있으면 409) |
| `GET` | `/api/health` | 서버 상태 확인 |

---

### 1. `GET /api/menus` — 목록 조회

**Query Parameters**

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `category` | string | – | 카테고리 정확 일치 필터 |
| `search` | string | – | 메뉴명 부분 검색 (대소문자 무시) |
| `sort` | `price` \| `name` \| `createdAt` | `createdAt` | 정렬 기준 |
| `order` | `asc` \| `desc` | `desc` | 정렬 방향 (가격 오름/내림차순) |
| `minPrice` | integer | – | 최소 가격 |
| `maxPrice` | integer | – | 최대 가격 |
| `available` | `true` \| `false` | – | 판매 여부 필터 |
| `page` | integer | `1` | 페이지 번호 |
| `limit` | integer | `20` | 페이지 크기 (최대 100) |

**예시**
```bash
# 카테고리 필터 + 가격 오름차순
curl "http://localhost:3000/api/menus?category=coffee&sort=price&order=asc"

# 검색 + 가격 범위 + 페이지네이션
curl "http://localhost:3000/api/menus?search=라떼&minPrice=4000&maxPrice=6000&page=1&limit=10"
```

**응답 `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "아메리카노",
      "description": "에스프레소에 물을 더한 기본 커피",
      "price": 4500,
      "categoryId": 1,
      "category": "coffee",
      "imageUrl": "https://picsum.photos/seed/americano/400/300",
      "isAvailable": true,
      "createdAt": "2026-06-02 09:30:00",
      "updatedAt": "2026-06-02 09:30:00"
    }
  ],
  "meta": {
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 },
    "sort": { "field": "price", "order": "asc" },
    "filters": { "category": "coffee", "search": null, "minPrice": null, "maxPrice": null, "available": null }
  }
}
```

---

### 2. `POST /api/menus` — 생성

**Request Body**
```json
{
  "name": "콜드브루",
  "description": "12시간 저온 추출 커피",
  "price": 5500,
  "category": "coffee",
  "imageUrl": "https://picsum.photos/seed/coldbrew/400/300",
  "isAvailable": true
}
```
- 필수: `name`, `price`, `category` (이름 문자열 — 존재하지 않으면 카테고리 자동 생성)
- 응답: `201 Created` + 생성된 메뉴 (`categoryId` 포함)

```bash
curl -X POST http://localhost:3000/api/menus \
  -H "Content-Type: application/json" \
  -d '{"name":"콜드브루","price":5500,"category":"coffee"}'
```

---

### 3. `GET /api/menus/:id` — 단건 조회

```bash
curl http://localhost:3000/api/menus/1
```
- 없으면 `404 NOT_FOUND`

---

### 4. `PUT` / `PATCH` `/api/menus/:id` — 수정

전달한 필드만 수정합니다. 최소 한 개 필드 필요.

```bash
curl -X PUT http://localhost:3000/api/menus/1 \
  -H "Content-Type: application/json" \
  -d '{"price":5200,"isAvailable":false}'
```

---

### 5. `DELETE /api/menus/:id` — 삭제

```bash
curl -X DELETE http://localhost:3000/api/menus/1
```
```json
{ "success": true, "data": { "id": 1, "deleted": true } }
```

---

### 6. `GET /api/menus/stats` — 통계

```json
{
  "success": true,
  "data": {
    "totalMenus": 10,
    "averagePrice": 5470,
    "categoryCount": 4,
    "byCategory": [
      { "category": "ade", "count": 2, "averagePrice": 5900, "minPrice": 5800, "maxPrice": 6000, "availableCount": 2 }
    ]
  }
}
```

---

### 7. `GET /api/categories` — 카테고리 목록

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "coffee", "menuCount": 4, "createdAt": "2026-06-02 09:30:00" }
  ]
}
```

---

### 8. `POST /api/categories` — 카테고리 생성

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"smoothie"}'
```
- 중복 이름 → `409 CONFLICT`

---

### 9. `DELETE /api/categories/:id` — 카테고리 삭제

```bash
curl -X DELETE http://localhost:3000/api/categories/5
```
- 참조하는 메뉴가 있으면 `409 CONFLICT`, 없으면 삭제 후 `{ "id": 5, "deleted": true }`

---

## 🧪 제출물 / 테스트

- **Postman Collection**: [`docs/cafe-menu.postman_collection.json`](docs/cafe-menu.postman_collection.json)
  - Postman → Import → 파일 선택 → 컬렉션 변수 `baseUrl` 확인 후 실행
- **Swagger UI**: 서버 실행 후 `http://localhost:3000/api-docs` 에서 직접 요청 테스트 가능
- **배포(Render)**: <https://cafe-menu-api-lchp.onrender.com> — Swagger: <https://cafe-menu-api-lchp.onrender.com/api-docs> (설정은 아래 [☁️ 배포](#️-배포-render) 섹션 참고)

---

## ☁️ 배포 (Render)

이 저장소는 **Render Blueprint**(`render.yaml`)를 포함합니다.

1. GitHub에 저장소 push
2. [Render](https://render.com) → **New +** → **Blueprint** → 이 저장소 연결 (`render.yaml` 자동 인식)
3. 생성된 Web Service가 `npm install && npm run build` → `npm start` 순으로 실행됨
4. 발급된 URL의 `/api-docs`, `/api/menus` 로 접근

**환경 변수** (`render.yaml`에 기본 설정됨)

| 변수 | 값 | 설명 |
|------|----|------|
| `NODE_VERSION` | `22` | better-sqlite3 prebuilt + Next 16 호환 |
| `SEED_ON_EMPTY` | `true` | 빈 DB로 부팅 시 샘플 메뉴 자동 시드 |
| `DATABASE_PATH` | (선택) | SQLite 파일 경로. 영속 디스크 사용 시 마운트 경로로 지정 |

> ⚠️ **무료 티어 주의**: 디스크가 휘발성이라 재배포·재시작 시 데이터가 초기화되며(이때 `SEED_ON_EMPTY`로 자동 복구), 비활성 시 콜드 스타트(첫 요청 지연)가 발생합니다. 데이터 영속이 필요하면 유료 플랜의 **Persistent Disk**를 마운트하고 `DATABASE_PATH`를 그 경로로 지정하세요.

---

## 🗂 프로젝트 구조

```
cafe-menu-api/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── menus/
│   │   │   │   ├── route.js          # GET(list) · POST(create)
│   │   │   │   ├── [id]/route.js     # GET · PUT · PATCH · DELETE
│   │   │   │   └── stats/route.js    # GET 통계
│   │   │   ├── categories/
│   │   │   │   ├── route.js          # GET(list) · POST(create)
│   │   │   │   └── [id]/route.js     # DELETE
│   │   │   ├── health/route.js       # 서버 상태 확인
│   │   │   └── docs/route.js         # OpenAPI JSON
│   │   ├── api-docs/route.js         # Swagger UI (HTML)
│   │   ├── layout.jsx
│   │   └── page.jsx                  # 랜딩 페이지
│   └── lib/
│       ├── db.js                     # SQLite 연결 + 스키마(categories·menus)
│       ├── repository.js             # 데이터 접근 계층
│       ├── validation.js             # zod 스키마
│       ├── serialize.js              # row → API 형식 변환
│       ├── errors.js                 # 에러 클래스
│       ├── apiResponse.js            # 응답/에러 핸들러
│       ├── sampleData.js             # 샘플 메뉴 데이터(공유)
│       ├── seedData.js               # 빈 DB 자동 시드 (SEED_ON_EMPTY)
│       └── openapi.js                # OpenAPI 3.0 스펙
├── scripts/seed.js                   # 샘플 데이터 시드 (npm run seed)
├── docs/cafe-menu.postman_collection.json
├── render.yaml                       # Render 배포 블루프린트
├── .env.example
├── next.config.mjs
└── package.json
```

---

## 🛠 구현 포인트

- **계층 분리 아키텍처**: 라우트(`app/api`) → 검증(`validation`) → 데이터 접근(`repository`) → 직렬화(`serialize`)로 책임을 분리.
- **SQL 인젝션 방지**: 모든 쿼리를 named parameter 바인딩으로 처리하고, 정렬 컬럼은 `SORT_COLUMNS` 화이트리스트로만 문자열 보간.
- **입력 검증(zod)**: 생성/수정 body·목록 쿼리·경로 `id`를 스키마로 검증. `price`는 0 이상 정수, `imageUrl`은 URL 형식만 허용 → 위반 시 **필드별 상세 메시지**와 `400` 반환.
- **통일된 응답 + 중앙 에러 처리**: 모든 라우트가 `catch (err) { return handleError(err) }` 한 줄로 ZodError·NotFound·서버오류를 일관 변환.
- **목록 기능 강화**: 필터(카테고리/검색/가격범위/판매여부) + 정렬(가격/이름/생성일) + 페이지네이션(메타 포함)을 단일 엔드포인트에서 조합.
- **DB 최적화·안정성**: `category`·`price` 인덱스, WAL 저널 모드, 핫 리로드 시 커넥션 중복 생성을 막는 싱글톤 패턴.
- **문서화**: OpenAPI 3.0 + Swagger UI(`/api-docs`)로 브라우저에서 직접 호출 테스트 가능.

---

## ✨ 추가 구현 (보너스)

- ✅ **Swagger 인터랙티브 문서** (`/api-docs`) + OpenAPI 3.0 스펙
- ✅ **zod 입력 검증** (body·query·path) + 필드별 상세 에러 메시지
- ✅ **통일된 응답 envelope** + 중앙 집중식 에러 핸들러
- ✅ **검색 / 가격 범위 / 판매여부 필터링**
- ✅ **페이지네이션** (메타데이터 포함)
- ✅ **카테고리 정규화** (`categories` 테이블 + FK) & **카테고리 리소스 API** (목록/생성/삭제, 참조 무결성 409)
- ✅ **통계 엔드포인트** (카테고리별 집계)
- ✅ **시드 스크립트** & **Postman Collection**

---

## 🔒 보안 점검 (npm audit)

`npm audit` 결과 **취약점 0건** (`found 0 vulnerabilities`) 입니다.

초기 구현(Next.js 14) 기준으로는 transitive 의존성에서 2건(High·Moderate)이 보고되어, 아래와 같이 **정식 패치**로 해소했습니다.

| 패키지 | 심각도 | 조치 |
|--------|:------:|------|
| `next` | High | **Next.js 16.2.7로 업그레이드**(다수 권고 해소). React 19 동반 업그레이드, 설정 키 `serverComponentsExternalPackages` → `serverExternalPackages` 변경 |
| `postcss` | Moderate | `package.json`의 `overrides`로 **`postcss@^8.5.10` 고정**(Next가 끌고 오던 구버전 대체, 현재 8.5.15) |

> 업그레이드 후 **개발 서버 런타임 + 프로덕션 빌드(`next build`) + 전체 엔드포인트**를 재검증하여 동작에 이상이 없음을 확인했습니다. `params`가 Promise로 바뀐 Next 15+ 변경은 라우트가 처음부터 `await context.params`로 작성되어 있어 코드 수정 없이 호환됩니다.
