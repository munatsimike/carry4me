export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/** Browser preflight — must return 2xx with CORS headers (no auth). */
export function handleCorsPreflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") {
    return null;
  }
  return new Response(null, { status: 204, headers: corsHeaders });
}
