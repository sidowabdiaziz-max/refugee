const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function createApp() {
  const app = express();
  app.use(express.json());

  const camps = new Set(['Hagadera', 'Ifo', 'Dagahaley', 'Kakuma']);
  const languages = new Set(['en', 'so', 'sw', 'ar']);
  const supabase = getSupabase();

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'identity-service',
      time: new Date().toISOString(),
      supabase_configured: Boolean(supabase),
      login_enabled: false,
    });
  });

  app.get('/v1/supabase/status', async (_req, res) => {
    if (!supabase) {
      return res.status(503).json({
        status: 'not_configured',
        detail: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.',
      });
    }

    const { error } = await supabase.from('refugee_profiles').select('id').limit(1);
    if (error) {
      return res.status(502).json({ status: 'error', detail: error.message });
    }

    return res.json({ status: 'ok', detail: 'Supabase connection and refugee_profiles table are reachable.' });
  });

  // Registration only. Login flow will be implemented later on user instruction.
  app.post('/v1/register', async (req, res) => {
    const {
      full_name,
      camp,
      ration_card,
      alien_id,
      biometric_opt_in = false,
      language = 'en',
      phone_number,
    } = req.body || {};

    if (!full_name || !ration_card || !alien_id || !phone_number || !camps.has(camp) || !languages.has(language)) {
      return res.status(400).json({ detail: 'Invalid registration payload' });
    }

    if (!supabase) {
      return res.status(503).json({ detail: 'Supabase is not configured for identity registration' });
    }

    try {
      const { data: existing, error: duplicateCheckError } = await supabase
        .from('refugee_profiles')
        .select('refugee_id,phone_number,ration_card')
        .or(`phone_number.eq.${phone_number},ration_card.eq.${ration_card}`)
        .limit(1);

      if (duplicateCheckError) return res.status(400).json({ detail: duplicateCheckError.message });
      if (existing && existing.length > 0) {
        return res.status(409).json({ detail: 'Profile already exists for this phone number or ration card.' });
      }

      const generatedPassword = crypto.randomBytes(12).toString('base64url');

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        phone: phone_number,
        password: generatedPassword,
        phone_confirm: true,
        user_metadata: {
          full_name,
          camp,
          ration_card,
          alien_id,
          biometric_opt_in: Boolean(biometric_opt_in),
          language,
        },
      });

      if (authError || !authData?.user) {
        return res.status(400).json({ detail: authError?.message || 'Unable to create Supabase auth user' });
      }

      const refugee_id = `rdi-${crypto.randomBytes(6).toString('hex')}`;
      const profile = {
        refugee_id,
        auth_user_id: authData.user.id,
        full_name,
        camp,
        ration_card,
        alien_id,
        biometric_opt_in: Boolean(biometric_opt_in),
        language,
        phone_number,
        registration_channel: 'mobile_app',
        created_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase.from('refugee_profiles').insert(profile);
      if (profileError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        return res.status(400).json({ detail: profileError.message });
      }

      return res.status(201).json({
        ...profile,
        auth_provider: 'supabase',
        onboarding_reference: `ONB-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        login_status: 'not_enabled_yet',
      });
    } catch (err) {
      return res.status(500).json({ detail: err.message || 'Registration failure' });
    }
  });

  app.post('/v1/authenticate', (_req, res) => {
    return res.status(501).json({
      detail: 'Login/authenticate flow is intentionally not implemented yet. Build pending user instruction.',
    });
  });

  app.get('/v1/profile/:refugeeId', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ detail: 'Supabase is not configured for identity lookup' });
    }

    const { data, error } = await supabase
      .from('refugee_profiles')
      .select('*')
      .eq('refugee_id', req.params.refugeeId)
      .maybeSingle();

    if (error) return res.status(400).json({ detail: error.message });
    if (!data) return res.status(404).json({ detail: 'Refugee profile not found' });
    return res.json(data);
  });

  app.get('/v1/id-card/:refugeeId', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ detail: 'Supabase is not configured for identity lookup' });
    }

    const { data, error } = await supabase
      .from('refugee_profiles')
      .select('refugee_id,camp')
      .eq('refugee_id', req.params.refugeeId)
      .maybeSingle();

    if (error) return res.status(400).json({ detail: error.message });
    if (!data) return res.status(404).json({ detail: 'Refugee profile not found' });

    return res.json({
      refugee_id: data.refugee_id,
      qr_payload: `RDI::${data.refugee_id}::${data.camp}`,
      nfc_ready: true,
      blockchain_hash: crypto.randomBytes(16).toString('hex'),
    });
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = process.env.PORT || 8000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`identity-service listening on ${port}`);
  });
}

module.exports = { createApp };
