'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useTranslation } from '@/lib/i18n';
import { GestureSequence } from '@/lib/touch-parser';

interface GestureDetailsProps {
  gesture: GestureSequence;
}

export const GestureDetails: React.FC<GestureDetailsProps> = ({ gesture }) => {
  const { t } = useTranslation();
  const data = gesture.points.map((p, i) => ({
    index: i,
    time: p.time - gesture.startTime,
    pressure: p.pressure,
    size: p.size,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">{t('pressureProfile')}</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorPressure" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 'auto']} hide />
                <Tooltip 
                  labelFormatter={(val) => `${t('time')}: ${val}ms`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="pressure" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPressure)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">{t('sizeProfile')}</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSize" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 'auto']} hide />
                <Tooltip 
                  labelFormatter={(val) => `${t('time')}: ${val}ms`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="size" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSize)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs overflow-auto max-h-64">
        <div className="flex justify-between border-b border-slate-700 pb-2 mb-2 text-slate-500 uppercase">
          <span>{t('points')} #</span>
          <span>X</span>
          <span>Y</span>
          <span>{t('pressure')}</span>
          <span>{t('timeMs')}</span>
        </div>
        {gesture.points.map((p, i) => (
          <div key={i} className="flex justify-between py-1 hover:bg-slate-800 rounded px-1">
            <span className="w-12">{i + 1}</span>
            <span className="w-20">{p.x.toFixed(2)}</span>
            <span className="w-20">{p.y.toFixed(2)}</span>
            <span className="w-20">{p.pressure.toFixed(4)}</span>
            <span className="w-20 text-right">{(p.time - gesture.startTime).toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
