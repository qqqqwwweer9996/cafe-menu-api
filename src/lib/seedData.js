import { SAMPLE_MENUS } from "./sampleData.js";

/**
 * Insert the sample menus if the database has no menus yet. Operates on the
 * passed-in connection (rather than importing `db`) to avoid a circular import
 * with db.js. Used by the SEED_ON_EMPTY startup hook.
 */
export function seedIfEmpty(db) {
  const count = db.prepare("SELECT COUNT(*) AS count FROM menus").get().count;
  if (count > 0) return false;

  const insertCategory = db.prepare(
    "INSERT INTO categories (name) VALUES (?) ON CONFLICT(name) DO NOTHING"
  );
  const getCategory = db.prepare("SELECT id FROM categories WHERE name = ?");
  const insertMenu = db.prepare(
    `INSERT INTO menus (name, description, price, category_id, image_url, is_available)
     VALUES (@name, @description, @price, @categoryId, @imageUrl, @isAvailable)`
  );

  const insertAll = db.transaction((menus) => {
    for (const m of menus) {
      insertCategory.run(m.category);
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
