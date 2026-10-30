import { DifficultyId, QuestionData, QuestionOptionKey } from './types';

export const QUESTIONS_BANK: QuestionData[] = [
  {
    id: 1,
    question: '¿Cuál es el principal riesgo ambiental de botar un teléfono a la basura común?',
    options: [
      { key: 'A', text: 'Liberan sustancias contaminantes' },
      { key: 'B', text: 'Mejoran el suelo' },
      { key: 'C', text: 'Se evaporan rápidamente' },
    ],
    correctAnswer: 'A',
    difficulty: 'facil',
    explanation: 'Los teléfonos contienen metales pesados como plomo, mercurio y cadmio que se filtran a las napas subterráneas y contaminan el ecosistema.',
  },
  {
    id: 2,
    question: '¿Qué ocurre con los materiales de los teléfonos desechables en la naturaleza?',
    options: [
      { key: 'A', text: 'Son biodegradables' },
      { key: 'B', text: 'Tardan años en degradarse' },
      { key: 'C', text: 'Son abono natural' },
    ],
    correctAnswer: 'B',
    difficulty: 'facil',
    explanation: 'Plásticos reforzados, resinas epóxicas y carcasas pueden tardar cientos de años en degradarse, fragmentándose en microplásticos nocivos.',
  },
  {
    id: 3,
    question: 'Según la OMS, ¿a qué se asocia la exposición a sustancias de residuos electrónicos?',
    options: [
      { key: 'A', text: 'Mayor inmunidad' },
      { key: 'B', text: 'Diversos problemas de salud' },
      { key: 'C', text: 'Enfermedades incurables inmediatas' },
    ],
    correctAnswer: 'B',
    difficulty: 'medio',
    explanation: 'La Organización Mundial de la Salud (OMS) advierte que la quema o manipulación informal de e-waste provoca afecciones respiratorias, neurológicas y tiroideas.',
  },
  {
    id: 4,
    question: '¿Por qué la gente sigue comprando teléfonos desechables si existen mejores opciones?',
    options: [
      { key: 'A', text: 'Por su pantalla táctil' },
      { key: 'B', text: 'Por la seguridad y privacidad que brindan' },
      { key: 'C', text: 'Porque son ecológicos' },
    ],
    correctAnswer: 'B',
    difficulty: 'medio',
    explanation: 'A menudo llamados "burner phones", usuarios los eligen por privacidad temporal o emergencias, ignorando el severo impacto ambiental posterior.',
  },
  {
    id: 5,
    question: '¿Qué debes revisar al llevar tu teléfono viejo a un punto de reciclaje?',
    options: [
      { key: 'A', text: 'Que procesen "E-Waste" o basura electrónica' },
      { key: 'B', text: 'Que te paguen por él' },
      { key: 'C', text: 'Que el contenedor sea verde' },
    ],
    correctAnswer: 'A',
    difficulty: 'medio',
    explanation: 'Es crucial verificar que el centro de acopio cuente con certificación para tratamiento de RAEE (Residuos de Aparatos Eléctricos y Electrónicos).',
  },
  {
    id: 6,
    question: '¿Qué característica interna de los teléfonos desechables los hace especialmente volátiles?',
    options: [
      { key: 'A', text: 'Su procesador de última generación' },
      { key: 'B', text: 'Su baja calidad de hardware y químicos corrosivos' },
      { key: 'C', text: 'Su batería infinita' },
    ],
    correctAnswer: 'B',
    difficulty: 'dificil',
    explanation: 'La fabricación ultra-económica usa soldaduras frágiles y electrolitos corrosivos de bajo costo que pueden perforarse o incendiarse con facilidad.',
  },
  {
    id: 7,
    question: '¿Es correcto afirmar que la contaminación por teléfonos desechables se debe 100% a la moda?',
    options: [
      { key: 'A', text: 'Sí, es la única razón' },
      { key: 'B', text: 'No, es un factor pero afirmarlo como única causa es erróneo' },
      { key: 'C', text: 'Depende del país' },
    ],
    correctAnswer: 'B',
    difficulty: 'dificil',
    explanation: 'Influyen la obsolescencia programada, el costo prohibitivo de repuestos, la falta de políticas de retorno y modelos de negocio de un solo uso.',
  },
  {
    id: 8,
    question: 'Si un teléfono desechable aún funciona pero ya no lo necesitas, ¿cuál es la mejor opción?',
    options: [
      { key: 'A', text: 'Romperlo' },
      { key: 'B', text: 'Regalarlo o venderlo' },
      { key: 'C', text: 'Guardarlo para siempre' },
    ],
    correctAnswer: 'B',
    difficulty: 'facil',
    explanation: 'Extender la vida útil mediante la reutilización o donación a personas necesitadas es la forma más directa de prevenir residuos electrónicos.',
  },
  {
    id: 9,
    question: '¿Qué efecto tiene la mala manipulación de estos dispositivos por parte del usuario?',
    options: [
      { key: 'A', text: 'Se actualizan solos' },
      { key: 'B', text: 'Daña componentes internos haciéndolos inútiles más rápido' },
      { key: 'C', text: 'Aumenta su valor' },
    ],
    correctAnswer: 'B',
    difficulty: 'dificil',
    explanation: 'Golpes, cargadores defectuosos y exposición térmica aceleran el deterioro de baterías y placas, convirtiendo el equipo en basura prematura.',
  },
  {
    id: 10,
    question: '¿Qué se puede hacer con las partes de un teléfono desechable dañado?',
    options: [
      { key: 'A', text: 'Reutilizarlas como repuestos o en proyectos electrónicos' },
      { key: 'B', text: 'Quemarlas' },
      { key: 'C', text: 'Tirarlas al inodoro' },
    ],
    correctAnswer: 'A',
    difficulty: 'medio',
    explanation: 'Motores de vibración, micrófonos, pantallas y cobre pueden ser rescatados por entusiastas de robótica o empresas de refinamiento de metales.',
  },
];

