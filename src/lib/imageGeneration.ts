// FREE Image Generation using Hugging Face Stable Diffusion
const HF_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY || "";
const HF_API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1";

export const imageGenerationService = {
  // Generate image from text description (FREE with API key!)
  async generateImage(prompt: string): Promise<string> {
    if (!HF_API_KEY || HF_API_KEY === "hf_your_key_here") {
      throw new Error("Hugging Face API key required. Get free key at https://huggingface.co/settings/tokens");
    }

    try {
      const response = await fetch(HF_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            negative_prompt: "blurry, low quality, distorted, ugly, cartoon, anime",
            num_inference_steps: 30,
            guidance_scale: 7.5,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Image generation failed: ${error}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Image generation error:", error);
      throw error;
    }
  },

  // Generate pet skin condition reference image
  async generateSkinConditionImage(description: string): Promise<string> {
    const enhancedPrompt = `High quality professional veterinary medical photograph of dog skin showing: ${description}. Clinical photography, clear detail, well-lit, realistic, accurate medical documentation`;
    return this.generateImage(enhancedPrompt);
  },

  // Generate comparison reference image
  async generateHealthyReferenceImage(petType: string = "dog"): Promise<string> {
    const prompt = `High quality professional veterinary medical photograph of healthy ${petType} skin. Clean, normal, healthy fur and skin, clinical photography, well-lit, realistic`;
    return this.generateImage(prompt);
  }
};

// Direct DuckDuckGo image search via CORS proxy
export const pollinationsService = {
  async generateSkinConditionImageAsync(description: string): Promise<string> {
    try {
      // Skip DuckDuckGo due to CORS issues, use Pollinations directly
      return this.generateSkinConditionImage(description, 0);
    } catch (error) {
      console.error('Image generation error:', error);
      // Fallback to simple dog photo
      return this.getDogPhotoFallback(0);
    }
  },

  generateSkinConditionImage(description: string, index: number = 0): string {
    const enhancedPrompt = `close-up medical photograph of ${description} on dog skin, veterinary dermatology, clinical documentation, high detail, professional lighting, realistic medical photography`;
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&enhance=true&seed=${Date.now() + index}`;
  },

  generateHealthyReferenceImage(petType: string = "dog", index: number = 0): string {
    const prompt = `close-up medical photograph of healthy ${petType} skin and fur, normal condition, veterinary reference, clinical documentation, professional lighting, realistic`;
    const encodedPrompt = encodeURIComponent(prompt);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&enhance=true&seed=${Date.now() + index}`;
  },
  
  getDogPhotoFallback(index: number = 0): string {
    return `https://loremflickr.com/512/512/dog,pet?random=${Date.now() + index}`;
  }
};
