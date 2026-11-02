import * as THREE from "three";
import { soundManager } from "@/lib/audio";

export type GemType = {
  id: string;
  name: string;
  color: number;
  value: number;
  rarity: number;
};

export const GAME_GEMS: GemType[] = [
  { id: "tiki", name: "Tiki Tiki Gem", color: 0x20e8b5, value: 25, rarity: 1 },
  { id: "saga", name: "Saga Gem", color: 0x9845ed, value: 45, rarity: 0.8 },
  { id: "burger", name: "Burger Gem", color: 0xff9828, value: 60, rarity: 0.7 },
  { id: "cash", name: "Cash Gem", color: 0x27d66f, value: 100, rarity: 0.6 },
  { id: "diamond", name: "Diamond Gem", color: 0x8deaff, value: 250, rarity: 0.35 },
  { id: "bergen", name: "Bergen Gem", color: 0xff4d8c, value: 400, rarity: 0.25 },
  { id: "safety", name: "Safety Gem", color: 0x347bff, value: 900, rarity: 0.12 },
  { id: "kaka", name: "Kaka Gem", color: 0xff4545, value: 1500, rarity: 0.06 }
];

export type GemDrop = {
  type: GemType;
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  collected: boolean;
};

export type OreOptions = {
  id?: string;
  position: THREE.Vector3;
  depth: number;
  gemCount?: number;
  isUnderwater?: boolean;
  onGemCollected?: (gem: GemType) => void;
  onCaveIn?: () => void;
};

// Procedural Minecraft-style Block Cracking Textures (Stage 0 to 5)
const crackTextureCache: THREE.CanvasTexture[] = [];

export function getMinecraftCrackTexture(stage: number): THREE.CanvasTexture {
  if (crackTextureCache[stage]) return crackTextureCache[stage];

  if (typeof window === "undefined" || typeof document === "undefined") {
    const dummyCanvas = { width: 64, height: 64, getContext: () => null } as unknown as HTMLCanvasElement;
    return new THREE.CanvasTexture(dummyCanvas);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;

  // Stone base face
  ctx.fillStyle = "#6e6e73";
  ctx.fillRect(0, 0, 64, 64);

  // Stone pixel noise for Minecraft block texture
  for (let x = 0; x < 64; x += 4) {
    for (let y = 0; y < 64; y += 4) {
      const shade = Math.floor(Math.random() * 36) - 18;
      const base = 115 + shade;
      ctx.fillStyle = `rgb(${base}, ${base}, ${base + 4})`;
      ctx.fillRect(x, y, 4, 4);
    }
  }

  // Draw pixelated cracks if stage > 0
  if (stage > 0) {
    ctx.strokeStyle = "#111113";
    ctx.lineWidth = 3.5;

    const branches = [
      [[32, 12], [28, 24], [36, 36], [32, 52]],
      [[28, 24], [16, 20], [8, 32]],
      [[36, 36], [48, 32], [56, 44]],
      [[32, 12], [44, 8], [52, 4]],
      [[32, 52], [20, 56], [12, 60]],
      [[16, 20], [8, 12]], [[48, 32], [52, 20]], [[28, 24], [24, 40]]
    ];

    for (let b = 0; b < Math.min(stage, branches.length); b++) {
      const path = branches[b];
      ctx.beginPath();
      ctx.moveTo(path[0][0], path[0][1]);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i][0], path[i][1]);
      }
      ctx.stroke();
    }

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.5;
    for (let b = 0; b < Math.min(stage, branches.length); b++) {
      const path = branches[b];
      ctx.beginPath();
      ctx.moveTo(path[0][0], path[0][1]);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i][0], path[i][1]);
      }
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  crackTextureCache[stage] = texture;
  return texture;
}

export class GemOreDeposit {
  readonly group = new THREE.Group();
  readonly id: string;

  health: number;
  maxHealth: number;
  broken = false;
  regenTimer = 0;
  private readonly regenDuration = 25; // Respawns in 25 seconds if broken

  private scene: THREE.Scene;
  private drops: GemDrop[] = [];
  private rockMesh!: THREE.InstancedMesh;
  private rockGeometry!: THREE.BoxGeometry;
  private rockMaterial!: THREE.MeshStandardMaterial;
  private gemMeshes: THREE.Mesh[] = [];
  public options: OreOptions;

  private readonly rockWidth = 4.2;
  private readonly rockHeight = 3.2;
  private readonly rockDepth = 3.2;
  private readonly cellSize = 0.5;

  constructor(scene: THREE.Scene, options: OreOptions) {
    this.scene = scene;
    this.options = options;
    this.id = options.id || `deposit_${options.position.x.toFixed(1)}_${options.position.y.toFixed(1)}_${options.position.z.toFixed(1)}`;

    this.maxHealth = Math.min(600, 90 * Math.pow(1.35, Math.min(8, options.depth)));
    this.health = this.maxHealth;

    this.group.position.copy(options.position);
    this.group.name = "BlockyGemOreDeposit";

    this.createBlockyDeposit(options.gemCount ?? 24);

    scene.add(this.group);
  }

