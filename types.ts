
export type PlantType = 'Lettuce' | 'Parsley' | 'Tomato' | 'GreenOnion';

export interface PlantStats {
  idealTemp: number;
  idealWater: number;
  idealN: number; // Azote
  idealP: number; // Phosphore
  idealK: number; // Potassium
  idealPH: number;
  idealEC: number;
  growthRate: number;
  difficulty: number;
  value: number;
  cost: number;
}

export interface PlantInstance {
  id: string;
  type: PlantType;
  growth: number;
  health: number;
  plantedAt: number;
  lastUpdate: number;
}

export interface GameState {
  money: number;
  experience: number;
  currentTemp: number;
  currentWater: number;
  currentN: number;
  currentP: number;
  currentK: number;
  currentPH: number;
  currentEC: number;
  currentLight: number;
  inventory: Record<PlantType, number>;
  towerSlots: (PlantInstance | null)[];
  gameDay: number;
}
