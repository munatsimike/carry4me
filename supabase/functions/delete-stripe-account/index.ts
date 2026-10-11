import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  getAuthenticatedUser,
  isResponse,
  jsonResponse,
} from "../_shared/stripe/auth.ts";
import { getStripe } from "../_shared/stripe/client.ts";
import { stripeErrorMessage } from "../_shared/stripe/errors.ts";
import { parseAdminUserIds } from "./authorize.ts";
import { createAdminDb } from "./db.ts";
import { handleDeleteStripeAccount } from "./handler.ts";
import { createStripeAdapter } from "./createStripeAdapter.ts";

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    const { user, supabaseAdmin } = await getAuthenticatedUser(req);
    return await handleDeleteStripeAccount(req, {
      authenticate: async () => ({ id: user.id }),
      db: createAdminDb(supabaseAdmin),
      stripe: createStripeAdapter(getStripe()),
      adminAllowlist: parseAdminUserIds(
        Deno.env.get("STRIPE_CONNECT_ADMIN_USER_IDS"),
      ),
    });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("delete-stripe-account error", stripeErrorMessage(err), err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
