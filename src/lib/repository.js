// 데이터 접근 계층(Repository).
// 라우트 핸들러는 이 모듈의 함수만 호출하고, 실제 SQL은 여기에 모아둔다.
// 모든 쿼리는 prepared statement + named parameter 바인딩을 사용한다(SQL 인젝션 방지).
import db from "./db.js";
import { serializeMenu, serializeCategory } from "./serialize.js";
import { ConflictError } from "./errors.js";

// 정렬 허용 컬럼 화이트리스트. 정렬 컬럼은 바인딩이 아니라 문자열로 SQL에 끼워 넣으므로,
// 외부 입력을 그대로 쓰지 않고 이 매핑에 있는 값만 사용해 SQL 인젝션을 막는다.
const SORT_COLUMNS = {
  price: "m.price",
  name: "m.name",
  createdAt: "m.created_at",
};

// 메뉴 조회 시 공통으로 쓰는 SELECT. categories와 JOIN해 카테고리 이름(category)을 함께 가져온다.
const MENU_SELECT = `
  SELECT m.id, m.name, m.description, m.price,
         m.category_id, c.name AS category,
         m.image_url, m.is_available, m.created_at, m.updated_at
  FROM menus m
  JOIN categories c ON c.id = m.category_id
`;

/* ------------------------------------------------------------------ */
/* 카테고리(Categories)                                                */
/* ------------------------------------------------------------------ */

/** 카테고리 이름으로 id를 찾고, 없으면 새로 만들어 id를 반환한다(upsert). */
export function getOrCreateCategory(name) {
  // 이미 있으면 무시(ON CONFLICT), 없으면 삽입
  db.prepare(
    "INSERT INTO categories (name) VALUES (?) ON CONFLICT(name) DO NOTHING"
  ).run(name);
  return db.prepare("SELECT id FROM categories WHERE name = ?").get(name).id;
}

/** 전체 카테고리를 각 카테고리에 속한 메뉴 수(menuCount)와 함께 반환한다. */
export function listCategories() {
  // 메뉴가 0개인 카테고리도 보이도록 LEFT JOIN 사용
  const rows = db
    .prepare(
      `SELECT c.id, c.name, c.created_at, COUNT(m.id) AS menuCount
       FROM categories c
       LEFT JOIN menus m ON m.category_id = c.id
       GROUP BY c.id, c.name, c.created_at
       ORDER BY c.name ASC`
    )
    .all();
  return rows.map(serializeCategory);
}

/** 카테고리를 생성한다. 같은 이름이 이미 있으면 ConflictError(409)를 던진다. */
export function createCategory(name) {
  const existing = db
    .prepare("SELECT id FROM categories WHERE name = ?")
    .get(name);
  if (existing) {
    throw new ConflictError(`Category "${name}" already exists`);
  }
  const info = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
  const row = db
    .prepare("SELECT id, name, created_at FROM categories WHERE id = ?")
    .get(info.lastInsertRowid);
  return serializeCategory({ ...row, menuCount: 0 });
}

/**
 * 카테고리를 삭제한다.
 * - 존재하지 않으면 false 반환(라우트에서 404 처리).
 * - 참조 중인 메뉴가 있으면 ConflictError(409)를 던진다(외래 키 보호).
 */
export function deleteCategory(id) {
  const existing = db.prepare("SELECT id FROM categories WHERE id = ?").get(id);
  if (!existing) return false;

  // 이 카테고리를 쓰는 메뉴가 남아 있으면 삭제 불가
  const inUse = db
    .prepare("SELECT COUNT(*) AS count FROM menus WHERE category_id = ?")
    .get(id).count;
  if (inUse > 0) {
    throw new ConflictError(
      `Category ${id} is referenced by ${inUse} menu(s) and cannot be deleted`
    );
  }

  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  return true;
}

/* ------------------------------------------------------------------ */
/* 메뉴(Menus)                                                         */
/* ------------------------------------------------------------------ */

/**
 * 메뉴 목록 조회. 필터(카테고리/검색/가격범위/판매여부) + 정렬 + 페이지네이션 지원.
 * @returns {{ items: object[], pagination: { page, limit, total, totalPages } }}
 */
