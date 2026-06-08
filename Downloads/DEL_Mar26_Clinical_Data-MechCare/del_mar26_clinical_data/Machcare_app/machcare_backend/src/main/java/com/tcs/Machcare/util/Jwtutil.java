package com.tcs.Machcare.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class Jwtutil {

    // ✅ Fixed secret key: remains same after every backend restart
    // Must be at least 32 characters for HS256
    private static final String SECRET =
            "MachCareLocalJwtSecretKeyForHS256MinimumThirtyTwoCharacters12345";

    private static final SecretKey SECRET_KEY =
            Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    private static final long EXPIRATION_TIME = 86400000; // 1 Day

    // 1. Generate Token
    public String generateToken(Long empId, Integer roleId, String name) {
        return Jwts.builder()
                .setSubject(String.valueOf(empId))
                .claim("roleId", roleId)
                .claim("name", name)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SECRET_KEY)
                .compact();
    }

    // 2. Extract Employee ID
    public Long extractEmpId(String token) {
        Claims claims = getClaimsFromToken(token);
        return Long.parseLong(claims.getSubject());
    }

    // 3. Extract Role ID
    public Integer extractRoleId(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.get("roleId", Integer.class);
    }

    // 4. Extract Name
    public String extractName(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.get("name", String.class);
    }

    // 5. Optional token validation helper
    public boolean isTokenValid(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    // Helper method
    private Claims getClaimsFromToken(String token) {
        String cleanToken = cleanToken(token);

        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(cleanToken)
                .getBody();
    }

    private String cleanToken(String token) {
        if (token == null) {
            return "";
        }

        if (token.startsWith("Bearer ")) {
            return token.substring(7);
        }

        return token;
    }
}