package com.surfchamp.model.enums;

public enum Stance {
    REGULAR("Regular (pé esquerdo à frente)"),
    GOOFY("Goofy (pé direito à frente)");
    
    private final String description;
    
    Stance(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}
