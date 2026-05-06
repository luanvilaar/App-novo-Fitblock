# Migrações Supabase (FitBlock)

Este documento inventaria as migrações em [`supabase/migrations/`](../supabase/migrations/), a **ordem obrigatória** de aplicação e como alinhar o projeto remoto.

## Estado verificado (inventário remoto)

Comando usado na raiz do repositório:

```bash
npx supabase migration list
npx supabase db push
```

**Última verificação:** todas as **37** migrações locais tinham entrada correspondente no remoto (coluna Local = Remote). `db push` respondeu: **Remote database is up to date.**

Para repetir o inventário após `supabase link --project-ref <ref>`:

| Local | Remote | Significado |
|-------|--------|-------------|
| Igual | Igual | Já aplicada no projeto ligado |
| Existe | vazio | Falta aplicar no remoto — corre `db push` |
| vazio | Existe | Histórico local incompleto — precisas de `db pull` / recuperar ficheiros |

**Não apagues nem renomeies ficheiros já aplicados no remoto** sem `supabase migration repair` e acordo com a equipa.

## Erro: tabela existe no SQL mas a app diz "schema cache" / "table not found"

1. **Mesmo projeto:** `VITE_SUPABASE_URL` (ou `SUPABASE_URL` no `.env`) tem de ser `https://<project_ref>.supabase.co` onde `<project_ref>` é o de `supabase link` (ficheiro [`supabase/.temp/project-ref`](../supabase/.temp/project-ref) ou [`supabase/config.toml`](../supabase/config.toml) `project_id`). Se a app apontar para outro `project_ref`, o PostgREST desse projeto pode não ter a tabela.
2. **Aplicar migrações no projeto correto:** `npx supabase link --project-ref <REF_DO_DASHBOARD_IGUAL_AO_URL>` depois `npm run supabase:push`.
3. **Recarregar API PostgREST** (após criar tabelas novas): `npm run supabase:reload-api` (equivale a `NOTIFY pgrst, 'reload schema';` no SQL).
4. **Atalho:** `npm run supabase:sync` — `db push` + reload do schema.

## O que enviar para o Supabase

- **Recomendado:** pasta completa `supabase/migrations/` + `supabase db push` (aplica só o que falta, na ordem do timestamp no nome do ficheiro).
- **Sem CLI:** executar no SQL Editor, **na mesma ordem** da tabela abaixo (do mais antigo ao mais recente). Não faças cherry-pick isolado: há dependências de FKs e ordem de criação.

## Ordem e resumo (37 ficheiros)

