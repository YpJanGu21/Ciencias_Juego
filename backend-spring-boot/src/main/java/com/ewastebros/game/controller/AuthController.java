package com.ewastebros.game.controller;

import com.ewastebros.game.model.User;
import com.ewastebros.game.repository.UserRepository;
import com.ewastebros.game.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@RequestBody AuthRequestDto request) {
        if (request == null || isBlank(request.username()) || isBlank(request.password())) {
            return ResponseEntity.badRequest()
                    .body(new AuthResponseDto(null, "Usuario y contraseña son obligatorios"));
        }

        String username = request.username().trim();

        if (username.length() < 3 || username.length() > 50) {
            return ResponseEntity.badRequest()
                    .body(new AuthResponseDto(null, "El usuario debe tener entre 3 y 50 caracteres"));
        }
        if (request.password().length() < 4) {
            return ResponseEntity.badRequest()
                    .body(new AuthResponseDto(null, "La contraseña debe tener al menos 4 caracteres"));
        }
        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest()
                    .body(new AuthResponseDto(null, "El nombre de usuario ya existe"));
        }

        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(request.password()))
                .role("ROLE_USER")
                .build();

        userRepository.save(user);
        String token = jwtService.generateToken(user.getUsername());
        return ResponseEntity.ok(new AuthResponseDto(token, "Usuario registrado exitosamente"));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@RequestBody AuthRequestDto request) {
        if (request == null || isBlank(request.username()) || isBlank(request.password())) {
            return ResponseEntity.badRequest()
                    .body(new AuthResponseDto(null, "Usuario y contraseña son obligatorios"));
        }

        User user = userRepository.findByUsername(request.username().trim()).orElse(null);

        if (user == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            return ResponseEntity.status(401)
                    .body(new AuthResponseDto(null, "Credenciales incorrectas"));
        }

        String token = jwtService.generateToken(user.getUsername());
        return ResponseEntity.ok(new AuthResponseDto(token, "Inicio de sesión exitoso"));
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public record AuthRequestDto(String username, String password) {
    }

    public record AuthResponseDto(String token, String message) {
    }
}
