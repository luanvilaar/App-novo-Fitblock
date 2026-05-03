
const result = {"blocks":[{"title":"Hollow Rocks","category":"accessory","formatType":"INTERVALADO","timeCap":null,"rounds":null,"notes":"A cada 1min10seg por 4sets","exercises":[{"name":"Hollow Rocks","type":"single","biSetLabel":null,"prescription":{"sets":"4","reps":"12-15","load":null,"interval":"1min10seg","duration":null,"distance":null,"pace":null,"rounds":null,"notes":null}}]},{"title":"V-Ups + Tucks","category":"accessory","formatType":"INTERVALADO","timeCap":null,"rounds":null,"notes":"A cada 1min20seg por 3sets","exercises":[{"name":"V-Ups","type":"bi-set","biSetLabel":"A1","prescription":{"sets":"3","reps":"10-12","load":null,"interval":"1min20seg","duration":null,"distance":null,"pace":null,"rounds":null,"notes":null}},{"name":"Tucks","type":"bi-set","biSetLabel":"A2","prescription":{"sets":"3","reps":"10-12","load":null,"interval":"1min20seg","duration":null,"distance":null,"pace":null,"rounds":null,"notes":null}}]},{"title":"Side V-Ups","category":"accessory","formatType":"INTERVALADO","timeCap":null,"rounds":null,"notes":"A cada 1min20seg por 3sets","exercises":[{"name":"Side V-Ups","type":"single","biSetLabel":null,"prescription":{"sets":"3","reps":"8-10","load":null,"interval":"1min20seg","duration":null,"distance":null,"pace":null,"rounds":null,"notes":null}}]},{"title":"CONDICIONAMENTO","category":"wod","formatType":"INTERVALADO","timeCap":null,"rounds":"4","notes":"A cada 6minutos por 4 Rounds. O score do treino é a soma de todas as reps, não é permitido queimar rounds, vc deve voltar sempre que o relogio virar.","exercises":[{"name":"Wall Walk","type":"single","biSetLabel":null,"prescription":{"sets":"4","reps":"4","load":null,"interval":null,"duration":null,"distance":null,"pace":null,"rounds":null,"notes":null}},{"name":"Kettlebell Snatch","type":"single","biSetLabel":null,"prescription":{"sets":"4","reps":"16","load":"#24/16kg","interval":null,"duration":null,"distance":null,"pace":null,"rounds":null,"notes":null}},{"name":"Wall Walk","type":"single","biSetLabel":null,"prescription":{"sets":"4","reps":"3","load":null,"interval":null,"duration":null,"distance":null,"pace":null,"rounds":null,"notes":null}},{"name":"Kettlebell Snatch","type":"single","biSetLabel":null,"prescription":{"sets":"4","reps":"12","load":"#24/16kg","interval":null,"duration":null,"distance":null,"pace":null,"rounds":null,"notes":null}},{"name":"Remo","type":"single","biSetLabel":null,"prescription":{"sets":"4","reps":null,"load":null,"interval":null,"duration":null,"distance":"300m","pace":null,"rounds":null,"notes":null}},{"name":"Strict Handstand Push Ups","type":"single","biSetLabel":null,"prescription":{"sets":"4","reps":"12","load":null,"interval":null,"duration":null,"distance":null,"pace":null,"rounds":null,"notes":null}}]},{"title":"ENDURANCE","category":"wod","formatType":"FOR_TIME","timeCap":"40min","rounds":"3","notes":null,"exercises":[{"name":"Corrida","type":"single","biSetLabel":null,"prescription":{"sets":"3","reps":null,"load":null,"interval":null,"duration":null,"distance":"1000m","pace":"livre","rounds":null,"notes":null}},{"name":"Assault Bike","type":"single","biSetLabel":null,"prescription":{"sets":"3","reps":null,"load":null,"interval":null,"duration":"4min","distance":null,"pace":"Ritmo leve","rounds":null,"notes":null}}]}],"globalNotes":null};

function serializeWorkout(workout) {
  const lines = [];

  workout.blocks.forEach((block) => {
    if (block.title) {
      lines.push(`# ${block.title.toUpperCase()}`);
    }

    if (block.formatType) {
      let formatLine = block.formatType;
      if (block.timeCap) formatLine += ` TC: ${block.timeCap}`;
      if (block.rounds) formatLine += ` ROUNDS: ${block.rounds}`;
      lines.push(formatLine);
    }

    if (block.notes) {
      lines.push(`NOTAS: ${block.notes}`);
    }

    block.exercises.forEach((ex) => {
      let exLine = "";
      if (ex.type === 'bi-set' || ex.biSetLabel) {
        exLine += `${ex.biSetLabel || "A1"}: `;
      }
      exLine += ex.name;

      const p = ex.prescription;
      const parts = [];
      // Se sets === rounds do bloco, omitimos para não ficar duplicado (opcional)
      if (p.sets && p.sets !== block.rounds) parts.push(`${p.sets}x`);
      
      if (p.reps) parts.push(p.reps);
      if (p.load) parts.push(`@ ${p.load}`);
      if (p.duration) parts.push(p.duration);
      if (p.distance) parts.push(p.distance);
      if (p.pace) parts.push(`Pace: ${p.pace}`);
      if (p.rounds && p.rounds !== block.rounds) parts.push(`${p.rounds} rounds`);
      if (p.interval) parts.push(`Intervalo: ${p.interval}`);
      if (p.notes) parts.push(`(${p.notes})`);

      if (parts.length > 0) {
        exLine += ` ${parts.join(" ")}`;
      }
      lines.push(exLine);
    });

    lines.push("---");
  });

  if (workout.globalNotes) {
    lines.push(`GLOBAL: ${workout.globalNotes}`);
  }

  return lines.join("\n").replace(/\n---\n$/, "");
}

console.log(serializeWorkout(result));
