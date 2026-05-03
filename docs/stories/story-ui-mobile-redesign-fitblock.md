# STORY UI-001: Mobile App Redesign FitBlock

**ID:** UI-001  
**Epic:** Mobile App Redesign  
**Sprint:** 1  
**Points:** 21  
**Priority:** High  
**Created:** 2026-05-03  
**Status:** 👀 In Review

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
- Base visual: dark app-first, com verde funcional apenas em CTAs/ativos/progresso
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

---

## Validation Results

- `npm test`: ✅ passou (`11` arquivos, `125` testes)
- `npm run build`: ✅ passou
- `npx eslint src/components/client/StudentPeriodizationStrip.tsx src/hooks/useTrainingPeriodWeeks.ts src/lib/training-periodization.ts`: ✅ passou sem warnings
- `npm run lint`: ⚠️ falhou por problemas preexistentes no workspace, incluindo `.aiox-core`, regras `no-explicit-any`, parsing errors em templates e issues antigas fora do redesign
- `npm run typecheck`: ⚠️ falhou por problemas preexistentes de tipagem em fluxos Supabase, trainer builders e utilitários já existentes no repo

O redesign não introduziu uma nova classe dominante de falhas nos gates; os bloqueios restantes já estavam presentes no workspace.

---

## File List

- [x] `docs/stories/story-ui-mobile-redesign-fitblock.md`
- [x] `package.json`
- [x] `src/App.css`
- [x] `src/index.css`
- [x] `src/components/BottomNav.tsx`
- [x] `src/components/ClientLayout.tsx`
- [x] `src/components/NotificationBell.tsx`
- [x] `src/components/TrainerLayout.tsx`
- [x] `src/components/client/StudentPeriodizationStrip.tsx`
- [x] `src/hooks/useTrainingPeriodWeeks.ts`
- [x] `src/lib/training-periodization.ts`
- [x] `src/components/trainer/TrainerPanelCard.tsx`
- [x] `src/components/ui/button.tsx`
- [x] `src/components/ui/card.tsx`
- [x] `src/components/ui/dialog.tsx`
- [x] `src/components/ui/input.tsx`
- [x] `src/components/ui/popover.tsx`
- [x] `src/components/ui/select.tsx`
- [x] `src/components/ui/tabs.tsx`
- [x] `src/pages/AguardandoAprovacao.tsx`
- [x] `src/pages/Auth.tsx`
- [x] `src/pages/Index.tsx`
- [x] `src/pages/Login.tsx`
- [x] `src/pages/NotFound.tsx`
- [x] `src/pages/PublicRanking.tsx`
- [x] `src/pages/ResetPassword.tsx`
- [x] `src/pages/TrainerRegister.tsx`
- [x] `src/pages/client/ClientHome.tsx`
- [x] `src/pages/client/ClientProgress.tsx`
- [x] `src/pages/trainer/TrainerAthletes.tsx`
- [x] `src/pages/trainer/TrainerWorkouts.tsx`
