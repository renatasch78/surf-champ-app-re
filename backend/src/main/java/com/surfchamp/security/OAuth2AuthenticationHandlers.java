package com.surfchamp.security;

import com.surfchamp.controller.AuthController;
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
        String callback = frontendCallbackUrl;
        Object sessionRedirect = request.getSession(false) != null
            ? request.getSession(false).getAttribute(AuthController.OAUTH2_REDIRECT_SESSION_KEY)
            : null;
        if (sessionRedirect instanceof String redirectFromSession && !redirectFromSession.isBlank()) {
            callback = redirectFromSession;
        }

        if (request.getSession(false) != null) {
            request.getSession(false).removeAttribute(AuthController.OAUTH2_REDIRECT_SESSION_KEY);
        }

        String redirect = callback + "?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        response.sendRedirect(redirect);
    }

    @Override
    public void onAuthenticationFailure(
        HttpServletRequest request,
        HttpServletResponse response,
        org.springframework.security.core.AuthenticationException exception
    ) throws IOException, ServletException {
        String callback = frontendCallbackUrl;
        Object sessionRedirect = request.getSession(false) != null
            ? request.getSession(false).getAttribute(AuthController.OAUTH2_REDIRECT_SESSION_KEY)
            : null;
        if (sessionRedirect instanceof String redirectFromSession && !redirectFromSession.isBlank()) {
            callback = redirectFromSession;
        }

        if (request.getSession(false) != null) {
            request.getSession(false).removeAttribute(AuthController.OAUTH2_REDIRECT_SESSION_KEY);
        }

        String redirect = callback + "?error=" +
            URLEncoder.encode("google_auth_failed", StandardCharsets.UTF_8);
        response.sendRedirect(redirect);
    }
}
