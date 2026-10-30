import React, { useEffect } from 'react';
import { Play, Sparkles, BookOpen, Clock, ShieldAlert } from 'lucide-react';
import { CharacterId, DifficultyId } from '../game/types';
import { CHARACTERS, DIFFICULTIES } from '../game/charactersData';
import { sound } from '../game/sound';

interface TitleScreenProps {
  selectedCharacter: CharacterId;
  selectedDifficulty: DifficultyId;
  onSelectCharacter: (id: CharacterId) => void;
  onSelectDifficulty: (id: DifficultyId) => void;
  onStartGame: () => void;
  onOpenSpringBootModal: () => void;
  /** Blocks the global start shortcuts while another modal is open. */
  isInputBlocked?: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedCharacter,
  selectedDifficulty,
  onSelectCharacter,
  onSelectDifficulty,
  onStartGame,
  onOpenSpringBootModal,
  isInputBlocked = false,
}) => {
  // Listen for Enter / Space to start from the title.
  useEffect(() => {
    if (isInputBlocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || (e.code !== 'Enter' && e.code !== 'Space')) return;

      const target = e.target as HTMLElement | null;
      const isInteractive =
        !!target &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName));
      if (isInteractive) return;

      e.preventDefault();
      sound.playChipCollect();
      onStartGame();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame, isInputBlocked]);

  const activeChar = CHARACTERS[selectedCharacter];

  return (
    <div className="relative h-dvh w-full flex flex-col justify-between items-center px-4 py-6 bg-gradient-to-b from-sky-900 via-slate-900 to-slate-950 text-white select-none overflow-y-auto">
      
      {/* Top Floating Badge */}
      <div className="w-full max-w-4xl flex justify-between items-center z-10 pt-2">
        <div className="flex items-center gap-2 bg-slate-900/90 border border-emerald-500/40 px-3 py-1 rounded text-emerald-400 font-pixel text-[10px]">
          <Sparkles size={12} />
          <span>PROYECTO EDUCATIVO E-WASTE</span>
        </div>

        <button
          onClick={onOpenSpringBootModal}
          className="flex items-center gap-1.5 bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-500/50 px-3 py-1.5 rounded text-indigo-300 font-pixel text-[10px] transition-all cursor-pointer shadow-lg hover:border-indigo-400"
        >
          <BookOpen size={13} className="text-indigo-400" />
          <span>ARQUITECTURA SPRING BOOT</span>
        </button>
      </div>

      {/* Hero Title Section with Bespoke Retro Inline SVG Logo */}
      <div className="flex flex-col items-center text-center my-4 z-10 max-w-3xl">
        <div className="relative mb-2">
          {/* Bespoke 8-bit NES Styled Title Lockup */}
          <svg viewBox="0 0 680 120" className="w-full max-w-xl h-auto drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
            <defs>
              <linearGradient id="marioGold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="ecoCyan" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#0891b2" />
              </linearGradient>
            </defs>
            {/* Outline Glow */}
            <text x="340" y="48" textAnchor="middle" fill="#000" stroke="#000" strokeWidth="8" fontFamily="'Press Start 2P', monospace" fontSize="30">
              SUPER ECO BROS
            </text>
            <text x="340" y="48" textAnchor="middle" fill="url(#marioGold)" fontFamily="'Press Start 2P', monospace" fontSize="30">
              SUPER ECO BROS
            </text>
            <text x="340" y="96" textAnchor="middle" fill="#000" stroke="#000" strokeWidth="6" fontFamily="'Press Start 2P', monospace" fontSize="22">
              RETO: TELÉFONOS DESECHABLES
            </text>
            <text x="340" y="96" textAnchor="middle" fill="url(#ecoCyan)" fontFamily="'Press Start 2P', monospace" fontSize="22">
              RETO: TELÉFONOS DESECHABLES
            </text>
          </svg>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 font-sans-clean max-w-lg mt-1">
          Plataformas retro 2D. Supera obstáculos de basura electrónica, responde preguntas científicas en los checkpoints y alcanza la bandera de reciclaje.
        </p>
      </div>

      {/* Main Selection Hub */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 my-2 z-10">
        
        {/* 1. Character Selector */}
        <div className="bg-slate-900/90 border-2 border-slate-700/80 rounded-xl p-4 shadow-xl backdrop-blur-none">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <span className="font-pixel text-xs text-amber-400">1. ELIGE TU PERSONAJE</span>
            <span className="text-[10px] text-slate-400 font-sans-clean">5 Héroes Disponibles</span>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-4">
            {(Object.keys(CHARACTERS) as CharacterId[]).map((charId) => {
              const char = CHARACTERS[charId];
              const isSelected = selectedCharacter === charId;
              return (
                <button
                  key={charId}
                  onClick={() => {
                    sound.playJump();
                    onSelectCharacter(charId);
                  }}
                  className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/20 shadow-lg scale-105'
                      : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-md border border-white/50 flex items-center justify-center font-pixel text-sm font-bold shadow-inner"
                    style={{ backgroundColor: char.primaryColor }}
                  >
                    {char.name[0]}
                  </div>
                  <span className="font-pixel text-[9px] mt-1.5 truncate max-w-full">
                    {char.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Character Details & Eco-Quote Preview */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-pixel text-xs text-emerald-400">{activeChar.name}</span>
              <span className="text-[11px] text-slate-400">· {activeChar.role}</span>
            </div>
            <p className="text-xs text-slate-300 font-sans-clean leading-relaxed italic border-l-2 border-amber-400/80 pl-2">
              "{activeChar.quote}"
            </p>
          </div>
        </div>

        {/* 2. Difficulty Selector */}
        <div className="bg-slate-900/90 border-2 border-slate-700/80 rounded-xl p-4 shadow-xl backdrop-blur-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="font-pixel text-xs text-amber-400">2. SELECCIONA DIFICULTAD</span>
              <span className="text-[10px] text-slate-400 font-sans-clean">Tiempo por sector</span>
            </div>

            <div className="space-y-2.5">
              {(Object.keys(DIFFICULTIES) as DifficultyId[]).map((diffId) => {
                const diff = DIFFICULTIES[diffId];
                const isSelected = selectedDifficulty === diffId;
                return (
                  <button
                    key={diffId}
                    onClick={() => {
                      sound.playBlockBump();
                      onSelectDifficulty(diffId);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-md'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock size={16} className={isSelected ? 'text-cyan-400' : 'text-slate-400'} />
                      <div>
                        <div className="font-pixel text-xs flex items-center gap-2">
                          <span className={isSelected ? 'text-cyan-300' : 'text-white'}>{diff.label}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${diff.badgeColor}`}>
                            {diff.timeLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans-clean mt-0.5">
                          {diff.description}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="font-pixel text-xs text-cyan-400 mr-1">▶</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800">
            <ShieldAlert size={14} className="text-amber-400 shrink-0" />
            <span>El reloj se reinicia al superar cada checkpoint. En "Difícil" se priorizan las preguntas más complejas.</span>
          </div>
        </div>

      </div>

      {/* Primary Start CTA Button */}
      <div className="flex flex-col items-center gap-3 my-2 z-10 w-full max-w-sm">
        <button
          data-start="true"
          onClick={() => {
            sound.playChipCollect();
            onStartGame();
          }}
          className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-pixel text-sm sm:text-base rounded-xl border-4 border-emerald-300 shadow-[0_6px_0_#065f46] hover:shadow-[0_3px_0_#065f46] hover:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-3 font-bold"
        >
          <Play fill="currentColor" size={18} />
          <span>¡INICIAR PARTIDA!</span>
        </button>
        <span className="text-[10px] text-slate-400 font-pixel tracking-wider">
          O presiona [ESPACIO] / [ENTER]
        </span>
      </div>

      {/* Flat Control Hints Footer Safe Margin */}
      <div className="w-full text-center text-[10px] sm:text-xs text-slate-400 font-pixel py-2 border-t border-slate-800/80 z-10">
        WASD / FLECHAS Mover · ESPACIO Saltar · ESC / P Pausa · M Silenciar
      </div>

    </div>
  );
};
