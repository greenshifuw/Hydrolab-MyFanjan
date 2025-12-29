
import React from 'react';
import { Leaf, Sprout, CircleDot, Thermometer } from 'lucide-react';
import { PlantType, PlantStats } from './types';

/**
 * Paramètres basés sur les standards de l'hydroponie :
 * GrowthRate calculé pour 100 / (jours réels)
 */
export const PLANT_DEFS: Record<PlantType, PlantStats> = {
  Lettuce: {
    idealTemp: 19,
    idealWater: 80,
    idealN: 85, // Azote élevé pour les feuilles
    idealP: 25,
    idealK: 45,
    idealPH: 6.0,
    idealEC: 1.0, // EC faible (0.8 - 1.2 mS/cm)
    growthRate: 3.333, // ~30 jours
    difficulty: 1,
    cost: 0.10,
    value: 2.80,
  },
  Parsley: {
    idealTemp: 21,
    idealWater: 65,
    idealN: 60,
    idealP: 40,
    idealK: 60,
    idealPH: 5.8,
    idealEC: 1.4, // EC modérée (1.0 - 1.8 mS/cm)
    growthRate: 1.333, // ~75 jours (lent)
    difficulty: 2,
    cost: 0.20,
    value: 4.00,
  },
  Tomato: {
    idealTemp: 25,
    idealWater: 85,
    idealN: 35, // Trop d'azote nuit à la fructification
    idealP: 75, // Phosphore élevé pour les racines/fleurs
    idealK: 95, // Potassium essentiel pour le fruit
    idealPH: 6.2,
    idealEC: 2.8, // EC élevée (2.0 - 5.0 mS/cm)
    growthRate: 1.538, // ~65 jours
    difficulty: 4,
    cost: 0.20,
    value: 10.00,
  },
  GreenOnion: {
    idealTemp: 20,
    idealWater: 45,
    idealN: 50,
    idealP: 30,
    idealK: 75, // Potassium pour le bulbe
    idealPH: 6.5,
    idealEC: 1.6, // EC modérée (1.4 - 1.8 mS/cm)
    growthRate: 4.545, // ~22 jours
    difficulty: 1,
    cost: 0.10,
    value: 2.00,
  },
};

export const TOWER_SLOTS_COUNT = 8;
export const TICK_RATE = 1000;

export const ICONS = {
  Lettuce: <Leaf className="w-6 h-6 text-green-500" />,
  Parsley: <Sprout className="w-6 h-6 text-emerald-600" />,
  Tomato: <CircleDot className="w-6 h-6 text-red-500" />,
  GreenOnion: <Thermometer className="w-6 h-6 text-lime-500" />,
};
