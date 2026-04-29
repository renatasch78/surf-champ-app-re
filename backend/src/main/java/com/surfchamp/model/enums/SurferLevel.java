package com.surfchamp.model.enums;

public enum SurferLevel {
    BEGINNER("Iniciante"),
    INTERMEDIATE("Intermediário"),
    ADVANCED("Avançado"),
    PROFESSIONAL("Profissional");
    
    private final String description;
    
    SurferLevel(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}
