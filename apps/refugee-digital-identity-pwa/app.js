const cacheKey = 'rdi-cache-v4';
const runtimeConfig = window.RDI_CONFIG || {};
const identityApiBase = runtimeConfig.IDENTITY_API_BASE || localStorage.getItem('IDENTITY_API_BASE') || 'http://localhost:8001';
const aiApiBase = runtimeConfig.AI_API_BASE || localStorage.getItem('AI_API_BASE') || 'http://localhost:8004';

async function loadRecommendations() {
  const fallback = {
    assistant_message: 'Offline mode enabled. Cached plan is available.',
    food_distribution_date: 'Cached',
    employability_score: null,
    vulnerability_score: null,
  };

  try {
    const resp = await fetch(`${aiApiBase}/v1/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refugee_id: 'demo-user',
        camp: 'Kakuma',
        household_size: 5,
        mood: 'neutral',
        language: localStorage.getItem('lang') || 'en',
      }),
    });

    if (!resp.ok) throw new Error('Failed request');
    const data = await resp.json();
    localStorage.setItem(cacheKey, JSON.stringify(data));
    renderData(data);
  } catch {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null') || fallback;
    renderData(cached);
  }
}

function renderData(data) {
  const emp = typeof data.employability_score === 'number' ? `${data.employability_score}%` : 'N/A';
  const vul = typeof data.vulnerability_score === 'number' ? `${data.vulnerability_score}/100` : 'N/A';

  document.getElementById('ai-summary').textContent = data.assistant_message;
  document.getElementById('food-date').textContent = data.food_distribution_date;
  document.getElementById('employability').textContent = emp;
  document.getElementById('vulnerability').textContent = vul;
}

async function checkSupabaseStatus() {
  const statusEl = document.getElementById('supabase-status');
  try {
    const resp = await fetch(`${identityApiBase}/v1/supabase/status`);
    const body = await resp.json();

    if (resp.ok) {
      statusEl.textContent = '✅ Backend & Supabase connection is healthy.';
      statusEl.classList.remove('error');
      return;
    }

    statusEl.textContent = `⚠️ ${body.detail || 'Supabase connection check failed.'}`;
    statusEl.classList.add('error');
  } catch {
    statusEl.textContent = '⚠️ Identity backend is unreachable.';
    statusEl.classList.add('error');
  }
}

async function registerRefugee() {
  const statusEl = document.getElementById('registration-status');
  statusEl.classList.remove('error', 'success');
  statusEl.textContent = 'Submitting registration...';

  const payload = {
    full_name: document.getElementById('full-name').value.trim(),
    ration_card: document.getElementById('ration-card').value.trim(),
    alien_id: document.getElementById('alien-id').value.trim(),
    camp: document.getElementById('camp-select').value,
    phone_number: document.getElementById('phone-number').value.trim(),
    language: document.getElementById('lang-select').value,
    biometric_opt_in: document.getElementById('biometric-opt').checked,
  };

  try {
    const resp = await fetch(`${identityApiBase}/v1/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await resp.json();
    if (!resp.ok) {
      statusEl.textContent = `Registration failed: ${body.detail || 'Please verify your details.'}`;
      statusEl.classList.add('error');
      return;
    }

    statusEl.textContent = `Registered successfully. Refugee ID: ${body.refugee_id}`;
    statusEl.classList.add('success');
    document.getElementById('active-profile-name').textContent = body.full_name;
    localStorage.setItem('last-registered-profile', JSON.stringify(body));
  } catch {
    statusEl.textContent = 'Registration failed: identity backend is unreachable.';
    statusEl.classList.add('error');
  }
}

document.getElementById('register-btn').addEventListener('click', registerRefugee);
document.getElementById('sync-btn').addEventListener('click', loadRecommendations);
document.getElementById('theme-btn').addEventListener('click', () => document.body.classList.toggle('dark'));
document.getElementById('language').addEventListener('change', (event) => {
  localStorage.setItem('lang', event.target.value);
  loadRecommendations();
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

const persistedLanguage = localStorage.getItem('lang');
if (persistedLanguage) document.getElementById('language').value = persistedLanguage;

const lastProfile = JSON.parse(localStorage.getItem('last-registered-profile') || 'null');
if (lastProfile?.full_name) document.getElementById('active-profile-name').textContent = lastProfile.full_name;

checkSupabaseStatus();
loadRecommendations();
