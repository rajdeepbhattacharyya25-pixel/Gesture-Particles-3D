import React from 'react';
import { HandData, ParticleTemplate } from '../types';
import { THEMES } from '../constants';
import { Hand, Box, Heart, Circle, Layers, Palette } from 'lucide-react';
import clsx from 'clsx';

interface UIProps {
  currentTemplate: ParticleTemplate;
  setTemplate: (t: ParticleTemplate) => void;
  handData: HandData;
  themeIndex: number;
  setThemeIndex: (i: number) => void;
  cameraReady: boolean;
}

export const UI: React.FC<UIProps> = ({ 
  currentTemplate, 
  setTemplate, 
  handData, 
  themeIndex, 
  setThemeIndex,
  cameraReady 
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tighter drop-shadow-lg">
            AETHER<span className="text-blue-400">.particles</span>
          </h1>
          <p className="text-blue-200/60 text-sm">
            {cameraReady ? 'Camera Active' : 'Initializing Camera...'}
          </p>
        </div>
        
        {/* Status HUD */}
        <div className="flex gap-2">
          <div className={clsx(
            "px-3 py-1 rounded-full text-xs font-mono transition-colors border",
            handData.present 
              ? "bg-green-500/20 border-green-500/50 text-green-300" 
              : "bg-red-500/10 border-red-500/30 text-red-300"
          )}>
            <div className="flex items-center gap-2">
              <Hand size={14} />
              {handData.present ? "TRACKING" : "NO HAND"}
            </div>
          </div>
          
          <div className={clsx(
            "px-3 py-1 rounded-full text-xs font-mono transition-colors border",
            handData.isPinching
              ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
              : "bg-gray-500/10 border-gray-500/30 text-gray-400"
          )}>
            {handData.isPinching ? "PINCH: ON" : "PINCH: OFF"}
          </div>
        </div>
      </div>

      {/* Controls (Bottom) */}
      <div className="flex flex-col gap-4 pointer-events-auto max-w-md">
        
        {/* Shape Selectors */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-2 border border-white/10 flex gap-2 w-fit">
          <ControlButton 
            active={currentTemplate === 'sphere'} 
            onClick={() => setTemplate('sphere')} 
            icon={<Circle size={18} />}
            label="Sphere"
          />
          <ControlButton 
            active={currentTemplate === 'cube'} 
            onClick={() => setTemplate('cube')} 
            icon={<Box size={18} />}
            label="Cube"
          />
          <ControlButton 
            active={currentTemplate === 'heart'} 
            onClick={() => setTemplate('heart')} 
            icon={<Heart size={18} />}
            label="Heart"
          />
          <ControlButton 
            active={currentTemplate === 'ring'} 
            onClick={() => setTemplate('ring')} 
            icon={<Layers size={18} />}
            label="Ring"
          />
        </div>

        {/* Theme Selectors */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex flex-col gap-2 w-fit">
            <div className="flex items-center gap-2 text-white/50 text-xs uppercase font-bold tracking-widest mb-1">
                <Palette size={12} /> Theme
            </div>
            <div className="flex gap-2">
                {THEMES.map((theme, i) => (
                    <button
                        key={theme.name}
                        onClick={() => setThemeIndex(i)}
                        className={clsx(
                            "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                            themeIndex === i ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "border-transparent opacity-50 hover:opacity-100"
                        )}
                        style={{
                            background: `linear-gradient(135deg, rgb(${theme.colorA.x*255},${theme.colorA.y*255},${theme.colorA.z*255}), rgb(${theme.colorB.x*255},${theme.colorB.y*255},${theme.colorB.z*255}))`
                        }}
                        title={theme.name}
                    />
                ))}
            </div>
        </div>

        {/* Instructions */}
        <div className="text-white/40 text-xs font-mono bg-black/20 p-2 rounded backdrop-blur-sm w-fit">
           <p>☝️ Point to Attract • 👌 Pinch to Collapse</p>
        </div>
      </div>
    </div>
  );
};

const ControlButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={clsx(
      "flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-white/10 text-white shadow-lg border border-white/20" 
        : "text-white/40 hover:bg-white/5 hover:text-white"
    )}
  >
    <div className={clsx("mb-1 transition-transform group-hover:scale-110", active && "scale-110 text-blue-400")}>
      {icon}
    </div>
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);
