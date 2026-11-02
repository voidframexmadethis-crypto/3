// Mining Empire — Minecraft-Inspired Advancement-Tree Achievement System

export type Achievement = {
  id: string;
  title: string;
  description: string;
  rewardDiamonds: number;
  rewardCash: number;
  icon: string;
  category: "mining" | "factory" | "gemstones" | "workers" | "exploration" | "equipment" | "mastery";
  parentId?: string;
  unlocked: boolean;
  claimed: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  x?: number;
  y?: number;
};

export const ACHIEVEMENTS_LIST: Achievement[] = [
  // 1. MINING TREE
  {
    id: "mine_first",
    title: "First Strike",
    description: "Mine your first 10 gems in the 99,000 FT subterranean cavern.",
    rewardDiamonds: 5,
    rewardCash: 350,
    icon: "⛏️",
    category: "mining",
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 10,
    x: 0,
    y: 0
  },
  {
    id: "mine_100",
    title: "Centurion Miner",
    description: "Extract 100 gemstones from the 99,000 FT mineral deposits.",
    rewardDiamonds: 10,
    rewardCash: 1200,
    icon: "💎",
    category: "mining",
    parentId: "mine_first",
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 100,
    x: 1,
    y: 0
  },
  {
    id: "mine_1000",
    title: "Mineral Titan",
    description: "Mine 1,000 gemstones across all 99,000 FT cave chambers.",
    rewardDiamonds: 25,
    rewardCash: 6000,
    icon: "🌋",
    category: "mining",
    parentId: "mine_100",
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 1000,
    x: 2,
    y: 0
  },

  // 2. FACTORY PRODUCTION TREE
  {
    id: "process_first",
    title: "Conveyor Belt Pioneer",
    description: "Process your first gem through the factory conveyor line.",
    rewardDiamonds: 5,
    rewardCash: 500,
    icon: "🏭",
    category: "factory",
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 1,
    x: 0,
    y: 1
  },
  {
    id: "process_500",
    title: "Industrial Revolution",
    description: "Process 500 gemstones into refined mineral bars.",
    rewardDiamonds: 15,
    rewardCash: 3500,
    icon: "⚙️",
    category: "factory",
    parentId: "process_first",
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 500,
    x: 1,
    y: 1
  },
  {
    id: "process_1000",
    title: "Assembly Line Master",
    description: "Process 1,000 gemstones through all factory machinery.",
    rewardDiamonds: 30,
    rewardCash: 8000,
    icon: "🚀",
    category: "factory",
    parentId: "process_500",
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 1000,
    x: 2,
    y: 1
  },

  // 3. GEMSTONE DISCOVERIES TREE
  {
    id: "gem_rare_find",
    title: "Rare Specimen",
    description: "Discover a rare gemstone species in the 99,000 FT deep mine.",
    rewardDiamonds: 10,
    rewardCash: 1500,
    icon: "✨",
    category: "gemstones",
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 1,
    x: 0,
    y: 2
  },
  {
    id: "discover_all_gems",
    title: "Grand Geologist",
    description: "Discover all 8 gemstone species in the Gemstone Encyclopedia.",
    rewardDiamonds: 40,
    rewardCash: 12000,
    icon: "📖",
    category: "gemstones",
    parentId: "gem_rare_find",
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 8,
    x: 1,
    y: 2
  },

  // 4. WORKER MANAGEMENT TREE
  {
    id: "hire_worker",
    title: "Hiring Manager",
    description: "Hire your first industrial factory worker.",
    rewardDiamonds: 5,
    rewardCash: 600,
    icon: "👷",
    category: "workers",
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 1,
    x: 0,
    y: 3
  },
  {
    id: "hire_10_workers",
    title: "Corporate Fleet",
    description: "Employ a roster of 10 workers across all production facilities.",
    rewardDiamonds: 20,
    rewardCash: 7500,
    icon: "🏢",
    category: "workers",
    parentId: "hire_worker",
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 10,
    x: 1,
    y: 3
  },

  // 5. EXPLORATION TREE (99,000 FT Mega-Cave Scale)
  {
    id: "explore_deep",
    title: "Abyssal Descent (7.3 Miles / 38,600 FT)",
    description: "Descend into the 38,600 FT (7.3 miles) subterranean crystal canyon.",
    rewardDiamonds: 15,
    rewardCash: 2000,
    icon: "🌊",
    category: "exploration",
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 38600,
    x: 0,
    y: 4
  },
  {
    id: "explore_benthic",
    title: "Mega-Abyss (18.7 Miles / 17.8 KM / 99,000 FT)",
    description: "Reach the ultimate 99,000 FT deep core in the 99,000 FT elevator.",
    rewardDiamonds: 35,
    rewardCash: 15000,
    icon: "⚓",
    category: "exploration",
    parentId: "explore_deep",
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 99000,
    x: 1,
    y: 4
  },

  // 6. EQUIPMENT TREE
  {
    id: "upgrade_drill",
    title: "Hardened Edge",
    description: "Upgrade your crystal drill power for the first time.",
    rewardDiamonds: 5,
    rewardCash: 400,
    icon: "⚡",
    category: "equipment",
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 1,
    x: 0,
    y: 5
  },
  {
    id: "max_equipment",
    title: "Fully Industrialized",
    description: "Max out your drill power and elevator speed.",
    rewardDiamonds: 30,
    rewardCash: 10000,
    icon: "🛠️",
    category: "equipment",
    parentId: "upgrade_drill",
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 2,
    x: 1,
    y: 5
  },

  // 7. LEGENDARY MASTERY TREE
  {
    id: "wealth_100k",
    title: "Six-Figure Mogul",
    description: "Accumulate $100,000 in total mining capital.",
    rewardDiamonds: 25,
    rewardCash: 15000,
    icon: "💵",
    category: "mastery",
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 100000,
    x: 0,
    y: 6
  },
  {
    id: "legendary_tycoon",
    title: "Mining Empire Legend",
    description: "Accumulate $10,000,000 in capital and master all industries.",
    rewardDiamonds: 100,
    rewardCash: 50000,
    icon: "👑",
    category: "mastery",
    parentId: "wealth_100k",
    unlocked: false,
    claimed: false,
    progress: 0,
    maxProgress: 10000000,
    x: 1,
    y: 6
  }
];

