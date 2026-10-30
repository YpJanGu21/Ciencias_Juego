package com.ewastebros.game.repository;

import com.ewastebros.game.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByDifficulty(Question.DifficultyLevel difficulty);

    @Query("SELECT q FROM Question q WHERE q.id NOT IN :excludedIds")
    List<Question> findQuestionsExcludingIds(@Param("excludedIds") List<Long> excludedIds);
}
