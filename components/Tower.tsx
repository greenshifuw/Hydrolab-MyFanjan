
import React from 'react';
import { PlantInstance, PlantType } from '../types';
import { ICONS, PLANT_DEFS } from '../constants';

interface TowerProps {
  slots: (PlantInstance | null)[];
  onSlotClick: (index: number) => void;
  onHarvest: (index: number) => void;
  currentGameDay: number;
}

const Tower: React.FC<TowerProps> = ({ slots, onSlotClick, onHarvest, currentGameDay }) => {
  return (
    <div className="relative flex flex-col items-center py-4">
      {/* Structure de la tour imposante */}
      <div className="w-28 xs:w-32 sm:w-40 h-[450px] xs:h-[520px] sm:h-[650px] bg-white border-x-4 sm:border-x-8 border-slate-100 rounded-full shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] relative transition-all">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 water-flow opacity-20"></div>
        
        <div className="absolute inset-0 flex flex-col justify-between py-8 sm:py-12 px-1 sm:px-2">
          {slots.map((plant, idx) => {
            const def = plant ? PLANT_DEFS[plant.type] : null;
            const daysLeft = plant ? Math.ceil((100 - plant.growth) / def!.growthRate) : 0;
            
            // Calcul de l'état de dégradation après maturité
            let filterStyle = "";
            let decayMessage = "";
            if (plant && plant.maturedAtDay !== undefined) {
              const daysSinceMaturity = currentGameDay - plant.maturedAtDay;
              if (daysSinceMaturity >= 10) {
                filterStyle = "sepia(1) brightness(0.5) contrast(1.2)"; // Marron/Mort
                decayMessage = "POURRI";
              } else if (daysSinceMaturity >= 5) {
                filterStyle = "sepia(1) hue-rotate(-20deg) saturate(3) brightness(1.1)"; // Jaune
                decayMessage = "FLÉTRI";
              }
            }

            return (
              <div key={idx} className="relative group h-10 xs:h-12 sm:h-16 flex items-center justify-center">
                <div 
                  onClick={() => !plant && onSlotClick(idx)}
                  className={`w-12 h-12 xs:w-14 xs:h-14 sm:w-20 sm:h-20 rounded-full border-2 sm:border-4 cursor-pointer transition-all duration-500 flex items-center justify-center z-10 active:scale-90
                    ${plant ? 'bg-white border-green-100 scale-110 shadow-lg' : 'bg-slate-50 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}
                >
                  {plant ? (
                    <div className="relative flex items-center justify-center w-full h-full">
                      {/* L'illustration grossit au lieu d'avoir un cercle de progression */}
                      <div 
                        className={`transform transition-all duration-1000 ease-in-out ${plant.growth < 100 ? 'animate-pulse' : ''} flex items-center justify-center`}
                        style={{ 
                          // Effet de croissance dramatique : l'icône remplit le slot
                          transform: `scale(${0.3 + (plant.growth / 100) * 2.2})`,
                          opacity: 0.7 + (plant.health / 100) * 0.3,
                          filter: filterStyle,
                        }}
                      >
                        {ICONS[plant.type]}
                      </div>

                      {plant.growth < 100 && plant.health > 0 && (
                        <div className="absolute -right-10 xs:-right-12 sm:-right-14 bg-white/95 backdrop-blur-sm border border-slate-100 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-black text-slate-500 shadow-sm pointer-events-none z-20">
                          J-{daysLeft}
                        </div>
                      )}

                      {plant.growth >= 100 && (
                        <div className="absolute flex flex-col items-center -top-10 xs:-top-12 sm:-top-16 z-30 pointer-events-none">
                          {decayMessage && (
                            <span className={`text-[6px] sm:text-[8px] font-black px-1.5 rounded-full mb-1 ${decayMessage === 'POURRI' ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'}`}>
                              {decayMessage}
                            </span>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); onHarvest(idx); }}
                            className={`${decayMessage === 'POURRI' ? 'bg-slate-600' : decayMessage === 'FLÉTRI' ? 'bg-orange-400' : 'bg-yellow-400'} text-[8px] xs:text-[9px] sm:text-[11px] font-black px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full animate-bounce shadow-xl ring-2 ring-white active:scale-90 whitespace-nowrap uppercase tracking-widest pointer-events-auto`}
                          >
                            Récolter
                          </button>
                        </div>
                      )}
                      
                      {/* Indicateur de santé critique si besoin */}
                      {plant.health < 30 && (
                        <div className="absolute -bottom-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-200 text-xl sm:text-3xl font-light">+</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Base du système plus large */}
      <div className="w-36 xs:w-44 sm:w-64 h-14 xs:h-18 sm:h-28 bg-slate-50 border-2 sm:border-4 border-white rounded-t-[1.5rem] sm:rounded-t-[3.5rem] mt-[-8px] sm:mt-[-12px] shadow-xl relative flex flex-col items-center justify-center">
         <div className="text-slate-300 font-black text-[7px] xs:text-[8px] sm:text-[10px] uppercase tracking-[0.2em] mb-1">Myfanjan System</div>
         <div className="flex gap-1 sm:gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse delay-75"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse delay-150"></div>
         </div>
      </div>
    </div>
  );
};

export default Tower;