import type { DatabaseSync } from 'node:sqlite';
import type { Product } from './data';

export function seedDatabaseOnce(
  db: DatabaseSync,
  products: Product[],
  fees: Record<string, number>
) {
  db.exec('BEGIN IMMEDIATE');

  try {
    const seeded = db
      .prepare("SELECT value FROM app_meta WHERE key='seed_version'")
      .get();

    if (seeded) {
      db.exec('COMMIT');
      return false;
    }

    const insertProduct = db.prepare(
      'INSERT OR IGNORE INTO products VALUES(?,?,?,?,?,?,?,?,?,?)'
    );

    for (const p of products) {
      insertProduct.run(
        p.id,
        p.name,
        p.brand,
        p.category,
        p.price,
        p.description,
        JSON.stringify(p.shades),
        JSON.stringify(p.sizes),
        p.stock,
        p.color
      );
    }

    const insertFee = db.prepare(
      'INSERT OR IGNORE INTO delivery_fees VALUES(?,?)'
    );

    for (const [province, fee] of Object.entries(fees)) {
      insertFee.run(province, fee);
    }

    db.prepare(
      "INSERT INTO app_meta VALUES('seed_version','1')"
    ).run();

    db.exec('COMMIT');
    return true;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}