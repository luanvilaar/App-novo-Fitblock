# FitBlock — Especificação do parser (linguagem natural → treino)

Documento de referência para **desenvolvimento** e para **prompts de IA**. A interpretação estrutural é **determinística** (tokenizer + parser em `src/lib/workout-parser/`). A IA **não substitui** o parser: apenas **refina textos** (gramática, clareza) e pode **sugerir** reescrita em sintaxe canónica.

---

## 1. Princípios

| Camada | Responsabilidade |
|--------|------------------|
| **Parser local** | Contagem e ordem de blocos e exercícios, bi-sets, exercícios combinados, prescrições (séries, reps, carga, tempo, distância), cabeçalhos de bloco, notas globais. |
| **IA (híbrido)** | Corrigir **gramática e clareza** em `globalNotes`, `notes` de bloco e `notes` de exercício; opcionalmente devolver **dicas** e **texto canónico sugerido** para o treinador copiar. |
| **IA (proibido)** | Alterar número de blocos/exercícios, ordem, flags de bi-set/combinado, valores de prescrição (salvo erro óbvio de digitação acordado no prompt). |

---

## 2. Tokens por linha (tokenizer)

Cada linha é classificada num tipo (coluna “Token_Type” no editor em grelha):

- **`BLOCK_HEADER`** — Início de bloco:
  - `*TÍTULO*` (asteriscos), ou
  - linha **só em maiúsculas** (ex.: `CONDICIONAMENTO`, `FORÇA`), sem começar por dígito ou `-`.
- **`EXERCISE`** — Exercício isolado:
  - `-Nome-` ou `-Nome` (hífen aberto), ou
  - `<Nome>`
- **`EXERCISE_BISET`** — Primeiro exercício de **bi-set** (par em superset):
  - `-Nome-+` ou `<Nome>+`
- **`EXERCISE_COMBINED`** — Movimento **combinado** (não é bi-set):
  - `-A + B-` ou `<A + B>` (o `+` **dentro** do nome).
- **`PRESCRIPTION`** — Dados de prescrição “puros” (sem nome de exercício na mesma linha):
  - `4 x 10`, `5 x 6-8`, pirâmide `21-15-9`, só carga (`60kg`), só tempo (`90seg`), `descanse…` / `intervalo…`, etc.
- **`FORMAT_INDICATOR`** — `FOR TIME`, `AMRAP`, `EMOM`, `TC: …`, etc.
- **`SEPARATOR`** — Linha só com `---` (dois ou mais hífens): separador / notas conforme contexto do parser.
- **`TEXT`** — Texto livre que **não** casou regra acima; no parser, costuma ir para **notas** do exercício/bloco consoante o estado.

Linhas como `cargas pesadas` ou notas curtas aparecem muitas vezes como **`TEXT`**: são **observações**, não “DATA” de séries/reps.

---

## 3. Bi-set vs combinado

- **Bi-set**: duas linhas de exercício **seguidas**, a primeira terminada em `+`. Exemplo:
  ```text
  <Back Squat>+
  5 x 6-8
  <Leg Press>
  5 x 6-8
  ```
  (o parser emparelha segundo a implementação em `parser.ts`.)
- **Combinado**: um único exercício cujo nome contém `+` dentro de `< >` ou `- -`.

---

## 4. Exercícios “inline”

Linhas que começam por número + nome ou distância + nome são tratadas como **novo exercício** com prescrição embutida, ex.:

- `12-15 Leg Extension Machine`
- `500m Corrida`

---

## 5. Sintaxe canónica recomendada (para sugestões da IA)

- Blocos: `*FORÇA*`, `*CONDICIONAMENTO*`
- Exercício: `<Back Squat>` ou `-Back Squat-`
- Bi-set: `<A>+` na primeira linha, depois prescrição e segundo exercício `<B>`
- Notas longas: após `------` ou em linhas `TEXT` após o exercício
- Evitar misturar no mesmo token o que é **nome** e o que é **série/reps** sem o formato `N x M`

---

## 6. Integração com a edge function `ai-workout-parser`

O cliente envia `text` + `parsedLocal` (JSON do parser local). A IA deve devolver o **mesmo esqueleto** que `parsedLocal` (validado por `structureMatches` no cliente) e pode acrescentar o objeto opcional `assistantGuidance` (dicas + texto canónico sugerido).

---

## 7. Ficheiros de código

- `src/lib/workout-parser/tokenizer.ts` — classificação de linhas
- `src/lib/workout-parser/parser.ts` — AST do treino
- `src/lib/workoutParser.ts` — adaptador legado para a UI
- `src/lib/ai-workout-hybrid.ts` — normalização da resposta e validação estrutural
- `supabase/functions/ai-workout-parser/index.ts` — chamada ao modelo e system prompt
