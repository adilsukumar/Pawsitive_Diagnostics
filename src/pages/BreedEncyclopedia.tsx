import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, UtensilsCrossed, Brain, Heart, Sparkles, AlertTriangle, Dog, Thermometer, Home, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import { DOG_BREEDS } from "@/lib/dogBreeds";
import { aiServices } from "@/lib/aiServices";

interface BreedInfo {
  breed_name: string;
  history: string;
  physical: {
    size: string;
    weight: string;
    coat: string;
    colors: string[];
  };
  temperament: string;
  diet: {
    recommended: string[];
    avoid: string[];
    feeding_tips: string;
  };
  exercise: string;
  grooming: string;
  health: {
    lifespan: string;
    common_issues: string[];
    preventive_care: string;
  };
  living_conditions: {
    temperature: string;
    space: string;
    environment: string;
  };
  training: string;
  compatibility: {
    children: string;
    pets: string;
    strangers: string;
  };
  special_considerations: string[];
  fun_facts: string[];
}

const sectionAnim = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, type: "spring" as const, stiffness: 300, damping: 24 } }),
};

// Cache breed results in memory
const breedCache = new Map<string, BreedInfo>();

const BreedEncyclopedia = () => {
  const { toast } = useToast();
  const [breed, setBreed] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<BreedInfo | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = breed.trim().toLowerCase();
    if (!q || q.length < 1) return [];
    
    const queryWords = q.split(/\s+/).filter(w => w.length > 0);
    
    return DOG_BREEDS.filter((b) => {
      const breedLower = b.toLowerCase();
      // Check if ALL query words exist in breed name
      return queryWords.every(word => breedLower.includes(word));
    }).slice(0, 8);
  }, [breed]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = async (breedName?: string) => {
    const trimmed = (breedName || breed).trim();
    if (!trimmed) {
      toast({ title: "Enter a breed name", variant: "destructive" });
      return;
    }

    setShowSuggestions(false);
    if (breedName) setBreed(breedName);

    const cacheKey = trimmed.toLowerCase();
    if (breedCache.has(cacheKey)) {
      setInfo(breedCache.get(cacheKey)!);
      return;
    }

    setLoading(true);
    setInfo(null);
    try {
      // Try AI service first
      const data = await aiServices.getBreedInformation(trimmed);
      setInfo(data);
      breedCache.set(cacheKey, data);
      toast({ title: "Loaded breed info", description: "Showing comprehensive breed details" });
    } catch (e: any) {
      console.error(e);
      // Fallback with basic breed info
      const fallbackInfo: BreedInfo = {
        breed_name: trimmed,
        history: `The ${trimmed} is a popular dog breed with a rich history and loyal following among dog enthusiasts.`,
        physical: {
          size: "Medium to Large",
          weight: "25-75 lbs",
          coat: "Double coat, weather-resistant",
          colors: ["Various colors"]
        },
        temperament: "Friendly, loyal, and intelligent. Makes an excellent family companion with proper training and socialization.",
        diet: {
          recommended: ["High-quality dry kibble", "Lean proteins", "Vegetables", "Omega-3 supplements"],
          avoid: ["Chocolate", "Grapes", "Onions", "Excessive treats"],
          feeding_tips: "Feed 2-3 meals daily based on age and activity level. Always provide fresh water."
        },
        exercise: "Requires daily exercise including walks, playtime, and mental stimulation. 30-60 minutes of activity recommended.",
        grooming: "Regular brushing 2-3 times per week. Professional grooming every 6-8 weeks. Regular nail trims and dental care.",
        health: {
          lifespan: "10-15 years",
          common_issues: ["Hip dysplasia", "Eye conditions", "Allergies"],
          preventive_care: "Regular vet checkups, vaccinations, and preventive treatments for parasites."
        },
        living_conditions: {
          temperature: "Moderate climates preferred",
          space: "House with yard ideal",
          environment: "Adaptable to various living situations with adequate exercise"
        },
        training: "Intelligent and trainable. Responds well to positive reinforcement. Early socialization recommended.",
        compatibility: {
          children: "Good with children when properly socialized",
          pets: "Can get along with other pets with proper introduction",
          strangers: "May be reserved but generally friendly"
        },
        special_considerations: ["Regular exercise is essential", "Needs mental stimulation", "Benefits from consistent training"],
        fun_facts: ["Popular family companion", "Known for loyalty and intelligence", "Adaptable to various lifestyles"]
      };
      setInfo(fallbackInfo);
      breedCache.set(cacheKey, fallbackInfo);
      toast({ title: "Using basic breed info", description: "AI service unavailable, showing general information.", variant: "default" });
    } finally {
      setLoading(false);
    }
  };

  const selectBreed = (b: string) => {
    setBreed(b);
    setShowSuggestions(false);
    handleSearch(b);
  };

  return (
    <AppLayout title="Breed Encyclopedia" showBack>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-5 min-h-full pb-32">
        {/* Search with autocomplete */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={breed}
                onChange={(e) => {
                  setBreed(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => breed.trim().length > 0 && setShowSuggestions(true)}
                placeholder="e.g. Golden Retriever, Husky..."
                className="rounded-xl h-12 text-sm glass border-glass-border font-body"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setShowSuggestions(false);
                    handleSearch();
                  }
                }}
                maxLength={100}
              />

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    ref={suggestionsRef}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 top-full left-0 right-0 mt-1 glass rounded-xl border border-border overflow-hidden shadow-lg"
                  >
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => selectBreed(s)}
                        className="w-full text-left px-4 py-2.5 text-sm font-body text-foreground hover:bg-primary/10 transition-colors flex items-center gap-2"
                      >
                        <Dog className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              onClick={() => handleSearch()}
              disabled={loading}
              className="gradient-primary text-primary-foreground rounded-xl h-12 px-5 btn-squishy shadow-glow-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </Button>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 gap-3"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-body">Fetching breed information...</p>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {info && !loading && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Header */}
              <motion.div custom={0} variants={sectionAnim} initial="hidden" animate="show" className="glass rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow-sm">
                    <Dog className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h2 className="font-display font-bold text-foreground text-lg tracking-tight">{info.breed_name}</h2>
                </div>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{info.history}</p>
              </motion.div>

              {/* Physical */}
              <motion.div custom={1} variants={sectionAnim} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Dog className="w-5 h-5 text-blue-400" />
                  <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">Physical Characteristics</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Size:</span> <span className="text-foreground font-medium">{info.physical.size}</span></div>
                  <div><span className="text-muted-foreground">Weight:</span> <span className="text-foreground font-medium">{info.physical.weight}</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Coat:</span> <span className="text-foreground font-medium">{info.physical.coat}</span></div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {info.physical.colors.map((c, i) => (
                    <span key={i} className="text-xs font-body bg-blue-500/10 text-blue-300 px-2.5 py-1 rounded-lg">{c}</span>
                  ))}
                </div>
              </motion.div>

              {/* Temperament */}
              <motion.div custom={2} variants={sectionAnim} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-violet-400" />
                  <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">Temperament</h3>
                </div>
                <p className="text-sm text-muted-foreground font-body">{info.temperament}</p>
              </motion.div>

              {/* Diet */}
              <motion.div custom={3} variants={sectionAnim} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">Diet & Nutrition</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-body font-semibold text-emerald-400 uppercase tracking-wider mb-1">✅ Recommended</p>
                    <div className="flex flex-wrap gap-1.5">
                      {info.diet.recommended.map((f, i) => (
                        <span key={i} className="text-xs font-body bg-emerald-500/10 text-emerald-300 px-2.5 py-1 rounded-lg">{f}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-body font-semibold text-red-400 uppercase tracking-wider mb-1">❌ Avoid</p>
                    <div className="flex flex-wrap gap-1.5">
                      {info.diet.avoid.map((f, i) => (
                        <span key={i} className="text-xs font-body bg-red-500/10 text-red-300 px-2.5 py-1 rounded-lg">{f}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-body mt-1">{info.diet.feeding_tips}</p>
                </div>
              </motion.div>

              {/* Exercise & Grooming */}
              <motion.div custom={4} variants={sectionAnim} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-400" />
                  <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">Care & Activity</h3>
                </div>
                <div>
                  <p className="text-xs font-body font-semibold text-pink-400 uppercase tracking-wider">Exercise</p>
                  <p className="text-sm text-muted-foreground font-body">{info.exercise}</p>
                </div>
                <div>
                  <p className="text-xs font-body font-semibold text-pink-400 uppercase tracking-wider">Grooming</p>
                  <p className="text-sm text-muted-foreground font-body">{info.grooming}</p>
                </div>
              </motion.div>

              {/* Health */}
              <motion.div custom={5} variants={sectionAnim} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">Health Info</h3>
                </div>
                <p className="text-sm text-muted-foreground font-body">Lifespan: <span className="text-foreground font-medium">{info.health.lifespan}</span></p>
                <div className="flex flex-wrap gap-1.5">
                  {info.health.common_issues.map((c, i) => (
                    <span key={i} className="text-xs font-body bg-amber-500/10 text-amber-300 px-2.5 py-1 rounded-lg">{c}</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-body">{info.health.preventive_care}</p>
              </motion.div>

              {/* Living Conditions */}
              <motion.div custom={6} variants={sectionAnim} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">Living Conditions</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Temperature:</span> <span className="text-foreground font-medium">{info.living_conditions.temperature}</span></div>
                  <div><span className="text-muted-foreground">Space:</span> <span className="text-foreground font-medium">{info.living_conditions.space}</span></div>
                  <div><span className="text-muted-foreground">Environment:</span> <span className="text-foreground font-medium">{info.living_conditions.environment}</span></div>
                </div>
              </motion.div>

              {/* Training */}
              <motion.div custom={7} variants={sectionAnim} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">Training</h3>
                </div>
                <p className="text-sm text-muted-foreground font-body">{info.training}</p>
              </motion.div>

              {/* Compatibility */}
              <motion.div custom={8} variants={sectionAnim} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">Compatibility</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Children:</span> <span className="text-foreground font-medium">{info.compatibility.children}</span></div>
                  <div><span className="text-muted-foreground">Other Pets:</span> <span className="text-foreground font-medium">{info.compatibility.pets}</span></div>
                  <div><span className="text-muted-foreground">Strangers:</span> <span className="text-foreground font-medium">{info.compatibility.strangers}</span></div>
                </div>
              </motion.div>

              {/* Special Considerations */}
              {info.special_considerations.length > 0 && (
                <motion.div custom={9} variants={sectionAnim} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">Special Considerations</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {info.special_considerations.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground font-body flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Fun Facts */}
              {info.fun_facts.length > 0 && (
                <motion.div custom={10} variants={sectionAnim} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">Fun Facts</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {info.fun_facts.map((f, i) => (
                      <li key={i} className="text-sm text-muted-foreground font-body flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!info && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center py-16 gap-3 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Dog className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground font-body max-w-xs">
              Search any dog breed to get comprehensive information powered by Gemini AI!
            </p>
            <p className="text-xs text-muted-foreground/60 font-body">
              {DOG_BREEDS.length}+ breeds available
            </p>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default BreedEncyclopedia;
