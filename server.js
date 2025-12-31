const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ПОДКЛЮЧЕНИЕ К МОНГО (Убедись, что переменная окружения MONGODB_URI настроена в Render)
const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("Could not connect to MongoDB", err));

// Схема данных
const scoreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  score: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const Score = mongoose.model('Score', scoreSchema);

// --- ИСПРАВЛЕННЫЙ МАРШРУТ ОТПРАВКИ ---
app.post('/api/leaderboard', async (req, res) => {
  try {
    const { name, score } = req.body;
    if (!name || typeof score !== 'number') return res.status(400).json({ error: 'Invalid data' });

    const playerName = name.trim().slice(0, 15);

    // Ищем, есть ли уже такой игрок в базе
    const existingEntry = await Score.findOne({ name: playerName });

    if (existingEntry) {
      // Если игрок найден, обновляем только если новый рекорд ВЫШЕ старого
      if (score > existingEntry.score) {
        existingEntry.score = score;
        existingEntry.date = Date.now();
        await existingEntry.save();
      }
    } else {
      // Если такого имени нет — создаем новую запись
      const newEntry = new Score({ name: playerName, score: Math.floor(score) });
      await newEntry.save();
    }

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Маршрут получения ТОП-10
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const scores = await Score.find().sort({ score: -1 }).limit(limit);
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
