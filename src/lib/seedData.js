import { SAMPLE_MENUS } from "./sampleData.js";

/**
 * DB에 메뉴가 하나도 없을 때만 샘플 메뉴를 삽입한다.
 * db.js와의 순환 import를 피하기 위해 db를 import하지 않고 인자로 받는다.
 * SEED_ON_EMPTY 시작 훅(db.js)에서 호출된다.
 * @returns 시드를 수행했으면 true, 이미 데이터가 있어 건너뛰면 false.
 */
export function seedIfEmpty(db) {
  const count = db.prepare("SELECT COUNT(*) AS count FROM menus").get().count;
  if (count > 0) return false; // 이미 데이터 있음 → 아무것도 안 함

  // 반복 실행할 문장들을 미리 prepare
  const insertCategory = db.prepare(
    "INSERT INTO categories (name) VALUES (?) ON CONFLICT(name) DO NOTHING"
  );
  const getCategory = db.prepare("SELECT id FROM categories WHERE name = ?");
  const insertMenu = db.prepare(
    `INSERT INTO menus (name, description, price, category_id, image_url, is_available)
     VALUES (@name, @description, @price, @categoryId, @imageUrl, @isAvailable)`
  );

  // 트랜잭션으로 한 번에 삽입(중간 실패 시 전체 롤백)
  const insertAll = db.transaction((menus) => {
    for (const m of menus) {
      insertCategory.run(m.category); // 카테고리 없으면 생성
      const categoryId = getCategory.get(m.category).id;
      insertMenu.run({
        name: m.name,
        description: m.description ?? null,
        price: m.price,
        categoryId,
        imageUrl: m.imageUrl ?? null,
        isAvailable: m.isAvailable === false ? 0 : 1,
      });
    }
  });
  insertAll(SAMPLE_MENUS);

  console.log(`[cafe-menu-api] Auto-seeded ${SAMPLE_MENUS.length} menus (empty DB).`);
  return true;
}
