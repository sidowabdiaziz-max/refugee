const express = require('express');

function createApp() {
  const app = express();
  app.use(express.json());

  const categories = new Set(['food', 'health', 'education', 'drs', 'protection', 'emergency']);
  const camps = new Set(['Hagadera', 'Ifo', 'Dagahaley', 'Kakuma', 'all']);

  const announcements = [];
  const serviceLogs = [];

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'ngo-service', time: new Date().toISOString() });
  });

  app.post('/v1/announcements', (req, res) => {
    const { title, body, category, target_camp } = req.body || {};
    if (!title || !body || !categories.has(category) || !camps.has(target_camp)) {
      return res.status(400).json({ detail: 'Invalid announcement payload' });
    }

    const record = { id: announcements.length + 1, title, body, category, target_camp, created_at: new Date().toISOString() };
    announcements.push(record);
    return res.json(record);
  });

  app.get('/v1/announcements', (req, res) => {
    const camp = req.query.camp || 'all';
    if (camp === 'all') return res.json(announcements);
    return res.json(announcements.filter((a) => a.target_camp === 'all' || a.target_camp === camp));
  });

  app.post('/v1/service-delivery', (req, res) => {
    const { refugee_id, officer_role, service_type, notes } = req.body || {};
    if (!refugee_id || !officer_role || !service_type || !notes) {
      return res.status(400).json({ detail: 'Invalid service log payload' });
    }
    const record = { refugee_id, officer_role, service_type, notes, timestamp: new Date().toISOString() };
    serviceLogs.push(record);
    return res.json({ logged: true, record });
  });

  app.get('/v1/reports/utilization', (_req, res) => {
    const summary = {};
    for (const log of serviceLogs) summary[log.service_type] = (summary[log.service_type] || 0) + 1;
    return res.json(summary);
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = process.env.PORT || 8000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`ngo-service listening on ${port}`);
  });
}

module.exports = { createApp };
