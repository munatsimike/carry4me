import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  getAuthenticatedUser,
  isResponse,
  jsonResponse,
} from "../_shared/stripe/auth.ts";

const ACTIVE_CARRY_REQUEST_STATUSES = [
  "PENDING_ACCEPTANCE",
  "PENDING_PAYMENT",
  "PENDING_HANDOVER",
  "IN_TRANSIT",
  "PENDING_PAYOUT",
] as const;

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const { user, supabaseAdmin } = await getAuthenticatedUser(req);

    const { data: activeRequests, error: activeError } = await supabaseAdmin
      .from("carry_requests")
      .select("id")
      .or(
        `sender_user_id.eq.${user.id},traveler_user_id.eq.${user.id}`,
      )
      .in("status", [...ACTIVE_CARRY_REQUEST_STATUSES])
      .limit(1);

    if (activeError) {
      console.error("delete-account active request check failed:", activeError);
      return jsonResponse({ error: "Could not verify account status" }, 500);
    }

    if (activeRequests && activeRequests.length > 0) {
      return jsonResponse(
        {
          error:
            "You have active carry requests. Complete or cancel them before deleting your account.",
        },
        400,
      );
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id,
    );

    if (deleteError) {
      console.error("delete-account failed:", deleteError);
      return jsonResponse({ error: "Could not delete account" }, 500);
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("delete-account error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
