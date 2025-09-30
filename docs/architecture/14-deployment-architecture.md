# 14. Deployment Architecture

## 14.1 Environments

| Environment | Purpose | URL | Branch | Auto-Deploy |
|-------------|---------|-----|--------|-------------|
| **Development** | Local development | http://localhost:3000 | N/A | No |
| **Preview** | PR review & testing | https://sophiaai-pr-{n}.vercel.app | feature/* | Yes (on PR) |
| **Staging** | Pre-production testing | https://staging.sophiaai.com | develop | Yes |
| **Production** | Live system | https://app.sophiaai.com | main | Yes (after approval) |

## 14.2 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build

  deploy-production:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://app.sophiaai.com
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-args: '--prod'

      - run: npm run test:smoke
```

## 14.3 Scaling Strategy

**Automatic Scaling** (Vercel):
- Concurrent executions: 0 → 1000+
- Cold start: <500ms
- Bandwidth: Unlimited

**Database Scaling** (Supabase):
- Connection pooling: PgBouncer (50 connections)
- Vertical scaling: 2GB → 8GB RAM

**Expected Load** (100 agents):
- Messages: ~500/hour peak
- API requests: ~2000/hour
- Database connections: ~20 concurrent

## 14.4 Cost Estimates

**Monthly Infrastructure Costs (MVP - 100 agents)**:

| Service | Tier | Cost |
|---------|------|------|
| Vercel | Pro | $20/month |
| Supabase | Pro | $25/month |
| Upstash Redis | Pay-as-you-go | $10/month |
| OpenAI | Pay-as-you-go | $150/month |
| WhatsApp | Free | $0 |
| Sentry | Team | $26/month |
| **Total** | | **~$231/month** |

---
