# 15. Security and Performance

## 15.1 Authentication & Authorization

**Authentication**: Supabase Auth + JWT + httpOnly cookies
**Authorization**: Row-Level Security (RLS) policies + role-based access

**Admin Roles**:
- **Super Admin**: Full access (manage admins, agents, settings)
- **Admin**: Read/write agents, conversations, documents
- **Viewer**: Read-only access to dashboards

## 15.2 Data Security

**Encryption**:
- At rest: AES-256 (Supabase, Upstash)
- In transit: TLS 1.3 (all APIs)

**GDPR Compliance**:
- 90-day data retention (automated cleanup)
- Right to be forgotten (user deletion endpoint)
- Audit logs for admin access to PII

## 15.3 Rate Limiting

```typescript
// Redis sliding window rate limiter

const RATE_LIMITS = {
  whatsapp_webhook: { limit: 100, window: 60 },    // 100 req/min
  trpc_authenticated: { limit: 5000, window: 60 }, // 5000 req/min per user
  openai_api: { limit: 50, window: 60 },           // 50 req/min per agent
};
```

## 15.4 Performance Targets

| Metric | Target |
|--------|--------|
| API Response Time (p95) | < 300ms |
| Webhook Processing | < 2s end-to-end |
| Page Load (LCP) | < 2.5s |
| Database Query Time (p95) | < 100ms |

## 15.5 Security Headers

```typescript
// next.config.mjs

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; ..." },
];
```

---
