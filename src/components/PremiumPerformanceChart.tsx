import React, { useMemo } from "react";

interface ProgressPoint {
  date: string;
  load: number;
}

interface PremiumPerformanceChartProps {
  data: ProgressPoint[];
  exerciseName?: string;
}

const PremiumPerformanceChart: React.FC<PremiumPerformanceChartProps> = ({ data, exerciseName }) => {
  const prPoint = useMemo(() => {
    if (!data.length) return null;
    return data.reduce((prev, current) => (prev.load > current.load ? prev : current));
  }, [data]);

  const maxLoad = useMemo(() => {
    if (!data.length) return 100;
    return Math.max(...data.map((point) => point.load)) * 1.15;
  }, [data]);

  const points = useMemo(() => {
    if (!data.length) return [];
    const width = 600;
    const height = 180;
    const stepX = width / (data.length - 1 || 1);

    return data.map((point, index) => {
      const x = index * stepX;
      const y = height - (point.load / maxLoad) * height;
      return { x, y, load: point.load, date: point.date };
    });
  }, [data, maxLoad]);

  const pathData = useMemo(() => {
    if (points.length < 2) return "";
    return `M ${points[0].x},${points[0].y} ` + points.slice(1).map((point) => `L ${point.x},${point.y}`).join(" ");
  }, [points]);

  const areaData = useMemo(() => {
    if (points.length < 2) return "";
    return `${pathData} L ${points[points.length - 1].x},180 L 0,180 Z`;
  }, [pathData, points]);

  const prCoords = useMemo(() => {
    if (!prPoint || !points.length) return null;
    return points.find((point) => point.load === prPoint.load && point.date === prPoint.date) || points[points.length - 1];
  }, [prPoint, points]);

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const evolutionPercent = firstPoint && lastPoint && firstPoint.load > 0
    ? ((lastPoint.load - firstPoint.load) / firstPoint.load) * 100
    : 0;

  return (
    <div className="rounded-[1.75rem] border border-black/6 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.12)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-display text-xl text-black">{exerciseName || "Evolução de carga"}</h3>
          <p className="mt-1 text-sm text-black/45">Leitura histórica da melhor carga registrada por sessão.</p>
        </div>
        <div className="rounded-full bg-[#efefef] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-black/45">
          Histórico
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.35rem] bg-[#f3f3f3] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/40">Carga atual</p>
          <p className="mt-2 font-display text-3xl text-black">{lastPoint?.load || 0} kg</p>
        </div>
        <div className="rounded-[1.35rem] bg-[#f3f3f3] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/40">Recorde</p>
          <p className="mt-2 font-display text-3xl text-black">{prPoint?.load || 0} kg</p>
        </div>
        <div className="rounded-[1.35rem] bg-[#f3f3f3] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/40">Variação</p>
          <p className="mt-2 font-display text-3xl text-black">
            {evolutionPercent > 0 ? "+" : ""}
            {evolutionPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="relative mt-6 h-52">
        {prCoords ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
            style={{ left: `${(prCoords.x / 600) * 100}%`, top: `${(prCoords.y / 180) * 100}%` }}
          >
            <div className="rounded-full bg-black px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white shadow-[0_4px_16px_rgba(0,0,0,0.16)]">
              PR {prPoint?.load} kg
            </div>
          </div>
        ) : null}

        <svg viewBox="0 0 600 180" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="fitblockAreaFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,0,0,0.16)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>
          </defs>

          <g stroke="rgba(0,0,0,0.08)" strokeWidth="1">
            {[0, 150, 300, 450, 600].map((x) => (
              <line key={`x-${x}`} x1={x} y1="0" x2={x} y2="180" />
            ))}
            {[0, 45, 90, 135, 180].map((y) => (
              <line key={`y-${y}`} x1="0" y1={y} x2="600" y2={y} />
            ))}
          </g>

          {areaData ? <path d={areaData} fill="url(#fitblockAreaFade)" /> : null}
          {pathData ? <path d={pathData} fill="none" stroke="#000000" strokeWidth="3" vectorEffect="non-scaling-stroke" /> : null}

          {points.map((point, index) => (
            <circle key={index} cx={point.x} cy={point.y} r="4" fill="#ffffff" stroke="#000000" strokeWidth="2" />
          ))}
        </svg>
      </div>
    </div>
  );
};

export default PremiumPerformanceChart;
