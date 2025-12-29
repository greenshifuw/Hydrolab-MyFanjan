
import { GoogleGenAI } from "@google/genai";
import { PlantInstance } from '../types';
import { PLANT_DEFS } from '../constants';

export const getGardenAdvice = async (
  plants: (PlantInstance | null)[],
  conditions: { temp: number; water: number; nutrients: number; light: number; ph?: number; ec?: number }
): Promise<string> => {
  const activePlants = plants.filter(p => p !== null) as PlantInstance[];
  
  if (activePlants.length === 0) {
    return "Système en veille. Préparez votre solution nutritive (pH 6.0 recommandé) avant de planter.";
  }

  // Initialisation locale conforme aux guidelines pour garantir la fraîcheur de la clé API
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const plantContext = activePlants.map(p => {
    const def = PLANT_DEFS[p.type];
    return `${p.type} (${Math.round(p.growth)}% croiss., ${Math.round(p.health)}% santé). Besoin: pH ${def.idealPH}, EC ${def.idealEC}, NPK ${def.idealN}-${def.idealP}-${def.idealK}`;
  }).join("; ");

  const prompt = `
    Tu es un expert en hydroponie pour le système Myfanjan. 
    Conditions actuelles : Température ${conditions.temp}°C, pH ${conditions.ph}, EC ${conditions.ec}, Lumière ${conditions.light}%.
    État des cultures : ${plantContext}.
    Donne un conseil technique très court (maximum 15 mots) sur le réglage NPK ou pH/EC pour maximiser la santé des plantes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text ?? "Vérifiez vos paramètres NPK pour optimiser la croissance.";
  } catch (error: any) {
    console.error("Erreur Gemini Service:", error);
    // Gestion spécifique de l'erreur d'entité non trouvée
    if (error?.message?.includes("Requested entity was not found")) {
      return "Erreur de configuration API. Veuillez vérifier la clé dans le dashboard Vercel.";
    }
    return "Analyse indisponible. Maintenez un pH entre 5.8 et 6.2 pour l'instant.";
  }
};
