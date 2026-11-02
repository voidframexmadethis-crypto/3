import * as THREE from "three";
import { createNoise3D } from "simplex-noise";
import { GemOreDeposit } from "./gems";

export type WorldElements = {
  deposits: GemOreDeposit[];
  elevatorGroup: THREE.Group;
  elevatorDoors: THREE.Mesh[];
  elevatorPlatformY: number;
  lightPoles: THREE.PointLight[];
  waterMesh: THREE.Mesh;
  ladders: THREE.Group[];
  groundMeshes: THREE.Object3D[];
  updateWorld: (dt: number, playerPos?: THREE.Vector3) => void;
  disposeWorld: () => void;
  pathNodes: THREE.Vector3[];
  group: THREE.Group;
};



const CHUNK_SIZE = 40;
const LOAD_DISTANCE = 3; // chunks around player
const TARGET_LENGTH_METERS = 17381; // 10.8 miles

// Deterministic random
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

class PathSystem {
  nodes: THREE.Vector3[] = [];
  segments: { a: THREE.Vector3, b: THREE.Vector3, length: number, radius: number }[] = [];
  totalLength = 0;

  constructor(seed: number) {
    const rng = mulberry32(seed);
    const noise = createNoise3D(rng);
    
    let currentPos = new THREE.Vector3(0, 0, -2);
    this.nodes.push(currentPos.clone());

    // Generate a branching network
    const stack: { pos: THREE.Vector3, lengthRemaining: number }[] = [
      { pos: currentPos.clone(), lengthRemaining: TARGET_LENGTH_METERS }
    ];

    while (stack.length > 0 && this.totalLength < TARGET_LENGTH_METERS * 1.2) {
      const current = stack.pop()!;
      let p = current.pos.clone();
      let remaining = current.lengthRemaining;

      const branchLength = 50 + rng() * 150;
      const actualStep = Math.min(remaining, branchLength);
      
      for (let l = 0; l < actualStep; l += 15) {
        const prev = p.clone();
        
        // Directional drift
        const dx = (noise(p.x * 0.01, p.y * 0.01, p.z * 0.01 + 100) - 0.5) * 15;
        const dy = (noise(p.x * 0.01, p.y * 0.01, p.z * 0.01 + 200) - 0.5) * 5;
        const dz = -10 - rng() * 10;
        
        p.x += dx;
        p.y += dy;
        p.z += dz;
        
        // Depth limit (455 feet = 140 meters)
        p.y = THREE.MathUtils.clamp(p.y, -140, 0);

        const segmentLen = prev.distanceTo(p);
        this.segments.push({
          a: prev,
          b: p.clone(),
          length: segmentLen,
          radius: 6 + rng() * 12 // Enormous chambers
        });
        
        this.totalLength += segmentLen;

        // Chance to branch
        if (rng() < 0.15 && this.totalLength < TARGET_LENGTH_METERS) {
          stack.push({ pos: p.clone(), lengthRemaining: (TARGET_LENGTH_METERS - this.totalLength) / 2 });
        }
      }
    }
  }

  getDistanceToPath(point: THREE.Vector3): { dist: number, radius: number } {
    let minDist = Infinity;
    let radius = 0;
    
    for (const seg of this.segments) {
      // Distance from point to line segment
      const v = new THREE.Vector3().subVectors(seg.b, seg.a);
      const w = new THREE.Vector3().subVectors(point, seg.a);
      const c1 = w.dot(v);
      if (c1 <= 0) {
        const d = point.distanceTo(seg.a);
        if (d < minDist) {
          minDist = d;
          radius = seg.radius;
        }
        continue;
      }
      const c2 = v.dot(v);
      if (c2 <= c1) {
        const d = point.distanceTo(seg.b);
        if (d < minDist) {
          minDist = d;
          radius = seg.radius;
        }
        continue;
      }
      const b = c1 / c2;
      const pb = new THREE.Vector3().addVectors(seg.a, v.multiplyScalar(b));
      const d = point.distanceTo(pb);
      if (d < minDist) {
        minDist = d;
        radius = seg.radius;
      }
    }
    return { dist: minDist, radius };
  }
}

