package com.ewastebros.game.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String questionText;

    @Column(nullable = false)
    private String optionA;

    @Column(nullable = false)
    private String optionB;

    @Column(nullable = false)
    private String optionC;

    @Column(nullable = false, length = 1)
    private String correctAnswer; // 'A', 'B', o 'C'

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DifficultyLevel difficulty; // FACIL, MEDIO, DIFICIL

    @Column(length = 1000)
    private String explanation;

    public enum DifficultyLevel {
        FACIL,
        MEDIO,
        DIFICIL
    }
}
