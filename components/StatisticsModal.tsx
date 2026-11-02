'use client';

import React from "react";
import { motion } from "motion/react";
import { X, BarChart3, TrendingUp, DollarSign, Gem, Factory, Users, Sparkles, ShieldCheck } from "lucide-react";
import { managementSystem } from "@/lib/management-system";
import { gemEncyclopediaSystem } from "@/lib/encyclopedia-system";

type StatisticsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cash: number;
  totalMined: number;
};

export default function StatisticsModal({ isOpen, onClose, cash, totalMined }: StatisticsModalProps) {
  if (!isOpen) return null;

  const stats = managementSystem.getStats();
  const workers = managementSystem.getWorkers();
  const discoveredGems = gemEncyclopediaSystem.getDiscoveredGems();

  const totalWages = workers.reduce((sum, w) => sum + w.wagesPerMin, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-2xl w-full bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Business & Production Statistics</h2>
              <p className="text-xs text-emerald-400 font-mono">
                Real-Time Corporate Performance Metrics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Top Financial Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col">
              <span className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Current Balance</span>
              </span>
              <span className="text-xl font-black text-emerald-300 font-mono">
                ${cash.toLocaleString()}
              </span>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col">
              <span className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Total Revenue</span>
              </span>
              <span className="text-xl font-black text-cyan-300 font-mono">
                ${stats.totalRevenue.toLocaleString()}
              </span>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col">
              <span className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Payroll Expenses</span>
              </span>
              <span className="text-xl font-black text-amber-300 font-mono">
                ${totalWages}/s
              </span>
            </div>
          </div>

          {/* Production Metrics */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Gem className="w-4 h-4" />
              <span>Mining & Processing Output</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-300">Total Gems Mined</span>
                <span className="font-mono text-sm font-bold text-emerald-300">{totalMined.toLocaleString()}</span>
              </div>

              <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-300">Gems Processed in Factory</span>
                <span className="font-mono text-sm font-bold text-cyan-300">{stats.totalGemsProcessed.toLocaleString()}</span>
              </div>

              <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-300">Jewelry Manufactured</span>
                <span className="font-mono text-sm font-bold text-purple-300">{stats.totalJewelryManufactured.toLocaleString()}</span>
              </div>

              <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-300">Gross Daily Income</span>
                <span className="font-mono text-sm font-bold text-emerald-300">${stats.grossDailyIncome.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Workforce & Machinery */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Factory className="w-4 h-4" />
              <span>Workforce & Operational Efficiency</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Active Workers</span>
                <span className="font-mono text-lg font-bold text-white mt-1">{workers.length}</span>
              </div>

              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Operational Machines</span>
                <span className="font-mono text-lg font-bold text-white mt-1">4 Lines</span>
              </div>

              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Discovered Gems</span>
                <span className="font-mono text-lg font-bold text-emerald-400 mt-1">{discoveredGems.length} / 8</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Verified Economic Ledger</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 text-sm cursor-pointer"
          >
            Close Statistics
          </button>
        </div>

      </motion.div>
    </div>
  );
}
