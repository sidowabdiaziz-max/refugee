const express = require('express');

function createApp() {
  const app = express();
  app.use(express.json());

  const camps = new Set(['Hagadera', 'Ifo', 'Dagahaley', 'Kakuma']);
  const moods = new Set(['neutral', 'sad', 'anxious', 'hopeful']);
  const langs = new Set(['en', 'so', 'sw', 'ar']);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'ai-service', time: new Date().toISOString() });
  });

  app.post('/v1/recommendations', (req, res) => {
    const { refugee_id, camp, household_size, mood = 'neutral', language = 'en' } = req.body || {};
    if (!refugee_id || !camps.has(camp) || !Number.isInteger(household_size) || household_size < 1 || household_size > 20 || !moods.has(mood) || !langs.has(language)) {
      return res.status(400).json({ detail: 'Invalid assistant query' });
    }

    const daysUntilFood = Math.max(3, 21 - household_size);
    const nextDate = new Date(Date.now() + daysUntilFood * 24 * 60 * 60 * 1000);
    const vulnerability = Math.min(100, 25 + household_size * 3 + (mood === 'sad' || mood === 'anxious' ? 15 : 0));

    return res.json({
      food_distribution_date: nextDate.toISOString().slice(0, 10),
      priority_services: ['Food Distribution', 'Psychosocial Support', 'Health Screening'],
      vulnerability_score: vulnerability,
      employability_score: 40 + Math.floor(Math.random() * 49),
      fraud_risk_flag: false,
      assistant_message: 'You are not alone. We prepared a personalized plan and reminders for your household.',
      offline_fallback: { cached_announcements: true, sync_required: true },
    });
  });

  app.get('/v1/analytics/demand-forecast', (_req, res) => {
    res.json({
      food: { Hagadera: 1200, Ifo: 980, Dagahaley: 1105, Kakuma: 1430 },
      health: { Hagadera: 420, Ifo: 390, Dagahaley: 415, Kakuma: 560 },
      education: { Hagadera: 210, Ifo: 180, Dagahaley: 205, Kakuma: 300 },
    });
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = process.env.PORT || 8000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`ai-service listening on ${port}`);
  });
}

module.exports = { createApp };
