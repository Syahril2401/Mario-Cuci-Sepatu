const bcrypt = require('bcrypt');
const db = require('./src/config/db');

async function run() {
  // Create/update regular test user
  const hash = await bcrypt.hash('test1234', 10);
  const [existing] = await db.execute('SELECT * FROM users WHERE email = ?', ['testuser@test.com']);
  if (existing.length > 0) {
    await db.execute('UPDATE users SET password = ? WHERE email = ?', [hash, 'testuser@test.com']);
    console.log('Updated test user password');
  } else {
    await db.execute('INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)', ['Test User', 'testuser@test.com', hash, 2]);
    console.log('Created test user');
  }

  // Create/update admin test user
  const [existingAdmin] = await db.execute('SELECT * FROM users WHERE email = ?', ['admin@gmail.com']);
  if (existingAdmin.length > 0) {
    await db.execute('UPDATE users SET password = ? WHERE email = ?', [hash, 'admin@gmail.com']);
    console.log('Updated admin password');
  }

  console.log('Done! Credentials: testuser@test.com / test1234 and admin@gmail.com / test1234');
  process.exit(0);
}
run();
