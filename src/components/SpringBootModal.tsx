import React, { useEffect, useState } from 'react';
import { X, Server, Copy, Check, FileCode, FolderTree, Shield, Database } from 'lucide-react';

interface SpringBootModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpringBootModal: React.FC<SpringBootModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'controller' | 'service' | 'entity' | 'security' | 'properties'>('architecture');
  const [copied, setCopied] = useState(false);

  // Close with Escape without interfering with the game shortcuts.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const codeSnippets: Record<string, { title: string; filename: string; language: string; code: string }> = {
    architecture: {
      title: 'Estructura Completa del Proyecto Full Stack',
      filename: 'ProjectStructure.tree',
      language: 'markdown',
      code: `
📦 super-eco-bros-odisea-e-waste/
├── 📁 src/                          # Frontend React + Vite + Tailwind CSS
│   ├── 📁 components/
│   │   ├── GameCanvas.tsx           # Bucle de juego, cámara, colisiones y checkpoints
│   │   ├── HUD.tsx                  # Marcador retro (Score, Teléfonos, Timer, Sector)
│   │   ├── QuestionModal.tsx        # Preguntas de checkpoint y validación
│   │   ├── DialogueModal.tsx        # Diálogo inicial del personaje
│   │   ├── VictoryModal.tsx         # Victoria al bajar la bandera
│   │   ├── CreditsScreen.tsx        # Créditos y fuentes científicas
│   │   ├── SpringBootModal.tsx      # Muestra esta arquitectura
│   │   ├── TitleScreen.tsx          # Selección de héroe y dificultad
│   │   └── TouchControls.tsx        # D-Pad y salto táctil
│   ├── 📁 game/                     # Lógica pura desacoplada (testeada)
│   │   ├── physics.ts               # AABB, gravedad, coyote time, plataformas móviles
│   │   ├── physics.test.ts
│   │   ├── levelMap.ts              # Generador de los 4 sectores
│   │   ├── levelMap.test.ts
│   │   ├── questionsData.ts         # Banco local de 10 preguntas ponderadas
│   │   ├── charactersData.ts        # Personajes y presupuestos de tiempo
│   │   ├── renderer.ts              # Sprites pixel art, parallax y cámara
│   │   ├── sound.ts                 # Chiptune 8-bit con Web Audio API
│   │   └── types.ts
│   ├── App.tsx                      # Máquina de estados y orquestación
│   ├── main.tsx
│   └── index.css
├── index.html
├── netlify.toml                     # Build, redirects y cabeceras para Netlify
├── package.json
├── vite.config.ts
│
└── 📁 backend-spring-boot/          # Opcional: Java 17 + Spring Boot 3 + JPA
    ├── 📁 src/main/java/com/ewastebros/game/
    │   ├── SuperEcoBrosApplication.java
    │   ├── 📁 controller/           # AuthController, QuestionController, ScoreController
    │   ├── 📁 service/              # QuestionService, UserService
    │   ├── 📁 repository/           # Question, User y ScoreRecord repositories
    │   ├── 📁 model/                # Entidades JPA Question, User, ScoreRecord
    │   ├── 📁 security/             # SecurityConfig, JwtService, JwtAuthenticationFilter
    │   └── 📁 exception/            # GlobalExceptionHandler
    ├── 📁 src/main/resources/
    │   └── application.properties
    └── pom.xml
      `,
    },
    controller: {
      title: 'Controlador de Preguntas y Validación (Spring Boot)',
      filename: 'QuestionController.java',
      language: 'java',
      code: `@RestController
@RequestMapping("/api/v1/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    /**
     * Envía 1 pregunta al azar.
     * En "dificil" prioriza las preguntas complejas; en "facil" las básicas.
     * El DTO no revela la respuesta correcta.
     */
    @GetMapping("/random")
    public ResponseEntity<QuestionResponseDto> getRandomQuestion(
            @RequestParam(defaultValue = "medio") String difficulty,
            @RequestParam(required = false) List<Long> excluded) {

        Question question = questionService.getRandomQuestion(difficulty, excluded);

        return ResponseEntity.ok(new QuestionResponseDto(
                question.getId(),
                question.getQuestionText(),
                question.getOptionA(),
                question.getOptionB(),
                question.getOptionC(),
                question.getDifficulty().name().toLowerCase()
        ));
    }

    /**
     * Valida la opción elegida y confirma el checkpoint.
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

        return ResponseEntity.ok(new ValidationResponseDto(
                result.correct(),
                result.correctAnswer(),
                result.explanation(),
                result.correct() ? "Checkpoint activado." : "Respuesta incorrecta."
        ));
    }
}`,
    },
    service: {
      title: 'Servicio con Algoritmo de Ponderación por Dificultad',
      filename: 'QuestionService.java',
      language: 'java',
      code: `@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final Random random = new Random();

    /**
     * Selección con ponderación probabilística:
     * difícil favorece las preguntas complejas, medio equilibra el banco
     * y fácil prioriza las preguntas básicas.
     */
    public Question getRandomQuestion(String difficultyStr, List<Long> excludedIds) {
        List<Question> candidates = (excludedIds != null && !excludedIds.isEmpty())
                ? questionRepository.findQuestionsExcludingIds(excludedIds)
                : questionRepository.findAll();

        if (candidates.isEmpty()) {
            candidates = questionRepository.findAll();
        }
        if (candidates.isEmpty()) {
            throw new IllegalStateException("No hay preguntas disponibles");
        }

        String difficulty = difficultyStr == null
                ? "medio"
                : difficultyStr.toLowerCase(Locale.ROOT);

        List<Question> weightedPool = new ArrayList<>();
        for (Question q : candidates) {
            int weight = weightFor(q.getDifficulty(), difficulty);
            for (int i = 0; i < weight; i++) {
                weightedPool.add(q);
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

    public ValidationResult validateAnswer(Long questionId, String selectedAnswer) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Pregunta no encontrada"));

        if (selectedAnswer == null) {
            return new ValidationResult(false, question.getCorrectAnswer(), question.getExplanation());
        }

        boolean isCorrect = question.getCorrectAnswer()
                .equalsIgnoreCase(selectedAnswer.trim());
        return new ValidationResult(isCorrect, question.getCorrectAnswer(), question.getExplanation());
    }
}`,
    },
    entity: {
      title: 'Entidades JPA (Question, User, ScoreRecord)',
      filename: 'Question.java',
      language: 'java',
      code: `@Entity
@Table(name = "questions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
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
    private DifficultyLevel difficulty;

    @Column(length = 1000)
    private String explanation;

    public enum DifficultyLevel {
        FACIL, MEDIO, DIFICIL
    }
}`,
    },
    security: {
      title: 'Seguridad Stateless con Spring Security y JWT',
      filename: 'SecurityConfig.java',
      language: 'java',
      code: `@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("\${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/questions/**").permitAll()
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/scores/leaderboard").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/scores").authenticated()
                .anyRequest().authenticated()
            )
            // El filtro lee "Authorization: Bearer <token>".
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}`,
    },
    properties: {
      title: 'Configuración de Entorno (application.properties)',
      filename: 'application.properties',
      language: 'properties',
      code: `# Puerto de escucha
server.port=8080

# Base de datos H2 en memoria (desarrollo)
spring.datasource.url=jdbc:h2:mem:ecodb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

spring.jpa.hibernate.ddl-auto=update
spring.jpa.open-in-view=false
spring.jpa.show-sql=false

# Consola H2 (solo desarrollo)
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

# JWT: clave secreta y expiración
app.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
app.jwt.expiration-ms=86400000

# CORS: Vite dev (3000), Vite default (5173) y preview (4173)
app.cors.allowed-origins=http://localhost:3000,http://localhost:5173,http://localhost:4173`,
    },
  };

  const current = codeSnippets[activeTab];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(current.code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked in non-secure contexts.
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-none select-none animate-fadeIn">
      <div className="w-full max-w-5xl h-[88vh] bg-slate-900 border-2 border-indigo-500/70 rounded-2xl flex flex-col shadow-2xl overflow-hidden text-white">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-indigo-300">
              <Server size={18} />
            </div>
            <div>
              <h3 className="font-pixel text-xs sm:text-sm text-indigo-300">
                ARQUITECTURA & CÓDIGO BACKEND SPRING BOOT
              </h3>
              <p className="text-[11px] text-slate-400 font-sans-clean">
                Controladores, Entidades JPA, Algoritmo de Pesos y Seguridad JWT
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/50 border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans-clean font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FolderTree size={14} />
            <span>Estructura de Carpetas</span>
          </button>

          <button
            onClick={() => setActiveTab('controller')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans-clean font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'controller'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileCode size={14} />
            <span>QuestionController.java</span>
          </button>

          <button
            onClick={() => setActiveTab('service')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans-clean font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'service'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Server size={14} />
            <span>QuestionService.java (Pesos)</span>
          </button>

          <button
            onClick={() => setActiveTab('entity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans-clean font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'entity'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Database size={14} />
            <span>Question.java (Entidad)</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans-clean font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Shield size={14} />
            <span>SecurityConfig.java (JWT)</span>
          </button>

          <button
            onClick={() => setActiveTab('properties')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans-clean font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'properties'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileCode size={14} />
            <span>application.properties</span>
          </button>
        </div>

        {/* Code Content Body */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
            <span className="font-mono text-cyan-400">{current.filename}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? '¡Copiado!' : 'Copiar Código'}</span>
            </button>
          </div>

          <pre className="flex-1 p-4 font-mono text-xs sm:text-sm text-slate-200 overflow-y-auto whitespace-pre leading-relaxed select-text">
            {current.code.trim()}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-sans-clean">
            Los archivos fuente completos de Spring Boot se encuentran creados en la carpeta <code className="text-cyan-400 font-mono">/backend-spring-boot</code> del proyecto.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-sans-clean cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
