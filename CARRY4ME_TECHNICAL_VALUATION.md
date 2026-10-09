# Carry4Me — Technical Audit and Development Valuation

**Audit date:** 9 October 2026  
**Scope:** Source tree at `c:\Users\munat\Projects\carry4me` (one Git repository). Read-only. No application was executed, no database was queried, and no tests were run.  
**Method:** Inspection of application source, SQL migrations, Supabase Edge Functions, configuration, and documentation. Classifications reflect what the code connects, not production traffic.  
**Working tree:** Uncommitted edits were present in listing and payment-preference UI files. Those files were included as current source.  
**Secrets:** Environment files exist locally and were not opened. No keys, passwords, or personal records are reproduced here.

This document estimates the **professional cost to rebuild the software that exists**. It is not a price for the business, brand, users, or future revenue. No evidence in the repository establishes live users, completed payments, or revenue.

---

## 1. Project overview

### Identity and purpose

**Carry4Me** is a peer-to-peer parcel marketplace. Senders post parcels. Travellers post trips with spare luggage capacity. Either party can open a carry request. After acceptance, the sender pays by card. Funds stay on the platform until both parties confirm handover, the parcel is marked delivered, and the sender’s delivery code is verified. The traveller is then paid through Stripe Connect, minus a platform fee.

The product copy is aimed at diaspora delivery, with Zimbabwe as the fixed destination country (`apps/web/src/app/shared/locations/fixedDestination.ts`). The README describes the same purpose and names Michael Munatsi as the author. The README’s status section is stale: it still says the backend is mocked and that authentication and payments are planned. The source implements both.

### Languages and frameworks

| Layer | Technology |
|---|---|
| Language | TypeScript, SQL, small amounts of CSS and JavaScript |
| UI | React 19, React Router 7, Tailwind CSS 3 |
| Build | Vite (`rolldown-vite` 7.2.5), TypeScript ~5.9 (`strict: true`) |
| Client data | `@supabase/supabase-js` 2.108, TanStack Query 5 |
| Forms | react-hook-form 7, Zod 4 |
| Payments UI | `@stripe/react-stripe-js` 6, `@stripe/stripe-js` 9 |
| Server | Supabase: Postgres 17, Auth, Storage, Realtime, Edge Functions on Deno 2 |
| ORM | None. The app uses the Supabase client, PostgREST, and SQL functions |

### Database

Postgres, managed as Supabase. Schema is defined by **150 SQL migrations** under `supabase/migrations`. There is no Prisma, Drizzle, or other ORM.

**19 application tables** created and still present as the intended schema:

`profiles`, `trips`, `parcels`, `carry_requests`, `goods_categories`, `trip_accepted_categories`, `parcel_categories`, `carry_request_events`, `carry_request_handover_confirmations`, `notifications`, `carry_request_notification_templates`, `platform_settings`, `favourites`, `countries`, `cities`, `email_verification_tokens`, `email_queue`, `listing_match_events`, `listing_match_notification_templates`.

`email_login_otps` was dropped. An `avatars` storage bucket exists. Row Level Security is enabled on the core tables and was tightened in later migrations.

Migration line count overstates unique logic. Large functions such as `perform_carry_request_action` are replaced many times. The delivered system is the latest definition of each function, not the sum of historical copies.

### Hosting and deployment

| Piece | Evidence |
|---|---|
| Web hosting | Root `vercel.json` builds `apps/web` and rewrites to `index.html` (SPA). A `.vercel` directory is present. This shows a Vercel project configuration. It does not prove a public production deployment or traffic. |
| Backend hosting | Supabase project id `carry4me` in `supabase/config.toml`. Local ports are configured. Hosted deployment is not proven from this tree. |
| CI | No `.github/workflows`. README says GitHub Actions is planned. |
| Containers | No Dockerfile or docker-compose. |
| Mobile binaries | None. |

### Third-party libraries and external services

**Application libraries (web):** React, React Router, TanStack Query, Zod, react-hook-form, date-fns, Framer Motion, Lucide, libphonenumber-js, Stripe.js, Tailwind, vite-plugin-pwa.

**External services wired in code or config:**

1. **Supabase** — Auth, Postgres, Storage, Realtime, Edge Functions.
2. **Stripe** — PaymentIntents, Connect accounts, transfers, refunds, disputes, payout webhooks. Stripe.js `14.21.0` in Edge Functions.
3. **Resend** — transactional email over HTTPS (`supabase/functions/_shared/notificationEmail.ts`).
4. **Twilio** — referenced for SMS OTP in Supabase auth config (secret via environment substitution, value not read).
5. **Vercel** — static hosting config for the SPA.
6. **WebAuthn / passkeys** — through Supabase Auth experimental passkey support.

No Sentry, PostHog, Datadog, or product analytics SDK was found in application source.

### Payments

Stripe is the only payment provider. Checkout uses a PaymentIntent confirmed in the browser with Stripe Elements. Capture is immediate. The “hold” is operational: the charge lands on the platform balance, and the traveller transfer is created only after delivery-code verification. There is no manual authorization-and-capture flow.

### Authentication

Supabase Auth.

- Phone one-time codes for registration and login.
- Email one-time codes for login, after an eligibility check. New users are not created from email login (`shouldCreateUser: false` in the client repository).
- A separate email-verification token flow (`send-email-verification`, `verify-email`).
- Passkeys.
- No password login and no password-recovery screen. `config.toml` mentions a `/new-password` redirect, and the router has no such route.
- An OAuth helper exists and is not used by the sign-in UI.
- Profiles have `account_status` (`active`, `pending_review`, `suspended`) and `profile_type` (`ordinary`, `admin`). Admin is protected from self-service updates. There is no admin application.

### Repository and architecture

One Git repository. One runnable application: `apps/web`. Root `src/` and `scripts/` are empty. There is no `packages/` workspace and no second backend service.

