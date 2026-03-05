import { useState } from "react";
import { motion } from "framer-motion";
import { Dog, Cat, Bird, Rabbit, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";

const animals = [
  { id: "dog", name: "Dog", icon: Dog, color: "gradient-bark", description: "Bark emotion analysis" },
  { id: "cat", name: "Cat", icon: Cat, color: "gradient-primary", description: "Meow emotion analysis" },
  { id: "rooster", name: "Rooster", icon: Bird, color: "gradient-skin", description: "Crow emotion analysis" },
  { id: "pig", name: "Pig", icon: Rabbit, color: "gradient-poop", description: "Oink emotion analysis" },
  { id: "cow", name: "Cow", icon: Dog, color: "bg-amber-500", description: "Moo emotion analysis" },
  { id: "frog", name: "Frog", icon: Cat, color: "bg-green-500", description: "Croak emotion analysis" },
];

const AnimalSense = () => {
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);

  if (selectedAnimal) {
    return (
      <AppLayout title={`${animals.find(a => a.id === selectedAnimal)?.name} Sense`} showBack>
        <div className="px-4 py-6 max-w-lg mx-auto">
          <Button
            variant="ghost"
            onClick={() => setSelectedAnimal(null)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Animals
          </Button>
          
          <div className="text-center space-y-4">
            <div className={`w-20 h-20 rounded-2xl ${animals.find(a => a.id === selectedAnimal)?.color} flex items-center justify-center mx-auto shadow-glow-sm`}>
              {(() => {
                const Icon = animals.find(a => a.id === selectedAnimal)?.icon || Dog;
                return <Icon className="w-10 h-10 text-white" strokeWidth={2} />;
              })()}
            </div>
            <h2 className="text-2xl font-display font-bold">
              {animals.find(a => a.id === selectedAnimal)?.name} Emotion Detector
            </h2>
            <p className="text-muted-foreground">
              Analyze your {animals.find(a => a.id === selectedAnimal)?.name.toLowerCase()}'s vocalizations
            </p>
          </div>

          {/* Animal-specific analysis UI will go here */}
          <div className="mt-8 glass rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {animals.find(a => a.id === selectedAnimal)?.name} emotion analysis coming soon...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Animal Sense" showBack>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <h2 className="text-2xl font-display font-bold">Choose Your Animal</h2>
          <p className="text-muted-foreground text-sm">
            Select an animal to analyze their vocal emotions
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          {animals.map((animal, index) => {
            const Icon = animal.icon;
            return (
              <motion.button
                key={animal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedAnimal(animal.id)}
                className="glass rounded-2xl p-6 text-center space-y-3 hover:scale-105 transition-transform"
              >
                <div className={`w-16 h-16 rounded-xl ${animal.color} flex items-center justify-center mx-auto shadow-glow-sm`}>
                  <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">
                    {animal.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {animal.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default AnimalSense;
