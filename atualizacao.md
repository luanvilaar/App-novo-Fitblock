Quero implementar no meu web app de treinos um construtor inteligente de treino baseado em linguagem natural.

O sistema deve ter duas camadas:
1. Entrada (prescrição do coach)
2. Saída (visualização para o aluno)

-----------------------------------
1. UX DA ENTRADA (PRESCRIÇÃO)
-----------------------------------

A aba de prescrição deve se comportar como uma planilha estilo Excel.

Requisitos obrigatórios:

- Interface em grade (linhas e colunas)
- Cada linha representa uma linha de texto da prescrição
- Navegação com teclado (Enter, Tab, setas)
- Edição rápida e fluida, sem travamentos
- Possibilidade de colar treinos completos (Ctrl+V)
- Suporte a múltiplas linhas automaticamente
- Scroll vertical contínuo (como planilha)
- Cursor sempre visível e fluido

Comportamento:
- O coach escreve de forma livre, como se estivesse em um bloco de notas ou Excel
- O sistema NÃO deve forçar estrutura durante a digitação
- A interpretação acontece em tempo real ou sob demanda

Objetivo:
Dar velocidade máxima para o coach escrever o treino, sem fricção.

-----------------------------------
2. PARSER (INTERPRETAÇÃO DO TEXTO)
-----------------------------------

O sistema deve ler o conteúdo escrito e interpretar com base nas seguintes regras:

1. Blocos de treino
Texto entre asteriscos:
*FORÇA*
*CONDICIONAMENTO*
*ENDURANCE*
= criar um bloco de treino

2. Exercícios isolados
Texto entre hífens:
-Bench Press-
-Hollow Rocks-
= exercício individual

3. Bi-set
Exercício terminado com “+”:
-Bench Press-+
4 x 10-12
-Triceps Rope-
4 x 10-12

= bi-set entre os dois exercícios

Regra:
- Se ambos tiverem prescrição → cada um mantém sua estrutura
- Se apenas um tiver → pode herdar (configurável)

4. Exercício combinado
Se “+” estiver dentro do nome:
-V-Ups + Tucks-
= exercício combinado (não é bi-set)

5. Estrutura de prescrição
Linhas abaixo do exercício representam:
- séries
- repetições
- carga
- intervalo
- observações

6. Blocos condicionantes
Identificar formatos automaticamente:
- AMRAP
- For Time
- EMOM
- E2MOM / E3MOM / E6MOM
- intervalado
- circuito
- not for time
- rounds fixos

7. Observações
Linha com:
------
Tudo abaixo = notas, score ou regras do treino

8. Endurance
Identificar:
- rounds
- distância
- tempo
- pace/ritmo
- time cap

9. Tolerância de escrita
Aceitar variações como:
- 4x10 / 4 x 10
- 1min / 60s / 1:00
- TC / Time cap
- rounds / Rounds

-----------------------------------
3. SAÍDA (VISUAL PARA O ALUNO)
-----------------------------------

O sistema deve transformar o texto em blocos visuais organizados:

- Blocos separados por categoria
- Cards para exercícios
- Cards específicos para bi-set
- Destaque para formato do treino (EMOM, AMRAP, etc.)
- Seção de observações
- Exibição clara de:
  - séries
  - reps
  - carga
  - tempo
  - rounds
  - score

-----------------------------------
4. ESTRUTURA DE DADOS (JSON)
-----------------------------------

Gerar estrutura como:

- block_title
- block_category
- format_type
- exercises
- sets
- reps
- load
- distance
- duration
- interval
- rounds
- time_cap
- score_type
- notes
- type (single, bi-set, combined)

-----------------------------------
5. OBJETIVO FINAL
-----------------------------------

O coach escreve rápido como no Excel.
O sistema entende automaticamente.
O aluno recebe um treino limpo, organizado e profissional.

-----------------------------------
EXEMPLO IMPORTANTE

Entrada:

-Bench Press-+
4 x 10-12
-Triceps Rope-
4 x 10-12

Saída esperada:

Tipo: Bi-set  
Exercícios:
- Bench Press (4x10-12)
- Triceps Rope (4x10-12)

Execução:
Alternado sem descanso entre eles.