```
Browser (React SPA + PWA shell)
    │
    ├─ supabase-js
    │    ├─ PostgREST tables (listings, favourites, notifications, …)
    │    ├─ RPC (carry-request actions, profile, dashboard, expiry, listing status)
    │    ├─ Auth (phone OTP, email OTP, passkeys)
    │    ├─ Storage (avatars)
    │    └─ Realtime (notifications, carry requests)
    │
    └─ Edge Functions (JWT on most routes)
         ├─ Stripe PaymentIntents, Connect, refunds, transfers
         ├─ Stripe webhooks (signature verification, no user JWT)
         └─ Resend email queue
              │
              └─ Postgres functions (security definer) own the status machine,
                 capacity, matching events, and OTP hash checks
```

Business rules for money and status are concentrated in SQL functions, especially `perform_carry_request_action`, with Stripe side effects in Edge Functions. The UI is organized by feature (`domain` / `application` / `data` / `ui`) for trips, parcels, carry requests, goods, dashboard, and favourites.

### Mobile

There is no React Native, Flutter, Expo, or Capacitor app. The web UI has mobile layouts: bottom navigation, mobile listing cards, a mobile carry-request page, sticky filters, and a create button. A PWA manifest and service worker cache the app shell. That is an installable website, not an offline marketplace and not a native app.

### Counts available for inspection

| Unit | Count |
|---|---|
| Git repositories | 1 |
| Applications | 1 web app (`apps/web`) |
| Backend services in-repo | Supabase Edge Functions plus Postgres. No separate API server |
| Edge Functions | 16 |
| SQL migrations | 150 |
| Native mobile apps | 0 |

---

## 2. Feature inventory

Features below were found in source. Items from the audit brief that do not exist are listed as not found so they are not mistaken for delivered work.

### User management

- Phone registration and login, profile completion, email OTP login, passkeys.
- Email verification required before marketplace actions.
- Profiles: name, phone, location, avatar, phone change, logout.
- Account deletion blocked while carry requests are still active.
- Account status gates and an admin profile flag.
- Stripe Connect onboarding as traveller payout verification.
- No password recovery, no document identity product (no Veriff, Jumio, or similar), no admin user console.
- OAuth helper only.

### Marketplace

- Trip create, edit, delete, activate or deactivate, archive past trips.
- Capacity in kilograms or bags, with reserve, restore, and consume.
- Parcel create, edit, delete, goods manifest, categories, price per kilogram.
- Browse trips and parcels with origin, date, price, weight, category, payment-preference, and sort filters, plus pagination.
- Rule-based matching (country, category, weight, payment preference), dashboard suggestions (capped), and match-notification events. Not machine learning.
- Carry requests: create, accept, reject, cancel, pay, dual handover, in transit, mark delivered, release payout, expire unpaid requests.
- Pricing: traveller amount is price per kilogram times weight (bag trips use weight 1). Platform fee is 20% of that amount plus a flat 3 in major currency units. Sender pays the sum. Currency follows origin country (EUR, GBP, USD, ZAR, otherwise USD).
- Payment preference means **when** the code is used (`handover`, `delivery`, or `flexible`). It is a matching and copy rule. It is not a cash rail.
- Favourites.
- No peer reviews or ratings. “Review” in the UI is the last step of the listing forms.

### Payments

- Stripe PaymentIntent creation, client confirmation, status sync, and webhook finalisation.
- Platform balance hold until delivery-code verification, then Connect transfer.
- Commission kept on the platform charge. Traveller transfer uses the stored payout amount.
- Cancel while waiting for handover can refund: traveller cancel refunds the charge; sender cancel refunds the charge minus the platform fee. Status is stored on the carry request.
- Dispute webhooks store dispute fields and send notifications and an admin email. There is no in-app dispute case, no evidence upload, and no code that blocks payout while a dispute is open.
- No ledger table and no transaction-history screen.
- Webhook signatures are verified. Traveller transfers use idempotency keys. PaymentIntent creation does not.

### Delivery

- Status timeline on the requests screen, with event history.
- Two-party handover confirmation.
- Six-digit delivery code, stored as SHA-256 of `request id + code`, five failed attempts, issued when handover completes and resendable by the sender.
- Expiry was built and later removed. Current SQL sets expiry to 31 December 2099 and does not enforce a real lifetime.
- Completion is traveller “mark delivered”, then code verification, then payout release. Release also requires the trip departure date and a stored Stripe transfer id.
- History is the request list and its events, not a separate archive product.

### Communication

- In-app notification inbox, mark read, and Realtime inserts for notifications and carry requests.
- Email queue, Resend delivery, and templates for verification, request accepted, handover, parcel received, payment received, delivery code, payment released, and traveller bank payout. Queue processing is invoked by the client after actions. No scheduled email worker was found.
- Admin email when a listing is posted, and admin email on payment and dispute webhook events.
- No in-app chat. Help and privacy copy mention messaging. The footer contact link is not a chat product.
- No web push or mobile push.

### Administration

- No `/admin` route, no user admin, no booking console, no analytics product, no financial reports, no security-monitoring UI.
- What exists is email alerting plus Stripe Dashboard as the implied place to handle disputes and refunds outside the coded cancel path.

### Other implemented product surface

- Marketing pages: home, about, how it works, safety, help, pricing.
- Legal pages: terms, privacy, prohibited items, refunds policy (policy text, not a refund tool).
- User dashboard with counts, activity, and suggested matches.
- Country and city data, origin-country rules for ordinary users, goods categories.
- English only. No i18n library.
- PWA install manifest and shell cache.
- A temporary “delete Stripe account” panel on the home page. The feature flag is `false`, but the panel still renders when the query parameter `deleteStripe=1` is present.

---

## 3. Feature completion and evidence

**Status rules used here**

