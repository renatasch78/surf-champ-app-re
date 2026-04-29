# Dependência Mockito Adicionada

## Problema Resolvido
- **Erro**: `package org.mockito does not exist`
- **Causa**: Dependência Mockito não estava no projeto
- **Solução**: Adicionada dependência `mockito-core` ao pom.xml

## Configuração Aplicada

### pom.xml
```xml
<!-- Mockito for mocking in development -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <scope>compile</scope>
</dependency>
```

### Observações
- Scope `compile` permite uso em tempo de execução (não apenas testes)
- Necessário para mocks no perfil local
- Spring Boot Test já inclui Mockito, mas com scope `test`

## Próximos Passos
1. Recarregar dependências Maven
2. Testar compilação do LocalAwsS3Config
3. Executar aplicação com perfil local
