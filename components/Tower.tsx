
import React from 'react';
import { PlantInstance, PlantType } from '../types';
import { ICONS, PLANT_DEFS } from '../constants';

interface TowerProps {
  slots: (PlantInstance | null)[];
  onSlotClick: (index: number) => void;
  onHarvest: (index: number) => void;
}

const Tower: React.FC<TowerProps> = ({ slots, onSlotClick, onHarvest }) => {
  return (
    <div className="relative flex flex-col items-center py-6 sm:py-10">
      {/* Hauteur ajustée pour tablettes : max 550px au lieu de 650px pour éviter le scroll vertical excessif */}
      <div className="w-28 sm:w-36 h-[500px] sm:h-[600px] bg-white border-x-4 sm:border-x-8 border-slate-100 rounded-full shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] relative">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1.5 water-flow opacity-20"></div>
        
        <div className="absolute inset-0 flex flex-col justify-between py-6 sm:py-10 px-1 sm:px-2">
          {slots.map((plant, idx) => {
            const def = plant ? PLANT_DEFS[plant.type] : null;
            const daysLeft = plant ? Math.ceil((100 - plant.growth) / def!.growthRate) : 0;

            return (
              <div key={idx} className="relative group h-10 sm:h-14 flex items-center justify-center">
                <div 
                  onClick={() => !plant && onSlotClick(idx)}
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 sm:border-4 cursor-pointer transition-all duration-500 flex items-center justify-center z-10 active:scale-95
                    ${plant ? 'bg-white border-green-400 scale-110 shadow-lg' : 'bg-slate-50 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}
                >
                  {plant ? (
                    <div className="relative flex items-center justify-center w-full h-full">
                      <div 
                        className={`transform transition-all duration-1000 ease-in-out ${plant.growth < 100 ? 'animate-pulse' : ''}`}
                        style={{ 
                          transform: `scale(${0.2 + (plant.growth / 100) * 1.3})`,
                          opacity: 0.4 + (plant.health / 100) * 0.6,
                          filter: plant.health < 40 ? 'saturate(0.2) contrast(0.8)' : 'none'
                        }}
                      >
                        {ICONS[plant.type]}
                      </div>

                      {plant.growth < 100 && plant.health > 0 && (
                        <div className="absolute -right-8 sm:-right-10 bg-white/90 backdrop-blur-sm border border-slate-100 px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-black text-slate-500 shadow-sm pointer-events-none">
                          J-{daysLeft}
                        </div>
                      )}

                      <svg className="absolute inset-[-4px] sm:inset-[-6px] w-[56px] h-[56px] sm:w-[76px] sm:h-[76px] rotate-[-90deg] pointer-events-none">
                        <circle cx="28" cy="28" r="24" className="block sm:hidden" fill="none" stroke="#f8fafc" strokeWidth="2" />
                        <circle cx="38" cy="38" r="32" className="hidden sm:block" fill="none" stroke="#f8fafc" strokeWidth="3" />
                        <circle
                          cx="28" cy="28" r="24"
                          className="block sm:hidden transition-all duration-1000 ease-linear"
                          fill="none"
                          stroke={plant.health < 40 ? "#ef4444" : "#22c55e"}
                          strokeWidth="3"
                          strokeDasharray={151}
                          strokeDashoffset={151 - (151 * plant.growth) / 100}
                        />
                        <circle
                          cx="38" cy="38" r="32"
                          className="hidden sm:block transition-all duration-1000 ease-linear"
                          fill="none"
                          stroke={plant.health < 40 ? "#ef4444" : "#22c55e"}
                          strokeWidth="4"
                          strokeDasharray={201}
                          strokeDashoffset={201 - (201 * plant.growth) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      
                      {plant.growth >= 100 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onHarvest(idx); }}
                          className="absolute -top-8 sm:-top-10 bg-yellow-400 text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-full animate-bounce shadow-xl hover:bg-yellow-500 z-30 ring-2 ring-white active:scale-90"
                        >
                          RÉCOLTER
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-200 text-xl sm:text-2xl font-light">+</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="w-40 sm:w-56 h-16 sm:h-24 bg-slate-50 border-2 sm:border-4 border-white rounded-t-[2rem] sm:rounded-t-[3rem] mt-[-8px] sm:mt-[-10px] shadow-xl relative flex flex-col items-center justify-center">
         <div className="text-slate-300 font-black text-[7px] sm:text-[9px] uppercase tracking-[0.2em] mb-1">Système Myfanjan</div>
         <div className="flex gap-1 sm:gap-1.5">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-400 animate-pulse delay-75"></div>
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-400 animate-pulse delay-150"></div>
         </div>
      </div>
    </div>
  );
};

export default Tower;
