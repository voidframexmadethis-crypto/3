// Reliable Save System for Mining Empire
import { managementSystem } from "./management-system";
import { achievementsSystem } from "./achievements-system";
import { gemEncyclopediaSystem } from "./encyclopedia-system";

export type GameSettings = {
  graphicsQuality: "low" | "medium" | "ultra";
  masterVolume: number;
  musicVolume: number;
  caveMusicVolume: number;
  factoryMusicVolume: number;
  sfxVolume: number;
  cameraSensitivity: number;
  movementControls: "keyboard" | "touch" | "both";
  mobileControlsVisible: boolean;
  performanceShadows: boolean;
  particleDensity: "low" | "medium" | "high";
};

export const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: "ultra",
  masterVolume: 80,
  musicVolume: 70,
  caveMusicVolume: 70,
  factoryMusicVolume: 70,
  sfxVolume: 80,
  cameraSensitivity: 1.0,
  movementControls: "both",
  mobileControlsVisible: true,
  performanceShadows: true,
  particleDensity: "high"
};

export type GameSaveData = {
  version: number;
  timestamp: number;
  cash: number;
  inventory: Record<string, number>;
  jewelryInventory: Record<string, number>;
  backpackCapacity: number;
  depthFeet: number;
  remainingCaveGems: number;
    upgrades: {
      power: number;
      speed: number;
      backpack: number;
      elevatorSpeed: number;
      scanner: boolean;
      helmetLight: number;
    };
  managementData: any;
  achievementsData: any;
  encyclopediaData: any;
  settings: GameSettings;
  hasSeenTutorial: boolean;
  statistics: {
    grossDailyIncome: number;
    totalRevenue: number;
    totalOperatingExpenses: number;
    totalWagesPaid: number;
    netProfitRate: number;
    productionEfficiency: number;
    totalGemsProcessed: number;
    totalJewelryManufactured: number;
  };
  batteries: number;
  diamonds: number;
  ownedItems: string[];
  minedDeposits?: string[];
};

const SAVE_KEY = "mining_empire_save_data_v1";

import { db, auth, OperationType, handleFirestoreError } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export const saveSystem = {
  async saveGame(data: Omit<GameSaveData, "version" | "timestamp">): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      const fullData: GameSaveData = {
        version: 1,
        timestamp: Date.now(),
        ...data
      };
      
      // Local Save
      localStorage.setItem(SAVE_KEY, JSON.stringify(fullData));

      // Cloud Sync if authenticated
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const cloudData = {
          ...fullData,
          id: auth.currentUser.uid,
          updatedAt: serverTimestamp()
        };
        try {
          await setDoc(userRef, cloudData, { merge: true });
        } catch (e) {
          console.warn("Cloud save pending/offline, data persisted in local storage:", e);
        }
      }
    } catch (e) {
      console.warn("Failed to save game data:", e);
    }
  },

  async loadGame(): Promise<GameSaveData | null> {
    if (typeof window === "undefined") return null;
    
    let localData: GameSaveData | null = null;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) localData = JSON.parse(raw) as GameSaveData;
    } catch (e) {
      console.warn("Failed to load local data:", e);
    }

    // Attempt Cloud Load if authenticated
    if (auth.currentUser) {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const cloudData = snap.data() as GameSaveData;
          // Prefer cloud data if it's newer or local is missing
          if (!localData || (cloudData.timestamp > (localData.timestamp || 0))) {
            return cloudData;
          }
        }
      } catch (e) {
        console.warn("Cloud save sync offline/unavailable, using local save:", e);
      }
    }

    return localData;
  },

  clearSave(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      console.warn("Failed to clear save data:", e);
    }
  }
};

