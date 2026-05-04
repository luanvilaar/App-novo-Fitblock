import React, { useMemo } from "react";

interface ActivityPoint {
  date: string;
  checkins: number;
  results: number;
}

interface PremiumActivityChartProps {
  data: ActivityPoint[];
  title?: string;
}

const PremiumActivityChart: React.FC<PremiumActivityChartProps> = ({ data, title = "Atividade da Comunidade" }) => {
  const maxVal = useMemo(() => {
    if (!data.length) return 10;
    const allVals = data.flatMap(d => [d.checkins, d.results]);
    return Math.max(...allVals, 5) * 1.3;
  }, [data]);

  const points = useMemo(() => {
    if (!data.length) return { checkins: [], results: [] };
    const width = 600;
    const height = 140;
    const stepX = width / (data.length - 1 || 1);
    
    return {
      checkins: data.map((d, i) => ({
        x: i * stepX,
        y: height - (d.checkins / maxVal) * height,
        val: d.checkins,
        date: d.date
      })),
      results: data.map((d, i) => ({
        x: i * stepX,
        y: height - (d.results / maxVal) * height,
        val: d.results,
        date: d.date
      }))
    };
  }, [data, maxVal]);

  // Encontra o ponto de pico de resultados para o tooltip
  const peakPoint = useMemo(() => {
    if (!data.length) return null;
    const maxIdx = data.reduce((maxI, curr, i, arr) => curr.results > arr[maxI].results ? i : maxI, 0);
    return points.results[maxIdx];
  }, [data, points]);

  const generatePath = (pts: { x: number, y: number }[]) => {
    if (pts.length < 2) return "";
    return `M ${pts[0].x},${pts[0].y} ` + 
      pts.slice(1).map(p => `L ${p.x},${p.y}`).join(" ");
  };

  const generateArea = (path: string, lastX: number) => {
    if (!path) return "";
    return `${path} L ${lastX},140 L 0,140 Z`;
  };

  const paths = {
    checkins: generatePath(points.checkins),
    results: generatePath(points.results)
  };

  const areas = {
    checkins: generateArea(paths.checkins, points.checkins[points.checkins.length - 1]?.x || 0),
    results: generateArea(paths.results, points.results[points.results.length - 1]?.x || 0)
  };

  const totalCheckins = data.reduce((acc, curr) => acc + curr.checkins, 0);
  const totalResults = data.reduce((acc, curr) => acc + curr.results, 0);
  const engagementRate = totalCheckins > 0 ? ((totalResults / totalCheckins) * 100).toFixed(0) : "0";

  return (
    <div className="relative mb-1 flex h-full min-w-0 max-w-full flex-col justify-between overflow-hidden rounded-[1.4rem] bg-[#0d0f10] px-3 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:mb-2 sm:rounded-[1.8rem] sm:px-4 sm:py-5 lg:px-5 lg:py-6">
      <style>{`
        @keyframes tooltipFadeInFloat {
          0% { opacity: 0; transform: translate(-50%, 8px); }
          100% { opacity: 1; transform: translate(-50%, -4px); }
        }
        .anim-tooltip {
          animation: tooltipFadeInFloat 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes lineDrawIn {
          0% { stroke-dashoffset: 1200; }
          100% { stroke-dashoffset: 0; }
        }
        .anim-line-draw {
          stroke-dasharray: 1200;
          stroke-dashoffset: 1200;
          animation: lineDrawIn 4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>

      {/* Metrics Legend */}
      <div className="z-10 mb-4 flex min-w-0 max-w-full flex-wrap items-center gap-x-3 gap-y-2 sm:mb-6 sm:gap-x-4 md:mb-8 md:gap-8">
        <div className="flex min-w-0 max-w-full items-center gap-2 sm:gap-3">
          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_10px_rgba(65,31,128,0.6)]" />
          <span className="min-w-0 break-words font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-white/55 sm:text-[8px] sm:tracking-[0.12em] md:text-[9px] md:tracking-[0.2em]">
            Atletas Treinaram <span className="ml-1 text-white tabular-nums sm:ml-2">{totalCheckins}</span>
          </span>
        </div>
        <div className="flex min-w-0 max-w-full items-center gap-2 sm:gap-3">
          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-white opacity-40" />
          <span className="min-w-0 break-words font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-white/55 sm:text-[8px] sm:tracking-[0.12em] md:text-[9px] md:tracking-[0.2em]">
            Resultados Postados <span className="ml-1 text-white tabular-nums sm:ml-2">{totalResults}</span>
          </span>
        </div>
      </div>
 
      {/* Metric & Chart Layout */}
      <div className="z-10 grid min-w-0 max-w-full grid-cols-1 items-end gap-4 sm:gap-5 lg:grid-cols-5 lg:gap-8">
        {/* Left: Main Performance Indicator */}
        <div className="flex min-w-0 flex-col pb-1 lg:col-span-1 lg:pb-4">
          <span className="mb-1.5 font-body text-[11px] font-normal tracking-wide text-primary sm:mb-2 sm:text-xs">Eficiência</span>
          <span className="font-body text-[2.2rem] font-semibold tabular-nums leading-none tracking-tight text-white sm:text-5xl md:text-6xl">
            {engagementRate}%
          </span>
        </div>
 
        {/* Right: activity chart */}
        <div className="relative mt-1 h-28 w-full min-w-0 max-w-full sm:mt-2 sm:h-32 lg:col-span-4 lg:mt-0 lg:h-48">
          
          {/* Peak Indicator Tooltip */}
          {peakPoint && (
            <div 
              className="anim-tooltip pointer-events-none absolute z-20 flex max-w-[min(200px,90%)] flex-col items-center"
              style={{ left: `${(peakPoint.x / 600) * 100}%`, top: `${(peakPoint.y / 140) * 100}%`, transform: 'translate(-50%, -110%)' }}
            >
              <div className="max-w-full truncate rounded-full border border-primary/20 bg-primary px-2 py-1.5 text-center font-mono text-[7px] font-bold uppercase leading-tight tracking-[0.08em] text-white backdrop-blur-md sm:px-3 sm:text-[8px] sm:tracking-[0.1em]">
                PICO: {peakPoint.val} RES ({peakPoint.date})
              </div>
              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent -mt-px border-t-primary"></div>
            </div>
          )}
 
          <svg viewBox="0 0 600 140" className="h-full w-full max-w-full overflow-hidden" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="primarySmoothArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15"></stop>
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0"></stop>
              </linearGradient>
              <linearGradient id="whiteSmoothArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.05"></stop>
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"></stop>
              </linearGradient>
            </defs>
 
            {/* Technical Grid Lines */}
            <g stroke="rgba(255,255,255,0.03)" strokeWidth="1">
              {[0, 25, 50, 75, 100].map(p => (
                <line key={p} x1="0" y1={(p/100)*140} x2="600" y2={(p/100)*140} />
              ))}
              {[0, 20, 40, 60, 80, 100].map(p => (
                <line key={p} x1={(p/100)*600} y1="0" x2={(p/100)*600} y2="140" />
              ))}
            </g>
 
            {/* White Path (Results) */}
            <path d={areas.results} fill="url(#whiteSmoothArea)"></path>
            <path d={paths.results} fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.2" vectorEffect="non-scaling-stroke" strokeDasharray="4 2"></path>
  
            {/* primary Path (Checkins) */}
            <path d={areas.checkins} fill="url(#primarySmoothArea)"></path>
            <path d={paths.checkins} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="square" className="anim-line-draw shadow-[0_0_15px_rgba(65,31,128,0.5)]"></path>
 
            {/* Data Markers */}
            {points.checkins.map((p, i) => (
              <rect key={`c-${i}`} x={p.x-2} y={p.y-2} width="4" height="4" fill="hsl(var(--primary))" />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default PremiumActivityChart;
