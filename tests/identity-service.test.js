const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../services/identity-service/app/main');

test('identity service reports unavailable Supabase and disabled login flow when not configured', async () => {
  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const supabaseResp = await fetch(`http://127.0.0.1:${port}/v1/supabase/status`);
    assert.equal(supabaseResp.status, 503);

    const registerResp = await fetch(`http://127.0.0.1:${port}/v1/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Amina Noor',
        camp: 'Ifo',
        ration_card: 'RC-123',
        alien_id: 'AL-987',
        biometric_opt_in: true,
        language: 'en',
        phone_number: '+254700000001',
      }),
    });
    assert.equal(registerResp.status, 503);

    const authResp = await fetch(`http://127.0.0.1:${port}/v1/authenticate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone_number: '+254700000001', password: 'placeholder' }),
    });
    assert.equal(authResp.status, 501);
  } finally {
    server.close();
  }
});
