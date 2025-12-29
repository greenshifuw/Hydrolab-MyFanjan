
import { GoogleGenAI } from "@google/genai";
import { PlantInstance } from '../types';
import { PLANT_DEFS } from '../constants';

// Utilisation de process.env.API_KEY comme requis par les instructions.
// On cast en string pour éviter les erreurs de type au déploiement.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const getGardenAdvice = async (
  plants: (PlantInstance | null)[],
  conditions: { temp: number; water: number; nutrients: number; light: number; ph?: number; ec?: number }
): Promise<string> => {
  const activePlants = plants.filter(p => p !== null) as PlantInstance[];
  
  if (activePlants.length === 0) {
    return "Système en veille. Préparez votre solution nutritive (pH 6.0 recommandé) avant de planter.";
  }

  const plantContext = activePlants.map(p => {
    const def = PLANT_DEFS[p.type];
    return `${p.type} (${Math.round(p.growth)}% croiss., ${Math.round(p.health)}% santé). Besoin: pH ${def.idealPH}, EC ${def.idealEC}, NPK ${def.idealN}-${def.idealP}-${def.idealK}`;
  }).join("; ");

  const prompt = `
    Expert en hydroponie Myfanjan. 
    Conditions : Temp ${conditions.temp}°C, pH ${conditions.ph}, EC ${conditions.ec}, Lumière ${conditions.light}%.
    Culture : ${plantContext}.
    Donnez un conseil technique très court (1 phrase) sur le réglage NPK ou pH/EC pour maximiser la santé.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Correction TS2345 : on s'assure de retourner une string (jamais undefined)
    return response.text ?? "Analysez vos paramètres pour optimiser la croissance.";
  } catch (error) {
    console.error("Erreur Gemini Service:", error);
    return "Vérifiez votre pH, un écart important bloque l'assimilation des nutriments.";
  }
};
