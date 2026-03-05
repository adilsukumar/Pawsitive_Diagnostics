import { useState } from "react";
import { Camera, Sparkles, Upload, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { aiServices, extractAudioFeatures, imageGeneration } from "@/lib/aiServices";

interface DiagnosisScenario {
  condition: string;
  description: string;
  imageUrl: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  urgency: 'Monitor' | 'Schedule Vet' | 'Urgent Care' | 'Emergency';
  causes: string[];
  symptoms: string[];
  effects: string[];
  prevention: string[];
  firstAid: string[];
  vetTreatment: string;
  prognosis: string;
  commonBreeds: string[];
  riskFactors: string[];
  complications: string[];
  diagnosticTests: string[];
  homeRemedies: string[];
  whenToWorry: string[];
  recoveryTime: string;
  cost: string;
  contagious: boolean;
  ageGroups: string[];
  seasonality: string;
}

const ImageWithLoader = ({ src, alt, className, fallbackText, index = 0 }: { src: string; alt: string; className?: string; fallbackText?: string; index?: number }) => {
  const [loading, setLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);

  const handleError = () => {
    setLoading(false);
    if (retryCount === 0) {
      // First fallback: LoremFlickr dog photos
      setImgSrc(`https://loremflickr.com/512/512/dog,pet?random=${Date.now() + index}`);
      setRetryCount(1);
      setLoading(true);
    } else if (retryCount === 1) {
      // Second fallback: Picsum random
      setImgSrc(`https://picsum.photos/seed/${Date.now() + index}/512/512`);
      setRetryCount(2);
      setLoading(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`w-full rounded-xl ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        onLoad={() => setLoading(false)}
        onError={handleError}
        crossOrigin="anonymous"
      />
    </div>
  );
};

const SkinSenseEnhanced = () => {
  const { toast } = useToast();
  
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  
  // Results
  const [hasImage, setHasImage] = useState(false);
  const [scenarios, setScenarios] = useState<DiagnosisScenario[]>([]);
  const [singleDiagnosis, setSingleDiagnosis] = useState<{ condition: string; analysis: string; imageUrl: string } | null>(null);
  const [comparisonResult, setComparisonResult] = useState<{ userImage: string; refImage: string; analysis: string } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(file);
      setUploadedPreview(reader.result as string);
      setHasImage(true);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!uploadedImage && !description.trim()) {
      toast({ title: "Input required", description: "Upload an image or describe the condition", variant: "destructive" });
      return;
    }

    setAnalyzing(true);
    setScenarios([]);
    setSingleDiagnosis(null);
    setComparisonResult(null);

    try {
      // Case 1: User uploaded image
      if (uploadedImage) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(uploadedImage);
        });

        // Analyze the uploaded image
        const analysis = await aiServices.analyzeSkinImage(base64, description || "Analyze this dog skin condition");
        
        setComparisonResult({
          userImage: uploadedPreview!,
          refImage: '', // No reference image
          analysis: analysis,
        });

        toast({ title: "✅ Image Analysis Complete", description: "Photo analyzed by veterinary AI" });
      }
      // Case 2: User only described (no image)
      else {
        try {
          const analysis = await aiServices.analyzeTextDescription(description);
          
          const condition = description.substring(0, 50);
          
          setSingleDiagnosis({ condition, analysis, imageUrl: '' });
          toast({ title: "✅ Text Analysis Complete", description: "Description analyzed by veterinary AI" });
        } catch (error) {
          // Fallback analysis if AI fails
          const condition = description.substring(0, 50);
          const fallbackAnalysis = `📝 **CONDITION ASSESSMENT:** ${condition}

📊 **CONFIDENCE LEVEL:** Medium - Based on description, requires visual examination

🎯 **KEY INDICATORS:**
• Skin condition described by owner
• Possible irritation or discomfort
• May require professional evaluation

⚡ **IMMEDIATE ACTIONS:**
• Document with photos if possible
• Keep area clean and dry
• Monitor for changes
• Prevent scratching or licking

🏥 **VETERINARY CONSULTATION:**
• Schedule appointment within 24-48 hours
• Describe symptoms and duration to vet
• Ask about diagnostic tests needed

📋 **ADDITIONAL INFORMATION NEEDED:**
• Take clear photos of affected areas
• Note when symptoms started
• Track any changes in condition`;
          
          setSingleDiagnosis({ condition, analysis: fallbackAnalysis, imageUrl: '' });
          toast({ title: "✅ Analysis complete", description: "Basic assessment provided" });
        }
      }
    } catch (error: any) {
      toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setUploadedPreview(null);
    setDescription("");
    setHasImage(false);
    setScenarios([]);
    setSingleDiagnosis(null);
    setComparisonResult(null);
    
    // Force reset the file input by finding it and clearing its value
    setTimeout(() => {
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input: any) => {
        input.value = '';
        input.files = null;
      });
    }, 0);
  };

  return (
    <AppLayout title="SkinSense AI" showBack>
      <div className="px-4 py-6 min-h-full space-y-4 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mx-auto shadow-lg mb-3">
            <Camera className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">SkinSense AI</h1>
          <p className="text-gray-800 text-sm">Upload photo or describe condition</p>
        </motion.div>

        {/* Input Card */}
        <Card className="p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">Upload Photo (Optional)</label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="mb-2"
            />
            {uploadedPreview && (
              <img src={uploadedPreview} alt="Uploaded" className="w-full rounded-xl mt-2" />
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">
              {hasImage ? "Additional Notes (Optional)" : "Describe Condition"}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={hasImage 
                ? "Add any additional details about the condition..." 
                : "Describe the skin condition... e.g., 'red patches on belly with hair loss and itching'"}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAnalyze}
              disabled={analyzing || (!uploadedImage && !description.trim())}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl"
            >
              {analyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Analyze with AI</>
              )}
            </Button>
            {(uploadedImage || description || scenarios.length > 0 || singleDiagnosis || comparisonResult) && (
              <Button onClick={handleReset} variant="outline" className="rounded-xl">
                Reset
              </Button>
            )}
          </div>
        </Card>

        {/* Results: Image Upload Case */}
        {comparisonResult && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-pink-500" />
                Photo Analysis Results
              </h3>
              
              <div className="mb-4">
                <img src={comparisonResult.userImage} alt="User" className="w-full rounded-xl" />
              </div>

              <div className="bg-pink-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Veterinary AI Analysis</h4>
                <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: comparisonResult.analysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br/>') }} />
              </div>
            </Card>
          </motion.div>
        )}

        {/* Results: Multiple Scenarios (Vague Description) */}
        {scenarios.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h3 className="font-semibold text-gray-900 text-lg">Possible Conditions:</h3>
            {scenarios.map((scenario, idx) => (
              <Card key={idx} className="p-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h4 className="font-bold text-gray-900 text-xl">{scenario.condition}</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      scenario.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                      scenario.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                      scenario.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {scenario.severity} Severity
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      scenario.urgency === 'Emergency' ? 'bg-red-100 text-red-800' :
                      scenario.urgency === 'Urgent Care' ? 'bg-orange-100 text-orange-800' :
                      scenario.urgency === 'Schedule Vet' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {scenario.urgency}
                    </span>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-gray-700 text-sm leading-relaxed">{scenario.description}</p>
                
                {/* Reference Image */}
                <div className="w-full">
                  <ImageWithLoader 
                    src={scenario.imageUrl} 
                    alt={`Reference image for ${scenario.condition}`}
                    className="w-full h-64 object-cover rounded-lg"
                    index={idx}
                  />
                </div>
                
                {/* Medical Information Grid */}
                <div className="space-y-4">
                  {/* Row 1: Causes & Symptoms */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-lg p-4">
                      <h5 className="font-semibold text-red-800 text-sm mb-3 flex items-center gap-2">
                        🔍 <span>Causes</span>
                      </h5>
                      <ul className="text-xs text-red-700 space-y-1.5">
                        {scenario.causes.map((cause, i) => <li key={i} className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span><span>{cause}</span></li>)}
                      </ul>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h5 className="font-semibold text-orange-800 text-sm mb-3 flex items-center gap-2">
                        ⚠️ <span>Symptoms</span>
                      </h5>
                      <ul className="text-xs text-orange-700 space-y-1.5">
                        {scenario.symptoms.map((symptom, i) => <li key={i} className="flex items-start gap-2"><span className="text-orange-500 mt-0.5">•</span><span>{symptom}</span></li>)}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Row 2: Effects & Prevention */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h5 className="font-semibold text-purple-800 text-sm mb-3 flex items-center gap-2">
                        💔 <span>Effects on Dog</span>
                      </h5>
                      <ul className="text-xs text-purple-700 space-y-1.5">
                        {scenario.effects.map((effect, i) => <li key={i} className="flex items-start gap-2"><span className="text-purple-500 mt-0.5">•</span><span>{effect}</span></li>)}
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <h5 className="font-semibold text-green-800 text-sm mb-3 flex items-center gap-2">
                        🛡️ <span>Prevention</span>
                      </h5>
                      <ul className="text-xs text-green-700 space-y-1.5">
                        {scenario.prevention.map((prev, i) => <li key={i} className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span><span>{prev}</span></li>)}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Row 3: First Aid (Full Width) */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-800 text-sm mb-3 flex items-center gap-2">
                      🚑 <span>First Aid (Until Vet Visit)</span>
                    </h5>
                    <ul className="text-xs text-blue-700 space-y-1.5">
                      {scenario.firstAid.map((aid, i) => <li key={i} className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span><span>{aid}</span></li>)}
                    </ul>
                  </div>
                  
                  {/* Row 4: Treatment, Prognosis & Breeds */}
                  <div className="space-y-4">
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h5 className="font-semibold text-indigo-800 text-sm mb-3 flex items-center gap-2">
                        💊 <span>Veterinary Treatment</span>
                      </h5>
                      <p className="text-xs text-indigo-700 leading-relaxed">{scenario.vetTreatment}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-teal-50 rounded-lg p-4">
                        <h5 className="font-semibold text-teal-800 text-sm mb-3 flex items-center gap-2">
                          📈 <span>Prognosis</span>
                        </h5>
                        <p className="text-xs text-teal-700 leading-relaxed">{scenario.prognosis}</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                          🐕 <span>Commonly Affected Breeds</span>
                        </h5>
                        <p className="text-xs text-gray-700 leading-relaxed">{scenario.commonBreeds.join(", ")}</p>
                      </div>
                    </div>
                    
                    {/* Row 5: Additional Parameters */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-amber-50 rounded-lg p-4">
                        <h5 className="font-semibold text-amber-800 text-sm mb-3 flex items-center gap-2">
                          ⚠️ <span>Risk Factors</span>
                        </h5>
                        <ul className="text-xs text-amber-700 space-y-1.5">
                          {scenario.riskFactors.map((risk, i) => <li key={i} className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span><span>{risk}</span></li>)}
                        </ul>
                      </div>
                      
                      <div className="bg-red-50 rounded-lg p-4">
                        <h5 className="font-semibold text-red-800 text-sm mb-3 flex items-center gap-2">
                          🚨 <span>Possible Complications</span>
                        </h5>
                        <ul className="text-xs text-red-700 space-y-1.5">
                          {scenario.complications.map((comp, i) => <li key={i} className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span><span>{comp}</span></li>)}
                        </ul>
                      </div>
                    </div>
                    
                    {/* Row 6: Diagnostic & Home Care */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-cyan-50 rounded-lg p-4">
                        <h5 className="font-semibold text-cyan-800 text-sm mb-3 flex items-center gap-2">
                          🔬 <span>Diagnostic Tests</span>
                        </h5>
                        <ul className="text-xs text-cyan-700 space-y-1.5">
                          {scenario.diagnosticTests.map((test, i) => <li key={i} className="flex items-start gap-2"><span className="text-cyan-500 mt-0.5">•</span><span>{test}</span></li>)}
                        </ul>
                      </div>
                      
                      <div className="bg-lime-50 rounded-lg p-4">
                        <h5 className="font-semibold text-lime-800 text-sm mb-3 flex items-center gap-2">
                          🏠 <span>Home Remedies (Vet Approved)</span>
                        </h5>
                        <ul className="text-xs text-lime-700 space-y-1.5">
                          {scenario.homeRemedies.map((remedy, i) => <li key={i} className="flex items-start gap-2"><span className="text-lime-500 mt-0.5">•</span><span>{remedy}</span></li>)}
                        </ul>
                      </div>
                    </div>
                    
                    {/* Row 7: Warning Signs */}
                    <div className="bg-rose-50 rounded-lg p-4">
                      <h5 className="font-semibold text-rose-800 text-sm mb-3 flex items-center gap-2">
                        🚩 <span>When to Seek Emergency Care</span>
                      </h5>
                      <ul className="text-xs text-rose-700 space-y-1.5">
                        {scenario.whenToWorry.map((warning, i) => <li key={i} className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">•</span><span>{warning}</span></li>)}
                      </ul>
                    </div>
                    
                    {/* Row 8: Additional Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h5 className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2">
                          ⏱️ <span>Recovery Time</span>
                        </h5>
                        <p className="text-xs text-slate-700">{scenario.recoveryTime}</p>
                      </div>
                      
                      <div className="bg-emerald-50 rounded-lg p-4">
                        <h5 className="font-semibold text-emerald-800 text-sm mb-2 flex items-center gap-2">
                          💰 <span>Treatment Cost</span>
                        </h5>
                        <p className="text-xs text-emerald-700">{scenario.cost}</p>
                      </div>
                      
                      <div className="bg-violet-50 rounded-lg p-4">
                        <h5 className="font-semibold text-violet-800 text-sm mb-2 flex items-center gap-2">
                          🦠 <span>Contagious</span>
                        </h5>
                        <p className="text-xs text-violet-700">{scenario.contagious ? 'Yes - isolate from other pets' : 'No - not contagious'}</p>
                      </div>
                    </div>
                    
                    {/* Row 9: Demographics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-pink-50 rounded-lg p-4">
                        <h5 className="font-semibold text-pink-800 text-sm mb-2 flex items-center gap-2">
                          🎂 <span>Age Groups Affected</span>
                        </h5>
                        <p className="text-xs text-pink-700">{scenario.ageGroups.join(' • ')}</p>
                      </div>
                      
                      <div className="bg-sky-50 rounded-lg p-4">
                        <h5 className="font-semibold text-sky-800 text-sm mb-2 flex items-center gap-2">
                          🌤️ <span>Seasonal Pattern</span>
                        </h5>
                        <p className="text-xs text-sky-700">{scenario.seasonality}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Results: Single Diagnosis (Text Description) */}
        {singleDiagnosis && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
                Text Analysis Results
              </h3>
              
              <div className="bg-pink-50 rounded-xl p-4">
                <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: singleDiagnosis.analysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br/>') }} />
              </div>
            </Card>
          </motion.div>
        )}

        {/* Info */}
        <div className="bg-blue-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">How it works</h3>
          <ul className="space-y-1 text-xs text-gray-800">
            <li>📸 <strong>Upload photo:</strong> AI analyzes your dog's skin condition with Gemini 1.5 Pro</li>
            <li>📝 <strong>Describe condition:</strong> Provides detailed diagnosis based on your description</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
};

export default SkinSenseEnhanced;
