import { DogDataManager } from "./dogDataManager";

export interface ScanRecord {
  id: string;
  sensor_type: "bark" | "skin" | "poop";
  timestamp: string;
  health_score: number | null;
  severity: string | null;
  emotional_state: string | null;
  summary: string | null;
}

export const getScanHistory = (): ScanRecord[] => {
  return DogDataManager.getDogData("scan_history") || [];
};

export const addScanRecord = (record: Omit<ScanRecord, "id" | "timestamp">): void => {
  const history = getScanHistory();
  const newRecord = {
    ...record,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  const updatedHistory = [newRecord, ...history].slice(0, 50);
  DogDataManager.setDogData("scan_history", updatedHistory);
};
