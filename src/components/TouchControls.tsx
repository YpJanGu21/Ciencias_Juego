import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Pause } from 'lucide-react';

interface TouchControlsProps {
  onLeftPress: (pressed: boolean) => void;
  onRightPress: (pressed: boolean) => void;
  onJumpPress: (pressed: boolean) => void;
  onPauseClick: () => void;
}

interface ControlButtonProps {
  label: string;
  pressed: (value: boolean) => void;
  className: string;
  children: React.ReactNode;
}

/**
 * Pointer events unify touch, pen and mouse input. Pointer capture makes sure
 * the release event is received even if the finger slides off the button.
 */
const ControlButton: React.FC<ControlButtonProps> = ({
  label,
  pressed,
  className,
  children,
}) => {
  const release = () => pressed(false);

  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        pressed(true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      onContextMenu={(event) => event.preventDefault()}
      className={`${className} touch-none select-none`}
    >
      {children}
    </button>
  );
};

export const TouchControls: React.FC<TouchControlsProps> = ({
  onLeftPress,
  onRightPress,
  onJumpPress,
  onPauseClick,
}) => {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex items-end justify-between p-3 select-none"
      style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
    >
      {/* Left/Right D-Pad Cluster */}
      <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/60 p-2 rounded-2xl border border-slate-700/60">
        <ControlButton
          label="Mover a la izquierda"
          pressed={onLeftPress}
          className="w-14 h-14 bg-slate-800 active:bg-cyan-600 border-2 border-slate-600 active:border-cyan-400 rounded-xl flex items-center justify-center text-white active:scale-95 transition-all shadow-lg cursor-pointer"
        >
          <ArrowLeft size={26} />
        </ControlButton>

        <ControlButton
          label="Mover a la derecha"
          pressed={onRightPress}
          className="w-14 h-14 bg-slate-800 active:bg-cyan-600 border-2 border-slate-600 active:border-cyan-400 rounded-xl flex items-center justify-center text-white active:scale-95 transition-all shadow-lg cursor-pointer"
        >
          <ArrowRight size={26} />
        </ControlButton>
      </div>

      {/* Pause button */}
      <div className="pointer-events-auto pb-2">
        <button
          type="button"
          onClick={onPauseClick}
          className="w-11 h-11 bg-slate-900/90 active:bg-amber-600 border-2 border-slate-700 rounded-full flex items-center justify-center text-amber-300 shadow-md cursor-pointer touch-none"
          aria-label="Pausa"
        >
          <Pause size={18} />
        </button>
      </div>

      {/* Jump Action Button */}
      <div className="pointer-events-auto bg-slate-950/60 p-2 rounded-2xl border border-slate-700/60">
        <ControlButton
          label="Saltar"
          pressed={onJumpPress}
          className="w-16 h-16 bg-emerald-600 active:bg-emerald-500 border-4 border-emerald-300 rounded-full flex flex-col items-center justify-center text-slate-950 active:scale-90 transition-all shadow-[0_6px_0_#064e3b] font-pixel cursor-pointer"
        >
          <ArrowUp size={20} strokeWidth={3} />
          <span className="text-[10px] font-bold">SALTAR</span>
        </ControlButton>
      </div>
    </div>
  );
};
