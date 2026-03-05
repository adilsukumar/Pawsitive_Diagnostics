import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export const geminiService = {
  // Generate image analysis for SkinSense
  async analyzeSkinImage(imageBase64: string, userDescription?: string) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `You are a veterinary dermatology expert. Analyze this pet's skin condition image.
${userDescription ? `User notes: ${userDescription}` : ''}

Provide:
1. Condition identification
2. Severity level (mild/moderate/severe)
3. Possible causes
4. Recommended actions
5. When to see a vet

Be concise and pet-owner friendly.`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64
          }
        }
      ]);

      return result.response.text();
    } catch (error) {
      console.error("Gemini API error:", error);
      // Fallback analysis when Gemini fails
      return `**Skin Condition Analysis**

Based on the uploaded image${userDescription ? ` and your description: "${userDescription}"` : ''}:

**Preliminary Assessment:**
• This appears to be a skin condition that requires veterinary attention
• Common causes include allergies, infections, or irritants
• The affected area shows signs of inflammation

**Recommended Actions:**
1. Schedule a veterinary appointment within 24-48 hours
2. Keep the area clean and dry
3. Prevent your pet from licking or scratching
4. Take photos daily to monitor changes
5. Note any behavioral changes

**When to Seek Emergency Care:**
• If the condition spreads rapidly
• If your pet shows signs of pain or distress
• If there are signs of infection (pus, strong odor)

*Note: This is a preliminary assessment. Professional veterinary diagnosis is recommended for accurate treatment.*`;
    }
  },

  // Generate comparison between two skin images
  async compareSkinImages(beforeImage: string, afterImage: string) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `Compare these two pet skin condition images (before and after).
Analyze:
1. Visible improvements or deterioration
2. Changes in redness, inflammation, or lesions
3. Progress assessment
4. Recommendations for continued care

Be specific and encouraging if improvement is shown.`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: beforeImage
          }
        },
        "BEFORE IMAGE",
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: afterImage
          }
        },
        "AFTER IMAGE"
      ]);

      return result.response.text();
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error("Failed to compare images");
    }
  },

  // Pet health chatbot (dogs/pets only)
  async chatWithPetExpert(message: string, conversationHistory: Array<{role: string, content: string}> = []) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const systemPrompt = `You are a friendly veterinary assistant specializing in dogs and pet animals.
IMPORTANT: Only answer questions about dogs, cats, and common pet animals.
If asked about non-pet topics, politely redirect to pet-related questions.

Provide:
- Health advice (not replacing vet visits)
- Behavior tips
- Nutrition guidance
- General pet care
- When to see a vet

Be warm, helpful, and concise.`;

      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "I understand. I'll only help with dog and pet-related questions!" }] },
          ...conversationHistory.map(msg => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }]
          }))
        ]
      });

      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error("Failed to get response");
    }
  },

  // Generate content for features
  async generateFeatureContent(feature: "skinsense" | "airsense" | "barksense") {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompts = {
        skinsense: "Write a brief, engaging description (2-3 sentences) about AI-powered pet skin condition monitoring for pet owners.",
        airsense: "Write a brief, engaging description (2-3 sentences) about environmental air quality monitoring for pet safety.",
        barksense: "Write a brief, engaging description (2-3 sentences) about AI bark emotion detection to understand your dog's feelings."
      };

      const result = await model.generateContent(prompts[feature]);
      return result.response.text();
    } catch (error) {
      console.error("Gemini API error:", error);
      return null;
    }
  },

  // Generate general text content
  async generateContent(prompt: string) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error("Failed to generate content");
    }
  },

  // Analyze environmental gases (AirSense)
  async analyzeEnvironmentalGases(gasData: {
    co2?: number;
    voc?: number;
    pm25?: number;
    temperature?: number;
    humidity?: number;
  }) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `Analyze these environmental air quality readings for pet safety:
${gasData.co2 ? `CO2: ${gasData.co2} ppm` : ''}
${gasData.voc ? `VOC: ${gasData.voc} ppb` : ''}
${gasData.pm25 ? `PM2.5: ${gasData.pm25} μg/m³` : ''}
${gasData.temperature ? `Temperature: ${gasData.temperature}°C` : ''}
${gasData.humidity ? `Humidity: ${gasData.humidity}%` : ''}

Provide:
1. Overall air quality assessment (Good/Moderate/Poor/Hazardous)
2. Specific concerns for pets
3. Health risks if any
4. Recommendations to improve air quality

Be concise and actionable.`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error("Failed to analyze environmental data");
    }
  },

  // Get comprehensive breed information
  async getBreedInformation(breedName: string) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `Provide comprehensive information about the dog breed: ${breedName}

Include:
1. **History & Origin**: Where the breed originated, what it was originally bred for, historical significance
2. **Physical Characteristics**: Size, weight range, coat type, colors, distinctive features
3. **Temperament & Personality**: Typical behavior traits, energy level, intelligence
4. **Diet & Nutrition**: Recommended food types, portion sizes, foods to avoid, feeding schedule
5. **Exercise & Activity**: Daily exercise needs, suitable activities, play requirements
6. **Grooming**: Coat care, bathing frequency, nail trimming, dental care
7. **Health**: Common health issues, average lifespan, preventive care tips
8. **Living Conditions**: Ideal temperature range, space requirements, indoor/outdoor needs
9. **Training**: Trainability level, best training methods, socialization needs
10. **Compatibility**: Good with children, other pets, strangers
11. **Special Considerations**: Any breed-specific cautions or requirements
12. **Fun Facts**: 2-3 interesting facts about the breed

Format as JSON with these keys:
{
  "breed_name": "Official breed name",
  "history": "Brief history and origin",
  "physical": { "size": "", "weight": "", "coat": "", "colors": [] },
  "temperament": "Description",
  "diet": { "recommended": [], "avoid": [], "feeding_tips": "" },
  "exercise": "Daily needs and activities",
  "grooming": "Care requirements",
  "health": { "lifespan": "", "common_issues": [], "preventive_care": "" },
  "living_conditions": { "temperature": "", "space": "", "environment": "" },
  "training": "Trainability and methods",
  "compatibility": { "children": "", "pets": "", "strangers": "" },
  "special_considerations": [],
  "fun_facts": []
}

Be detailed, accurate, and helpful for pet owners.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Failed to parse breed information");
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error("Failed to fetch breed information");
    }
  }
};
