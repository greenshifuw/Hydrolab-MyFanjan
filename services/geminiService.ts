
import { GoogleGenAI } from "@google/genai";
import { PlantInstance, PlantType } from '../types';
import { PLANT_DEFS } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGardenAdvice = async (
  plants: (PlantInstance | null)[],
  conditions: { temp: number; water: number; nutrients: number; light: number; ph?: number; ec?: number }
) => {
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
    return response.text;
  } catch (error) {
    return "Vérifiez votre pH, un écart important bloque l'assimilation des nutriments.";
  }
};
