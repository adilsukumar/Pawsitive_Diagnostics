// Dog-specific data management utility
export class DogDataManager {
  static getActiveDogId(): string {
    return localStorage.getItem("active_dog_id") || "1";
  }

  // Get dog-specific key
  private static getDogKey(key: string): string {
    const dogId = this.getActiveDogId();
    return `dog_${dogId}_${key}`;
  }

  // Store data for active dog
  static setDogData(key: string, data: any): void {
    const dogKey = this.getDogKey(key);
    localStorage.setItem(dogKey, JSON.stringify(data));
  }

  // Get data for active dog
  static getDogData(key: string): any {
    const dogKey = this.getDogKey(key);
    const data = localStorage.getItem(dogKey);
    return data ? JSON.parse(data) : null;
  }

  // Get data for specific dog
  static getSpecificDogData(dogId: string, key: string): any {
    const dogKey = `dog_${dogId}_${key}`;
    const data = localStorage.getItem(dogKey);
    return data ? JSON.parse(data) : null;
  }

  // Store data for specific dog
  static setSpecificDogData(dogId: string, key: string, data: any): void {
    const dogKey = `dog_${dogId}_${key}`;
    localStorage.setItem(dogKey, JSON.stringify(data));
  }

  // Clear all data for a dog
  static clearDogData(dogId: string): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`dog_${dogId}_`)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Get all dogs with their data summary
  static getAllDogsData(): any[] {
    const dogs = JSON.parse(localStorage.getItem("dogs_profiles") || "[]");
    return dogs.map((dog: any) => ({
      ...dog,
      hasData: {
        sensorReadings: !!this.getSpecificDogData(dog.id, "sensor_readings"),
        emotionLogs: !!this.getSpecificDogData(dog.id, "emotion_logs"),
        scanHistory: !!this.getSpecificDogData(dog.id, "scan_history")
      }
    }));
  }
}

// Hook for dog-specific data
export function useDogData() {
  const activeDogId = localStorage.getItem("active_dog_id") || "1";
  
  const setData = (key: string, data: any) => {
    DogDataManager.setDogData(key, data);
  };
  
  const getData = (key: string) => {
    return DogDataManager.getDogData(key);
  };
  
  return { activeDogId, setData, getData };
}