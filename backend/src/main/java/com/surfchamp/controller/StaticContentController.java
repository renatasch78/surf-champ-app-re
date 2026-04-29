package com.surfchamp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class StaticContentController {

    @GetMapping("/teste-insercao")
    public String testeInsercao() {
        return "forward:/teste-insercao.html";
    }
    
    @GetMapping("/surfistas")
    public String listarSurfistas() {
        return "forward:/surfistas.html";
    }
}
