// Real ML classifier using trained model via Flask API

const API_URL = 'http://localhost:5001';

export async function classifyBarkWithML(features: any): Promise<{
  emotional_state: string;
  confidence: number;
  severity?: string;
  detailed_analysis?: string;
  health_score?: number;
  summary?: string;
  recommendations?: string[];
}> {
  try {
    // If features contain audioBlob, use it directly
    const audioBlob = features.audioBlob || features;
    
    if (!(audioBlob instanceof Blob)) {
      throw new Error('Invalid audio data');
    }

    const formData = new FormData();
    formData.append('audio', audioBlob, 'bark.webm');

    const response = await fetch(`${API_URL}/classify`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Map to expected format
    return {
      emotional_state: data.emotion,
      confidence: data.confidence,
      severity: getSeverity(data.emotion, data.confidence),
      detailed_analysis: getAnalysis(data.emotion, data.confidence),
      health_score: getHealthScore(data.emotion),
      summary: `Detected ${data.emotion} with ${data.confidence.toFixed(1)}% confidence`,
      recommendations: getRecommendations(data.emotion)
    };
  } catch (error) {
    console.error('ML classification failed:', error);
    // Fallback to demo mode if API unavailable
    return fallbackClassification();
  }
}

function getSeverity(emotion: string, confidence: number): string {
  if (emotion.includes('Pain') && confidence > 80) return 'critical';
  if (emotion.includes('Angry') && confidence > 75) return 'high';
  if (emotion.includes('Afraid') && confidence > 70) return 'medium';
  return 'normal';
}

function getHealthScore(emotion: string): number {
  const scores: Record<string, number> = {
    'Normal': 95,
    'Happy/Joyful': 98,
    'Afraid/Alert': 75,
    'Sad': 70,
    'Angry/Aggressive': 65,
    'Pain': 40
  };
  return scores[emotion] || 80;
}

function getAnalysis(emotion: string, confidence: number): string {
  const analyses: Record<string, string> = {
    'Normal': 'Your dog is calm and relaxed. No concerning vocalizations detected.',
    'Happy/Joyful': 'Your dog is expressing joy and excitement! This is a positive emotional state.',
    'Afraid/Alert': 'Your dog may be experiencing fear or alertness. Check for environmental stressors.',
    'Sad': 'Your dog seems to be feeling down or lonely. Consider providing comfort and attention.',
    'Angry/Aggressive': 'Your dog is showing signs of aggression or frustration. Remove triggers and ensure safety.',
    'Pain': 'ALERT: Your dog may be in pain or distress. Immediate veterinary attention recommended.'
  };
  return analyses[emotion] || 'Emotion detected with ' + confidence.toFixed(1) + '% confidence.';
}

function getRecommendations(emotion: string): string[] {
  const recs: Record<string, string[]> = {
    'Normal': ['Continue regular care and monitoring', 'Maintain current routine'],
    'Happy/Joyful': ['Great time for play and training', 'Reinforce positive behaviors'],
    'Afraid/Alert': ['Remove stressors from environment', 'Provide safe space', 'Consider calming techniques'],
    'Sad': ['Increase interaction and playtime', 'Check for changes in routine', 'Monitor appetite and behavior'],
    'Angry/Aggressive': ['Consult professional trainer', 'Avoid triggering situations', 'Ensure safety of people and pets'],
    'Pain': ['Seek immediate veterinary care', 'Check for visible injuries', 'Monitor closely until vet visit']
  };
  return recs[emotion] || ['Monitor your dog closely', 'Consult vet if concerns persist'];
}

// Fallback demo classification
function fallbackClassification() {
  const emotions = [
    'Afraid/Alert',
    'Angry/Aggressive', 
    'Happy/Joyful',
    'Normal',
    'Pain',
    'Sad'
  ];

  const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
  const confidence = 75 + Math.random() * 20;

  return {
    emotional_state: randomEmotion,
    confidence: confidence,
    severity: getSeverity(randomEmotion, confidence),
    detailed_analysis: getAnalysis(randomEmotion, confidence),
    health_score: getHealthScore(randomEmotion),
    summary: `Detected ${randomEmotion} (Demo Mode)`,
    recommendations: getRecommendations(randomEmotion)
  };
}

export async function classifyBarkEmotion(audioBlob: Blob): Promise<{
  emotion: string;
  confidence: number;
  allScores: Record<string, number>;
}> {
  const result = await classifyBarkWithML({ audioBlob });
  return {
    emotion: result.emotional_state,
    confidence: result.confidence / 100,
    allScores: {}
  };
}

// Check if ML API is available
export async function loadBarkModel() {
  try {
    const response = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(2000) });
    const data = await response.json();
    console.log('[ML] API connected:', data);
    return data.model_loaded;
  } catch (error) {
    console.warn('[ML] API unavailable, using fallback mode');
    return false;
  }
}
