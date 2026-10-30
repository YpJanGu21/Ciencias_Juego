import { CharacterConfig, CharacterId, DifficultyConfig, DifficultyId } from './types';

export const CHARACTERS: Record<CharacterId, CharacterConfig> = {
  gabriela: {
    id: 'gabriela',
    name: 'Gabriela',
    role: 'Ingeniera Ambiental',
    quote: '¡Hola! ¿Sabías que los teléfonos desechables liberan toxinas peligrosas en el suelo si no los reciclamos correctamente? ¡Vamos a limpiar el nivel!',
    description: 'Especialista en descontaminación del suelo y recuperación de materiales nobles.',
    primaryColor: '#ec4899', // Pink / Magenta
    secondaryColor: '#3b82f6', // Denim blue
    accentColor: '#f43f5e',
  },
  luciel: {
    id: 'luciel',
    name: 'Luciel',
    role: 'Técnico en E-Waste',
    quote: '¡En marcha! Los componentes de estos dispositivos tardan años en degradarse. ¡Nuestro deber es reducir la basura electrónica!',
    description: 'Experto en desmontaje de placas base y neutralización de microplásticos.',
    primaryColor: '#06b6d4', // Cyan
    secondaryColor: '#1e293b', // Dark Slate
    accentColor: '#38bdf8',
  },
  santiago: {
    id: 'santiago',
    name: 'Santiago',
    role: 'Activista de Consumo Circular',
    quote: '¡A saltar! La rápida renovación tecnológica nos inunda de residuos. ¡Optemos por alternativas duraderas para salvar el planeta!',
    description: 'Promotor de economía circular y del derecho a reparar dispositivos.',
    primaryColor: '#10b981', // Emerald
    secondaryColor: '#064e3b', // Deep forest
    accentColor: '#34d399',
  },
  angel: {
    id: 'angel',
    name: 'Angel',
    role: 'Especialista en Químicos Peligrosos',
    quote: '¡Es hora de actuar! Aunque den privacidad temporal, su hardware de baja calidad y químicos corrosivos son un peligro constante.',
    description: 'Experto en mitigación de ácidos de baterías de litio y cadmio.',
    primaryColor: '#f59e0b', // Amber
    secondaryColor: '#78350f', // Deep brown
    accentColor: '#fbbf24',
  },
  matias: {
    id: 'matias',
    name: 'Matias',
    role: 'Líder de Reciclaje Comunitario',
    quote: '¡Esquiva los obstáculos! Recuerda que siempre puedes donar, vender o llevar tus teléfonos viejos a un punto de reciclaje.',
    description: 'Coordinador de puntos limpios y donación de equipos reacondicionados.',
    primaryColor: '#ef4444', // Red
    secondaryColor: '#1d4ed8', // Classic Mario Blue
    accentColor: '#f97316',
  },
};

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  facil: {
    id: 'facil',
    label: 'Fácil',
    timeSeconds: 120, // 2 minutos por sector
    timeLabel: '02:00 por sector',
    description: '2 minutos por sector. Preguntas mayoritariamente básicas y ritmo relajado.',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  medio: {
    id: 'medio',
    label: 'Medio',
    timeSeconds: 90, // 1 minuto 30 segundos por sector
    timeLabel: '01:30 por sector',
    description: '1:30 por sector. Equilibrio entre precisión, velocidad y preguntas variadas.',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
  dificil: {
    id: 'dificil',
    label: 'Difícil',
    timeSeconds: 60, // 1 minuto por sector
    timeLabel: '01:00 por sector',
    description: '1 minuto por sector. Prioriza preguntas complejas y exige recorridos limpios.',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  },
};
