
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Leaf, AlertTriangle, Zap, FlaskConical, Droplets, PlusCircle, Settings, X, BarChart3, Activity, Target } from 'lucide-react';
import Tower from './components/Tower';
import Dashboard from './components/Dashboard';
import { GameState, PlantInstance, PlantType } from './types';
import { PLANT_DEFS, TOWER_SLOTS_COUNT, TICK_RATE, ICONS } from './constants';
import { getGardenAdvice } from './services/geminiService';

const TANK_CAPACITY_L = 30;
const INITIAL_STATE: GameState = {
  money: 15.00,
  experience: 0,
  currentTemp: 21,
  currentWater: 70,
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
const BASE_DEPLETION_RATE = 0.05;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [advice, setAdvice] = useState<string>("");
  const [showIntro, setShowIntro] = useState(true);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [showSeedSelector, setShowSeedSelector] = useState<{ active: boolean; index: number | null }>({ active: false, index: null });
  
  // Calcul des paramètres de compromis optimaux (Moyenne pondérée des besoins)
  const systemDiagnostics = useMemo(() => {
    const activePlants = gameState.towerSlots.filter(p => p !== null) as PlantInstance[];
    
    if (activePlants.length === 0) {
      return { 
        alerts: ["Système prêt"], 
        score: 100, 
        avgGrowthRate: 0,
        targets: { ph: 6.0, ec: 1.2, temp: 21, n: 40, p: 40, k: 40 }
      };
    }

    // Calcul des cibles idéales de compromis (Moyenne)
    const targets = activePlants.reduce((acc, p) => {
      const def = PLANT_DEFS[p.type];
      acc.ph += def.idealPH;
      acc.ec += def.idealEC;
      acc.temp += def.idealTemp;
      acc.n += def.idealN;
      acc.p += def.idealP;
      acc.k += def.idealK;
      return acc;
    }, { ph: 0, ec: 0, temp: 0, n: 0, p: 0, k: 0 });

    const count = activePlants.length;
    const avgTargets = {
      ph: targets.ph / count,
      ec: targets.ec / count,
      temp: targets.temp / count,
      n: targets.n / count,
      p: targets.p / count,
      k: targets.k / count
    };

    const alerts: string[] = [];
    let penaltySum = 0;

    activePlants.forEach(p => {
      const def = PLANT_DEFS[p.type];
      
      const phErr = Math.abs(gameState.currentPH - def.idealPH);
      const ecErr = Math.abs(gameState.currentEC - def.idealEC);
      const waterErr = Math.abs(gameState.currentWater - def.idealWater) / 20;
      const nErr = Math.abs(gameState.currentN - def.idealN) / 25;
      const pErr = Math.abs(gameState.currentP - def.idealP) / 25;
      const kErr = Math.abs(gameState.currentK - def.idealK) / 25;

      if (phErr > 0.8) alerts.push(`Incompatibilité pH: ${p.type}`);
      if (ecErr > 0.7) alerts.push(`Incompatibilité EC: ${p.type}`);
      if (gameState.currentN < 10) alerts.push(`Carence Azote: ${p.type}`);
      
      penaltySum += (phErr * 2.5 + ecErr * 1.8 + waterErr + nErr + pErr + kErr);
    });

    const score = Math.max(0, 100 - (penaltySum / count) * 12);

    return { 
      alerts: Array.from(new Set(alerts)), 
      score: Math.round(score),
      avgGrowthRate: score / 100,
      targets: avgTargets
    };
  }, [gameState]);

  useEffect(() => {
    const timer = setInterval(() => {
      setGameState(prev => {
        const now = Date.now();
        const activePlants = prev.towerSlots.filter(p => p !== null) as PlantInstance[];
        
        let nCons = 0, pCons = 0, kCons = 0, wCons = 0.02;
        
        const newSlots = prev.towerSlots.map(plant => {
          if (!plant) return null;
          const def = PLANT_DEFS[plant.type];
          const sizeFactor = 0.5 + (plant.growth / 100);
          nCons += BASE_DEPLETION_RATE * sizeFactor;
          pCons += (BASE_DEPLETION_RATE * 0.7) * sizeFactor;
          kCons += (BASE_DEPLETION_RATE * 1.2) * sizeFactor;
          wCons += 0.05 * sizeFactor;

          const phPenalty = Math.abs(prev.currentPH - def.idealPH);
          const ecPenalty = Math.abs(prev.currentEC - def.idealEC);
          const nutPenalty = (Math.abs(prev.currentN - def.idealN) + Math.abs(prev.currentP - def.idealP) + Math.abs(prev.currentK - def.idealK)) / 30;
          const totalPenalty = phPenalty + ecPenalty + nutPenalty;
          
          let healthDelta = 0.8;
          if (totalPenalty > 1.0) healthDelta = -1.5 * totalPenalty;
          if (prev.currentN <= 2 || prev.currentWater <= 5) healthDelta = -10.0;

          const newHealth = Math.min(100, Math.max(0, plant.health + healthDelta));
          const efficiency = Math.max(0, 1 - (totalPenalty * 0.45));
          const growthDelta = (newHealth > 10 && plant.growth < 100) ? def.growthRate * (newHealth / 100) * efficiency : 0;
          
          const newGrowth = Math.min(100, plant.growth + growthDelta);
          
          // Marquer le jour de maturité dès que 100% est atteint
          let maturedAtDay = plant.maturedAtDay;
          if (newGrowth >= 100 && maturedAtDay === undefined) {
            maturedAtDay = prev.gameDay;
          }

          return { 
            ...plant, 
            growth: newGrowth, 
            health: newHealth, 
            maturedAtDay,
            lastUpdate: now 
          };
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
        return { ...prev, money: prev.money - NUTRIENT_DOSE_COST, [type]: Math.min(100, (prev[type] as number) + 15) };
    });
  };

  const drainNutrient = (type: 'currentN' | 'currentP' | 'currentK') => {
    setGameState(prev => ({ ...prev, [type]: Math.max(0, (prev[type] as number) - 15) }));
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
    
    // Calcul de la valeur de base
    let baseEarnings = plant.health > 10 ? def.value * (plant.health / 100) * (plant.growth / 100) : 0;
    
    // Gestion du pourrissement
    if (plant.maturedAtDay !== undefined) {
      const daysSinceMaturity = gameState.gameDay - plant.maturedAtDay;
      if (daysSinceMaturity >= 10) {
        baseEarnings = 0; // Marron, invendable
      } else if (daysSinceMaturity >= 5) {
        baseEarnings *= 0.5; // Jaune, -50%
      }
    }

    setGameState(prev => {
      const newSlots = [...prev.towerSlots];
      newSlots[index] = null;
      return { ...prev, money: prev.money + baseEarnings, towerSlots: newSlots, experience: prev.experience + 25 };
    });
  };

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden no-select flex flex-col lg:flex-row">
      <div className="flex-1 relative flex items-center justify-center p-4 min-h-0 order-1 lg:order-2 overflow-hidden">
        <div className="transform scale-[0.7] xs:scale-[0.75] sm:scale-[0.8] md:scale-[0.85] lg:scale-[1.1] transition-transform duration-500 origin-center">
          <Tower 
            slots={gameState.towerSlots} 
            onSlotClick={(idx) => setShowSeedSelector({active: true, index: idx})} 
            onHarvest={harvestPlant} 
            currentGameDay={gameState.gameDay}
          />
        </div>
        
        <div className="absolute top-6 right-6 lg:top-10 lg:right-10 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/50 z-10">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Jour</span>
            <span className="text-2xl font-black text-slate-900 font-mono italic">#{gameState.gameDay}</span>
        </div>

        <button 
          onClick={() => setIsDashboardOpen(true)}
          className="lg:hidden absolute bottom-8 right-6 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl z-20 active:scale-90 transition-transform"
        >
          <Settings className="w-6 h-6" />
        </button>

        <div className="lg:hidden absolute top-6 left-6 flex gap-2 z-10">
            <div className="bg-slate-900/90 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                <span className="text-green-400">●</span> {gameState.money.toFixed(2)}€
            </div>
            <div className={`px-3 py-1.5 rounded-full text-sm font-bold shadow-lg transition-colors duration-500 ${systemDiagnostics.score > 80 ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                {systemDiagnostics.score}%
            </div>
        </div>
      </div>

      <div className={`
        fixed inset-y-0 left-0 z-40 w-full sm:w-[400px] lg:w-[450px] bg-white shadow-2xl transform transition-transform duration-500 ease-in-out
        lg:relative lg:translate-x-0 order-2 lg:order-1 flex flex-col
        ${isDashboardOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 sm:p-8 flex flex-col h-full overflow-y-auto custom-scroll">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                        <FlaskConical className="text-blue-400 w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tighter uppercase leading-none">Hydro Lab MyFanjan</h1>
                        <p className="text-[8px] text-blue-500 font-bold uppercase tracking-[0.2em] mt-1 italic">Compromis Mixte Actif</p>
                    </div>
                </div>
                <button onClick={() => setIsDashboardOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-900">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="lg:hidden grid grid-cols-2 gap-2 mb-6 p-1">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Efficacité</p>
                    <div className="flex items-center gap-2">
                        <Activity className={`w-4 h-4 ${systemDiagnostics.score > 80 ? 'text-green-500' : 'text-orange-500'}`} />
                        <span className="text-lg font-black">{systemDiagnostics.score}%</span>
                    </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Croissance</p>
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-lg font-black">x{systemDiagnostics.avgGrowthRate.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <Dashboard 
              state={gameState} 
              tankCapacity={TANK_CAPACITY_L}
              systemTargets={systemDiagnostics.targets}
              onUpdate={(key, val) => setGameState(prev => ({ ...prev, [key]: val }))} 
              onBuyNutrient={buyNutrient}
              onDrainNutrient={drainNutrient}
              advice={advice} 
              onRefreshAdvice={refreshAdvice}
              optimScore={systemDiagnostics.score}
            />

            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-3 h-3 text-orange-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capteurs de Compatibilité</span>
                </div>
                <div className="space-y-1.5">
                    {systemDiagnostics.alerts.length > 0 ? systemDiagnostics.alerts.map((alert, i) => (
                        <div key={i} className="text-[10px] font-bold text-slate-600 bg-white p-2 rounded-lg border border-slate-100 flex items-center gap-2">
                           <span className="w-1 h-1 rounded-full bg-orange-400"></span>{alert}
                        </div>
                    )) : <div className="text-[10px] font-bold text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">✓ Mélange harmonieux</div>}
                </div>
            </div>
        </div>
      </div>

      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-xl p-6">
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-10 shadow-2xl text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FlaskConical className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Hydro Lab MyFanjan</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              Optimisez votre culture mixte !<br/> 
              L'algorithme calcule les <strong>cibles de compromis</strong> (points rouges sur les réglages) pour satisfaire toutes vos plantes à la fois.
            </p>
            <button onClick={() => setShowIntro(false)} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-blue-600 transition-all uppercase text-xs tracking-widest active:scale-95">
              Initialiser le Lab
            </button>
          </div>
        </div>
      )}

      {showSeedSelector.active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6 text-center">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Semences</h3>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(PLANT_DEFS) as PlantType[]).map(type => (
                <button key={type} onClick={() => plantSeed(type)} className="p-4 rounded-3xl border-2 border-slate-50 hover:border-blue-400 hover:bg-blue-50 transition-all text-left flex flex-col items-center sm:items-start active:scale-95">
                  <div className="mb-2">{ICONS[type]}</div>
                  <p className="font-black text-slate-900 text-sm">{type}</p>
                  <p className="text-[10px] font-bold text-green-600">{PLANT_DEFS[type].cost.toFixed(2)}€ / unité</p>
                </button>
              ))}
            </div>
            <button onClick={() => setShowSeedSelector({ active: false, index: null })} className="mt-8 text-slate-400 font-bold text-xs uppercase hover:text-slate-900">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;