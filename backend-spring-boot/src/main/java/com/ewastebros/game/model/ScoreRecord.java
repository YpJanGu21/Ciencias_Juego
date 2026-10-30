package com.ewastebros.game.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "score_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoreRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String playerName;

    @Column(nullable = false)
    private String characterChosen;

    @Column(nullable = false)
    private String difficulty;

    @Column(nullable = false)
    private Integer score;

    @Column(nullable = false)
    private Integer chipsCollected;

    @Column(nullable = false)
    private Double completionTimeSeconds;

    @Column(nullable = false)
    private Boolean flagReached;

    @Column(name = "recorded_at")
    private LocalDateTime recordedAt;

    @PrePersist
    protected void onCreate() {
        this.recordedAt = LocalDateTime.now();
    }
}