export class AchievementsSystem {
  private achievements: Achievement[] = [];
  public onUnlocked?: (achievement: Achievement) => void;

  constructor() {
    this.load();
  }

  getAchievements(): Achievement[] {
    return [...this.achievements];
  }

  updateProgress(
    id: string,
    currentValue: number,
    onReward?: (cash: number, diamonds: number) => void
  ): boolean {
    const ach = this.achievements.find(a => a.id === id);
    if (!ach || ach.unlocked) return false;

    ach.progress = Math.min(ach.maxProgress, Math.max(ach.progress, currentValue));
    if (ach.progress >= ach.maxProgress) {
      ach.unlocked = true;
      ach.unlockedAt = new Date().toLocaleTimeString();
      this.save();
      this.onUnlocked?.(ach);
      return true;
    }
    this.save();
    return false;
  }

  claimReward(id: string): { rewardDiamonds: number; rewardCash: number } | null {
    const ach = this.achievements.find(a => a.id === id);
    if (!ach || !ach.unlocked || ach.claimed) return null;

    ach.claimed = true;
    this.save();
    return { rewardDiamonds: ach.rewardDiamonds, rewardCash: ach.rewardCash };
  }

  // Check state against milestones
  checkAll(
    state: {
      totalMined: number;
      totalProcessed: number;
      totalJewelry: number;
      workerCount: number;
      cash: number;
      depth: number;
      discoveredGemsCount: number;
      drillPower: number;
    },
    onReward: (cash: number, diamonds: number) => void
  ) {
    this.updateProgress("mine_first", state.totalMined, onReward);
    this.updateProgress("mine_100", state.totalMined, onReward);
    this.updateProgress("mine_1000", state.totalMined, onReward);

    this.updateProgress("process_first", state.totalProcessed, onReward);
    this.updateProgress("process_500", state.totalProcessed, onReward);
    this.updateProgress("process_1000", state.totalProcessed, onReward);

    if (state.discoveredGemsCount > 0) {
      this.updateProgress("gem_rare_find", 1, onReward);
    }
    this.updateProgress("discover_all_gems", state.discoveredGemsCount, onReward);

    this.updateProgress("hire_worker", state.workerCount, onReward);
    this.updateProgress("hire_10_workers", state.workerCount, onReward);

    if (state.depth >= 38600) {
      this.updateProgress("explore_deep", 38600, onReward);
    }
    if (state.depth >= 99000) {
      this.updateProgress("explore_benthic", 99000, onReward);
    }

    if (state.drillPower > 25) {
      this.updateProgress("upgrade_drill", 1, onReward);
    }

    this.updateProgress("wealth_100k", state.cash, onReward);
    this.updateProgress("legendary_tycoon", state.cash, onReward);
  }

  private save() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("mining_empire_achievements_v2", JSON.stringify(this.achievements));
    } catch (e) {
      console.warn("Error saving achievements:", e);
    }
  }

  private load() {
    if (typeof window === "undefined") {
      this.achievements = JSON.parse(JSON.stringify(ACHIEVEMENTS_LIST));
      return;
    }
    try {
      const saved = localStorage.getItem("mining_empire_achievements_v2");
      if (saved) {
        const parsed: Achievement[] = JSON.parse(saved);
        this.achievements = ACHIEVEMENTS_LIST.map(def => {
          const found = parsed.find(p => p.id === def.id);
          return found ? { ...def, ...found } : { ...def };
        });
      } else {
        this.achievements = JSON.parse(JSON.stringify(ACHIEVEMENTS_LIST));
      }
    } catch (e) {
      this.achievements = JSON.parse(JSON.stringify(ACHIEVEMENTS_LIST));
    }
  }
}

export const achievementsSystem = new AchievementsSystem();
