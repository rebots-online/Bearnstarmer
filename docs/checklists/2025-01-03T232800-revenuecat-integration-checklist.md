# RevenueCat Integration Checklist

**Project:** Bearnstarmer (tl;justdraw)  
**Date:** 2025-01-03  
**Platforms:** Web (PWA), Android, Tauri2 (Windows/Linux)  

---

## Phase 0: RevenueCat Project Setup

### Dashboard Configuration
- [ ] Create RevenueCat project at https://app.revenuecat.com
- [ ] Configure project name: `tljustdraw`
- [ ] Set up app platforms:
  - [ ] Web (Stripe)
  - [ ] Android (Google Play) — if native distribution planned
- [ ] Connect Stripe account to RevenueCat
- [ ] Configure webhook URL (to be deployed backend)
- [ ] Generate and store API keys:
  - [ ] Public SDK key → `REVENUECAT_PUBLIC_API_KEY`
  - [ ] Secret key → `REVENUECAT_SECRET_KEY` (server-side only)

### Product Configuration
- [ ] Create entitlements in RevenueCat:
  - [ ] `pro_canvas` — Pro tier canvas features
  - [ ] `multi_agents` — Multiple concurrent agents
  - [ ] `excal_import_plus` — Advanced library import
  - [ ] `cloud_sync` — Cross-device sync (Team)
- [ ] Create products:
  - [ ] `pro_monthly` — $9.99/mo subscription
  - [ ] `pro_annual` — $99.99/yr subscription
  - [ ] `team_monthly` — $29.99/mo subscription
  - [ ] `credits_100` — 100 credits consumable
  - [ ] `credits_500` — 500 credits consumable
  - [ ] `credits_1200` — 1,200 credits consumable
- [ ] Create offerings:
  - [ ] `default` offering with Pro subscription packages
  - [ ] `credits` offering with credit pack packages
- [ ] Map products to entitlements

---

## Phase 1: Core SDK Integration (Web)

### Package Installation
- [ ] Add RevenueCat Web SDK to `apps/web/package.json`:
  ```bash
  pnpm add @revenuecat/purchases-js --filter @tljustdraw/web
  ```
- [ ] Add types if needed (check SDK for built-in types)

### BillingService Implementation
- [ ] Create `packages/shared-utils/src/billing/` directory
- [ ] Implement `packages/shared-utils/src/billing/types.ts`:
  - [ ] `CustomerInfo` interface
  - [ ] `Offering` interface
  - [ ] `Package` interface
  - [ ] `Entitlement` interface
  - [ ] `CreditBalance` interface
- [ ] Implement `packages/shared-utils/src/billing/billingService.ts`:
  - [ ] `initialize(apiKey: string, appUserId?: string): Promise<void>`
  - [ ] `login(appUserId: string): Promise<CustomerInfo>`
  - [ ] `logout(): Promise<void>`
  - [ ] `getOfferings(): Promise<Offerings>`
  - [ ] `getCustomerInfo(): Promise<CustomerInfo>`
  - [ ] `purchase(packageId: string): Promise<CustomerInfo>`
  - [ ] `restorePurchases(): Promise<CustomerInfo>`
  - [ ] `hasEntitlement(entitlementId: string): boolean`
- [ ] Export from `packages/shared-utils/src/index.ts`
- [ ] Add unit tests for BillingService

### EntitlementProvider (React Context)
- [ ] Create `apps/web/src/contexts/` directory
- [ ] Implement `apps/web/src/contexts/EntitlementContext.tsx`:
  - [ ] `EntitlementProviderProps` interface
  - [ ] `EntitlementContextValue` interface:
    - [ ] `entitlements: Set<string>`
    - [ ] `credits: number`
    - [ ] `isProUser: boolean`
    - [ ] `isTeamUser: boolean`
    - [ ] `isLoading: boolean`
    - [ ] `error: Error | null`
    - [ ] `refresh(): Promise<void>`
  - [ ] `EntitlementProvider` component
  - [ ] `useEntitlements()` hook
- [ ] Wrap `App.tsx` with `EntitlementProvider`
- [ ] Add unit tests for EntitlementProvider

### Entitlement Gating Hook
- [ ] Create `apps/web/src/hooks/useFeatureGate.ts`:
  - [ ] `useFeatureGate(entitlementId: string): { allowed: boolean, reason: string }`
  - [ ] `useProGate(): boolean`
  - [ ] `useCreditsGate(cost: number): { allowed: boolean, balance: number }`

---

## Phase 2: Subscription UI

### SubscriptionPanel Component
- [ ] Create `apps/web/src/components/panels/SubscriptionPanel.tsx`:
  - [ ] Display current plan status
  - [ ] Show available offerings
  - [ ] Purchase buttons for each package
  - [ ] Restore purchases button
  - [ ] Manage subscription link (RevenueCat customer portal)
- [ ] Add panel to `AppLayout.tsx` (new slot or modal)
- [ ] Style subscription panel in `app.css`

### Upgrade Prompts
- [ ] Create `apps/web/src/components/ui/UpgradePrompt.tsx`:
  - [ ] Contextual upgrade CTA component
  - [ ] Feature-specific messaging
  - [ ] Quick purchase action
