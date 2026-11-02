'use client';

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

type CaveMapProps = {
  pathNodes: THREE.Vector3[];
  playerPosition: THREE.Vector3;
  isOpen: boolean;
  onClose: () => void;
};

export default function CaveMap({ pathNodes, playerPosition, isOpen, onClose }: CaveMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    // Coordinate mapping
    // The cave is ~17km long. We need to find the bounds to fit it or center on player.
    // Let's center on player and show a ~500m radius.
    const scale = 0.5; // pixels per meter
    const centerX = width / 2;
    const centerY = height / 2;

    const toScreen = (v: THREE.Vector3) => ({
      x: centerX + (v.x - playerPosition.x) * scale,
      y: centerY + (v.z - playerPosition.z) * scale // Use Z as Y for 2D map
    });

    // Draw Path
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    pathNodes.forEach((node, i) => {
      const pos = toScreen(node);
      if (i === 0) ctx.moveTo(pos.x, pos.y);
      else ctx.lineTo(pos.x, pos.y);
    });
    ctx.stroke();

    // Draw Explored Nodes (Lighter color)
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    pathNodes.forEach((node, i) => {
      const dist = node.distanceTo(playerPosition);
      if (dist < 1000) { // Simple "explored" radius for demo
        const pos = toScreen(node);
        if (i === 0) ctx.moveTo(pos.x, pos.y);
        else ctx.lineTo(pos.x, pos.y);
      }
    });
    ctx.stroke();

    // Draw Player
    const pPos = toScreen(playerPosition);
    ctx.fillStyle = "#fbbf24";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#fbbf24";
    ctx.beginPath();
    ctx.arc(pPos.x, pPos.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Markers (Elevator at 0,0,2)
    const elevatorPos = toScreen(new THREE.Vector3(0, 0, 2));
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.rect(elevatorPos.x - 5, elevatorPos.y - 5, 10, 10);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("ELEVATOR", elevatorPos.x + 8, elevatorPos.y + 3);

  }, [isOpen, pathNodes, playerPosition]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 w-full max-w-4xl shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-black text-xl uppercase tracking-widest">Subterranean Navigation Map</h2>
          <button 
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            CLOSE
          </button>
        </div>
        
        <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
          <canvas 
            ref={canvasRef} 
            width={1200} 
            height={800} 
            className="w-full h-full object-contain"
          />
          <div className="absolute bottom-4 left-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <div className="w-3 h-3 bg-fbbf24 rounded-full shadow-[0_0_5px_#fbbf24]" />
              <span>YOU (MINER)</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <div className="w-3 h-3 bg-emerald-500" />
              <span>ELEVATOR HUB</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <div className="w-8 h-1 bg-sky-500" />
              <span>MAPPED TUNNELS</span>
            </div>
          </div>
        </div>

        <p className="text-slate-500 text-[10px] font-mono text-center uppercase tracking-widest">
          Transmitting live spatial data via deep-cave telemetry...
        </p>
      </div>
    </div>
  );
}
