# Vercel Deployment (via GitHub)

This project deploys the **PWA frontend** to Vercel directly from GitHub.

> Note: backend microservices (`identity-service`, `ai-service`, `ngo-service`, `service-catalog-service`) are separate Node services and should be deployed on container platforms (Render, Railway, Fly.io, Cloud Run, ECS, AKS, etc.).

## 1) Push repository to GitHub

Ensure your latest branch is pushed to GitHub.

## 2) Import project in Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Select your GitHub repository.
3. Keep framework as **Other** (static).
4. Vercel will read `vercel.json` and serve `apps/refugee-digital-identity-pwa`.

## 3) Configure frontend API endpoints

The PWA reads API bases from `window.RDI_CONFIG` (if present) and falls back to localhost defaults.

For production, add this small script in your `index.html` before `app.js` or inject during build:

```html
<script>
  window.RDI_CONFIG = {
    IDENTITY_API_BASE: "https://identity.your-domain.tld",
    AI_API_BASE: "https://ai.your-domain.tld"
  };
</script>
```

## 4) Deploy

Click **Deploy** in Vercel. Any future push to the connected GitHub branch auto-deploys.

## 5) Verify

- Open the Vercel URL.
- Confirm PWA loads.
- Check registration section backend connectivity message.
- Verify AI recommendation tiles are populated from your AI service endpoint.

## Recommended production setup

- Host backend services in Kubernetes/containers.
- Expose HTTPS endpoints for `identity-service` and `ai-service`.
- Add CORS allowlist for the Vercel domain in backend services/gateway.
