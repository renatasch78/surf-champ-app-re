package com.surfchamp.exception;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                  HttpHeaders headers,
                                                                  HttpStatusCode status,
                                                                  WebRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", "Erro de Validação");
        
        // Get all validation errors
        Map<String, String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fieldError -> fieldError.getDefaultMessage() != null ? 
                                fieldError.getDefaultMessage() : "Erro de validação"
                ));
        
        body.put("errors", errors);
        
        return new ResponseEntity<>(body, headers, status);
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
                                                                HttpHeaders headers,
                                                                HttpStatusCode status,
                                                                WebRequest request) {
        String error = "Requisição JSON inválida";
        String detail = ex.getMostSpecificCause().getMessage();
        String field = "desconhecido";
        String value = "desconhecido";
        String expectedFormat = "desconhecido";
        
        // Log the full error for debugging
        System.err.println("=== ERRO NA REQUISIÇÃO ===");
        System.err.println("Mensagem: " + ex.getMessage());
        System.err.println("Causa: " + (ex.getCause() != null ? ex.getCause().getMessage() : "N/A"));
        
        if (ex.getCause() instanceof InvalidFormatException) {
            InvalidFormatException ife = (InvalidFormatException) ex.getCause();
            field = ife.getPath().get(ife.getPath().size() - 1).getFieldName();
            value = ife.getValue() != null ? ife.getValue().toString() : "null";
            expectedFormat = ife.getTargetType() != null ? ife.getTargetType().getSimpleName() : "desconhecido";
            
            if (ife.getTargetType() != null && ife.getTargetType().isAssignableFrom(LocalDate.class)) {
                expectedFormat = "Data no formato dd/MM/yyyy (ex: 31/12/1990)";
            }
            
            error = String.format("Valor inválido '%s' para o campo '%s'.", value, field);
            detail = String.format("Formato esperado: %s", expectedFormat);
            
            System.err.println("Campo: " + field);
            System.err.println("Valor recebido: " + value);
            System.err.println("Tipo esperado: " + expectedFormat);
            
        } else if (ex.getCause() instanceof JsonMappingException) {
            JsonMappingException jme = (JsonMappingException) ex.getCause();
            error = "Erro no mapeamento JSON";
            detail = jme.getOriginalMessage();
            
            // Try to extract field name from the path
            if (jme.getPath() != null && !jme.getPath().isEmpty()) {
                field = jme.getPath().get(0).getFieldName();
            }
            
            System.err.println("Erro de mapeamento no campo: " + field);
            System.err.println("Detalhes: " + detail);
            
        } else if (ex.getCause() instanceof MismatchedInputException) {
            MismatchedInputException mie = (MismatchedInputException) ex.getCause();
            if (mie.getPath() != null && !mie.getPath().isEmpty()) {
                field = mie.getPath().get(0).getFieldName();
                expectedFormat = mie.getTargetType() != null ? mie.getTargetType().getSimpleName() : "desconhecido";
                
                if (mie.getTargetType() != null && mie.getTargetType().isAssignableFrom(LocalDate.class)) {
                    expectedFormat = "Data no formato dd/MM/yyyy (ex: 31/12/1990)";
                }
                
                error = String.format("Tipo de dado inválido para o campo '%s'", field);
                detail = String.format("Tipo esperado: %s", expectedFormat);
                
                System.err.println("Campo com tipo inválido: " + field);
                System.err.println("Tipo esperado: " + expectedFormat);
            }
        }
        
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", "Erro na requisição");
        body.put("message", error);
        body.put("detail", detail);
        body.put("path", ((ServletWebRequest)request).getRequest().getRequestURI());
        
        return new ResponseEntity<>(body, headers, status);
    }

    @ExceptionHandler(FileValidationException.class)
    public ResponseEntity<Object> handleFileValidationException(
            FileValidationException ex, WebRequest request) {
        
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Validação de Arquivo Falhou");
        body.put("message", ex.getMessage());
        
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleAllExceptions(Exception ex, WebRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("error", "Erro Interno do Servidor");
        body.put("message", ex.getMessage() != null ? ex.getMessage() : "Ocorreu um erro inesperado");
        
        // Log the exception
        ex.printStackTrace();
        
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
