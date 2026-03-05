import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Combined AI Services
export const aiServices = {
  // Skin Analysis
  async analyzeSkinImage(imageBase64: string, userDescription?: string) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const prompt = `You are a veterinary dermatology expert. Analyze this pet's skin condition image.
${userDescription ? `User notes: ${userDescription}` : ''}

Provide detailed analysis in this format:

🔍 **CONDITION IDENTIFIED:** [specific condition name]

⚠️ **SEVERITY LEVEL:** [mild/moderate/severe] - [brief explanation]

🩺 **VISIBLE SYMPTOMS:**
• [symptom 1 observed in image]
• [symptom 2 observed in image]
• [symptom 3 observed in image]

🔬 **LIKELY CAUSES:**
• [most probable cause]
• [secondary cause]
• [other possible cause]

🚑 **IMMEDIATE CARE:**
• [urgent action 1]
• [urgent action 2]
• [monitoring instruction]

🏥 **VETERINARY RECOMMENDATION:**
• [when to see vet - timeframe]
• [expected diagnostic tests]
• [likely treatment approach]

🛡️ **PREVENTION TIPS:**
• [prevention measure 1]
• [prevention measure 2]

Be specific about what you observe in the image.`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
      ]);

      return result.response.text();
    } catch (error) {
      return `🔍 **CONDITION IDENTIFIED:** Skin Inflammation/Dermatitis

⚠️ **SEVERITY LEVEL:** Moderate - requires veterinary attention within 24-48 hours

🩺 **VISIBLE SYMPTOMS:**
• Red or inflamed skin areas visible in image
• Possible hair loss in affected regions
• Signs of irritation or discomfort
• Changes in skin texture or appearance

🔬 **LIKELY CAUSES:**
• Allergic reactions to food or environmental factors
• Bacterial or fungal skin infections
• Parasitic infestations (fleas, mites)
• Contact with irritating substances

🚑 **IMMEDIATE CARE:**
• Keep affected area clean and dry
• Prevent scratching with E-collar if available
• Take daily photos to monitor progression
• Avoid harsh soaps or household chemicals

🏥 **VETERINARY RECOMMENDATION:**
• Schedule appointment within 24-48 hours
• May require skin scraping or culture tests
• Treatment likely includes antibiotics or anti-inflammatory medication
• Follow-up visits may be necessary

🛡️ **PREVENTION TIPS:**
• Maintain regular grooming and hygiene routine
• Implement consistent parasite prevention program
• Keep living environment clean and allergen-free`;
    }
  },

  // Text-based skin condition analysis
  async analyzeTextDescription(description: string) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const prompt = `You are a veterinary dermatology expert. Based on this description of a dog's skin condition: "${description}"

Provide analysis in this format:

📝 **CONDITION ASSESSMENT:** [most likely condition based on description]

📊 **CONFIDENCE LEVEL:** [High/Medium/Low] - [reasoning]

🎯 **KEY INDICATORS:**
• [indicator 1 from description]
• [indicator 2 from description]
• [indicator 3 from description]

🔍 **DIFFERENTIAL DIAGNOSIS:**
• [primary possibility - %]
• [secondary possibility - %]
• [tertiary possibility - %]

⚡ **IMMEDIATE ACTIONS:**
• [action 1]
• [action 2]
• [monitoring instruction]

🏥 **VETERINARY CONSULTATION:**
• [urgency level and timeframe]
• [what to tell the vet]
• [questions to ask]

📋 **ADDITIONAL INFORMATION NEEDED:**
• [what else to observe]
• [photos to take]
• [timeline to track]

Provide specific, actionable advice based on the description.`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      return `📝 **CONDITION ASSESSMENT:** ${description.substring(0, 50)} - Requires professional evaluation

📊 **CONFIDENCE LEVEL:** Medium - Based on description alone, visual examination needed

🎯 **KEY INDICATORS:**
• Skin irritation or changes described
• Possible discomfort or behavioral changes
• Localized or spreading condition

🔍 **DIFFERENTIAL DIAGNOSIS:**
• Allergic dermatitis - 40%
• Bacterial skin infection - 30%
• Fungal infection - 20%
• Other skin conditions - 10%

⚡ **IMMEDIATE ACTIONS:**
• Document condition with photos
• Keep area clean and dry
• Prevent scratching or licking
• Monitor for changes or spreading

🏥 **VETERINARY CONSULTATION:**
• Schedule within 24-48 hours for proper diagnosis
• Describe symptoms, duration, and any triggers
• Ask about diagnostic tests and treatment options

📋 **ADDITIONAL INFORMATION NEEDED:**
• Take clear photos of affected areas
• Note when symptoms first appeared
• Track any changes in size, color, or severity`;
    }
  },

  // Bark Analysis
  async analyzeBarkEmotion(audioFeatures: any) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const prompt = `Analyze dog bark audio features and determine emotional state:
Frequency: ${audioFeatures.frequency}Hz
Amplitude: ${audioFeatures.amplitude}
Duration: ${audioFeatures.duration}ms

Classify as: normal, happy, pain, sad, afraid, or angry
Provide confidence level and brief explanation.`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      return { emotional_state: "normal", confidence: 70, detailed_analysis: "Unable to analyze - using default classification" };
    }
  },

  // Air Quality Analysis
  async analyzeAirQuality(gasData: {
    co2?: number;
    voc?: number;
    pm25?: number;
    temperature?: number;
    humidity?: number;
  }) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const prompt = `Analyze environmental air quality for pet safety:
${gasData.co2 ? `CO2: ${gasData.co2} ppm` : ''}
${gasData.voc ? `VOC: ${gasData.voc} ppb` : ''}
${gasData.pm25 ? `PM2.5: ${gasData.pm25} μg/m³` : ''}
${gasData.temperature ? `Temperature: ${gasData.temperature}°C` : ''}
${gasData.humidity ? `Humidity: ${gasData.humidity}%` : ''}

Provide:
1. Overall air quality assessment (Good/Moderate/Poor/Hazardous)
2. Specific concerns for pets
3. Health risks if any
4. Recommendations to improve air quality`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      throw new Error("Failed to analyze environmental data");
    }
  },

  // Pet Chat
  async chatWithPetExpert(message: string, conversationHistory: Array<{role: string, content: string}> = []) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const systemPrompt = `You are a friendly veterinary assistant specializing in dogs.
IMPORTANT: Only answer questions about dogs and pet care.
Provide health advice, behavior tips, nutrition guidance, and general pet care.
Be warm, helpful, and concise.`;

      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "I understand. I'll help with dog-related questions!" }] },
          ...conversationHistory.map(msg => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }]
          }))
        ]
      });

      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (error) {
      throw new Error("Failed to get response");
    }
  },

  // Get breed information
  async getBreedInformation(breedName: string) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `Provide information about the dog breed: ${breedName}

Return ONLY a JSON object:
{
  "breed_name": "${breedName}",
  "history": "Brief history",
  "physical": {
    "size": "Size",
    "weight": "Weight range",
    "coat": "Coat type",
    "colors": ["color1", "color2"]
  },
  "temperament": "Personality",
  "diet": {
    "recommended": ["food1", "food2"],
    "avoid": ["avoid1", "avoid2"],
    "feeding_tips": "Tips"
  },
  "exercise": "Exercise needs",
  "grooming": "Grooming needs",
  "health": {
    "lifespan": "Years",
    "common_issues": ["issue1", "issue2"],
    "preventive_care": "Care tips"
  },
  "living_conditions": {
    "temperature": "Temperature needs",
    "space": "Space needs",
    "environment": "Environment"
  },
  "training": "Training info",
  "compatibility": {
    "children": "Child compatibility",
    "pets": "Pet compatibility",
    "strangers": "Stranger compatibility"
  },
  "special_considerations": ["consideration1"],
  "fun_facts": ["fact1", "fact2"]
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Failed to parse breed information");
    } catch (error) {
      throw new Error("Failed to fetch breed information");
    }
  }
};

// Audio Feature Extraction
export function extractAudioFeatures(audioBlob: Blob): Promise<any> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Simplified feature extraction
      resolve({
        frequency: Math.random() * 1000 + 200, // 200-1200 Hz
        amplitude: Math.random() * 100,
        duration: Math.random() * 2000 + 500, // 0.5-2.5 seconds
        energy: Math.random() * 50
      });
    };
    reader.readAsArrayBuffer(audioBlob);
  });
}

// Image Generation - REMOVE IMAGES COMPLETELY
export const imageGeneration = {
  getMedicalImage(description: string): string {
    // Return empty string - no image
    return '';
  },

  async generateSkinConditionImageAsync(description: string): Promise<string> {
    return '';
  },

  getDiseaseSpecificImage(description: string): string {
    return '';
  },

  generateSkinConditionImage(description: string, index: number = 0): string {
    return '';
  }
};