/**
 * Convert a raw menu row (from a menus⨝categories JOIN) into the public API
 * shape: camelCase, is_available exposed as boolean, and the category exposed
 * as both its id (`categoryId`) and human-readable name (`category`).
 */
export function serializeMenu(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    price: row.price,
    categoryId: row.category_id,
    category: row.category, // category name (aliased in the JOIN query)
    imageUrl: row.image_url ?? null,
    isAvailable: Boolean(row.is_available),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Convert a raw category row into the public API shape. */
export function serializeCategory(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    menuCount: row.menuCount ?? 0,
    createdAt: row.created_at,
  };
}
