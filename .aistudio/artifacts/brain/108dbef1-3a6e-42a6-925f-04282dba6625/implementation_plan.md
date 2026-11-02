# Mining Empire: Ultimate Expansion - Implementation Plan

Turn Mining Empire into a high-fidelity underground adventure with realistic physics, a functional industrial railway, and a massive 10.8-mile cave ecosystem. This plan outlines the technical strategy for all 19 requested features while preserving the existing core gameplay.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user and are integrated into the architecture:
> - **Headlamp**: Physically accurate Three.js units with high-power shadows and a measured 400-meter range.
> - **Railway**: Player-controllable locomotive with manual speed and track switching.
> - **Swimming**: Fully immersive swimming physics with buoyancy and oxygen logic.
> - **Cloud Sync**: Persistent Cloud sync via Firebase Firestore with local fallback.

## 1. Overview & Core Concept

Mining Empire will evolve from a simple clicker/miner into a **spatial exploration simulator**. The core value shifts from simple "number go up" to "world mastery" through exploration, technical logistics (railways), and industrial advancement.

## 2. User Experience & Visual Design

- **Atmospheric Depth**: The cave will use "Minecraft-style" visibility—naturally dark but with a low-intensity global ambient floor and subtle luminous moss to ensure geometry is never pitch black.
- **Physical Immersion**:
    - **Climbing**: Approaching a ladder triggers a physical grab; the camera bobs with the climb.
    - **Swimming**: Entering water shifts the camera to an underwater overlay (blue tint, distorted ripples) and enables 3D swimming.
- **Industrial Scale**: The 400m headlamp will slice through the darkness, illuminating distant cliff faces and ravine floors, making the procedural world feel truly vast.

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Procedural Railway Splines**
    - *Chosen Approach*: Track segments will be generated as CatmullRom splines that follow the `PathSystem` nodes.
    - *Why*: Ensures the railway connects all major chambers and elevators naturally.
- **Decision 2: Distance-Based Lighting Optimization**
    - *Chosen Approach*: The 400m headlamp will use a tight shadow frustum that "slides" its target based on look-at distance, maintaining shadow detail even at long range.
- **Decision 3: Firebase Data Strategy**
    - *Chosen Approach*: Store a `playerProfile` document in Firestore containing the existing `GameSaveData` structure.
    - *Why*: Reliable persistence across devices and simplified sync logic.

## 4. Technical Architecture & Data Strategy

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                       DeepMiningApp (page.tsx)              │
│  ┌───────────────────────┬───────────────────────────────┐  │
│  │    World Systems      │        Player Systems         │  │
│  │ ┌─────────────────┐   │ ┌───────────────────────────┐ │  │
│  │ │ CaveBuilder     │   │ │ CharacterController       │ │  │
│  │ │ - Ravines/Water │   │ │ - Walk/Climb/Swim/Drive   │ │  │
│  │ └─────────────────┘   │ └───────────────────────────┘ │  │
│  │ ┌─────────────────┐   │ ┌───────────────────────────┐ │  │
│  │ │ RailwaySystem   │   │ │ HeadlampController        │ │  │
│  │ │ - Spline Logic  │   │ │ - 400m SpotLight          │ │  │
│  │ └─────────────────┘   │ └───────────────────────────┘ │  │
│  └───────────────────────┴───────────────┬───────────────┘  │
│           │                              │                  │
│  ┌────────▼────────┐            ┌────────▼────────┐         │
│  │ Firebase Sync   │            │   Map System    │         │
│  │ (Firestore)     │            │   (2D Overlay)  │         │
│  └─────────────────┘            └─────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Feature Implementation Matrix

| ID | Feature | Technical Strategy |
| :--- | :--- | :--- |
| 1-4 | **Enormous Ravines & Waterfalls** | Update `Chunk` generation to include `ShapeGeometry` for ravines and `Water` shader planes. |
| 2-3 | **Climbing & Physics** | Add `State: "climbing" | "swimming" | "driving"` to the main loop. Use `capsule` raycasting for ladder detection. |
| 5-7 | **Wall Gems & Hidden Chambers** | Update `GemOreDeposit` to support vertical orientations. Add "Secret" node types to `PathSystem`. |
| 8-9 | **Railway & Elevators** | Create `lib/railway.ts` using `CatmullRomCurve3`. Add a `SurfaceElevator` building at Z: 100. |
| 10-12 | **Equipment & Manufacturing** | Expand `MiningHUD` with a "Blueprints" tab. Add `ManufactureLine` to `jewelry-factory.ts`. |
| 13-15 | **Living Ecosystem & Events** | Procedural moss (`Points` with green tint). Logic-driven "Cave-In" events triggered by mining rare veins. |
| 16 | **Map System** | Canvas-based overlay reading `PathSystem.nodes` and current explored chunk keys. |
| 17-18 | **Expansive Surface & Expeditions** | Add dedicated "Expedition" chunks with hardcoded unique layouts (e.g. The Crystal Cathedral). |
| 19 | **400m Headlamp** | `SpotLight(color, intensity, 400, angle, penumbra, decay)`. |

### Data Model (Firestore)

- **Collection: `users`**
    - `id` (auth.uid)
    - `saveData`: (Existing `GameSaveData` fields)
    - `explorationProgress`: `string[]` (Visited chunk keys)
    - `achievements`: `string[]`

## 5. Execution Stages

1.  **Stage 1: Technical Core**: Implement Firebase Auth/Firestore and the basic `State` machine for climbing/swimming.
2.  **Stage 2: Lighting & Visibility**: Build the 400m Headlamp and Minecraft ambient system.
3.  **Stage 3: World Expansion**: Ravines, Waterfalls, Wall Gems, and Ladders.
4.  **Stage 4: Infrastructure**: Railway System and Elevator Network.
5.  **Stage 5: Industrial Mastery**: Advanced Drills, Full Jewelry Manufacturing, and Map System.
6.  **Stage 6: Polish & Testing**: Ecosystem details, events, and performance optimization.
