# Task: Implementar Ranking Semanal para Box

**Task ID:** `implement-ranking`
**Pattern:** HO-TP-001 (Task Anatomy Standard)
**Version:** 1.0.0
**Last Updated:** 2026-03-13

## Task Anatomy

| Field | Value |
|---|---|
| **task_name** | Implementar Ranking Semanal para Box |
| **status** | `pending` |
| **responsible_executor** | @ranking-orchestrator |
| **execution_type** | `Hybrid` |
| **input** | Briefing `pulsefit.md`, schema do DB |
| **output** | Código implementado, queries SQL, componentes de UI |
| **action_items** | 5 steps |
| **acceptance_criteria** | 4 criteria |

**Estimated Time:** 8h

## Executor Specification

| Attribute | Value |
|---|---|
| **Type** | Hybrid |
| **Executor** | @ranking-orchestrator |
| **Rationale** | Requer orquestração entre frontend (UI Specialist) e backend (Supabase Architect). O orchestrator gerencia o fluxo. |

## Overview

Esta task implementa a funcionalidade completa de ranking semanal para uma nova box afiliada (PulseFit), conforme descrito no `pulsefit.md`.

## Action Items

### Step 1: Modelagem de Dados
- **Executor:** @supabase-data-architect
- **Ação:** Modificar o schema do Supabase para suportar múltiplas boxes. Adicionar uma tabela `boxes` e uma `foreign key` `box_id` na tabela de usuários e resultados.
- **Output:** Script de migração SQL.

### Step 2: Configuração de Segurança
- **Executor:** @supabase-data-architect
- **Ação:** Implementar Row Level Security (RLS) para garantir que cada box só possa ver seus próprios alunos e resultados.
- **Output:** Políticas RLS para as tabelas relevantes.

### Step 3: Criação da Query de Ranking
- **Executor:** @supabase-data-architect
- **Ação:** Desenvolver uma `Edge Function` ou `View` no Supabase que calcule o ranking semanal, aceitando `box_id`, `gender` e `age_range` como parâmetros.
- **Output:** Código da Edge Function ou View SQL.

### Step 4: Implementação da UI
- **Executor:** @ui-ranking-specialist
- **Ação:** Desenvolver os componentes React (usando Shadcn) para os filtros de Gênero e Faixa Etária.
- **Output:** Componentes React (`GenderFilter.tsx`, `AgeFilter.tsx`).

### Step 5: Integração Frontend-Backend
- **Executor:** @ui-ranking-specialist
- **Ação:** Criar um hook customizado (`useWeeklyRanking`) que chama a função do Supabase e atualiza o estado do ranking na UI conforme os filtros mudam.
- **Output:** Hook `useWeeklyRanking.ts` e componente principal do ranking.

## Acceptance Criteria

- [ ] **AC-1:** O ranking geral da PulseFit é exibido corretamente, mostrando todos os alunos.
- [ ] **AC-2:** Os filtros de Gênero (Masculino/Feminino) funcionam e atualizam o ranking dinamicamente.
- [ ] **AC-3:** Os filtros de Faixa Etária funcionam e podem ser combinados com o filtro de gênero.
- [ ] **AC-4:** Os dados da PulseFit estão isolados e não aparecem no ranking da FitBlock Training (e vice-versa).
