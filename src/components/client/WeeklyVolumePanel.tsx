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
      <div className="rounded-xl border border-white/[0.08] bg-[#121212] p-4 text-center">
        <p className="font-body text-xs text-muted-foreground">Nenhum volume nesta categoria</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#121212]">
      <div className="grid grid-cols-2 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="border-r border-white/[0.06] px-3 py-2 font-display text-xs font-bold uppercase tracking-tight text-white">
          {title}
        </div>
        <div className="px-3 py-2 text-right font-display text-xs font-bold uppercase tracking-tight text-white">
          Volume
        </div>
      </div>
      {rows.map((r) => (
        <div
          key={r.key}
          className="grid grid-cols-2 border-b border-white/[0.04] text-sm last:border-b-0"
        >
          <div className="border-r border-white/[0.04] px-3 py-2 font-medium leading-snug text-white/90">{r.label}</div>
          <div className="px-3 py-2 text-right font-mono text-xs tabular-nums text-white">
            {r.total}
            <span className="ml-1 text-[9px] font-bold text-white/45">{UNIT_HINT[r.unit]}</span>
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
      <div className="flex flex-col gap-2 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-lg font-bold uppercase tracking-tight text-white sm:text-xl">{weekLabel}</h2>
        <p className="max-w-none font-body text-xs leading-relaxed text-muted-foreground sm:max-w-md sm:text-right">
          Volume estimado a partir dos blocos de condicionamento (prescrição). Metcon em metros quando aplicável.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
          <p className="font-body text-sm text-muted-foreground">
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
