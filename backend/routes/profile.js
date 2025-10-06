const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();

// ✅ Connect to DB
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("Error connecting to database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// ✅ Update Profile API
router.post("/update", (req, res) => {
  const { name, email, degree, major, cgpa, experience, skills, certifications } = req.body;

  const sql = `
    UPDATE users 
    SET name=?, email=?, degree=?, major=?, cgpa=?, experience=?, skills=?, certifications=?
    WHERE id=1
  `; // ⚠️ For now, updating the first user (id=1). Later, use logged-in user ID.

  db.run(sql, [name, email, degree, major, cgpa, experience, skills, certifications], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true, message: "Profile updated successfully!" });
  });
});

module.exports = router;
