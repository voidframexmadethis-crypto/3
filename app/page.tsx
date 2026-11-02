'use client';

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { AnimatePresence } from "motion/react";
import MiningHUD from "@/components/MiningHUD";
import ManagementModal from "@/components/ManagementModal";
import EncyclopediaModal from "@/components/EncyclopediaModal";
import LoadingScreen from "@/components/LoadingScreen";
import TutorialModal from "@/components/TutorialModal";
import SettingsModal from "@/components/SettingsModal";
import StatisticsModal from "@/components/StatisticsModal";
import PublishingKitModal from "@/components/PublishingKitModal";
import PremiumShopModal from "@/components/PremiumShopModal";
import AchievementsModal from "@/components/AchievementsModal";
import { saveSystem, DEFAULT_SETTINGS, GameSettings } from "@/lib/save-system";
import { createSurfaceFactory } from "@/lib/factory-engine";
import { createJewelryFactory } from "@/lib/jewelry-factory";
import { GAME_GEMS, GemOreDeposit, GemDrillController, GemType } from "@/lib/gems";
import { soundManager } from "@/lib/audio";
import { buildMiningWorld } from "@/lib/cave-builder";
import { managementSystem } from "@/lib/management-system";
import { achievementsSystem } from "@/lib/achievements-system";
import { gemEncyclopediaSystem, GemstoneEntry } from "@/lib/encyclopedia-system";
import { createWorkerRenderer, WorkerRenderer } from "@/lib/worker-render-engine";
import { createManagementOfficeBuilding, ManagementOfficeBuilding } from "@/lib/management-office-building";
import { auth, signInWithGoogle, testConnection } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { RailwaySystem } from "@/lib/railway";
import CaveMap from "@/components/CaveMap";

import ElevatorControlModal from "@/components/ElevatorControlModal";

type PlayerState = "walking" | "climbing" | "swimming" | "driving";

type ElevatorState = "mine" | "traveling-up" | "surface" | "traveling-down";


