'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingCart, Gem, Zap, Trophy, Volume2, BarChart3, Settings, HelpCircle, Rocket, Layers, Sun, Lightbulb } from "lucide-react";
import { GAME_GEMS } from "@/lib/gems";
import { JEWELRY_PRODUCTS } from "@/lib/jewelry-factory";
import { soundManager, AudioZone } from "@/lib/audio";
import { useAnimatedMoney } from "@/lib/use-animated-money";

type Upgrades = {
  power: number;
  speed: number;
  backpack: number;
  elevatorSpeed: number;
  scanner: boolean;
  helmetLight: number;
};

type PlayerState = "walking" | "climbing" | "swimming" | "driving";

type MiningHUDProps = {
  cash: number;
  inventory: Record<string, number>;
  jewelryInventory: Record<string, number>;
  totalGemsCount: number;
  backpackCapacity: number;
  location: string;
  depthFeet: number;
  elevatorSpeed: number;
  remainingCaveGems: number;
  upgrades: Upgrades;
  onUpgrade: (type: keyof Upgrades) => void;
  onSellGems: () => void;
  onSellJewelry: (productId: string) => void;
  onCallElevator: () => void;
  nearElevator: boolean;
  nearTrader: boolean;
  nearFactory: boolean;
  nearJewelryShop: boolean;
  isAutoDrilling: boolean;
  clearScreenMode: boolean;
  onToggleClearScreen: () => void;
  onDepositToFactory: () => void;
  factoryNotification: string | null;
  onOpenOffice: () => void;
  onOpenEncyclopedia: () => void;
  onOpenSettings: () => void;
  onOpenStatistics: () => void;
  onOpenPublishingKit: () => void;
  onOpenPremiumShop: () => void;
  onOpenAchievements: () => void;
  onOpenTutorial: () => void;
  nearOffice: boolean;
  diamonds: number;
  achievementToast: { title: string; description: string; rewardCash: number; icon: string } | null;
  gameTime: number;
  onCloseAll: () => void;
  isAnyMenuOpen: boolean;
  user: any;
  onSignIn: () => void;
  headlampOn: boolean;
  onToggleHeadlamp: () => void;
  headlampBrightness: number;
  onSetHeadlampBrightness: (val: number) => void;
  playerState: PlayerState;
  oxygen: number;
  onOpenMap: () => void;
  onOpenElevatorMenu?: () => void;
};

