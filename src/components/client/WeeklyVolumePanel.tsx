import type { WeeklyVolumeRow, VolumeMovementCategory } from '@/lib/weekly-volume';

const SECTION_TITLE: Record<VolumeMovementCategory, string> = {
  ginastico: 'GINÁSTICO',
  peso: 'PESO',
  metcon: 'METCON',
};

const UNIT_HINT: Record<string, string> = {
  reps: 'reps',
  meters: 'm',
};

function VolumeTable({
  title,
  rows,
}: {
  title: string;
  rows: WeeklyVolumeRow[];
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-black/6 bg-[#f8f8f8] p-4 text-center">
        <p className="font-body text-xs text-black/45">Nenhum volume nesta categoria</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/6 bg-white">
      <div className="grid grid-cols-2 border-b border-black/6 bg-[#f8f8f8]">
        <div className="border-r border-black/6 px-3 py-2 font-display text-xs font-bold uppercase tracking-tight text-black">
          {title}
        </div>
        <div className="px-3 py-2 text-right font-display text-xs font-bold uppercase tracking-tight text-black">
          Volume
        </div>
      </div>
      {rows.map((r) => (
        <div
          key={r.key}
          className="grid grid-cols-2 border-b border-black/5 text-sm last:border-b-0"
        >
          <div className="border-r border-black/5 px-3 py-2 font-medium leading-snug text-black/90">{r.label}</div>
          <div className="px-3 py-2 text-right font-mono text-xs tabular-nums text-black">
            {r.total}
            <span className="ml-1 text-[9px] font-bold text-black/45">{UNIT_HINT[r.unit]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export interface WeeklyVolumePanelProps {
  weekLabel: string;
  rows: WeeklyVolumeRow[];
}

const WeeklyVolumePanel = ({ weekLabel, rows }: WeeklyVolumePanelProps) => {
  const byCat = (cat: VolumeMovementCategory) => rows.filter((r) => r.category === cat);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 border-b border-black/6 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-lg font-bold uppercase tracking-tight text-black sm:text-xl">{weekLabel}</h2>
        <p className="max-w-none font-body text-xs leading-relaxed text-black/45 sm:max-w-md sm:text-right">
          Volume estimado a partir dos blocos de condicionamento (prescrição). Metcon em metros quando aplicável.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-[#f8f8f8] px-6 py-12 text-center">
          <p className="font-body text-sm text-black/45">
            Nenhum bloco de condicionamento com volume calculável nesta semana.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <VolumeTable title={SECTION_TITLE.ginastico} rows={byCat('ginastico')} />
          <VolumeTable title={SECTION_TITLE.peso} rows={byCat('peso')} />
          <VolumeTable title={SECTION_TITLE.metcon} rows={byCat('metcon')} />
        </div>
      )}
    </div>
  );
};

export default WeeklyVolumePanel;
