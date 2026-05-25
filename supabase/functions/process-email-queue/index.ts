import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  assertCarryRequestParticipant,
  loadExactQueueRow,
  loadQueueRowByCarryRequestEvent,
  processQueueRow,
  USER_PROCESSABLE_STATUSES,
} from "../_shared/emailQueueProcessor.ts";

type RequestBody = {
  emailQueueId?: string;
  notificationId?: string;
  carryRequestId?: string;
  eventType?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    let body: RequestBody = {};
    try {
      if (req.headers.get("content-length") !== "0") {
        body = await req.json();
      }
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    if (!resendApiKey) {
      return jsonResponse({ error: "Email service is not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !authData.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const emailQueueId = body.emailQueueId?.trim();
    const notificationId = body.notificationId?.trim();
    const carryRequestId = body.carryRequestId?.trim();
    const eventType = body.eventType?.trim();

    let row = await loadExactQueueRow(supabaseAdmin, {
      emailQueueId,
      notificationId,
    });

    if (!row && carryRequestId && eventType) {
      const isParticipant = await assertCarryRequestParticipant(
        supabaseAdmin,
        carryRequestId,
        authData.user.id,
      );

      if (!isParticipant) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }

      row = await loadQueueRowByCarryRequestEvent(
        supabaseAdmin,
        carryRequestId,
        eventType,
      );
    }

    if (!emailQueueId && !notificationId && !(carryRequestId && eventType)) {
      return jsonResponse({
        error:
          "emailQueueId, notificationId, or carryRequestId+eventType is required",
      }, 400);
    }

    if (!row) {
      return jsonResponse({
        ok: true,
        processed: 0,
        results: [],
        hint: "No email_queue row found for the given target.",
      });
    }

    const result = await processQueueRow(supabaseAdmin, row, resendApiKey, {
      allowedStatuses: USER_PROCESSABLE_STATUSES,
    });

    return jsonResponse({
      ok: true,
      mode: "targeted",
      processed: result.processed === true ? 1 : 0,
      results: [result],
    });
  } catch (error) {
    console.error("process-email-queue error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
