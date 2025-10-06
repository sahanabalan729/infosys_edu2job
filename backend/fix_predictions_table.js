const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./users.db");

// Check schema
db.all("PRAGMA table_info(predictions);", (err, rows) => {
  if (err) {
    console.error("❌ Error checking predictions table:", err.message);
    process.exit(1);
  }

  const columnNames = rows.map(r => r.name);
  console.log("📋 Current columns in predictions:", columnNames);

  // If table missing or missing 'cgpa' column → recreate
  if (!columnNames.includes("cgpa")) {
    console.log("⚠️  'cgpa' column missing — recreating predictions table...");

    db.serialize(() => {
      db.run("DROP TABLE IF EXISTS predictions");
      db.run(`CREATE TABLE predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        cgpa TEXT,
        degree TEXT,
        major TEXT,
        skills TEXT,
        role TEXT,
        date TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`, (err) => {
        if (err) {
          console.error("❌ Failed to recreate table:", err.message);
        } else {
          console.log("✅ Predictions table recreated successfully with cgpa column.");
        }
        process.exit(0);
      });
    });
  } else {
    console.log("✅ Predictions table already has 'cgpa' column. No action needed.");
    process.exit(0);
  }
});
