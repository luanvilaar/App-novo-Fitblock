
import { ParsedWorkout } from "./types";

/**
 * Converte um objeto ParsedWorkout de volta para o formato de texto
 * que o interpretador (tokenizer/parser) entende.
 */
export function serializeWorkout(workout: ParsedWorkout): string {
  const lines: string[] = [];

  workout.blocks.forEach((block) => {
    // Título do Bloco
    if (block.title) {
      lines.push(`# ${block.title.toUpperCase()}`);
    }

    // Formato (se houver)
    if (block.formatType) {
      let formatLine = block.formatType;
      if (block.timeCap) formatLine += ` TC: ${block.timeCap}`;
      if (block.rounds) formatLine += ` ROUNDS: ${block.rounds}`;
      lines.push(formatLine);
    }

    // Notas do Bloco
    if (block.notes) {
      lines.push(`NOTAS: ${block.notes}`);
    }

    // Exercícios
    block.exercises.forEach((ex) => {
      let exLine = "";
      
      // Prefixo para bi-set
      if (ex.type === 'bi-set' || ex.biSetLabel) {
        exLine += `${ex.biSetLabel || "A1"}: `;
      }

      exLine += ex.name;

      const p = ex.prescription;
      const parts: string[] = [];
      
      if (p.sets) parts.push(`${p.sets}x`);
      if (p.reps) parts.push(p.reps);
      if (p.load) parts.push(`@ ${p.load}`);
      if (p.duration) parts.push(p.duration);
      if (p.distance) parts.push(p.distance);
      if (p.pace) parts.push(`Pace: ${p.pace}`);
      if (p.rounds) parts.push(`${p.rounds} rounds`);
      if (p.interval) parts.push(`Intervalo: ${p.interval}`);
      if (p.notes) parts.push(`(${p.notes})`);
      if (p.videoUrl) parts.push(`[Vídeo: ${p.videoUrl}]`);

      if (parts.length > 0) {
        exLine += ` ${parts.join(" ")}`;
      }

      lines.push(exLine);
    });

    // Separador entre blocos
    lines.push("---");
  });

  if (workout.globalNotes) {
    lines.push(`GLOBAL: ${workout.globalNotes}`);
  }

  // Limpa linhas vazias extras e o último separador
  const result = lines.join("\n").replace(/\n---\n$/, "");
  return result;
}
