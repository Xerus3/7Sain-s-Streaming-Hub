import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();
app.use(cors());
app.use(express.json());

const TMDB_KEY = "PUT_YOUR_TMDB_KEY_HERE";
const BASE = "https://api.themoviedb.org/3";
const JWT_SECRET = "YOUR_SECRET_KEY";

// SQLite database setup
const dbPromise = open({ filename: './database.sqlite', driver: sqlite3.Database });
(async () => {
  const db = await dbPromise;
  await db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, email TEXT UNIQUE, password TEXT)');
  await db.run('CREATE TABLE IF NOT EXISTS watchlist (id INTEGER PRIMARY KEY, user_id INTEGER, tmdb_id INTEGER, type TEXT, last_watched INTEGER)');
})();

// ---------------- TMDb Endpoints ----------------
app.get("/api/trending", async (_, res) => {
  const r = await fetch(`${BASE}/trending/all/week?api_key=${TMDB_KEY}`);
  res.json(await r.json());
});

app.get("/api/search", async (req, res) => {
  const q = req.query.q || "";
  const r = await fetch(`${BASE}/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}`);
  res.json(await r.json());
});

app.get("/api/details/:type/:id", async (req, res) => {
  const { type, id } = req.params;
  const r = await fetch(`${BASE}/${type}/${id}?api_key=${TMDB_KEY}`);
  res.json(await r.json());
});

app.get("/api/videos/:type/:id", async (req, res) => {
  const { type, id } = req.params;
  const r = await fetch(`${BASE}/${type}/${id}/videos?api_key=${TMDB_KEY}`);
  res.json(await r.json());
});

// ---------------- Auth Endpoints ----------------
app.post("/api/auth/signup", async (req, res) => {
  const { username, email, password } = req.body;
  const db = await dbPromise;
  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await db.run("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hash]);
    const user = { id: result.lastID, username, email };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (e) {
    res.status(400).json({ error: "Username or email already exists" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const db = await dbPromise;
  const user = await db.get("SELECT * FROM users WHERE email=?", [email]);
  if (!user) return res.status(400).json({ error: "Invalid email or password" });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Invalid email or password" });
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, username: user.username } });
});

// ---------------- Watchlist Endpoints ----------------
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "Invalid token" }); }
};

app.get("/api/watchlist", authMiddleware, async (req, res) => {
  const db = await dbPromise;
  const list = await db.all("SELECT * FROM watchlist WHERE user_id=?", [req.user.id]);
  res.json(list);
});

app.post("/api/watchlist", authMiddleware, async (req, res) => {
  const { tmdb_id, type } = req.body;
  const db = await dbPromise;
  await db.run("INSERT INTO watchlist (user_id, tmdb_id, type, last_watched) VALUES (?, ?, ?, ?)", [req.user.id, tmdb_id, type, Date.now()]);
  res.json({ success: true });
});

// ---------------- Generic Video Provider ----------------
app.get("/api/play/:type/:id/:season?/:episode?", async (req, res) => {
  res.json({ mode: "none" });
});

app.listen(3000, () => console.log("Backend running on http://localhost:3000"));