- [ ] Integrate upgrade prompts at gating points:
  - [ ] Agent panel (when `multi_agents` required)
  - [ ] Library panel (when `excal_import_plus` required)
  - [ ] Export actions (when `pro_canvas` required)

### Account/Billing Page
- [ ] Create `apps/web/src/pages/AccountPage.tsx` (or modal):
  - [ ] Current subscription details
  - [ ] Credit balance display
  - [ ] Purchase history (from CustomerInfo)
  - [ ] Manage subscription button

---

## Phase 3: Backend Webhook Handler

### Serverless Function Setup
- [ ] Choose deployment platform (Cloudflare Workers recommended)
- [ ] Create `backend/` directory at repo root
- [ ] Initialize project:
  ```bash
  mkdir backend && cd backend
  pnpm init
  pnpm add hono  # or express/itty-router
  ```

### Webhook Implementation
- [ ] Implement `backend/src/webhooks/revenuecat.ts`:
  - [ ] Verify webhook signature (RevenueCat shared secret)
  - [ ] Handle event types:
    - [ ] `INITIAL_PURCHASE` → Grant entitlements/credits
    - [ ] `RENEWAL` → Extend subscription, grant monthly credits
    - [ ] `NON_RENEWING_PURCHASE` → Add credits to balance
    - [ ] `CANCELLATION` → Mark pending cancellation
    - [ ] `EXPIRATION` → Revoke entitlements
    - [ ] `BILLING_ISSUE` → Flag account, send notification
  - [ ] Idempotency handling (store processed event IDs)
- [ ] Add endpoint route: `POST /webhooks/revenuecat`
- [ ] Deploy and configure URL in RevenueCat dashboard

### Database Setup
- [ ] Choose database (D1/Turso for Cloudflare, Supabase, PlanetScale)
- [ ] Create migration for `credit_ledger` table
- [ ] Create migration for `credit_transactions` table
- [ ] Create migration for `entitlement_cache` table (optional server-side cache)
- [ ] Implement database client/ORM setup

### Credit Ledger API
- [ ] Implement `backend/src/api/credits.ts`:
  - [ ] `GET /api/credits/:userId` → Get balance
  - [ ] `POST /api/credits/consume` → Deduct credits (authenticated)
  - [ ] `GET /api/credits/:userId/transactions` → Transaction history
- [ ] Add authentication middleware (verify SSO token)
- [ ] Add rate limiting

---

## Phase 4: Credit Consumption Integration

### Credit Service (Client)
- [ ] Create `packages/shared-utils/src/billing/creditService.ts`:
  - [ ] `getBalance(): Promise<number>`
  - [ ] `consume(amount: number, operation: string): Promise<boolean>`
  - [ ] `canAfford(amount: number): boolean`
- [ ] Export from index

### Agent Credit Integration
- [ ] Update `apps/web/src/hooks/useAgentSession.ts`:
  - [ ] Check credit balance before sending message
  - [ ] Deduct credits on successful agent response
  - [ ] Show insufficient credits error
  - [ ] Credit cost varies by provider:
    - [ ] Gemini: 2 credits
    - [ ] OpenRouter GPT-4.1: 3 credits
    - [ ] Ollama: 0 credits (local)
- [ ] Update `AgentPanel.tsx`:
  - [ ] Display current credit balance
  - [ ] Show cost per message
  - [ ] Disable send when insufficient credits

### Credit Balance UI
- [ ] Create `apps/web/src/components/ui/CreditBalance.tsx`:
  - [ ] Animated balance display
  - [ ] Low balance warning
  - [ ] Quick purchase button
- [ ] Add to app header or agent panel

---

## Phase 5: Tauri2 Desktop Integration

### Deep Link Configuration
- [ ] Add `tauri-plugin-deep-link` to Tauri project
- [ ] Configure URL scheme: `tljustdraw://`
- [ ] Handle billing callbacks:
  - [ ] `tljustdraw://billing/success`
  - [ ] `tljustdraw://billing/cancel`

### Secure Storage
- [ ] Use `tauri-plugin-store` for token storage
- [ ] Store RevenueCat anonymous ID
- [ ] Store cached entitlements

### Checkout Flow (Tauri)
- [ ] Implement checkout in system browser (not webview for PCI compliance)
- [ ] Poll for purchase completion OR use deep link callback
- [ ] Refresh entitlements on focus return

### Platform Detection
- [ ] Create `packages/shared-utils/src/platform.ts`:
  - [ ] `isWeb(): boolean`
  - [ ] `isTauri(): boolean`
  - [ ] `isAndroid(): boolean`
  - [ ] `getPlatform(): 'web' | 'tauri-windows' | 'tauri-linux' | 'android'`
- [ ] Conditionally adjust billing flows per platform

---

## Phase 6: Android Integration (Optional/Future)

### Capacitor Setup (if hybrid)
- [ ] Add Capacitor to project
- [ ] Install `@revenuecat/purchases-capacitor`
- [ ] Configure Android app in RevenueCat with package name
- [ ] Set up Google Play Console service account
- [ ] Connect Google Play to RevenueCat

