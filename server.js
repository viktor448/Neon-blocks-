const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Подключение к базе данных
// Render сам подставит строку из настроек, которые мы укажем позже
const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("Could not connect to MongoDB", err));

// 2. Описание структуры данных (Схема)
const scoreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  score: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const Score = mongoose.model('Score', scoreSchema);

// 3. Маршрут для отправки рекорда
app.post('/api/leaderboard', async (req, res) => {
  try {
    const { name, score } = req.body;
    if (!name || typeof score !== 'number') return res.status(400).json({ error: 'Invalid data' });

    // Сохраняем в облако
    const newEntry = new Score({ name: name.slice(0, 20), score: Math.floor(score) });
    await newEntry.save();

    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 4. Маршрут для получения ТОП-10
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    // Ищем записи, сортируем по убыванию счета, берем только ТОП
    const scores = await Score.find().sort({ score: -1 }).limit(limit);
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
