const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

if (!fs.existsSync('users.json')) {
  console.error('users.json not found!');
  process.exit(1);
}

const users = JSON.parse(fs.readFileSync('users.json'));

db.serialize(() => {
  const stmt = db.prepare(`INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`);
  for (const [username, info] of Object.entries(users)) {
    stmt.run(username, info.password);
  }
  stmt.finalize();
});

db.close();
console.log('Users migrated from users.json to SQLite.');
