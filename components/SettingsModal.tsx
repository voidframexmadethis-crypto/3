'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sliders, Volume2, Monitor, Gamepad2, Eye, RotateCcw, Compass, AlertTriangle } from "lucide-react";
import { GameSettings, DEFAULT_SETTINGS } from "@/lib/save-system";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSettingsChange: (newSettings: GameSettings) => void;
  onRestartTutorial: () => void;
  onTeleportToElevator: () => void;
};

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onRestartTutorial,
  onTeleportToElevator
}: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<GameSettings>(settings);
  const [showTeleportConfirm, setShowTeleportConfirm] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onSettingsChange(updated);
  };

  const handleResetDefaults = () => {
    setLocalSettings(DEFAULT_SETTINGS);
    onSettingsChange(DEFAULT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 select-none font-sans">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-xl w-full bg-slate-900 border-2 border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/40">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-white tracking-wide">Game Settings & Navigation</h2>
              <p className="text-xs text-emerald-400 font-mono">
                Graphics, Audio, Controls & Fast Travel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Settings Options */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Teleport to Elevator Quick Action */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-amber-500/40 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-300">Fast Travel</h3>
                  <p className="text-[11px] text-slate-400">Instantly teleport to the cave elevator arrival point.</p>
                </div>
              </div>
              
              {!showTeleportConfirm ? (
                <button
                  onClick={() => setShowTeleportConfirm(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-900/40 transition-all cursor-pointer border border-amber-400 active:scale-95"
                >
                  Teleport to Elevator
                </button>
              ) : null}
            </div>

            {/* Confirmation Step */}
            <AnimatePresence>
              {showTeleportConfirm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 text-xs text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Confirm teleportation to elevator? Inventory and progress are fully preserved.</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowTeleportConfirm(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowTeleportConfirm(false);
                        onClose();
                        onTeleportToElevator();
                      }}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-md cursor-pointer"
                    >
                      Confirm
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Graphics Quality */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-emerald-400" />
              <span>Graphics Quality</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "ultra"] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => handleUpdate("graphicsQuality", q)}
                  className={`py-2 px-4 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${
                    localSettings.graphicsQuality === q
                      ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20"
                      : "bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Volumes */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <label className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Audio Volumes</span>
            </label>

            <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              {/* Music Volume */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Music Volume</span>
                  <span className="font-mono text-emerald-400">{localSettings.musicVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localSettings.musicVolume}
                  onChange={(e) => handleUpdate("musicVolume", Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* SFX Volume */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Sound Effects Volume</span>
                  <span className="font-mono text-emerald-400">{localSettings.sfxVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localSettings.sfxVolume}
                  onChange={(e) => handleUpdate("sfxVolume", Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Camera Sensitivity */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Camera Sensitivity</span>
            </label>
            <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={localSettings.cameraSensitivity}
                onChange={(e) => handleUpdate("cameraSensitivity", Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="font-mono text-xs text-emerald-400 w-12 text-right">
                {localSettings.cameraSensitivity.toFixed(1)}x
              </span>
            </div>
          </div>

          {/* Controls & Performance Toggles */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-emerald-400" />
              <span>Controls & Performance</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800/50">
                <span className="text-xs text-slate-300">Mobile Joystick</span>
                <input
                  type="checkbox"
                  checked={localSettings.mobileControlsVisible}
                  onChange={(e) => handleUpdate("mobileControlsVisible", e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800/50">
                <span className="text-xs text-slate-300">Real-Time Shadows</span>
                <input
                  type="checkbox"
                  checked={localSettings.performanceShadows}
                  onChange={(e) => handleUpdate("performanceShadows", e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Tutorial Replay Action */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Need a refresher on how to play?</span>
            <button
              onClick={() => {
                onClose();
                onRestartTutorial();
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs rounded-xl transition-all cursor-pointer border border-emerald-500/30"
            >
              Replay Tutorial Guide
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 text-sm cursor-pointer"
          >
            Save & Close
          </button>
        </div>

      </motion.div>
    </div>
  );
}
