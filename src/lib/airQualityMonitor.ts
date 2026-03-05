// Air Quality Monitoring & Alert System

export interface GasLevels {
  methane_ppm: number;
  ammonia_ppm: number;
  co2_ppm: number;
}

export interface SafeThresholds {
  methane: { safe: number; warning: number; danger: number };
  ammonia: { safe: number; warning: number; danger: number };
  co2: { safe: number; warning: number; danger: number };
}

// Breed-specific safe levels based on size and respiratory sensitivity
export const BREED_THRESHOLDS: Record<string, SafeThresholds> = {
  // Small breeds (more sensitive)
  'Chihuahua': { methane: { safe: 30, warning: 60, danger: 120 }, ammonia: { safe: 15, warning: 30, danger: 60 }, co2: { safe: 800, warning: 1500, danger: 3000 } },
  'Pomeranian': { methane: { safe: 30, warning: 60, danger: 120 }, ammonia: { safe: 15, warning: 30, danger: 60 }, co2: { safe: 800, warning: 1500, danger: 3000 } },
  'Yorkshire Terrier': { methane: { safe: 30, warning: 60, danger: 120 }, ammonia: { safe: 15, warning: 30, danger: 60 }, co2: { safe: 800, warning: 1500, danger: 3000 } },
  
  // Brachycephalic breeds (flat-faced, very sensitive)
  'Bulldog': { methane: { safe: 25, warning: 50, danger: 100 }, ammonia: { safe: 12, warning: 25, danger: 50 }, co2: { safe: 700, warning: 1200, danger: 2500 } },
  'Pug': { methane: { safe: 25, warning: 50, danger: 100 }, ammonia: { safe: 12, warning: 25, danger: 50 }, co2: { safe: 700, warning: 1200, danger: 2500 } },
  'French Bulldog': { methane: { safe: 25, warning: 50, danger: 100 }, ammonia: { safe: 12, warning: 25, danger: 50 }, co2: { safe: 700, warning: 1200, danger: 2500 } },
  'Shih Tzu': { methane: { safe: 25, warning: 50, danger: 100 }, ammonia: { safe: 12, warning: 25, danger: 50 }, co2: { safe: 700, warning: 1200, danger: 2500 } },
  'Boston Terrier': { methane: { safe: 25, warning: 50, danger: 100 }, ammonia: { safe: 12, warning: 25, danger: 50 }, co2: { safe: 700, warning: 1200, danger: 2500 } },
  
  // Medium breeds (moderate tolerance)
  'Beagle': { methane: { safe: 50, warning: 100, danger: 200 }, ammonia: { safe: 25, warning: 50, danger: 100 }, co2: { safe: 1000, warning: 2000, danger: 4000 } },
  'Cocker Spaniel': { methane: { safe: 50, warning: 100, danger: 200 }, ammonia: { safe: 25, warning: 50, danger: 100 }, co2: { safe: 1000, warning: 2000, danger: 4000 } },
  'Border Collie': { methane: { safe: 50, warning: 100, danger: 200 }, ammonia: { safe: 25, warning: 50, danger: 100 }, co2: { safe: 1000, warning: 2000, danger: 4000 } },
  
  // Large breeds (higher tolerance)
  'Labrador Retriever': { methane: { safe: 60, warning: 120, danger: 250 }, ammonia: { safe: 30, warning: 60, danger: 120 }, co2: { safe: 1200, warning: 2500, danger: 5000 } },
  'Golden Retriever': { methane: { safe: 60, warning: 120, danger: 250 }, ammonia: { safe: 30, warning: 60, danger: 120 }, co2: { safe: 1200, warning: 2500, danger: 5000 } },
  'German Shepherd': { methane: { safe: 60, warning: 120, danger: 250 }, ammonia: { safe: 30, warning: 60, danger: 120 }, co2: { safe: 1200, warning: 2500, danger: 5000 } },
  'Rottweiler': { methane: { safe: 60, warning: 120, danger: 250 }, ammonia: { safe: 30, warning: 60, danger: 120 }, co2: { safe: 1200, warning: 2500, danger: 5000 } },
  
  // Default for unknown breeds (conservative)
  'default': { methane: { safe: 40, warning: 80, danger: 160 }, ammonia: { safe: 20, warning: 40, danger: 80 }, co2: { safe: 900, warning: 1800, danger: 3500 } }
};

export function getBreedThresholds(breed: string): SafeThresholds {
  // Check exact match
  if (BREED_THRESHOLDS[breed]) return BREED_THRESHOLDS[breed];
  
  // Check if breed name contains known breed
  const breedLower = breed.toLowerCase();
  for (const [key, thresholds] of Object.entries(BREED_THRESHOLDS)) {
    if (breedLower.includes(key.toLowerCase())) {
      return thresholds;
    }
  }
  
  // Check for mixed breeds - use more conservative thresholds
  if (breedLower.includes('mixed')) {
    return BREED_THRESHOLDS['default'];
  }
  
  // Default conservative thresholds
  return BREED_THRESHOLDS['default'];
}

export class AirQualityMonitor {
  private baselineSamples: GasLevels[] = [];
  private baseline: GasLevels | null = null;
  private readonly BASELINE_SAMPLE_COUNT = 60;
  private breedThresholds: SafeThresholds;

  constructor(dogBreed: string) {
    this.breedThresholds = getBreedThresholds(dogBreed);
  }