class Chunk {
  group = new THREE.Group();
  deposits: GemOreDeposit[] = [];
  groundMeshes: THREE.Object3D[] = [];
  ladders: THREE.Group[] = [];
  
  constructor(
    public x: number,
    public z: number,
    scene: THREE.Scene,
    pathSystem: PathSystem,
    materials: Record<string, THREE.Material>,
    noise: ReturnType<typeof createNoise3D>,
    mainGroup: THREE.Group
  ) {
    const chunkCenter = new THREE.Vector3(x * CHUNK_SIZE + CHUNK_SIZE/2, -70, z * CHUNK_SIZE + CHUNK_SIZE/2);
    
    // Quick check if path is near
    const { dist: distToPath, radius: pathRadius } = pathSystem.getDistanceToPath(chunkCenter);
    if (distToPath > CHUNK_SIZE * 2) return;

    const rng = mulberry32(x * 1337 + z);
    
    // 1. Generate Floor Mesh (with Ravine Carving)
    const geo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, 24, 24);
    const posAttr = geo.attributes.position;
    const isRavine = rng() < 0.2; // 20% chance of a massive ravine in this chunk
    
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i) + x * CHUNK_SIZE + CHUNK_SIZE/2;
      const vz = posAttr.getY(i) + z * CHUNK_SIZE + CHUNK_SIZE/2;
      const worldPos = new THREE.Vector3(vx, 0, vz);
      const { dist, radius } = pathSystem.getDistanceToPath(worldPos);
      
      let h = -150; 
      if (dist < radius * 2.0) {
        const falloff = Math.max(0, 1 - (dist / (radius * 1.8)));
        const smoothFalloff = THREE.MathUtils.smoothstep(falloff, 0, 1);
        
        // Base floor height
        h = (noise(vx * 0.02, vz * 0.02, 0) * 5 - 2) * smoothFalloff;
        
        // Ravine Carving (Drops floor significantly)
        if (isRavine && dist < radius * 0.5) {
          h = -30 * smoothFalloff;
        }
      }
      posAttr.setZ(i, h);
    }
    
    geo.computeVertexNormals();
    const floor = new THREE.Mesh(geo, materials.dirt);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(x * CHUNK_SIZE + CHUNK_SIZE/2, 0, z * CHUNK_SIZE + CHUNK_SIZE/2);
    floor.receiveShadow = true;
    this.group.add(floor);
    this.groundMeshes.push(floor);

    // 2. Generate Ceiling Mesh (with Higher Vaults in Ravines)
    const ceilGeo = geo.clone();
    const ceilPos = ceilGeo.attributes.position;
    for (let i = 0; i < ceilPos.count; i++) {
      const vx = ceilPos.getX(i) + x * CHUNK_SIZE + CHUNK_SIZE/2;
      const vz = ceilPos.getY(i) + z * CHUNK_SIZE + CHUNK_SIZE/2;
      const worldPos = new THREE.Vector3(vx, 0, vz);
      const { dist, radius } = pathSystem.getDistanceToPath(worldPos);
      
      let h = 50; 
      if (dist < radius * 2.0) {
        const falloff = Math.max(0, 1 - (dist / (radius * 1.8)));
        h = 14 + radius * 0.8 + noise(vx * 0.03, vz * 0.03, 100) * 5;
        if (isRavine && dist < radius * 0.6) {
          h += 25; // Cathedral sized ceilings over ravines
        }
      }
      ceilPos.setZ(i, h);
    }
    ceilGeo.computeVertexNormals();
    const ceil = new THREE.Mesh(ceilGeo, materials.rock);
    ceil.rotation.x = Math.PI / 2;
    this.group.add(ceil);

    // 3. Natural Pillars, Stalactites & Waterfalls
    for (let i = 0; i < 10; i++) {
      const px = (rng() - 0.5) * CHUNK_SIZE + x * CHUNK_SIZE + CHUNK_SIZE/2;
      const pz = (rng() - 0.5) * CHUNK_SIZE + z * CHUNK_SIZE + CHUNK_SIZE/2;
      const pp = new THREE.Vector3(px, 0, pz);
      const { dist, radius } = pathSystem.getDistanceToPath(pp);

      if (dist < radius * 0.95) {
        const type = rng();
        if (type < 0.15) { // Pillar
          const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.8, 40, 8), materials.rock);
          pillar.position.set(px, 15, pz);
          this.group.add(pillar);
        } else if (type < 0.35) { // Stalactite
          const stalactite = new THREE.Mesh(new THREE.ConeGeometry(1.0, 8, 6), materials.rock);
          stalactite.rotation.x = Math.PI;
          stalactite.position.set(px, 25, pz);
          this.group.add(stalactite);
        } else if (isRavine && type < 0.45) { // WATERFALL
          const waterfallGroup = new THREE.Group();
          waterfallGroup.position.set(px, -15, pz);
          const water = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.2, 45, 12, 1, true),
            new THREE.MeshPhysicalMaterial({
              color: 0x38bdf8,
              emissive: 0x38bdf8,
              emissiveIntensity: 0.8,
              transparent: true,
              opacity: 0.75,
              transmission: 0.85,
              roughness: 0.1,
              ior: 1.33
            })
          );
          waterfallGroup.add(water);
          this.group.add(waterfallGroup);
        }
      }
    }

    // 4. Procedural Moss & Vines (Ecosystem)
    const mossCount = Math.floor(rng() * 40) + 20;
    const mossPos = new Float32Array(mossCount * 3);
    for (let i = 0; i < mossCount; i++) {
      const mx = (rng() - 0.5) * CHUNK_SIZE;
      const mz = (rng() - 0.5) * CHUNK_SIZE;
      const mp = new THREE.Vector3(mx + x * CHUNK_SIZE + CHUNK_SIZE/2, 0, mz + z * CHUNK_SIZE + CHUNK_SIZE/2);
      const { dist, radius } = pathSystem.getDistanceToPath(mp);
      
      // Place on walls
      if (dist > radius * 0.8 && dist < radius * 1.1) {
        mossPos[i*3] = mx;
        mossPos[i*3+1] = 8 + rng() * 15;
        mossPos[i*3+2] = mz;
      } else {
        mossPos[i*3+1] = -500; // Hide
      }
    }
    const mossGeo = new THREE.BufferGeometry();
    mossGeo.setAttribute('position', new THREE.BufferAttribute(mossPos, 3));
    const mossPoints = new THREE.Points(mossGeo, new THREE.PointsMaterial({ 
      color: 0x4ade80, 
      size: 0.45, 
      transparent: true, 
      opacity: 0.8 
    }));
    this.group.add(mossPoints);

    // 5. Underground Lakes (Ravine Floors)
    if (isRavine || rng() < 0.2) {
      const lx = (rng() - 0.5) * CHUNK_SIZE + x * CHUNK_SIZE + CHUNK_SIZE/2;
      const lz = (rng() - 0.5) * CHUNK_SIZE + z * CHUNK_SIZE + CHUNK_SIZE/2;
      const lp = new THREE.Vector3(lx, 0, lz);
      const { dist, radius } = pathSystem.getDistanceToPath(lp);
      
      if (dist < radius * 0.8) {
        const waterHeight = isRavine ? -25 : -4.5;
        const water = new THREE.Mesh(
          new THREE.PlaneGeometry(25, 25),
          new THREE.MeshPhysicalMaterial({
            color: 0x0284c7,
            emissive: 0x0284c7,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.7,
            transmission: 0.85,
            roughness: 0.1
          })
        );
        water.rotation.x = -Math.PI / 2;
        water.position.set(lx, waterHeight, lz);
        this.group.add(water);
      }
    }

    // 5. Embedded Blocky Gems (Dense 12.8 Billion Scale Distribution: Walls, Ceilings, Floors, Ravines, Bridges & Lakes)
    const gemDepositCount = isRavine ? 28 : 20;
    for (let i = 0; i < gemDepositCount; i++) {
      const gx = (rng() - 0.5) * (CHUNK_SIZE - 4) + x * CHUNK_SIZE + CHUNK_SIZE/2;
      const gz = (rng() - 0.5) * (CHUNK_SIZE - 4) + z * CHUNK_SIZE + CHUNK_SIZE/2;
      const gp = new THREE.Vector3(gx, 0, gz);
      const { dist, radius } = pathSystem.getDistanceToPath(gp);
      
      // Calculate continuous ground floor height at gx, gz
      const floorNoise = noise(gx * 0.02, gz * 0.02, 0) * 5 - 2;
      const falloff = Math.max(0, 1 - (dist / (radius * 1.8)));
      const smoothFalloff = THREE.MathUtils.smoothstep(falloff, 0, 1);
      let calcFloorY = floorNoise * smoothFalloff;
      if (isRavine && dist < radius * 0.5) {
        calcFloorY = -30 * smoothFalloff;
      }

      // Ceiling height
      let calcCeilY = 14 + radius * 0.8 + noise(gx * 0.03, gz * 0.03, 100) * 5;
      if (isRavine && dist < radius * 0.6) calcCeilY += 25;

      const placementRoll = rng();
      let gy = calcFloorY + 1.2;
      let rotX = 0;
      let rotZ = 0;

      if (dist < radius * 1.6) {
        if (placementRoll < 0.45) { // Tunnel/Chamber Wall
          gy = calcFloorY + 2 + rng() * Math.max(2, calcCeilY - calcFloorY - 5);
          rotZ = (rng() > 0.5 ? 1 : -1) * (Math.PI / 2 + (rng() - 0.5) * 0.3);
        } else if (placementRoll < 0.70) { // Vaulted Ceiling / Hanging Formation
          gy = calcCeilY - 1.5;
          rotX = Math.PI + (rng() - 0.5) * 0.4;
        } else { // Floor / Ledge Deposit
          gy = calcFloorY + 1.2;
          rotX = (rng() - 0.5) * 0.3;
        }

        const depth = Math.floor(Math.abs(gz) / 350) + 1;
        const depositId = `gem_chunk_${x}_${z}_${i}`;
        
        const deposit = new GemOreDeposit(scene, {
          id: depositId,
          position: new THREE.Vector3(gx, gy, gz),
          depth,
          gemCount: 35 + Math.floor(rng() * 40),
          isUnderwater: isRavine && calcFloorY < -20
        });

        deposit.group.rotation.set(rotX, rng() * Math.PI * 2, rotZ);
        this.deposits.push(deposit);
      }
    }

    // 6. Functional 3D Industrial Shaft Elevators (Replacing Cave Ladders)
    const elevatorCount = isRavine ? 3 : 2;
    for (let l = 0; l < elevatorCount; l++) {
      const elX = (rng() - 0.5) * 16 + x * CHUNK_SIZE + CHUNK_SIZE/2;
      const elZ = (rng() - 0.5) * 16 + z * CHUNK_SIZE + CHUNK_SIZE/2;
      const { dist, radius } = pathSystem.getDistanceToPath(new THREE.Vector3(elX, 0, elZ));

      const floorNoise = noise(elX * 0.02, elZ * 0.02, 0) * 5 - 2;
      const falloff = Math.max(0, 1 - (dist / (radius * 1.8)));
      const smoothFalloff = THREE.MathUtils.smoothstep(falloff, 0, 1);
      let bottomY = floorNoise * smoothFalloff;
      if (isRavine && dist < radius * 0.5) bottomY = -30 * smoothFalloff;

      const shaftHeight = isRavine ? 32 : 18;
      const topY = bottomY + shaftHeight;

      const elevatorGroup = new THREE.Group();
      elevatorGroup.position.set(elX, bottomY, elZ);
      elevatorGroup.userData.isShaftElevator = true;
      elevatorGroup.userData.bottomY = bottomY;
      elevatorGroup.userData.topY = topY;
      elevatorGroup.userData.currentY = bottomY;
      elevatorGroup.userData.state = "idle"; // "idle" | "moving_up" | "moving_down"

      const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });

      // 4 Heavy Steel Guide Shaft Columns
      for (let c = 0; c < 4; c++) {
        const column = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, shaftHeight + 4, 8), steelMat);
        column.position.set(c < 2 ? -1.8 : 1.8, (shaftHeight + 4) / 2, c % 2 === 0 ? -1.8 : 1.8);
        elevatorGroup.add(column);
      }

      // Elevator Platform Cabin
      const platformMesh = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.35, 3.6),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 })
      );
      platformMesh.position.y = 0.18;
      platformMesh.receiveShadow = true;
      elevatorGroup.add(platformMesh);
      this.groundMeshes.push(platformMesh);

      // Yellow Industrial Safety Railing Cage
      const railMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7 });
      const backRail = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 0.1), railMat);
      backRail.position.set(0, 0.8, -1.75);
      elevatorGroup.add(backRail);

      const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 3.6), railMat);
      leftRail.position.set(-1.75, 0.8, 0);
      elevatorGroup.add(leftRail);

      const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 3.6), railMat);
      rightRail.position.set(1.75, 0.8, 0);
      elevatorGroup.add(rightRail);

      // Overhead Winch Pulley Housing & Beacon Light
      const winchBox = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.8, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
      );
      winchBox.position.set(0, shaftHeight + 2.4, 0);
      elevatorGroup.add(winchBox);

      const beaconLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 2.2 })
      );
      beaconLight.position.set(0, shaftHeight + 3.1, 0);
      elevatorGroup.add(beaconLight);

      // Top Landing Platform Ledge
      const platformMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.4 });
      const topPlatform = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 3.6), platformMat);
      topPlatform.position.set(0, shaftHeight + 0.15, 2.8);
      topPlatform.receiveShadow = true;
      elevatorGroup.add(topPlatform);
      this.groundMeshes.push(topPlatform);

      this.group.add(elevatorGroup);
      this.ladders.push(elevatorGroup);
    }

    // 7. Point A to Point B Ravine Suspension Bridges Across Chasms
    if (isRavine) {
      const bridgeGroup = new THREE.Group();
      const bridgeX = x * CHUNK_SIZE + CHUNK_SIZE/2;
      const bridgeZ = z * CHUNK_SIZE + CHUNK_SIZE/2;
      bridgeGroup.position.set(bridgeX, -1.2, bridgeZ);

      // Main Point A to Point B Plank Deck (Longitudinal)
      const bridgeDeckA = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 0.3, 28),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
      );
      bridgeDeckA.position.y = 0.1;
      bridgeDeckA.receiveShadow = true;
      bridgeGroup.add(bridgeDeckA);
      this.groundMeshes.push(bridgeDeckA);

      // Cross Connector Deck (Point A to Point B Transverse Bridge)
      const bridgeDeckB = new THREE.Mesh(
        new THREE.BoxGeometry(28, 0.3, 4.8),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
      );
      bridgeDeckB.position.y = 0.1;
      bridgeDeckB.receiveShadow = true;
      bridgeGroup.add(bridgeDeckB);
      this.groundMeshes.push(bridgeDeckB);

      // Steel Guardrails, Ropes & Lantern Posts
      const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
      const leftRope = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 28, 8), ropeMat);
      leftRope.rotation.x = Math.PI / 2;
      leftRope.position.set(-2.3, 1.2, 0);
      bridgeGroup.add(leftRope);

      const rightRope = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 28, 8), ropeMat);
      rightRope.rotation.x = Math.PI / 2;
      rightRope.position.set(2.3, 1.2, 0);
      bridgeGroup.add(rightRope);

      // Bridge Entry Lantern Lights
      const lanternGeo = new THREE.SphereGeometry(0.18, 12, 12);
      const lanternMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 2.5 });
      const lanternA = new THREE.Mesh(lanternGeo, lanternMat);
      lanternA.position.set(-2.2, 1.8, 13);
      bridgeGroup.add(lanternA);
      const lanternB = new THREE.Mesh(lanternGeo, lanternMat);
      lanternB.position.set(2.2, 1.8, -13);
      bridgeGroup.add(lanternB);

      this.group.add(bridgeGroup);

      // 7B. Mechanical Cliff Ledge Elevators (Vertical Lift Lifts alongside ladders)
      const cliffLift = new THREE.Group();
      cliffLift.position.set(bridgeX + 8, -25, bridgeZ - 8);
      cliffLift.userData.isCliffElevator = true;
      cliffLift.userData.bottomY = -25;
      cliffLift.userData.topY = 0;

      // 4 Guide Steel Columns
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
      for (let c = 0; c < 4; c++) {
        const column = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 28, 8), steelMat);
        column.position.set(c < 2 ? -1.6 : 1.6, 14, c % 2 === 0 ? -1.6 : 1.6);
        cliffLift.add(column);
      }

      // Elevator Lift Cabin Platform
      const liftCabin = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.35, 3.6),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 })
      );
      liftCabin.position.y = 0.2;
      liftCabin.receiveShadow = true;
      cliffLift.add(liftCabin);
      this.groundMeshes.push(liftCabin);

      // Yellow Railing
      const railMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7 });
      const guardRail = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 0.1), railMat);
      guardRail.position.set(0, 0.7, -1.75);
      cliffLift.add(guardRail);

      // Overhead Motor Beacon Light
      const beaconLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 2.2 })
      );
      beaconLight.position.set(0, 28.5, 0);
      cliffLift.add(beaconLight);

      this.group.add(cliffLift);
    }

    // 8. Path Safety Lights (Industrial Yellow Glowing Fixtures)
    for (let i = 0; i < 2; i++) {
      const lx = (rng() - 0.5) * CHUNK_SIZE + x * CHUNK_SIZE + CHUNK_SIZE/2;
      const lz = (rng() - 0.5) * CHUNK_SIZE + z * CHUNK_SIZE + CHUNK_SIZE/2;
      const lp = new THREE.Vector3(lx, 0, lz);
      const { dist, radius } = pathSystem.getDistanceToPath(lp);

      if (dist < radius * 0.5) {
        const fixture = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.25, 0.5, 6),
          new THREE.MeshStandardMaterial({
            color: 0xffd60a,
            emissive: 0xffd60a,
            emissiveIntensity: 2.2,
            metalness: 0.8
          })
        );
        fixture.position.set(lx, 6.2, lz);
        this.group.add(fixture);
      }
    }

    mainGroup.add(this.group);
  }

  dispose(mainGroup: THREE.Group) {
    mainGroup.remove(this.group);
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
    this.deposits.forEach(d => d.dispose());
  }
}

