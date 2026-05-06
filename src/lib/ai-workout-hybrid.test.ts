import { describe, expect, it } from "vitest";
import { extractFitblockAssistantGuidance, structureMatches } from "./ai-workout-hybrid";
import type { ParsedWorkout } from "./workoutParser";

const baseWorkout = (): ParsedWorkout => ({
  blocks: [
    {
      title: "FORÇA",
      category: "força",
      formatType: undefined,
      exercises: [
        {
          name: "Back Squat",
          sets: "5",
          reps: "6-8",
          isBiSet: false,
        },
        {
          name: "Leg Press",
          sets: "4",
          reps: "6-8",
          isBiSet: false,
          notes: "cargas pesadas",
        },
      ],
    },
  ],
});

describe("structureMatches", () => {
  it("aceita candidato igual com espaços diferentes na prescrição", () => {
    const local = baseWorkout();
    const candidate = baseWorkout();
    candidate.blocks[0].exercises[0].sets = "5 ";
    candidate.blocks[0].exercises[0].reps = "6 - 8";
    expect(structureMatches(local, candidate)).toBe(true);
  });

  it("rejeita alteração de nome", () => {
    const local = baseWorkout();
    const candidate = baseWorkout();
    candidate.blocks[0].exercises[0].name = "Squat Back";
    expect(structureMatches(local, candidate)).toBe(false);
  });

  it("rejeita alteração de flag bi-set", () => {
    const local = baseWorkout();
    local.blocks[0].exercises[0].isBiSet = true;
    const candidate = baseWorkout();
    candidate.blocks[0].exercises[0].isBiSet = false;
    expect(structureMatches(local, candidate)).toBe(false);
  });

  it("aceita notas de exercício diferentes", () => {
    const local = baseWorkout();
    const candidate = baseWorkout();
    candidate.blocks[0].exercises[1].notes = "Cargas pesadas; manter técnica.";
    expect(structureMatches(local, candidate)).toBe(true);
  });
});

describe("extractFitblockAssistantGuidance", () => {
  it("extrai tips e summary", () => {
    const raw = {
      blocks: [],
      assistantGuidance: {
        summary: "Refinadas observações.",
        tips: ["Use <A>+ para bi-set"],
        suggestedCanonicalText: "*FORÇA*\n<A>+",
      },
    };
    const g = extractFitblockAssistantGuidance(raw);
    expect(g?.summary).toBe("Refinadas observações.");
    expect(g?.tips?.[0]).toContain("bi-set");
    expect(g?.suggestedCanonicalText).toContain("FORÇA");
  });

  it("retorna null sem assistantGuidance", () => {
    expect(extractFitblockAssistantGuidance({ blocks: [] })).toBeNull();
  });
});
