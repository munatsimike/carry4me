import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  loadTravelerProfile,
  loadTravelerProfileByStripeAccountId,
} from "../_shared/stripe/profiles.ts";
import { DELETE_STRIPE_ACTION } from "./constants.ts";
import {
  parseBooleanRpc,
  parseObligationRpc,
  parseProfileResetRpc,
} from "./rpcParse.ts";
import type {
  AdminDb,
  ActorProfile,
  AuditRow,
} from "./types.ts";

export type { AdminDb, ActorProfile, AuditRow } from "./types.ts";

function asMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function createAdminDb(supabaseAdmin: SupabaseClient): AdminDb {
  return {
    async loadActorProfile(userId) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, profile_type")
        .eq("id", userId)
        .maybeSingle<ActorProfile>();
      if (error) {
        console.error("delete-stripe-account loadActorProfile failed", error.message);
        return "error";
      }
      return data;
    },

    async loadTargetByStripeAccountId(accountId) {
      try {
        return await loadTravelerProfileByStripeAccountId(supabaseAdmin, accountId);
      } catch (err) {
        console.error("delete-stripe-account loadTarget failed", err);
        return "error";
      }
    },

    async loadProfileByUserId(userId) {
      try {
        return await loadTravelerProfile(supabaseAdmin, userId);
      } catch (err) {
        console.error("delete-stripe-account loadProfileByUserId failed", err);
        return "error";
      }
    },

    async findCarryRequestObligations(travelerUserId) {
      const { data, error } = await supabaseAdmin.rpc(
        "find_carry_request_delete_obligations",
        { p_traveler_user_id: travelerUserId },
      );

      if (error) {
        console.error(
          "delete-stripe-account findCarryRequestObligations failed",
          error.message,
        );
        return "error";
      }

      const parsed = parseObligationRpc(data);
      if (parsed === "error") {
        console.error("delete-stripe-account findCarryRequestObligations malformed");
        return "error";
      }
      return parsed;
    },

    async insertStartedAudit(input) {
      const { data, error } = await supabaseAdmin
        .from("admin_audit_events")
        .insert({
          actor_user_id: input.actorUserId,
          action: DELETE_STRIPE_ACTION,
          status: "STARTED",
          target_user_id: input.targetUserId,
          target_stripe_account_id: input.stripeAccountId,
          metadata: input.metadata ?? {},
        })
        .select("id, status, created_at, metadata")
        .maybeSingle<AuditRow>();

      if (error) {
        if (error.code === "23505") return "conflict";
        console.error("delete-stripe-account insertStartedAudit failed", error.message);
        return "error";
      }

      if (!data) return "error";
      return {
        ...data,
        metadata: asMetadata(data.metadata),
      };
    },

    async insertFollowUpAudit(input) {
      const { error } = await supabaseAdmin.from("admin_audit_events").insert({
        actor_user_id: input.actorUserId,
        action: DELETE_STRIPE_ACTION,
        status: input.status,
        target_user_id: input.targetUserId,
        target_stripe_account_id: input.stripeAccountId,
        metadata: input.metadata ?? {},
      });

      if (error) {
        console.error("delete-stripe-account insertFollowUpAudit failed", error.message);
        return "error";
      }
      return true;
    },

    async findStartedAudit(stripeAccountId) {
      const { data, error } = await supabaseAdmin
        .from("admin_audit_events")
        .select("id, status, created_at, metadata")
        .eq("action", DELETE_STRIPE_ACTION)
        .eq("status", "STARTED")
        .eq("target_stripe_account_id", stripeAccountId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<AuditRow>();

      if (error) {
        console.error("delete-stripe-account findStartedAudit failed", error.message);
        return "error";
      }

      if (!data) return null;
      return { ...data, metadata: asMetadata(data.metadata) };
    },

    async lockStillOwned(auditId) {
      const { data, error } = await supabaseAdmin
        .from("admin_audit_events")
        .select("id")
        .eq("id", auditId)
        .eq("action", DELETE_STRIPE_ACTION)
        .eq("status", "STARTED")
        .maybeSingle();

      if (error) {
        console.error("delete-stripe-account lockStillOwned failed", error.message);
        return "error";
      }

      return Boolean(data?.id);
    },

    async casReleaseStartedLock(auditId, metadata) {
      const { data, error } = await supabaseAdmin.rpc("cas_finish_delete_audit", {
        p_audit_id: auditId,
        p_status: "FAILED",
        p_metadata: metadata,
      });

      if (error) {
        console.error(
          "delete-stripe-account casReleaseStartedLock failed",
          error.message,
        );
        return "error";
      }

      return parseBooleanRpc(data);
    },

    async casPatchStartedMetadata(auditId, metadata) {
      const { data, error } = await supabaseAdmin.rpc(
        "patch_started_delete_audit_metadata",
        {
          p_audit_id: auditId,
          p_patch: metadata,
        },
      );

      if (error) {
        console.error(
          "delete-stripe-account casPatchStartedMetadata failed",
          error.message,
        );
        return "error";
      }

      return parseBooleanRpc(data);
    },

    async casFinishAudit(auditId, status, metadata) {
      const { data, error } = await supabaseAdmin.rpc("cas_finish_delete_audit", {
        p_audit_id: auditId,
        p_status: status,
        p_metadata: metadata,
      });

      if (error) {
        console.error("delete-stripe-account casFinishAudit failed", error.message);
        return "error";
      }

      return parseBooleanRpc(data);
    },

    async resetTargetProfile(userId, stripeAccountId, auditId) {
      const { data, error } = await supabaseAdmin.rpc(
        "reset_connect_profile_for_delete",
        {
          p_user_id: userId,
          p_stripe_account_id: stripeAccountId,
          p_audit_id: auditId,
        },
      );

      if (error) {
        console.error("delete-stripe-account resetTargetProfile failed", error.message);
        return "error";
      }

      return parseProfileResetRpc(data);
    },
  };
}
