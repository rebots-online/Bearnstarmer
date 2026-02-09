# RevenueCat Integration Report

**Project:** Bearnstarmer (tl;justdraw)  
**Date:** 2025-01-03  
**Platforms:** Web (PWA), Android, Tauri2 (Windows/Linux)  

---

## 1. Executive Summary

This report outlines the architecture, implementation strategy, and technical requirements for integrating **RevenueCat** as the unified billing and subscription management platform for tl;justdraw. The integration will enable:

- **Subscriber management** across all platforms
- **Enrollment flows** for Free/Pro/Team tiers
- **Virtual currency system** (credits) for platform-wide AI agent consumption
- **Cross-platform entitlement synchronization**

---

## 2. Current State Analysis

### 2.1 Existing Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| `revenueCatApiKey` in config | ✅ Defined | `@shared-utils/config.ts` line 13, 107-111 |
| Billing UI | ❌ Missing | No SubscriptionPanel component |
| Entitlement checks | ❌ Missing | No gating logic in place |
| Backend webhook handler | ❌ Missing | Required for entitlement sync |
| Virtual currency system | ❌ Missing | Not yet architected |

### 2.2 Planned Entitlements (from PRD)

| Entitlement Key | Description | Tier |
|-----------------|-------------|------|
| `pro_canvas` | Unlimited boards, exports | Pro |
| `multi_agents` | >1 concurrent agent sessions | Pro |
| `excal_import_plus` | Bulk import, advanced library manager | Pro |
| `cloud_sync` | Workspace syncing across devices | Team |

---

## 3. Platform-Specific Implementation

### 3.1 Web (PWA) — Stripe via RevenueCat

**SDK:** `@revenuecat/purchases-js` (RevenueCat Web SDK)

```
┌─────────────────────────────────────────────────────────────┐
│                        Web App (PWA)                        │
├─────────────────────────────────────────────────────────────┤
│  BillingService                                             │
│  ├── initialize(apiKey, appUserId)                          │
│  ├── getOfferings() → Offerings                             │
│  ├── purchase(packageId) → CustomerInfo                     │
│  ├── getCustomerInfo() → CustomerInfo                       │
│  └── restorePurchases() → CustomerInfo                      │
├─────────────────────────────────────────────────────────────┤
│  EntitlementProvider (React Context)                        │
│  ├── entitlements: Set<string>                              │
│  ├── credits: number                                        │
│  ├── isProUser: boolean                                     │
│  └── refresh()                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     RevenueCat Backend                      │
│  • Stripe integration for web payments                      │
│  • Webhook to app backend for entitlement sync              │
└─────────────────────────────────────────────────────────────┘
```

**Key Implementation Points:**
- Use RevenueCat's Stripe integration for checkout
- App User ID linked to SSO identity (Google/GitHub/etc.)
- Entitlements cached in IndexedDB for offline support

### 3.2 Android — Google Play via RevenueCat

**SDK:** `com.revenuecat.purchases:purchases` (Android SDK)

```
┌─────────────────────────────────────────────────────────────┐
│                     Android App (Tauri?)                    │
├─────────────────────────────────────────────────────────────┤
│  Note: If using Capacitor/Cordova wrapper or native         │
│  Android build, use RevenueCat Android SDK directly.        │
│                                                             │
│  For PWA-only Android: Use Web SDK with Play Store          │
│  billing disabled (web Stripe checkout).                    │
├─────────────────────────────────────────────────────────────┤
│  Integration Options:                                       │
│  A) Native Android app → RevenueCat Android SDK             │
│  B) PWA on Android → Web SDK (Stripe)                       │
│  C) Hybrid (Capacitor) → @revenuecat/purchases-capacitor    │
└─────────────────────────────────────────────────────────────┘
```

**Recommendation:** If targeting Play Store distribution, use **Capacitor** with `@revenuecat/purchases-capacitor` for native billing compliance.

### 3.3 Tauri2 (Windows/Linux) — Stripe via RevenueCat

**SDK:** `@revenuecat/purchases-js` (same as Web)

```
┌─────────────────────────────────────────────────────────────┐
│                   Tauri2 Desktop App                        │
├─────────────────────────────────────────────────────────────┤
│  BillingService (shared with web)                           │
│  ├── Opens Stripe Checkout in webview/system browser        │
│  ├── Deep link callback: tljustdraw://billing/success       │
│  └── Polling fallback for payment confirmation              │
├─────────────────────────────────────────────────────────────┤
│  Tauri-specific:                                            │
│  • Use tauri-plugin-deep-link for OAuth/billing callbacks   │
│  • Secure storage via tauri-plugin-store for tokens         │
│  • Auto-update via tauri-plugin-updater                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Virtual Currency System (Credits)

### 4.1 Architecture

RevenueCat supports **consumable in-app purchases** which can model a credit system:

```
┌────────────────────────────────────────────────────────────────┐
│                    Credit System Architecture                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ Credit Packs │───▶│  RevenueCat  │───▶│ Backend Webhook  │  │
│  │ (Products)   │    │  Purchase    │    │ Handler          │  │
│  └──────────────┘    └──────────────┘    └────────┬─────────┘  │
│                                                   │            │
│                                                   ▼            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Credit Ledger (DB)                     │  │
│  │  user_id | balance | last_updated | transactions[]       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                     │
│                          ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Credit Consumption                     │  │
│  │  • Agent message: 1-10 credits (by model)                │  │
│  │  • Canvas export: 5 credits                              │  │
│  │  • Bulk import: 10 credits                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 4.2 Credit Products (RevenueCat Offerings)