- **Fully implemented** — UI (where a user must see it), server logic, and database are connected in source. This is not a claim that a production transaction was observed.
- **Partially implemented** — a real slice exists and a necessary part is missing or deliberately weakened.
- **Prototype or mock** — helper or temporary tool, not a finished product path.
- **Not found** — no implementation that delivers the capability.
- **Tested** — an automated test exercises the behaviour. None were found. `npm` scripts offer typecheck and lint only. Those were not treated as feature tests.

| Feature | Status | Frontend | Backend | Database | Tested | Evidence |
|---|---|---|---|---|---|---|
| Phone registration and login | Fully implemented | Yes | Yes | Yes | No | `PhoneEntryScreen`, `SupabaseAuthRepository.sendPhoneOTP` / `verifyPhoneOTP`, `SignUpUseCase`, route `/complete-profile` |
| Email OTP login | Fully implemented | Yes | Yes | Yes | No | `sendEmailOTP`, `verifyEmailOTP`, `check-email-login-eligibility` |
| Passkeys | Fully implemented | Yes | Yes | Auth | No | `passkeyAuth.ts`, sign-in tab, profile enroll/remove |
| Email verification | Fully implemented | Yes | Yes | Yes | No | `send-email-verification`, `verify-email`, `email_verification_tokens`, `VerifyEmailPage`, `getMarketplaceAccess` |
| Password login | Not found | — | — | — | — | No `signInWithPassword` usage |
| Password recovery | Not found | — | — | — | — | Config mentions `/new-password`; router has no route |
| Profiles, avatar, phone change | Fully implemented | Yes | Yes | Yes | No | `Profile.tsx`, `UpdateProfileUseCase`, `UploadAvatarUseCase`, `ChangeVerifiedPhoneNumberUseCase`, avatars bucket |
| Account deletion | Fully implemented | Yes | Yes | Yes | No | `DeleteAccountUseCase`, `delete-account` |
| Account status gates | Fully implemented | Yes | Yes | Yes | No | `accountStatus.ts`, `RouteGuards.tsx`, RLS helpers in `20260517110500_harden_rls_policies.sql` |
| Admin role | Partially implemented | Limited | DB flag | Yes | No | `profile_type` ordinary/admin, `protect_profile_type`. Used to bypass origin-country limits. No admin UI |
| Social OAuth | Prototype or mock | Helper only | Config | — | No | `authOAuthService.signInWithProvider`. Not wired into sign-in. Apple disabled in config |
| Document identity verification | Not found | — | — | — | — | Phone, email, and Stripe Connect only |
| Stripe Connect payout verification | Fully implemented | Yes | Yes | Yes | No | `stripe-connect-onboarding`, `stripe-connect-status`, profile Stripe columns, `TravelerPayoutStatusRow` |
| Trip create, edit, delete | Fully implemented | Yes | Yes | Yes | No | `CreateTripUseCase`, `EditTripUsecase`, `DeleteTripUseCase`, `PostTripPage` |
| Trip capacity and availability | Fully implemented | Yes | SQL | Yes | No | `trip_has_available_capacity`, reserve/restore/consume, `set_trip_listing_active`, `archive_past_trips`, bag unit migration `20261006180000_trip_capacity_unit_bags.sql` |
| Parcel create, edit, delete | Fully implemented | Yes | Yes | Yes | No | `CreateParcelUseCase`, `PostParcelPage`, `SupabaseParcelRepository` |
| Search and filtering | Fully implemented | Yes | Query | Yes | No | `TravelersPage`, `ParcelsPage`, `FilterOptionsRow.tsx`, `filters.ts` |
| Matching | Fully implemented | Yes | SQL | Yes | No | `suggestedMatches.ts`, `listing_categories_match`, `listing_weight_fits`, `listing_payment_preferences_match`, `listing_match_events` |
| Carry-request lifecycle | Fully implemented | Yes | RPC | Yes | No | `perform_carry_request_action`, `PerformCarryRequestActionUseCase`, `ActionsMapper.tsx`, `carry_request_events` |
| Pricing and commission | Fully implemented | Yes | Yes | Yes | No | `calculatePaymentAmountsFromParcel` in `amounts.ts` (`PLATFORM_FEE_RATE = 0.2`, `PLATFORM_FEE_FLAT = 3`); mirrored in client pricing |
| Booking cancellation | Fully implemented | Yes | Yes | Yes | No | `cancel-carry-request`, action `CANCEL`, capacity restore |
| Payment preference (timing) | Fully implemented | Yes | Yes | Yes | No | `paymentPreference.ts`, `20261008220000_listing_payment_preference_match.sql` |
| Cash or offline payment rail | Not found | — | — | — | — | All checkout paths use Stripe |
| Favourites | Fully implemented | Yes | Yes | Yes | No | `favourites` table, `SupabaseFavouriteRepository`, `/favourites` |
| Reviews and ratings | Not found | — | — | — | — | No rating tables |
| Stripe checkout | Fully implemented | Yes | Yes | Yes | No | `PayCarryRequestPage`, `create-payment-intent`, `sync-carry-request-payment` |
| Card authorization with later capture | Not found | — | — | — | — | No `capture_method: manual` |
| Hold on platform until delivery code | Fully implemented | Yes | Yes | Yes | No | Webhook does not transfer on success; `travelerTransfer.ts` transfers after OTP |
| Payout release conditions | Fully implemented | Yes | Yes | Yes | No | `verify-delivery-otp`, `RELEASE_PAYMENT` in `20261007203000_restore_payout_travel_date_gate.sql`, transfer id required by `20260722180000_require_stripe_transfer_before_paid_out.sql` |
| Traveller Connect payouts | Fully implemented | Yes | Yes | Yes | No | `releaseTravelerPayoutAfterDeliveryVerification`, `payout.paid` handler |
| Commission deduction | Fully implemented | Yes | Yes | Yes | No | Fee stored on `carry_requests`; transfer uses traveller payout amount |
| Refunds | Partially implemented | Cancel path | Yes | Yes | No | `cancel-carry-request`, columns from `20260608220000_cancel_refund_tracking.sql`. No refund after handover. No admin refund screen |
| Disputes | Partially implemented | Notifications | Webhook | Yes | No | `20260725200000_carry_request_dispute_tracking.sql`, `stripe-webhook`. No resolution UI. No payout freeze |
| Payment transaction history | Not found | — | — | Columns only | — | No ledger and no history page |
| Webhook signature checks | Fully implemented | — | Yes | — | No | `constructVerifiedStripeEvent` in `webhookVerification.ts` |
| Duplicate-payment controls | Partially implemented | — | Partial | Unique PI id | No | Pending PaymentIntent reuse; no Stripe idempotency key on create. Transfer idempotency is implemented |
| Delivery status tracking | Fully implemented | Yes | RPC | Yes | No | Status enum in `CreateCarryRequest.ts`, `CarryRequestsPage`, `progressStepIcon` |
| Handover confirmation | Fully implemented | Yes | RPC | Yes | No | `carry_request_handover_confirmations`, action `CONFIRM_HANDOVER` |
| Delivery code generation | Fully implemented | Resend | Edge + SQL | Yes | No | `issue_delivery_otp` granted to `service_role` (`20260608130000_delivery_otp.sql`), `generate-delivery-otp` |
| Delivery code expiry | Partially implemented | — | Disabled | Column remains | No | `20260609130000_delivery_otp_no_expiry.sql`; latest issuer still sets year 2099 |
| Delivery code attempt limit | Fully implemented | Yes | SQL | Yes | No | `verify_delivery_otp`, max 5 attempts |
| Delivery completion and payout | Fully implemented | Yes | Yes | Yes | No | `MARK_DELIVERED`, `verify-delivery-otp`, `RELEASE_PAYMENT` |
| Delivery history | Partially implemented | Event list | Events table | Yes | No | `carry_request_events` on the request screen. No separate history product |
| In-app messaging | Not found | — | — | — | — | No messages table |
| Email notifications | Fully implemented | Triggers queue | Yes | Yes | No | `email_queue`, `process-email-queue`, templates under `supabase/functions/_shared/emails/templates/` |
| Push notifications | Not found | — | — | — | — | Service worker caches the shell only |
| Realtime updates | Partially implemented | Yes | Supabase | — | No | `useNotificationRealtimeSync`, `useCarryRequestRealtimeSync` |
| In-app notifications | Fully implemented | Yes | Triggers | Yes | No | `notifications`, `NotificationPopOver` |
| Admin dashboard | Not found | — | — | — | — | No `/admin` route |
| Admin user management | Not found | — | — | Flag only | — | |
| Transaction monitoring | Partially implemented | — | Webhook email | Dispute/payment columns | No | `adminPaymentAlertEmail.ts` |
| Admin booking management | Not found | — | — | — | — | Users manage `/requests` only |
| Dispute resolution console | Not found | — | — | — | — | Stripe Dashboard is outside this app |
| Platform analytics | Not found | — | — | — | — | Dashboard stats are per user (`get_dashboard_overview`) |
| Financial reporting | Not found | — | — | — | — | |
| Security monitoring | Not found | — | — | — | — | |
| Admin alert email | Fully implemented | — | Yes | — | No | `notify-admin-listing-posted`, webhook admin alerts |
| Marketing and legal pages | Fully implemented | Yes | — | — | No | Routes in `router.tsx`: home, about, how-it-works, safety, help, pricing, terms, privacy, prohibited items, refunds |
| User dashboard | Fully implemented | Yes | RPC | Yes | No | `DashboardPage`, `get_dashboard_overview` |
| Responsive mobile web | Fully implemented | Yes | — | — | No | `CarryRequestPageMobile`, `MobileListingCard`, `StickyMobileFilters`, `FAB.tsx` |
| PWA | Partially implemented | Yes | — | — | No | `manifest.webmanifest`, `vite-plugin-pwa`. Not an offline product |
| Internationalisation | Not found | — | — | — | — | English strings only |
| Native mobile app | Not found | — | — | — | — | |
| Automated test suite | Not found | — | — | — | No | No `*.test` or `*.spec` files, no Vitest, Jest, Playwright, or Deno test config |