export default function MiningHUD({
  cash,
  inventory,
  jewelryInventory,
  totalGemsCount,
  backpackCapacity,
  location,
  depthFeet,
  upgrades,
  onUpgrade,
  onSellGems,
  onSellJewelry,
  nearElevator,
  nearTrader,
  nearFactory,
  nearJewelryShop,
  isAutoDrilling,
  clearScreenMode,
  onToggleClearScreen,
  factoryNotification,
  onOpenOffice,
  onOpenSettings,
  onOpenPremiumShop,
  onOpenAchievements,
  onOpenEncyclopedia,
  onOpenStatistics,
  onOpenPublishingKit,
  onOpenTutorial,
  nearOffice,
  diamonds,
  achievementToast,
  gameTime,
  onCloseAll,
  isAnyMenuOpen,
  user,
  onSignIn,
  headlampOn,
  onToggleHeadlamp,
  headlampBrightness,
  onSetHeadlampBrightness,
  playerState,
  oxygen,
  onOpenMap,
  onOpenElevatorMenu
}: MiningHUDProps) {


  const [activeTab, setActiveTab] = useState<"gems" | "upgrades" | "jewelry" | "none">("none");

  const animatedCash = useAnimatedMoney(cash, 250);

  const upgradeCosts = {
    power: Math.floor(100 * Math.pow(1.5, Math.floor(upgrades.power - 20))),
    speed: Math.floor(150 * Math.pow(1.6, Math.round((upgrades.speed - 1) * 10))),
    backpack: Math.floor(120 * Math.pow(1.4, Math.floor(backpackCapacity / 10))),
    elevatorSpeed: Math.floor(250 * Math.pow(1.5, Math.round((upgrades.elevatorSpeed - 35) / 5))),
    scanner: 1000,
    helmetLight: Math.floor(500 * Math.pow(2.0, upgrades.helmetLight - 1))
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex flex-col justify-between p-4 md:p-8 font-sans">
      {/* UNDERWATER TINT OVERLAY */}
      <AnimatePresence>
        {playerState === "swimming" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-blue-600/30 backdrop-blur-[2px] pointer-events-none z-0"
          />
        )}
      </AnimatePresence>

      {/* 1. TOP SECTIONS (HIDDEN IN CLEAR SCREEN) */}
      {!clearScreenMode && (
        <div className="flex justify-between items-start w-full">
          {/* TOP LEFT: PRODUCT SHOP & ACHIEVEMENTS */}
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              onClick={onOpenPremiumShop}
              className="group bg-slate-950/90 backdrop-blur-xl border border-purple-500/50 rounded-2xl px-4 py-3 text-white font-black text-xs flex items-center gap-3 hover:bg-slate-900 transition-all shadow-2xl shadow-purple-900/20 active:scale-95 border-b-4 border-b-purple-700"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="uppercase tracking-widest text-[9px] text-purple-400">Logistics</span>
                <span className="text-xs">SHOP</span>
              </div>
            </button>

            <button
              onClick={onOpenAchievements}
              className="group bg-slate-950/90 backdrop-blur-xl border border-amber-500/50 rounded-2xl px-4 py-3 text-white font-black text-xs flex items-center gap-3 hover:bg-slate-900 transition-all shadow-2xl shadow-amber-900/20 active:scale-95 border-b-4 border-b-amber-700"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="uppercase tracking-widest text-[9px] text-amber-400">Advancements</span>
                <span className="text-xs flex items-center gap-1">
                  <span>ACHIEVEMENTS</span>
                  <span className="text-cyan-400 font-mono">({diamonds}💎)</span>
                </span>
              </div>
            </button>
          </div>

          {/* TOP CENTER: CLOSE ALL MENUS BUTTON */}
          <div className="absolute left-1/2 -translate-x-1/2 top-4 pointer-events-auto">
            <AnimatePresence>
              {isAnyMenuOpen && (
                <motion.button
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -50, opacity: 0 }}
                  onClick={onCloseAll}
                  className="bg-red-600 hover:bg-red-500 text-white font-black px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border-b-4 border-b-red-800 active:scale-95 transition-all"
                >
                  <X className="w-5 h-5" />
                  <span className="text-sm tracking-tighter uppercase">Close All Menus</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* TOP RIGHT: MINIMALIST MONEY & TIME */}
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            <div className="bg-slate-950/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl px-6 py-3 shadow-2xl shadow-emerald-900/10 border-b-4 border-b-emerald-700/50 flex flex-col items-end">
              <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-500/60 font-black mb-1">Available Capital</div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400 font-mono font-black text-2xl tabular-nums leading-none">
                  ${animatedCash.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-3 h-3 text-amber-500" />
                <span>{Math.floor(gameTime).toString().padStart(2, '0')}:{(Math.floor((gameTime % 1) * 60)).toString().padStart(2, '0')}</span>
                <span className="text-[8px] text-slate-500">{gameTime >= 6 && gameTime < 18 ? "DAY" : "NIGHT"}</span>
              </div>
            </div>
            
            <button
              onClick={onToggleClearScreen}
              className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              HIDE INTERFACE
            </button>
          </div>
        </div>
      )}

      {/* 2. PERSISTENT TOGGLE (ONLY VISIBLE WHEN INTERFACE HIDDEN) */}
      {clearScreenMode && (
        <div className="absolute top-8 right-8 pointer-events-auto">
          <button
            onClick={onToggleClearScreen}
            className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black text-slate-400 hover:text-white transition-all shadow-xl active:scale-95 cursor-pointer"
          >
            SHOW INTERFACE
          </button>
        </div>
      )}

      {/* 3. CENTER / BOTTOM OVERLAYS (HIDDEN IN CLEAR SCREEN) */}
      <AnimatePresence>
        {!clearScreenMode && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="pointer-events-auto flex flex-col gap-4 max-w-5xl mx-auto w-full mb-4"
          >
            {/* Factory Notification Banner */}
            {factoryNotification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-950/90 border border-emerald-500/60 text-emerald-300 px-5 py-3 rounded-2xl text-xs font-mono shadow-2xl backdrop-blur-xl flex items-center justify-between"
              >
                <span>{factoryNotification}</span>
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Automated Pipeline</span>
              </motion.div>
            )}

            {/* Achievement Toast */}
            {achievementToast && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="bg-slate-950/95 border-2 border-amber-500 text-amber-200 px-6 py-4 rounded-2xl text-xs font-mono shadow-2xl backdrop-blur-xl flex items-center gap-4"
              >
                <div className="text-3xl">{achievementToast.icon}</div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Advancement Unlocked!</span>
                  <span className="text-white font-bold text-sm">{achievementToast.title}</span>
                  <span className="text-slate-300 text-[11px]">{achievementToast.description}</span>
                </div>
              </motion.div>
            )}

            {/* Primary Action Bar */}
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl px-6 py-4 text-white shadow-2xl flex items-center justify-between gap-6 border-b-4 border-b-slate-800">
              <div className="flex items-center gap-8">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[9px] uppercase font-black tracking-widest">Global Ops</span>
                  <span className="text-sm font-black text-white flex items-center gap-2">
                    <Rocket className="w-3 h-3 text-cyan-400" />
                    <span>{location}</span>
                  </span>
                </div>

                <div className="h-8 w-px bg-slate-800" />

                <div className="flex flex-col">
                  <span className="text-slate-500 text-[9px] uppercase font-black tracking-widest">Elevation</span>
                  <span className="text-sm font-black text-cyan-400 font-mono">
                    {depthFeet} FT
                  </span>
                </div>

                <div className="h-8 w-px bg-slate-800" />

                <div className="flex flex-col">
                  <span className="text-slate-500 text-[9px] uppercase font-black tracking-widest">Backpack</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    {Object.values(inventory).reduce((a, b) => a + b, 0)} / {backpackCapacity}
                  </span>
                </div>
              </div>

              {/* Utility Modals / Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenEncyclopedia}
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer border border-slate-700"
                  title="Gemstone Encyclopedia"
                >
                  <Gem className="w-4 h-4 text-purple-400" />
                </button>
                <button
                  onClick={onOpenStatistics}
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer border border-slate-700"
                  title="Corporate Statistics"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                </button>
                <button
                  onClick={onOpenSettings}
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer border border-slate-700"
                  title="Game Settings"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={onOpenTutorial}
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer border border-slate-700"
                  title="Help & Tutorial"
                >
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                </button>
                <button
                  onClick={onOpenMap}
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer border border-slate-700"
                  title="Cave Map"
                >
                  <Rocket className="w-4 h-4 text-sky-400 rotate-45" />
                </button>
              </div>
            </div>

            {/* Stage 5: Advanced Controls (Headlamp & Boarding) */}
            <div className="flex items-center justify-between gap-4">
              {/* Headlamp Controls */}
              <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl px-4 py-2 flex items-center gap-4 text-white shadow-xl">
                <button
                  onClick={onToggleHeadlamp}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${headlampOn ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                  title="Toggle 400m Mining Headlamp (Shortcut: L)"
                >
                  <Sun className={`w-4 h-4 ${headlampOn ? 'animate-pulse' : ''}`} />
                  <span className="text-[10px] font-mono font-bold tracking-wider">{headlampOn ? "HEADLAMP ON [L]" : "HEADLAMP OFF [L]"}</span>
                </button>
                <div className="flex flex-col gap-1 w-36">
                  <div className="flex justify-between text-[8px] uppercase font-black text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Lightbulb className="w-2.5 h-2.5 text-amber-400" />
                      400m Beam
                    </span>
                    <span className="text-amber-400">{Math.round(headlampBrightness * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.5"
                    step="0.05"
                    value={headlampBrightness}
                    onChange={(e) => onSetHeadlampBrightness(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>

              {/* Elevator Launch Prompt */}
              {nearElevator && onOpenElevatorMenu && (
                <button
                  onClick={onOpenElevatorMenu}
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black px-6 py-2.5 rounded-2xl font-mono text-xs uppercase tracking-widest animate-pulse shadow-2xl flex items-center gap-2 border-2 border-emerald-300 cursor-pointer active:scale-95 transition-all"
                >
                  <Rocket className="w-4 h-4 text-slate-950 animate-bounce" />
                  <span>OPEN ELEVATOR MENU & PRESS GO</span>
                </button>
              )}

              {/* Railway Boarding Prompt */}
              {playerState === "walking" && !nearElevator && (
                <div className="bg-emerald-600 text-white px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest animate-bounce shadow-2xl flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  <span>Press [F] to board locomotive</span>
                </div>
              )}
              {playerState === "driving" && (
                <div className="bg-red-600 text-white px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2">
                  <X className="w-4 h-4" />
                  <span>Press [F] to exit locomotive</span>
                </div>
              )}

              {/* Auth / Cloud Sync Status */}
              <button
                onClick={user ? undefined : onSignIn}
                className={`bg-slate-900/90 backdrop-blur-xl border ${user ? 'border-emerald-500/50' : 'border-blue-500/50'} rounded-2xl px-4 py-2 flex items-center gap-3 text-white shadow-xl transition-all active:scale-95`}
              >
                {user ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Cloud Synced</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Sign In for Cloud Save</span>
                  </>
                )}
              </button>
            </div>

            {/* Stage 6: Oxygen Gauge (Only when swimming or low) */}
            <AnimatePresence>
              {(playerState === "swimming" || oxygen < 100) && (
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  className="bg-slate-950/90 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-4 flex flex-col gap-2 w-64 shadow-2xl"
                >
                  <div className="flex justify-between items-center text-[10px] uppercase font-black text-cyan-400 tracking-widest">
                    <span className="flex items-center gap-2">
                      <Zap className={`w-3 h-3 ${oxygen < 30 ? 'animate-pulse text-red-500' : ''}`} />
                      Oxygen Level
                    </span>
                    <span className={oxygen < 30 ? 'text-red-500' : ''}>{Math.round(oxygen)}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <motion.div 
                      className={`h-full ${oxygen < 30 ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-600 to-blue-500'}`}
                      initial={{ width: "100%" }}
                      animate={{ width: `${oxygen}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  {oxygen < 30 && (
                    <span className="text-[8px] text-red-500 font-black uppercase text-center animate-pulse">Critical: Surface Immediately</span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
