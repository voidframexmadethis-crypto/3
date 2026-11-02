'use client';

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Rocket, X, Zap, Gauge, ArrowDown, ArrowUp } from "lucide-react";

type ElevatorControlModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onPressGo: () => void;
  elevatorState: "mine" | "traveling-up" | "surface" | "traveling-down";
  elevatorSpeed: number;
};

export default function ElevatorControlModal({
  isOpen,
  onClose,
  onPressGo,
  elevatorState,
  elevatorSpeed
}: ElevatorControlModalProps) {
  if (!isOpen) return null;

  const isSurface = elevatorState === "surface";
  const speedMps = Math.max(150, elevatorSpeed * 4);
  const speedKmh = Math.round(speedMps * 3.6);
  const speedMph = Math.round(speedMps * 2.237);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-4 select-none">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          className="max-w-2xl w-full bg-slate-900 border-2 border-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 bg-slate-950/80 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-black font-black shadow-lg shadow-emerald-500/30">
                <Rocket className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>HYPERION SHAFT ELEVATOR</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                    WORLD RECORD
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Inspired by Taipei 101, Sears Tower, Hancock & Falcon&apos;s Flight
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-8 space-y-6">
            {/* Speed Gauge & Comparison Panel */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  HYPER-SPEED LAUNCH VELOCITY
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> ULTRA SPEED MODE
                </span>
              </div>

              {/* Huge Speed Readout */}
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-5xl font-black font-mono text-white tracking-tight">
                  {speedMps} <span className="text-2xl text-emerald-400">m/s</span>
                </span>
                <span className="text-lg font-mono text-slate-400">
                  ({speedKmh} km/h &bull; {speedMph} mph)
                </span>
              </div>

              {/* Speed Badges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[10px] font-mono">
                <div className="bg-slate-900/80 p-2 rounded-xl text-slate-400 border border-slate-800">
                  <div className="text-slate-500 font-bold">Sears Tower</div>
                  <div className="text-white font-bold">9.1 m/s</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl text-slate-400 border border-slate-800">
                  <div className="text-slate-500 font-bold">Taipei 101</div>
                  <div className="text-white font-bold">16.8 m/s</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl text-slate-400 border border-slate-800">
                  <div className="text-slate-500 font-bold">Falcon&apos;s Flight</div>
                  <div className="text-white font-bold">55.5 m/s</div>
                </div>
                <div className="bg-emerald-950/60 p-2 rounded-xl text-emerald-300 border border-emerald-500/40">
                  <div className="text-emerald-400 font-bold">Hyperion Elevator</div>
                  <div className="text-emerald-300 font-black">{speedMps} m/s</div>
                </div>
              </div>
            </div>

            {/* Destination Info */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isSurface ? (
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                    <ArrowDown className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <ArrowUp className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest font-mono">
                    TARGET DESTINATION
                  </div>
                  <div className="text-base font-black text-white">
                    {isSurface ? "99,000 FT DEEP SUBTERRANEAN GEM CAVE ABYSS" : "SURFACE MINING BASE & JEWELRY FACTORY"}
                  </div>
                </div>
              </div>
            </div>

            {/* THE ONLY WAY TO OPERATE THE ELEVATOR: PRESS THE WORD 'GO' */}
            <div className="pt-2">
              <button
                onClick={onPressGo}
                className="w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-5xl py-8 rounded-3xl shadow-2xl shadow-emerald-500/40 tracking-widest flex items-center justify-center gap-6 active:scale-95 transition-all border-b-8 border-b-emerald-700 cursor-pointer group"
              >
                <Rocket className="w-12 h-12 text-slate-950 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                <span className="drop-shadow-md">GO</span>
              </button>
              <p className="text-center text-xs text-slate-400 font-mono mt-3">
                Pressing <strong className="text-emerald-400 uppercase font-black">GO</strong> will seal cabin doors and launch hyper-speed transport.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