### Carry-request state machine (verified in SQL and UI)

Statuses: `PENDING_ACCEPTANCE`, `PENDING_PAYMENT`, `PENDING_HANDOVER`, `IN_TRANSIT`, `PENDING_PAYOUT`, `PAID_OUT`, plus `REJECTED`, `CANCELLED`, `EXPIRED`.

| Action | From | To | Rule found in code |
|---|---|---|---|
| Create | — | `PENDING_ACCEPTANCE` | Insert path |
| `ACCEPT` | `PENDING_ACCEPTANCE` | `PENDING_PAYMENT` | Sets payment expiry (240 minutes in platform settings) and reserves capacity |
| `REJECT` | `PENDING_ACCEPTANCE` | `REJECTED` | |
| `CANCEL` | Acceptance, payment, or handover | `CANCELLED` | Restores capacity. Paid handover cancel refunds in the Edge Function first |
| `PAY` | `PENDING_PAYMENT` | `PENDING_HANDOVER` | Sender, and payment must already be `SUCCEEDED` when a PaymentIntent exists |
| `CONFIRM_HANDOVER` | `PENDING_HANDOVER` | `IN_TRANSIT` after both parties | Issues delivery code when both have confirmed |
| `MARK_DELIVERED` | `IN_TRANSIT` | `PENDING_PAYOUT` | Traveller |
| `RELEASE_PAYMENT` | `PENDING_PAYOUT` | `PAID_OUT` | Traveller, code verified, payment succeeded, transfer id present, travel-date gate |
| Expiry | `PENDING_PAYMENT` overdue | `EXPIRED` | `expire_carry_request` / scheduled `expire_overdue_carry_requests` |

Payment statuses observed in code: `PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED_FULL`, `REFUNDED_PARTIAL`.

### Inventory counts

Counted from the table above:

| Classification | Rows |
|---|---|
| Fully implemented | 35 |
| Partially implemented | 9 |
| Prototype or mock | 1 |
| Not found | 19 |

The fully implemented count is 35 capabilities, not 35 screens. Several rows (marketplace browse, the request lifecycle, Connect payouts) each contain substantial workflow inside one row.

---

## 4. Codebase size and complexity

Measured on 9 October 2026, excluding `node_modules`, `dist`, `.git`, and `.vercel`. Line counts include comments and blank lines. Non-blank counts are also shown.

| Area | Files | Lines | Non-blank lines |
|---|---|---|---|
| `apps/web/src` | 412 | 40,169 | 36,049 |
| of which `.tsx` | 187 | 29,321 | 26,775 |
| of which `.ts` | 223 | 10,744 | 9,185 |
| Edge Functions (`supabase/functions`) | 50 | 7,707 | 6,718 |
| SQL migrations | 150 | 15,405 | 13,142 |
| CSS | 2 | 104 | — |

Application TypeScript and TSX together are about **48,000 lines** (web source plus Edge Functions). SQL migrations add about **15,400 lines**, with substantial duplication from replaced functions. A fair reading of unique database logic is well below that line count.

| Measure | Result |
|---|---|
| UI route entries | 25, including home and the not-found route (`apps/web/src/app/router.tsx`) |
| `.tsx` files | 187, of which most are feature or shared components rather than routes |
| HTTP Edge endpoints | 16 |
| Postgres tables | 19, plus storage |
| Scheduled jobs | 2 `pg_cron` jobs if the extension is enabled: hourly `archive_past_trips`, and `expire_overdue_carry_requests`. Migrations notice and skip scheduling when `pg_cron` is absent |
| Email processing | Client-invoked `process-email-queue`, not a separate worker |
| External integrations | 6 (Supabase, Stripe, Resend, Twilio SMS config, Vercel, WebAuthn via Supabase) |
| Automated tests | 0 |
| Test coverage | Not measurable. No coverage tool is configured |
| TODO / FIXME | 1 TODO, in `generate-delivery-otp` (dev OTP echo). No FIXME or HACK |

### Distinct workflows

1. Register with phone and complete a profile.
2. Sign in with phone, email code, or passkey, and verify email.
3. Post, edit, pause, and archive a trip, including capacity.
4. Post, edit, and archive a parcel.
5. Browse, filter, favourite, and open a carry request.
6. Accept or reject, then pay within the payment window or expire.
7. Cancel, including a pre-handover refund.
8. Dual handover, delivery code, mark delivered, verify code, transfer, mark paid out.
9. Stripe Connect onboarding and bank-payout notification.
10. Match alerts and in-app plus email notification.
11. Dashboard and listing management.
12. Account restriction, suspension, and deletion.

### Complexity that would cost real engineering time

Line count is not the value. The expensive parts are:

- The carry-request state machine, with capacity, expiry, handover, and payout gates kept in one SQL function and reworked across many migrations.
- Stripe Connect marketplace money flow: fee math, platform hold, transfer after proof of delivery, partial versus full refund, dispute ingestion.
- Listing match rules shared by SQL events and the dashboard, including payment preference.
- Auth that is not a stock email-and-password form: phone OTP, email OTP eligibility, passkeys, email verification, and account status.
- A large responsive UI: multi-step listing forms, marketplace filters, a request workspace with role-specific actions, and a Stripe checkout page.

This is more than a CRUD demo. It is less than a multi-service commerce platform. There is one client, one database, and no chat, search engine, or admin back office.

---

## 5. Engineering quality

### What is in good shape

- Feature folders separate domain, use cases, repositories, and UI. Edge code shares Stripe, email, and OTP modules.
- TypeScript strict mode is on.
- Forms use Zod.
- Money movement is intended to go through security-definer functions and Edge Functions, not ad hoc client updates.
- Delivery codes are hashed. `issue_delivery_otp` is granted to `service_role` only in the migration that created it. Later replacements do not grant it to `authenticated`. `verify_delivery_otp` is granted to `authenticated` and checks the traveller.
- Webhooks verify Stripe signatures before handling events.
- Traveller transfers use an idempotency key, a unique `stripe_transfer_id`, and a conditional update so a second writer does not overwrite an existing transfer.
- Payout is not created when the card payment succeeds. It waits for delivery verification, and `PAID_OUT` requires a stored transfer id.
- RLS exists on listings, requests, notifications, favourites, and related tables. `profile_type` cannot be self-promoted to admin.
- Unique active pair of trip and parcel, and unique Stripe ids, reduce duplicate bookings and duplicate payment rows.
- User-facing errors are normalized in `normalizeSupabaseError.tsx`.

### Technical debt and weaknesses