| Product ID | Credits | Price (suggested) | Type |
|------------|---------|-------------------|------|
| `credits_100` | 100 | $4.99 | Consumable |
| `credits_500` | 500 | $19.99 | Consumable |
| `credits_1200` | 1,200 | $39.99 | Consumable |
| `pro_monthly` | 500/mo included | $9.99/mo | Subscription |
| `team_monthly` | 2,000/mo included | $29.99/mo | Subscription |

### 4.3 Credit Consumption Rates

| Operation | Credits | Notes |
|-----------|---------|-------|
| Agent message (z.ai GLM-4.6V) | 2 | Per response |
| Agent message (OpenRouter) | 3 | Per response |
| Agent message (Ollama/LM Studio/vLLM) | 0 | Local, free |
| Canvas PDF export | 5 | One-time |
| Library bulk import | 10 | Per batch |

---

## 5. Backend Requirements

### 5.1 Webhook Handler

A serverless function (Cloudflare Workers, Vercel, AWS Lambda) to receive RevenueCat webhooks:

```typescript
// Webhook events to handle:
interface RevenueCatWebhookEvent {
  type: 
    | 'INITIAL_PURCHASE'
    | 'RENEWAL'
    | 'CANCELLATION'
    | 'UNCANCELLATION'
    | 'NON_RENEWING_PURCHASE'   // Credit packs
    | 'SUBSCRIPTION_PAUSED'
    | 'EXPIRATION'
    | 'BILLING_ISSUE';
  app_user_id: string;
  product_id: string;
  entitlement_ids: string[];
}
```

### 5.2 Database Schema (Credit Ledger)

```sql
CREATE TABLE credit_ledger (
  user_id TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_purchased INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE credit_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,  -- positive = credit, negative = debit
  type TEXT NOT NULL,       -- 'purchase' | 'subscription_grant' | 'consumption'
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES credit_ledger(user_id)
);
```

---

## 6. Security Considerations

| Risk | Mitigation |
|------|------------|
| API key exposure | Use public SDK key client-side; secret key server-side only |
| Entitlement spoofing | Server-side verification via webhooks; never trust client |
| Credit manipulation | All credit operations via authenticated backend API |
| Replay attacks | Idempotency keys on webhook processing |
| Cross-platform sync | Use RevenueCat App User ID linked to SSO identity |

---

## 7. Dependencies to Add

### 7.1 Web / Tauri2

```json
{
  "dependencies": {
    "@revenuecat/purchases-js": "^1.0.0"
  }
}
```

### 7.2 Android (if native/Capacitor)

```groovy
// build.gradle
implementation 'com.revenuecat.purchases:purchases:7.+'
```

Or for Capacitor:
```json
{
  "dependencies": {
    "@revenuecat/purchases-capacitor": "^7.0.0"
  }
}
```

### 7.3 Backend

```json
{
  "dependencies": {
    "purchases-server": "^1.0.0"  // RevenueCat server SDK (optional)
  }
}
```

---

## 8. Estimated Effort

| Task | Effort | Priority |
|------|--------|----------|
| RevenueCat project setup & Stripe connection | 2h | P0 |
| Web SDK integration + BillingService | 8h | P0 |
| EntitlementProvider context | 4h | P0 |
| SubscriptionPanel UI | 8h | P0 |
| Webhook handler (serverless) | 6h | P0 |
| Credit ledger backend | 8h | P1 |
| Credit consumption integration | 6h | P1 |
| Tauri2 deep link handling | 4h | P1 |
| Android (Capacitor) integration | 12h | P2 |
| Testing & QA | 8h | P0 |

**Total Estimated:** ~66 hours

---

## 9. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| RevenueCat Web SDK limitations | Medium | High | Early prototype; fallback to direct Stripe |
| Play Store billing compliance | High | High | Use native SDK or declare web-only |
| Credit balance sync issues | Medium | Medium | Idempotent webhooks; reconciliation job |
| Offline entitlement drift | Low | Low | Cache with TTL; sync on reconnect |

---

## 10. Next Steps

1. **Create RevenueCat project** and configure Stripe
2. **Define products** in RevenueCat dashboard (subscriptions + credit packs)
3. **Implement BillingService** in `@tljustdraw/shared-utils`
4. **Add EntitlementProvider** React context
5. **Build SubscriptionPanel** component
6. **Deploy webhook handler** (Cloudflare Workers recommended)
7. **Integrate credit consumption** into agent operations

See accompanying checklist: `2025-01-03-revenuecat-integration-checklist.md`
