

## Plan: Adicionar botão "Bi-Set" na barra de ações do treinador

### O que será feito
Adicionar um terceiro botão **"+ Bi-Set"** ao lado dos botões existentes "Exercício" e "Bloco Livre". Esse botão insere automaticamente **2 exercícios já vinculados como bi-set** (com o mesmo `superset_group_id`), economizando o tempo do treinador que hoje precisa adicionar 2 exercícios separados e depois vincular manualmente.

### Mudança única: `src/pages/trainer/TrainerWorkouts.tsx`

**1. Nova função `addBiSet`** (ao lado de `addExercise` e `addMetcon`):
- Gera um `superset_group_id` compartilhado
- Insere 2 itens do tipo `exercise` já vinculados com esse group ID
- O primeiro exercício não tem indicador visual de bi-set (é o "líder"), o segundo sim
- Ambos com campos padrão (sets: 3, reps: "10", etc.)

**2. Novo botão na barra de ações** (linha ~562-565):
- Ícone: `Link2` (já importado) — representa a ligação bi-set
- Label: **"Bi-Set"**
- Mesmo estilo `variant="outline" size="sm"` dos outros botões
- Posição: entre "Exercício" e "Bloco Livre"

### Resultado esperado
O treinador clica em "Bi-Set" e já recebe 2 cards de exercício vinculados, prontos para selecionar os movimentos e configurar séries/reps/carga. Sem etapas extras.