/**
 * Selects a question using the same difficulty weights documented in the game:
 * fácil favours easy questions, medio is balanced, difícil prioritises complex ones.
 */
export function selectQuestionForSector(
  difficulty: DifficultyId,
  usedQuestionIds: number[] = []
): QuestionData {
  // Prefer questions that have not appeared yet.
  let pool = QUESTIONS_BANK.filter((q) => !usedQuestionIds.includes(q.id));
  if (pool.length === 0) {
    pool = [...QUESTIONS_BANK];
  }

  const weightFor = (question: QuestionData): number => {
    if (difficulty === 'dificil') {
      if (question.difficulty === 'dificil') return 5;
      if (question.difficulty === 'medio') return 2;
      return 1;
    }
    if (difficulty === 'medio') {
      if (question.difficulty === 'dificil') return 1;
      if (question.difficulty === 'medio') return 4;
      return 3;
    }
    // Fácil
    if (question.difficulty === 'dificil') return 1;
    if (question.difficulty === 'medio') return 2;
    return 5;
  };

  const weightedPool = pool.map((question) => ({ question, weight: weightFor(question) }));
  const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of weightedPool) {
    if (random < item.weight) return item.question;
    random -= item.weight;
  }

  // Defensive fallback (should never be reached).
  return weightedPool[0].question;
}

/**
 * Validates the answer locally
 */
export function checkQuestionAnswer(
  questionId: number,
  selectedAnswer: QuestionOptionKey
): { isCorrect: boolean; correctAnswer: QuestionOptionKey; explanation: string } {
  const q = QUESTIONS_BANK.find((item) => item.id === questionId);
  if (!q) {
    return { isCorrect: false, correctAnswer: 'A', explanation: 'Pregunta no encontrada.' };
  }
  return {
    isCorrect: q.correctAnswer === selectedAnswer,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
  };
}