### Native Android (if separate app)
- [ ] Create Android project
- [ ] Add RevenueCat Android SDK dependency
- [ ] Implement BillingService equivalent in Kotlin
- [ ] Handle Play Store billing flow
- [ ] App User ID sync with web identity

### Testing
- [ ] Set up RevenueCat sandbox mode
- [ ] Test subscription purchase flow
- [ ] Test credit purchase flow
- [ ] Test restore purchases
- [ ] Test cross-platform sync

---

## Phase 7: Testing & QA

### Unit Tests
- [ ] BillingService initialization
- [ ] BillingService purchase flow (mocked)
- [ ] EntitlementProvider state management
- [ ] CreditService balance operations
- [ ] Webhook handler event processing
- [ ] Idempotency handling

### Integration Tests
- [ ] End-to-end subscription purchase (sandbox)
- [ ] Credit purchase and consumption flow
- [ ] Entitlement gating enforcement
- [ ] Cross-platform App User ID sync
- [ ] Webhook delivery and processing

### Manual Testing Checklist
- [ ] New user signup → Free tier entitlements
- [ ] Free → Pro upgrade flow
- [ ] Pro → Team upgrade flow
- [ ] Subscription cancellation flow
- [ ] Subscription renewal (sandbox accelerated)
- [ ] Credit pack purchase
- [ ] Agent message credit deduction
- [ ] Insufficient credits handling
- [ ] Restore purchases on new device
- [ ] Offline entitlement caching
- [ ] Tauri checkout flow
- [ ] Deep link callback handling

---

## Phase 8: Observability & Monitoring

### Logging
- [ ] Add billing events to logger:
  - [ ] Purchase initiated
  - [ ] Purchase completed
  - [ ] Purchase failed (with error)
  - [ ] Entitlement granted
  - [ ] Entitlement revoked
  - [ ] Credit consumed
  - [ ] Credit purchased

### Metrics
- [ ] Track conversion funnel:
  - [ ] Subscription page views
  - [ ] Purchase initiated
  - [ ] Purchase completed
  - [ ] Purchase abandoned
- [ ] Track credit usage:
  - [ ] Credits consumed per day
  - [ ] Credits purchased per day
  - [ ] Average balance per user

### Alerting
- [ ] Webhook processing failures
- [ ] Billing API errors
- [ ] Credit balance sync issues
- [ ] Abnormal churn rate

---

## Acceptance Criteria

### MVP (P0)
- [ ] User can view subscription offerings in app
- [ ] User can purchase Pro subscription via Stripe (web)
- [ ] Entitlements are enforced (features gated)
- [ ] Webhooks update entitlements in near-real-time
- [ ] User can restore purchases

### Phase 2 (P1)
- [ ] Credit system functional
- [ ] Agent messages consume credits
- [ ] Users can purchase credit packs
- [ ] Tauri desktop checkout works

### Phase 3 (P2)
- [ ] Android Play Store billing (if applicable)
- [ ] Team plan with workspace sharing
- [ ] Admin console for entitlement inspection

---

## Environment Variables Required

```env
# Client-side (public)
REVENUECAT_PUBLIC_API_KEY=pk_xxxxxxxxxxxxx

# Server-side (secret - never expose)
REVENUECAT_SECRET_KEY=sk_xxxxxxxxxxxxx
REVENUECAT_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Database
DATABASE_URL=xxxxxxxxxxxxx
```

---

## Files to Create/Modify

### New Files
```
packages/shared-utils/src/billing/
├── types.ts
├── billingService.ts
├── creditService.ts
└── index.ts

packages/shared-utils/src/platform.ts

apps/web/src/contexts/
└── EntitlementContext.tsx

apps/web/src/hooks/
└── useFeatureGate.ts

apps/web/src/components/panels/
└── SubscriptionPanel.tsx

apps/web/src/components/ui/
├── UpgradePrompt.tsx
└── CreditBalance.tsx

backend/
├── package.json
├── src/
│   ├── index.ts
│   ├── webhooks/
│   │   └── revenuecat.ts
│   ├── api/
│   │   └── credits.ts
│   └── db/
│       └── schema.ts
└── wrangler.toml (if Cloudflare)
```

### Modified Files
```
packages/shared-utils/src/index.ts          # Export billing modules
apps/web/src/App.tsx                        # Add EntitlementProvider
apps/web/src/hooks/useAgentSession.ts       # Credit consumption
apps/web/src/components/panels/AgentPanel.tsx # Credit display
apps/web/src/app.css                        # Billing UI styles
```

---

## References

- [RevenueCat Web SDK Docs](https://www.revenuecat.com/docs/web)
- [RevenueCat Webhooks](https://www.revenuecat.com/docs/webhooks)
- [RevenueCat Entitlements](https://www.revenuecat.com/docs/entitlements)
- [RevenueCat + Stripe](https://www.revenuecat.com/docs/stripe)
- [Tauri Deep Links](https://v2.tauri.app/plugin/deep-linking/)
