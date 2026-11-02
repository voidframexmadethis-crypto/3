'use client';

import React from "react";
import { motion } from "motion/react";
import { X, ShoppingCart, ShieldCheck, Zap, Coins, Gem } from "lucide-react";
import { PREMIUM_ITEMS, PremiumItem } from "@/lib/premium-items";

type PremiumShopModalProps = {
  isOpen: boolean;
  onClose: () => void;
  ownedItems: string[];
  cash: number;
  batteries: number;
  diamonds: number;
  onPurchaseWithCash: (item: PremiumItem) => void;
};

export default function PremiumShopModal({ 
  isOpen, 
  onClose, 
  ownedItems, 
  cash,
  batteries,
  diamonds,
  onPurchaseWithCash 
}: PremiumShopModalProps) {
  if (!isOpen) return null;

  const categories = [
    { id: "premium_drills", name: "Premium Drillbits", icon: <Gem className="w-4 h-4" /> },
    { id: "endgame_drills", name: "Endgame Drillbits", icon: <Zap className="w-4 h-4" /> },
    { id: "batteries", name: "Batteries & Power", icon: <Zap className="w-4 h-4" /> },
    { id: "endgame_cash", name: "Endgame Cash", icon: <Coins className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-3xl w-full bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center gap-3 text-purple-400">
            <ShoppingCart className="w-6 h-6" />
            <h2 className="text-lg font-bold text-white">Industrial Product Shop</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-3 py-1 rounded-lg border border-cyan-500/30 flex items-center gap-1.5">
              <span>💎</span>
              <span className="text-cyan-300 font-mono font-bold text-xs">{diamonds}</span>
            </div>
            <div className="bg-slate-950 px-3 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-amber-400 font-mono font-bold text-xs">{batteries}</span>
            </div>
            <div className="bg-slate-950 px-3 py-1 rounded-lg border border-emerald-500/30">
              <span className="text-emerald-400 font-mono font-bold text-xs">${cash.toLocaleString()}</span>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          {categories.map((cat) => {
            const items = PREMIUM_ITEMS.filter(i => i.category === cat.id);
            if (items.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-4">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-l-2 border-purple-500 pl-3">
                  {cat.icon}
                  <span className="uppercase tracking-widest text-xs">{cat.name}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((item) => {
                    const isOwned = ownedItems.includes(item.id);
                    const canAfford = item.currency === "CASH" 
                      ? cash >= item.price 
                      : item.currency === "BATTERIES" 
                        ? batteries >= item.price 
                        : item.currency === "DIAMONDS"
                          ? diamonds >= item.price
                          : true;

                    return (
                      <div key={item.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 hover:border-purple-500/30 transition-colors flex gap-4">
                        <div className="w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center text-3xl shadow-inner shrink-0">
                          {item.imageUrl}
                        </div>
                        <div className="flex flex-col flex-1 gap-1">
                          <h3 className="font-bold text-white text-sm">{item.name}</h3>
                          <p className="text-[10px] text-slate-400 leading-tight">{item.description}</p>
                          <div className="flex items-center justify-between mt-auto pt-2">
                            <span className="font-mono font-bold text-xs text-emerald-400">
                              {item.currency === "CASH" 
                                ? `$${item.price.toLocaleString()}` 
                                : item.currency === "BATTERIES" 
                                ? `${item.price} Batteries` 
                                : `${item.price} 💎`}
                            </span>
                            
                            {isOwned ? (
                              <span className="px-2 py-1 bg-emerald-900/50 text-emerald-300 rounded text-[10px] font-bold flex items-center gap-1 border border-emerald-500/30">
                                <ShieldCheck className="w-3 h-3" /> OWNED
                              </span>
                            ) : (
                              <button
                                onClick={() => onPurchaseWithCash(item)}
                                disabled={!canAfford}
                                className={`px-3 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                  canAfford 
                                    ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                                    : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
                                }`}
                              >
                                {item.currency === "CASH" 
                                  ? (canAfford ? "Buy with Cash" : "Need Cash") 
                                  : item.currency === "BATTERIES"
                                  ? (canAfford ? "Buy with Batteries" : "Need Batteries")
                                  : (canAfford ? "Buy with Diamonds" : "Need Diamonds")
                                }
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
