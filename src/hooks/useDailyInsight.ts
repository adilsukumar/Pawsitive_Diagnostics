import { useState, useEffect, useCallback } from "react";

interface DailyInsight {
  title: string;
  fact: string;
  emoji: string;
}

const LOCAL_INSIGHTS: DailyInsight[] = [
  { title: "Stay Active!", fact: "Regular walks and a balanced diet keep your dog healthy. Monitor any changes in behavior early for best outcomes.", emoji: "🐾" },
  { title: "Hydration Matters", fact: "Dogs need fresh water daily. Dehydration can cause serious health issues. Check water bowl regularly.", emoji: "💧" },
  { title: "Dental Health", fact: "80% of dogs show signs of dental disease by age 3. Regular teeth brushing prevents infections.", emoji: "🦷" },
  { title: "Exercise Time", fact: "Most dogs need 30-120 minutes of exercise daily depending on breed and age. Mental stimulation is equally important.", emoji: "🏃" },
  { title: "Nutrition Check", fact: "Quality dog food should list meat as the first ingredient. Avoid foods with excessive fillers or artificial additives.", emoji: "🍖" },
  { title: "Grooming Routine", fact: "Regular grooming prevents matting, skin issues, and helps you spot health problems early.", emoji: "✂️" },
  { title: "Vet Visits", fact: "Annual vet checkups catch problems early. Senior dogs (7+) should visit twice yearly.", emoji: "🏥" },
  { title: "Puppy Socialization", fact: "The critical socialization period for puppies is 3-14 weeks. Early positive experiences shape lifelong behavior.", emoji: "🐶" },
  { title: "Temperature Awareness", fact: "Dogs can overheat quickly. Never leave pets in hot cars, even with windows cracked.", emoji: "🌡️" },
  { title: "Toxic Foods", fact: "Chocolate, grapes, onions, and xylitol are toxic to dogs. Keep human food out of reach.", emoji: "⚠️" },
  { title: "Parasite Prevention", fact: "Monthly flea, tick, and heartworm prevention is essential for your dog's health year-round.", emoji: "🛡️" },
  { title: "Weight Management", fact: "Over 50% of dogs are overweight. Maintain healthy weight to prevent diabetes and joint issues.", emoji: "⚖️" },
  { title: "Mental Stimulation", fact: "Puzzle toys and training sessions keep your dog's mind sharp and prevent destructive behavior.", emoji: "🧩" },
  { title: "Sleep Needs", fact: "Adult dogs sleep 12-14 hours daily. Puppies and seniors need even more rest for optimal health.", emoji: "😴" },
  { title: "Vaccination Schedule", fact: "Core vaccines protect against rabies, distemper, and parvovirus. Follow your vet's schedule.", emoji: "💉" },
  { title: "Nail Care", fact: "Long nails can cause pain and joint problems. Trim nails every 3-4 weeks or when you hear clicking.", emoji: "💅" },
  { title: "Ear Cleaning", fact: "Check ears weekly for redness, odor, or discharge. Clean with vet-approved solution as needed.", emoji: "👂" },
  { title: "Separation Anxiety", fact: "Gradual desensitization and positive reinforcement help dogs cope with alone time.", emoji: "💔" },
  { title: "Breed-Specific Needs", fact: "Different breeds have unique exercise, grooming, and health requirements. Research your dog's breed.", emoji: "📚" },
  { title: "Senior Dog Care", fact: "Older dogs benefit from softer beds, ramps, and more frequent vet visits to manage age-related issues.", emoji: "👴" },
  { title: "Microchipping", fact: "Microchips greatly increase chances of reuniting with lost pets. Keep registration info updated.", emoji: "🔍" },
  { title: "Spay/Neuter Benefits", fact: "Sterilization reduces cancer risk, prevents unwanted litters, and can improve behavior.", emoji: "🏥" },
  { title: "Seasonal Allergies", fact: "Dogs can have environmental allergies causing itching and skin issues. Consult your vet for treatment.", emoji: "🌸" },
  { title: "Proper Leash Training", fact: "Loose-leash walking makes walks enjoyable and safe. Use positive reinforcement techniques.", emoji: "🦮" },
  { title: "Crate Training", fact: "A properly sized crate provides a safe den-like space. Never use it as punishment.", emoji: "🏠" },
  { title: "Recall Training", fact: "A reliable recall command can save your dog's life. Practice in safe, enclosed areas first.", emoji: "📣" },
  { title: "Body Language", fact: "Learn to read your dog's signals. Tail position, ear placement, and posture communicate emotions.", emoji: "👀" },
  { title: "Heatstroke Signs", fact: "Excessive panting, drooling, and lethargy indicate heatstroke. Cool down gradually and seek vet care.", emoji: "🔥" },
  { title: "Winter Safety", fact: "Paw pads can crack in cold weather. Use pet-safe ice melt and consider booties for walks.", emoji: "❄️" },
  { title: "Bloat Awareness", fact: "Large, deep-chested breeds are prone to bloat. Feed smaller meals and avoid exercise after eating.", emoji: "🫃" },
  { title: "Medication Safety", fact: "Never give human medications without vet approval. Many are toxic to pets even in small doses.", emoji: "💊" },
  { title: "Travel Preparation", fact: "Acclimate dogs to carriers gradually. Bring familiar items and ensure proper ID tags for trips.", emoji: "✈️" },
  { title: "Household Hazards", fact: "Secure trash cans, electrical cords, and small objects. Puppies explore with their mouths.", emoji: "🚨" },
  { title: "Plant Toxicity", fact: "Lilies, azaleas, and sago palms are toxic to dogs. Research plants before bringing them home.", emoji: "🌿" },
  { title: "Positive Reinforcement", fact: "Reward-based training builds trust and is more effective than punishment-based methods.", emoji: "🎁" },
  { title: "Consistency is Key", fact: "All family members should use the same commands and rules for effective dog training.", emoji: "👨👩👧👦" },
  { title: "Puppy Teething", fact: "Puppies teeth until 6 months old. Provide appropriate chew toys to save your furniture.", emoji: "🦴" },
  { title: "Barking Management", fact: "Excessive barking often signals boredom, anxiety, or unmet needs. Address the root cause.", emoji: "🔊" },
  { title: "Resource Guarding", fact: "Teach 'drop it' and 'leave it' early. Never punish growling as it's a warning signal.", emoji: "🦴" },
  { title: "Multi-Dog Households", fact: "Introduce new dogs gradually in neutral territory. Supervise interactions until relationships stabilize.", emoji: "🐕🦺" },
  { title: "Dog Nose Facts", fact: "A dog's nose has 300 million scent receptors compared to humans' 6 million. Their sense of smell is 10,000-100,000 times stronger.", emoji: "👃" },
  { title: "Tail Communication", fact: "A wagging tail doesn't always mean happiness. High, stiff wags can indicate alertness or aggression.", emoji: "🐕" },
  { title: "Dog Dreams", fact: "Dogs dream during REM sleep just like humans. Small dogs dream more frequently than large dogs.", emoji: "💭" },
  { title: "Paw Preference", fact: "Dogs can be left or right-pawed. Watch which paw they use first when reaching for treats.", emoji: "🐾" },
  { title: "Unique Nose Prints", fact: "Every dog's nose print is unique, like human fingerprints. Some organizations use nose prints for identification.", emoji: "👃" },
  { title: "Color Vision", fact: "Dogs see colors differently than humans. They see blues and yellows well but have difficulty with reds and greens.", emoji: "🌈" },
  { title: "Hearing Range", fact: "Dogs can hear frequencies up to 65,000 Hz (humans only to 20,000 Hz). This is why dog whistles work.", emoji: "👂" },
  { title: "Pack Mentality", fact: "Dogs are naturally pack animals. They look to their human family as their pack and need clear leadership.", emoji: "👥" },
  { title: "Sweating Through Paws", fact: "Dogs primarily sweat through their paw pads and regulate temperature by panting.", emoji: "🐾" },
  { title: "Third Eyelid", fact: "Dogs have a third eyelid (nictitating membrane) that helps protect their eyes and spread tears.", emoji: "👁️" },
  { title: "Mouth Bacteria", fact: "A dog's mouth isn't cleaner than a human's. Both have different but significant amounts of bacteria.", emoji: "🦠" },
  { title: "Intelligence Levels", fact: "The average dog can learn 165 words. Border Collies and Poodles are among the smartest breeds.", emoji: "🧠" },
  { title: "Puppy Development", fact: "Puppies are born deaf and blind. Their eyes open at 2-3 weeks and ears at 3-4 weeks.", emoji: "👶" },
  { title: "Breed Diversity", fact: "There are over 340 recognized dog breeds worldwide, ranging from 2-pound Chihuahuas to 200-pound Mastiffs.", emoji: "🐕" },
  { title: "Ancient Companions", fact: "Dogs were first domesticated around 15,000 years ago, making them humanity's oldest animal companions.", emoji: "🏛️" },
  { title: "Wet Nose Purpose", fact: "A dog's wet nose helps them smell better by capturing scent particles and keeping scent receptors moist.", emoji: "💧" },
  { title: "Fastest Dog Breed", fact: "Greyhounds can run up to 45 mph, making them the fastest dog breed and second fastest land animal.", emoji: "🏃" },
  { title: "Smallest Dog Breed", fact: "Chihuahuas are the world's smallest dog breed, typically weighing 2-6 pounds when fully grown.", emoji: "🐕" },
  { title: "Largest Dog Breed", fact: "Great Danes hold the record for tallest dogs, with some reaching over 44 inches at the shoulder.", emoji: "🐕" },
  { title: "Dog Years Myth", fact: "The '7 dog years = 1 human year' rule is inaccurate. Dogs age faster in their first two years.", emoji: "📅" },
  { title: "Chocolate Toxicity", fact: "Dark chocolate is more toxic to dogs than milk chocolate due to higher theobromine content.", emoji: "🍫" },
  { title: "Dewclaw Function", fact: "Dewclaws (thumb-like digits) help dogs grip objects and provide traction when running or climbing.", emoji: "🐾" },
  { title: "Double-Coated Breeds", fact: "Breeds like Golden Retrievers have double coats - a soft undercoat and protective outer coat.", emoji: "🧥" },
  { title: "Brachycephalic Breeds", fact: "Flat-faced breeds like Bulldogs and Pugs are prone to breathing problems due to their skull shape.", emoji: "😤" },
  { title: "Shedding Seasons", fact: "Most dogs shed twice yearly (spring and fall) as they change between winter and summer coats.", emoji: "🍂" },
  { title: "Zoomies Explained", fact: "Sudden bursts of energy (zoomies) are normal behavior, especially in young dogs after baths or confinement.", emoji: "💨" },
  { title: "Licking Behavior", fact: "Dogs lick to show affection, seek attention, or due to anxiety. Excessive licking may indicate health issues.", emoji: "👅" },
  { title: "Digging Instincts", fact: "Digging is natural behavior for temperature regulation, hiding food, or creating comfortable resting spots.", emoji: "🕳️" },
  { title: "Howling Communication", fact: "Howling is ancestral wolf behavior used for long-distance communication and pack coordination.", emoji: "🐺" },
  { title: "Circling Before Lying", fact: "Dogs circle before lying down due to ancestral instincts to create safe, comfortable sleeping areas.", emoji: "🔄" },
  { title: "Head Tilting", fact: "Dogs tilt their heads to better locate sounds and see past their muzzles when focusing on something.", emoji: "🤔" },
  { title: "Yawning Contagion", fact: "Dogs can 'catch' yawns from humans, showing their emotional connection and empathy with their owners.", emoji: "🥱" },
  { title: "Belly Exposure", fact: "Rolling over to show belly is a sign of trust and submission, not always a request for belly rubs.", emoji: "🤸" },
  { title: "Scent Marking", fact: "Dogs mark territory with urine to communicate information about themselves to other dogs.", emoji: "🚽" },
  { title: "Pack Walking", fact: "Dogs naturally want to walk together as a pack. Leash training teaches them to walk calmly beside humans.", emoji: "🚶" },
  { title: "Food Guarding", fact: "Resource guarding is natural behavior but should be managed through training to prevent aggression.", emoji: "🍽️" },
  { title: "Attention Seeking", fact: "Dogs learn which behaviors get attention (positive or negative) and will repeat successful strategies.", emoji: "👋" },
  { title: "Comfort Objects", fact: "Many dogs have favorite toys or blankets that provide comfort and security, especially when alone.", emoji: "🧸" },
  { title: "Routine Importance", fact: "Dogs thrive on routine and predictability. Consistent schedules reduce anxiety and behavioral problems.", emoji: "⏰" },
  { title: "Weather Sensitivity", fact: "Some dogs can sense weather changes through barometric pressure and may become anxious before storms.", emoji: "⛈️" },
  { title: "Emotional Support", fact: "Dogs provide emotional support and can be trained as therapy animals to help people with various conditions.", emoji: "❤️" },
  { title: "Loyalty Trait", fact: "Dogs' loyalty stems from pack mentality and thousands of years of co-evolution with humans.", emoji: "🤝" },
  { title: "Problem Solving", fact: "Dogs can solve simple problems and learn through observation, making them excellent working partners.", emoji: "🧩" },
  { title: "Memory Capacity", fact: "Dogs have excellent associative memory and can remember people, places, and experiences for years.", emoji: "🧠" },
  { title: "Social Learning", fact: "Dogs learn by watching other dogs and humans, making socialization crucial for proper development.", emoji: "👥" },
  { title: "Stress Signals", fact: "Panting, pacing, drooling, and destructive behavior can indicate stress or anxiety in dogs.", emoji: "😰" },
  { title: "Calming Signals", fact: "Dogs use lip licking, yawning, and turning away as calming signals to defuse tense situations.", emoji: "😌" },
  { title: "Exercise Benefits", fact: "Regular exercise prevents obesity, reduces behavioral problems, and strengthens the human-dog bond.", emoji: "🏃" },
  { title: "Mental Exercise", fact: "Mental stimulation through training and puzzles is as important as physical exercise for dog wellbeing.", emoji: "🧠" },
  { title: "Socialization Window", fact: "Proper socialization between 3-14 weeks is crucial for developing confident, well-adjusted adult dogs.", emoji: "🪟" },
  { title: "Training Consistency", fact: "Short, frequent training sessions (5-10 minutes) are more effective than long, infrequent ones.", emoji: "⏱️" },
  { title: "Positive Association", fact: "Pairing new experiences with treats and praise helps dogs develop positive associations and confidence.", emoji: "➕" },
  { title: "Bite Inhibition", fact: "Puppies learn bite inhibition from littermates and mother. Hand-raised puppies may need extra training.", emoji: "🦷" },
  { title: "Impulse Control", fact: "Teaching 'wait' and 'stay' commands helps dogs develop impulse control and makes them safer companions.", emoji: "✋" },
  { title: "Enrichment Activities", fact: "Rotating toys, hiding treats, and providing new experiences prevent boredom and destructive behavior.", emoji: "🎯" },
  { title: "Breed Characteristics", fact: "Understanding breed-specific traits helps owners provide appropriate exercise, training, and care.", emoji: "📖" },
  { title: "Individual Personality", fact: "Each dog has a unique personality that may differ from typical breed characteristics.", emoji: "⭐" },
  { title: "Health Monitoring", fact: "Regular weight checks, dental exams, and behavior monitoring help catch health issues early.", emoji: "📊" },
  { title: "Preventive Care", fact: "Preventive veterinary care is more cost-effective than treating advanced diseases.", emoji: "💰" },
  { title: "Quality Time", fact: "Spending quality time with your dog strengthens your bond and improves their mental health.", emoji: "⏰" },
  { title: "Unconditional Love", fact: "Dogs offer unconditional love and companionship, making them wonderful family members and friends.", emoji: "💕" }
];

export function useDailyInsight() {
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsight = useCallback(() => {
    const minutesSinceEpoch = Math.floor(Date.now() / 60000);
    const index = minutesSinceEpoch % LOCAL_INSIGHTS.length;
    setInsight(LOCAL_INSIGHTS[index]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInsight();
    const interval = setInterval(fetchInsight, 60000);
    return () => clearInterval(interval);
  }, [fetchInsight]);

  const refresh = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * LOCAL_INSIGHTS.length);
    setInsight(LOCAL_INSIGHTS[randomIndex]);
  }, []);

  return { insight, loading, refresh };
}
