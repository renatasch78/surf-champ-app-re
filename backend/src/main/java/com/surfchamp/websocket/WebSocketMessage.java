package com.surfchamp.websocket;

import com.surfchamp.model.VideoResult;

public class WebSocketMessage {
    private String tipo;
    private VideoResult dados;

    public WebSocketMessage() {
    }

    public WebSocketMessage(String tipo, VideoResult dados) {
        this.tipo = tipo;
        this.dados = dados;
    }

    // Getters e Setters
    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public VideoResult getDados() {
        return dados;
    }

    public void setDados(VideoResult dados) {
        this.dados = dados;
    }
}