| Versão (prefixo) | Ficheiro | Resumo |
|------------------|----------|--------|
| 20260217013219 | `20260217013219_f9f3f21a-0690-48d8-b603-715e64b768dd.sql` | Schema base: `app_role`, `profiles`, `user_roles`, `trainers`, `students`, `groups`, `exercises`, `workouts`, `workout_exercises`, logs, scores, RLS inicial, seeds |
| 20260217013241 | `20260217013241_146adf67-e5ff-4744-b09d-de88be3e9352.sql` | INSERT em tabelas core restrito a `service_role` |
| 20260217021028 | `20260217021028_39e4dd9e-0657-4d6f-a9c7-ae720a926da1.sql` | Tabela `notifications`, RLS, trigger novo treino |
| 20260217021044 | `20260217021044_58382755-cae0-4ff9-bd44-4c9b5cc6fb07.sql` | Política INSERT `notifications` (trainer/admin) |
| 20260217022109 | `20260217022109_d1c2d58d-9434-4875-8ef9-b1020c38d87e.sql` | `supabase_realtime` em `notifications` |
| 20260217022508 | `20260217022508_a39b9985-a592-4c7b-a7ff-277702a96dc7.sql` | `student_group_ids`, políticas `workouts` (evitar recursão) |
| 20260217023240 | `20260217023240_e74d32e7-9c9a-4558-90b9-d0c0a6ae3e04.sql` | Coluna `workout_exercises.block_label` |
| 20260217023652 | `20260217023652_4c0e8cee-6bdc-481c-88f4-fa411f8b0db5.sql` | `user_roles`: políticas PERMISSIVE |
| 20260217024358 | `20260217024358_618225e8-7a60-4a80-9d5a-a9f9dd1adced.sql` | Funções `trainer_owns_group` / ciclo `groups`–`group_members` |
| 20260217093549 | `20260217093549_807c0ede-99b6-4b94-bb1c-c944c509efa0.sql` | `workouts.description`, seed `Corrida` |
| 20260217233818 | `20260217233818_9818d9b5-6a92-496c-99ad-b26ed0e5e11c.sql` | `workout_logs.total_time_seconds` |
| 20260218002103 | `20260218002103_005981e1-1c3c-473a-95eb-d992a88a42e1.sql` | Tabela `workout_metcons`, RLS, ranking reference |
| 20260218010326 | `20260218010326_5f99b0fb-fab8-4a50-96a4-5e396e177bd2.sql` | Bucket Storage `avatars`, políticas CRUD por utilizador |
| 20260218022855 | `20260218022855_1cbbb09d-5e7a-418b-8680-719b4c42c5b6.sql` | `workout_metcons.is_ranking_reference` |
| 20260218153033 | `20260218153033_4c674eed-4b00-478c-8421-30aab3f69a63.sql` | Função `notify_admin_on_new_user` + trigger (pg_net / edge) |
| 20260218153339 | `20260218153339_d80a6081-a3f3-4844-bc93-d798cb2ef978.sql` | Remove trigger/função que dependia de pg_net indisponível |
| 20260219202254 | `20260219202254_ec40f339-11e5-4579-89e4-606e7f4915bd.sql` | Políticas "System inserts" apenas `service_role` (profiles, roles, students, trainers) |
| 20260219203059 | `20260219203059_507ab6e1-a545-4c6d-9b60-5731a85ae2aa.sql` | Admin: SELECT em `profiles` e `user_roles` |
| 20260220011858 | `20260220011858_578ada08-e7f1-43f2-aacb-ce179de7a6e4.sql` | `exercises` só leitura autenticada; políticas deny `anon` em várias tabelas |
| 20260224005305 | `20260224005305_75c59fb3-926f-49cd-85f3-7840ad81b3a5.sql` | Tabela `ranking_history`, índices, RLS |
| 20260224100000 | `20260224100000_fitblock_linking_system.sql` | Ligação treinador–atleta: `trainer_access_codes`, `athlete_link_requests`, colunas em `trainers`, RLS |
| 20260224122801 | `20260224122801_fix_enum.sql` | Correção de enum / tipos |
| 20260224122802 | `20260224122802_admin_master_coach_approval.sql` | `trainers.coach_status`, `coach_approvals`, extensão `trainer_access_codes` |
| 20260226122151 | `20260226122151_8c6c2dd7-5dff-40f4-ae36-ae758044a4c8.sql` | `handle_new_user`: estudante `active = false`; políticas signup |
| 20260308225517 | `20260308225517_f2179eea-0ff9-45f0-b2ae-8b3cab0f4271.sql` | `exercises.video_url` |
| 20260312131854 | `20260312131854_e5a5fe25-d364-4477-8e8a-5a556d001c0e.sql` | `exercises.param*_type` |
| 20260313120000 | `20260313120000_fitness_ranking_multibox.sql` | Multi-box: `boxes`, colunas `box_id`, triggers sync, `handle_new_user` |
| 20260313230511 | `20260313230511_42e9cfb9-3b75-4b22-b89c-e016d2bb1724.sql` | Reforço `boxes`, `profiles`/`students` demographics, RLS |
| 20260313231031 | `20260313231031_23f59328-1c86-4aa5-8c12-673ee539e07f.sql` | Política leitura pública `boxes` para `anon` |
| 20260314003054 | `20260314003054_b51187fb-aa4d-40a6-95c0-1465e463ff12.sql` | Atualização `logo_url` de boxes (seed URLs) |
| 20260314004238 | `20260314004238_6261eae1-2bde-445e-9235-684b5f239d33.sql` | `profiles` username/bio; `community_posts`, comments, likes, notificações |
| 20260314004248 | `20260314004248_a4048d1e-59b5-4a4d-8517-36ab5731e539.sql` | Política INSERT `community_notifications` |
| 20260314212536 | `20260314212536_14c60906-1f56-4e4b-b619-54c4332f477b.sql` | `groups.box_id` |
| 20260417170000 | `20260417170000_student_max_loads.sql` | Tabela `student_max_loads`, RLS, trigger `updated_at` |
| 20260417171000 | `20260417171000_add_load_type_to_workout_exercises.sql` | `workout_exercises.load_type` |
| 20260417193000 | `20260417193000_add_reps_scheme_to_workout_exercises.sql` | `workout_exercises.reps_scheme` |
| 20260417210000 | `20260417210000_add_load_scheme_to_workout_exercises.sql` | `workout_exercises.load_scheme` |

## Limpeza de ficheiros (política)

- **Manter** os 37 ficheiros no Git enquanto o remoto os tiver aplicados.
- **Reduzir número de ficheiros (squash)** só em cenário greenfield: base vazia ou após backup + reset explícito; gera um `*_baseline.sql` e alinha o histórico com `migration repair` — **não aplicado neste repo**: o remoto já contém as 37 versões; squash seria projeto novo ou reset acordado.
- **Novas alterações:** um único novo ficheiro `YYYYMMDDHHMMSS_descricao_curta.sql` por alteração lógica.

## Referência rápida

```bash
supabase link --project-ref <PROJECT_REF>
npx supabase migration list
npx supabase db push
```
