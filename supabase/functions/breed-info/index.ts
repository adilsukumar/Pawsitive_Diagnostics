import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { breed } = await req.json();
    if (!breed || typeof breed !== "string" || breed.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Breed name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a veterinary expert. When given a dog breed name, provide comprehensive information in the following JSON format. Be accurate and helpful. If the breed is not recognized, set "recognized" to false and provide a helpful message.

Return ONLY valid JSON with this structure:
{
  "recognized": true,
  "breed_name": "Official Breed Name",
  "overview": "Brief 2-3 sentence overview",
  "diet": {
    "should_eat": ["list of recommended foods"],
    "should_not_eat": ["list of foods to avoid"],
    "feeding_tips": "Brief feeding guidance"
  },
  "behavior": {
    "temperament": "Brief temperament description",
    "traits": ["key personality traits"],
    "social": "How they interact with people and other animals"
  },
  "habits": {
    "exercise_needs": "Low/Moderate/High with description",
    "grooming": "Grooming needs description",
    "sleep": "Sleep patterns"
  },
  "health": {
    "common_issues": ["common health concerns"],
    "lifespan": "Expected lifespan range",
    "tips": "General health tips"
  },
  "fun_facts": ["2-3 interesting facts"]
}`
          },
          {
            role: "user",
            content: `Tell me everything about the dog breed: ${breed.trim()}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];

    let breedInfo;
    try {
      breedInfo = JSON.parse(jsonStr.trim());
    } catch {
      breedInfo = { recognized: true, overview: content, breed_name: breed };
    }

    return new Response(JSON.stringify(breedInfo), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("breed-info error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