  private chooseGem(): GemType {
    const roll = Math.random();
    const depthBonus = Math.min(0.45, this.options.depth * 0.08);
    const adjustedRoll = Math.max(0, roll - depthBonus);

    return [...GAME_GEMS]
      .sort((a, b) => a.rarity - b.rarity)
      .find(gem => adjustedRoll <= gem.rarity) ?? GAME_GEMS[0];
  }

  private createBlockyDeposit(gemCount: number) {
    this.rockGeometry = new THREE.BoxGeometry(
      this.cellSize,
      this.cellSize,
      this.cellSize
    );

    this.rockMaterial = new THREE.MeshStandardMaterial({
      map: getMinecraftCrackTexture(0),
      color: this.options.depth >= 4 ? 0x444a50 : 0x7c7c84,
      roughness: 0.82,
      metalness: 0.15,
      bumpMap: getMinecraftCrackTexture(0),
      bumpScale: 0.08
    });

    const gemLocations: {
      type: GemType;
      position: THREE.Vector3;
      size: number;
    }[] = [];

    // Place blocky gems sticking out on outer faces of the rock deposit
    const cols = Math.ceil(Math.sqrt(gemCount));
    const rows = Math.ceil(gemCount / cols);

    for (let i = 0; i < gemCount; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);

      const lx = -1.6 + c * (3.2 / Math.max(1, cols - 1)) + (Math.random() - 0.5) * 0.15;
      const ly = -1.1 + r * (2.2 / Math.max(1, rows - 1)) + (Math.random() - 0.5) * 0.15;
      const lz = 1.3 + (Math.random() - 0.5) * 0.2; // Front protruding face

      const size = 0.28 + Math.random() * 0.18;
      gemLocations.push({
        type: this.chooseGem(),
        position: new THREE.Vector3(lx, ly, lz),
        size
      });
    }

    // Build solid voxel stone cluster
    const matrices: THREE.Matrix4[] = [];
    const nx = Math.floor(this.rockWidth / this.cellSize);
    const ny = Math.floor(this.rockHeight / this.cellSize);
    const nz = Math.floor(this.rockDepth / this.cellSize);
    const temp = new THREE.Object3D();

    for (let ix = 0; ix < nx; ix++) {
      for (let iy = 0; iy < ny; iy++) {
        for (let iz = 0; iz < nz; iz++) {
          const x = -this.rockWidth / 2 + this.cellSize / 2 + ix * this.cellSize;
          const y = -this.rockHeight / 2 + this.cellSize / 2 + iy * this.cellSize;
          const z = -this.rockDepth / 2 + this.cellSize / 2 + iz * this.cellSize;

          temp.position.set(x, y, z);
          temp.rotation.set(0, 0, 0);
          temp.updateMatrix();

          matrices.push(temp.matrix.clone());
        }
      }
    }

    this.rockMesh = new THREE.InstancedMesh(
      this.rockGeometry,
      this.rockMaterial,
      matrices.length
    );

    this.rockMesh.name = "BlockyStoneMass";
    this.rockMesh.castShadow = true;
    this.rockMesh.receiveShadow = true;

    matrices.forEach((matrix, index) => {
      this.rockMesh.setMatrixAt(index, matrix);
    });

