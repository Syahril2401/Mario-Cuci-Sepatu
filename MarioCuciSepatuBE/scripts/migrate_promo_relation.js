/**
 * Migration Script: Menghubungkan tabel promos dengan tabel orders
 * 
 * Perubahan:
 * 1. Rename PK `id` di tabel promos menjadi `promo_id`
 * 2. Tambah kolom `promoName` di tabel promos
 * 3. Tambah kolom `promo_id` (FK, nullable) di tabel orders
 * 4. Hapus kolom `promoName` dari tabel orders
 * 5. Tambah FOREIGN KEY constraint orders.promo_id -> promos.promo_id
 */

const db = require('./src/config/db');

async function migrate() {
  const connection = await db.getConnection();
  try {
    console.log('🚀 Memulai migrasi promo relation...\n');

    // ===== STEP 1: Rename PK id -> promo_id di tabel promos =====
    console.log('STEP 1: Rename kolom id -> promo_id di tabel promos');
    await connection.execute(`
      ALTER TABLE promos CHANGE COLUMN id promo_id INT(11) NOT NULL AUTO_INCREMENT
    `);
    console.log('✅ Kolom id berhasil di-rename menjadi promo_id\n');

    // ===== STEP 2: Tambah kolom promoName di tabel promos =====
    console.log('STEP 2: Tambah kolom promoName di tabel promos');
    try {
      await connection.execute(`
        ALTER TABLE promos ADD COLUMN promoName VARCHAR(100) NULL AFTER promoCode
      `);
      console.log('✅ Kolom promoName berhasil ditambahkan ke tabel promos\n');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Kolom promoName sudah ada di tabel promos, skip.\n');
      } else {
        throw err;
      }
    }

    // ===== STEP 3: Tambah kolom promo_id (nullable) di tabel orders =====
    console.log('STEP 3: Tambah kolom promo_id di tabel orders');
    try {
      await connection.execute(`
        ALTER TABLE orders ADD COLUMN promo_id INT(11) NULL AFTER promoName
      `);
      console.log('✅ Kolom promo_id berhasil ditambahkan ke tabel orders\n');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Kolom promo_id sudah ada di tabel orders, skip.\n');
      } else {
        throw err;
      }
    }

    // ===== STEP 4: Migrasi data promoName dari orders ke promos (jika ada data) =====
    console.log('STEP 4: Migrasi data promoName yang ada ke relasi promo_id');
    const [ordersWithPromo] = await connection.execute(`
      SELECT DISTINCT promoName FROM orders WHERE promoName IS NOT NULL AND promoName != ''
    `);
    
    for (const row of ordersWithPromo) {
      // Cek apakah promo dengan kode ini sudah ada di tabel promos
      const [existing] = await connection.execute(
        'SELECT promo_id FROM promos WHERE promoCode = ? OR promoName = ?',
        [row.promoName, row.promoName]
      );
      
      if (existing.length > 0) {
        // Update orders yang pakai promoName ini untuk set promo_id
        await connection.execute(
          'UPDATE orders SET promo_id = ? WHERE promoName = ?',
          [existing[0].promo_id, row.promoName]
        );
        // Juga set promoName di tabel promos jika belum ada
        await connection.execute(
          'UPDATE promos SET promoName = ? WHERE promo_id = ? AND (promoName IS NULL OR promoName = "")',
          [row.promoName, existing[0].promo_id]
        );
        console.log(`  ✅ Linked orders with promoName="${row.promoName}" -> promo_id=${existing[0].promo_id}`);
      } else {
        console.log(`  ⚠️  Promo "${row.promoName}" tidak ditemukan di tabel promos, promo_id tetap NULL`);
      }
    }
    console.log('');

    // ===== STEP 5: Hapus kolom promoName dari tabel orders =====
    console.log('STEP 5: Hapus kolom promoName dari tabel orders');
    try {
      await connection.execute(`
        ALTER TABLE orders DROP COLUMN promoName
      `);
      console.log('✅ Kolom promoName berhasil dihapus dari tabel orders\n');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️  Kolom promoName sudah tidak ada di tabel orders, skip.\n');
      } else {
        throw err;
      }
    }

    // ===== STEP 6: Tambah FOREIGN KEY constraint =====
    console.log('STEP 6: Tambah FOREIGN KEY constraint orders.promo_id -> promos.promo_id');
    try {
      await connection.execute(`
        ALTER TABLE orders ADD CONSTRAINT fk_orders_promo 
        FOREIGN KEY (promo_id) REFERENCES promos(promo_id) 
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log('✅ FOREIGN KEY constraint berhasil ditambahkan\n');
    } catch (err) {
      if (err.code === 'ER_DUP_KEY' || err.message.includes('Duplicate')) {
        console.log('⚠️  FK constraint sudah ada, skip.\n');
      } else {
        throw err;
      }
    }

    // ===== VERIFIKASI =====
    console.log('📋 Verifikasi struktur tabel:\n');
    
    const [promosCols] = await connection.execute('DESCRIBE promos');
    console.log('Tabel promos:');
    promosCols.forEach(col => {
      console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
    });
    
    console.log('');
    
    const [ordersCols] = await connection.execute('DESCRIBE orders');
    console.log('Tabel orders:');
    ordersCols.forEach(col => {
      console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
    });

    console.log('\n🎉 Migrasi selesai! Tabel promos sekarang terhubung dengan tabel orders via FK.');

  } catch (error) {
    console.error('❌ Error saat migrasi:', error.message);
    throw error;
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrate();