function createProceduralTexture(type: "stone" | "dirt" | "grass" | "bricks" | "shingles", color1: string, color2: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color1;
  ctx.fillRect(0, 0, 512, 512);
  if (type === "stone" || type === "dirt") {
    for (let i = 0; i < 50000; i++) {
      ctx.fillStyle = color2;
      ctx.globalAlpha = Math.random() * 0.15;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildMiningWorld(scene: THREE.Scene): WorldElements {
  const deposits: GemOreDeposit[] = [];
  const lightPoles: THREE.PointLight[] = [];
  const ladders: THREE.Group[] = [];
  const groundMeshes: THREE.Object3D[] = [];

  const rockTex = createProceduralTexture("stone", "#3a3835", "#1a1815");
  const dirtTex = createProceduralTexture("dirt", "#4a3b2c", "#2a1b0c");
  const grassTex = createProceduralTexture("grass", "#2d4a1d", "#1d2a0d");

  const materials = {
    rock: new THREE.MeshStandardMaterial({ map: rockTex, roughness: 0.85, metalness: 0.1, bumpMap: rockTex, bumpScale: 0.05 }),
    dirt: new THREE.MeshStandardMaterial({ map: dirtTex, roughness: 0.98 }),
    grass: new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.9 })
  };

  const pathSystem = new PathSystem(12345);
  const chunks = new Map<string, Chunk>();
  const noise = createNoise3D(mulberry32(67890));
  const mainGroup = new THREE.Group();
  scene.add(mainGroup);


  // Surface & Elevator (Preserved)
  const surfaceGroup = new THREE.Group();
  surfaceGroup.position.set(0, 0, 100);
  const surfaceGround = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), materials.grass);
  surfaceGround.rotation.x = -Math.PI / 2;
  surfaceGround.position.y = -0.05;
  surfaceGround.receiveShadow = true;
  surfaceGroup.add(surfaceGround);
  groundMeshes.push(surfaceGround);
  scene.add(surfaceGroup);

  // Railway Stations (Industrial Hubs)
  pathSystem.nodes.forEach((node, i) => {
    if (i % 8 === 0 && i > 0) { // Every ~120m
      const station = new THREE.Group();
      station.position.copy(node);
      
      // Platform
      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.5, 12),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 })
      );
      platform.position.y = -0.2;
      station.add(platform);
      
      // Support Pillars
      for (let j = 0; j < 4; j++) {
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 15, 8),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
        );
        pillar.position.set(j < 2 ? -5 : 5, 7.3, j % 2 === 0 ? -5 : 5);
        station.add(pillar);
      }
      
      // Lighting
      const light = new THREE.PointLight(0x38bdf8, 40, 30);
      light.position.y = 12;
      station.add(light);
      
      mainGroup.add(station);
    }
  });

  const elevatorGroup = new THREE.Group();
  elevatorGroup.position.set(0, 0, 2);
  const platformMesh = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.3, 5.2), new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.9, roughness: 0.3 }));
  platformMesh.position.y = 0.15;
  elevatorGroup.add(platformMesh);
  
  const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3.6, 0.1), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.3 }));
  leftDoor.position.set(-1.15, 2.0, 2.4);
  elevatorGroup.add(leftDoor);
  const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3.6, 0.1), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.3 }));
  rightDoor.position.set(1.15, 2.0, 2.4);
  elevatorGroup.add(rightDoor);
  
  scene.add(elevatorGroup);

  const updateWorld = (dt: number, playerPos?: THREE.Vector3) => {
    if (!playerPos) return;

    // Load chunks around player
    const px = Math.floor(playerPos.x / CHUNK_SIZE);
    const pz = Math.floor(playerPos.z / CHUNK_SIZE);

    for (let x = px - LOAD_DISTANCE; x <= px + LOAD_DISTANCE; x++) {
      for (let z = pz - LOAD_DISTANCE; z <= pz + LOAD_DISTANCE; z++) {
        const key = `${x},${z}`;
        if (!chunks.has(key)) {
          const chunk = new Chunk(x, z, scene, pathSystem, materials, noise, mainGroup);
          chunks.set(key, chunk);
          // Sync ground meshes
          chunk.groundMeshes.forEach(m => groundMeshes.push(m));
          // Sync deposits
          chunk.deposits.forEach(d => deposits.push(d));
          // Sync ladders
          chunk.ladders.forEach(l => ladders.push(l));
        }
      }
    }

    // Unload distant chunks
    for (const [key, chunk] of chunks.entries()) {
      const [cx, cz] = key.split(",").map(Number);
      if (Math.abs(cx - px) > LOAD_DISTANCE + 1 || Math.abs(cz - pz) > LOAD_DISTANCE + 1) {
        chunk.dispose(mainGroup);
        chunks.delete(key);
        // Remove from world tracking
        chunk.groundMeshes.forEach(m => {
          const idx = groundMeshes.indexOf(m);
          if (idx > -1) groundMeshes.splice(idx, 1);
        });
        chunk.deposits.forEach(d => {
          const idx = deposits.indexOf(d);
          if (idx > -1) deposits.splice(idx, 1);
        });
        chunk.ladders.forEach(l => {
          const idx = ladders.indexOf(l);
          if (idx > -1) ladders.splice(idx, 1);
        });
      }
    }
  };

  const disposeWorld = () => {
    chunks.forEach(c => c.dispose(mainGroup));
    rockTex.dispose();
    dirtTex.dispose();
    grassTex.dispose();
  };

  return {
    deposits,
    elevatorGroup,
    elevatorDoors: [leftDoor, rightDoor],
    elevatorPlatformY: 0.15,
    lightPoles,
    waterMesh: new THREE.Mesh(), 
    ladders,
    groundMeshes,
    updateWorld,
    disposeWorld,
    pathNodes: pathSystem.nodes,
    group: mainGroup
  };
}


