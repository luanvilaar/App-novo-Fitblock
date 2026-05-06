# STORY UI-001: Mobile App Redesign FitBlock

**ID:** UI-001  
**Epic:** Mobile App Redesign  
**Sprint:** 1  
**Points:** 21  
**Priority:** High  
**Created:** 2026-05-03  
**Status:** ✅ Ready for Review

---

## User Story

**Como** aluno ou treinador que usa o FitBlock principalmente no celular,  
**Quero** uma interface com cara de app mobile, mais densa, rápida e consistente,  
**Para que** eu consiga acessar, navegar e executar minhas tarefas com clareza e sensação de produto premium.

---

## Goal & Context

Esta story implementa o redesign mobile-first do FitBlock usando `design_system_fitblock.md` como referência visual principal. O foco é levar todas as rotas não-admin para uma linguagem de app escuro, com superfícies quase pretas, pills, contraste alto, navegação persistente e hierarquia otimizada para uso com uma mão.

O trabalho cobre:
- fundação visual global
- login/home do web app
- shell e dashboards do treinador
- shell e dashboards do aluno
- alinhamento das rotas públicas/de apoio ao mesmo sistema
- redesign da timeline de periodização para coach e aluno
- ajuste de contraste monocromático dos cards de atletas (coach)
- simplificação visual do hero e dos cards de métricas no dashboard do coach

Fica fora do escopo:
- alterações de schema ou regras Supabase
- redesign dedicado do painel admin
- mudanças de autorização ou redirects de papel

---

## Acceptance Criteria

- [x] AC1: `src/index.css` define tokens globais dark mobile-first com tipografia, radius pill/circle, contrastes e safe-area utilities.
- [x] AC2: `Button`, `Input`, `Select`, `Card`, `Tabs` e overlays compartilham a nova linguagem visual.
- [x] AC3: `/` funciona como home/login do app com hero curto, autenticação integrada e estados de erro/loading consistentes.
- [x] AC4: rotas públicas/de apoio (`ResetPassword`, `TrainerRegister`, `Politicas`, `PublicRanking`, `NotFound`) seguem o novo sistema visual.
- [x] AC5: `TrainerLayout` usa shell mobile persistente e aplica o redesign às rotas `/trainer/*`.
- [x] AC6: `ClientLayout` e `BottomNav` usam shell mobile persistente e aplicam o redesign às rotas `/dashboard/*`.
- [x] AC7: dashboards principais de coach e aluno ficam visualmente alinhados ao novo sistema, sem alterar regras de negócio.
- [x] AC8: redirects e comportamento por papel continuam inalterados.
- [x] AC9: `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` foram executados ao final, com resultado registrado abaixo.

---

## Key Implementation Notes

- Referência visual principal: `design_system_fitblock.md`
- A área do aluno foi rebaseada para o sistema preto/branco/cinza do documento, sem gradientes, glassmorphism ou verde residual
- Substituição prática da tipografia proprietária: fonte grotesk arredondada disponível via web font
- Rotas-alvo principais:
  - `/`
  - `/trainer/*`
  - `/dashboard/*`
  - rotas públicas/de apoio ligadas a autenticação e navegação pública
- Arquivos críticos esperados:
  - `src/index.css`
  - `src/App.css`
  - `src/components/ui/*`
  - `src/components/TrainerLayout.tsx`
  - `src/components/ClientLayout.tsx`
  - `src/components/BottomNav.tsx`
  - `src/pages/Index.tsx`
  - páginas trainer/client/public relevantes

---

## Tasks

- [x] Criar e aplicar a fundação visual global dark mobile-first
- [x] Atualizar primitives compartilhados
- [x] Redesenhar login/home e telas públicas/de apoio
- [x] Redesenhar shell e páginas principais do treinador
- [x] Redesenhar shell e páginas principais do aluno
- [x] Redesenhar o calendário de periodização como timeline compacta com edição em lote para coach
- [x] Ajustar contraste dos cards de atletas para melhor separação do background
- [x] Simplificar hero e métricas do dashboard para melhorar leitura e hierarquia
- [x] Rodar quality gates
- [x] Atualizar checklist e file list antes de concluir

---

## Testing Guidance

- Validar viewports mobile de referência: `390x844` e `430x932`
- Conferir estados de loading, vazio, erro, sucesso e desabilitado
- Verificar redirects:
  - visitante -> `/`
  - aluno -> `/dashboard`
  - treinador -> `/trainer`
  - admin -> `/admin`
- Conferir foco visível, contraste e targets de 44x44

---

## Checklist

- [x] Story criada em `docs/stories/`
- [x] Escopo alinhado ao plano aprovado
- [x] Design tokens globais atualizados
- [x] Shell mobile aplicado a coach e aluno
- [x] Páginas públicas/de apoio alinhadas
- [x] Quality gates executados
- [x] File list atualizada
- [x] Iteração premium white minimal do dashboard/sessão do aluno concluída

---

## Validation Results

- 2026-05-04 premium white minimal pass:
  - `npm run lint`: ✅ passou sem erros; restaram `20` warnings não bloqueantes já existentes de `react-refresh` e `react-hooks/exhaustive-deps`
  - `npm run typecheck`: ✅ passou
  - `npm test`: ✅ passou (`11` arquivos, `125` testes)
  - `npm run build`: ✅ passou; restou apenas o warning não bloqueante de chunks acima de `500 kB`
