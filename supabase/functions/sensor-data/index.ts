import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const {
      barkSpike,
      ammoniaPPM,
      methanePPM,
      co2PPM,
      scratchIntensity,
      diagnosis,
      skinStatus,
      timestamp,
    } = body;

    // Validate at least one sensor field is present
    if (
      barkSpike == null &&
      ammoniaPPM == null &&
      methanePPM == null &&
      co2PPM == null &&
      scratchIntensity == null
    ) {
      return new Response(
        JSON.stringify({ error: "At least one sensor field is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("sensor_readings")
      .insert({
        bark_spike: barkSpike ?? null,
        ammonia_ppm: ammoniaPPM ?? null,
        methane_ppm: methanePPM ?? null,
        co2_ppm: co2PPM ?? null,
        scratch_intensity: scratchIntensity ?? null,
        diagnosis: diagnosis ?? null,
        skin_status: skinStatus ?? null,
        device_timestamp: timestamp ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to store reading", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Request error:", e);
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