export function listMenus(params) {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    available,
    sort,
    order,
    page,
    limit,
  } = params;

  // 전달된 파라미터에 따라 WHERE 조건과 바인딩 인자를 동적으로 구성한다.
  const conditions = [];
  const args = {};

  if (category !== undefined) {
    conditions.push("c.name = @category"); // 카테고리 이름으로 필터(JOIN된 c.name)
    args.category = category;
  }
  if (search !== undefined) {
    conditions.push("m.name LIKE @search"); // 메뉴명 부분 검색
    args.search = `%${search}%`;
  }
  if (minPrice !== undefined) {
    conditions.push("m.price >= @minPrice");
    args.minPrice = minPrice;
  }
  if (maxPrice !== undefined) {
    conditions.push("m.price <= @maxPrice");
    args.maxPrice = maxPrice;
  }
  if (available !== undefined) {
    conditions.push("m.is_available = @available");
    args.available = available ? 1 : 0;
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortColumn = SORT_COLUMNS[sort] ?? "m.created_at"; // 화이트리스트 통과 값만 사용
  const orderSql = order === "asc" ? "ASC" : "DESC";

  // 페이지네이션 메타용 전체 개수(필터 적용 상태)
  const total = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM menus m JOIN categories c ON c.id = m.category_id
       ${whereSql}`
    )
    .get(args).count;

  // 실제 페이지 데이터 조회. 동일 정렬값일 때 순서가 흔들리지 않도록 id를 보조 정렬키로 사용.
  const offset = (page - 1) * limit;
  const rows = db
    .prepare(
      `${MENU_SELECT} ${whereSql}
       ORDER BY ${sortColumn} ${orderSql}, m.id ${orderSql}
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...args, limit, offset });

  return {
    items: rows.map(serializeMenu),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

/** id로 메뉴 단건 조회. 없으면 null. */
export function getMenuById(id) {
  return serializeMenu(
    db.prepare(`${MENU_SELECT} WHERE m.id = ?`).get(id)
  );
}

/** 메뉴 생성. category(이름)는 자동으로 category_id로 변환해 저장한다. */
export function createMenu(data) {
  const categoryId = getOrCreateCategory(data.category);
  const info = db
    .prepare(
      `INSERT INTO menus (name, description, price, category_id, image_url, is_available)
       VALUES (@name, @description, @price, @categoryId, @imageUrl, @isAvailable)`
    )
    .run({
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      categoryId,
      imageUrl: data.imageUrl ?? null,
      isAvailable: data.isAvailable === false ? 0 : 1, // 기본값 true(1)
    });

  return getMenuById(info.lastInsertRowid);
}

// 값을 그대로 바인딩하는 수정 가능 필드(컬럼 매핑). `category`는 category_id로 변환이
// 필요하므로 아래 updateMenu에서 따로 처리한다.
const SIMPLE_UPDATE_FIELDS = {
  name: "name",
  description: "description",
  price: "price",
  imageUrl: "image_url",
  isAvailable: "is_available",
};

/**
 * 메뉴 수정. 전달된 필드만 갱신한다.
 * @returns 수정된 메뉴, id가 없으면 null.
 */
export function updateMenu(id, data) {
  const existing = db.prepare("SELECT id FROM menus WHERE id = ?").get(id);
  if (!existing) return null;

  // 전달된 필드만 골라 SET 절을 동적으로 만든다.
  const assignments = [];
  const args = { id };

  for (const [key, column] of Object.entries(SIMPLE_UPDATE_FIELDS)) {
    if (data[key] === undefined) continue;
    assignments.push(`${column} = @${key}`);
    args[key] =
      key === "isAvailable" ? (data[key] ? 1 : 0) : data[key] ?? null;
  }

  // 카테고리는 이름 → id 변환 후 반영
  if (data.category !== undefined) {
    assignments.push("category_id = @categoryId");
    args.categoryId = getOrCreateCategory(data.category);
  }

  if (assignments.length > 0) {
    assignments.push("updated_at = datetime('now')"); // 수정 시각 갱신
    db.prepare(`UPDATE menus SET ${assignments.join(", ")} WHERE id = @id`).run(
      args
    );
  }

  return getMenuById(id);
}

/** 메뉴 삭제. 실제로 삭제됐으면 true. */
export function deleteMenu(id) {
  return db.prepare("DELETE FROM menus WHERE id = ?").run(id).changes > 0;
}

/** 통계: 전체 메뉴 수·평균가 + 카테고리별 개수/가격 요약. */
export function getStats() {
  // 전체 합계
  const totals = db
    .prepare(
      "SELECT COUNT(*) AS count, COALESCE(ROUND(AVG(price)), 0) AS avgPrice FROM menus"
    )
    .get();

  // 카테고리별 집계(메뉴가 있는 카테고리만: HAVING COUNT > 0)
  const byCategory = db
    .prepare(
      `SELECT c.name             AS category,
              COUNT(m.id)        AS count,
              ROUND(AVG(m.price)) AS averagePrice,
              MIN(m.price)       AS minPrice,
              MAX(m.price)       AS maxPrice,
              COALESCE(SUM(m.is_available), 0) AS availableCount
       FROM categories c
       LEFT JOIN menus m ON m.category_id = c.id
       GROUP BY c.id, c.name
       HAVING COUNT(m.id) > 0
       ORDER BY c.name ASC`
    )
    .all();

  return {
    totalMenus: totals.count,
    averagePrice: totals.avgPrice,
    categoryCount: byCategory.length,
    byCategory,
  };
}
