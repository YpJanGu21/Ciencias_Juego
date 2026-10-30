# Super Eco Bros: Odisea E-Waste

Juego de plataformas 2D retro de carácter educativo. Recorre cuatro sectores, esquiva residuos electrónicos, responde preguntas científicas en los checkpoints y baja la bandera de la planta de reciclaje.

El juego funciona **sin backend ni claves de API**: el banco de 10 preguntas, el audio y toda la lógica se ejecutan en el navegador. La carpeta `backend-spring-boot` es un ejemplo funcional opcional de API REST con Spring Boot.

## Requisitos

- **Node.js 20.19 o superior** (recomendado Node 22/24) y npm.
- Navegador moderno con Canvas 2D y Web Audio.
- Opcional para el backend: **Java 17** y **Maven 3.9+**.

## Inicio rápido (frontend)

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>.

Para probar la compilación de producción:

```bash
npm run build
npm run preview
```

La vista previa queda disponible en <http://localhost:4173>. El proyecto usa `base: './'`, así que `dist/` también puede publicarse en una subcarpeta de un hosting estático.

### Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en el puerto 3000. |
| `npm run build` | Compila el frontend en `dist/`. |
| `npm run preview` | Sirve la compilación de producción. |
| `npm run lint` | Comprueba tipos con TypeScript (`tsc --noEmit`). |
| `npm test` | Ejecuta las pruebas de física, nivel y preguntas. |
| `npm run clean` | Elimina `dist/`. |

## Controles

| Acción | Teclado | Táctil |
| --- | --- | --- |
| Moverse | `A` / `D` o flechas izquierda/derecha | D-Pad en pantalla |
| Saltar | `Espacio`, `W` o flecha arriba | Botón **SALTAR** |
| Pausa | `Esc` o `P` | Botón de pausa |
| Silenciar | `M` | — |
| Responder checkpoint | `A`, `B`, `C` o `1`, `2`, `3`; `Enter` para continuar | Botones del modal |

En pantallas táctiles se muestran los controles automáticamente. En vertical aparece un aviso para girar el dispositivo, aunque el juego sigue siendo utilizable.

## Cómo se juega

- Hay **4 sectores** con estética y peligros propios: ciudad, vertedero clandestino, tuberías de lixiviados y planta de reciclaje.
- Cada sector tiene un **presupuesto de tiempo independiente**: 2:00 en Fácil, 1:30 en Medio y 1:00 en Difícil. El reloj se recarga al superar un checkpoint.
- Al llegar a una puerta de checkpoint se abre una pregunta. Si aciertas, se guarda el progreso, sumas 500 puntos y recuperas el tiempo del sector.
- Si fallas, vuelves al último checkpoint y el tiempo del sector se restablece. No se reinicia toda la partida.
- Los chips y teléfonos recuperados suman puntos. Los bloques `?` entregan un teléfono reciclado; los ladrillos pueden romperse.
- Al llegar a la bandera comienza la secuencia final y se muestra el resumen de la partida.
- Si el tiempo del sector llega a cero, la partida termina y puedes reintentar el nivel.

Consejo: el parámetro `?autostart=1` inicia una partida directamente con la configuración por defecto.

## Estructura del proyecto

```text
.
├── src/
│   ├── components/       # Pantallas, HUD, modales y controles táctiles
│   ├── game/             # Física, nivel, preguntas, renderer, audio y tipos
│   ├── App.tsx           # Máquina de estados del juego
│   └── main.tsx
├── index.html
├── vite.config.ts
└── backend-spring-boot/  # API REST opcional (Java 17 + Spring Boot 3)
```

## Backend opcional (Spring Boot)

El frontend no consume la API; se incluye como referencia académica y para extender el proyecto. Para ejecutarlo:

```bash
cd backend-spring-boot
mvn spring-boot:run
```

La API queda en <http://localhost:8080>. Usa una base H2 en memoria y crea las 10 preguntas iniciales al arrancar. La consola H2 está en <http://localhost:8080/h2-console> con URL `jdbc:h2:mem:ecodb`, usuario `sa` y contraseña vacía.

### Endpoints principales

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/v1/questions/random?difficulty=medio&excluded=1,2` | Público |
| `POST` | `/api/v1/questions/validate` | Público |
| `POST` | `/api/v1/auth/register` | Público |
| `POST` | `/api/v1/auth/login` | Público |
| `GET` | `/api/v1/scores/leaderboard` | Público |
| `POST` | `/api/v1/scores` | Requiere `Authorization: Bearer <token>` |

Ejemplo de validación:

```json
POST /api/v1/questions/validate
{
  "questionId": 1,
  "selectedAnswer": "A"
}
```

La configuración (base de datos, JWT, CORS y consola H2) está en `backend-spring-boot/src/main/resources/application.properties`. Los orígenes permitidos por defecto son `localhost:3000`, `localhost:5173` y `localhost:4173`. Antes de desplegar el backend en producción, sustituye `app.jwt.secret` por una clave propia y cambia la base de datos a PostgreSQL.

## Pruebas

```bash
npm test
npm run lint
```

Las pruebas cubren colisiones AABB, salto, plataformas móviles, formato del temporizador, integridad del nivel (suelo, checkpoints, pits y bandera), banco de preguntas y selección ponderada.

## Solución de problemas

- **`npm install` falla por versiones de esbuild/Vite:** usa Node 20.19+ y elimina `node_modules` y `package-lock.json` antes de reinstalar. Las dependencias ya están fijadas para Vite 8.
- **El puerto 3000 está ocupado:** ejecuta `npm run dev -- --port 3001`.
- **No se oye audio:** los navegadores bloquean el audio hasta la primera interacción; pulsa un botón o una tecla. También revisa el botón de silencio (`M`).
- **El backend no compila:** confirma que `java -version` y `mvn -version` funcionan y que Java es 17 o superior.
- **Pantalla en blanco al publicar en una subcarpeta:** conserva `base: './'` en `vite.config.ts`.

## Créditos

Proyecto educativo sobre basura electrónica y consumo responsable. Las fuentes y referencias científicas (Codexverde, BioBioChile, Semana y OMS) se muestran dentro de la pantalla de créditos del juego.