  updateBreed(dogBreed: string) {
    this.breedThresholds = getBreedThresholds(dogBreed);
  }

  addBaselineSample(reading: GasLevels) {
    if (this.baseline) return;
    
    this.baselineSamples.push(reading);
    
    if (this.baselineSamples.length >= this.BASELINE_SAMPLE_COUNT) {
      this.calculateBaseline();
    }
  }

  private calculateBaseline() {
    const sum = this.baselineSamples.reduce(
      (acc, sample) => ({
        methane_ppm: acc.methane_ppm + sample.methane_ppm,
        ammonia_ppm: acc.ammonia_ppm + sample.ammonia_ppm,
        co2_ppm: acc.co2_ppm + sample.co2_ppm
      }),
      { methane_ppm: 0, ammonia_ppm: 0, co2_ppm: 0 }
    );

    this.baseline = {
      methane_ppm: sum.methane_ppm / this.baselineSamples.length,
      ammonia_ppm: sum.ammonia_ppm / this.baselineSamples.length,
      co2_ppm: sum.co2_ppm / this.baselineSamples.length
    };

    localStorage.setItem('air_baseline', JSON.stringify(this.baseline));
  }

  getBaseline(): GasLevels | null {
    if (this.baseline) return this.baseline;
    
    const stored = localStorage.getItem('air_baseline');
    if (stored) {
      this.baseline = JSON.parse(stored);
      return this.baseline;
    }
    
    return null;
  }

  getCalibrationProgress(): number {
    return Math.min(100, (this.baselineSamples.length / this.BASELINE_SAMPLE_COUNT) * 100);
  }

  getBreedThresholds(): SafeThresholds {
    return this.breedThresholds;
  }

  checkAirQuality(current: GasLevels): {
    status: 'safe' | 'warning' | 'danger';
    alerts: Array<{ gas: string; level: string; current: number; safe: number; message: string }>;
  } {
    const alerts: Array<{ gas: string; level: string; current: number; safe: number; message: string }> = [];
    let worstStatus: 'safe' | 'warning' | 'danger' = 'safe';

    // Check Methane
    if (current.methane_ppm > this.breedThresholds.methane.danger) {
      worstStatus = 'danger';
      alerts.push({
        gas: 'Methane',
        level: 'DANGER',
        current: current.methane_ppm,
        safe: this.breedThresholds.methane.safe,
        message: `Methane at ${current.methane_ppm.toFixed(1)} ppm - DANGEROUS for your dog! Safe level: ${this.breedThresholds.methane.safe} ppm. Ventilate immediately!`
      });
    } else if (current.methane_ppm > this.breedThresholds.methane.warning) {
      if (worstStatus !== 'danger') worstStatus = 'warning';
      alerts.push({
        gas: 'Methane',
        level: 'WARNING',
        current: current.methane_ppm,
        safe: this.breedThresholds.methane.safe,
        message: `Methane at ${current.methane_ppm.toFixed(1)} ppm - Above safe level for your dog. Increase ventilation.`
      });
    }

    // Check Ammonia
    if (current.ammonia_ppm > this.breedThresholds.ammonia.danger) {
      worstStatus = 'danger';
      alerts.push({
        gas: 'Ammonia',
        level: 'DANGER',
        current: current.ammonia_ppm,
        safe: this.breedThresholds.ammonia.safe,
        message: `Ammonia at ${current.ammonia_ppm.toFixed(1)} ppm - DANGEROUS for your dog! Safe level: ${this.breedThresholds.ammonia.safe} ppm. Remove dog from area!`
      });
    } else if (current.ammonia_ppm > this.breedThresholds.ammonia.warning) {
      if (worstStatus !== 'danger') worstStatus = 'warning';
      alerts.push({
        gas: 'Ammonia',
        level: 'WARNING',
        current: current.ammonia_ppm,
        safe: this.breedThresholds.ammonia.safe,
        message: `Ammonia at ${current.ammonia_ppm.toFixed(1)} ppm - Above safe level for your dog. Clean area and ventilate.`
      });
    }

    // Check CO2
    if (current.co2_ppm > this.breedThresholds.co2.danger) {
      worstStatus = 'danger';
      alerts.push({
        gas: 'CO2',
        level: 'DANGER',
        current: current.co2_ppm,
        safe: this.breedThresholds.co2.safe,
        message: `CO2 at ${current.co2_ppm.toFixed(0)} ppm - DANGEROUS for your dog! Safe level: ${this.breedThresholds.co2.safe} ppm. Open windows immediately!`
      });
    } else if (current.co2_ppm > this.breedThresholds.co2.warning) {
      if (worstStatus !== 'danger') worstStatus = 'warning';
      alerts.push({
        gas: 'CO2',
        level: 'WARNING',
        current: current.co2_ppm,
        safe: this.breedThresholds.co2.safe,
        message: `CO2 at ${current.co2_ppm.toFixed(0)} ppm - Above safe level for your dog. Improve air circulation.`
      });
    }

    return { status: worstStatus, alerts };
  }

  reset() {
    this.baselineSamples = [];
    this.baseline = null;
    localStorage.removeItem('air_baseline');
  }
}

// Initialize with current dog breed
const currentBreed = localStorage.getItem('dog_breed') || 'default';
export const airQualityMonitor = new AirQualityMonitor(currentBreed);
