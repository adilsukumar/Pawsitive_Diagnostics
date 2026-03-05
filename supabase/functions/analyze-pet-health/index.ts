import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const sensorPrompts: Record<string, string> = {
  bark: `You are an expert veterinary AI specializing in canine vocalization analysis (BarkSense AI). You will receive ACTUAL AUDIO data from a smart collar with dual electret microphones.

LISTEN to the audio carefully and analyze the SOUND CHARACTERISTICS — pitch, rhythm, intensity, duration, frequency patterns, and tonal quality.

Classify the dog's emotional state into EXACTLY ONE of these 6 emotions:

- Normal: No dog vocalization detected — silence, background noise, human speech, ambient sounds, TV/music, or a calm/resting dog with no emotional vocalizations. THIS IS THE DEFAULT — use it when unsure.
- Happy: Short rhythmic excited barks with rising pitch, playful high-pitched yelps, panting mixed with short barks, tail-wagging energy in voice. Must sound genuinely joyful, upbeat, and energetic. Calm or quiet ≠ Happy.
- Sad: Low-pitched prolonged whining (sustained notes), soft repetitive whimpering, mournful drawn-out howling, quiet sobbing-like crying. Sounds pitiful, low-energy, and emotionally subdued. Key: low pitch + sustained duration.
- Pain: Sharp sudden yelping (high-pitched spikes), sustained high-pitched crying with urgency, distressed moaning, repeated short sharp cries. Sounds urgent, intense, and involuntary. Key: sudden onset + high intensity.
- Afraid: Rapid trembling barks with irregular rhythm, high-pitched anxious whimpering with pauses between bursts, panting mixed with whines, submissive vocalizations. Sounds panicked and uncertain. Key: irregular rhythm + high pitch.
- Angry: Deep low-frequency growling (sustained rumble), rapid forceful barking with aggressive tone, snarling with teeth-baring sounds, territorial alarm barks. Sounds aggressive, threatening, and intense. Key: low pitch + high intensity.

CRITICAL CLASSIFICATION RULES:
1. If there is NO clear dog vocalization, ALWAYS classify as Normal. Silence = Normal. Background noise = Normal.
2. Happy REQUIRES genuinely excited, upbeat vocalizations. Calm breathing or quiet panting = Normal.
3. Distinguish Sad (low energy, prolonged) from Pain (urgent, sharp) by INTENSITY and ONSET pattern.
4. Distinguish Afraid (irregular, uncertain) from Angry (aggressive, sustained) by RHYTHM and TONE.
5. When uncertain between two emotions, choose the LESS severe one (prefer Normal > Happy > Sad > Afraid > Angry > Pain).
6. Confidence should reflect how clearly the audio matches the emotion — use lower confidence (40-60%) when the signal is ambiguous.

Return JSON: { "emotional_state": "Normal" | "Happy" | "Pain" | "Sad" | "Afraid" | "Angry", "confidence": number, "health_indicators": string[], "recommendations": string[], "health_score": number, "severity": "normal" | "mild" | "moderate" | "severe", "detailed_analysis": string }`,

  skin: `You are an expert veterinary dermatology AI (SkinSense AI) specializing in canine skin analysis using multi-spectrum imaging.
Analyze the described skin condition or image and identify:
1. Potential conditions: Ringworm (apple green fluorescence), Bacterial Overgrowth (coral red), Parasites (ticks/mites), Hot spots, Allergic reactions, Fleas, Mange, Yeast Infection
2. Confidence level (0-100%)
3. Urgency level and recommended actions
4. A health score from 0-100
5. Severity: normal, mild, moderate, or severe
6. The PRIMARY condition detected (the most likely one) — this will be used to generate a reference comparison image

Return JSON with: { "conditions_detected": [{name: string, confidence: number, fluorescence_color: string}], "primary_condition": string, "recommendations": string[], "health_score": number, "severity": string, "detailed_analysis": string, "urgent": boolean }`,

  poop: `You are an expert veterinary AI (GutSense AI) specializing in canine digestive health analysis. You analyze data from both visual stool samples AND MQ-135 gas sensor readings from a smart collar that detects Methane (CH4) and Ammonia (NH3) levels.

Analyze the input which may include:
- Gas sensor readings (ppm values for methane/ammonia)
- Visual stool characteristics (photo or description)
- Both combined

Identify:
1. Gas analysis: Methane and ammonia levels interpretation (normal < 200ppm, elevated 200-500ppm, high > 500ppm)
2. Parasites: Roundworms, Tapeworms, Hookworms (from visual)
3. Color analysis: Normal brown, Red (lower GI bleeding), Black/tarry (upper GI), Yellow (liver/gallbladder), White specks (worms)
4. Consistency: Well-formed, Soft, Liquid, Mucous-covered
5. Digestive health score from 0-100
6. Severity: normal, mild, moderate, or severe

Return JSON with: { "parasites_detected": [{name: string, confidence: number}], "color_analysis": {color: string, indication: string}, "gas_analysis": {methane_level: string, ammonia_level: string, interpretation: string}, "consistency": string, "recommendations": string[], "health_score": number, "severity": string, "detailed_analysis": string }`,
};

