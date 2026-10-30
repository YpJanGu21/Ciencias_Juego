import React, { useState, useEffect, useRef } from 'react';
import { Home, Play, Pause, ExternalLink, FastForward } from 'lucide-react';
import { sound } from '../game/sound';

interface CreditsScreenProps {
  onReturnToTitle: () => void;
}

export const CreditsScreen: React.FC<CreditsScreenProps> = ({ onReturnToTitle }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x or 2.5x speed
  const contentRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const initializedRef = useRef(false);

  useEffect(() => {
    sound.playVictoryFanfare();
  }, []);

  // JavaScript-driven scroll so toggling speed does not restart the credits.
  useEffect(() => {
    const content = contentRef.current;
    const container = content?.parentElement;
    if (!content || !container) return;

    if (!initializedRef.current) {
      offsetRef.current = container.clientHeight;
      initializedRef.current = true;
    }
    content.style.transform = `translateY(${offsetRef.current}px)`;

    if (isPaused) return;

    let animationFrame = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      offsetRef.current -= 45 * speed * delta;
      if (offsetRef.current < -content.scrollHeight - 80) {
        offsetRef.current = container.clientHeight;
      }
      content.style.transform = `translateY(${offsetRef.current}px)`;
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPaused, speed]);

  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-hidden flex flex-col justify-between select-none">
      
      {/* Background Starry Pixel Space */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Top Floating Controls */}
      <div className="relative z-20 flex items-center justify-between p-4 bg-slate-950/80 border-b border-slate-800 backdrop-blur-none">
        <div className="flex items-center gap-2 font-pixel text-xs text-amber-400">
          <span>CRÉDITOS Y FUENTES CIENTÍFICAS</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Speed Toggle */}
          <button
            onClick={() => setSpeed(speed === 1 ? 2.5 : 1)}
            className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-[11px] font-pixel text-slate-200 transition-colors cursor-pointer"
            title="Acelerar créditos"
          >
            <FastForward size={14} />
            <span>{speed === 1 ? '1x' : '2.5x'}</span>
          </button>

          {/* Pause Toggle */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-200 transition-colors cursor-pointer"
            title={isPaused ? 'Reanudar' : 'Pausar'}
          >
            {isPaused ? <Play size={15} /> : <Pause size={15} />}
          </button>

          {/* Back to Title */}
          <button
            onClick={() => {
              sound.playChipCollect();
              onReturnToTitle();
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-pixel text-slate-950 font-bold transition-colors cursor-pointer"
          >
            <Home size={14} />
            <span>VOLVER AL MENÚ</span>
          </button>
        </div>
      </div>

      {/* Vertical Scrolling Credits Container */}
      <div className="relative flex-1 w-full overflow-hidden flex justify-center">
        <div
          ref={contentRef}
          className="w-full max-w-2xl px-6 text-center will-change-transform"
        >
          {/* Spacing before text arrives */}
          <div className="h-96" />

          {/* Title */}
          <div className="font-pixel text-2xl sm:text-3xl text-emerald-400 tracking-wider mb-3">
            SUPER ECO BROS
          </div>
          <div className="font-pixel text-sm text-cyan-300 tracking-widest mb-10">
            ODISEA E-WASTE
          </div>

          <p className="text-sm sm:text-base text-slate-300 font-sans-clean max-w-lg mx-auto leading-relaxed mb-14">
            Un videojuego educativo diseñado para sensibilizar sobre el impacto ecológico
            y los riesgos para la salud derivados del consumo masivo y desecho informal
            de teléfonos celulares y tecnología descartable.
          </p>

          {/* Characters Section */}
          <div className="mb-14">
            <h3 className="font-pixel text-sm text-amber-400 mb-6 tracking-wide">
              — BRIGADA ECOLÓGICA —
            </h3>
            <div className="space-y-6 font-sans-clean">
              <div>
                <div className="font-pixel text-xs text-pink-400">GABRIELA</div>
                <div className="text-xs text-slate-400">Ingeniera en Descontaminación de Suelos</div>
              </div>
              <div>
                <div className="font-pixel text-xs text-cyan-400">LUCIEL</div>
                <div className="text-xs text-slate-400">Técnico en Recuperación de Microcomponentes</div>
              </div>
              <div>
                <div className="font-pixel text-xs text-emerald-400">SANTIAGO</div>
                <div className="text-xs text-slate-400">Activista de Economía Circular y Derecho a Reparar</div>
              </div>
              <div>
                <div className="font-pixel text-xs text-amber-400">ANGEL</div>
                <div className="text-xs text-slate-400">Especialista en Mitigación de Baterías Corrosivas</div>
              </div>
              <div>
                <div className="font-pixel text-xs text-rose-400">MATIAS</div>
                <div className="text-xs text-slate-400">Coordinador de Centros de Acopio y Puntos Limpios</div>
              </div>
            </div>
          </div>

          {/* Mandatory Sources Section */}
          <div className="mb-14 p-6 bg-slate-900/80 border-2 border-emerald-500/60 rounded-2xl">
            <h3 className="font-pixel text-sm text-yellow-300 mb-6 tracking-wide">
              — FUENTES OBLIGATORIAS Y REFERENCIAS CIENTÍFICAS —
            </h3>
            <p className="text-xs text-slate-300 font-sans-clean mb-6">
              El contenido pedagógico y el banco de preguntas fueron elaborados con base en investigaciones periodísticas y reportes de salud pública global:
            </p>

            <div className="space-y-5 text-left font-sans-clean">
              {/* 1. Codexverde */}
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-xs text-emerald-400">Codexverde</span>
                  <a
                    href="https://codexverde.cl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                  >
                    <span>codexverde.cl</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Guías de tratamiento de residuos, legislación ambiental y valorización de aparatos electrónicos en desuso.
                </p>
              </div>

              {/* 2. BioBioChile */}
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-xs text-emerald-400">BioBioChile</span>
                  <a
                    href="https://www.biobiochile.cl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                  >
                    <span>biobiochile.cl</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Reportajes de investigación sobre vertederos clandestinos y el crecimiento acelerado de la chatarra tecnológica.
                </p>
              </div>

              {/* 3. Semana */}
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-xs text-emerald-400">Semana</span>
                  <a
                    href="https://www.semana.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                  >
                    <span>semana.com</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Análisis sobre obsolescencia acelerada, el auge de los "burner phones" y su impacto en la contaminación por metales pesados.
                </p>
              </div>

              {/* 4. Organización Mundial de la Salud (OMS) */}
              <div className="pb-1">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-xs text-emerald-400">
                    Organización Mundial de la Salud (OMS)
                  </span>
                  <a
                    href="https://www.who.int"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                  >
                    <span>who.int</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Informe sobre los efectos de los desechos electrónicos en la salud infantil y de trabajadores informales expuestos a plomo, mercurio y retardantes bromados.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action for real-world impact */}
          <div className="mb-20">
            <h3 className="font-pixel text-xs text-amber-400 mb-3">
              ¿CÓMO AYUDAR EN LA VIDA REAL?
            </h3>
            <ul className="text-xs sm:text-sm text-slate-300 font-sans-clean space-y-2 list-disc list-inside max-w-md mx-auto text-left">
              <li>Repara antes de reemplazar.</li>
              <li>Dona o vende dispositivos que aún funcionan.</li>
              <li>Deposita baterías y teléfonos viejos exclusivamente en Puntos Limpios autorizados.</li>
              <li>Rechaza la adquisición de teléfonos desechables de un solo uso.</li>
            </ul>
          </div>

          <div className="font-pixel text-xs text-slate-500 mb-10">
            ¡GRACIAS POR JUGAR Y PROTEGER EL PLANETA!
          </div>

          <div className="h-40" />
        </div>
      </div>

    </div>
  );
};
