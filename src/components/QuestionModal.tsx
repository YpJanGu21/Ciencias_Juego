import React, { useCallback, useEffect, useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Sparkles, RotateCcw } from 'lucide-react';
import { QuestionData, QuestionOptionKey } from '../game/types';
import { checkQuestionAnswer } from '../game/questionsData';
import { sound } from '../game/sound';

interface QuestionModalProps {
  sector: number;
  question: QuestionData;
  onAnswerCorrect: () => void;
  onAnswerWrong: () => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  sector,
  question,
  onAnswerCorrect,
  onAnswerWrong,
}) => {
  const [selectedKey, setSelectedKey] = useState<QuestionOptionKey | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [explanation, setExplanation] = useState('');

  const handleSelectOption = useCallback(
    (key: QuestionOptionKey) => {
      if (isAnswered) return; // Prevent double clicking

      setSelectedKey(key);
      const result = checkQuestionAnswer(question.id, key);

      setIsAnswered(true);
      setIsCorrect(result.isCorrect);
      setExplanation(result.explanation);

      // Answer buttons are disabled after answering. Moving focus away lets
      // Enter trigger the continue / retry action instead of a dead button.
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.tagName === 'BUTTON') {
        active.blur();
      }

      if (result.isCorrect) {
        sound.playCorrect();
      } else {
        sound.playWrong();
      }
    },
    [isAnswered, question.id]
  );

  const handleContinue = useCallback(() => {
    if (!isCorrect) return;
    sound.playChipCollect();
    onAnswerCorrect();
  }, [isCorrect, onAnswerCorrect]);

  const handleWrongReturn = useCallback(() => {
    onAnswerWrong();
  }, [onAnswerWrong]);

  // Keyboard shortcuts: A/B/C or 1/2/3 to answer, Enter to continue.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if (isTyping) return;

      if (!isAnswered) {
        const keyMap: Record<string, QuestionOptionKey> = {
          KeyA: 'A',
          KeyB: 'B',
          KeyC: 'C',
          Digit1: 'A',
          Digit2: 'B',
          Digit3: 'C',
        };
        const optionKey = keyMap[event.code];
        if (optionKey) {
          event.preventDefault();
          handleSelectOption(optionKey);
        }
        return;
      }

      if (event.code === 'Enter') {
        // An enabled button handles Enter natively (avoids double activation).
        if (target instanceof HTMLButtonElement && !target.disabled) return;
        event.preventDefault();
        if (isCorrect) handleContinue();
        else handleWrongReturn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleContinue, handleSelectOption, handleWrongReturn, isAnswered, isCorrect]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-none select-none animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto bg-slate-900 border-4 border-cyan-400 rounded-2xl p-5 sm:p-6 shadow-[0_16px_40px_rgba(0,0,0,0.9)] text-white">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-700 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
              <HelpCircle size={16} />
            </div>
            <div>
              <span className="font-pixel text-xs sm:text-sm text-cyan-300">
                PUNTO DE CONTROL · SECTOR {sector}
              </span>
              <div className="text-[10px] text-slate-400 font-sans-clean">
                Responde correctamente para guardar tu progreso y desbloquear el paso.
              </div>
            </div>
          </div>

          <span className={`font-pixel text-[9px] px-2 py-0.5 rounded border ${
            question.difficulty === 'dificil'
              ? 'bg-rose-950 text-rose-300 border-rose-500'
              : question.difficulty === 'medio'
              ? 'bg-amber-950 text-amber-300 border-amber-500'
              : 'bg-emerald-950 text-emerald-300 border-emerald-500'
          }`}>
            Nivel: {question.difficulty === 'dificil' ? 'DIFÍCIL' : question.difficulty.toUpperCase()}
          </span>
        </div>

        {/* Question Text */}
        <div className="bg-slate-950/80 border-2 border-slate-800 rounded-xl p-4 mb-4">
          <div className="text-sm sm:text-base font-semibold text-slate-100 font-sans-clean leading-snug">
            {question.question}
          </div>
        </div>

        {/* Options List */}
        <div className="space-y-2.5 mb-5">
          {question.options.map((option) => {
            const isSelected = selectedKey === option.key;
            let btnStyle = 'border-slate-700 bg-slate-800/80 hover:border-slate-500 hover:bg-slate-800';

            if (isAnswered) {
              if (option.key === question.correctAnswer) {
                btnStyle = 'border-emerald-400 bg-emerald-950/80 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
              } else if (isSelected && !isCorrect) {
                btnStyle = 'border-rose-500 bg-rose-950/80 text-rose-200';
              }
            }

            return (
              <button
                key={option.key}
                onClick={() => handleSelectOption(option.key)}
                disabled={isAnswered}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all font-sans-clean text-xs sm:text-sm font-medium ${
                  isAnswered ? 'cursor-default' : 'cursor-pointer'
                } ${btnStyle}`}
              >
                <span className="w-7 h-7 shrink-0 rounded-md border-2 border-current flex items-center justify-center font-pixel text-xs font-bold">
                  {option.key}
                </span>
                <span className="flex-1">{option.text}</span>
                {isAnswered && option.key === question.correctAnswer && (
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle size={18} className="text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback & Explanation Box */}
        {isAnswered && (
          <div className={`p-3.5 rounded-xl border-2 mb-4 animate-fadeIn ${
            isCorrect
              ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-100'
              : 'bg-rose-950/70 border-rose-500/80 text-rose-100'
          }`}>
            <div className="flex items-center gap-2 font-pixel text-xs mb-1">
              {isCorrect ? (
                <>
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span className="text-emerald-300">¡RESPUESTA CORRECTA! CHECKPOINT GUARDADO</span>
                </>
              ) : (
                <>
                  <XCircle size={16} className="text-rose-400" />
                  <span className="text-rose-300">¡RESPUESTA INCORRECTA! PENALIZACIÓN</span>
                </>
              )}
            </div>
            <p className="text-xs sm:text-sm font-sans-clean leading-relaxed text-slate-200">
              {explanation}
            </p>
            {!isCorrect && (
              <p className="text-[11px] text-rose-300 font-pixel mt-2">
                Retrocedes al último checkpoint y se restablece el tiempo del sector.
              </p>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-pixel">
            <Sparkles size={12} className="text-yellow-400" />
            <span>Basura Electrónica (E-Waste)</span>
          </div>

          {isCorrect && (
            <button
              onClick={handleContinue}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-pixel text-xs rounded-lg border-2 border-emerald-300 shadow-[0_4px_0_#065f46] hover:translate-y-0.5 transition-all cursor-pointer font-bold flex items-center gap-2"
            >
              <span>{sector >= 4 ? 'IR A LA ESCALERA FINAL' : `CONTINUAR AL SECTOR ${sector + 1}`}</span>
              <ArrowRight size={14} />
            </button>
          )}

          {isAnswered && !isCorrect && (
            <button
              onClick={handleWrongReturn}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-pixel text-xs rounded-lg border-2 border-rose-400 shadow-[0_4px_0_#881337] hover:translate-y-0.5 transition-all cursor-pointer font-bold flex items-center gap-2"
            >
              <RotateCcw size={14} />
              <span>VOLVER AL CHECKPOINT</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
