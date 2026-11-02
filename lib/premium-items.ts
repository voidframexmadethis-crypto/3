export type PremiumItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: "CASH" | "BATTERIES" | "DIAMONDS";
  imageUrl: string;
  category: "premium_drills" | "endgame_drills" | "batteries" | "endgame_cash";
};

export const PREMIUM_ITEMS: PremiumItem[] = [
  // Premium Drills (Purchased with In-Game Cash or Achievement Diamonds)
  {
    id: "drill_premium_v1",
    name: "Obsidian Core Drillbit",
    description: "Premium drillbit with extreme heat resistance and 3x mining speed.",
    price: 5000000,
    currency: "CASH",
    imageUrl: "💎",
    category: "premium_drills"
  },
  {
    id: "drill_premium_v2",
    name: "Diamond-Infused Bit",
    description: "Elite drillbit that ignores hardness levels of all known ores. Purchased with achievement diamonds.",
    price: 50,
    currency: "DIAMONDS",
    imageUrl: "💠",
    category: "premium_drills"
  },

  // Endgame Drillbits (Require Batteries)
  {
    id: "drill_endgame_gold",
    name: "Midas Touch Drill",
    description: "Requires advanced power. Converts waste rock into gold dust.",
    price: 10,
    currency: "BATTERIES",
    imageUrl: "🏆",
    category: "endgame_drills"
  },

  // Batteries (Purchased with In-Game Cash)
  {
    id: "battery_pack_small",
    name: "Advanced Battery Cell",
    description: "High-density energy storage for endgame equipment.",
    price: 500000,
    currency: "CASH",
    imageUrl: "🔋",
    category: "batteries"
  },

  // Endgame Cash Section (Purchased with In-Game Cash)
  {
    id: "cash_bundle_mega",
    name: "Empire Expansion Fund",
    description: "Instantly inject $10,000,000 into your corporate account.",
    price: 25000000,
    currency: "CASH",
    imageUrl: "💰",
    category: "endgame_cash"
  }
];