- `npm run lint`: ✅ passou sem erros; restaram `20` warnings não bloqueantes já existentes de `react-refresh` e `react-hooks/exhaustive-deps`
- `npm run typecheck`: ✅ passou
- `npm test`: ✅ passou (`11` arquivos, `125` testes)
- `npm run build`: ✅ passou; restou apenas o warning não bloqueante de chunks acima de `500 kB`
- `npx eslint src/components/ClientLayout.tsx src/components/BottomNav.tsx src/components/PremiumPerformanceChart.tsx src/components/client/ExecutionGridPremium.tsx src/components/client/ExerciseExecutionDetail.tsx src/components/client/StudentPagePrimitives.tsx src/pages/client/ClientSessionHub.tsx src/pages/client/ClientHistory.tsx src/pages/client/ClientProgress.tsx src/pages/client/ClientProfile.tsx src/pages/client/FindTrainers.tsx src/pages/client/WorkoutExecution.tsx`: ✅ passou sem warnings
- `npx eslint src/App.tsx src/components/ClientLayout.tsx src/components/BottomNav.tsx src/components/PremiumPerformanceChart.tsx src/components/client/ExerciseExecutionDetail.tsx src/components/client/ExecutionGridPremium.tsx src/pages/client/ClientSessionHub.tsx src/pages/client/WorkoutExecution.tsx src/pages/client/ClientHistory.tsx src/pages/client/ClientProgress.tsx src/pages/client/FindTrainers.tsx src/pages/client/ClientProfile.tsx`: ✅ passou sem warnings
- `npx eslint src/pages/client/ClientHome.tsx src/components/ClientLayout.tsx src/components/BottomNav.tsx`: ✅ passou sem warnings
- `npx eslint src/pages/trainer/TrainerDashboard.tsx src/components/PremiumActivityChart.tsx`: ✅ passou com 1 warning antigo de `useEffect` em `TrainerDashboard`
- `npx eslint src/components/client/StudentPeriodizationStrip.tsx src/hooks/useTrainingPeriodWeeks.ts src/lib/training-periodization.ts`: ✅ passou sem warnings

Também foram corrigidas as falhas globais de tipagem/lint que bloqueavam o push antes deste fechamento.

---

## File List

- [x] 2026-05-04 premium pass: `src/components/BottomNav.tsx`
- [x] 2026-05-04 premium pass: `src/components/ClientLayout.tsx`
- [x] 2026-05-04 premium pass: `src/components/client/StudentPagePrimitives.tsx`
- [x] 2026-05-04 premium pass: `src/pages/client/ClientHome.tsx`
- [x] 2026-05-04 premium pass: `src/pages/client/ClientSessionHub.tsx`
- [x] 2026-05-04 premium pass: `docs/stories/story-ui-mobile-redesign-fitblock.md`
- [x] `docs/stories/story-ui-mobile-redesign-fitblock.md`
- [x] `eslint.config.js`
- [x] `src/components/BottomNav.tsx`
- [x] `src/components/ClientLayout.tsx`
- [x] `src/components/PremiumActivityChart.tsx`
- [x] `src/components/PremiumPerformanceChart.tsx`
- [x] `src/components/client/BiSetCard.tsx`
- [x] `src/components/client/ConditioningCard.tsx`
- [x] `src/components/client/ExecutionGridPremium.tsx`
- [x] `src/components/client/ExerciseCardSmart.tsx`
- [x] `src/components/client/ExerciseExecutionDetail.tsx`
- [x] `src/components/client/MaxLoadsModal.tsx`
- [x] `src/components/client/MinimalExerciseListItem.tsx`
- [x] `src/components/client/StudentPagePrimitives.tsx`
- [x] `src/components/client/StudentPeriodizationStrip.tsx`
- [x] `src/components/client/SmartExerciseTracker.tsx`
- [x] `src/components/client/WeeklyVolumePanel.tsx`
- [x] `src/components/client/WorkoutBlockCard.tsx`
- [x] `src/components/trainer/TrainerWorkoutBuilderDialog.tsx`
- [x] `src/components/trainer/TrainerWorkoutExerciseRow.tsx`
- [x] `src/components/ui/command.tsx`
- [x] `src/components/ui/button.tsx`
- [x] `src/components/ui/textarea.tsx`
- [x] `src/components/ui/input.tsx`
- [x] `src/lib/ranking-session-validation.ts`
- [x] `src/lib/trainer-workout-actions.ts`
- [x] `src/lib/workout-parser/__tests__/backward-compat.test.ts`
- [x] `src/App.tsx`
- [x] `src/pages/client/ClientHome.tsx`
- [x] `src/pages/client/ClientHistory.tsx`
- [x] `src/pages/client/ClientProfile.tsx`
- [x] `src/pages/client/ClientProgress.tsx`
- [x] `src/pages/client/ClientSessionHub.tsx`
- [x] `src/pages/client/FindTrainers.tsx`
- [x] `src/pages/client/WorkoutExecution.tsx`
- [x] `src/pages/trainer/TrainerDashboard.tsx`
- [x] `src/pages/trainer/TrainerGroups.tsx`
- [x] `src/pages/trainer/WorkoutDetail.tsx`
- [x] `tela-a.png`
