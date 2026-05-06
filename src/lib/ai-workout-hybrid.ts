/**
 * Pipeline híbrido: parser local (regras) + IA (refino de texto).
 * A IA nunca substitui a estrutura sem passar na validação.
 */

import type { ParsedBlock, ParsedExercise, ParsedWorkout } from "@/lib/workoutParser";
import type { ParsedWorkout as NewParsedWorkout } from "@/lib/workout-parser/types";
import { serializeWorkout } from "@/lib/workout-parser/serializer";

/** Achata exercício vindo do modelo (nested prescription) para o formato legado usado no app. */
function flattenExercise(raw: Record<string, unknown>): ParsedExercise | null {
  const name = String(raw.name ?? "").trim();
  if (!name) return null;

  const p = raw.prescription as Record<string, unknown> | undefined;
  const fromP = (k: string) => (p?.[k] != null ? String(p[k]).trim() : undefined);
  const direct = (k: string) => (raw[k] != null ? String(raw[k]).trim() : undefined);

  return {
    name,
    sets: fromP("sets") ?? direct("sets"),
    reps: fromP("reps") ?? direct("reps"),
    load: fromP("load") ?? direct("load"),
    distance: fromP("distance") ?? direct("distance"),
    duration: fromP("duration") ?? direct("duration"),
    pace: fromP("pace") ?? direct("pace"),
    rounds: fromP("rounds") ?? direct("rounds"),
    videoUrl: fromP("videoUrl") ?? direct("videoUrl"),
    notes: fromP("notes") ?? direct("notes"),
    isBiSet: raw.type === "bi-set" || raw.isBiSet === true,
    isCombined: raw.type === "combined" || raw.isCombined === true,
    biSetLabel: (raw.biSetLabel as string) || (raw.bi_set_label as string) || undefined,
  };
}

function isLikelyMetconOrWodBlock(block: { title: string; formatType?: string }): boolean {
  const titleUpper = (block.title || "").toUpperCase();
  return (
    !!block.formatType ||
    ["CONDICIONAMENTO", "METCON", "WOD"].some((k) => titleUpper.includes(k))
  );
}

function flattenBlock(raw: Record<string, unknown>): ParsedBlock | null {
  const title = String(raw.title ?? "").trim();
  const exercisesRaw = raw.exercises;
  if (!Array.isArray(exercisesRaw)) return null;

  const exercises: ParsedExercise[] = [];
  for (const ex of exercisesRaw) {
    if (!ex || typeof ex !== "object") continue;
    const flat = flattenExercise(ex as Record<string, unknown>);
    if (flat) exercises.push(flat);
  }

  const block: ParsedBlock = {
    title,
    category: String(raw.category ?? "geral"),
    formatType: raw.formatType != null ? String(raw.formatType) : undefined,
    exercises,
    notes: raw.notes != null ? String(raw.notes).trim() : undefined,
    timeCap: raw.timeCap != null ? String(raw.timeCap).trim() : undefined,
    rounds: raw.rounds != null ? String(raw.rounds).trim() : undefined,
  };

  if (exercises.length === 0 && !isLikelyMetconOrWodBlock(block)) return null;
  return block;
}

/**
 * Converte resposta JSON da IA (flat ou nested) para ParsedWorkout legado.
 */
export function normalizeAiResponseToLegacyParsed(data: unknown): ParsedWorkout | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const blocksRaw = root.blocks;
  if (!Array.isArray(blocksRaw) || blocksRaw.length === 0) return null;

  const blocks: ParsedBlock[] = [];
  for (const b of blocksRaw) {
    if (!b || typeof b !== "object") continue;
    const block = flattenBlock(b as Record<string, unknown>);
    if (block) blocks.push(block);
  }

  if (blocks.length === 0) return null;

  return {
    blocks,
    globalNotes:
      root.globalNotes != null ? String(root.globalNotes).trim() : undefined,
  };
}

