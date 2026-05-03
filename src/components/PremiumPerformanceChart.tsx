import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface ProgressPoint {
  date: string;
  load: number;
}

interface PremiumPerformanceChartProps {
  data: ProgressPoint[];
  exerciseName?: string;
}

const PremiumPerformanceChart: React.FC<PremiumPerformanceChartProps> = ({ data, exerciseName }) => {
  // Identifica o PR (maior carga)
  const prPoint = useMemo(() => {
    if (!data.length) return null;
    return data.reduce((prev, current) => (prev.load > current.load ? prev : current));
  }, [data]);

  const maxLoad = useMemo(() => {
    if (!data.length) return 100;
    return Math.max(...data.map(d => d.load)) * 1.2; // 20% de margem no topo
  }, [data]);

  // Converte os dados para coordenadas SVG (0-600 width, 0-140 height)
  const points = useMemo(() => {
    if (!data.length) return [];
    const width = 600;
    const height = 140;
    const stepX = width / (data.length - 1 || 1);
    
    return data.map((d, i) => {
      const x = i * stepX;
      const y = height - (d.load / maxLoad) * height;
      return { x, y, load: d.load, date: d.date };
    });
  }, [data, maxLoad]);

  const pathData = useMemo(() => {
    if (points.length < 2) return "";
    return `M ${points[0].x},${points[0].y} ` + 
      points.slice(1).map(p => `L ${p.x},${p.y}`).join(" ");
  }, [points]);

  const areaData = useMemo(() => {
    if (points.length < 2) return "";
    return `${pathData} L ${points[points.length - 1].x},140 L 0,140 Z`;
  }, [pathData, points]);

  // Posição do PR no SVG para o tooltip e pulso
  const prCoords = useMemo(() => {
    if (!prPoint || !points.length) return null;
    return points.find(p => p.load === prPoint.load && p.date === prPoint.date) || points[points.length - 1];
  }, [prPoint, points]);

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const evolutionPercent = firstPoint && lastPoint 
    ? ((lastPoint.load - firstPoint.load) / firstPoint.load * 100).toFixed(1)
    : "0";

  return (
    <div className="relative flex h-full min-w-0 max-w-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.05] bg-gradient-to-br from-white/[0.08] to-transparent p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:p-6">
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
          animation: lineDrawIn 3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 z-10">
        <div>
          <h3 className="text-lg font-medium tracking-tight text-neutral-50 font-display">
            {exerciseName || "Evolução de Carga"}
          </h3>
          <p className="text-xs text-neutral-500 font-medium tracking-wide uppercase mt-0.5">Performance Analytics</p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.05] transition-colors text-xs font-medium shadow-sm bg-neutral-950 text-neutral-400">
          Histórico
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-neutral-500">
            <path d="m6 9 6 6 6-6"></path>
          </svg>
        </div>
      </div>

      {/* Metrics Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-8 z-10">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md border bg-neutral-950/50 border-neutral-800">
          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(65,31,128,0.4)]"></div>
          <span className="text-xs font-medium text-neutral-400">Carga Atual <span className="ml-1 text-neutral-50">{lastPoint?.load || 0} kg</span></span>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md border bg-neutral-950/50 border-neutral-800">
          <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
          <span className="text-xs font-medium text-neutral-400">Recorde Pessoal <span className="ml-1 text-neutral-50">{prPoint?.load || 0} kg</span></span>
        </div>
      </div>

      {/* Metric & Chart Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end z-10">
        {/* Left: Performance Indicator */}
        <div className="md:col-span-1 flex flex-col pb-2">
          <span className={`text-4xl font-medium tracking-tight tabular-nums font-display ${Number(evolutionPercent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {Number(evolutionPercent) >= 0 ? '+' : ''}{evolutionPercent}%
          </span>
          <span className="text-xs font-medium mt-1 leading-relaxed text-neutral-400">Eficiência de progressão total</span>
        </div>

        {/* Right: SVG Chart */}
        <div className="relative mt-4 h-32 w-full min-w-0 max-w-full md:col-span-3 md:h-40">
          {/* PR Floating Indicator */}
          {prCoords && (
            <div 
              className="absolute z-20 flex flex-col items-center pointer-events-none anim-tooltip"
              style={{ left: `${(prCoords.x / 600) * 100}%`, top: `${(prCoords.y / 140) * 100}%`, transform: 'translate(-50%, -110%)' }}
            >
              <div className="text-[10px] font-medium px-2.5 py-1.5 rounded-md shadow-[0_8px_20px_-4px_rgba(0,0,0,0.5)] whitespace-nowrap flex items-center gap-2 border backdrop-blur-md bg-neutral-800/90 text-neutral-50 border-neutral-700">
                <div className="relative flex h-1.5 w-1.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-amber-400"></span>
                  <span className="relative inline-flex rounded-full h-1 w-1 bg-amber-400"></span>
                </div>
                PR: {prPoint?.load} kg ({prPoint?.date})
              </div>
              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent -mt-px border-t-neutral-800"></div>
            </div>
          )}

          <svg viewBox="0 0 600 140" className="h-full w-full max-w-full overflow-hidden" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="primaryAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.25"></stop>
                <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0"></stop>
              </linearGradient>
              <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"></feGaussianBlur>
                <feMerge>
                  <feMergeNode in="blur"></feMergeNode>
                  <feMergeNode in="SourceGraphic"></feMergeNode>
                </feMerge>
              </filter>
            </defs>

            {/* Grid Lines */}
            <g stroke="#262626" strokeWidth="1" strokeDasharray="4 4">
              {[100, 200, 300, 400, 500].map(x => (
                <line key={x} x1={x} y1="0" x2={x} y2="140" />
              ))}
            </g>

            {/* Area Path */}
            <path d={areaData} fill="url(#primaryAreaGradient)" />

            {/* Main Line Path */}
            <path 
              d={pathData} 
              fill="none" 
              stroke="rgb(168, 85, 247)" 
              strokeWidth="2.5" 
              vectorEffect="non-scaling-stroke" 
              strokeLinecap="round" 
              className="anim-line-draw" 
            />

            {/* Moving Node */}
            <circle r="4" fill="rgb(168, 85, 247)" filter="url(#glow)">
              <animateMotion dur="4s" repeatCount="indefinite" path={pathData} keyPoints="0;1" keyTimes="0;1" calcMode="linear"></animateMotion>
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="4s" repeatCount="indefinite"></animate>
            </circle>

            {/* Data Markers */}
            {points.map((p, i) => (
              <circle 
                key={i} 
                cx={p.x} 
                cy={p.y} 
                r="3.5" 
                fill="#171717" 
                stroke="rgb(168, 85, 247)" 
                strokeWidth="2" 
                className="transition-all duration-300" 
              />
            ))}

            {/* PR Marker with Radar Pulse */}
            {prCoords && (
              <g transform={`translate(${prCoords.x}, ${prCoords.y})`}>
                <circle cx="0" cy="0" r="5" fill="#171717" stroke="#F59E0B" strokeWidth="2.5" filter="url(#glow)"></circle>
                <circle cx="0" cy="0" r="5" fill="none" stroke="#F59E0B" strokeWidth="2">
                  <animate attributeName="r" values="5;16" dur="2s" repeatCount="indefinite"></animate>
                  <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite"></animate>
                </circle>
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default PremiumPerformanceChart;