- Root README and `apps/web/README.md` do not describe how to run the system. The root README contradicts the code.
- Folder names are inconsistent (`carry request`, `my favourites`, mixed `UI` / `ui`, typos such as `CreateCarryReaquest.ts`).
- Fee percentages are hard-coded in TypeScript while the payment window lives in `platform_settings`. Client and Edge currency maps can drift.
- About 150 migrations show iterative repair (revert, fix, reschedule). That is normal for a product in motion and expensive to reason about.
- No tests, no CI, no error monitoring.
- Email depends on the browser calling `process-email-queue` after an action (`processEmailQueue.ts` labels this “MVP”).
- CORS allows any origin (`supabase/functions/_shared/cors.ts`).
- `carry_requests` update policy allows either participant to update the row if they are not suspended (`carry_requests_update_participant_not_suspended` in `20260517110500_harden_rls_policies.sql`). No later migration replaces that policy or revokes column updates. Status, payment, transfer, and OTP columns are therefore not locked to the SQL functions at the policy layer.
- `delete-stripe-account` is configured with `verify_jwt = false` and the function body does not check the caller. The web client sends the anon key, not a user session (`SupabaseStripeConnectRepository.deleteAccount`). The home page panel is behind `TEMP_DELETE_STRIPE_ENABLED = false` but still mounts when `?deleteStripe=1` is set (`HomePage.tsx`).
- Delivery codes do not expire. Plaintext codes are stored in `notifications.metadata` for the email worker. The sender can read their own notification rows. The in-app body hides the digits. Attempt limiting remains.
- `generate-delivery-otp` can return `dev_otp` when a dev flag is set or `APP_URL` looks like localhost or a private LAN address. That is safe only if production configuration does not match those conditions.
- `check-email-login-eligibility` uses the service role and is not listed with `verify_jwt = false`, but the function itself does not require a signed-in user. Its success body is `{ ok: true }` and does not return profile fields. It can set `email_confirm` on the auth user when the profile email is present and the auth email is empty. It also distinguishes “not found” from other failures, which confirms whether an email belongs to a completed account.
- Refunds and PaymentIntent creation have no Stripe idempotency keys. A double-submit race is a **potential** duplicate, not a demonstrated double charge.
- Stripe and the database are not one transaction. The cancel path can refund in Stripe and then fail to update the row. Transfer persistence has an explicit recovery path; refund persistence is weaker.
- If `trip_snapshot.departure_date` is missing, the travel-date gate can fail open. That behaviour is visible in the SQL comments and null handling.
- An open Stripe dispute does not block transfer or `RELEASE_PAYMENT`.
- `expire_overdue_carry_requests` is executable by signed-in users, not only by the scheduler.

### Payment and OTP judgment

| Control | Judgment |
|---|---|
| Webhook verification | Confirmed in code |
| Payout only after delivery code | Confirmed in code |
| Transfer idempotency | Confirmed in code |
| PaymentIntent idempotency | Not implemented. Concurrent creates are a potential risk |
| Refund idempotency | Not implemented. A race before `stripe_refund_id` is stored is a potential risk |
| Direct update of money columns | Confirmed policy gap. Live column grants were not queried |
| Unauthenticated Connect account deletion | Confirmed in function source and `config.toml`. Whether the hosted project matches this config was not checked |
| OTP hashing and attempt cap | Confirmed |
| OTP expiry | Confirmed absent in current SQL |
| OTP plaintext in notification metadata | Confirmed. Readable by the notification owner under `notifications_select_own` |
| Dispute freeze | Not implemented |

These are source findings. They are not a penetration test, and this report does not include steps to exploit them.

### Quality ratings used later

See section 12. Short version: structure and payment design are above a typical first marketplace draft. Absence of tests and the authorization gaps keep it out of a production-quality band.

---

## 6. User experience and product design

### Screens

25 routes:

| Area | Routes |
|---|---|
| Public marketing and policy | `/`, `/about`, `/how-it-works`, `/safety`, `/help`, `/pricing`, `/terms`, `/privacy`, `/prohibited-items`, `/refunds` |
| Auth | `/signin`, `/verify-email`, `/complete-profile` |
| Marketplace | `/travelers`, `/parcels` |
| Signed-in product | `/dashboard`, `/requests`, `/requests/pay/:carryRequestId`, `/profile`, `/favourites`, `/my/trips`, `/my/parcels`, `/create-trip`, `/create-parcel` |
| Fallback | `*` not found |

The request workspace, listing forms, and marketplace pages are the complex screens. Policy pages are long-form content. Home is a multi-section landing page (hero, how it works, safety, benefits, FAQ).

### Sender path

Post a parcel, browse trips, send a request, pay with Stripe, confirm handover, receive a delivery code by email, give the code after receipt. Own parcels live under `/my/parcels`.

### Traveller path

Post a trip, browse parcels, accept or reject, complete Stripe Connect, confirm handover, mark delivered, enter the code, receive a Connect transfer and a later bank-payout email. Own trips live under `/my/trips`.

Either role can start a request (`initiatorRole`). Actions are filtered in `ActionsMapper.tsx`.

### Navigation, forms, and states

- Guests see Home, Trips, Parcels, and sign-in. Signed-in users see Dashboard, Trips, Parcels, Requests, a notification bell, and a profile menu.
- Listing forms are multi-step with a review step (`formStepper`, `ParcelFormReview`, `TripFormReview`) and Zod validation.
- Loading uses spinners and React Query flags. Errors use toasts and `ErrorText`. Empty lists use `EmptyState`.
- Tailwind breakpoints and dedicated mobile components cover the main marketplace and request flows. Desktop and mobile were not exercised in a browser for this audit.

### Accessibility and design system

`aria-label`, `role="alert"`, listbox, radiogroup, and progressbar usage appears across cards, filters, the FAB, and form errors. Coverage is uneven. This was not a WCAG audit, and the code does not show a full keyboard and screen-reader pass.

Shared UI includes `Button`, `CustomText`, `CustomModal`, `ComboBox`, `Toast`, Lucide icons, and Framer Motion. Visual language is consistent enough to call it a small design system, not a published component library.

### Effort to reproduce the interface

Reproducing this UX is a real design and front-end project: a marketing site, two marketplace browsers, two multi-step listing wizards, a role-aware request console, checkout, dashboard, profile, and mobile variants. It is not a template admin theme. It is also not a native app design system. A designer plus a front-end developer, working from a cleared scope, is the right staffing assumption. Hours are in section 7 and are not added again here.

---

## 7. Development effort estimation

Hours are the effort for a **professional team to rebuild the implemented software**, including the testing a paid team would do while building it. They do **not** include chat, ratings, push, an admin console, document KYC, native apps, or fixing the security gaps beyond what is required to recreate current behaviour.

Shared platform work (Supabase project, auth shell, design tokens, deployment) is counted once.

### Assumptions

