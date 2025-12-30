const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.resolve(__dirname, 'leaderboard.json');

// ensure data file exists
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]), 'utf8');

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8') || '[]';
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// POST /api/leaderboard
// body: { name, score }
app.post('/api/leaderboard', (req, res) => {
  const { name, score } = req.body;
  if (!name || typeof score !== 'number') return res.status(400).json({ error: 'Invalid payload' });
  const entries = readData();
  const entry = { name: String(name).slice(0, 50), score: Math.max(0, Math.floor(score)), date: new Date().toISOString() };
  entries.push(entry);
  // keep only last 1000 entries to avoid file growth
  writeData(entries.slice(-1000));
  return res.status(201).json({ ok: true, entry });
});

// GET /api/leaderboard?limit=10
// returns an array sorted by score desc, truncated to limit
app.get('/api/leaderboard', (req, res) => {
  const limit = Math.min(100, parseInt(req.query.limit) || 10);
  const entries = readData();
  const sorted = entries.slice().sort((a,b) => b.score - a.score).slice(0, limit);
  res.json(sorted);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Leaderboard API listening on port ${PORT}`));