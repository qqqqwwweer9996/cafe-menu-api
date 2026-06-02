// DB의 raw row(스네이크 케이스 컬럼)를 외부 API 응답 형태로 변환하는 직렬화 함수들.
// snake_case → camelCase, 0/1 → boolean 등 표현 차이를 여기서 흡수한다.

/**
 * 메뉴 row(menus⨝categories JOIN 결과)를 API 응답 형태로 변환한다.
 * - is_available(0/1) → isAvailable(boolean)
 * - 카테고리는 id(categoryId)와 이름(category)을 모두 노출한다.
 */
export function serializeMenu(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    price: row.price,
    categoryId: row.category_id,
    category: row.category, // JOIN에서 별칭(c.name AS category)으로 가져온 카테고리 이름
    imageUrl: row.image_url ?? null,
    isAvailable: Boolean(row.is_available),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 카테고리 row를 API 응답 형태로 변환한다. */
export function serializeCategory(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    menuCount: row.menuCount ?? 0, // 해당 카테고리에 속한 메뉴 수
    createdAt: row.created_at,
  };
}
