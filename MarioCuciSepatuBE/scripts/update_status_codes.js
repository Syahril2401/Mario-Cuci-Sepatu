const db = require('../src/config/db');

async function migrate() {
  try {
    console.log('🚀 Memulai pembaruan status_code di database...');

    const updates = [
      ["WAITING_VERIFICATION", "MENUNGGU_VERIFIKASI"],
      ["WAITING_DROP_OFF", "MENUNGGU_PENGANTARAN"],
      ["STORE_RECEIVED", "BARANG_DITERIMA"],
      ["PICKED_UP_BY_ADMIN", "BARANG_DIAMBIL"],
      ["CUSTOMER_PICKED_UP", "SUDAH_DIAMBIL"],
      ["AWAITING_DROP_OFF", "ANTRI"]
    ];

    for (const [newCode, oldCode] of updates) {
      const [res] = await db.execute(
        'UPDATE order_statuses SET status_code = ? WHERE status_code = ?',
        [newCode, oldCode]
      );
      console.log(`✅ Update ${oldCode} -> ${newCode}: ${res.affectedRows} row(s) updated.`);
    }

    console.log('🎉 Pembaruan status_code selesai!');
  } catch (err) {
    console.error('❌ Gagal memperbarui database:', err.message);
  } finally {
    process.exit(0);
  }
}

migrate();
