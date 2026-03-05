/**
 * Custom Trained BarkSense Model Loader
 * Loads your trained model from public/models/bark/
 */

import * as tf from '@tensorflow/tfjs';

let customBarkModel: tf.LayersModel | null = null;

export async function loadCustomBarkModel() {
  if (!customBarkModel) {
    try {
      // Try to load your custom trained model
      customBarkModel = await tf.loadLayersModel('/models/bark/model.json');
      console.log('Custom BarkSense model loaded successfully!');
    } catch (e) {
      console.log('Custom model not found, using rule-based classifier');
      return null;
    }
  }
  return customBarkModel;
}

export async function classifyWithCustomModel(audioFeatures: any) {
  const model = await loadCustomBarkModel();
  if (!model) return null;
  
  // Convert audio features to spectrogram format (224x224x3)
  // This matches the training format
  const tensor = tf.tensor4d([[audioFeatures]], [1, 224, 224, 3]);
  
  const prediction = model.predict(tensor) as tf.Tensor;
  const result = await prediction.data();
  
  tensor.dispose();
  prediction.dispose();
  
  return {
    isDogBark: result[0] > 0.5,
    confidence: Math.round(result[0] * 100)
  };
}