| Scenario | Who | How they work |
|---|---|---|
| 1. Efficient experienced team | Two seniors who already know React, Postgres, Supabase, and Stripe, plus part-time design | Short discovery, reuse of a small component set, tests mainly around money and the state machine, thin documentation |
| 2. Typical professional team | Mixed senior and mid-level, separate design handoff, code review | Normal specification, integration testing, staging checkout, review cycles |
| 3. Conservative reconstruction | Same as typical, plus security review, broader automated tests, runbooks, and time for edge cases already encoded in migrations | Closer to a fixed-price rebuild with acceptance tests |

### Hours

| Work package | Efficient | Typical | Conservative |
|---|---:|---:|---:|
| Product analysis and architecture | 80 | 120 | 160 |
| UI/UX design | 120 | 180 | 240 |
| Frontend development | 450 | 640 | 800 |
| Backend development (Edge Functions, email, webhooks) | 160 | 240 | 300 |
| Database development (schema, RLS, jobs) | 200 | 300 | 380 |
| Marketplace and matching logic | 100 | 150 | 180 |
| Payment and payout integration | 200 | 300 | 380 |
| Authentication and security | 80 | 120 | 160 |
| Messaging and notifications | 70 | 100 | 140 |
| Admin tools (alert email only) | 20 | 30 | 40 |
| Testing and quality assurance | 80 | 160 | 320 |
| DevOps and deployment | 40 | 60 | 100 |
| **Total** | **1,600** | **2,400** | **3,200** |

Efficient at 1,600 hours is about ten person-months. That is aggressive and only credible for people who have shipped Stripe Connect and Supabase before. Typical at 2,400 hours is about fifteen person-months and is the figure used as the base replacement effort. Conservative at 3,200 hours adds the testing and documentation the current repository does not contain.

---

## 8. Professional replacement cost

Rates are **assumptions inside published 2026 ranges**, not quotes. Sources consulted on 9 October 2026:

