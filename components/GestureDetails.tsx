'use client';

import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceDot,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { useTranslation } from '@/lib/i18n';
import { GestureSequence } from '@/lib/touch-parser';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldQuestion,
  Activity,
  Zap,
  MousePointer2,
  Move,
  Code,
  BarChart3,
  Copy,
  Check,
  Clock,
  ListTree
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GestureDetailsProps {
  gestures: GestureSequence[];
}

const COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', 
  '#0ea5e9', '#6366f1', '#d946ef', '#f97316', '#84cc16'
];

export const GestureDetails: React.FC<GestureDetailsProps> = ({ gestures }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'analytics' | 'raw'>('analytics');
  const [copied, setCopied] = useState(false);
  
  const isMulti = gestures.length > 1;

  const chartData = useMemo(() => {
    // Collect all unique relative timestamps
    const allTimes = new Set<number>();
    gestures.forEach(g => {
      g.points.forEach(p => allTimes.add(p.time - g.startTime));
    });
    
    const sortedTimes = Array.from(allTimes).sort((a, b) => a - b);
    
    return sortedTimes.map(time => {
      const entry: any = { time };
      gestures.forEach((g, gIdx) => {
        const p = g.points.find(p => (p.time - g.startTime) === time);
        if (p) {
          entry[`pressure_${gIdx}`] = p.pressure;
          entry[`size_${gIdx}`] = p.size;
          entry[`x_${gIdx}`] = p.x;
          entry[`y_${gIdx}`] = p.y;
          
          const pIdx = g.points.indexOf(p);
          const prev = g.points[pIdx - 1];
          if (prev) {
            const dx = p.x - prev.x;
            const dy = p.y - prev.y;
            const dt = p.time - prev.time;
            if (dt > 0) {
              entry[`velocity_${gIdx}`] = Number((Math.sqrt(dx * dx + dy * dy) / dt).toFixed(4));
              entry[`interval_${gIdx}`] = dt;
            }
          }
          
          entry[`actionValue_${gIdx}`] = p.rawEvent?.actionName === 'ACTION_DOWN' ? 1 : 
                                         p.rawEvent?.actionName === 'ACTION_UP' ? 3 : 
                                         p.rawEvent?.actionName === 'ACTION_CANCEL' ? 0 : 2;
        }
      });
      return entry;
    });
  }, [gestures]);

  const markers = useMemo(() => {
    const allMarkers: any[] = [];
    gestures.forEach((g, gIdx) => {
      g.points.forEach((p, pIdx) => {
        const action = p.rawEvent?.actionName || (pIdx === 0 ? 'ACTION_DOWN' : pIdx === g.points.length - 1 ? 'ACTION_UP' : 'ACTION_MOVE');
        if (action === 'ACTION_DOWN' || action === 'ACTION_UP') {
          allMarkers.push({
            gestureIdx: gIdx,
            time: p.time - g.startTime,
            pressure: p.pressure,
            size: p.size,
            x: p.x,
            y: p.y,
            action,
            actionValue: action === 'ACTION_DOWN' ? 1 : 3
          });
        }
      });
    });
    return allMarkers;
  }, [gestures]);

  const handleCopy = () => {
    const json = JSON.stringify(gestures.map(g => g.points.map(p => p.rawEvent || p)), null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const realismAssessments = useMemo(() => {
    return gestures.map(gesture => {
      const points = gesture.points;
      if (points.length < 3) return null;

      let score = 0;
      const reasons: string[] = [];

      // 1. Sampling Rate
      const deltas = [];
      for (let i = 1; i < points.length; i++) {
        deltas.push(points[i].time - points[i - 1].time);
      }
      const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      const deltaVar = deltas.reduce((a, b) => a + Math.pow(b - avgDelta, 2), 0) / deltas.length;
      
      if (deltaVar > 0.1 && deltaVar < 20) score += 25;
      else if (deltaVar < 0.001) reasons.push("Perfectly uniform sampling (Simulated)");

      // 2. Pressure Jitter
      const pDeltas = [];
      for (let i = 1; i < points.length; i++) {
        pDeltas.push(Math.abs(points[i].pressure - points[i - 1].pressure));
      }
      const avgPDelta = pDeltas.reduce((a, b) => a + b, 0) / pDeltas.length;
      if (avgPDelta > 0.0001 && avgPDelta < 0.05) score += 25;
      else if (avgPDelta === 0) reasons.push("Constant pressure (Simulated/Low Fidelity)");

      // 3. Trajectory Smoothness
      const velocities = [];
      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        const prev = points[i-1];
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;
        const dt = p.time - prev.time;
        if (dt > 0) velocities.push(Math.sqrt(dx * dx + dy * dy) / dt);
      }
      const midIdx = Math.floor(velocities.length / 2);
      if (velocities[midIdx] > velocities[0] && velocities[midIdx] > velocities[velocities.length - 1]) score += 25;

      // 4. Lifecycle
      if (gesture.type !== 'UNKNOWN') score += 25;
      else reasons.push("Incomplete lifecycle (Missing Down/Up)");

      let conclusion: 'real' | 'simulated' | 'incomplete' = 'real';
      if (score < 40) conclusion = 'simulated';
      else if (score < 75) conclusion = 'incomplete';

      return { score, conclusion, reasons, id: gesture.id };
    }).filter(Boolean);
  }, [gestures]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('analytics')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'analytics' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <BarChart3 size={16} />
          {t('analyzer')}
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'raw' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Code size={16} />
          {t('rawEventData')}
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <>
          {/* Realism Assessment */}
          {realismAssessments.length > 0 && (
            <div className={cn(
              "p-6 rounded-2xl border flex flex-col md:flex-row gap-6 items-start md:items-center transition-all",
              realismAssessments.every(a => a?.conclusion === 'real') ? "bg-emerald-50 border-emerald-100" :
              realismAssessments.some(a => a?.conclusion === 'simulated') ? "bg-amber-50 border-amber-100" : "bg-blue-50 border-blue-100"
            )}>
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                realismAssessments.every(a => a?.conclusion === 'real') ? "bg-emerald-500 text-white" :
                realismAssessments.some(a => a?.conclusion === 'simulated') ? "bg-amber-500 text-white" : "bg-blue-500 text-white"
              )}>
                {realismAssessments.every(a => a?.conclusion === 'real') ? <ShieldCheck size={32} /> :
                 realismAssessments.some(a => a?.conclusion === 'simulated') ? <ShieldAlert size={32} /> : <ShieldQuestion size={32} />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-900">{t('dataRealism')}</h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                    realismAssessments.every(a => a?.conclusion === 'real') ? "bg-emerald-100 text-emerald-700" :
                    realismAssessments.some(a => a?.conclusion === 'simulated') ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {isMulti ? (
                      `${realismAssessments.filter(a => a?.conclusion === 'real').length}/${realismAssessments.length} ${t('conclusionReal')}`
                    ) : (
                      realismAssessments[0]?.conclusion ? 
                        t(`conclusion${realismAssessments[0].conclusion.charAt(0).toUpperCase() + realismAssessments[0].conclusion.slice(1)}`) : 
                        ''
                    )}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {isMulti ? (
                    t('multiRealismDesc') || 'Analysis of multiple gestures for consistency and human-like patterns.'
                  ) : (
                    realismAssessments[0]?.conclusion ? 
                      t(`conclusion${realismAssessments[0].conclusion.charAt(0).toUpperCase() + realismAssessments[0].conclusion.slice(1)}Desc`) : 
                      ''
                  )}
                </p>
              </div>
              <div className="shrink-0 text-center px-6 py-2 bg-white/50 rounded-xl border border-white/20">
                <div className="text-2xl font-black text-slate-900">
                  {Math.round(realismAssessments.reduce((acc, a) => acc + (a?.score || 0), 0) / realismAssessments.length)}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('avgRealismScore') || 'Avg Score'}</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pressure Chart */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-blue-500" />
                {t('pressureProfile')}
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 'auto']} hide />
                    <Tooltip 
                      labelFormatter={(val) => `${t('time')}: ${val}ms`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    {gestures.map((_, i) => (
                      <Line 
                        key={i}
                        type="monotone" 
                        dataKey={`pressure_${i}`} 
                        stroke={COLORS[i % COLORS.length]} 
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    ))}
                    {markers.map((m, idx) => (
                      <ReferenceDot 
                        key={idx} 
                        x={m.time} 
                        y={m.pressure} 
                        r={3} 
                        fill={m.action === 'ACTION_DOWN' ? '#10b981' : '#ef4444'} 
                        stroke="white" 
                        strokeWidth={1.5}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Size Chart */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Zap size={14} className="text-purple-500" />
                {t('sizeProfile')}
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 'auto']} hide />
                    <Tooltip 
                      labelFormatter={(val) => `${t('time')}: ${val}ms`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    {gestures.map((_, i) => (
                      <Line 
                        key={i}
                        type="monotone" 
                        dataKey={`size_${i}`} 
                        stroke={COLORS[i % COLORS.length]} 
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    ))}
                    {markers.map((m, idx) => (
                      <ReferenceDot 
                        key={idx} 
                        x={m.time} 
                        y={m.size} 
                        r={3} 
                        fill={m.action === 'ACTION_DOWN' ? '#10b981' : '#ef4444'} 
                        stroke="white" 
                        strokeWidth={1.5}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Coordinate Dynamics Chart */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Move size={14} className="text-rose-500" />
                {t('coordinateDynamics')}
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip 
                      labelFormatter={(val) => `${t('time')}: ${val}ms`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    {gestures.map((_, i) => (
                      <React.Fragment key={i}>
                        <Line type="monotone" dataKey={`x_${i}`} stroke={COLORS[i % COLORS.length]} strokeWidth={1.5} dot={false} connectNulls />
                        <Line type="monotone" dataKey={`y_${i}`} stroke={COLORS[i % COLORS.length]} strokeWidth={1.5} strokeDasharray="5 5" dot={false} connectNulls />
                      </React.Fragment>
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Timing Distribution Chart */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Clock size={14} className="text-amber-500" />
                {t('samplingRate')}
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" hide />
                    <YAxis dataKey="interval" hide />
                    <ZAxis range={[20, 100]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      labelFormatter={(val) => `${t('time')}: ${val}ms`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    {gestures.map((_, i) => (
                      <Scatter 
                        key={i}
                        name={`G${i+1}`} 
                        data={chartData.filter(d => d[`interval_${i}`] > 0).map(d => ({ time: d.time, interval: d[`interval_${i}`] }))} 
                        fill={COLORS[i % COLORS.length]} 
                      />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Action Sequence Chart */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-4">
            <h3 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
              <ListTree size={14} className="text-indigo-500" />
              {t('actionSequence')}
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 4]} hide />
                  <Tooltip 
                    labelFormatter={(val) => `${t('time')}: ${val}ms`}
                    formatter={(val: any) => {
                      const v = Number(val);
                      const label = v === 1 ? 'DOWN' : v === 2 ? 'MOVE' : v === 3 ? 'UP' : 'CANCEL';
                      return [label, t('action')];
                    }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  {gestures.map((_, i) => (
                    <Line 
                      key={i}
                      type="stepAfter" 
                      dataKey={`actionValue_${i}`} 
                      stroke={COLORS[i % COLORS.length]} 
                      strokeWidth={2} 
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {!isMulti && (
            <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs overflow-auto max-h-64">
              <div className="flex justify-between border-b border-slate-700 pb-2 mb-2 text-slate-500 uppercase">
                <span>{t('points')} #</span>
                <span>X</span>
                <span>Y</span>
                <span>{t('pressure')}</span>
                <span>V (px/ms)</span>
                <span>{t('timeMs')}</span>
              </div>
              {gestures[0].points.map((p, i) => {
                const prev = gestures[0].points[i - 1];
                let velocity = 0;
                if (prev) {
                  const dx = p.x - prev.x;
                  const dy = p.y - prev.y;
                  const dt = p.time - prev.time;
                  if (dt > 0) velocity = Math.sqrt(dx * dx + dy * dy) / dt;
                }
                return (
                  <div key={i} className="flex justify-between py-1 hover:bg-slate-800 rounded px-1">
                    <span className="w-12">{i + 1}</span>
                    <span className="w-20">{p.x.toFixed(2)}</span>
                    <span className="w-20">{p.y.toFixed(2)}</span>
                    <span className="w-20">{p.pressure.toFixed(4)}</span>
                    <span className="w-20">{velocity.toFixed(3)}</span>
                    <span className="w-20 text-right">{(p.time - gestures[0].startTime).toFixed(0)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700">{t('eventSequence')}</h3>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all active:scale-95"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? t('copied') : t('copyJson')}
            </button>
          </div>
          <div className="bg-slate-900 text-emerald-400 p-6 rounded-2xl font-mono text-xs overflow-auto max-h-[600px] shadow-inner border border-slate-800">
            <pre className="whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(gestures.map(g => g.points.map(p => p.rawEvent || p)), null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
