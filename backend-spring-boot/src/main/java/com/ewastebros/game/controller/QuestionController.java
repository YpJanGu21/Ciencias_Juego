package com.ewastebros.game.controller;

import com.ewastebros.game.model.Question;
import com.ewastebros.game.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    /**
     * Endpoint para obtener 1 pregunta aleatoria para el Checkpoint.
     * En dificultad "dificil", prioriza probabilísticamente las más complejas.
     *
     * Ejemplo: GET /api/v1/questions/random?difficulty=dificil&excluded=1,4
     */
    @GetMapping("/random")
    public ResponseEntity<QuestionResponseDto> getRandomQuestion(
            @RequestParam(defaultValue = "medio") String difficulty,
            @RequestParam(required = false) List<Long> excluded) {

        Question question = questionService.getRandomQuestion(difficulty, excluded);

        // Se envía al cliente SIN revelar el campo 'correctAnswer' para evitar trampas en inspección de red
        QuestionResponseDto dto = new QuestionResponseDto(
                question.getId(),
                question.getQuestionText(),
                question.getOptionA(),
                question.getOptionB(),
                question.getOptionC(),
                question.getDifficulty().name().toLowerCase()
        );

        return ResponseEntity.ok(dto);
    }

    /**
     * Endpoint para validar la respuesta seleccionada por el jugador en el Checkpoint.
     *
     * Ejemplo: POST /api/v1/questions/validate
     * Body: { "questionId": 1, "selectedAnswer": "A" }
     */
    @PostMapping("/validate")
    public ResponseEntity<ValidationResponseDto> validateAnswer(
            @RequestBody ValidateRequestDto request) {

        if (request == null || request.questionId() == null
                || request.selectedAnswer() == null
                || request.selectedAnswer().isBlank()) {
            throw new IllegalArgumentException("Solicitud de validación inválida");
        }

        QuestionService.ValidationResult result = questionService.validateAnswer(
                request.questionId(),
                request.selectedAnswer()
        );

        ValidationResponseDto response = new ValidationResponseDto(
                result.correct(),
                result.correctAnswer(),
                result.explanation(),
                result.correct() ? "Checkpoint activado. Acceso concedido al siguiente sector." : "Respuesta incorrecta. Inténtalo nuevamente."
        );

        return ResponseEntity.ok(response);
    }

    // DTOs
    public record QuestionResponseDto(
            Long id,
            String question,
            String optionA,
            String optionB,
            String optionC,
            String difficulty
    ) {}

    public record ValidateRequestDto(Long questionId, String selectedAnswer) {}

    public record ValidationResponseDto(
            boolean correct,
            String correctAnswer,
            String explanation,
            String message
    ) {}
}
