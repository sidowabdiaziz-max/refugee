const express = require('express');

function createApp() {
  const app = express();

  const catalog = [
    { id: 1, name: 'Food Distribution', category: 'food', eligibility: 'Active ration card', required_documents: ['Ration Card'], location: 'Camp block center', schedule: 'Every 14 days', capacity: 1200 },
    { id: 2, name: 'Vaccination Program', category: 'health', eligibility: 'Children under 5 and pregnant women', required_documents: ['Alien Card', 'Medical Record'], location: 'Camp health clinic', schedule: 'Mon-Fri', capacity: 300 },
    { id: 3, name: 'TVET Training', category: 'education', eligibility: 'Age 18+', required_documents: ['Alien Card'], location: 'Youth center', schedule: 'Quarterly cohorts', capacity: 180 },
  ];

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'service-catalog', time: new Date().toISOString() });
  });

  app.get('/v1/services', (_req, res) => {
    res.json(catalog);
  });

  app.get('/v1/services/:serviceId', (req, res) => {
    const serviceId = Number(req.params.serviceId);
    const item = catalog.find((entry) => entry.id === serviceId);
    if (!item) return res.status(404).json({ detail: 'Service not found' });
    return res.json(item);
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = process.env.PORT || 8000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`service-catalog-service listening on ${port}`);
  });
}

module.exports = { createApp };
