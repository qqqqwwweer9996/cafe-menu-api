import db from "./db.js";
import { serializeMenu, serializeCategory } from "./serialize.js";
import { ConflictError } from "./errors.js";

// Whitelist of sortable fields -> actual (qualified) column names. Guards against
// SQL injection since the sort column is interpolated, not bound.
const SORT_COLUMNS = {
  price: "m.price",
  name: "m.name",
  createdAt: "m.created_at",
};

// Columns selected for every menu read, joining the category name in.
const MENU_SELECT = `
  SELECT m.id, m.name, m.description, m.price,
         m.category_id, c.name AS category,
         m.image_url, m.is_available, m.created_at, m.updated_at
  FROM menus m
  JOIN categories c ON c.id = m.category_id
`;

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

/** Resolve a category name to its id, creating the category if needed. */
export function getOrCreateCategory(name) {
  db.prepare(
    "INSERT INTO categories (name) VALUES (?) ON CONFLICT(name) DO NOTHING"
  ).run(name);
  return db.prepare("SELECT id FROM categories WHERE name = ?").get(name).id;
}

/** List all categories with the number of menus in each. */
export function listCategories() {
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

/** Create a category by name. Throws ConflictError if the name already exists. */
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
 * Delete a category. Returns false if it does not exist; throws ConflictError
 * if any menus still reference it (the FK would otherwise block the delete).
 */
export function deleteCategory(id) {
  const existing = db.prepare("SELECT id FROM categories WHERE id = ?").get(id);
  if (!existing) return false;

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
/* Menus                                                               */
/* ------------------------------------------------------------------ */

/**
 * List menus with optional filtering, searching, sorting and pagination.
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

  const conditions = [];
  const args = {};

  if (category !== undefined) {
    conditions.push("c.name = @category");
    args.category = category;
  }
  if (search !== undefined) {
    conditions.push("m.name LIKE @search");
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
  const sortColumn = SORT_COLUMNS[sort] ?? "m.created_at";
  const orderSql = order === "asc" ? "ASC" : "DESC";

  const total = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM menus m JOIN categories c ON c.id = m.category_id
       ${whereSql}`
    )
    .get(args).count;

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

export function getMenuById(id) {
  return serializeMenu(
    db.prepare(`${MENU_SELECT} WHERE m.id = ?`).get(id)
  );
}

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
      isAvailable: data.isAvailable === false ? 0 : 1,
    });

  return getMenuById(info.lastInsertRowid);
}

// Simple (directly-bound) updatable fields. `category` is handled separately
// because it must be resolved to a category_id.
const SIMPLE_UPDATE_FIELDS = {
  name: "name",
  description: "description",
  price: "price",
  imageUrl: "image_url",
  isAvailable: "is_available",
};

/**
 * Update an existing menu. Returns the updated record, or null if the id does
 * not exist.
 */
export function updateMenu(id, data) {
  const existing = db.prepare("SELECT id FROM menus WHERE id = ?").get(id);
  if (!existing) return null;

  const assignments = [];
  const args = { id };

  for (const [key, column] of Object.entries(SIMPLE_UPDATE_FIELDS)) {
    if (data[key] === undefined) continue;
    assignments.push(`${column} = @${key}`);
    args[key] =
      key === "isAvailable" ? (data[key] ? 1 : 0) : data[key] ?? null;
  }

  if (data.category !== undefined) {
    assignments.push("category_id = @categoryId");
    args.categoryId = getOrCreateCategory(data.category);
  }

  if (assignments.length > 0) {
    assignments.push("updated_at = datetime('now')");
    db.prepare(`UPDATE menus SET ${assignments.join(", ")} WHERE id = @id`).run(
      args
    );
  }

  return getMenuById(id);
}

export function deleteMenu(id) {
  return db.prepare("DELETE FROM menus WHERE id = ?").run(id).changes > 0;
}

/** Aggregate statistics: overall + per-category counts and price summaries. */
export function getStats() {
  const totals = db
    .prepare(
      "SELECT COUNT(*) AS count, COALESCE(ROUND(AVG(price)), 0) AS avgPrice FROM menus"
    )
    .get();

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