export default function DeepMiningApp() {
  const mountRef = useRef<HTMLDivElement>(null);

  const INITIAL_CAVE_GEMS = 12800000000;
  const STARTING_BACKPACK_CAPACITY = 13;

  const [cash, setCash] = useState(100);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [jewelryInventory, setJewelryInventory] = useState<Record<string, number>>({});
  const [backpackCapacity, setBackpackCapacity] = useState(STARTING_BACKPACK_CAPACITY);
  const [location, setLocation] = useState("99,000 FT Deep Mega-Cave (18.7 Miles / 17.8 KM Subterranean Abyss)");
  const [depthFeet, setDepthFeet] = useState(99000);
  const [remainingCaveGems, setRemainingCaveGems] = useState(INITIAL_CAVE_GEMS);
  const [showFactory, setShowFactory] = useState(false);
  const [nearJewelryShop, setNearJewelryShop] = useState(false);
  const [factoryNotification, setFactoryNotification] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>("walking");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [headlampOn, setHeadlampOn] = useState(true);
  const [headlampBrightness, setHeadlampBrightness] = useState(0.85);
  const [oxygen, setOxygen] = useState(100);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isElevatorMenuOpen, setIsElevatorMenuOpen] = useState(false);
  const [shake, setShake] = useState(0);
  const [pathNodes, setPathNodes] = useState<THREE.Vector3[]>([]);
  const [playerPosState, setPlayerPosState] = useState(new THREE.Vector3());
  const playerRef = useRef<THREE.Group | null>(null);

  // Drill & Mining Upgrades State
  const [upgrades, setUpgrades] = useState({
    power: 24.4,
    speed: 1.35,
    backpack: STARTING_BACKPACK_CAPACITY,
    elevatorSpeed: 150.0, // World-record ultra hyper speed!
    scanner: false,
    helmetLight: 1
  });

  const gameTimeRef = useRef(12.0); // 0-24 cycle
  const [gameTime, setGameTime] = useState(12.0); // For HUD rendering
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.HemisphereLight | null>(null);
  const helmetSpotLightRef = useRef<THREE.SpotLight | null>(null);
  const helmetWideSpotRef = useRef<THREE.SpotLight | null>(null);
  const helmetLensMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const helmetTargetRef = useRef<THREE.Object3D | null>(null);

  // Management, Workers, Encyclopedia & Achievements State
  const [isLoading, setIsLoading] = useState(true);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [isPublishingKitOpen, setIsPublishingKitOpen] = useState(false);
  const [isPremiumShopOpen, setIsPremiumShopOpen] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [batteries, setBatteries] = useState(0);
  const [diamonds, setDiamonds] = useState(5);
  const [totalMined, setTotalMined] = useState(0);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [achievements, setAchievements] = useState(achievementsSystem.getAchievements());

  const handleClaimAchievementReward = useCallback((id: string) => {
    const rewards = achievementsSystem.claimReward(id);
    if (rewards) {
      setDiamonds(prev => prev + rewards.rewardDiamonds);
      setCash(prev => prev + rewards.rewardCash);
      setAchievements(achievementsSystem.getAchievements());
      soundManager.playCashRegister();
      setFactoryNotification(`✨ Claimed advancement reward! +${rewards.rewardDiamonds} Diamonds & +$${rewards.rewardCash.toLocaleString()} Cash`);
      setTimeout(() => setFactoryNotification(null), 5000);
    }
  }, []);

  const handlePurchasePremiumItem = useCallback((item: any) => {
    let success = false;
    let nextCash = cash;
    let nextBatteries = batteries;
    let nextDiamonds = diamonds;

    if (item.currency === "CASH") {
      if (cash >= item.price) {
        nextCash = cash - item.price;
        setCash(nextCash);
        success = true;
      }
    } else if (item.currency === "BATTERIES") {
      if (batteries >= item.price) {
        nextBatteries = batteries - item.price;
        setBatteries(nextBatteries);
        success = true;
      }
    } else if (item.currency === "DIAMONDS") {
      if (diamonds >= item.price) {
        nextDiamonds = diamonds - item.price;
        setDiamonds(nextDiamonds);
        success = true;
      }
    }

    if (success) {
      const nextOwned = [...ownedItems, item.id];
      setOwnedItems(nextOwned);
      
      // Special effect for battery items
      if (item.category === "batteries") {
        nextBatteries += 1;
        setBatteries(nextBatteries);
      }

      // Special effect for cash bundle
      if (item.id === "cash_bundle_mega") {
        nextCash += 10000000;
        setCash(nextCash);
      }

      soundManager.playCashRegister();

      // Save immediately
      saveSystem.saveGame({
        cash: nextCash,
        inventory,
        jewelryInventory,
        backpackCapacity,
        depthFeet,
        remainingCaveGems,
        upgrades,
        managementData: {},
        achievementsData: {},
        encyclopediaData: {},
        settings,
        hasSeenTutorial: true,
        statistics: managementSystem.getStats(),
        batteries: nextBatteries,
        diamonds: nextDiamonds,
        ownedItems: nextOwned
      });
    }
  }, [cash, batteries, diamonds, ownedItems, inventory, jewelryInventory, backpackCapacity, depthFeet, remainingCaveGems, upgrades, settings]);

  const [isOfficeOpen, setIsOfficeOpen] = useState(false);
  const [isEncyclopediaOpen, setIsEncyclopediaOpen] = useState(false);
  const [featuredDiscoveredGem, setFeaturedDiscoveredGem] = useState<GemstoneEntry | null>(null);
  const [nearOffice, setNearOffice] = useState(false);
  const [achievementToast, setAchievementToast] = useState<{
    title: string;
    description: string;
    rewardCash: number;
    icon: string;
  } | null>(null);

  const handleCloseAll = useCallback(() => {
    setIsElevatorMenuOpen(false);
    setIsOfficeOpen(false);
    setIsEncyclopediaOpen(false);
    setFeaturedDiscoveredGem(null);
    setIsTutorialOpen(false);
    setIsSettingsOpen(false);
    setIsStatisticsOpen(false);
    setIsPublishingKitOpen(false);
    setIsPremiumShopOpen(false);
    setIsAchievementsOpen(false);
  }, []);

  const handleTeleportToElevator = useCallback(() => {
    window.dispatchEvent(new CustomEvent("teleport-to-elevator"));
    soundManager.playCashRegister();
    setFactoryNotification("⚡ Successfully teleported to elevator arrival point!");
    setTimeout(() => setFactoryNotification(null), 4000);
  }, []);

  // Auth listener
  useEffect(() => {
    testConnection();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Reload game data when user signs in to sync cloud save
        saveSystem.loadGame().then(saved => {
          if (saved) {
            if (typeof saved.cash === "number") setCash(saved.cash);
            if (saved.inventory) setInventory(saved.inventory);
            if (saved.jewelryInventory) setJewelryInventory(saved.jewelryInventory);
            if (saved.backpackCapacity) setBackpackCapacity(saved.backpackCapacity);
            if (saved.upgrades) setUpgrades({ ...upgrades, ...saved.upgrades });
            if (saved.settings) setSettings(saved.settings);
            if (saved.ownedItems) setOwnedItems(saved.ownedItems);
            if (typeof saved.batteries === "number") setBatteries(saved.batteries);
            if (typeof saved.diamonds === "number") setDiamonds(saved.diamonds);
          }
        });
      }
    });
    return () => unsub();
  }, []);

  // Load game on mount
  useEffect(() => {
    const init = async () => {
      const saved = await saveSystem.loadGame();
      if (saved) {
        if (typeof saved.cash === "number") setCash(saved.cash);
        if (saved.inventory) setInventory(saved.inventory);
        if (saved.jewelryInventory) setJewelryInventory(saved.jewelryInventory);
        if (saved.backpackCapacity) setBackpackCapacity(saved.backpackCapacity);
        if (saved.upgrades) {
          setUpgrades({
            ...upgrades, 
            ...saved.upgrades,
            helmetLight: saved.upgrades.helmetLight || 1
          });
        }
        if (saved.settings) setSettings(saved.settings);
        if (saved.ownedItems) setOwnedItems(saved.ownedItems);
        if (typeof saved.batteries === "number") setBatteries(saved.batteries);
        if (typeof saved.diamonds === "number") setDiamonds(saved.diamonds);
        setIsTutorialOpen(!saved.hasSeenTutorial);
      } else {
        setIsTutorialOpen(true);
      }
      setAchievements(achievementsSystem.getAchievements());
      setIsLoading(false);
    };
    init();
  }, []);


  // Periodic Auto-Save
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      await saveSystem.saveGame({
        cash,
        inventory,
        jewelryInventory,
        backpackCapacity,
        depthFeet,
        remainingCaveGems,
        upgrades,
        managementData: {},
        achievementsData: {},
        encyclopediaData: {},
        settings,
        hasSeenTutorial: true,
        statistics: managementSystem.getStats(),
        batteries,
        diamonds,
        ownedItems
      });
    }, 20000);


    return () => clearInterval(autoSaveInterval);
  }, [cash, inventory, jewelryInventory, backpackCapacity, depthFeet, remainingCaveGems, upgrades, settings, batteries, diamonds, ownedItems]);

  // Periodic Achievement Progress Checker
  useEffect(() => {
    const checkInterval = setInterval(() => {
      achievementsSystem.checkAll({
        totalMined,
        totalProcessed: managementSystem.getStats().totalGemsProcessed,
        totalJewelry: Object.values(jewelryInventory).reduce((a, b) => a + b, 0),
        workerCount: managementSystem.getWorkers().length,
        cash,
        depth: depthFeet,
        discoveredGemsCount: gemEncyclopediaSystem.getDiscoveredGems().length,
        drillPower: upgrades.power
      }, () => {
        setAchievements(achievementsSystem.getAchievements());
      });
    }, 2500);

    return () => clearInterval(checkInterval);
  }, [totalMined, jewelryInventory, cash, depthFeet, upgrades.power]);

  // Clear Screen Toggle
  const [clearScreenMode, setClearScreenMode] = useState(true);

  // Automatic Proximity State
  const [isAutoDrilling, setIsAutoDrilling] = useState(false);
  const [elevatorState, setElevatorState] = useState<ElevatorState>("mine");
  const [nearElevator, setNearElevator] = useState(false);
  const [nearTrader, setNearTrader] = useState(false);
  const [nearFactory, setNearFactory] = useState(false);

  // Mutable refs for state guarding in 60fps loop
  const drillControllerRef = useRef(new GemDrillController());
  const elevatorStateRef = useRef<ElevatorState>("mine");
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const worldRef = useRef<any>(null);
  const railwayRef = useRef<RailwaySystem | null>(null);
  const factoryEngineRef = useRef<ReturnType<typeof createSurfaceFactory> | null>(null);

  const jewelryFactoryRef = useRef<ReturnType<typeof createJewelryFactory> | null>(null);
  const managementOfficeRef = useRef<ManagementOfficeBuilding | null>(null);
  const workerRendererRef = useRef<WorkerRenderer | null>(null);

  // Tracking refs & state
  const backpackMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const backpackScreenTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const backpackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const lastLocationRef = useRef("Underground Cave Mine");
  const lastDepthRef = useRef(100);
  const lastNearElevatorRef = useRef(false);
  const lastNearTraderRef = useRef(false);
  const lastNearFactoryRef = useRef(false);
  const lastNearJewelryShopRef = useRef(false);
  const lastNearOfficeRef = useRef(false);
  const lastAutoDrillingRef = useRef(false);

  // Hook Achievement Unlock Listener
  useEffect(() => {
    achievementsSystem.onUnlocked = (ach) => {
      setAchievementToast({
        title: ach.title,
        description: ach.description,
        rewardCash: ach.rewardCash,
        icon: ach.icon
      });
      soundManager.playCashRegister();
      setTimeout(() => {
        setAchievementToast(null);
      }, 5000);
    };
  }, []);

  // Apply Premium Item Effects
  useEffect(() => {
    if (!drillControllerRef.current) return;
    
    // Reset to base upgrades first
    drillControllerRef.current.power = upgrades.power;
    drillControllerRef.current.speed = upgrades.speed;
    drillControllerRef.current.scanner = upgrades.scanner;

    // Apply bonuses
    if (ownedItems.includes("drill_premium_v1")) {
      drillControllerRef.current.speed *= 3.0;
    }
    if (ownedItems.includes("drill_premium_v2")) {
      drillControllerRef.current.power *= 10.0; // "Ignores hardness" approx
    }
    if (ownedItems.includes("drill_endgame_gold")) {
      // Logic for this would be inside the drill function, 
      // but let's give it a power boost for now
      drillControllerRef.current.power *= 2.0;
    }
  }, [ownedItems, upgrades]);

  // Upgrade Handler
  const handleUpgrade = useCallback((type: keyof typeof upgrades) => {
    setCash(prevCash => {
      let cost = 0;
      if (type === "power") cost = Math.floor(100 * Math.pow(1.5, Math.floor(upgrades.power - 20)));
      else if (type === "speed") cost = Math.floor(150 * Math.pow(1.6, Math.round((upgrades.speed - 1) * 10)));
      else if (type === "backpack") cost = Math.floor(120 * Math.pow(1.4, Math.floor(backpackCapacity / 10)));
      else if (type === "elevatorSpeed") cost = Math.floor(250 * Math.pow(1.5, Math.round((upgrades.elevatorSpeed - 35) / 5)));
      else if (type === "scanner") cost = 1000;
      else if (type === "helmetLight") cost = Math.floor(150 * Math.pow(2, upgrades.helmetLight - 1));

      if (prevCash < cost) return prevCash;

      setUpgrades(prev => {
        const next = { ...prev };
        if (type === "power") {
          next.power += 5;
          drillControllerRef.current.upgradePower(5);
        } else if (type === "speed") {
          next.speed += 0.2;
          drillControllerRef.current.upgradeSpeed(0.2);
        } else if (type === "backpack") {
          next.backpack += 10;
          setBackpackCapacity(next.backpack);
        } else if (type === "elevatorSpeed") {
          next.elevatorSpeed += 5.0;
        } else if (type === "scanner") {
          next.scanner = true;
          drillControllerRef.current.scanner = true;
        } else if (type === "helmetLight") {
          next.helmetLight += 1;
        }
        return next;
      });

      return prevCash - cost;
    });
  }, [upgrades, backpackCapacity]);

  // Sell All Gems
  const handleSellGems = useCallback(() => {
    setInventory(currentInventory => {
      let totalEarned = 0;
      const gemMult = managementSystem.getGemValueMultiplier();

      GAME_GEMS.forEach(gem => {
        const count = currentInventory[gem.id] ?? 0;
        if (count > 0) {
          totalEarned += count * Math.round(gem.value * gemMult);
        }
      });

      if (totalEarned > 0) {
        soundManager.playCashRegister();
        setCash(prev => prev + totalEarned);
        managementSystem.recordRevenue(totalEarned);

        if (worldRef.current) {
          worldRef.current.deposits.forEach((d: any) => d.clearInventory());
        }

      }

      return {};
    });
  }, []);

  // Deposit Gems from Backpack to Factory Conveyor
  const handleDepositBackpackToFactory = useCallback(() => {
    let depositedCount = 0;

    for (const [gemId, count] of Object.entries(inventory)) {
      const numCount = count as number;
      if (numCount > 0) {
        const gemConfig = GAME_GEMS.find(g => g.id === gemId) ?? GAME_GEMS[0];
        for (let i = 0; i < numCount; i++) {
          if (factoryEngineRef.current) {
            factoryEngineRef.current.addGem(gemConfig);
            depositedCount++;
          }
        }
      }
    }

    if (depositedCount > 0) {
      setInventory({});
      soundManager.playConveyorMotor(true);
      soundManager.playCashRegister();
      setFactoryNotification(`✨ Backpack emptied! Deposited ${depositedCount} gems onto factory conveyor (Backpack: 0 / ${backpackCapacity}). Processing through factory pipeline.`);
      setTimeout(() => setFactoryNotification(null), 5000);
    }
  }, [inventory, backpackCapacity]);

  // Primary Three.js Mounting & Physics Loop
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Detect software WebGL renderer string for safe frame pacing
    const isSoftwareGl = (() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      if (!gl) return true;
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1418);
    scene.fog = new THREE.Fog(0x0f1418, 20, 65);

    const camera = new THREE.PerspectiveCamera(
      65,
      mount.clientWidth / mount.clientHeight,
      0.1,
      500
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: "high-performance"
    });

    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    mount.appendChild(renderer.domElement);

    // Studio & Ambient Lighting
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e1b18, 1.2);
    scene.add(hemiLight);
    ambientLightRef.current = hemiLight;

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.5);
    sunLight.position.set(20, 50, 20);
    sunLight.castShadow = !isSoftwareGl;
    if (sunLight.shadow) {
      sunLight.shadow.mapSize.set(1024, 1024);
      sunLight.shadow.camera.left = -60;
      sunLight.shadow.camera.right = 60;
      sunLight.shadow.camera.top = 60;
      sunLight.shadow.camera.bottom = -60;
    }
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    const playerLight = new THREE.PointLight(0xffedd5, 10, 12);
    scene.add(playerLight);

    // Build Mine Cave, Ravines & Surface Outpost
    const world = buildMiningWorld(scene);
    worldRef.current = world;
    setPathNodes(world.pathNodes);

    // Initialize Railway System
    const railway = new RailwaySystem(scene, world.pathNodes);
    railwayRef.current = railway;

    // Build Player Character Rig (Human Miner)

    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, -6);
    scene.add(playerGroup);
    playerRef.current = playerGroup;

    // Human Miner Torso (Blue Work Shirt / Jumpsuit)
    const torsoMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.18, 0.5, 8, 12),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 })
    );
    torsoMesh.position.y = 0.95;
    torsoMesh.castShadow = true;
    playerGroup.add(torsoMesh);

    // Human Miner Legs (Dark Trousers)
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.15, 0.65, 0);
    playerGroup.add(leftLegGroup);

    const leftLeg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.1, 0.5, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
    );
    leftLeg.position.y = -0.25;
    leftLegGroup.add(leftLeg);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.15, 0.65, 0);
    playerGroup.add(rightLegGroup);

    const rightLeg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.1, 0.5, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
    );
    rightLeg.position.y = -0.25;
    rightLegGroup.add(rightLeg);

    // Human Miner Arms
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.25, 1.15, 0);
    playerGroup.add(leftArmGroup);

    // Subterranean Safety Lifejacket Vest (Fluorescent Orange & High-Vis Bands)
    const lifejacketMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.22, 0.42, 8, 12),
      new THREE.MeshStandardMaterial({
        color: 0xf97316,
        roughness: 0.35,
        metalness: 0.1
      })
    );
    lifejacketMesh.position.set(0, 0.95, 0);
    playerGroup.add(lifejacketMesh);

    const reflectiveBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.23, 0.08, 12),
      new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xfacc15,
        emissiveIntensity: 0.8
      })
    );
    reflectiveBand.position.set(0, 0.98, 0);
    playerGroup.add(reflectiveBand);

    const leftArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.08, 0.45, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 })
    );
    leftArm.position.y = -0.22;
    leftArmGroup.add(leftArm);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.25, 1.15, 0);
    playerGroup.add(rightArmGroup);

    const rightArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.08, 0.45, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 })
    );
    rightArm.position.y = -0.22;
    rightArmGroup.add(rightArm);

    // Human Miner Head
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.35;
    playerGroup.add(headGroup);

    const headMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.5 })
    );
    headMesh.position.y = 0.15;
    headGroup.add(headMesh);

    // Human Miner Details (Boots & Hands)
    const bootGeo = new THREE.BoxGeometry(0.18, 0.12, 0.3);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(0, -0.55, 0.08);
    leftLegGroup.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0, -0.55, 0.08);
    rightLegGroup.add(rightBoot);

    const handGeo = new THREE.SphereGeometry(0.07, 12, 12);
    const handMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.5 });
    const leftHand = new THREE.Mesh(handGeo, handMat);
    leftHand.position.set(0, -0.5, 0);
    leftArmGroup.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, handMat);
    rightHand.position.set(0, -0.5, 0);
    rightArmGroup.add(rightHand);

    // Miner Hard Hat
    const helmetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshPhysicalMaterial({
        color: 0xf59e0b,
        roughness: 0.15,
        metalness: 0.2,
        clearcoat: 1.0
      })
    );
    helmetMesh.position.y = 0.22;
    headGroup.add(helmetMesh);

    // Hard Hat Front LED Lamp Bezel & Housing
    const lampHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.07, 0.09, 12),
      new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.2 })
    );
    lampHousing.rotation.x = Math.PI / 2;
    lampHousing.position.set(0, 0.22, -0.21);
    headGroup.add(lampHousing);

    // Glowing LED Lens Glass
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfffbeb,
      emissiveIntensity: 1.6,
      roughness: 0.1
    });
    const lampLens = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      lensMat
    );
    lampLens.rotation.x = -Math.PI / 2;
    lampLens.position.set(0, 0.22, -0.25);
    headGroup.add(lampLens);
    helmetLensMatRef.current = lensMat;

    // MINECRAFT-STYLE CAVE VISIBILITY (Global low-level ambient)
    const caveAmbient = new THREE.AmbientLight(0xffffff, 0.06);
    scene.add(caveAmbient);

    // Nearby Headlamp LED Glow
    const headlightGlow = new THREE.PointLight(0xfffbeb, 4, 12);
    headlightGlow.position.set(0, 0.22, -0.28);
    headGroup.add(headlightGlow);

    // 1. Primary Focused LED Center Beam (400-Meter Range Target)
    const helmetSpot = new THREE.SpotLight(0xfffbeb, 220, 400, Math.PI / 5.5, 0.45, 1.1);
    helmetSpot.position.set(0, 0.22, -0.28);
    helmetSpot.castShadow = !isSoftwareGl;
    if (helmetSpot.shadow) {
      helmetSpot.shadow.mapSize.set(1024, 1024);
      helmetSpot.shadow.camera.near = 0.5;
      helmetSpot.shadow.camera.far = 400;
      helmetSpot.shadow.focus = 1.0;
    }
    headGroup.add(helmetSpot);
    helmetSpotLightRef.current = helmetSpot;

    // 2. Secondary Wide Peripheral Beam (Illuminates Cave Walls & Ceiling Width)
    const helmetWideSpot = new THREE.SpotLight(0xe0f2fe, 65, 250, Math.PI / 2.8, 0.85, 1.2);
    helmetWideSpot.position.set(0, 0.22, -0.28);
    headGroup.add(helmetWideSpot);
    helmetWideSpotRef.current = helmetWideSpot;

    const helmetTarget = new THREE.Object3D();
    helmetTarget.position.set(0, 0.22, -400); // Target at 400m distance ahead
    headGroup.add(helmetTarget);
    helmetSpot.target = helmetTarget;
    helmetWideSpot.target = helmetTarget;
    helmetTargetRef.current = helmetTarget;


    // Miner Backpack & Gem Storage Tower
    const backpackMat = new THREE.MeshStandardMaterial({ color: 0x3b2a1a, roughness: 0.8 });
    backpackMaterialRef.current = backpackMat;
    const backpackMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.65, 0.35),
      backpackMat
    );
    backpackMesh.position.set(0, 0.9, 0.35);
    playerGroup.add(backpackMesh);

    // Backpack Capacity Screen
    const bCanvas = document.createElement("canvas");
    bCanvas.width = 256;
    bCanvas.height = 128;
    backpackCanvasRef.current = bCanvas;
    const bTexture = new THREE.CanvasTexture(bCanvas);
    backpackScreenTextureRef.current = bTexture;

    const screenGeo = new THREE.PlaneGeometry(0.5, 0.25);
    const screenMat = new THREE.MeshStandardMaterial({ 
      map: bTexture, 
      transparent: true,
      emissive: 0xffffff,
      emissiveMap: bTexture,
      emissiveIntensity: 0.5
    });
    const bScreen = new THREE.Mesh(screenGeo, screenMat);
    bScreen.position.set(0, 0.9, 0.54);
    playerGroup.add(bScreen);

    // 3D Gem Tower Group stacked on player's backpack
    const backpackTowerGroup = new THREE.Group();
    backpackTowerGroup.position.set(0, 1.25, 0.35);
    playerGroup.add(backpackTowerGroup);

    // MAXPOWER Industrial Cordless Power Drill (Exact Match to Image Reference)
    const drillArm = new THREE.Group();
    drillArm.position.set(0, -0.15, -0.12);
    drillArm.rotation.set(-0.2, 0, 0); // Mounted in player's right hand pointing forward
    rightHand.add(drillArm);

    // 1. Dark Charcoal Battery Base Pack
    const batteryBaseMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.3, roughness: 0.7 });
    const batteryBase = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.22), batteryBaseMat);
    batteryBase.position.set(0, -0.22, 0);
    drillArm.add(batteryBase);

    // Crimson Red Release Latch Button (Front Top Battery)
    const redLatchMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    const redLatch = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.035, 0.05), redLatchMat);
    redLatch.position.set(0, -0.16, -0.07);
    drillArm.add(redLatch);

    // 3 Green LED Battery Charge Status Dots
    const greenLedMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 2.0,
      roughness: 0.1
    });
    for (let led = 0; led < 3; led++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), greenLedMat);
      dot.position.set(-0.035 + led * 0.035, -0.22, -0.112);
      drillArm.add(dot);
    }

    // Forward LED Work Light (Above Battery Mount)
    const worklightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfffbeb,
      emissiveIntensity: 2.2,
      roughness: 0.1
    });
    const worklightMesh = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.03), worklightMat);
    worklightMesh.position.set(0, -0.13, -0.09);
    drillArm.add(worklightMesh);

    // 2. Slate Grey Handle Stem & Ergonomic Textured Rubber Grip
    const handleStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.055, 0.22, 12),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 })
    );
    handleStem.position.set(0, -0.08, 0.01);
    handleStem.rotation.x = 0.15;
    drillArm.add(handleStem);

    // Ergonomic Rubber Grip Padding
    const gripPad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.058, 0.14, 12, 1, false, Math.PI * 0.2, Math.PI * 1.6),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 })
    );
    gripPad.position.set(0, -0.09, 0.01);
    gripPad.rotation.x = 0.15;
    drillArm.add(gripPad);

    // Dark Charcoal Trigger Switch
    const trigger = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.05, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
    );
    trigger.position.set(0, -0.03, -0.04);
    drillArm.add(trigger);

    // 3. Signature MAXPOWER High-Vis Yellow Motor Housing
    const yellowHousingMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.15, roughness: 0.3 });
    const motorBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.08, 0.28, 16),
      yellowHousingMat
    );
    motorBody.rotation.x = Math.PI / 2;
    motorBody.position.set(0, 0.05, -0.06);
    drillArm.add(motorBody);

    // Black End Cap & Air Vents
    const blackCapMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
    const endCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.076, 0.076, 0.04, 16),
      blackCapMat
    );
    endCap.rotation.x = Math.PI / 2;
    endCap.position.set(0, 0.05, 0.08);
    drillArm.add(endCap);

    // MAXPOWER Brand Badge Plate on both sides of motor housing
    const badgeCanvas = document.createElement("canvas");
    badgeCanvas.width = 256;
    badgeCanvas.height = 64;
    const bCtx = badgeCanvas.getContext("2d");
    if (bCtx) {
      bCtx.fillStyle = "#18181b";
      bCtx.fillRect(0, 0, 256, 64);
      bCtx.strokeStyle = "#eab308";
      bCtx.lineWidth = 6;
      bCtx.strokeRect(4, 4, 248, 56);
      bCtx.fillStyle = "#ffffff";
      bCtx.font = "900 36px sans-serif";
      bCtx.textAlign = "center";
      bCtx.textBaseline = "middle";
      bCtx.fillText("MAXPOWER", 128, 32);
    }
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    const badgeMat = new THREE.MeshStandardMaterial({ map: badgeTex, roughness: 0.2 });
    
    const badgeLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.045), badgeMat);
    badgeLeft.position.set(-0.08, 0.05, -0.04);
    badgeLeft.rotation.y = -Math.PI / 2;
    drillArm.add(badgeLeft);

    const badgeRight = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.045), badgeMat);
    badgeRight.position.set(0.08, 0.05, -0.04);
    badgeRight.rotation.y = Math.PI / 2;
    drillArm.add(badgeRight);

    // 4. Black Ribbed Torque Selector Collar
    const torqueRingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6, metalness: 0.4 });
    const torqueRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.072, 0.072, 0.06, 16),
      torqueRingMat
    );
    torqueRing.rotation.x = Math.PI / 2;
    torqueRing.position.set(0, 0.05, -0.22);
    drillArm.add(torqueRing);

    // 5. Keyless Metallic Chuck Barrel
    const chuckMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
    const chuck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.065, 0.1, 16),
      chuckMat
    );
    chuck.rotation.x = Math.PI / 2;
    chuck.position.set(0, 0.05, -0.3);
    drillArm.add(chuck);

    // 6. Metallic Chrome Spinning Drill Bit
    const drillBit = new THREE.Mesh(
      new THREE.ConeGeometry(0.045, 0.35, 16),
      new THREE.MeshPhysicalMaterial({
        color: 0xf1f5f9,
        metalness: 0.98,
        roughness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02
      })
    );
    drillBit.rotation.x = -Math.PI / 2;
    drillBit.position.set(0, 0.05, -0.5);
    drillArm.add(drillBit);

    // Sparks Particle System
    const sparksGeometry = new THREE.BufferGeometry();
    const sparkCount = 30;
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount * 3; i++) sparkPositions[i] = 0;
    sparksGeometry.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));

    const sparksMaterial = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.15,
      transparent: true,
      opacity: 0
    });

    const sparksPoints = new THREE.Points(sparksGeometry, sparksMaterial);
    drillArm.add(sparksPoints);

    // Separate Jewelry Production Factory Engine at Z: 180 (Connected via outdoor road)
    const jewelryFactory = createJewelryFactory(scene, {
      position: new THREE.Vector3(0, 0, 180),
      onJewelryManufactured: (item) => {
        managementSystem.recordJewelryManufactured();
        setJewelryInventory(jewelryFactory.getJewelryInventory());
        setFactoryNotification(`✨ Finished ${item.name} manufactured & stored in Factory Output Storage! ($${item.price})`);
        setTimeout(() => setFactoryNotification(null), 4500);
      }
    });
    jewelryFactoryRef.current = jewelryFactory;

    // Surface Factory Engine at Z: 105 (Surface Base) -> Automatically sends finished gems to Jewelry Factory pipeline!
    const factoryEngine = createSurfaceFactory(scene, {
      position: new THREE.Vector3(0, 0, 105),
      onFinished: (value: number, gemType: GemType) => {
        managementSystem.recordGemProcessed();
        if (jewelryFactoryRef.current) {
          jewelryFactoryRef.current.addProcessedGem(gemType);
        }
      }
    });
    factoryEngineRef.current = factoryEngine;

    // 3D Physical Management Headquarters Building at Z: 135
    const managementOffice = createManagementOfficeBuilding(scene, new THREE.Vector3(0, 0, 135));
    managementOfficeRef.current = managementOffice;

    // 3D Physical Animated Worker Renderer
    const workerRenderer = createWorkerRenderer(scene);
    workerRenderer.updateWorkers(managementSystem.getWorkers());
    workerRendererRef.current = workerRenderer;

    // Wire Gem Collection Discovery hook to all ore deposits for Gem Encyclopedia & Achievements
    world.deposits.forEach((deposit: any) => {
      deposit.options.onGemCollected = (collectedGem: any) => {

        setTotalMined(prev => prev + 1);
        const discovery = gemEncyclopediaSystem.recordDiscovery(collectedGem.id);
        if (discovery.isFirstDiscovery && discovery.gem) {
          setFeaturedDiscoveredGem(discovery.gem);
          setIsEncyclopediaOpen(true);
          soundManager.playCashRegister();
        }
      };
      deposit.options.onCaveIn = () => {
        setShake(1.5);
        setFactoryNotification("⚠️ CAVE-IN DETECTED! Mining rare veins has destabilized the sector.");
        setTimeout(() => setFactoryNotification(null), 5000);
      };
    });

    // Joystick Touch Control Setup
    let joyX = 0;
    let joyY = 0;
    let joyActive = false;

    const joystickContainer = document.createElement("div");
    joystickContainer.style.cssText =
      "position:absolute;bottom:28px;left:28px;width:120px;height:120px;border-radius:50%;background:rgba(15,23,42,0.7);border:2px solid rgba(56,189,248,0.5);touch-action:none;z-index:50;backdrop-filter:blur(6px);box-shadow:0 10px 25px rgba(0,0,0,0.5);";
    const joystickKnob = document.createElement("div");
    joystickKnob.style.cssText =
      "position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#38bdf8,#0284c7);box-shadow:0 4px 12px rgba(0,0,0,0.4);border:2px solid #ffffff;";
    joystickContainer.appendChild(joystickKnob);
    mount.appendChild(joystickContainer);

    const handlePointerMove = (e: PointerEvent) => {
      if (!joyActive) return;
      const rect = joystickContainer.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.min(42, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      joyX = (Math.cos(angle) * dist) / 42;
      joyY = (Math.sin(angle) * dist) / 42;
      joystickKnob.style.transform = `translate(${joyX * 42}px, ${joyY * 42}px)`;
    };

    const handlePointerDown = (e: PointerEvent) => {
      joyActive = true;
      joystickContainer.setPointerCapture(e.pointerId);
      handlePointerMove(e);
    };

    const handlePointerUp = () => {
      joyActive = false;
      joyX = 0;
      joyY = 0;
      joystickKnob.style.transform = "translate(0px, 0px)";
    };

    joystickContainer.addEventListener("pointerdown", handlePointerDown);
    joystickContainer.addEventListener("pointermove", handlePointerMove);
    joystickContainer.addEventListener("pointerup", handlePointerUp);
    joystickContainer.addEventListener("pointercancel", handlePointerUp);

    // Keyboard Listeners (WASD / Arrows)
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === "l") {
        setHeadlampOn(prev => !prev);
      }
      if (e.key.toLowerCase() === "e") {
        const distToElevator = Math.hypot(playerGroup.position.x - world.elevatorGroup.position.x, playerGroup.position.z - world.elevatorGroup.position.z);
        const distToOffice = Math.hypot(playerGroup.position.x - 0, playerGroup.position.z - 129);
        if (distToOffice < 4.8 && elevatorStateRef.current === "surface") {
          setIsOfficeOpen(prev => !prev);
        } else if (distToElevator < 4.5 && (elevatorStateRef.current === "mine" || elevatorStateRef.current === "surface")) {
          setIsElevatorMenuOpen(prev => !prev);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Teleport & Trigger Elevator Event Listeners
    let lastTeleportEventTime = 0;
    const handleTeleportEvent = () => {
      const now = Date.now();
      if (now - lastTeleportEventTime < 2000) return;
      lastTeleportEventTime = now;

      if (elevatorStateRef.current === "mine") {
        playerGroup.position.set(0, 0, 2);
      } else {
        playerGroup.position.set(0, 0, 102);
      }
    };
    window.addEventListener("teleport-to-elevator", handleTeleportEvent);

    const handleTriggerElevatorEvent = () => {
      if (elevatorStateRef.current === "mine") {
        triggerElevator("traveling-up");
      } else if (elevatorStateRef.current === "surface") {
        triggerElevator("traveling-down");
      }
    };
    window.addEventListener("trigger-elevator", handleTriggerElevatorEvent);

    // Elevator Travel Function (150.0 m/s Ultra Hyper-Speed)
    let elevatorProgress = 0;
    const ELEVATOR_TRAVEL_DISTANCE = 98;

    function triggerElevator(targetState: "traveling-up" | "traveling-down") {
      if (elevatorStateRef.current === "traveling-up" || elevatorStateRef.current === "traveling-down") return;

      elevatorStateRef.current = targetState;
      setElevatorState(targetState);
      elevatorProgress = 0;

      // Seal Doors
      world.elevatorDoors[0].position.x = -0.55;
      world.elevatorDoors[1].position.x = 0.55;

      // Lock player inside cabin platform safely
      playerGroup.position.set(world.elevatorGroup.position.x, 0.15, world.elevatorGroup.position.z);
      playerGroup.rotation.y = 0;
    }

    // Function to render 3D Backpack Gem Tower
    let currentRenderedGemCount = -1;
    function updateBackpackGemTower(totalGems: number) {
      if (totalGems === currentRenderedGemCount) return;
      currentRenderedGemCount = totalGems;

      // Update Backpack Visuals (Color & Screen)
      const isFull = totalGems >= backpackCapacity;
      if (backpackMaterialRef.current) {
        backpackMaterialRef.current.color.set(isFull ? 0xff0000 : 0x3b2a1a);
        backpackMaterialRef.current.emissive.set(isFull ? 0x440000 : 0x000000);
      }

      const ctx = backpackCanvasRef.current?.getContext("2d");
      const tex = backpackScreenTextureRef.current;
      if (ctx && tex) {
        ctx.clearRect(0, 0, 256, 128);
        
        // Dynamic styling based on full state
        const color = isFull ? "#ff0000" : "#ffffff";
        
        // Background Pill Shape
        ctx.fillStyle = isFull ? "rgba(255, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.roundRect(10, 10, 236, 108, 64);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (isFull) {
          ctx.fillStyle = "#ff0000";
          ctx.font = "bold 64px sans-serif";
          ctx.fillText("MAX", 128, 64);
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 52px monospace";
          ctx.fillText(`${totalGems} / ${backpackCapacity}`, 128, 64);
        }
        tex.needsUpdate = true;
      }

      while (backpackTowerGroup.children.length > 0) {
        const child = backpackTowerGroup.children[0];
        backpackTowerGroup.remove(child);
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      }

      for (let i = 0; i < totalGems; i++) {
        const gemConfig = GAME_GEMS[i % GAME_GEMS.length];
        const gemMesh = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.14, 1),
          new THREE.MeshPhysicalMaterial({
            color: gemConfig.color,
            emissive: gemConfig.color,
            emissiveIntensity: 0.8,
            roughness: 0.05,
            metalness: 0.15,
            transmission: 0.82,
            ior: 1.58,
            thickness: 0.6,
            clearcoat: 1.0,
            clearcoatRoughness: 0.08
          })
        );
        gemMesh.position.set(
          ((i % 2) - 0.5) * 0.08,
          i * 0.14,
          ((Math.floor(i / 2) % 2) - 0.5) * 0.08
        );
        gemMesh.rotation.set(0.2, i * 0.5, 0.2);
        backpackTowerGroup.add(gemMesh);
      }
    }

    // Helper functions for guarded state updates
    function setLocationGuarded(newLoc: string) {
      if (lastLocationRef.current !== newLoc) {
        lastLocationRef.current = newLoc;
        setLocation(newLoc);
      }
    }

    function setDepthGuarded(newDepth: number) {
      if (lastDepthRef.current !== newDepth) {
        lastDepthRef.current = newDepth;
        setDepthFeet(newDepth);
      }
    }

    function setNearElevatorGuarded(val: boolean) {
      if (lastNearElevatorRef.current !== val) {
        lastNearElevatorRef.current = val;
        setNearElevator(val);
      }
    }

    function setNearTraderGuarded(val: boolean) {
      if (lastNearTraderRef.current !== val) {
        lastNearTraderRef.current = val;
        setNearTrader(val);
      }
    }

    function setNearFactoryGuarded(val: boolean) {
      if (lastNearFactoryRef.current !== val) {
        lastNearFactoryRef.current = val;
        setNearFactory(val);
      }
    }

    function setIsAutoDrillingGuarded(val: boolean) {
      if (lastAutoDrillingRef.current !== val) {
        lastAutoDrillingRef.current = val;
        setIsAutoDrilling(val);
      }
    }

    // Main Game Loop
    let previousTime = performance.now();
    let animationFrameId = 0;
    let lastFactoryUnloadTime = 0;
    let lastAchievementCheckTime = 0;

    const animate = (now: number) => {
      const dt = Math.min((now - previousTime) / 1000, 0.05);
      previousTime = now;

      const keys = keysRef.current;
      const state = elevatorStateRef.current;

      // --------------------------------------------------
      // 1. HYPER-SPEED ELEVATOR LOCOMOTION
      // --------------------------------------------------
      if (state === "traveling-up" || state === "traveling-down") {
        const currentSpeed = upgrades.elevatorSpeed;
        elevatorProgress += (currentSpeed * dt) / ELEVATOR_TRAVEL_DISTANCE;

        soundManager.playHyperElevatorSound(true, elevatorProgress);

        if (state === "traveling-up") {
          const currentZ = THREE.MathUtils.lerp(2, 100, Math.min(1, elevatorProgress));
          world.elevatorGroup.position.z = currentZ;
          playerGroup.position.copy(world.elevatorGroup.position);

          const currentDepth = Math.round(99000 * (1 - elevatorProgress));
          setDepthGuarded(currentDepth);

          if (elevatorProgress >= 1) {
            elevatorStateRef.current = "surface";
            setElevatorState("surface");
            setLocationGuarded("Surface Mining Outpost");
            setShowFactory(true);
            soundManager.playHyperElevatorSound(false);
            soundManager.setMusicZone("surface");

            world.elevatorDoors[0].position.x = -2.1;
            world.elevatorDoors[1].position.x = 2.1;
          }
        } else {
          const currentZ = THREE.MathUtils.lerp(100, 2, Math.min(1, elevatorProgress));
          world.elevatorGroup.position.z = currentZ;
          playerGroup.position.copy(world.elevatorGroup.position);

          const currentDepth = Math.round(99000 * elevatorProgress);
          setDepthGuarded(currentDepth);

          if (elevatorProgress >= 1) {
            elevatorStateRef.current = "mine";
            setElevatorState("mine");
            setLocationGuarded("99,000 FT Deep Mega-Cave (18.7 Miles / 17.8 KM Subterranean Abyss)");
            setShowFactory(false);
            soundManager.playHyperElevatorSound(false);
            soundManager.setMusicZone("cave");

            world.elevatorDoors[0].position.x = -2.1;
            world.elevatorDoors[1].position.x = 2.1;
          }
        }
      }

      // --------------------------------------------------
      // 2. PHYSICS & LOCOMOTION STATE MACHINE
      // --------------------------------------------------
      let moveX = joyX;
      let moveZ = joyY;
      if (keys["w"] || keys["arrowup"]) moveZ -= 1;
      if (keys["s"] || keys["arrowdown"]) moveZ += 1;
      if (keys["a"] || keys["arrowleft"]) moveX -= 1;
      if (keys["d"] || keys["arrowright"]) moveX += 1;
      
      const inputLen = Math.hypot(moveX, moveZ);
      const moveVec = new THREE.Vector2(moveX, moveZ).normalize().multiplyScalar(dt * 5.8);

      // A. GROUND & ENVIRONMENT DETECTION
      const groundRaycaster = new THREE.Raycaster();
      groundRaycaster.set(new THREE.Vector3(playerGroup.position.x, playerGroup.position.y + 2, playerGroup.position.z), new THREE.Vector3(0, -1, 0));
      const floorIntersects = groundRaycaster.intersectObjects(world.groundMeshes, false);
      const floorY = floorIntersects.length > 0 ? floorIntersects[0].point.y : -200;

      // B. STATE TRANSITIONS
      let isSurface = state === "surface";

      const isMine = state === "mine";

      // 1. Automatic Ladder Detection (Direct World Ladder Array Lookup)
      let activeLadder: THREE.Group | null = null;
      if (world.ladders) {
        for (const ladder of world.ladders) {
          const lx = ladder.position.x;
          const lz = ladder.position.z;
          const dist2D = Math.hypot(playerGroup.position.x - lx, playerGroup.position.z - lz);
          const topDist2D = Math.hypot(playerGroup.position.x - lx, playerGroup.position.z - (lz + 0.8));

          const py = playerGroup.position.y;
          const bottomY = ladder.userData.bottomY ?? ladder.position.y;
          const topY = ladder.userData.topY ?? (bottomY + 35);

          if ((dist2D < 3.2 || topDist2D < 2.8) && py >= bottomY - 2.5 && py <= topY + 3.8) {
            activeLadder = ladder;
            break;
          }
        }
      }

      // Automatically engage climbing when approaching ladder
      if (activeLadder && playerState === "walking") {
        setPlayerState("climbing");
      }

      // 2. Water Detection (Swimming)
      const isSubmerged = floorY < -20 && playerGroup.position.y < (floorY + 8); 

      // C. EXECUTE MOVEMENT BASED ON STATE
      if (playerState === "driving" && railwayRef.current) {
        railwayRef.current.update(dt, -moveZ); // W/S controls speed
        playerGroup.position.copy(railwayRef.current.getLocomotivePosition());
        playerGroup.rotation.copy(railwayRef.current.locomotive.rotation);
        
        if (keys["f"]) setPlayerState("walking");
      } else if (playerState === "climbing" && activeLadder) {
        const ladder = activeLadder as THREE.Group;
        const topY = ladder.userData.topY ?? (ladder.position.y + 35);
        const bottomY = ladder.userData.bottomY ?? ladder.position.y;

        // Snap X and Z to ladder center
        playerGroup.position.x = THREE.MathUtils.damp(playerGroup.position.x, ladder.position.x, 14, dt);
        playerGroup.position.z = THREE.MathUtils.damp(playerGroup.position.z, ladder.position.z, 14, dt);

        // Automated Hands-Free Climbing:
        // Automatically ascend UP (climbVel = 7.5 m/s) without requiring game controls!
        // Pressing S / Joystick Down (moveZ > 0.05) reverses to climb DOWN.
        let climbVel = 7.5;
        if (moveZ > 0.05) {
          climbVel = -7.5; // Climb down if S or joystick down pressed
        } else if (moveZ < -0.05) {
          climbVel = 8.8;  // Fast climb up if W or joystick up pressed
        }

        playerGroup.position.y += climbVel * dt;

        // Right & Left hand and leg climbing animation
        const climbCycle = Math.sin(now * 0.018);
        leftArmGroup.rotation.x = climbCycle * 0.95;
        rightArmGroup.rotation.x = -climbCycle * 0.95;
        leftLegGroup.rotation.x = -climbCycle * 0.75;
        rightLegGroup.rotation.x = climbCycle * 0.75;

        // Top Platform & Bottom Dismount
        if (playerGroup.position.y >= topY) {
          playerGroup.position.y = topY + 0.25;
          playerGroup.position.z += 0.9; // Step forward onto top platform
          setPlayerState("walking");
        } else if (playerGroup.position.y <= Math.max(floorY, bottomY) && climbVel < 0) {
          playerGroup.position.y = Math.max(floorY, bottomY);
          setPlayerState("walking");
        } else if (!activeLadder) {
          setPlayerState("walking");
        }
      } else if (playerState === "swimming") {
        playerGroup.position.x += moveVec.x;
        playerGroup.position.z += moveVec.y;

        // Subterranean Lifejacket Buoyancy Physics: Float on top of water surface!
        const targetWaterSurfaceY = Math.max(floorY + 7.2, -18);
        playerGroup.position.y = THREE.MathUtils.damp(
          playerGroup.position.y,
          targetWaterSurfaceY + 0.35,
          10,
          dt
        );

        // Keep oxygen full at 100% since lifejacket keeps head above water
        setOxygen(100);

        if (playerGroup.position.y > floorY + 8.5) setPlayerState("walking");
      } else if (playerState === "walking") {
        playerGroup.position.x += moveVec.x;
        playerGroup.position.z += moveVec.y;
        
        // Gravity & Slopes
        if (playerGroup.position.y > floorY + 0.2) {
          playerGroup.position.y -= 15.0 * dt; // Gravity
        } else {
          playerGroup.position.y = THREE.MathUtils.damp(playerGroup.position.y, floorY, 15, dt);
        }

        if (isSubmerged && playerGroup.position.y < floorY + 2) setPlayerState("swimming");

        // Interaction (Boarding train)
        const distToTrain = playerGroup.position.distanceTo(railway.locomotive.position);
        if (distToTrain < 3 && keys["f"]) setPlayerState("driving");
      }


      // Animation sync
      const isMoving = inputLen > 0.1;
      if (isMoving && playerState === "walking") {
        const walkCycle = Math.sin(now * 0.012);
        leftLegGroup.rotation.x = walkCycle * 0.65;
        rightLegGroup.rotation.x = -walkCycle * 0.65;
        leftArmGroup.rotation.x = -walkCycle * 0.55;
        rightArmGroup.rotation.x = walkCycle * 0.55;
        const bob = Math.abs(Math.sin(now * 0.012)) * 0.08;
        torsoMesh.position.y = 0.95 + bob;
        headGroup.position.y = 1.35 + bob * 1.1;
      } else {
        leftLegGroup.rotation.x = THREE.MathUtils.damp(leftLegGroup.rotation.x, 0, 10, dt);
        rightLegGroup.rotation.x = THREE.MathUtils.damp(rightLegGroup.rotation.x, 0, 10, dt);
        // ...
      }


      // --------------------------------------------------
      // 3. AMBIENT CAVE SFX & CONSTRAINTS
      // --------------------------------------------------
      if (state === "mine" && Math.random() < 0.003) {
        soundManager.triggerRandomCaveSFX(depthFeet);
      }


      // Update Clamping based on State
      if (state === "mine") {
        // Removed hardcoded constraints for Mega Cave exploration
      } else if (state === "surface") {
        playerGroup.position.x = THREE.MathUtils.clamp(playerGroup.position.x, -55, 55);
        playerGroup.position.z = THREE.MathUtils.clamp(playerGroup.position.z, 85, 360);
      }

      // Update Helmet Light Intensity (Upgradable 400m Target & Wide Peripheral Cone)
      if (helmetSpotLightRef.current) {
        const targetIntensity = headlampOn ? (220 + upgrades.helmetLight * 120) * headlampBrightness : 0;
        const targetDistance = headlampOn ? (400 + upgrades.helmetLight * 50) : 0;
        helmetSpotLightRef.current.intensity = THREE.MathUtils.damp(helmetSpotLightRef.current.intensity, targetIntensity, 8, dt);
        helmetSpotLightRef.current.distance = THREE.MathUtils.damp(helmetSpotLightRef.current.distance, targetDistance, 8, dt);

        if (helmetWideSpotRef.current) {
          const wideTargetInt = headlampOn ? (65 + upgrades.helmetLight * 30) * headlampBrightness : 0;
          const wideTargetDist = headlampOn ? (250 + upgrades.helmetLight * 30) : 0;
          helmetWideSpotRef.current.intensity = THREE.MathUtils.damp(helmetWideSpotRef.current.intensity, wideTargetInt, 8, dt);
          helmetWideSpotRef.current.distance = THREE.MathUtils.damp(helmetWideSpotRef.current.distance, wideTargetDist, 8, dt);
        }

        if (helmetLensMatRef.current) {
          helmetLensMatRef.current.emissiveIntensity = headlampOn ? 1.6 * headlampBrightness : 0.05;
        }
      }

      // Day/Night Cycle Logic
      gameTimeRef.current = (gameTimeRef.current + dt * 0.1) % 24; 
      const time = gameTimeRef.current;
      setGameTime(time);
      const isNight = time < 6 || time > 18;
      isSurface = state === "surface" || state === "traveling-up" || state === "traveling-down";

      if (isSurface) {
        // Realistic Surface Sky & Sunlight
        const sunAngle = ((time - 6) / 12) * Math.PI; 
        const sunAlt = Math.sin(sunAngle);
        const sunInt = Math.max(0, sunAlt);
        
        if (sunLightRef.current) {
          sunLightRef.current.intensity = sunInt * 3.0 + 0.1;
          // Position relative to surface group at Z: 100
          sunLightRef.current.position.set(Math.cos(sunAngle) * 60, sunAlt * 60, 100 + Math.sin(sunAngle) * 20);
          sunLightRef.current.target.position.set(0, 0, 100);
          sunLightRef.current.target.updateMatrixWorld();
          
          if (time > 17 || time < 7) sunLightRef.current.color.set(0xffa500); 
          else sunLightRef.current.color.set(0xfffbeb);
        }

        if (ambientLightRef.current) {
          ambientLightRef.current.color.set(0x38bdf8);
          ambientLightRef.current.groundColor.set(0x1e1b18);
          ambientLightRef.current.intensity = sunInt * 0.8 + 0.2;
        }

        scene.background = new THREE.Color().lerpColors(new THREE.Color(0x050810), new THREE.Color(0x38bdf8), sunInt);
        if (scene.fog instanceof THREE.Fog) {
          scene.fog.color.copy(scene.background as THREE.Color);
          scene.fog.near = 20;
          scene.fog.far = 180;
        }
      } else {
        // Deep Mega-Cave Atmosphere (Minecraft-style ambient depth + 400m visibility range)
        if (sunLightRef.current) sunLightRef.current.intensity = 0;
        if (ambientLightRef.current) {
          ambientLightRef.current.intensity = 0.38;
          ambientLightRef.current.color.set(0x1e293b); // Slate 800 ambient sky
          ambientLightRef.current.groundColor.set(0x0f172a); // Slate 900 ambient ground
        }
        
        scene.background = new THREE.Color(0x070b12);
        if (scene.fog instanceof THREE.Fog) {
          scene.fog.color.set(0x070b12);
          scene.fog.near = 15;
          scene.fog.far = 450;
        }
      }

      // Proximity Triggers & Factory Logic
      const distToElevator = Math.hypot(
        playerGroup.position.x - world.elevatorGroup.position.x,
        playerGroup.position.z - world.elevatorGroup.position.z
      );
      setNearElevatorGuarded(distToElevator < 3.2 && (state === "mine" || state === "surface"));

      const distToTrader = Math.hypot(
        playerGroup.position.x - (-12),
        playerGroup.position.z - 95
      );
      setNearTraderGuarded(distToTrader < 4.5 && state === "surface");

      const distToOffice = Math.hypot(
        playerGroup.position.x - 0,
        playerGroup.position.z - 129
      );
      const isNearOffice = distToOffice < 4.8 && state === "surface";
      if (lastNearOfficeRef.current !== isNearOffice) {
        lastNearOfficeRef.current = isNearOffice;
        setNearOffice(isNearOffice);
      }

      const distToFactoryBelt = Math.hypot(
        playerGroup.position.x - 0,
        playerGroup.position.z - 105
      );
      const isNearBelt = distToFactoryBelt < 5.0 && state === "surface";
      setNearFactoryGuarded(isNearBelt);

      if (isNearBelt && now - lastFactoryUnloadTime > 350) {
        lastFactoryUnloadTime = now;
        let firstGemId: string | null = null;
        for (const [gemId, count] of Object.entries(inventory)) {
          if ((count as number) > 0) {
            firstGemId = gemId;
            break;
          }
        }

        if (firstGemId && factoryEngineRef.current) {
          const gemConfig = GAME_GEMS.find(g => g.id === firstGemId) ?? GAME_GEMS[0];
          factoryEngineRef.current.addGem(gemConfig);
          soundManager.playConveyorMotor(true);
          setInventory(prev => {
            const currentCount = prev[firstGemId!] || 0;
            if (currentCount <= 1) {
              const next = { ...prev };
              delete next[firstGemId!];
              return next;
            }
            return { ...prev, [firstGemId!]: currentCount - 1 };
          });
        }
      }

      // --------------------------------------------------
      // 4. AUTOMATIC DRILLING MECHANICS (+22% BOOSTED POWER)
      // --------------------------------------------------
      let nearbyTargetDeposit: GemOreDeposit | null = null;
      let minDistance = Infinity;

      if (state === "mine") {
        for (const deposit of world.deposits) {
          if (deposit.broken) continue;
          const dist = playerGroup.position.distanceTo(deposit.group.position);
          if (dist < minDistance) {
            minDistance = dist;
            nearbyTargetDeposit = deposit;
          }
        }
      }

      const autoDrilling = state === "mine" && nearbyTargetDeposit !== null && minDistance < 4.5;
      setIsAutoDrillingGuarded(autoDrilling);
      soundManager.playDrillSound(autoDrilling, drillControllerRef.current.speed);

      if (autoDrilling && nearbyTargetDeposit) {
        drillBit.rotation.z += dt * 35 * drillControllerRef.current.speed;

        // Spark Particle Effect
        const posAttr = sparksGeometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < sparkCount; i++) {
          posAttr.setXYZ(
            i,
            (Math.random() - 0.5) * 0.55,
            (Math.random() - 0.5) * 0.55,
            -0.6 - Math.random() * 0.6
          );
        }
        posAttr.needsUpdate = true;
        sparksMaterial.opacity = 0.95;

        const rockBroke = drillControllerRef.current.drill(nearbyTargetDeposit, dt);
        soundManager.playRockCrunch();

        if (rockBroke) {
          soundManager.playGemChime(0.5);
          setRemainingCaveGems(prev => Math.max(0, prev - 250));
        }
      } else {
        sparksMaterial.opacity = 0;
      }

      // --------------------------------------------------
      // 4. LOOSE GEM DROPS, REGENERATION & AUTOMATIC PICKUP
      // --------------------------------------------------
      const currentTotalInBackpack = Object.values(inventory).reduce((a, b) => a + (b as number), 0);
      const newlyCollectedGems: GemType[] = [];

      for (const deposit of world.deposits) {
        deposit.updateDrops(dt, playerGroup.position.y + 0.15);

        if (state === "mine") {
          const pickedUp = deposit.collectNear(
            playerGroup.position,
            3.2,
            backpackCapacity,
            currentTotalInBackpack + newlyCollectedGems.length
          );

          if (pickedUp.length > 0) {
            newlyCollectedGems.push(...pickedUp);
          }
        }
      }

      if (newlyCollectedGems.length > 0) {
        soundManager.playGemChime(0.85);
        setInventory(prev => {
          const next = { ...prev };
          for (const gem of newlyCollectedGems) {
            next[gem.id] = (next[gem.id] || 0) + 1;
          }
          return next;
        });
      }

      // Update 3D Backpack Gem Tower
      updateBackpackGemTower(currentTotalInBackpack + newlyCollectedGems.length);

      // --------------------------------------------------
      // 5. OXYGEN & ENVIRONMENT PHYSICS
      // --------------------------------------------------
      if (playerState === "swimming") {
        setOxygen(prev => {
          const next = Math.max(0, prev - dt * 6.5); // 15 seconds of air
          if (next <= 0) {
            // DROWNING: Respawn at Surface or Elevator
            playerGroup.position.set(0, 0, 102); 
            setCash(c => Math.max(0, c - 500)); // Penalty
            setFactoryNotification("💀 YOU DROWNED! Emergency rescue performed. ($500 fine)");
            setTimeout(() => setFactoryNotification(null), 5000);
            return 100;
          }
          return next;
        });
      } else {
        setOxygen(prev => Math.min(100, prev + dt * 15.0)); // Rapid recovery
      }

      if (isMapOpen) {
        setPlayerPosState(playerGroup.position.clone());
      }

      // Camera Shake Processing
      if (shake > 0.01) {
        setShake(s => s * 0.94); // Decay
      } else {
        setShake(0);
      }

      // --------------------------------------------------
      // 6. CAMERA & SCENE RENDER
      // --------------------------------------------------
      const camOffset = state === "mine"
        ? new THREE.Vector3(playerGroup.position.x, playerGroup.position.y + 5.5, playerGroup.position.z + 9)
        : new THREE.Vector3(playerGroup.position.x, 8.0, playerGroup.position.z + 12);

      camera.position.lerp(camOffset, 0.08);
      
      if (shake > 0) {
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake;
        camera.position.z += (Math.random() - 0.5) * shake;
      }

      camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.2, playerGroup.position.z);
      playerLight.position.set(playerGroup.position.x, playerGroup.position.y + 4.5, playerGroup.position.z);

      const distToJewelryShop = Math.hypot(
        playerGroup.position.x - 10,
        playerGroup.position.z - 186
      );
      const isNearJewelryShop = distToJewelryShop < 5.0 && state === "surface";
      if (lastNearJewelryShopRef.current !== isNearJewelryShop) {
        lastNearJewelryShopRef.current = isNearJewelryShop;
        setNearJewelryShop(isNearJewelryShop);
      }

      // Update Audio Zone based on player coordinates
      if (state === "mine") {
        soundManager.setMusicZone("cave");
        const distFromElevator = playerGroup.position.distanceTo(new THREE.Vector3(0, 0, 2));
        const miles = (distFromElevator / 1609).toFixed(2); 
        const km = (distFromElevator / 1000).toFixed(2);
        setLocationGuarded(`Mega Cave: ${miles} Miles / ${km} KM from Elevator`);
      } else if (state === "surface") {
        if (playerGroup.position.z < 120) {
          soundManager.setMusicZone("surface");
        } else if (playerGroup.position.z < 260) {
          soundManager.setMusicZone("factory");
        } else {
          soundManager.setMusicZone("jewelry");
        }
      }

      // Worker Wages deduction & financial rate calculation
      const wageDeduction = managementSystem.tickWages(dt);
      if (wageDeduction > 0) {
        setCash(prev => Math.max(0, prev - wageDeduction));
      }

      // Periodic Achievements & Milestone Check (Every 500ms)
      if (now - lastAchievementCheckTime > 500) {
        lastAchievementCheckTime = now;
        achievementsSystem.checkAll(
          {
            totalMined: totalMined,
            totalProcessed: managementSystem.getStats().totalGemsProcessed,
            totalJewelry: managementSystem.getStats().totalJewelryManufactured,
            workerCount: managementSystem.getWorkers().length,
            cash: cash,
            depth: lastDepthRef.current,
            discoveredGemsCount: gemEncyclopediaSystem.getDiscoveredGems().length,
            drillPower: upgrades.power
          },
          (cashReward, diamondReward) => {
            setCash(prev => prev + cashReward);
            soundManager.playCashRegister();
          }
        );
      }

      world.updateWorld(dt, playerGroup.position);
      managementOffice.update(dt);
      workerRenderer.update(dt);

      // Business upgrade multipliers applied to factory processing lines
      const conveyorMult = managementSystem.getConveyorSpeedMultiplier();
      const machineMult = managementSystem.getMachineSpeedMultiplier();
      factoryEngine.update(dt * conveyorMult * machineMult);
      if (jewelryFactoryRef.current) {
        jewelryFactoryRef.current.update(dt * machineMult);
      }
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        setTimeout(() => {
          animationFrameId = requestAnimationFrame(animate);
        }, 30);
      } else {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("teleport-to-elevator", handleTeleportEvent);
      window.removeEventListener("trigger-elevator", handleTriggerElevatorEvent);
      joystickContainer.removeEventListener("pointerdown", handlePointerDown);
      joystickContainer.removeEventListener("pointermove", handlePointerMove);
      joystickContainer.removeEventListener("pointerup", handlePointerUp);
      joystickContainer.removeEventListener("pointercancel", handlePointerUp);

      renderer.dispose();
      world.disposeWorld();
      factoryEngine.dispose();
      workerRenderer.dispose();
      managementOffice.dispose();
      if (jewelryFactoryRef.current) {
        jewelryFactoryRef.current.dispose();
      }

      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      if (mount.contains(joystickContainer)) mount.removeChild(joystickContainer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upgrades.elevatorSpeed]);

  const handleSellJewelry = useCallback((productId: string) => {
    if (jewelryFactoryRef.current) {
      const baseEarned = jewelryFactoryRef.current.sellJewelry(productId);
      if (baseEarned > 0) {
        const priceMult = managementSystem.getJewelryPriceMultiplier();
        const boostedEarned = Math.round(baseEarned * priceMult);
        setCash(prev => prev + boostedEarned);
        managementSystem.recordRevenue(boostedEarned);
        soundManager.playCashRegister();
        setJewelryInventory(jewelryFactoryRef.current.getJewelryInventory());
      }
    }
  }, []);

  const totalGemsCount = Object.values(inventory).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full h-dvh relative overflow-hidden bg-slate-950 select-none">
      {/* Professional Loading Screen */}
      <AnimatePresence>
        {isLoading && (
          <LoadingScreen onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      {/* 3D Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Mining HUD Overlay */}
      <MiningHUD
        cash={cash}
        inventory={inventory}
        jewelryInventory={jewelryInventory}
        totalGemsCount={totalGemsCount}
        backpackCapacity={backpackCapacity}
        location={location}
        depthFeet={depthFeet}
        elevatorSpeed={upgrades.elevatorSpeed}
        remainingCaveGems={remainingCaveGems}
        upgrades={upgrades}
        onUpgrade={handleUpgrade}
        onSellGems={handleSellGems}
        onSellJewelry={handleSellJewelry}
        onCallElevator={() => {
          if (nearElevator) {
            const event = new KeyboardEvent("keydown", { key: "e" });
            window.dispatchEvent(event);
          }
        }}
        nearElevator={nearElevator}
        nearTrader={nearTrader}
        nearFactory={nearFactory}
        nearJewelryShop={nearJewelryShop}
        isAutoDrilling={isAutoDrilling}
        clearScreenMode={clearScreenMode}
        onToggleClearScreen={() => setClearScreenMode(!clearScreenMode)}
        onDepositToFactory={handleDepositBackpackToFactory}
        factoryNotification={factoryNotification}
        onOpenOffice={() => setIsOfficeOpen(true)}
        onOpenEncyclopedia={() => {
          setFeaturedDiscoveredGem(null);
          setIsEncyclopediaOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenStatistics={() => setIsStatisticsOpen(true)}
        onOpenPublishingKit={() => setIsPublishingKitOpen(true)}
        onOpenPremiumShop={() => setIsPremiumShopOpen(true)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        nearOffice={nearOffice}
        diamonds={diamonds}
        achievementToast={achievementToast}
        gameTime={gameTime}
        onCloseAll={handleCloseAll}
        isAnyMenuOpen={
          isOfficeOpen || isEncyclopediaOpen || isTutorialOpen || 
          isSettingsOpen || isStatisticsOpen || isPublishingKitOpen || 
          isPremiumShopOpen || isAchievementsOpen
        }
        user={user}
        onSignIn={signInWithGoogle}
        headlampOn={headlampOn}
        onToggleHeadlamp={() => setHeadlampOn(!headlampOn)}
        headlampBrightness={headlampBrightness}
        onSetHeadlampBrightness={setHeadlampBrightness}
        playerState={playerState}
        oxygen={oxygen}
        onOpenMap={() => setIsMapOpen(true)}
        onOpenElevatorMenu={() => setIsElevatorMenuOpen(true)}
      />

      {/* World-Record Ultra Hyper-Speed Elevator Control Modal */}
      <ElevatorControlModal
        isOpen={isElevatorMenuOpen}
        onClose={() => setIsElevatorMenuOpen(false)}
        onPressGo={() => {
          setIsElevatorMenuOpen(false);
          window.dispatchEvent(new CustomEvent("trigger-elevator"));
        }}
        elevatorState={elevatorState}
        elevatorSpeed={upgrades.elevatorSpeed}
      />

      <CaveMap 
        pathNodes={pathNodes}
        playerPosition={playerPosState}
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
      />


      {/* Corporate Executive Management Headquarters Modal */}
      <ManagementModal
        isOpen={isOfficeOpen}
        onClose={() => setIsOfficeOpen(false)}
        cash={cash}
        onCashChange={(newCash) => {
          setCash(newCash);
        }}
        onWorkersUpdated={() => {
          if (workerRendererRef.current) {
            workerRendererRef.current.updateWorkers(managementSystem.getWorkers());
          }
        }}
      />

      {/* Illustrated Gemstone Encyclopedia Modal */}
      <EncyclopediaModal
        isOpen={isEncyclopediaOpen}
        onClose={() => {
          setIsEncyclopediaOpen(false);
          setFeaturedDiscoveredGem(null);
        }}
        featuredGem={featuredDiscoveredGem}
      />

      {/* First-Time Player Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {/* Game Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={(newSettings) => setSettings(newSettings)}
        onRestartTutorial={() => setIsTutorialOpen(true)}
        onTeleportToElevator={handleTeleportToElevator}
      />

      {/* Production & Business Statistics Modal */}
      <StatisticsModal
        isOpen={isStatisticsOpen}
        onClose={() => setIsStatisticsOpen(false)}
        cash={cash}
        totalMined={totalMined}
      />

      {/* Publishing & Launch Kit Modal */}
      <PublishingKitModal
        isOpen={isPublishingKitOpen}
        onClose={() => setIsPublishingKitOpen(false)}
        gameUrl={typeof window !== "undefined" ? window.location.href : ""}
      />

      {/* Premium Shop Modal */}
      <PremiumShopModal
        isOpen={isPremiumShopOpen}
        onClose={() => setIsPremiumShopOpen(false)}
        ownedItems={ownedItems}
        cash={cash}
        batteries={batteries}
        diamonds={diamonds}
        onPurchaseWithCash={handlePurchasePremiumItem}
      />

      {/* Minecraft-Inspired Achievements Modal */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        onCloseAll={handleCloseAll}
        achievements={achievements}
        diamonds={diamonds}
        onClaimReward={handleClaimAchievementReward}
      />
    </div>
  );
}