- Eastern and Central Europe mid-to-senior professional rates are published around **€35–€70 per hour**, with senior agency rates in Poland often higher ([easy.bi cost survey](https://www.easy.bi/blog/custom-software-development-cost-2026/), [DevStaff public rate card](https://devstaff.ai/guides/eastern-europe-software-engineer-rates)).
- Western European mid-market agency bands are published around **€80–€130 per hour** for DACH mid-market firms in the same easy.bi survey.
- Netherlands agency bands published for 2026 commonly sit around **€90–€175 per hour**, with medior and senior custom-software rates often **€110–€175** ([coding.agency NL 2026](https://coding.agency/kennisbank/state-of-custom-software-nl-2026), [Naveck Netherlands cost guide](https://www.naveck.com/blog/web-development-companies-cost-netherlands/), [Abbacus 2026 contractor and agency ranges](https://www.abbacustechnologies.com/web-developer-hiring-cost-in-the-netherlands-in-2026/)). A broader Dutch agency benchmark cited by Pixel Shield (Simplicate, not software-only) averages about **€105**. Freelance software developers in the HeadFirst Talent Monitor, as cited in that article, average about **€105**.

**Blended rates used**

| Market | Assumed blended rate | Why this number |
|---|---:|---|
| Lower-cost professional team | €55/hour | Inside the published CEE professional band, above junior offshore, below Polish senior agency ceilings |
| Mid-market European team | €95/hour | Inside the published Western/Central European agency band |
| Netherlands professional team | €120/hour | Inside the published Dutch agency band, below a senior-only Amsterdam rate |

All amounts **exclude VAT**. Dutch agency invoices often add 21% BTW on top.

Testing and deployment costs are the testing and DevOps rows from section 7, priced at the same rate. They are not a second full project.

### Market scenarios

The three markets below use the **typical 2,400-hour** rebuild so the comparison is the rate, not a different product.

| | Lower-cost professional | Mid-market Europe | Netherlands team |
|---|---:|---:|---:|
| Hours | 2,400 | 2,400 | 2,400 |
| Rate (assumption) | €55 | €95 | €120 |
| Development (2,180 h) | €119,900 | €207,100 | €261,600 |
| Testing and deployment (220 h) | €12,100 | €20,900 | €26,400 |
| **Total replacement cost** | **€132,000** | **€228,000** | **€288,000** |

### Hour sensitivity at the same rates

| Hours scenario | €55 | €95 | €120 |
|---|---:|---:|---:|
| Efficient, 1,600 h | €88,000 | €152,000 | €192,000 |
| Typical, 2,400 h | €132,000 | €228,000 | €288,000 |
| Conservative, 3,200 h | €176,000 | €304,000 | €384,000 |

### What this number is

This is the estimated cost to **hire professionals to build this software again**. It is not:

- the price a buyer should pay for the company
- a revenue multiple
- the founder’s historical time or tool spend
- a warranty that the software is safe to operate

No user counts, GMV, or profit were available, so no business valuation is offered. A buyer would also discount for the security and test gaps in section 11, or pay to close them.

---

## 9. Product maturity

**Classification: minimum viable product (MVP).**

It is past a prototype. The sender and traveller loop is implemented across UI, Edge Functions, and Postgres: listings, matching, request states, card payment, handover, delivery code, and Connect payout. Marketing, legal, and account flows are present.

It is not a **production-ready MVP**. The repository has no automated tests or CI, email sending depends on the client, delivery codes do not expire, participant updates to money columns are not column-locked, and a Connect deletion function is unauthenticated in source. A temporary deletion panel can still be opened with a query parameter.

It is not a **commercially operational platform** or a **mature marketplace**. Nothing in the repository records live users, successful charges, payout volumes, or a monitored production environment. Vercel and Supabase configuration show intent to host, not proof of operation.

---

## 10. Intellectual property and reusability

No `LICENSE` file was found. `apps/web/package.json` is `"private": true` and has no SPDX license. The README identifies an individual author and an independent product initiative. **This report does not assert legal ownership.** Ownership depends on contracts, employment, and contributor history that are not in the tree.

### What is specifically valuable

- The carry-request lifecycle and its capacity, expiry, handover, and payout gates.
- Fee calculation and the platform-hold then Connect-transfer sequence, including cancel refunds that differ by role.
- Match rules that combine route, category, weight, and payment timing, plus the notification side effects.
- The responsive marketplace UI and multi-step listing flows tied to those rules.

### What is standard implementation

- Supabase email/phone OTP wrappers, profile CRUD, favourites, pagination, policy pages, and a Tailwind component set.
- Stripe PaymentIntents and Connect onboarding follow vendor documentation, with product-specific gates around them.

### Dependencies, lock-in, and portability

| Dependency | Effect of leaving |
|---|---|
| Supabase Auth, RLS, Realtime, Storage, Edge Functions | A move to another backend means rewriting auth, policies, and most server entry points |
| Stripe Connect | Payouts are Stripe-specific. Another provider means a new account model and transfer flow |
| Resend | Email transport is replaceable. Templates are local TypeScript |
| Vercel | Hosting is a static SPA and is the easiest piece to move |
| npm packages | Ordinary open-source dependencies (React, Zod, Tailwind, and others). No copied proprietary SDK beyond normal packages was identified. Third-party license texts were not fully audited |

The reusable asset is the domain behaviour and the integrated UI, not a portable framework. Vendor lock-in to Supabase and Stripe is high.

---

## 11. Missing work and completion costs

These hours are **additional** to section 7. They are the work required before wider commercial operation of the **current** product. They are not included in the replacement cost of what is already built.

### Required before a careful production launch

| Item | Why | Hours |
|---|---|---:|
| Authenticate `delete-stripe-account` and remove the home-page query-parameter panel | Destructive and unauthenticated in source | 16 |
| Stop participant clients writing status, payment, transfer, and OTP columns | Update RLS is row-wide | 24 |
| Idempotency keys for PaymentIntent create and refunds | Race can create extra provider objects | 24 |
| Block transfer and payout release while a dispute is open | Not implemented | 20 |
| Restore a real delivery-code lifetime and keep plaintext codes out of client-readable rows | Expiry disabled; metadata stores the code | 24 |
| Remove dev OTP echo | TODO already in source | 4 |
| Scheduled email worker | Queue runs only when the client calls it | 16 |
| CI (typecheck, lint, build) and error monitoring | None configured | 28 |
| Automated tests for the state machine, payments, OTP, and RLS | Zero tests today | 160 |
| Review the unauthenticated email-eligibility side effect | Can confirm an auth email and reveal account existence | 8 |
| Staging test of webhook, Connect, and refund paths | Not evidenced in repo | 24 |
| **Hardening subtotal** | | **348** |

### Needed to operate the marketplace, still not a new product

A minimal internal console for users, requests, refunds, and disputes: **about 200 hours**. Without it, operations depend on the Supabase and Stripe dashboards.

### Not counted as completion of this MVP

In-app chat, reviews, push notifications, password login, document KYC, native apps, internationalisation, financial reporting, and a full analytics product. Those are new scope. Together they would be several additional person-months and are excluded so they do not inflate either the completed value or the “finish this MVP” estimate.

**Remaining engineering to a supportable production launch of the current scope: about 550 hours** (348 hardening + about 200 for a minimal operations console). Range **500–650 hours** depending on how deep the test suite and admin screens go.

At the mid-market rate of €95, that remaining work is about **€48,000–€62,000**, separate from replacement cost.

---

## 12. Final valuation summary

1. **Verified fully implemented capabilities:** 35 (section 3 table).
2. **Partially implemented capabilities:** 9. Prototype: 1 (unused OAuth helper). Not found: 19, including chat, reviews, push, password recovery, admin console, transaction history, and tests.
3. **Technical complexity: 7/10.** A custom marketplace state machine, luggage capacity, rule-based matching, and a Stripe Connect hold-until-delivery payout are genuinely difficult. The system is still one SPA and one Postgres database, without chat, search infrastructure, or multi-party ledgering.
4. **Code quality: 6/10.** Feature layering, hashed delivery codes, webhook verification, and transfer idempotency are real engineering. The score is held down by zero tests, stale documentation, a row-wide update policy on money fields, a disabled-but-reachable Stripe deletion tool, and no production monitoring.
5. **Product maturity:** Minimum viable product. Core loop is implemented in connected code. Not production-ready, and not shown to be commercially operating.
6. **Professional hours already represented:** **1,600 / 2,400 / 3,200** (efficient / typical / conservative). The fair central estimate is **2,400 hours**.
7. **Replacement cost (EUR, ex VAT), software only:**
   - **Low:** €88,000 — efficient 1,600 hours at an assumed €55 lower-cost professional rate.
   - **Medium:** €228,000 — typical 2,400 hours at an assumed €95 mid-market European rate.
   - **High:** €384,000 — conservative 3,200 hours at an assumed €120 Netherlands agency rate.
   - Apples-to-apples at 2,400 hours: **€132,000 / €228,000 / €288,000** (lower-cost / mid-Europe / Netherlands).
8. **Remaining hours to production readiness of the current scope:** **about 550** (range 500–650), of which about 350 are security, tests, and operations hardening and about 200 are a minimal admin console.
9. **Most valuable completed components:** carry-request state machine with capacity and expiry; Stripe platform hold and Connect payout after delivery verification; role-specific refunds; matching and notifications; the responsive marketplace and request UI.
10. **Most significant technical risks:** unauthenticated Connect account deletion in source; participant updates not column-restricted on `carry_requests`; no automated tests or CI; delivery codes that do not expire and are stored in notification metadata; email delivery tied to the client; disputes do not freeze payouts; PaymentIntent and refund calls lack idempotency keys.
11. **Confidence: medium.** The feature inventory is grounded in files and function names. Hours and rates are professional judgment placed against published 2026 rate bands, not a vendor quote. Runtime behaviour, hosted configuration, test coverage, and any production data were not available. Migration history inflates SQL size. No business value beyond replacement cost is claimed.

---

*End of report.*
