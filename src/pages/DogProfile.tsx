import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, PawPrint, Save, Loader2, Dog, Trash2, Plus, Check, Users, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import { DOG_BREEDS } from "@/lib/dogBreeds";
import { DogDataManager } from "@/lib/dogDataManager";
import { useNavigate } from "react-router-dom";

const DogProfile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddDog, setShowAddDog] = useState(false);
  
  const [dogs, setDogs] = useState(() => {
    const stored = localStorage.getItem("dogs_profiles");
    return stored ? JSON.parse(stored) : [{
      id: "1",
      name: "My Dog",
      nickname: "",
      breed: "Mixed Breed",
      age: "2",
      gender: "Male",
      weight: "",
      color: "",
      photo: null
    }];
  });
  
  const [activeDogId, setActiveDogId] = useState(() => {
    return localStorage.getItem("active_dog_id") || dogs[0]?.id || "1";
  });
  
  const currentDog = dogs.find((d: any) => d.id === activeDogId) || dogs[0];

  const [name, setName] = useState(currentDog.name || "");
  const [nickname, setNickname] = useState(currentDog.nickname || "");
  const [breed, setBreed] = useState(currentDog.breed || "");
  const [customBreed, setCustomBreed] = useState("");
  const [showCustomBreed, setShowCustomBreed] = useState(false);
  const [age, setAge] = useState(currentDog.age || "");
  const [gender, setGender] = useState(currentDog.gender || "Male");
  const [weight, setWeight] = useState(currentDog.weight || "");
  const [color, setColor] = useState(currentDog.color || "");
  const [photo, setPhoto] = useState<string | null>(currentDog.photo);
  const [showBreedSuggestions, setShowBreedSuggestions] = useState(false);
  const breedInputRef = useRef<HTMLInputElement>(null);

  const breedSuggestions = useMemo(() => {
    const q = breed.trim().toLowerCase();
    if (!q || q.length < 1) return [];
    
    const queryWords = q.split(/\s+/).filter(w => w.length > 0);
    
    return DOG_BREEDS.filter((b) => {
      const breedLower = b.toLowerCase();
      // Check if ALL query words exist in breed name
      return queryWords.every(word => breedLower.includes(word));
    }).slice(0, 10);
  }, [breed]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSave = () => {
    setSaving(true);
    const finalBreed = showCustomBreed && customBreed ? customBreed : breed;
    const updatedDogs = dogs.map((dog: any) => 
      dog.id === activeDogId 
        ? { ...dog, name, nickname, breed: finalBreed, age, gender, weight, color, photo }
        : dog
    );
    localStorage.setItem("dogs_profiles", JSON.stringify(updatedDogs));
    setDogs(updatedDogs);
    setTimeout(() => {
      setSaving(false);
      toast({ title: "Profile saved", description: `${name || "Your dog"}'s profile has been updated.` });
    }, 500);
  };

  const handleDelete = () => {
    if (dogs.length === 1) {
      toast({ title: "Cannot delete", description: "You must have at least one dog profile.", variant: "destructive" });
      return;
    }
    DogDataManager.clearDogData(activeDogId);
    const updatedDogs = dogs.filter((dog: any) => dog.id !== activeDogId);
    localStorage.setItem("dogs_profiles", JSON.stringify(updatedDogs));
    localStorage.setItem("active_dog_id", updatedDogs[0].id);
    setDogs(updatedDogs);
    setActiveDogId(updatedDogs[0].id);
    toast({ title: "Dog deleted", description: `${name}'s profile has been removed.` });
    setShowDeleteConfirm(false);
  };

  const switchDog = (id: string) => {
    const dog = dogs.find((d: any) => d.id === id);
    if (!dog) return;
    setActiveDogId(id);
    localStorage.setItem("active_dog_id", id);
    setName(dog.name);
    setNickname(dog.nickname || "");
    setBreed(dog.breed);
    setAge(dog.age);
    setGender(dog.gender || "Male");
    setWeight(dog.weight || "");
    setColor(dog.color || "");
    setPhoto(dog.photo);
    toast({ title: "Switched profile", description: `Now viewing ${dog.name}'s profile` });
  };

  const addNewDog = () => {
    const newDog = {
      id: Date.now().toString(),
      name: "New Dog",
      nickname: "",
      breed: "Mixed Breed",
      age: "1",
      gender: "Male",
      weight: "",
      color: "",
      photo: null
    };
    const updatedDogs = [...dogs, newDog];
    localStorage.setItem("dogs_profiles", JSON.stringify(updatedDogs));
    setDogs(updatedDogs);
    switchDog(newDog.id);
    setShowAddDog(false);
    toast({ title: "Dog added", description: "New dog profile created!" });
  };

  return (
    <AppLayout title="Dog Profile" showBack>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        
        {/* Profile Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              My Dogs ({dogs.length})
            </h3>
            <button
              onClick={() => setShowAddDog(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold btn-squishy"
            >
              <Plus className="w-3 h-3" />
              Add Dog
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {dogs.map((dog: any) => (
              <motion.button
                key={dog.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => switchDog(dog.id)}
                className={`relative p-3 rounded-2xl transition-all ${
                  dog.id === activeDogId
                    ? "gradient-primary shadow-glow"
                    : "glass hover:bg-muted/50"
                }`}
              >
                <div className={`w-full aspect-square rounded-xl overflow-hidden mb-2 ${
                  dog.id === activeDogId ? "ring-2 ring-white" : ""
                }`}>
                  {dog.photo ? (
                    <img src={dog.photo} alt={dog.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${
                      dog.id === activeDogId ? "bg-white/20" : "bg-muted"
                    }`}>
                      <PawPrint className={`w-6 h-6 ${
                        dog.id === activeDogId ? "text-white" : "text-muted-foreground"
                      }`} />
                    </div>
                  )}
                </div>
                <p className={`text-xs font-display font-semibold truncate ${
                  dog.id === activeDogId ? "text-white" : "text-foreground"
                }`}>
                  {dog.name}
                </p>
                {dog.id === activeDogId && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary" strokeWidth={3} />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Profile Photo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => fileRef.current?.click()}
            className="relative w-32 h-32 rounded-3xl ring-4 ring-primary/20 overflow-hidden cursor-pointer group shadow-glow"
          >
            {photo ? (
              <img src={photo} alt="Dog profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-primary flex items-center justify-center">
                <PawPrint className="w-12 h-12 text-white" strokeWidth={2} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
          </motion.div>
          <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoSelect} />
          <button onClick={() => fileRef.current?.click()} className="text-sm text-primary font-display font-semibold mt-3 btn-squishy">
            {photo ? "Change Photo" : "Add Photo"}
          </button>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label className="text-foreground font-display font-semibold">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Buddy, Max, Luna..."
              className="rounded-2xl h-12 text-sm glass border-2 border-border focus:border-primary font-body"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-foreground font-display font-semibold">Nickname (Optional)</Label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Buddy Boy, Princess..."
              className="rounded-2xl h-12 text-sm glass border-2 border-border focus:border-primary font-body"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-foreground font-display font-semibold">Gender</Label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-2xl h-12 text-sm glass border-2 border-border focus:border-primary font-body px-4 bg-background"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-foreground font-display font-semibold">Age (years)</Label>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 3"
                className="rounded-2xl h-12 text-sm glass border-2 border-border focus:border-primary font-body"
              />
            </div>
          </div>
          
          <div className="space-y-2 relative">
            <Label className="text-foreground font-display font-semibold">Breed</Label>
            <Input
              ref={breedInputRef}
              value={breed}
              onChange={(e) => {
                const value = e.target.value;
                setBreed(value);
                setShowBreedSuggestions(true);
                if (value === "Others (Specify Below)") {
                  setShowCustomBreed(true);
                } else {
                  setShowCustomBreed(false);
                }
              }}
              onFocus={() => breed.trim().length > 0 && setShowBreedSuggestions(true)}
              placeholder="e.g. Golden Retriever, Labradoodle..."
              className="rounded-2xl h-12 text-sm glass border-2 border-border focus:border-primary font-body"
            />
            
            <AnimatePresence>
              {showBreedSuggestions && breedSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute z-50 top-full left-0 right-0 mt-2 glass-strong rounded-2xl border-2 border-border overflow-hidden shadow-lifted max-h-48 overflow-y-auto"
                >
                  {breedSuggestions.map((b) => (
                    <button
                      key={b}
                      onClick={() => {
                        setBreed(b);
                        setShowBreedSuggestions(false);
                        if (b === "Others (Specify Below)") {
                          setShowCustomBreed(true);
                        } else {
                          setShowCustomBreed(false);
                        }
                      }}
                      className="w-full text-left px-4 py-3 text-sm font-body text-foreground hover:bg-primary/10 transition-colors flex items-center gap-2"
                    >
                      <Dog className="w-4 h-4 text-primary" />
                      {b}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {showCustomBreed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <Label className="text-foreground font-display font-semibold">Specify Breed</Label>
              <Input
                value={customBreed}
                onChange={(e) => setCustomBreed(e.target.value)}
                placeholder="Enter your dog's breed..."
                className="rounded-2xl h-12 text-sm glass border-2 border-primary focus:border-primary font-body"
              />
            </motion.div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-foreground font-display font-semibold">Weight (kg)</Label>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 25"
                className="rounded-2xl h-12 text-sm glass border-2 border-border focus:border-primary font-body"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-foreground font-display font-semibold">Color</Label>
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Brown, Black"
                className="rounded-2xl h-12 text-sm glass border-2 border-border focus:border-primary font-body"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full gradient-primary text-white rounded-2xl h-12 text-sm font-display font-bold btn-squishy shadow-glow"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            Save Profile
          </Button>
          
          {dogs.length > 1 && (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="outline"
              className="w-full border-2 border-destructive/30 text-destructive hover:bg-destructive/10 rounded-2xl h-12 text-sm font-display font-bold"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete This Dog
            </Button>
          )}
        </motion.div>
        
        {/* Delete Confirmation */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-strong rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-lifted"
              >
                <h3 className="font-display font-bold text-foreground text-lg">Delete {name}?</h3>
                <p className="text-muted-foreground text-sm font-body">
                  This will permanently delete {name}'s profile and all health data.
                </p>
                <div className="flex gap-3">
                  <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" className="flex-1 rounded-2xl">
                    Cancel
                  </Button>
                  <Button onClick={handleDelete} variant="destructive" className="flex-1 rounded-2xl">
                    Delete
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Dog Modal */}
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
                <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Add New Dog
                </h3>
                <p className="text-muted-foreground text-sm font-body">
                  Create a new profile to track another dog's health.
                </p>
                <div className="flex gap-3">
                  <Button onClick={() => setShowAddDog(false)} variant="outline" className="flex-1 rounded-2xl">
                    Cancel
                  </Button>
                  <Button onClick={addNewDog} className="flex-1 gradient-primary text-white rounded-2xl shadow-glow">
                    Add Dog
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default DogProfile;
