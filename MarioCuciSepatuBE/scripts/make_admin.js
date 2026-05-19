const db = require('./src/config/db');

async function makeAdmin() {
  try {
    const email = 'test@gmail.com';
    const [result] = await db.execute('UPDATE users SET role_id = 1 WHERE email = ?', [email]);
    if (result.affectedRows > 0) {
      console.log(`Successfully made ${email} an admin!`);
    } else {
      console.log(`User ${email} not found.`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
makeAdmin();
