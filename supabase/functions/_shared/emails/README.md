# Carry4Me transactional email templates (Resend)

HTML is built in TypeScript (Deno edge functions). React Email is not used.

## Structure

```
emails/
  company.ts              # Env-based branding (from site Footer)
  components/
    EmailLayout.ts        # 600px wrapper + auto footer
    EmailFooter.ts        # Logo, contact, social, copyright
  templates/
    RequestAccepted.ts
    PaymentReceived.ts    # PAYMENT_COMPLETED
    HandoverConfirmed.ts  # HANDOVER_CONFIRMED (partial)
    ParcelReceived.ts     # PARCEL_RECEIVED (both confirmed + phone)
    EmailVerification.ts
    GenericNotification.ts
  renderNotificationEmail.ts
```

## Usage

All notification emails:

```ts
import { renderNotificationEmail } from "./emails/renderNotificationEmail.ts";

const { html, text } = renderNotificationEmail({
  type: "REQUEST_ACCEPTED",
  title, body, link,
});
```

Layout wraps content and appends `EmailFooter` automatically.

## Environment variables

| Variable | Default |
|----------|---------|
| `APP_URL` / `EMAIL_WEBSITE_URL` | `https://carry4me.uk` |
| `EMAIL_LOGO_URL` | `{website}/logo.svg` |
| `EMAIL_COMPANY_NAME` | Carry4Me |
| `EMAIL_SUPPORT_EMAIL` | info@carry4me.uk |
| `EMAIL_PHONE` | +44 7471366706 |
| `EMAIL_ADDRESS` | London, United Kingdom (Head office) |
| `EMAIL_WHATSAPP_URL` | https://wa.me/447471366706 |
| `EMAIL_FACEBOOK_URL` | (optional) |
| `EMAIL_INSTAGRAM_URL` | (optional) |
| `EMAIL_TWITTER_URL` | (optional) |
| `EMAIL_COPYRIGHT` | Auto year + company name |

## Compatibility notes

- Table-based layout for Outlook
- Inline styles only (no external CSS)
- MSO conditionals on CTA buttons and 600px width
- Logo uses fixed `width` attribute + `max-width` for mobile
