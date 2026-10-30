/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CharacterId, DifficultyId, GameState, QuestionData } from './game/types';
import { DIFFICULTIES } from './game/charactersData';
import { selectQuestionForSector } from './game/questionsData';
import { sound } from './game/sound';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { GameCanvas } from './components/GameCanvas';
import { DialogueModal } from './components/DialogueModal';
import { QuestionModal } from './components/QuestionModal';
import { VictoryModal } from './components/VictoryModal';
import { CreditsScreen } from './components/CreditsScreen';
import { SpringBootModal } from './components/SpringBootModal';
import { TouchControls } from './components/TouchControls';
import { Play, RotateCcw, Home } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('title');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('gabriela');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyId>('medio');

  // Active HUD Metrics
  const [score, setScore] = useState(0);
  const [chipsCount, setChipsCount] = useState(0);
  const [remainingTime, setRemainingTime] = useState(120);
  const [currentSector, setCurrentSector] = useState(1);
  const [lastCheckpointSector, setLastCheckpointSector] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Active Checkpoint Question State
  const [activeCheckpointSector, setActiveCheckpointSector] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [usedQuestionIds, setUsedQuestionIds] = useState<number[]>([]);

  // Victory Metrics
  const [victoryStats, setVictoryStats] = useState({ score: 0, chips: 0, timeSpent: 0 });
  const [gameOverReason, setGameOverReason] = useState('El tiempo del sector expiró antes de alcanzar el objetivo de reciclaje.');

  // Spring Boot Code Modal
  const [isSpringBootModalOpen, setIsSpringBootModalOpen] = useState(false);
  const springBootPausedGameRef = useRef(false);

  // Mobile / Touch controls state
  const [touchInput, setTouchInput] = useState({ left: false, right: false, jump: false });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const autostartAppliedRef = useRef(false);

  const resetTouchInput = useCallback(() => {
    setTouchInput({ left: false, right: false, jump: false });
  }, []);

  // Detect Touch screen capability or mobile screen
  useEffect(() => {
    const checkTouch = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileWidth = window.innerWidth <= 768;
      setIsTouchDevice(hasTouch || isMobileWidth);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Update body data-state attribute
  useEffect(() => {
    document.body.dataset.state = gameState === 'credits' || gameState === 'victory' ? 'gameover' : gameState;
  }, [gameState]);

  // Support ?autostart=1 (only once, not every time difficulty changes)
  useEffect(() => {
    if (autostartAppliedRef.current || typeof window === 'undefined') return;
    autostartAppliedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const diff = DIFFICULTIES[selectedDifficulty];
      setRemainingTime(diff.timeSeconds);
      setScore(0);
      setChipsCount(0);
      setCurrentSector(1);
      setLastCheckpointSector(0);
      setUsedQuestionIds([]);
      setIsPaused(false);
      setGameState('playing');
    }
  }, [selectedDifficulty]);

  // Reset touch input whenever a modal or another screen opens.
  useEffect(() => {
    if (gameState !== 'playing') resetTouchInput();
  }, [gameState, resetTouchInput]);

  // Avoid losing a run when the tab/app goes to the background.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) return;
      resetTouchInput();
      if (gameState === 'playing') setIsPaused(true);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [gameState, resetTouchInput]);

  // Keyboard Pause (Escape or P) and Mute (M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore auto-repeat so holding the key does not toggle repeatedly.
      if (e.repeat) return;

      if (e.code === 'KeyM') {
        const muted = sound.toggleMute();
        setIsMuted(muted);
      } else if (
        (e.code === 'Escape' || e.code === 'KeyP') &&
        gameState === 'playing' &&
        !isSpringBootModalOpen
      ) {
        resetTouchInput();
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isSpringBootModalOpen, resetTouchInput]);

  // Start Game sequence: Opens opening dialogue quote
  const handleStartGame = useCallback(() => {
    const diff = DIFFICULTIES[selectedDifficulty];
    setRemainingTime(diff.timeSeconds);
    setScore(0);
    setChipsCount(0);
    setCurrentSector(1);
    setLastCheckpointSector(0);
    setUsedQuestionIds([]);
    setActiveCheckpointSector(null);
    setCurrentQuestion(null);
    setIsPaused(false);
    resetTouchInput();
    setIsSpringBootModalOpen(false);
    springBootPausedGameRef.current = false;
    setGameOverReason('El tiempo del sector expiró antes de alcanzar el objetivo de reciclaje.');
    setGameState('character_dialogue');
  }, [selectedDifficulty, resetTouchInput]);

  // Dismiss opening dialogue and enter active gameplay
  const handleStartPlaying = () => {
    setGameState('playing');
  };

  // Checkpoint Trigger from Canvas
  const handleTriggerCheckpoint = useCallback((sector: number) => {
    const q = selectQuestionForSector(selectedDifficulty, usedQuestionIds);
    setCurrentQuestion(q);
    setActiveCheckpointSector(sector);
    setUsedQuestionIds((prev) => [...prev, q.id]);
    setGameState('checkpoint_question');
  }, [selectedDifficulty, usedQuestionIds]);

  // Checkpoint Answer Correct
  const handleAnswerCorrect = () => {
    if (activeCheckpointSector !== null) {
      window.dispatchEvent(
        new CustomEvent('unlock_checkpoint', {
          detail: { sector: activeCheckpointSector },
        })
      );
      setLastCheckpointSector(activeCheckpointSector);
      setActiveCheckpointSector(null);
      setCurrentQuestion(null);
      setGameState('playing');
    }
  };

  // Checkpoint Answer Incorrect -> Return to the last saved checkpoint
  const handleAnswerWrong = () => {
    window.dispatchEvent(new CustomEvent('reset_to_checkpoint'));
    setActiveCheckpointSector(null);
    setCurrentQuestion(null);
    setGameState('playing');
  };

  // Victory Handler
  const handleVictory = useCallback((stats: { score: number; chips: number; timeSpent: number }) => {
    setVictoryStats(stats);
    setGameState('victory');
  }, []);

  // Game Over Handler
  const handleGameOver = useCallback((reason: string) => {
    setGameOverReason(reason);
    setGameState('gameover');
  }, []);

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleTogglePause = () => {
    if (gameState !== 'playing') return;
    resetTouchInput();
    setIsPaused((prev) => !prev);
  };

  // Opening the backend/code reference during a run must pause the game.
  const handleOpenSpringBootModal = () => {
    if (gameState === 'playing' && !isPaused) {
      springBootPausedGameRef.current = true;
      resetTouchInput();
      setIsPaused(true);
    } else {
      springBootPausedGameRef.current = false;
    }
    setIsSpringBootModalOpen(true);
  };

  const handleCloseSpringBootModal = () => {
    setIsSpringBootModalOpen(false);
    if (springBootPausedGameRef.current && gameState === 'playing') {
      setIsPaused(false);
    }
    springBootPausedGameRef.current = false;
  };

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-slate-950 font-sans-clean select-none">
      
      {/* Active 60fps Canvas (mounted when playing, checkpoint question, or victory) */}
      {(gameState === 'playing' || gameState === 'checkpoint_question' || gameState === 'victory' || gameState === 'gameover' || isPaused) && (
        <div className="absolute inset-0 z-0">
          <GameCanvas
            characterId={selectedCharacter}
            difficultyId={selectedDifficulty}
            isPaused={isPaused}
            initialTime={DIFFICULTIES[selectedDifficulty].timeSeconds}
            onUpdateHUD={({ score, chips, remainingTime, sector, lastCheckpoint }) => {
              setScore(score);
              setChipsCount(chips);
              setRemainingTime(remainingTime);
              setCurrentSector(sector);
              setLastCheckpointSector(lastCheckpoint);
            }}
            onTriggerCheckpoint={handleTriggerCheckpoint}
            onVictory={handleVictory}
            onGameOver={handleGameOver}
            touchInput={touchInput}
          />
        </div>
      )}

      {/* Retro HUD */}
      {(gameState === 'playing' || gameState === 'checkpoint_question' || isPaused) && (
        <HUD
          score={score}
          chipsCount={chipsCount}
          remainingTime={remainingTime}
          sectorId={currentSector}
          characterId={selectedCharacter}
          difficultyId={selectedDifficulty}
          isPaused={isPaused}
          isMuted={isMuted}
          lastCheckpointSector={lastCheckpointSector}
          onTogglePause={handleTogglePause}
          onToggleMute={handleToggleMute}
          onOpenSpringBootModal={handleOpenSpringBootModal}
        />
      )}

      {/* On-Screen Mobile Touch Controls for iPhone/Android/Tablets */}
      {(gameState === 'playing' || isPaused) && isTouchDevice && (
        <TouchControls
          onLeftPress={(pressed) => setTouchInput((t) => ({ ...t, left: pressed }))}
          onRightPress={(pressed) => setTouchInput((t) => ({ ...t, right: pressed }))}
          onJumpPress={(pressed) => setTouchInput((t) => ({ ...t, jump: pressed }))}
          onPauseClick={handleTogglePause}
        />
      )}

      {/* 1. Title Screen */}
      {gameState === 'title' && (
        <TitleScreen
          selectedCharacter={selectedCharacter}
          selectedDifficulty={selectedDifficulty}
          onSelectCharacter={setSelectedCharacter}
          onSelectDifficulty={setSelectedDifficulty}
          onStartGame={handleStartGame}
          onOpenSpringBootModal={handleOpenSpringBootModal}
          isInputBlocked={isSpringBootModalOpen}
        />
      )}

      {/* 2. Character Opening Dialogue Modal with exact quote */}
      {gameState === 'character_dialogue' && (
        <DialogueModal
          characterId={selectedCharacter}
          onDismiss={handleStartPlaying}
        />
      )}

      {/* 3. Checkpoint Question Modal with Question Bank */}
      {gameState === 'checkpoint_question' && currentQuestion && activeCheckpointSector && (
        <QuestionModal
          sector={activeCheckpointSector}
          question={currentQuestion}
          onAnswerCorrect={handleAnswerCorrect}
          onAnswerWrong={handleAnswerWrong}
        />
      )}

      {/* 4. Pause Modal */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-none select-none">
          <div className="w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto bg-slate-900 border-4 border-amber-400 rounded-2xl p-6 shadow-2xl text-center text-white">
            <h3 className="font-pixel text-xl text-amber-400 mb-2">JUEGO EN PAUSA</h3>
            <p className="text-xs text-slate-300 font-sans-clean mb-6">
              Sector {currentSector} · {DIFFICULTIES[selectedDifficulty].label}
            </p>

            <div className="space-y-3 font-pixel text-xs">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl border-2 border-emerald-300 font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play size={14} fill="currentColor" />
                <span>REANUDAR (P)</span>
              </button>

              <button
                onClick={handleStartGame}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-600 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} />
                <span>REINICIAR PARTIDA</span>
              </button>

              <button
                onClick={() => {
                  setIsPaused(false);
                  setGameState('title');
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-600 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Home size={14} />
                <span>MENÚ PRINCIPAL</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Victory Modal */}
      {gameState === 'victory' && (
        <VictoryModal
          score={victoryStats.score}
          chipsCount={victoryStats.chips}
          timeSpent={victoryStats.timeSpent}
          characterId={selectedCharacter}
          difficultyId={selectedDifficulty}
          onViewCredits={() => setGameState('credits')}
          onRestart={handleStartGame}
        />
      )}

      {/* 6. Scrolling Credits Screen */}
      {gameState === 'credits' && (
        <CreditsScreen onReturnToTitle={() => setGameState('title')} />
      )}

      {/* 7. Game Over Modal (Timeout) */}
      {gameState === 'gameover' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-none select-none animate-fadeIn">
          <div className="w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto bg-slate-900 border-4 border-rose-500 rounded-2xl p-6 shadow-2xl text-center text-white">
            <h3 className="font-pixel text-lg text-rose-400 mb-2">¡TIEMPO AGOTADO!</h3>
            <p className="text-xs text-slate-300 font-sans-clean mb-6">
              {gameOverReason} Vuelve a intentarlo desde el inicio de la partida.
            </p>

            <div className="space-y-3 font-pixel text-xs">
              <button
                data-start="true"
                onClick={handleStartGame}
                className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-slate-950 rounded-xl border-2 border-rose-300 font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} />
                <span>REINTENTAR NIVEL</span>
              </button>

              <button
                onClick={() => setGameState('title')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-600 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Home size={14} />
                <span>VOLVER AL MENÚ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Spring Boot Backend Architecture Modal */}
      <SpringBootModal
        isOpen={isSpringBootModalOpen}
        onClose={handleCloseSpringBootModal}
      />

    </div>
  );
}
