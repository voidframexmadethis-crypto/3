'use client';

import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Youtube, Copy, Check, Download, Video, ShieldCheck } from "lucide-react";

type PublishingKitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  gameUrl: string;
};

export default function PublishingKitModal({ isOpen, onClose, gameUrl }: PublishingKitModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadAccessFile = () => {
    const content = `========================================
MINING EMPIRE 3D — OFFICIAL ACCESS GUIDE
========================================

Thank you for playing Mining Empire 3D!

PLAYABLE GAME URL:
${gameUrl || "https://ais-pre-2wm77uuo7qsroc4n4xhpem-535063907055.us-west2.run.app"}

PLAYER INSTRUCTIONS:
1. Click the link above to launch Mining Empire 3D instantly in any modern web browser.
2. Your game progress, cash, upgrades, workers, and factory machinery automatically save securely in your browser's local storage.
3. Enjoy hyper-speed elevator mining (35 m/s), voxel ore deposits, jewelry manufacturing, and corporate management!

Support Contact: support@miningempiregame.com
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Mining_Empire_3D_Access_Guide.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-2xl w-full bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Youtube className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Publishing & Launch Kit</h2>
              <p className="text-xs text-emerald-400 font-mono">
                YouTube Promo & Game Access Kit
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* SECTION 1: YouTube Promotional Video Kit */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Video className="w-4 h-4" />
              <span>YouTube Promotional Video Preparation</span>
            </h3>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
              {/* Designated Footage Area */}
              <div className="w-full h-36 rounded-lg bg-slate-950 border-2 border-dashed border-emerald-500/40 flex flex-col items-center justify-center p-4 text-center">
                <Youtube className="w-10 h-10 text-red-500 mb-1" />
                <span className="text-xs font-semibold text-slate-200">Owner Supplied Gameplay Footage Area</span>
                <span className="text-[10px] text-slate-400 mt-1 max-w-sm">
                  Ready to embed recorded trailer footage, elevator descent (35 m/s), voxel mining, and factory automation.
                </span>
              </div>

              {/* Title & Description Draft */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Suggested Video Title</span>
                  <button
                    onClick={() => handleCopy("yt_title", "Deep Gem Mine 3D — Official Gameplay Trailer | 185M Voxel Ore & Factory Tycoon")}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    {copiedId === "yt_title" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === "yt_title" ? "Copied!" : "Copy Title"}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 border border-slate-800">
                  Deep Gem Mine 3D — Official Gameplay Trailer | 185M Voxel Ore & Factory Tycoon
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Suggested Video Description</span>
                  <button
                    onClick={() => handleCopy("yt_desc", "Play Deep Gem Mine 3D now: https://ais-pre-2wm77uuo7qsroc4n4xhpem-535063907055.us-west2.run.app\n\nExperience hyper-speed elevator mining (35 m/s), 185 million voxel crystal deposits, automated factory production lines, jewelry manufacturing, and corporate management!")}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    {copiedId === "yt_desc" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === "yt_desc" ? "Copied!" : "Copy Description"}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 border border-slate-800 leading-relaxed">
                  Play Deep Gem Mine 3D now: https://ais-pre-2wm77uuo7qsroc4n4xhpem-535063907055.us-west2.run.app<br/><br/>
                  Experience hyper-speed elevator mining (35 m/s), 185 million voxel crystal deposits, automated factory production lines, jewelry manufacturing, and corporate management!
                </div>
              </div>

              {/* Suggested Recording Scenes */}
              <div className="text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300">Recommended Gameplay Scenes to Record:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400">
                  <li>Surface flyover showing Headquarters, Factory, and Jewelry Boutique.</li>
                  <li>High-speed elevator plunge down to the 100ft+ underground caves at 35 m/s.</li>
                  <li>Minecraft-style voxel block mining with crystal drill shattering effects.</li>
                  <li>Factory conveyor dumping raw ore into crushers and sorters.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* SECTION 2: Game Access Kit */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Game Access & Distribution Guide</span>
            </h3>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Downloadable Access Delivery File</span>
                  <span className="text-[11px] text-slate-400">Provides players with permanent game URL and instructions.</span>
                </div>
                <button
                  onClick={handleDownloadAccessFile}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .txt Guide</span>
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Permanent Game Access URL</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={gameUrl || "https://ais-pre-2wm77uuo7qsroc4n4xhpem-535063907055.us-west2.run.app"}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400"
                  />
                  <button
                    onClick={() => handleCopy("game_url", gameUrl || "https://ais-pre-2wm77uuo7qsroc4n4xhpem-535063907055.us-west2.run.app")}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {copiedId === "game_url" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Ready for YouTube & Web Deployment</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 text-sm cursor-pointer"
          >
            Close Kit
          </button>
        </div>

      </motion.div>
    </div>
  );
}
