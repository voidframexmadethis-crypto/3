'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trophy, Gem, Sparkles, CheckCircle2, Lock, Pickaxe, Factory, Users, Compass, Shield, Crown } from "lucide-react";
import { Achievement } from "@/lib/achievements-system";

type AchievementsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCloseAll: () => void;
  achievements: Achievement[];
  diamonds: number;
  onClaimReward: (id: string) => void;
};

const CATEGORIES = [
  { id: "mining", name: "Mining", icon: <Pickaxe className="w-4 h-4 text-cyan-400" /> },
  { id: "factory", name: "Factory", icon: <Factory className="w-4 h-4 text-orange-400" /> },
  { id: "gemstones", name: "Gemstones", icon: <Gem className="w-4 h-4 text-purple-400" /> },
  { id: "workers", name: "Workers", icon: <Users className="w-4 h-4 text-emerald-400" /> },
  { id: "exploration", name: "Exploration", icon: <Compass className="w-4 h-4 text-blue-400" /> },
  { id: "equipment", name: "Equipment", icon: <Shield className="w-4 h-4 text-pink-400" /> },
  { id: "mastery", name: "Mastery", icon: <Crown className="w-4 h-4 text-amber-500" /> },
];

export default function AchievementsModal({
  isOpen,
  onClose,
  onCloseAll,
  achievements,
  diamonds,
  onClaimReward
}: AchievementsModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>("mining");

  if (!isOpen) return null;

  const categoryAchievements = achievements.filter(a => a.category === activeCategory);
  const completedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const claimedCount = achievements.filter(a => a.claimed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-3 md:p-6 select-none font-sans">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-w-5xl w-full bg-[#111318] border-4 border-[#3f382b] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] text-white"
      >
        {/* Minecraft Advancement Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1a1c23] border-b-2 border-[#2d271f]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#252018] border-2 border-[#5c4d36] rounded-xl text-amber-400 shadow-inner">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black tracking-wider text-amber-300 font-mono">
                MINING EMPIRE ADVANCEMENTS
              </h2>
              <p className="text-xs text-slate-400">
                Completed: <span className="text-emerald-400 font-bold">{completedCount}</span> / {totalCount} &bull; Claimed: <span className="text-amber-400 font-bold">{claimedCount}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Diamond Currency Balance */}
            <div className="bg-[#181a20] px-4 py-2 rounded-xl border-2 border-cyan-500/40 flex items-center gap-2.5 shadow-lg shadow-cyan-950/50">
              <span className="text-xl">💎</span>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest text-cyan-400/80 font-bold">Achievement Diamonds</span>
                <span className="text-cyan-300 font-mono font-black text-sm">{diamonds}</span>
              </div>
            </div>

            {/* Close All Menus Button with X */}
            <button
              onClick={onCloseAll}
              className="px-3.5 py-2 bg-[#262a35] hover:bg-rose-950/80 text-slate-300 hover:text-rose-200 rounded-xl transition-all cursor-pointer border-2 border-slate-700 hover:border-rose-500/60 active:scale-95 flex items-center gap-2 shadow-lg"
              title="Close All Menus"
            >
              <X className="w-5 h-5 text-rose-400" />
              <span className="text-xs font-black font-mono tracking-wide hidden sm:inline">Close All Menus</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 bg-[#15171d] border-b-2 border-[#26211a] overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => {
            const isCatComplete = achievements
              .filter(a => a.category === cat.id)
              .every(a => a.claimed);
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border-2 ${
                  activeCategory === cat.id
                    ? "bg-[#3a2d1d] text-amber-300 shadow-lg shadow-amber-950/50 border-amber-500/80"
                    : "bg-[#1b1e27] text-slate-400 hover:text-slate-200 hover:bg-[#222632] border-[#2c313f]"
                }`}
              >
                {cat.icon}
                <span>{cat.name}</span>
                {isCatComplete && <span className="text-[10px] text-emerald-400">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Advancement Tree / Node Graph Container */}
        <div className="p-6 overflow-y-auto flex-1 bg-[radial-gradient(circle_at_center,rgba(26,29,38,0.9)_0%,rgba(13,15,20,0.98)_100%)] relative">
          <div className="max-w-3xl mx-auto flex flex-col gap-6 relative">
            
            {/* Background Tree Grid Line Connector */}
            <div className="absolute left-10 top-8 bottom-8 w-1 bg-[#2a2e3d] -z-0" />

            {categoryAchievements.map((ach, index) => {
              const isReadyToClaim = ach.unlocked && !ach.claimed;
              const isClaimed = ach.claimed;
              const isInProgress = !ach.unlocked;
              const progressPct = Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100));

              return (
                <div key={ach.id} className="relative z-10 flex flex-col gap-2">
                  {/* Branch connecting line if not first */}
                  {index > 0 && (
                    <div className="absolute -top-6 left-10 w-0.5 h-6 bg-amber-500/40 -z-10" />
                  )}

                  <div
                    className={`p-5 rounded-2xl border-2 transition-all flex flex-col md:flex-row gap-5 items-start md:items-center relative overflow-hidden shadow-xl ${
                      isClaimed
                        ? "bg-[#141d1a] border-emerald-600/60 shadow-emerald-950/30"
                        : isReadyToClaim
                        ? "bg-[#251d14] border-amber-500 shadow-amber-500/20 animate-pulse"
                        : "bg-[#181b24] border-[#2e3445] opacity-90 hover:opacity-100"
                    }`}
                  >
                    {/* Icon Slot with Minecraft Advancement Border Style */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-inner border-2 ${
                      isClaimed 
                        ? "bg-emerald-950/80 border-emerald-500 text-emerald-300" 
                        : isReadyToClaim 
                        ? "bg-amber-950/90 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/30" 
                        : "bg-[#111319] border-[#292f3e] text-slate-400"
                    }`}>
                      {ach.icon}
                    </div>

                    {/* Information & Progress */}
                    <div className="flex flex-col flex-1 gap-2 w-full">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-black text-sm md:text-base tracking-wide ${
                            isClaimed ? "text-emerald-300" : isReadyToClaim ? "text-amber-300" : "text-slate-200"
                          }`}>
                            {ach.title}
                          </h3>
                          {ach.parentId && (
                            <span className="text-[10px] bg-[#222735] px-2 py-0.5 rounded-md text-slate-400 border border-slate-700">
                              Sub-Advancement
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 self-start md:self-auto">
                          <div className="bg-[#111319] px-3 py-1 rounded-xl border border-cyan-500/40 flex items-center gap-1.5 text-xs font-mono text-cyan-300 shadow-inner">
                            <span>💎</span>
                            <span className="font-bold">+{ach.rewardDiamonds} Diamonds</span>
                          </div>
                          <div className="bg-[#111319] px-2.5 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1 text-xs font-mono text-emerald-300">
                            <span>💵</span>
                            <span className="font-bold">+${ach.rewardCash.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {ach.description}
                      </p>

                      {/* Progress Bar & Percentage */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between items-center text-[11px] font-mono">
                          <span className="text-slate-400">
                            Progress: <strong className="text-white">{ach.progress.toLocaleString()}</strong> / {ach.maxProgress.toLocaleString()}
                          </span>
                          <span className={isClaimed ? "text-emerald-400 font-bold" : isReadyToClaim ? "text-amber-400 font-bold" : "text-cyan-400"}>
                            {progressPct}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-[#0d0f14] rounded-full overflow-hidden border border-[#2a3040]">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isClaimed 
                                ? "bg-emerald-500" 
                                : isReadyToClaim 
                                ? "bg-amber-500 animate-pulse" 
                                : "bg-cyan-500"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Claim Button / Status Badge */}
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#262c3b]">
                        <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400">
                          Milestone Status:{" "}
                          <strong className={isClaimed ? "text-emerald-400" : isReadyToClaim ? "text-amber-400" : "text-slate-400"}>
                            {isClaimed ? "Completed & Claimed" : isReadyToClaim ? "Ready to Claim Reward!" : "In Progress"}
                          </strong>
                        </span>

                        {isClaimed ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold font-mono shadow-inner">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>CLAIMED</span>
                          </div>
                        ) : isReadyToClaim ? (
                          <button
                            onClick={() => onClaimReward(ach.id)}
                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 border border-amber-300"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Claim Reward 💎+{ach.rewardDiamonds}</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111319] border border-[#262c3b] text-slate-500 text-xs font-semibold font-mono">
                            <Lock className="w-3.5 h-3.5" />
                            <span>LOCKED</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-[#161820] border-t-2 border-[#2b251d] gap-3">
          <div className="text-xs text-slate-400 font-mono text-center md:text-left">
            💡 Minecraft Advancement Tree: Complete milestones to claim exclusive diamonds and fund advanced industrial machinery.
          </div>
          <button
            onClick={onCloseAll}
            className="w-full md:w-auto px-8 py-2.5 bg-rose-700 hover:bg-rose-600 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-rose-950/40 cursor-pointer transition-all border border-rose-500 active:scale-95 flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            <span>Close All Menus</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
