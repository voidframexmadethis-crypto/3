'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Drill, Sparkles, ShieldCheck, Play, ArrowRight, Pickaxe } from "lucide-react";

type LoadingScreenProps = {
  onComplete: () => void;
};

const TIPS = [
  "Tip: Upgrade your crystal drill power in the HUD upgrades menu to mine rare Kaka gems faster!",
  "Tip: Conveyor belts automatically feed raw voxel ore deposits from the cave mine to the surface factory.",
  "Tip: Take the hyper-speed elevator down to the 100ft+ gem caverns where high-value gems await.",
  "Tip: Hire managers and specialized workers at the Corporate Headquarters to automate your mining empire.",
  "Tip: Process raw gems into exquisite diamond rings and gold necklaces at the jewelry manufacturing boutique.",
  "Tip: Discover all 8 gemstone types to unlock secret achievements and massive cash bonuses."
];

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Rotate tips every 3.5 seconds
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 3500);

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsReady(true);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 15) + 8;
        return next > 100 ? 100 : next;
      });
    }, 280);

    return () => {
      clearInterval(tipInterval);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white select-none overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(32,232,181,0.15)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full mx-4 p-8 bg-slate-900/90 border border-emerald-500/30 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
        
        {/* Game Logo & Title */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-400 shadow-lg shadow-emerald-500/20"
          >
            <Drill className="w-10 h-10" />
          </motion.div>
          <div className="text-left">
            <h1 className="text-3xl font-black tracking-wider bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              DEEP GEM MINE 3D
            </h1>
            <p className="text-xs text-emerald-400/80 font-mono tracking-widest uppercase">
              Mining Empire Simulator & Factory Tycoon
            </p>
          </div>
        </div>

        {/* Designated Cover Art Slot */}
        <div className="my-6 w-full h-48 rounded-xl bg-slate-950/80 border-2 border-dashed border-emerald-500/40 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent z-10" />
          <div className="relative z-20 flex flex-col items-center p-4">
            <Pickaxe className="w-12 h-12 text-emerald-400 mb-2 opacity-80 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-emerald-300">Official Game Cover Artwork Area</span>
            <span className="text-xs text-slate-400 mt-1 max-w-xs">
              Designated slot for publisher artwork asset. Automatically integrates when provided by game owner.
            </span>
          </div>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-full mb-6">
          <div className="flex justify-between items-center text-xs font-mono mb-2 text-slate-300">
            <span>LOADING VIRTUAL WORLD...</span>
            <span className="text-emerald-400 font-bold">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>

        {/* Rotating Gameplay Tips */}
        <div className="min-h-[50px] mb-8 flex items-center justify-center px-4 py-2 bg-slate-950/50 rounded-xl border border-slate-800/80 w-full">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTipIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-slate-300 italic"
            >
              {TIPS[currentTipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Enter Game Button */}
        {isReady ? (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onComplete}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-3 cursor-pointer text-lg tracking-wide uppercase transition-all"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>Enter Mining Empire</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        ) : (
          <div className="w-full py-4 px-6 bg-slate-800/50 text-slate-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-wait text-sm tracking-wide">
            <Sparkles className="w-5 h-5 animate-spin text-emerald-400" />
            <span>Generating 185M Voxel Crystals & Initializing Systems...</span>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Persistent Auto-Save & Cloud-Ready Architecture</span>
        </div>

      </div>
    </div>
  );
}
