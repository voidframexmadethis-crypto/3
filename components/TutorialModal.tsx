'use client';

import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, ArrowLeft, X, Compass, Drill, Factory, Gem, Users, BookOpen, ShoppingBag, ShieldCheck } from "lucide-react";

type TutorialModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const TUTORIAL_STEPS = [
  {
    title: "Welcome to Mining Empire 3D",
    icon: Compass,
    description: "You are the CEO of a multi-million dollar subterranean mining corporation. Your goal is to extract rare crystals, process raw ores, manufacture luxury jewelry, and build the ultimate mining empire across 185 million voxel deposits."
  },
  {
    title: "Surface Exploration & Facilities",
    icon: Factory,
    description: "Explore the surface world where your Corporate Headquarters, Surface Factory, and Jewelry Boutique are located. Walk near buildings to interact with them and manage your multi-departmental business."
  },
  {
    title: "The Hyper-Speed Elevator",
    icon: Drill,
    description: "Step onto the elevator platform near the center and press 'E' (or the elevator call button) to plunge down into the deep underground caverns at 35 m/s — faster than world-class skyscrapers!"
  },
  {
    title: "Mining Crystal Ore Deposits",
    icon: PickaxeIconComponent,
    description: "Approach voxel ore deposits in the cave and hold left-click (or use auto-drill) to shatter Minecraft-style blocks. As you mine deeper (100ft+), you'll discover rarer, more valuable gemstone types."
  },
  {
    title: "Backpack & Inventory Management",
    icon: ShoppingBag,
    description: "Your backpack has limited capacity. When full, return to the surface trader near the elevator shaft to sell your raw gems for cash, or deposit them directly onto the factory conveyor belt."
  },
  {
    title: "Factory Conveyors & Production",
    icon: Factory,
    description: "Deposit your mined gemstone inventory into the factory conveyor hopper. Raw ore deposits automatically feed into automated crushers, sorters, polishers, and refiners to produce refined gem products."
  },
  {
    title: "Workers & Wage Management",
    icon: Users,
    description: "Open the Management Headquarters (Office building) to hire miners, conveyor operators, and master craftsmen. Assign them to boost production speed and conveyor throughput while managing daily wage payroll."
  },
  {
    title: "Jewelry Manufacturing & Boutique",
    icon: Gem,
    description: "Take refined gems to the Jewelry Manufacturing Workshop to craft diamond rings and gold necklaces. Sell high-end jewelry at the Boutique for massive luxury profits."
  },
  {
    title: "Gem Encyclopedia & Achievements",
    icon: BookOpen,
    description: "Discover all 8 unique gemstone types (Tiki, Saga, Burger, Cash, Diamond, Bergen, Safety, Kaka) to unlock full entries in the Illustrated Gem Encyclopedia and earn lucrative milestone cash bonuses!"
  }
];

function PickaxeIconComponent(props: any) {
  return <Sparkles {...props} />;
}

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-xl w-full bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Getting Started Guide</h2>
              <p className="text-xs text-emerald-400 font-mono">
                Step {currentStep + 1} of {TUTORIAL_STEPS.length}
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

        {/* Content */}
        <div className="p-8 flex flex-col items-center text-center">
          <h3 className="text-2xl font-extrabold text-emerald-300 mb-4">
            {step.title}
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed max-w-md">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center gap-2 mt-8">
            {TUTORIAL_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStep ? "w-8 bg-emerald-500" : "w-2 bg-slate-700 hover:bg-slate-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-t border-slate-800">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              currentStep === 0
                ? "opacity-40 cursor-not-allowed text-slate-500"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-emerald-400 font-medium underline cursor-pointer"
          >
            Skip Tutorial
          </button>

          {isLast ? (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-sm"
            >
              <span>Start Mining!</span>
              <ShieldCheck className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(TUTORIAL_STEPS.length - 1, prev + 1))}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-sm"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
