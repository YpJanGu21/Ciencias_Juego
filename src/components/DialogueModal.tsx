import React, { useEffect, useState } from 'react';
import { Play, MessageSquareQuote } from 'lucide-react';
import { CharacterId } from '../game/types';
import { CHARACTERS } from '../game/charactersData';
import { sound } from '../game/sound';

interface DialogueModalProps {
  characterId: CharacterId;
  onDismiss: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  characterId,
  onDismiss,
}) => {
  const character = CHARACTERS[characterId];
  const fullText = character.quote;
  const [displayedText, setDisplayedText] = useState('');
  const [isDone, setIsDone] = useState(false);

  // Typewriter effect
  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    setIsDone(false);

    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.slice(0, index + 1));
        index++;
      } else {
        setIsDone(true);
        clearInterval(interval);
      }
    }, 22);

    return () => clearInterval(interval);
  }, [fullText]);

  // Press Enter or Space to skip typewriter or start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || (e.code !== 'Enter' && e.code !== 'Space')) return;

      const target = e.target as HTMLElement | null;
      const isInteractive =
        !!target &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName));
      if (isInteractive) return;

      e.preventDefault();
      if (!isDone) {
        // Immediately finish typewriter
        setDisplayedText(fullText);
        setIsDone(true);
      } else {
        sound.playJump();
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDone, fullText, onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 select-none animate-fadeIn">
      <div className="w-full max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto bg-slate-900 border-4 border-amber-400 rounded-xl p-5 shadow-[0_12px_30px_rgba(0,0,0,0.85)] text-white">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-slate-700 pb-3 mb-4">
          <div className="flex items-center gap-2 text-amber-400 font-pixel text-xs sm:text-sm">
            <MessageSquareQuote size={18} />
            <span>MENSAJE DE CONCIENTIZACIÓN</span>
          </div>
          <span className="font-pixel text-[10px] text-slate-400">SECTOR 1-4</span>
        </div>

        {/* Character Portrait & Dialogue Body */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
          {/* Avatar Pixel Box */}
          <div className="shrink-0 flex flex-col items-center">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-4 border-white/80 flex items-center justify-center font-pixel text-3xl font-bold shadow-lg"
              style={{ backgroundColor: character.primaryColor }}
            >
              {character.name[0]}
            </div>
            <div className="font-pixel text-[11px] text-amber-300 mt-2 text-center">
              {character.name}
            </div>
            <div className="text-[10px] text-slate-400 font-sans-clean text-center max-w-[100px]">
              {character.role}
            </div>
          </div>

          {/* Dialogue Speech Bubble */}
          <div className="flex-1 bg-slate-950/90 border-2 border-slate-700 rounded-lg p-4 min-h-[110px] flex flex-col justify-between">
            <div className="font-sans-clean text-sm sm:text-base text-slate-100 leading-relaxed font-medium">
              "{displayedText}"
              {!isDone && <span className="inline-block w-2 h-4 bg-amber-400 ml-1 animate-pulse" />}
            </div>

            <div className="mt-3 text-[10px] text-emerald-400 font-pixel flex items-center justify-end gap-1">
              <span>♻ RETO E-WASTE</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <span className="text-[10px] text-slate-400 font-pixel">
            Presiona [ESPACIO] o haz clic para avanzar
          </span>

          <button
            onClick={() => {
              if (!isDone) {
                setDisplayedText(fullText);
                setIsDone(true);
              } else {
                sound.playJump();
                onDismiss();
              }
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-pixel text-xs rounded-lg border-2 border-emerald-300 shadow-[0_4px_0_#065f46] hover:translate-y-0.5 transition-all cursor-pointer font-bold flex items-center justify-center gap-2"
          >
            <Play size={14} fill="currentColor" />
            <span>{isDone ? '¡COMENZAR NIVEL!' : 'COMPLETAR TEXTO'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
