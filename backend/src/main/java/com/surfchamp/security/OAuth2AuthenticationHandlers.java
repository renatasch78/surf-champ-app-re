package com.surfchamp.security;

import com.surfchamp.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
public class OAuth2AuthenticationHandlers implements AuthenticationSuccessHandler, AuthenticationFailureHandler {

    private final UserService userService;

    @Value("${app.auth.frontend-callback-url:http://localhost:3000/login}")
    private String frontendCallbackUrl;

    public OAuth2AuthenticationHandlers(UserService userService) {
        this.userService = userService;
    }

    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest request,
        HttpServletResponse response,
        Authentication authentication
    ) throws IOException, ServletException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");

        String token = userService.loginOrRegisterWithGoogle(email);
        String redirect = frontendCallbackUrl + "?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        response.sendRedirect(redirect);
    }

    @Override
    public void onAuthenticationFailure(
        HttpServletRequest request,
        HttpServletResponse response,
        org.springframework.security.core.AuthenticationException exception
    ) throws IOException, ServletException {
        String redirect = frontendCallbackUrl + "?error=" +
            URLEncoder.encode("google_auth_failed", StandardCharsets.UTF_8);
        response.sendRedirect(redirect);
    }
}
