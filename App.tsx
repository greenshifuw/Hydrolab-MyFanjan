
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Leaf, AlertTriangle, Zap, FlaskConical, Droplets, PlusCircle } from 'lucide-react';
import Tower from './components/Tower';
import Dashboard from './components/Dashboard';
import { GameState, PlantInstance, PlantType } from './types';
import { PLANT_DEFS, TOWER_SLOTS_COUNT, TICK_RATE, ICONS } from './constants';
import { getGardenAdvice } from './services/geminiService';

const TANK_CAPACITY_L = 30;
const INITIAL_STATE: GameState = {
  money: 50.00,
  experience: 0,
  currentTemp: 21,
  currentWater: 70, // 70% de 30L = 21L
  currentN: 40,
  currentP: 40,
  currentK: 40,
  currentPH: 6.0,
  currentEC: 1.2,
  currentLight: 60,
  inventory: { Lettuce: 5, Parsley: 3, Tomato: 0, GreenOnion: 2 },
  towerSlots: new Array(TOWER_SLOTS_COUNT).fill(null),
  gameDay: 1,
};

const NUTRIENT_DOSE_COST = 0.50;
const BASE_DEPLETION_RATE = 0.02;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [advice, setAdvice] = useState<string>("");
  const [showIntro, setShowIntro] = useState(true);
  const [showSeedSelector, setShowSeedSelector] = useState<{ active: boolean; index: number | null }>({ active: false, index: null });
  const lastAdviceDay = useRef<number>(0);

  const diagnostics = useMemo(() => {
    const alerts: string[] = [];
    const activePlants = gameState.towerSlots.filter(p => p !== null) as PlantInstance[];
    
    if (activePlants.length === 0) return { alerts: ["Réservoir prêt"], score: 100 };

    let penaltySum = 0;
    activePlants.forEach(p => {
      const def = PLANT_DEFS[p.type];
      const phDiff = Math.abs(gameState.currentPH - def.idealPH);
      const ecDiff = Math.abs(gameState.currentEC - def.idealEC);
      const nDiff = Math.abs(def.idealN - gameState.currentN);
      const pDiff = Math.abs(def.idealP - gameState.currentP);
      const kDiff = Math.abs(def.idealK - gameState.currentK);
      const waterDiff = Math.abs(gameState.currentWater - def.idealWater);
      
      if (phDiff > 0.8) alerts.push(`pH critique : ${p.type}`);
      if (gameState.currentN < 10 || gameState.currentP < 10 || gameState.currentK < 10) alerts.push(`Famine nutritive : ${p.type}`);
      if (waterDiff > 25) alerts.push(`Stress hydrique : ${p.type}`);
      
      penaltySum += (phDiff * 2.5 + ecDiff + waterDiff/15 + (nDiff + pDiff + kDiff) / 35);
    });

    const score = Math.max(0, 100 - (penaltySum / activePlants.length) * 12);
    return { alerts: Array.from(new Set(alerts)), score: Math.round(score) };
  }, [gameState]);

  useEffect(() => {
    const timer = setInterval(() => {
      setGameState(prev => {
        const now = Date.now();
        const activePlants = prev.towerSlots.filter(p => p !== null) as PlantInstance[];
        
        let nCons = 0, pCons = 0, kCons = 0, wCons = 0.01;
        activePlants.forEach(p => {
            const sizeFactor = 0.5 + (p.growth / 100);
            nCons += BASE_DEPLETION_RATE * sizeFactor;
            pCons += BASE_DEPLETION_RATE * sizeFactor * 0.8;
            kCons += BASE_DEPLETION_RATE * sizeFactor * 1.2;
            wCons += 0.02 * sizeFactor; 
        });

        const newSlots = prev.towerSlots.map(plant => {
          if (!plant) return null;
          const def = PLANT_DEFS[plant.type];
          const totalPenalty = Math.abs(prev.currentPH - def.idealPH) + (Math.abs(prev.currentWater - def.idealWater)/10);
          
          let healthDelta = 0.7; 
          if (totalPenalty > 1.5) healthDelta = -5.0 * totalPenalty;
          if (prev.currentN <= 0 || prev.currentWater <= 5) healthDelta = -10.0;

          const newHealth = Math.min(100, Math.max(0, plant.health + healthDelta));
          const efficiency = Math.max(0.05, 1 - (totalPenalty * 0.3));
          const growthDelta = (plant.health > 5) ? def.growthRate * (plant.health / 100) * efficiency : 0;
          
          return { ...plant, growth: Math.min(100, plant.growth + growthDelta), health: newHealth, lastUpdate: now };
        });

        return { 
          ...prev, 
          towerSlots: newSlots, 
          gameDay: prev.gameDay + 1,
          currentN: Math.max(0, prev.currentN - nCons),
          currentP: Math.max(0, prev.currentP - pCons),
          currentK: Math.max(0, prev.currentK - kCons),
          currentWater: Math.max(0, prev.currentWater - wCons)
        };
      });
    }, TICK_RATE);
    return () => clearInterval(timer);
  }, []);

  const buyNutrient = (type: 'currentN' | 'currentP' | 'currentK') => {
    setGameState(prev => {
        if (prev.money < NUTRIENT_DOSE_COST) return prev;
        return { ...prev, money: prev.money - NUTRIENT_DOSE_COST, [type]: Math.min(100, (prev[type] as number) + 10) };
    });
  };

  const drainNutrient = (type: 'currentN' | 'currentP' | 'currentK') => {
    setGameState(prev => ({ ...prev, [type]: Math.max(0, (prev[type] as number) - 10) }));
  };

  const refreshAdvice = useCallback(async () => {
    const newAdvice = await getGardenAdvice(gameState.towerSlots, { 
      temp: gameState.currentTemp, water: gameState.currentWater, nutrients: (gameState.currentN + gameState.currentP + gameState.currentK)/3, light: gameState.currentLight, ph: gameState.currentPH, ec: gameState.currentEC
    });
    setAdvice(newAdvice);
  }, [gameState]);

  const plantSeed = (type: PlantType) => {
    if (showSeedSelector.index === null) return;
    const def = PLANT_DEFS[type];
    if (gameState.money < def.cost) return;
    setGameState(prev => {
      const newSlots = [...prev.towerSlots];
      newSlots[showSeedSelector.index!] = { id: Math.random().toString(36).substr(2, 9), type, growth: 0, health: 100, plantedAt: Date.now(), lastUpdate: Date.now() };
      return { ...prev, money: prev.money - def.cost, towerSlots: newSlots };
    });
    setShowSeedSelector({ active: false, index: null });
  };

  const harvestPlant = (index: number) => {
    const plant = gameState.towerSlots[index];
    if (!plant) return;
    const def = PLANT_DEFS[plant.type];
    const earnings = plant.health > 10 ? def.value * (plant.health / 100) * (plant.growth / 100) : 0;
    setGameState(prev => {
      const newSlots = [...prev.towerSlots];
      newSlots[index] = null;
      return { ...prev, money: prev.money + earnings, towerSlots: newSlots, experience: prev.experience + 25 };
    });
  };

  return (
    <div className="flex flex-col lg:flex-row items-stretch h-full overflow-hidden no-select">
      <div className="w-full lg:w-[450px] xl:w-[500px] p-4 sm:p-8 flex flex-col bg-white shadow-2xl border-r border-slate-200 shrink-0 custom-scroll">
        <div className="flex items-center gap-4 mb-6 shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                <FlaskConical className="text-blue-400 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Hydroponic Lab</h1>
                <p className="text-[8px] sm:text-[9px] text-blue-500 font-bold uppercase tracking-[0.2em] mt-1">MyFanjan Simulation v6.5</p>
            </div>
        </div>
        
        <Dashboard 
          state={gameState} 
          tankCapacity={TANK_CAPACITY_L}
          onUpdate={(key, val) => setGameState(prev => ({ ...prev, [key]: val }))} 
          onBuyNutrient={buyNutrient}
          onDrainNutrient={drainNutrient}
          advice={advice} 
          onRefreshAdvice={refreshAdvice}
          optimScore={diagnostics.score}
        />

        <div className="mt-6 p-4 bg-slate-50 rounded-3xl border border-slate-100 shrink-0 mb-4">
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-3 h-3 text-orange-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bio-Capteurs</span>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {diagnostics.alerts.length > 0 ? diagnostics.alerts.map((alert, i) => (
                    <div key={i} className="text-[10px] font-bold text-slate-600 bg-white p-2 rounded-xl border border-slate-100 flex items-center gap-2">
                       <span className="w-1 h-1 rounded-full bg-orange-400"></span>{alert}
                    </div>
                )) : <div className="text-[10px] font-bold text-green-600 bg-green-50 p-2 rounded-xl border border-green-100">✓ Équilibre biologique parfait</div>}
            </div>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-4 bg-slate-100 overflow-hidden">
        <div className="transform scale-75 sm:scale-85 md:scale-95 lg:scale-100 xl:scale-110">
          <Tower slots={gameState.towerSlots} onSlotClick={(idx) => setShowSeedSelector({active: true, index: idx})} onHarvest={harvestPlant} />
        </div>
        
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-white/90 backdrop-blur-md p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl border border-white z-10">
            <span className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Cycle de Vie</span>
            <span className="text-xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight italic">J-{gameState.gameDay}</span>
        </div>
      </div>

      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-xl p-4">
          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] max-w-lg w-full p-8 sm:p-10 shadow-2xl text-center">
            <div className="w-16 h-16 sm:w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FlaskConical className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Hydroponic Lab MyFanjan</h2>
            <p className="text-slate-500 mb-8 text-xs sm:text-sm leading-relaxed">
              Votre réservoir de <strong>30 Litres</strong> est prêt. <br/> 
              Chaque dose d'engrais coûte <strong>0,50€</strong> pour +10%.<br/>
              Optimisez l'EC et le pH pour une croissance maximale !
            </p>
            <button onClick={() => setShowIntro(false)} className="w-full bg-slate-900 text-white font-black py-4 sm:py-5 rounded-2xl hover:bg-blue-600 transition-all uppercase text-[10px] sm:text-xs tracking-widest active:scale-95">
              Démarrer le Lab
            </button>
          </div>
        </div>
      )}

      {showSeedSelector.active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 text-center">
          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] max-w-md w-full p-6 sm:p-8 shadow-2xl">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Semences</h3>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(PLANT_DEFS) as PlantType[]).map(type => (
                <button key={type} onClick={() => plantSeed(type)} className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-slate-50 hover:border-blue-400 hover:bg-blue-50 transition-all text-left flex flex-col items-center sm:items-start active:scale-95">
                  <div className="mb-1 sm:mb-2">{ICONS[type]}</div>
                  <p className="font-black text-slate-900 text-xs sm:text-sm">{type}</p>
                  <p className="text-[8px] sm:text-[10px] font-bold text-green-600">{PLANT_DEFS[type].cost.toFixed(2)}€ / graine</p>
                </button>
              ))}
            </div>
            <button onClick={() => setShowSeedSelector({ active: false, index: null })} className="mt-6 text-slate-400 font-bold text-xs uppercase hover:text-slate-900">Retour</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
