package com.ewastebros.game.controller;

import com.ewastebros.game.model.ScoreRecord;
import com.ewastebros.game.model.User;
import com.ewastebros.game.repository.ScoreRecordRepository;
import com.ewastebros.game.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/scores")
@RequiredArgsConstructor
public class ScoreController {

    private final ScoreRecordRepository scoreRecordRepository;
    private final UserRepository userRepository;

    /**
     * Persists a finished run. Requires a valid JWT because the score belongs
     * to the authenticated user.
     */
    @PostMapping
    public ResponseEntity<?> saveScore(
            @RequestBody ScoreRequest request,
            Authentication authentication
    ) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Se requiere autenticación"));
        }

        if (request.score() == null || request.score() < 0
                || request.chipsCollected() == null || request.chipsCollected() < 0
                || request.completionTimeSeconds() == null || request.completionTimeSeconds() < 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Puntaje, teléfonos y tiempo deben ser valores válidos"));
        }

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        ScoreRecord record = ScoreRecord.builder()
                .user(user)
                .playerName(user.getUsername())
                .characterChosen(defaultIfBlank(request.characterChosen(), "gabriela"))
                .difficulty(defaultIfBlank(request.difficulty(), "medio"))
                .score(request.score())
                .chipsCollected(request.chipsCollected())
                .completionTimeSeconds(request.completionTimeSeconds())
                .flagReached(Boolean.TRUE.equals(request.flagReached()))
                .build();

        ScoreRecord saved = scoreRecordRepository.save(record);
        return ResponseEntity.status(HttpStatus.CREATED).body(ScoreResponse.from(saved));
    }

    /**
     * Public leaderboard, ordered from highest to lowest score.
     */
    @GetMapping("/leaderboard")
    public List<ScoreResponse> leaderboard() {
        return scoreRecordRepository.findTop20ByOrderByScoreDesc()
                .stream()
                .map(ScoreResponse::from)
                .toList();
    }

    private static String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    public record ScoreRequest(
            String characterChosen,
            String difficulty,
            Integer score,
            Integer chipsCollected,
            Double completionTimeSeconds,
            Boolean flagReached
    ) {
    }

    public record ScoreResponse(
            Long id,
            String playerName,
            String characterChosen,
            String difficulty,
            Integer score,
            Integer chipsCollected,
            Double completionTimeSeconds,
            Boolean flagReached
    ) {
        public static ScoreResponse from(ScoreRecord record) {
            return new ScoreResponse(
                    record.getId(),
                    record.getPlayerName(),
                    record.getCharacterChosen(),
                    record.getDifficulty(),
                    record.getScore(),
                    record.getChipsCollected(),
                    record.getCompletionTimeSeconds(),
                    record.getFlagReached()
            );
        }
    }
}
