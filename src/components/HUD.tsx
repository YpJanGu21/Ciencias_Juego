import React from 'react';
import { Volume2, VolumeX, Pause, Play, Server, BookmarkCheck } from 'lucide-react';
import { CharacterId, DifficultyId } from '../game/types';
import { CHARACTERS, DIFFICULTIES } from '../game/charactersData';
import { formatTimer } from '../game/physics';

interface HUDProps {
  score: number;
  chipsCount: number;
  remainingTime: number;
  sectorId: number;
  characterId: CharacterId;
  difficultyId: DifficultyId;
  isPaused: boolean;
  isMuted: boolean;
  lastCheckpointSector: number;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onOpenSpringBootModal: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  chipsCount,
  remainingTime,
  sectorId,
  characterId,
  difficultyId,
  isPaused,
  isMuted,
  lastCheckpointSector,
  onTogglePause,
  onToggleMute,
  onOpenSpringBootModal,
}) => {
  const character = CHARACTERS[characterId];
  const difficulty = DIFFICULTIES[difficultyId];
  const isTimeCritical = remainingTime <= 15;

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none p-2 sm:p-4 select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 bg-slate-950/85 border-b-2 sm:border-2 border-amber-500/60 rounded-lg px-3 py-2 text-white shadow-xl">
        
        {/* Left: Player & Sector info */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2">
            <div 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded border-2 border-white/60 flex items-center justify-center font-pixel text-xs shadow-inner"
              style={{ backgroundColor: character.primaryColor }}
            >
              {character.name[0]}
            </div>
            <div>
              <div className="font-pixel text-[10px] sm:text-xs text-amber-400 tracking-wider">
                {character.name.toUpperCase()}
              </div>
              <div className="text-[9px] sm:text-[11px] text-slate-300 font-sans-clean hidden sm:block">
                {character.role}
              </div>
            </div>
          </div>

          <div className="border-l border-slate-700 h-6 hidden sm:block" />

          {/* Sector Display */}
          <div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-pixel">SECTOR</div>
            <div className="font-pixel text-xs sm:text-sm text-cyan-400">
              {sectorId} / 4
            </div>
          </div>

          {/* Checkpoint indicator */}
          {lastCheckpointSector > 0 && (
            <div className="hidden md:flex items-center gap-1 text-emerald-400 text-[10px] font-pixel bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
              <BookmarkCheck size={12} />
              <span>CP: S{lastCheckpointSector}</span>
            </div>
          )}
        </div>

        {/* Center: Score & Collectibles */}
        <div className="flex items-center gap-4 sm:gap-8 font-pixel text-xs sm:text-sm">
          {/* Teléfonos / E-Waste Recolectados */}
          <div className="flex items-center gap-1.5 text-emerald-400" title="Teléfonos desechables y componentes recuperados">
            <span className="text-sm">📱</span>
            <span className="tabular-nums">x{chipsCount.toString().padStart(2, '0')}</span>
          </div>

          {/* Score */}
          <div className="hidden sm:block">
            <div className="text-[9px] text-slate-400 font-pixel">PUNTOS</div>
            <div className="text-yellow-400 tabular-nums">
              {score.toString().padStart(6, '0')}
            </div>
          </div>

          {/* Timer */}
          <div>
            <div className="text-[9px] text-slate-400 font-pixel flex items-center justify-between gap-1">
              <span>TIEMPO</span>
              <span className="text-[8px] text-slate-400 lowercase hidden sm:inline">({difficulty.label})</span>
            </div>
            <div 
              className={`tabular-nums font-bold text-xs sm:text-base ${
                isTimeCritical ? 'text-rose-500 animate-pulse' : 'text-white'
              }`}
            >
              {formatTimer(remainingTime)}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Spring Boot Code Reference CTA */}
          <button
            onClick={onOpenSpringBootModal}
            className="flex items-center gap-1 px-2 py-1 bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-400/50 rounded text-[9px] sm:text-[11px] font-pixel text-indigo-200 transition-colors shadow-sm"
            title="Ver arquitectura Java Spring Boot"
          >
            <Server size={13} className="text-indigo-400" />
            <span className="hidden sm:inline">Backend</span> Spring Boot
          </button>

          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-300 transition-colors"
            title={isMuted ? 'Activar sonido (M)' : 'Silenciar sonido (M)'}
            aria-label="Alternar sonido"
          >
            {isMuted ? <VolumeX size={15} className="text-rose-400" /> : <Volume2 size={15} className="text-emerald-400" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onTogglePause}
            className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-300 transition-colors"
            title={isPaused ? 'Reanudar juego (P o Esc)' : 'Pausar juego (P o Esc)'}
            aria-label="Pausar juego"
          >
            {isPaused ? <Play size={15} className="text-amber-400" /> : <Pause size={15} />}
          </button>
        </div>

      </div>
    </header>
  );
};
