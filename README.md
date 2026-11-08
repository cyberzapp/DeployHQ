# DeployHQ — Ship faster. Monitor smarter. Stay in control.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://deployhq.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-11.0-orange)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)

**DeployHQ** is a production-quality developer deployment and observability SaaS platform inspired by Vercel, Railway, and Linear. It unites multi-cloud CI/CD deployment pipelines, synthetic HTTP uptime probes, SHA-256 fingerprinted exception grouping, zero-knowledge encrypted environment secrets, and SOC2-ready audit trails into one cohesive developer workspace.

---

## 1. Key Capabilities & Feature Matrix

- **Multi-Cloud Deployments & Instant Rollbacks**:
  - Connect GitHub repositories (OAuth & Fine-grained Personal Access Tokens).
  - Vercel API integration with automatic 5-minute status reconciliation.
  - 6-step build pipeline visualizer with live streaming log viewer (auto-scroll, line numbers, search filter).
  - **Zero-Downtime Rollbacks**: Immediate Anycast routing swap with safety confirmation dialog and commit hash diffing.
  - Emergency rollback triggers for failed production releases.

- **Continuous Synthetic Uptime Probes**:
  - Multi-region 30-second synthetic HTTP probes with latency distribution charts (P50/P95/P99).
  - Real-time SLA % calculation, status degradation alerts, and failure notifications.
  - Multi-channel alerts (In-App notification center, Webhook dispatch, FCM Push notifications).

- **Exception Fingerprinting & Error Tracking**:
  - Ingest stack traces via zero-dependency `@deployhq/client` SDK or REST cURL payloads.
  - Automated SHA-256 fingerprint deduplication grouping recurring exceptions by call site.
  - Context drilldown: runtime platform, URL, release tag, affected users counter.

- **Zero-Knowledge Encrypted Environment Secrets**:
  - AES-256 GCM client-masked variables (`sk_live_...9f2a`).
  - Strict Firestore Security Rules forbidding client reads/writes to plaintext server-only secret vaults.
  - Bulk `.env` import modal with automatic key parsing and duplicate detection.

- **Public System Status Portal (`/status`)**:
  - Publicly accessible status dashboard with real-time health indicator.
  - 90-day interactive uptime history visualizer bars with day-by-day tooltip diagnostics.
  - Global edge latency across US East, Europe, Singapore, and Mumbai.
  - Incident timeline tracker and subscriber notification modal.

- **Audit Trail & SOC2 Compliance (`/activity`)**:
  - Immutable chronological ledger of all CI/CD dispatches, secret modifications, and RBAC actions.
  - Filterable by actor, project, action category, and keyword.
  - 1-click audit export to CSV and JSON formats.

- **Developer Productivity & Tools**:
  - **Global Command Palette (`⌘K` / `Ctrl+K`)**: Rapid navigation, project jumping, and quick actions.
  - **DeployHQ CLI (`deployhq`)**: Standalone ESM terminal tool for `init`, `deploy`, `status`, `env pull/push`.
  - **Interactive Webhook Playground**: Live HMAC-SHA256 signature generation and event dispatch simulator.
  - **DNS-over-HTTPS (DoH)**: Real-time CNAME resolution and propagation testing via Google Cloud DNS.

---

## 2. Architecture & Security Infrastructure

```text
users/{uid}
workspaces/{workspaceId}
  ├── members/{uid}                     # RBAC: owner | admin | developer | viewer
  ├── projects/{projectId}              # Repository, framework, build pipeline, custom domains
  ├── deployments/{deploymentId}        # Commit SHA, status, duration, 6-step timeline
  │     └── logs/{logId}                # Real-time streaming build log entries
  ├── monitors/{monitorId}              # HTTP health check configuration & SLA metrics
  ├── monitorChecks/{checkId}           # Immutable HTTP probe latency & status records
  ├── errors/{errorId}                  # SHA-256 fingerprinted exception groups & stacks
  ├── alerts/{alertId}                  # Condition rules & delivery channels
  ├── notifications/{notificationId}    # In-app, FCM push, and email alert deliveries
  ├── activity/{activityId}             # Immutable workspace audit trail (SOC2 compliant)
  ├── integrations/{integrationId}      # Public metadata ONLY (status, accountName)
  ├── integrationSecrets/{secretId}     # Server-only tokens (Admin SDK only, client denied)
  ├── environments/{environmentId}      # Masked variable previews ONLY
  ├── environmentSecrets/{secretId}     # Server-only plaintext env values (client denied)
  └── subscriptions/{subscriptionId}    # Razorpay verified subscription state
webhookDeliveries/{provider_deliveryId} # Idempotency lock preventing duplicate webhooks
```

### Security Highlights
- **Zero Plaintext Secrets in Client Collections**: `firestore.rules` blocks `integrationSecrets` and `environmentSecrets` (`allow read, write: if false;`) and forbids write payloads containing plaintext secret keys.
- **Append-Only Activity Log**: Activity collections prohibit updates and deletions (`allow update, delete: if false;`), ensuring non-repudiation.
- **Timing-Safe HMAC Verification**: All webhooks verify signatures with `crypto.timingSafeEqual` and deduplicate delivery IDs to avoid replay attacks.

---

## 3. Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- (Optional for emulators) JDK 21+ for Firebase Emulator Suite

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/deployhq.git
cd deployhq

# Install dependencies for web client and Cloud Functions
npm install
cd functions && npm install && cd ..

# Copy sample environment configuration
cp .env.example .env
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

DeployHQ operates with a dual-mode architecture:
- If Firebase credentials are not provided, it instantly boots an in-memory **Demonstration Workspace** (`demo-workspace`) pre-seeded with realistic production telemetry, charts, and simulated webhooks.
- When Firebase environment variables are configured, it seamlessly authenticates against live Firebase services.

---

## 4. DeployHQ CLI

DeployHQ includes a standalone ESM CLI utility registered in `package.json`:

```bash
# Deploy the current directory
npx deployhq deploy --prod

# Pull remote encrypted environment variables
npx deployhq env pull .env.production

# Push local environment variables to remote vault
npx deployhq env push .env.local --env production

# Check workspace & project deployment status
npx deployhq status

# Authenticate CLI session
npx deployhq whoami
```

---

## 5. Client SDK Integration

DeployHQ provides a zero-dependency error tracking and monitoring client (`src/sdk/deployhq-client.ts`):

```typescript
import { DeployHQ } from '@deployhq/client';

const client = new DeployHQ({
  apiKey: 'dhq_live_abc123...',
  projectId: 'prj_web_platform',
  environment: 'production',
});

// Capture unhandled errors or manual exceptions
try {
  runApplicationLogic();
} catch (error) {
  await client.captureException(error, {
    url: window.location.href,
    release: 'v2.4.0',
  });
}
```

---

## 6. Testing & Quality Verification

DeployHQ maintains strict automated test suites for security and compilation:

```bash
# Verify TypeScript compilation and production bundle build
npm run build

# Run automated Firestore Security Rules test suite (5/5 passing)
npm run test:rules

# Build Cloud Functions TypeScript backend
npm --prefix functions run build
```

---

## 7. License

Licensed under the [MIT License](LICENSE).