function normToken(s: string | undefined): string {
  return (s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function normPres(s: string | undefined): string {
  return (s ?? "").replace(/\s+/g, "").toLowerCase();
}

export type FitblockAssistantGuidance = {
  summary?: string;
  tips?: string[];
  suggestedCanonicalText?: string | null;
};

/**
 * Extrai metadados opcionais devolvidos pelo modelo (dicas + texto canónico).
 * Não faz parte do ParsedWorkout consumido pelo formulário.
 */
export function extractFitblockAssistantGuidance(data: unknown): FitblockAssistantGuidance | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const raw = root.assistantGuidance;
  if (!raw || typeof raw !== "object") return null;
  const g = raw as Record<string, unknown>;
  const tips = Array.isArray(g.tips) ? g.tips.filter((t): t is string => typeof t === "string") : undefined;
  const summary = typeof g.summary === "string" ? g.summary : undefined;
  const suggested =
    g.suggestedCanonicalText === null
      ? null
      : typeof g.suggestedCanonicalText === "string"
        ? g.suggestedCanonicalText
        : undefined;
  if (!tips?.length && !summary && suggested === undefined) return null;
  return { summary, tips, suggestedCanonicalText: suggested };
}

/**
 * Garante que a IA não alterou a árvore nem prescrições: contagens, nomes (normalizados),
 * bi-set/combinado, labels e campos de prescrição (ignorando espaços).
 */
export function structureMatches(local: ParsedWorkout, candidate: ParsedWorkout): boolean {
  if (local.blocks.length !== candidate.blocks.length) return false;
  for (let i = 0; i < local.blocks.length; i++) {
    const a = local.blocks[i];
    const b = candidate.blocks[i];
    if (a.exercises.length !== b.exercises.length) return false;
    if (normToken(a.title) !== normToken(b.title)) return false;
    if (normToken(a.category) !== normToken(b.category)) return false;
    if (normPres(a.formatType) !== normPres(b.formatType)) return false;
    if (normPres(a.timeCap) !== normPres(b.timeCap)) return false;
    if (normPres(a.rounds) !== normPres(b.rounds)) return false;

    for (let j = 0; j < a.exercises.length; j++) {
      const exA = a.exercises[j];
      const exB = b.exercises[j];
      if (normToken(exA.name) !== normToken(exB.name)) return false;
      if (!!exA.isBiSet !== !!exB.isBiSet) return false;
      if (!!exA.isCombined !== !!exB.isCombined) return false;
      if (normToken(exA.biSetLabel) !== normToken(exB.biSetLabel)) return false;
      if (normPres(exA.sets) !== normPres(exB.sets)) return false;
      if (normPres(exA.reps) !== normPres(exB.reps)) return false;
      if (normPres(exA.load) !== normPres(exB.load)) return false;
      if (normPres(exA.distance) !== normPres(exB.distance)) return false;
      if (normPres(exA.duration) !== normPres(exB.duration)) return false;
      if (normPres(exA.pace) !== normPres(exB.pace)) return false;
      if (normPres(exA.rounds) !== normPres(exB.rounds)) return false;
    }
  }
  return true;
}

/** Legado (workoutParser) → formato novo do serializer. */
export function legacyToNewParsedWorkout(legacy: ParsedWorkout): NewParsedWorkout {
  return {
    blocks: legacy.blocks.map((b) => ({
      title: b.title,
      category: b.category,
      formatType: (b.formatType as NewParsedWorkout["blocks"][0]["formatType"]) || null,
      rounds: b.rounds,
      timeCap: b.timeCap,
      notes: b.notes,
      exercises: b.exercises.map((ex) => ({
        name: ex.name,
        type: ex.isBiSet ? "bi-set" : ex.isCombined ? "combined" : "single",
        prescription: {
          sets: ex.sets,
          reps: ex.reps,
          load: ex.load,
          distance: ex.distance,
          duration: ex.duration,
          pace: ex.pace,
          rounds: ex.rounds,
          videoUrl: ex.videoUrl,
          notes: ex.notes,
        },
        biSetLabel: ex.biSetLabel,
      })),
    })),
    globalNotes: legacy.globalNotes,
  };
}

/** Texto do editor inteligente após refinamento (para sincronizar com o tokenizer). */
export function serializeSmartTextAfterHybrid(legacy: ParsedWorkout): string {
  return serializeWorkout(legacyToNewParsedWorkout(legacy));
}
