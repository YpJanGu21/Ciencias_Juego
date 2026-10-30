import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Sparkles, Award, Film, RotateCcw } from 'lucide-react';
import { CharacterId, DifficultyId } from '../game/types';
import { CHARACTERS, DIFFICULTIES } from '../game/charactersData';
import { formatTimer } from '../game/physics';
import { sound } from '../game/sound';

interface VictoryModalProps {
  score: number;
  chipsCount: number;
  timeSpent: number;
  characterId: CharacterId;
  difficultyId: DifficultyId;
  onViewCredits: () => void;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  score,
  chipsCount,
  timeSpent,
  characterId,
  difficultyId,
  onViewCredits,
  onRestart,
}) => {
  const character = CHARACTERS[characterId];
  const difficulty = DIFFICULTIES[difficultyId];

  useEffect(() => {
    // Launch celebratory confetti bursts
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    const timer = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-none select-none animate-fadeIn">
      <div className="w-full max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto bg-slate-900 border-4 border-emerald-400 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-white text-center">
        
        {/* Victory Icon and Header */}
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
          <Trophy size={32} />
        </div>

        <h2 className="font-pixel text-xl sm:text-2xl text-emerald-400 mb-1">
          ¡BANDERA CONQUISTADA!
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 font-sans-clean mb-6">
          Has completado los 4 sectores y bajado la bandera de reciclaje con éxito.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] text-slate-400 font-pixel">TIEMPO</div>
            <div className="font-pixel text-sm text-cyan-400 mt-1 tabular-nums">
              {formatTimer(timeSpent)}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] text-slate-400 font-pixel">TELÉFONOS</div>
            <div className="font-pixel text-sm text-yellow-400 mt-1 tabular-nums">
              📱 x{chipsCount}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] text-slate-400 font-pixel">PUNTAJE</div>
            <div className="font-pixel text-sm text-emerald-400 mt-1 tabular-nums">
              {score}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] text-slate-400 font-pixel">DIFICULTAD</div>
            <div className="font-pixel text-xs text-amber-400 mt-1 truncate">
              {difficulty.label}
            </div>
          </div>
        </div>

        {/* Hero Character Recognition */}
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 mb-6 flex items-center justify-center gap-3">
          <Award size={20} className="text-yellow-400 shrink-0" />
          <span className="text-xs text-emerald-200 font-sans-clean">
            Héroe Ecológico: <strong>{character.name}</strong> ({character.role})
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              sound.playJump();
              onViewCredits();
            }}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-pixel text-xs rounded-xl border-2 border-yellow-300 shadow-[0_4px_0_#78350f] hover:translate-y-0.5 transition-all cursor-pointer font-bold flex items-center justify-center gap-2"
          >
            <Film size={15} />
            <span>VER CRÉDITOS & FUENTES</span>
          </button>

          <button
            data-start="true"
            onClick={() => {
              sound.playChipCollect();
              onRestart();
            }}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-pixel text-xs rounded-xl border-2 border-slate-600 hover:border-slate-500 shadow-[0_4px_0_#1e293b] hover:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw size={15} />
            <span>JUGAR DE NUEVO</span>
          </button>
        </div>

      </div>
    </div>
  );
};