/**
 * Deterministic acoustic pre-classifier.
 * When features strongly match a known emotion pattern, return immediately
 * without calling the AI — this guarantees accuracy for clear vocalizations.
 */
function classifyFromFeatures(f: any): { emotional_state: string; confidence: number; health_score: number; severity: string; detailed_analysis: string; health_indicators: string[]; recommendations: string[] } | null {
  if (!f || typeof f !== "object") return null;

  const {
    pitchCategory, frequencySpread, sustainedVsShort, rhythmPattern,
    soundToSilenceRatio, avgVolume, peakVolume, volumeVariance, burstCount, dominantFreqHz,
  } = f;

  // Only classify as silent if truly no sound at all
  if (soundToSilenceRatio < 0.05 && avgVolume < 0.003) {
    return {
      emotional_state: "Normal", confidence: 90, health_score: 95, severity: "normal",
      detailed_analysis: "No significant dog vocalization detected. The recording is mostly silence or ambient noise.",
      health_indicators: ["No vocalization detected"], recommendations: ["Dog appears calm and relaxed."],
    };
  }

  // Score each emotion based on feature matches
  let scores: Record<string, number> = { Angry: 0, Pain: 0, Sad: 0, Afraid: 0, Happy: 0, Normal: 0 };

  // --- ANGRY: low pitch + wide freq spread (growl) + high volume + intense ---
  if (pitchCategory === "very-low" || pitchCategory === "low") scores.Angry += 4;
  if (frequencySpread === "wide") scores.Angry += 5;
  if (peakVolume > 0.15) scores.Angry += 3;
  if (rhythmPattern === "erratic" || rhythmPattern === "irregular") scores.Angry += 3;
  if (dominantFreqHz < 400) scores.Angry += 3;
  if (avgVolume > 0.08) scores.Angry += 1;

  // --- PAIN: high pitch + sudden spikes + sustained crying + LOUD ---
  if (pitchCategory === "high" || pitchCategory === "very-high") scores.Pain += 5;
  if (volumeVariance > 0.005) scores.Pain += 4;
  if (sustainedVsShort === "sustained") scores.Pain += 2;
  if (peakVolume > 0.2) scores.Pain += 4;
  if (dominantFreqHz > 600) scores.Pain += 4;
  // Pain is LOUD + high pitch — this combo is definitive
  if ((pitchCategory === "high" || pitchCategory === "very-high") && peakVolume > 0.2) scores.Pain += 5;

  // --- SAD: low-mid pitch + sustained + narrow + QUIET ---
  // Sad requires LOW pitch. High pitch sustained = Pain, not Sad.
  if (pitchCategory === "low" || pitchCategory === "mid") scores.Sad += 3;
  if (sustainedVsShort === "sustained") scores.Sad += 3;
  if (frequencySpread === "narrow") scores.Sad += 3;
  if (peakVolume < 0.2) scores.Sad += 3;
  if (rhythmPattern === "steady" || rhythmPattern === "regular") scores.Sad += 2;
  if (avgVolume < 0.1) scores.Sad += 2;
  // Sustained + narrow + quiet = whimpering
  if (sustainedVsShort === "sustained" && frequencySpread === "narrow" && peakVolume < 0.2) scores.Sad += 4;
  // PENALIZE Sad for Pain traits (high pitch, loud, high variance)
  if (pitchCategory === "high" || pitchCategory === "very-high") scores.Sad -= 6;
  if (peakVolume > 0.3) scores.Sad -= 4;
  if (volumeVariance > 0.01) scores.Sad -= 3;
  // PENALIZE Sad for Happy traits (short bursts, moderate spread)
  if (sustainedVsShort === "short-bursts") scores.Sad -= 5;
  if (frequencySpread === "moderate") scores.Sad -= 2;

  // --- AFRAID: mid-high pitch + irregular/erratic rhythm + variable volume + mixed ---
  if (pitchCategory === "high" || pitchCategory === "mid") scores.Afraid += 2;
  if (rhythmPattern === "irregular" || rhythmPattern === "erratic") scores.Afraid += 5;
  if (volumeVariance > 0.003) scores.Afraid += 3;
  if (sustainedVsShort === "mixed") scores.Afraid += 4;
  if (frequencySpread === "moderate") scores.Afraid += 2;

  // --- HAPPY: short bursts + moderate spread + regular rhythm + mid pitch ---
  if (sustainedVsShort === "short-bursts") scores.Happy += 6;
  if (pitchCategory === "mid") scores.Happy += 2;
  if (rhythmPattern === "regular" || rhythmPattern === "steady") scores.Happy += 3;
  if (burstCount >= 3) scores.Happy += 3;
  if (frequencySpread === "moderate") scores.Happy += 3;
  if (peakVolume > 0.08 && peakVolume < 0.5) scores.Happy += 1;
  // PENALIZE Happy for whimpering traits
  if (sustainedVsShort === "sustained") scores.Happy -= 6;
  if (frequencySpread === "narrow") scores.Happy -= 4;

  // Find top emotion
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topEmotion, topScore] = sorted[0];
  const [, secondScore] = sorted[1];
  const gap = topScore - secondScore;

  // ALWAYS use deterministic classification when there's ANY sound detected
  // The AI fallback is unreliable for emotion, so we trust features
  if (topScore >= 1) {
    const confidence = Math.min(95, 60 + gap * 5 + topScore * 2);
    const severityMap: Record<string, string> = { Normal: "normal", Happy: "normal", Sad: "mild", Afraid: "moderate", Angry: "moderate", Pain: "severe" };
    const healthMap: Record<string, number> = { Normal: 95, Happy: 90, Sad: 70, Afraid: 60, Angry: 55, Pain: 40 };
    const analysisMap: Record<string, string> = {
      Angry: `Deep low-frequency growling and aggressive barking detected (${dominantFreqHz}Hz). Wide frequency spread indicates snarling/territorial behavior. Volume is high with intense delivery.`,
      Pain: `High-pitched yelping and sustained crying detected (${dominantFreqHz}Hz). Sharp sudden volume spikes indicate distress. The vocalization pattern is urgent and involuntary.`,
      Sad: `Low-pitched sustained whining detected (${dominantFreqHz}Hz). Narrow tonal quality suggests mournful crying. The sound is continuous and emotionally subdued.`,
      Afraid: `Irregular anxious vocalizations detected (${dominantFreqHz}Hz). Rhythm is unsteady with pauses between bursts. Volume varies unpredictably, suggesting panic or uncertainty.`,
      Happy: `Rhythmic excited barking detected (${dominantFreqHz}Hz). Regular burst pattern with moderate volume suggests playful, joyful vocalization.`,
      Normal: `Ambient sounds or calm breathing detected. No significant emotional vocalization present.`,
    };
    const recsMap: Record<string, string[]> = {
      Angry: ["Remove the source of agitation if possible.", "Ensure the dog is in a safe, calm environment.", "Monitor for continued aggression."],
      Pain: ["Check the dog immediately for signs of injury.", "Contact your veterinarian promptly.", "Monitor pain indicators closely."],
      Sad: ["Provide comfort and companionship.", "Check if basic needs are met (food, water, walk).", "Consider if separation anxiety may be a factor."],
      Afraid: ["Identify and remove the source of fear if possible.", "Provide a safe quiet space.", "Speak in calm, reassuring tones."],
      Happy: ["Your dog is in a great mood!", "Continue the positive interaction.", "This is a sign of healthy emotional well-being."],
      Normal: ["Dog appears calm and content.", "No immediate action needed."],
    };

    console.log(`[Pre-classifier] Strong match: ${topEmotion} (score=${topScore}, gap=${gap}), features: pitch=${pitchCategory}, freq=${dominantFreqHz}Hz, spread=${frequencySpread}, rhythm=${rhythmPattern}, sustained=${sustainedVsShort}`);

    return {
      emotional_state: topEmotion, confidence, health_score: healthMap[topEmotion] ?? 70,
      severity: severityMap[topEmotion] ?? "mild",
      detailed_analysis: analysisMap[topEmotion] ?? "",
      health_indicators: [`Dominant frequency: ${dominantFreqHz}Hz`, `Pitch: ${pitchCategory}`, `Pattern: ${rhythmPattern}`],
      recommendations: recsMap[topEmotion] ?? ["Monitor your dog's behavior."],
    };
  }

  // Score too low or ambiguous — let the AI handle it
  console.log(`[Pre-classifier] Ambiguous: top=${sorted[0][0]}(${sorted[0][1]}), second=${sorted[1][0]}(${sorted[1][1]}), falling through to AI`);
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sensor_type, description, image_base64, audio_base64, acoustic_features } = await req.json();
    
    // For bark analysis, try deterministic classification first
    if (sensor_type === "bark" && acoustic_features) {
      console.log("[BarkSense] Received acoustic_features:", JSON.stringify(acoustic_features));
      const preResult = classifyFromFeatures(acoustic_features);
      if (preResult) {
        console.log("[BarkSense] Pre-classifier result:", preResult.emotional_state, "conf:", preResult.confidence);
        return new Response(JSON.stringify(preResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("[BarkSense] Pre-classifier returned null, falling through to AI");
    } else if (sensor_type === "bark") {
      console.log("[BarkSense] No acoustic_features received!");
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const systemPrompt = sensorPrompts[sensor_type];
    if (!systemPrompt) throw new Error(`Unknown sensor type: ${sensor_type}`);

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // Build user message with media if available
    if (audio_base64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: description || "Analyze this dog audio recording and classify the emotion." },
          { 
            type: "image_url", 
            image_url: { 
              url: `data:audio/webm;base64,${audio_base64}` 
            } 
          },
        ],
      });
    } else if (image_base64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: description || "Analyze this image for pet health diagnostics." },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image_base64}` } },
        ],
      });
    } else {
      messages.push({ role: "user", content: description || "No description provided." });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      analysis = { detailed_analysis: content, health_score: 70, severity: "mild", recommendations: ["Consult a veterinarian for a detailed examination."] };
    }

    // Log the emotional state for debugging
    if (sensor_type === "bark") {
      console.log("Bark analysis result:", JSON.stringify({ emotional_state: analysis.emotional_state, confidence: analysis.confidence }));
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-pet-health error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
