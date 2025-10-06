require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios"); // Flask API call

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || "dev_secret_key";

// ---------------------------
// Connect to SQLite DB
// ---------------------------
const db = new sqlite3.Database("./users.db", (err) => {
  if (err) console.error("❌ DB connection error:", err.message);
  else console.log("✅ Connected to SQLite DB");
});

// ---------------------------
// Middleware
// ---------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------
// Create tables if not exist
// ---------------------------
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE,
  name TEXT,
  email TEXT,
  phone TEXT,
  linkedin TEXT,
  github TEXT,
  degree TEXT,
  major TEXT,
  cgpa TEXT,
  experience TEXT,
  skills TEXT,
  certifications TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`);

db.run(`CREATE TABLE IF NOT EXISTS predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  cgpa TEXT,
  degree TEXT,
  major TEXT,
  skills TEXT,
  role TEXT,
  top_jobs TEXT,
  date TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`);

// ---------------------------
// Auth middleware
// ---------------------------
function auth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not logged in" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

// ---------------------------
// Register
// ---------------------------
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Missing fields" });

  try {
    const hash = await bcrypt.hash(password, 10);
    db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hash],
      function (err) {
        if (err) return res.status(400).json({ message: "User already exists" });
        res.json({ message: "Registered successfully" });
      }
    );
  } catch (err) {
    console.error("❌ Register error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------------------
// Login
// ---------------------------
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Missing fields" });

  db.get("SELECT * FROM users WHERE username=?", [username], async (err, user) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: "2h" });
    res.json({ message: "Login successful", token });
  });
});

// ---------------------------
// Reset Password
// ---------------------------
app.post("/reset-password", async (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword)
    return res.status(400).json({ message: "Missing fields" });

  try {
    const hash = await bcrypt.hash(newPassword, 10);
    db.run("UPDATE users SET password=? WHERE username=?", [hash, username], function (err) {
      if (err) return res.status(500).json({ message: err.message });
      if (this.changes === 0) return res.status(404).json({ message: "User not found" });
      res.json({ message: "Password reset successfully" });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------------------
// Save profile (insert or update)
// ---------------------------
app.post("/profile", auth, (req, res) => {
  const {
    name,
    email,
    phone,
    linkedin,
    github,
    degree,
    major,
    cgpa,
    experience,
    skills,
    certifications,
  } = req.body;
  const userId = req.user.id;

  const query = `
    INSERT INTO profiles 
      (user_id, name, email, phone, linkedin, github, degree, major, cgpa, experience, skills, certifications)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      name=excluded.name,
      email=excluded.email,
      phone=excluded.phone,
      linkedin=excluded.linkedin,
      github=excluded.github,
      degree=excluded.degree,
      major=excluded.major,
      cgpa=excluded.cgpa,
      experience=excluded.experience,
      skills=excluded.skills,
      certifications=excluded.certifications
  `;

  db.run(query, [userId, name, email, phone, linkedin, github, degree, major, cgpa, experience, skills, certifications], (err) => {
    if (err) {
      console.error("❌ Profile save error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Profile saved successfully" });
  });
});

// ---------------------------
// Get profile
// ---------------------------
app.get("/profile", auth, (req, res) => {
  db.get(
    `SELECT name, email, phone, linkedin, github, degree, major, cgpa, experience, skills, certifications
     FROM profiles WHERE user_id=?`,
    [req.user.id],
    (err, row) => {
      if (err) {
        console.error("❌ Fetch profile error:", err.message);
        return res.status(500).json({ error: err.message });
      }
      const profile = {
        name: "",
        email: "",
        phone: "",
        linkedin: "",
        github: "",
        degree: "",
        major: "",
        cgpa: "",
        experience: "",
        skills: "",
        certifications: "",
        ...row,
      };
      res.json(profile);
    }
  );
});

// ---------------------------
// Fixed Prediction endpoint (no duplicate inserts)
// ---------------------------
app.post("/predict", auth, async (req, res) => {
  try {
    const flaskRes = await axios.post("http://127.0.0.1:5000/predict", req.body);
    const { top_jobs } = flaskRes.data || {};
    const date = new Date().toISOString();

    const topRole =
      top_jobs && top_jobs.length > 0 && top_jobs[0].job
        ? top_jobs[0].job
        : "N/A";

    const skills = Array.isArray(req.body.skills)
      ? req.body.skills.join(",")
      : req.body.skills || "";

    const topJobsStr = JSON.stringify(top_jobs || []);

    // ✅ Delete previous prediction for this user at the same timestamp
    db.run(
      "DELETE FROM predictions WHERE user_id=? AND date=?",
      [req.user.id, date],
      (err) => {
        if (err) console.error("❌ Could not delete duplicate prediction:", err.message);

        // Insert new prediction
        db.run(
          `INSERT INTO predictions 
           (user_id, cgpa, degree, major, skills, role, top_jobs, date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [req.user.id, req.body.cgpa, req.body.degree, req.body.major, skills, topRole, topJobsStr, date],
          function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
              id: this.lastID,
              ...req.body,
              skills,
              top_jobs,
              role: topRole,
              date,
            });
          }
        );
      }
    );
  } catch (err) {
    console.error("❌ Prediction error from Flask:", err.response?.data || err.message);
    res.status(500).json({ error: "Prediction failed" });
  }
});

// ---------------------------
// Fetch all predictions for user (exactly as stored)
// ---------------------------
app.get("/predictions", auth, (req, res) => {
  db.all(
    "SELECT * FROM predictions WHERE user_id=? ORDER BY date DESC",
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const history = rows.map((r) => ({
        ...r,
        top_jobs: r.top_jobs ? JSON.parse(r.top_jobs) : [],
      }));

      res.json(history);
    }
  );
});

// ---------------------------
// Delete a prediction
// ---------------------------
app.delete("/predictions/:id", auth, (req, res) => {
  db.run(
    "DELETE FROM predictions WHERE id=? AND user_id=?",
    [req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Prediction deleted" });
    }
  );
});

// ---------------------------
// Start server
// ---------------------------
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
