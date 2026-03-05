import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Use date as seed; accept optional seed from body for refresh
    let seed = new Date().toISOString().split("T")[0];
    try {
      const body = await req.json();
      if (body?.seed) seed = body.seed;
    } catch { /* no body, use date */ }
    const today = seed;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a veterinary expert and pet care advisor. Generate ONE unique, interesting, and helpful daily dog health tip, fun fact, or practical advice. Cover a WIDE variety of topics — nutrition, exercise, behavior, grooming, dental health, mental stimulation, socialization, training tips, seasonal care, breed traits, sleep habits, hydration, vaccinations, first aid, senior dog care, puppy care, etc. NEVER repeat topics. Do NOT always talk about the same thing (like noses). Use the seed "${today}" to ensure uniqueness. Return ONLY valid JSON: { "title": "short catchy title (max 6 words)", "fact": "the main fact or tip (2-3 sentences, max 60 words)", "emoji": "one relevant emoji" }`,
          },
          {
            role: "user",
            content: `Generate a completely random, unique daily dog insight for seed "${today}". Pick a surprising topic. Make it fresh, practical, and actionable.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { title: "Did You Know?", fact: content, emoji: "🐾" };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("daily-insight error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
