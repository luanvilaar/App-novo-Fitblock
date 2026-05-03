# Plano de Integração — Prescrição Inteligente de Treinos

## Objetivo
Permitir que o treinador escreva treinos em linguagem natural e o sistema converta automaticamente em uma interface visual estruturada.

---

## Arquitetura

### 1. Entrada (Prescrição do Coach)
Editor textual estilo planilha:
- Escrita livre
- Sem travas
- Suporte a múltiplas linhas

### Sintaxe:
- **BLOCO** → bloco livre
- <Exercício> → exercício isolado
- <Exercício>+ → início de bi-set
- -- → separação de rounds
- ------ → observações

---

### 2. Parser (Interpretação)
Funções:
- tokenizeWorkoutText
- parseWorkoutTokens
- mapParsedWorkoutToForm

Responsabilidades:
- Identificar blocos
- Identificar exercícios
- Identificar bi-sets
- Identificar formatos (FOR TIME, AMRAP, etc.)
- Interpretar séries, reps, carga

---

### 3. Estrutura de Dados (JSON)

```ts
type WorkoutStructure = {
  blocks: WorkoutBlock[]
}
```

---

### 4. Conversão para UX

Mapear para:
- Card de exercício
- Card de bi-set
- Card de bloco livre

---

### 5. Fluxo

1. Coach escreve
2. Clica em "Converter"
3. Sistema interpreta
4. UI é gerada
5. Coach ajusta manualmente

---

### 6. Requisitos

- Parser desacoplado da UI
- Tolerância de escrita
- Fallback para erros
- Compatível com edição manual

---

## Roadmap

### Fase 1
- Exercício isolado
- Bi-set
- Blocos
- FOR TIME, AMRAP, EMOM

### Fase 2
- Time cap
- Score
- Observações

### Fase 3
- Preview em tempo real
- Autocomplete
- Sugestões inteligentes

---

## Conclusão

Sistema híbrido:
Texto rápido + Estrutura inteligente + UX visual limpa
