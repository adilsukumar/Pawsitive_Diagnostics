/**
 * Machine Learning-based Gut Health Analyzer
 * Analyzes stool samples and gas sensor data
 */

export interface GutMLResult {
  parasites_detected: Array<{ name: string; confidence: number }>;
  color_analysis: { color: string; indication: string };
  gas_analysis?: {
    methane_level: string;
    ammonia_level: string;
    interpretation: string;
  };
  consistency: string;
  recommendations: string[];
  health_score: number;
  severity: 'normal' | 'mild' | 'moderate' | 'severe';
  detailed_analysis: string;
}

interface StoolColorProfile {
  r: number;
  g: number;
  b: number;
  hue: number;
}

export async function analyzeGutHealth(
  imageBase64?: string,
  description?: string,
  gasData?: { methane?: number; ammonia?: number }
): Promise<GutMLResult> {
  const parasites: Array<{ name: string; confidence: number }> = [];
  let colorProfile: StoolColorProfile | null = null;
  let consistency = 'Unknown';

  // Extract color from image
  if (imageBase64) {
    colorProfile = await extractStoolColor(imageBase64);
  }

  // Analyze description
  if (description) {
    const lower = description.toLowerCase();
    
    // Consistency detection
    if (lower.includes('liquid') || lower.includes('diarrhea') || lower.includes('watery')) {
      consistency = 'Liquid (Diarrhea)';
    } else if (lower.includes('soft') || lower.includes('loose')) {
      consistency = 'Soft';
    } else if (lower.includes('hard') || lower.includes('dry')) {
      consistency = 'Hard/Dry';
    } else if (lower.includes('normal') || lower.includes('formed')) {
      consistency = 'Well-formed';
    } else if (lower.includes('mucus') || lower.includes('slimy')) {
      consistency = 'Mucous-covered';
    }

    // Parasite detection from description
    if (lower.includes('worm') || lower.includes('white') || lower.includes('rice')) {
      parasites.push({ name: 'Tapeworm', confidence: 75 });
    }
    if (lower.includes('round') || lower.includes('spaghetti')) {
      parasites.push({ name: 'Roundworm', confidence: 70 });
    }
    if (lower.includes('blood') || lower.includes('dark')) {
      parasites.push({ name: 'Hookworm', confidence: 60 });
    }
  }

  // Color analysis
  let colorAnalysis = { color: 'Brown', indication: 'Normal healthy stool' };
  
  if (colorProfile) {
    const { r, g, b, hue } = colorProfile;
    
    // Red/bloody stool
    if (r > 150 && r > g * 1.5 && r > b * 1.5) {
      colorAnalysis = {
        color: 'Red/Bloody',
        indication: 'Lower GI bleeding, colitis, or parasites'
      };
      parasites.push({ name: 'Hookworm (suspected)', confidence: 55 });
    }
    // Black/tarry stool
    else if (r < 60 && g < 60 && b < 60) {
      colorAnalysis = {
        color: 'Black/Tarry',
        indication: 'Upper GI bleeding or iron supplementation'
      };
    }
    // Yellow/orange stool
    else if (hue > 30 && hue < 60 && g > 100) {
      colorAnalysis = {
        color: 'Yellow/Orange',
        indication: 'Liver, gallbladder, or rapid transit issue'
      };
    }
    // Green stool
    else if (g > r * 1.2 && g > b * 1.2) {
      colorAnalysis = {
        color: 'Green',
        indication: 'Rapid transit, dietary change, or grass consumption'
      };
    }
    // White/gray stool
    else if (r > 180 && g > 180 && b > 180) {
      colorAnalysis = {
        color: 'White/Gray',
        indication: 'Pancreatic or bile duct issue'
      };
    }
    // Normal brown
    else if (hue > 15 && hue < 45 && r > 80 && r < 150) {
      colorAnalysis = {
        color: 'Brown',
        indication: 'Normal healthy stool'
      };
    }
  }

  // Gas analysis
  let gasAnalysis;
  if (gasData) {
    const { methane = 0, ammonia = 0 } = gasData;
    
    const methaneLevel = methane < 200 ? 'Normal' : methane < 500 ? 'Elevated' : 'High';
    const ammoniaLevel = ammonia < 200 ? 'Normal' : ammonia < 500 ? 'Elevated' : 'High';
    
    let interpretation = '';
    if (methane > 500 || ammonia > 500) {
      interpretation = 'High gas levels indicate digestive imbalance or bacterial overgrowth';
    } else if (methane > 200 || ammonia > 200) {
      interpretation = 'Elevated gas levels suggest dietary adjustment may be needed';
    } else {
      interpretation = 'Gas levels within normal range';
    }
    
    gasAnalysis = { methane_level: methaneLevel, ammonia_level: ammoniaLevel, interpretation };
  }

  // Calculate health score
  let health_score = 100;
  
  if (parasites.length > 0) health_score -= 30;
  if (colorAnalysis.color !== 'Brown') health_score -= 20;
  if (consistency === 'Liquid (Diarrhea)') health_score -= 25;
  else if (consistency === 'Soft') health_score -= 10;
  else if (consistency === 'Hard/Dry') health_score -= 15;
  if (gasData && (gasData.methane! > 500 || gasData.ammonia! > 500)) health_score -= 15;
  
  health_score = Math.max(30, health_score);

  // Determine severity
  let severity: 'normal' | 'mild' | 'moderate' | 'severe' = 'normal';
  if (health_score < 50) severity = 'severe';
  else if (health_score < 70) severity = 'moderate';
  else if (health_score < 85) severity = 'mild';

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (parasites.length > 0) {
    recommendations.push('Deworming treatment required');
    recommendations.push('Collect stool sample for vet analysis');
  }
  
  if (colorAnalysis.color === 'Red/Bloody' || colorAnalysis.color === 'Black/Tarry') {
    recommendations.push('Seek immediate veterinary attention');
  } else if (colorAnalysis.color !== 'Brown') {
    recommendations.push('Monitor stool color over next 24-48 hours');
    recommendations.push('Consider dietary changes');
  }
  
  if (consistency === 'Liquid (Diarrhea)') {
    recommendations.push('Ensure adequate hydration');
    recommendations.push('Consider bland diet (rice and chicken)');
    recommendations.push('Contact vet if persists > 24 hours');
  } else if (consistency === 'Hard/Dry') {
    recommendations.push('Increase water intake');
    recommendations.push('Add fiber to diet');
  }
  
  if (gasData && (gasData.methane! > 500 || gasData.ammonia! > 500)) {
    recommendations.push('Review diet for digestive issues');
    recommendations.push('Consider probiotic supplementation');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Stool appears normal');
    recommendations.push('Continue current diet and routine');
  }

  // Detailed analysis
  const parts = [
    `Stool analysis complete.`,
    `Color: ${colorAnalysis.color} - ${colorAnalysis.indication}.`,
    consistency !== 'Unknown' ? `Consistency: ${consistency}.` : '',
    parasites.length > 0 ? `Detected ${parasites.length} potential parasite(s).` : 'No parasites detected.',
    gasAnalysis ? `Gas levels: Methane ${gasAnalysis.methane_level}, Ammonia ${gasAnalysis.ammonia_level}.` : ''
  ].filter(Boolean);

  return {
    parasites_detected: parasites,
    color_analysis: colorAnalysis,
    gas_analysis: gasAnalysis,
    consistency,
    recommendations,
    health_score,
    severity,
    detailed_analysis: parts.join(' ')
  };
}

async function extractStoolColor(base64: string): Promise<StoolColorProfile> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
      
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      
      // Calculate hue
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let hue = 0;
      
      if (max !== min) {
        const delta = max - min;
        if (max === r) {
          hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        } else if (max === g) {
          hue = ((b - r) / delta + 2) / 6;
        } else {
          hue = ((r - g) / delta + 4) / 6;
        }
      }
      hue = Math.round(hue * 360);
      
      resolve({ r, g, b, hue });
    };
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}
