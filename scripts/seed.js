// Seed the database with sample cafe menus.
// Usage: npm run seed
import db from "../src/lib/db.js";
import { createMenu } from "../src/lib/repository.js";
import { SAMPLE_MENUS } from "../src/lib/sampleData.js";

function seed() {
  const existing = db.prepare("SELECT COUNT(*) AS count FROM menus").get().count;
  if (existing > 0) {
    console.log(`Clearing ${existing} existing menu(s)...`);
    // Delete menus first (they reference categories via FK), then categories.
    db.prepare("DELETE FROM menus").run();
    db.prepare("DELETE FROM categories").run();
    db.prepare(
      "DELETE FROM sqlite_sequence WHERE name IN ('menus', 'categories')"
    ).run();
  }

  const insertAll = db.transaction((menus) => {
    for (const menu of menus) createMenu(menu);
  });
  insertAll(SAMPLE_MENUS);

  console.log(`✅ Seeded ${SAMPLE_MENUS.length} menus.`);
}

seed();
