
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PawPrint, AudioLines, ScanEye, Wind, Activity, LayoutDashboard, Plus, X, Sparkles, Phone } from "lucide-react";
import AnimatedBackground from "./AnimatedBackground";
import FooterCredits from "./FooterCredits";

const tabs = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home", gradient: "gradient-primary" },
  { to: "/bark-sense", icon: AudioLines, label: "Bark", gradient: "gradient-bark" },
  { to: "/skin-sense", icon: ScanEye, label: "Skin", gradient: "gradient-skin" },
  { to: "/air-sense", icon: Wind, label: "Air", gradient: "gradient-air" },
  { to: "/motion-sense", icon: Activity, label: "Motion", gradient: "gradient-motion" },
];

const AppLayout = ({ children, title, showBack }: { children: React.ReactNode; title?: string; showBack?: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAddDog, setShowAddDog] = useState(false);
  const [newDog, setNewDog] = useState({ name: "", age: "", breed: "" });
  
  const [dogs] = useState(() => {
    const stored = localStorage.getItem("dogs_profiles");
    return stored ? JSON.parse(stored) : [{
      id: "1",
      name: localStorage.getItem("dog_name") || "My Dog",
      age: "2 years",
      breed: "Mixed",
      photo: localStorage.getItem("dog_photo") || null
    }];
  });
  const [activeDogId] = useState(() => {
    return localStorage.getItem("active_dog_id") || dogs[0]?.id || "1";
  });
  
  const activeDog = dogs.find(d => d.id === activeDogId) || dogs[0];
  
  const breeds = [
    "Mixed Breed", "Labrador Retriever", "Golden Retriever", "German Shepherd", "Bulldog", "Poodle",
    "Labradoodle", "Goldendoodle", "French Bulldog", "Beagle", "Rottweiler", "Yorkshire Terrier"
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden mobile-container">
      <AnimatedBackground />

      {/* Top Header */}
      <header className="sticky top-0 z-40 glass-strong safe-top backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-16">
          {showBack ? (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-primary font-medium btn-squishy px-3 py-2 rounded-2xl hover:bg-primary/10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-display">Back</span>
            </motion.button>
          ) : (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-2xl gradient-primary shadow-glow-sm relative flex items-center justify-center shrink-0">
                <img 
                  src="/logo.png" 
                  alt="Pawsitive" 
                  className="w-[72px] h-[72px] object-contain" 
                />
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent z-10"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <h1 className="text-sm font-display font-bold text-gradient leading-none">Pawsitive</h1>
                <p className="text-[10px] text-muted-foreground font-medium">Diagnostics</p>
              </div>
            </Link>
          )}
          
          <div className="flex-1 flex justify-center">
            {title && (
              <h2 className="text-sm font-display font-bold text-foreground text-center leading-tight max-w-[140px]">
                {title}
              </h2>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <motion.a
              href="tel:1962"
              whileTap={{ scale: 0.95 }}
              className="relative glass px-3 py-2 rounded-xl btn-squishy border-2 border-red-500 bg-red-500/10 flex items-center gap-2 shadow-lg"
            >
              <motion.div
                className="absolute inset-0 rounded-xl bg-red-500/30"
                animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-display font-bold text-red-500 uppercase tracking-wider leading-none">SOS</p>
                  <p className="text-xs font-display font-bold text-foreground leading-none">1962</p>
                </div>
              </div>
            </motion.a>
            
            <Link to="/dog-profile" className="flex items-center gap-2 glass px-3 py-2 rounded-2xl btn-squishy">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-primary flex items-center justify-center">
              {activeDog?.photo ? (
                <img src={activeDog.photo} alt={activeDog.name} className="w-full h-full object-cover" />
              ) : (
                <PawPrint className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-display font-semibold text-foreground leading-none">{activeDog?.name}</p>
              <p className="text-[10px] text-muted-foreground">{activeDog?.breed}</p>
            </div>
          </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {children}
        <FooterCredits />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom mobile-container">
        <div className="glass-strong backdrop-blur-xl border-t-2 border-primary/10">
          <div className="flex items-center justify-around px-2 py-3">
            {tabs.map((tab) => {
              const active = location.pathname === tab.to || (tab.to === "/dashboard" && location.pathname === "/");
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className="relative flex flex-col items-center gap-1 btn-squishy"
                >
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    className={`relative ${
                      active
                        ? `${tab.gradient} w-14 h-14 rounded-2xl flex items-center justify-center shadow-glow`
                        : "w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center"
                    }`}
                  >
                    <tab.icon
                      className={active ? "w-6 h-6 text-white" : "w-5 h-5 text-muted-foreground"}
                      strokeWidth={active ? 2.5 : 2}
                    />
                  </motion.div>
                  <span
                    className={`text-[10px] font-display font-semibold ${
                      active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      
      <AnimatePresence>
        {showAddDog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddDog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-lifted"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Add New Dog
                </h3>
                <button
                  onClick={() => setShowAddDog(false)}
                  className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                placeholder="Dog name"
                value={newDog.name}
                onChange={(e) => setNewDog({ ...newDog, name: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-border focus:border-primary outline-none transition-colors text-sm font-body"
              />
              <select
                value={newDog.breed}
                onChange={(e) => setNewDog({ ...newDog, breed: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-border focus:border-primary outline-none transition-colors text-sm font-body"
              >
                <option value="">Select breed...</option>
                {breeds.map((breed) => (
                  <option key={breed} value={breed}>
                    {breed}
                  </option>
                ))}
              </select>
              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 gradient-primary text-white py-3 rounded-2xl font-display font-semibold btn-squishy shadow-glow-sm"
                >
                  Add Dog
                </button>
                <button
                  onClick={() => setShowAddDog(false)}
                  className="flex-1 bg-muted/50 py-3 rounded-2xl font-display font-semibold btn-squishy"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppLayout;
