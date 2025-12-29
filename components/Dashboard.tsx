
import React, { useState, useEffect } from 'react';
import { Activity, Zap, Sparkles, PlusCircle, MinusCircle, Target } from 'lucide-react';
import { GameState } from '../types';

interface DashboardProps {
  state: GameState;
  tankCapacity: number;
  systemTargets: { ph: number; ec: number; temp: number; n: number; p: number; k: number };
  onUpdate: (key: keyof GameState, val: number) => void;
  onBuyNutrient: (type: 'currentN' | 'currentP' | 'currentK') => void;
  onDrainNutrient: (type: 'currentN' | 'currentP' | 'currentK') => void;
  advice: string;
  onRefreshAdvice: () => void;
  optimScore: number;
}

const Dashboard: React.FC<DashboardProps> = ({ state, tankCapacity, systemTargets, onUpdate, onBuyNutrient, onDrainNutrient, advice, onRefreshAdvice, optimScore }) => {
  const [typedAdvice, setTypedAdvice] = useState("");

  useEffect(() => {
    if (!advice) return;
    let i = 0;
    setTypedAdvice("");
    const interval = setInterval(() => {
      setTypedAdvice(advice.substring(0, i));
      i++;
      if (i > advice.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [advice]);

  const waterLiters = (state.currentWater * tankCapacity) / 100;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 shrink-0">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-slate-900 p-3 sm:p-4 rounded-2xl sm:rounded-3xl text-white shadow-lg overflow-hidden relative border border-slate-700">
          <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Budget Restant</p>
          <p className="text-xl sm:text-2xl font-black">{state.money.toFixed(2)}<span className="text-green-400 ml-1 text-sm">€</span></p>
        </div>
        <div className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 shadow-sm transition-all duration-500 ${optimScore > 80 ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
          <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Indice Harmonie</p>
          <p className={`text-xl sm:text-2xl font-black ${optimScore > 80 ? 'text-green-600' : 'text-orange-600'}`}>{optimScore}%</p>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <h4 className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
            <Activity className="w-3 h-3" /> Équilibre Nutritif
        </h4>
        <div className="grid grid-cols-1 gap-2">
          <NutrientDosage label="Azote (N)" value={state.currentN} target={systemTargets.n} color="bg-blue-500" onAdd={() => onBuyNutrient('currentN')} onRemove={() => onDrainNutrient('currentN')} />
          <NutrientDosage label="Phosphore (P)" value={state.currentP} target={systemTargets.p} color="bg-purple-500" onAdd={() => onBuyNutrient('currentP')} onRemove={() => onDrainNutrient('currentP')} />
          <NutrientDosage label="Potassium (K)" value={state.currentK} target={systemTargets.k} color="bg-orange-500" onAdd={() => onBuyNutrient('currentK')} onRemove={() => onDrainNutrient('currentK')} />
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <h4 className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
            <Target className="w-3 h-3 text-red-500" /> Maintenance du Réservoir
        </h4>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <ControlSlider label="pH" value={state.currentPH} target={systemTargets.ph} min={4} max={9} step={0.1} unit="" color="bg-teal-500" onChange={(v) => onUpdate('currentPH', v)} />
            <ControlSlider label="EC Target" value={state.currentEC} target={systemTargets.ec} min={0} max={4} step={0.1} unit=" mS" color="bg-indigo-500" onChange={(v) => onUpdate('currentEC', v)} />
            <ControlSlider label="Température" value={state.currentTemp} target={systemTargets.temp} min={10} max={35} unit="°C" color="bg-red-500" onChange={(v) => onUpdate('currentTemp', v)} />
            <ControlSlider label="Niveau Eau" value={state.currentWater} target={75} min={0} max={100} unit={`% (${waterLiters.toFixed(1)}L)`} color="bg-blue-400" onChange={(v) => onUpdate('currentWater', v)} />
        </div>
      </div>

      <div className="bg-slate-900 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-5 text-white shadow-xl border border-slate-700 mt-1 shrink-0">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 h-4 text-blue-400" />
              <h3 className="text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest text-center">IA Hydro-Logiq</h3>
            </div>
            <button onClick={onRefreshAdvice} className="text-[7px] sm:text-[8px] font-black bg-blue-600 hover:bg-blue-500 px-2 sm:px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 uppercase active:scale-95">
              <Zap className="w-2 sm:w-2.5 h-2 sm:h-2.5" /> Scan Bio
            </button>
        </div>
        <p className="text-[10px] sm:text-[11px] font-medium leading-relaxed text-slate-300 italic min-h-[30px]">
          {typedAdvice ? `"${typedAdvice}"` : "Analyse du mélange en cours..."}
        </p>
      </div>
    </div>
  );
};

const NutrientDosage: React.FC<{ label: string, value: number, target: number, color: string, onAdd: () => void, onRemove: () => void }> = ({ label, value, target, color, onAdd, onRemove }) => (
  <div className="bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 group">
    <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
            <span className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
            <span className={`text-[9px] sm:text-[10px] font-black font-mono ${value < 15 ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>{Math.round(value)}%</span>
        </div>
        <div className="w-full h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden relative">
            <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${value}%` }}></div>
            {/* Indicateur de cible de compromis */}
            <div 
              className="absolute top-0 w-1 h-full bg-red-500 z-10 shadow-[0_0_4px_rgba(239,68,68,0.8)]" 
              style={{ left: `${target}%` }}
              title="Cible optimale"
            />
        </div>
    </div>
    <div className="flex gap-1 shrink-0">
        <button onClick={onRemove} className="flex flex-col items-center justify-center bg-slate-50 active:bg-red-50 w-9 h-9 sm:w-11 sm:h-11 rounded-xl transition-all border border-slate-100 active:scale-90">
            <MinusCircle className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[5px] sm:text-[6px] font-black text-slate-300 uppercase">Purger</span>
        </button>
        <button onClick={onAdd} className="flex flex-col items-center justify-center bg-slate-50 active:bg-blue-50 w-9 h-9 sm:w-11 sm:h-11 rounded-xl transition-all border border-slate-100 active:scale-90">
            <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[5px] sm:text-[6px] font-black text-slate-400 uppercase">0.50€</span>
        </button>
    </div>
  </div>
);

const ControlSlider: React.FC<{ label: string, value: number, target: number, min: number, max: number, step?: number, unit: string, color: string, onChange: (v: number) => void }> = ({ label, value, target, min, max, step = 1, unit, color, onChange }) => {
  const targetPercent = ((target - min) / (max - min)) * 100;
  
  return (
    <div className="bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm relative group">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">{label}</span>
        <span className="text-[8px] sm:text-[10px] font-black text-slate-900 font-mono">{value.toFixed(step === 0.1 ? 1 : 0)}{unit}</span>
      </div>
      <div className="relative flex items-center h-4">
          <input 
            type="range" min={min} max={max} step={step} value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-slate-900 bg-slate-100 relative z-20"
          />
          {/* Marqueur de compromis visuel */}
          <div 
            className="absolute h-3 w-3 bg-red-500 rounded-full z-10 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-80 shadow-md border-2 border-white pointer-events-none"
            style={{ left: `${targetPercent}%` }}
          />
      </div>
    </div>
  );
};

export default Dashboard;
