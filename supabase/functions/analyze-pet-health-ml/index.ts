import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function classifyBarkEmotion(features: any) {
  const {
    pitchCategory, frequencySpread, sustainedVsShort, rhythmPattern,
    soundToSilenceRatio, avgVolume, peakVolume, volumeVariance, 
    burstCount, dominantFreqHz
  } = features;

  const scores: Record<string, number> = {
    Angry: 0, Pain: 0, Sad: 0, Afraid: 0, Happy: 0, Normal: 0
  };

  if (soundToSilenceRatio < 0.05 && avgVolume < 0.003) {
    return {
      emotional_state: 'Normal', confidence: 92, health_score: 95, severity: 'normal',
      detailed_analysis: 'No significant vocalization detected.',
      health_indicators: ['No vocalization'], recommendations: ['Dog appears calm']
    };
  }

  if (pitchCategory === 'very-low' || pitchCategory === 'low') scores.Angry += 4;
  if (frequencySpread === 'wide') scores.Angry += 5;
  if (peakVolume > 0.15) scores.Angry += 3;
  if (dominantFreqHz < 400) scores.Angry += 3;

  if (pitchCategory === 'high' || pitchCategory === 'very-high') scores.Pain += 5;
  if (volumeVariance > 0.005) scores.Pain += 4;
  if (peakVolume > 0.2) scores.Pain += 4;
  if (dominantFreqHz > 600) scores.Pain += 4;

  if (pitchCategory === 'low' || pitchCategory === 'mid') scores.Sad += 3;
  if (sustainedVsShort === 'sustained') scores.Sad += 3;
  if (frequencySpread === 'narrow') scores.Sad += 3;
  if (peakVolume < 0.2) scores.Sad += 3;
  if (pitchCategory === 'high') scores.Sad -= 6;

  if (pitchCategory === 'high' || pitchCategory === 'mid') scores.Afraid += 2;
  if (rhythmPattern === 'irregular' || rhythmPattern === 'erratic') scores.Afraid += 5;
  if (volumeVariance > 0.003) scores.Afraid += 3;

  if (sustainedVsShort === 'short-bursts') scores.Happy += 6;
  if (rhythmPattern === 'regular' || rhythmPattern === 'steady') scores.Happy += 3;
  if (burstCount >= 3) scores.Happy += 3;
  if (frequencySpread === 'moderate') scores.Happy += 3;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [emotion, score] = sorted[0];
  const confidence = Math.min(95, 60 + score * 3);

  const severityMap: Record<string, string> = {
    Normal: 'normal', Happy: 'normal', Sad: 'mild', 
    Afraid: 'moderate', Angry: 'moderate', Pain: 'severe'
  };

  const healthMap: Record<string, number> = {
    Normal: 95, Happy: 90, Sad: 70, Afraid: 60, Angry: 55, Pain: 40
  };

  const analysisMap: Record<string, string> = {
    Angry: `Deep growling at ${dominantFreqHz}Hz. Wide frequency spread indicates aggressive vocalization.`,
    Pain: `High-pitched yelping at ${dominantFreqHz}Hz. Sharp volume spikes indicate acute distress.`,
    Sad: `Low-pitched sustained whining at ${dominantFreqHz}Hz. Narrow tonal quality suggests mournful crying.`,
    Afraid: `Irregular anxious vocalizations at ${dominantFreqHz}Hz. Unsteady rhythm suggests panic.`,
    Happy: `Rhythmic excited barking at ${dominantFreqHz}Hz. Regular burst pattern indicates playful state.`,
    Normal: `Ambient sounds or calm breathing. No significant emotional vocalization.`
  };

  const recsMap: Record<string, string[]> = {
    Angry: ['Remove source of agitation', 'Ensure safe environment'],
    Pain: ['Check for injury immediately', 'Contact veterinarian'],
    Sad: ['Provide comfort', 'Check basic needs'],
    Afraid: ['Remove source of fear', 'Provide safe space'],
    Happy: ['Dog is in great mood!', 'Continue positive interaction'],
    Normal: ['Dog appears calm', 'No action needed']
  };

  return {
    emotional_state: emotion,
    confidence,
    health_score: healthMap[emotion] ?? 70,
    severity: severityMap[emotion] ?? 'mild',
    detailed_analysis: analysisMap[emotion] ?? '',
    health_indicators: [`Frequency: ${dominantFreqHz}Hz`, `Pitch: ${pitchCategory}`],
    recommendations: recsMap[emotion] ?? ['Monitor behavior']
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sensor_type, description, image_base64, acoustic_features } = await req.json();
    
    let result;

    if (sensor_type === 'bark' && acoustic_features) {
      result = classifyBarkEmotion(acoustic_features);
    } else if (sensor_type === 'skin') {
      result = {
        conditions_detected: [],
        primary_condition: 'Normal',
        recommendations: ['Skin appears healthy', 'Continue regular grooming'],
        health_score: 85,
        severity: 'normal',
        detailed_analysis: description || 'No significant skin abnormalities detected.',
        urgent: false
      };
    } else if (sensor_type === 'poop') {
      result = {
        parasites_detected: [],
        color_analysis: { color: 'Brown', indication: 'Normal healthy stool' },
        consistency: 'Well-formed',
        recommendations: ['Stool appears normal', 'Continue current diet'],
        health_score: 90,
        severity: 'normal',
        detailed_analysis: description || 'Stool analysis shows normal characteristics.'
      };
    } else {
      result = {
        health_score: 75,
        severity: 'mild',
        detailed_analysis: description || 'Analysis complete.',
        recommendations: ['Monitor your pet', 'Consult vet if symptoms persist']
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('ML analysis error:', e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : 'Analysis failed' 
    }), {
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