    this.rockMesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.rockMesh);

    // Add bright, blocky physical gemstone crystals protruding from the deposit
    for (const data of gemLocations) {
      // Original blocky octahedron / cube gem style
      const gemGeo = Math.random() > 0.5
        ? new THREE.OctahedronGeometry(data.size, 1)
        : new THREE.BoxGeometry(data.size * 1.3, data.size * 1.3, data.size * 1.3);

      const gemMat = new THREE.MeshPhysicalMaterial({
        color: data.type.color,
        emissive: data.type.color,
        emissiveIntensity: data.type.value >= 250 ? 1.6 : 1.1,
        roughness: 0.05,
        metalness: 0.25,
        transmission: 0.85,
        ior: 1.6,
        thickness: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05
      });

      const gemMesh = new THREE.Mesh(gemGeo, gemMat);
      gemMesh.position.copy(data.position);
      gemMesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      gemMesh.userData.gemType = data.type;
      this.gemMeshes.push(gemMesh);
      this.group.add(gemMesh);
    }
  }

  // Called when player's drill hits deposit
  drill(damage: number): boolean {
    if (this.broken || damage <= 0) return false;

    this.health = Math.max(0, this.health - damage);

    const damageRatio = 1 - this.health / this.maxHealth;
    const stage = Math.min(5, Math.floor(damageRatio * 6));

    // Update Minecraft pixelated crack texture stage
    this.rockMaterial.map = getMinecraftCrackTexture(stage);
    this.rockMaterial.needsUpdate = true;

    if (this.health <= 0) {
      this.breakRock();
      
      // Rare Cave-In Event (5% chance when breaking deep deposits)
      if (this.options.depth > 3 && Math.random() < 0.05) {
        this.options.onCaveIn?.();
      }
      
      return true;
    }

    return false;
  }

  private breakRock() {
    if (this.broken) return;
    this.broken = true;
    this.regenTimer = this.regenDuration;

    soundManager.playBlockShatter();

    // Detach embedded gem meshes and pop out physical collectible blocky gem drops into cave
    for (const gemMesh of this.gemMeshes) {
      const type = gemMesh.userData.gemType as GemType;
      const worldPosition = gemMesh.getWorldPosition(new THREE.Vector3());

      const dropGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35); // Original blocky gem drop
      const dropMat = new THREE.MeshPhysicalMaterial({
        color: type.color,
        emissive: type.color,
        emissiveIntensity: 1.4,
        roughness: 0.02,
        metalness: 0.3,
        transmission: 0.9,
        ior: 1.62,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02
      });

      const drop = new THREE.Mesh(dropGeo, dropMat);
      drop.position.copy(worldPosition);
      drop.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      drop.userData.collectible = true;
      drop.userData.gemType = type;

      this.scene.add(drop);

      this.drops.push({
        type,
        mesh: drop,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 4.5,
          3.5 + Math.random() * 3.5,
          (Math.random() - 0.5) * 4.5
        ),
        collected: false
      });
    }

    this.scene.remove(this.group);
  }

  regenerate() {
    if (!this.broken) return;

    this.broken = false;
    this.health = this.maxHealth;

    // Clean up old drops
    for (const drop of this.drops) {
      if (drop.mesh.parent) drop.mesh.parent.remove(drop.mesh);
      drop.mesh.geometry.dispose();
      (drop.mesh.material as THREE.Material).dispose();
    }
    this.drops = [];

    // Clear old group
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
    this.gemMeshes = [];

    if (this.rockGeometry) this.rockGeometry.dispose();
    if (this.rockMaterial) this.rockMaterial.dispose();

    this.createBlockyDeposit(this.options.gemCount ?? 24);
    this.scene.add(this.group);
  }

  updateDrops(deltaTime: number, floorY: number) {
    if (this.broken) {
      this.regenTimer -= deltaTime;
      if (this.regenTimer <= 0) {
        this.regenerate();
      }
    }

    for (const drop of this.drops) {
      if (drop.collected) continue;

      drop.velocity.y -= 9.8 * deltaTime;
      drop.mesh.position.addScaledVector(drop.velocity, deltaTime);

      const targetY = Math.max(floorY + 0.3, this.options.position.y - 10);
      if (drop.mesh.position.y <= targetY) {
        drop.mesh.position.y = targetY;
        drop.velocity.y = 0;
        drop.velocity.x *= 0.75;
        drop.velocity.z *= 0.75;
      }

      drop.mesh.rotation.y += deltaTime * 2.5;
      drop.mesh.rotation.x += deltaTime * 1.5;
    }
  }

  // Automatic pickup when player walks near loose blocky gem drops
  collectNear(
    playerPosition: THREE.Vector3,
    radius: number,
    backpackCapacity: number,
    currentBackpackTotal: number
  ): GemType[] {
    const collectedGems: GemType[] = [];

    for (const drop of this.drops) {
      if (drop.collected) continue;
      if ((currentBackpackTotal + collectedGems.length) >= backpackCapacity) break;

      if (drop.mesh.position.distanceTo(playerPosition) <= radius) {
        drop.collected = true;
        drop.mesh.visible = false;
        if (drop.mesh.parent) drop.mesh.parent.remove(drop.mesh);

        collectedGems.push(drop.type);
        this.options.onGemCollected?.(drop.type);
      }
    }

    return collectedGems;
  }

  dispose() {
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
    for (const drop of this.drops) {
      if (drop.mesh.parent) drop.mesh.parent.remove(drop.mesh);
      drop.mesh.geometry.dispose();
      (drop.mesh.material as THREE.Material).dispose();
    }
    if (this.rockGeometry) this.rockGeometry.dispose();
    if (this.rockMaterial) this.rockMaterial.dispose();
  }
}

export class GemDrillController {
  power = 24.4;
  speed = 1.35;
  cooling = 1.0;
  scanner = false;

  upgradePower(amount: number) {
    this.power += amount;
  }

  upgradeSpeed(amount: number) {
    this.speed += amount;
  }

  drill(deposit: GemOreDeposit, deltaTime: number) {
    return deposit.drill(this.power * this.speed * deltaTime);
  }
}

