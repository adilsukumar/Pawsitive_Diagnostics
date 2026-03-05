// Local breed information database
export const BREED_DATABASE: Record<string, any> = {
  "golden retriever": {
    recognized: true,
    breed_name: "Golden Retriever",
    overview: "Friendly, intelligent, and devoted. Golden Retrievers are among the most popular family dogs due to their gentle temperament and trainability.",
    diet: {
      should_eat: ["High-quality dog food", "Lean proteins", "Vegetables", "Fruits (in moderation)"],
      should_not_eat: ["Chocolate", "Grapes", "Onions", "Xylitol", "Fatty foods"],
      feeding_tips: "Feed 2-3 cups of quality food daily, split into two meals. Avoid overfeeding as they're prone to obesity."
    },
    behavior: {
      temperament: "Friendly, reliable, and trustworthy. Excellent with children and other pets.",
      traits: ["Intelligent", "Loyal", "Gentle", "Eager to please", "Playful"],
      social: "Highly social dogs that thrive on human companionship. Not suited for isolation."
    },
    habits: {
      exercise_needs: "60-90 minutes daily. Loves swimming, fetching, and outdoor activities.",
      grooming: "Brush 2-3 times weekly. Sheds heavily, especially seasonally.",
      sleep: "12-14 hours daily. Enjoys sleeping near family members."
    },
    health: {
      common_issues: ["Hip dysplasia", "Elbow dysplasia", "Heart disease", "Eye problems", "Cancer"],
      lifespan: "10-12 years",
      tips: "Regular vet checkups, maintain healthy weight, and monitor for joint issues."
    },
    fun_facts: [
      "Originally bred in Scotland for retrieving waterfowl",
      "Ranked 3rd most intelligent dog breed",
      "Their mouths are so soft they can carry an egg without breaking it"
    ]
  },
  "labrador retriever": {
    recognized: true,
    breed_name: "Labrador Retriever",
    overview: "Outgoing, even-tempered, and gentle. Labs are America's most popular breed and excellent family companions.",
    diet: {
      should_eat: ["High-protein dog food", "Fish", "Chicken", "Brown rice", "Vegetables"],
      should_not_eat: ["Chocolate", "Grapes", "Macadamia nuts", "Avocado", "Cooked bones"],
      feeding_tips: "Feed 2.5-3 cups daily. Labs love food and can easily become overweight."
    },
    behavior: {
      temperament: "Friendly, outgoing, and active. Great with families and children.",
      traits: ["Energetic", "Loyal", "Intelligent", "Gentle", "Trusting"],
      social: "Extremely social and friendly with everyone, including strangers."
    },
    habits: {
      exercise_needs: "60-90 minutes daily. Loves swimming and retrieving games.",
      grooming: "Weekly brushing. Sheds year-round with heavy seasonal shedding.",
      sleep: "12-14 hours daily. Adaptable sleepers."
    },
    health: {
      common_issues: ["Hip dysplasia", "Obesity", "Ear infections", "Eye problems"],
      lifespan: "10-12 years",
      tips: "Monitor weight closely, clean ears regularly, and provide plenty of exercise."
    },
    fun_facts: [
      "Originally from Newfoundland, not Labrador",
      "Most popular breed in the US for 30+ years",
      "Webbed paws make them excellent swimmers"
    ]
  },
  "german shepherd": {
    recognized: true,
    breed_name: "German Shepherd",
    overview: "Confident, courageous, and smart. German Shepherds are versatile working dogs known for their loyalty and trainability.",
    diet: {
      should_eat: ["High-protein food", "Lean meats", "Complex carbs", "Omega-3 fatty acids"],
      should_not_eat: ["Chocolate", "Grapes", "Onions", "Garlic", "Dairy (in excess)"],
      feeding_tips: "Feed 3-4 cups daily for adults. Prone to bloat, so avoid exercise after meals."
    },
    behavior: {
      temperament: "Confident, courageous, and intelligent. Protective of family.",
      traits: ["Loyal", "Brave", "Alert", "Obedient", "Protective"],
      social: "Reserved with strangers but devoted to family. Needs early socialization."
    },
    habits: {
      exercise_needs: "90-120 minutes daily. Needs mental stimulation and physical activity.",
      grooming: "Brush 3-4 times weekly. Heavy shedders year-round.",
      sleep: "12-14 hours daily. Light sleepers, alert to surroundings."
    },
    health: {
      common_issues: ["Hip dysplasia", "Elbow dysplasia", "Bloat", "Degenerative myelopathy"],
      lifespan: "9-13 years",
      tips: "Regular exercise, joint supplements, and avoid overfeeding to prevent bloat."
    },
    fun_facts: [
      "Developed in Germany in the late 1800s",
      "One of the most versatile working breeds",
      "Can learn a new command in just 5 repetitions"
    ]
  }
};

export function getBreedInfo(breedName: string) {
  const normalized = breedName.toLowerCase().trim();
  return BREED_DATABASE[normalized] || {
    recognized: false,
    breed_name: breedName,
    overview: "Breed information not available in local database."
  };
}
