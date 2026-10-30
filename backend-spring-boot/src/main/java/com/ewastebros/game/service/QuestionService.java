package com.ewastebros.game.service;

import com.ewastebros.game.model.Question;
import com.ewastebros.game.repository.QuestionRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final Random random = new Random();

    /**
     * Semilla inicial con las 10 preguntas obligatorias sobre teléfonos desechables
     */
    @PostConstruct
    public void seedQuestions() {
        if (questionRepository.count() == 0) {
            List<Question> initialBank = List.of(
                Question.builder()
                    .questionText("¿Cuál es el principal riesgo ambiental de botar un teléfono a la basura común?")
                    .optionA("Liberan sustancias contaminantes")
                    .optionB("Mejoran el suelo")
                    .optionC("Se evaporan rápidamente")
                    .correctAnswer("A")
                    .difficulty(Question.DifficultyLevel.FACIL)
                    .explanation("Los teléfonos contienen metales pesados como plomo, mercurio y cadmio que se filtran a las napas subterráneas.")
                    .build(),
                Question.builder()
                    .questionText("¿Qué ocurre con los materiales de los teléfonos desechables en la naturaleza?")
                    .optionA("Son biodegradables")
                    .optionB("Tardan años en degradarse")
                    .optionC("Son abono natural")
                    .correctAnswer("B")
                    .difficulty(Question.DifficultyLevel.FACIL)
                    .explanation("Plásticos reforzados y resinas tardan cientos de años en degradarse en microplásticos nocivos.")
                    .build(),
                Question.builder()
                    .questionText("Según la OMS, ¿a qué se asocia la exposición a sustancias de residuos electrónicos?")
                    .optionA("Mayor inmunidad")
                    .optionB("Diversos problemas de salud")
                    .optionC("Enfermedades incurables inmediatas")
                    .correctAnswer("B")
                    .difficulty(Question.DifficultyLevel.MEDIO)
                    .explanation("La OMS advierte que la exposición a e-waste causa problemas neurológicos, respiratorios y tiroideos.")
                    .build(),
                Question.builder()
                    .questionText("¿Por qué la gente sigue comprando teléfonos desechables si existen mejores opciones?")
                    .optionA("Por su pantalla táctil")
                    .optionB("Por la seguridad y privacidad que brindan")
                    .optionC("Porque son ecológicos")
                    .correctAnswer("B")
                    .difficulty(Question.DifficultyLevel.MEDIO)
                    .explanation("A menudo llamados burner phones, se usan por privacidad temporal a costa de un alto impacto ambiental.")
                    .build(),
                Question.builder()
                    .questionText("¿Qué debes revisar al llevar tu teléfono viejo a un punto de reciclaje?")
                    .optionA("Que procesen \"E-Waste\" o basura electrónica")
                    .optionB("Que te paguen por él")
                    .optionC("Que el contenedor sea verde")
                    .correctAnswer("A")
                    .difficulty(Question.DifficultyLevel.MEDIO)
                    .explanation("Debe confirmarse que el gestor esté autorizado para el tratamiento integral de RAEE.")
                    .build(),
                Question.builder()
                    .questionText("¿Qué característica interna de los teléfonos desechables los hace especialmente volátiles?")
                    .optionA("Su procesador de última generación")
                    .optionB("Su baja calidad de hardware y químicos corrosivos")
                    .optionC("Su batería infinita")
                    .correctAnswer("B")
                    .difficulty(Question.DifficultyLevel.DIFICIL)
                    .explanation("Materiales de baja calidad y soldaduras precarias aceleran la corrosión y fuga de electrolitos tóxicos.")
                    .build(),
                Question.builder()
                    .questionText("¿Es correcto afirmar que la contaminación por teléfonos desechables se debe 100% a la moda?")
                    .optionA("Sí, es la única razón")
                    .optionB("No, es un factor pero afirmarlo como única causa es erróneo")
                    .optionC("Depende del país")
                    .correctAnswer("B")
                    .difficulty(Question.DifficultyLevel.DIFICIL)
                    .explanation("Intervienen la obsolescencia programada, el marketing de un solo uso y la dificultad para reparar.")
                    .build(),
                Question.builder()
                    .questionText("Si un teléfono desechable aún funciona pero ya no lo necesitas, ¿cuál es la mejor opción?")
                    .optionA("Romperlo")
                    .optionB("Regalarlo o venderlo")
                    .optionC("Guardarlo para siempre")
                    .correctAnswer("B")
                    .difficulty(Question.DifficultyLevel.FACIL)
                    .explanation("Reutilizar y extender la vida útil es la mejor forma de prevención de residuos.")
                    .build(),
                Question.builder()
                    .questionText("¿Qué efecto tiene la mala manipulación de estos dispositivos por parte del usuario?")
                    .optionA("Se actualizan solos")
                    .optionB("Daña componentes internos haciéndolos inútiles más rápido")
                    .optionC("Aumenta su valor")
                    .correctAnswer("B")
                    .difficulty(Question.DifficultyLevel.DIFICIL)
                    .explanation("Cargadores genéricos y caídas dañan componentes prematuramente, generando chatarra evitable.")
                    .build(),
                Question.builder()
                    .questionText("¿Qué se puede hacer con las partes de un teléfono desechable dañado?")
                    .optionA("Reutilizarlas como repuestos o en proyectos electrónicos")
                    .optionB("Quemarlas")
                    .optionC("Tirarlas al inodoro")
                    .correctAnswer("A")
                    .difficulty(Question.DifficultyLevel.MEDIO)
                    .explanation("Microcontroladores, pantallas y componentes pasivos pueden reutilizarse en proyectos educativos o repuestos.")
                    .build()
            );
            questionRepository.saveAll(initialBank);
        }
    }

    /**
     * Selección aleatoria con ponderación por dificultad.
     * Fácil favorece preguntas básicas, medio equilibra y difícil prioriza
     * las preguntas complejas.
     */
    public Question getRandomQuestion(String difficultyStr, List<Long> excludedIds) {
        List<Question> candidates;
        if (excludedIds != null && !excludedIds.isEmpty()) {
            candidates = questionRepository.findQuestionsExcludingIds(excludedIds);
        } else {
            candidates = questionRepository.findAll();
        }

        if (candidates.isEmpty()) {
            candidates = questionRepository.findAll();
        }
        if (candidates.isEmpty()) {
            throw new IllegalStateException("No hay preguntas disponibles en el banco");
        }

        String difficulty = difficultyStr == null ? "medio" : difficultyStr.toLowerCase(Locale.ROOT);
        List<Question> weightedPool = new ArrayList<>();

        for (Question question : candidates) {
            int weight = weightFor(question.getDifficulty(), difficulty);
            for (int i = 0; i < weight; i++) {
                weightedPool.add(question);
            }
        }

        return weightedPool.get(random.nextInt(weightedPool.size()));
    }

    private int weightFor(Question.DifficultyLevel questionDifficulty, String mode) {
        return switch (mode) {
            case "dificil" -> switch (questionDifficulty) {
                case DIFICIL -> 5;
                case MEDIO -> 2;
                case FACIL -> 1;
            };
            case "facil" -> switch (questionDifficulty) {
                case DIFICIL -> 1;
                case MEDIO -> 2;
                case FACIL -> 5;
            };
            default -> switch (questionDifficulty) {
                case DIFICIL -> 1;
                case MEDIO -> 4;
                case FACIL -> 3;
            };
        };
    }

    /**
     * Validación de respuesta y creación de checkpoint
     */
    public ValidationResult validateAnswer(Long questionId, String selectedAnswer) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Pregunta no encontrada con id: " + questionId));

        if (selectedAnswer == null) {
            return new ValidationResult(false, question.getCorrectAnswer(), question.getExplanation());
        }

        boolean isCorrect = question.getCorrectAnswer().equalsIgnoreCase(selectedAnswer.trim());
        return new ValidationResult(isCorrect, question.getCorrectAnswer(), question.getExplanation());
    }

    public record ValidationResult(boolean correct, String correctAnswer, String explanation) {}
}
