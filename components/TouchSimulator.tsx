'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TrajectoryMap } from './TrajectoryMap';
import { GestureDetails } from './GestureDetails';
import { processTouchEvents, TouchDataExport } from '@/lib/touch-parser';
import { useTranslation } from '@/lib/i18n';
import { 
  Save, 
  RefreshCw, 
  Settings2, 
  Zap,
  MousePointer2,
  MoveUp,
  Activity,
  Download,
  FileCode,
  Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TouchSimulatorProps {
  onSave: (data: string, name: string) => void;
}

// Simple seedable RNG
const mulberry32 = (a: number) => {
  return () => {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

export const TouchSimulator: React.FC<TouchSimulatorProps> = ({ onSave }) => {
  const { t } = useTranslation();
  // Simulation Parameters
  const [startX, setStartX] = useState(350);
  const [startY, setStartY] = useState(1900);
  const [endX, setEndX] = useState(700);
  const [endY, setEndY] = useState(500);
  const [curveX, setCurveX] = useState(50);
  const [duration, setDuration] = useState(400);
  const [steps, setSteps] = useState(35);
  const [jitter, setJitter] = useState(0);
  const [pressureJitter, setPressureJitter] = useState(0);
  const [pressureBase, setPressureBase] = useState(0.18);
  const [pressureVar, setPressureVar] = useState(0.02);
  const [seed, setSeed] = useState(1);

  const [selectedGestureIds, setSelectedGestureIds] = useState<string[]>([]);

  const currentParams = {
    startX, startY, endX, endY, curveX, duration, steps, jitter, pressureJitter, pressureBase, pressureVar, seed
  };

  const downloadPythonScript = () => {
    const script = `
import json
import math
import time

def mulberry32(a):
    state = [a]
    def next_val():
        state[0] = (state[0] + 0x6D2B79F5) & 0xFFFFFFFF
        t = state[0]
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + ((t ^ (t >> 7)) * (t | 61))) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) >> 0) / 4294967296.0
    return next_val

def generate_touch_data(params):
    rng = mulberry32(params['seed'])
    start_time = int(time.time() * 1000)
    down_time = start_time
    events = []

    p0 = (params['startX'], params['startY'])
    p2 = (params['endX'], params['endY'])
    p1 = (params['curveX'], (params['startY'] + params['endY']) / 2)

    def get_bezier_point(t, p0, p1, p2):
        x = (1 - t)**2 * p0[0] + 2 * (1 - t) * t * p1[0] + t**2 * p2[0]
        y = (1 - t)**2 * p0[1] + 2 * (1 - t) * t * p1[1] + t**2 * p2[1]
        return x, y

    for i in range(params['steps']):
        t_val = i / (params['steps'] - 1)
        progress = 1 - (1 - t_val)**3
        
        curr_x, curr_y = get_bezier_point(progress, p0, p1, p2)
        curr_x += (rng() - 0.5) * params['jitter'] * 2
        curr_y += (rng() - 0.5) * params['jitter'] * 2

        pressure = params['pressureBase'] + params['pressureVar'] * (progress - 0.5)
        if params['pressureJitter'] > 0:
            pressure += (rng() - 0.5) * params['pressureJitter']
        
        pressure = max(0.01, min(1.0, pressure))
        
        action = "ACTION_MOVE"
        if i == 0:
            action = "ACTION_DOWN"
            pressure = min(1.0, pressure + 0.02)
        elif i == params['steps'] - 1:
            action = "ACTION_UP"

        event_time = start_time + int(params['duration'] * t_val)
        
        events.append({
            "id": 5000 + i,
            "gestureType": "SIMULATED",
            "actionName": action,
            "x": round(curr_x, 5),
            "y": round(curr_y, 5),
            "pressure": round(pressure, 5),
            "size": round(pressure * 0.15, 5),
            "eventTime": event_time,
            "downTime": down_time,
            "timestamp": event_time + 1000,
            "historicalEvents": []
        })

    return {
        "exportTime": start_time + params['duration'] + 100,
        "totalEvents": len(events),
        "events": events
    }

params = ${JSON.stringify(currentParams, null, 4)}
data = generate_touch_data(params)
with open('simulated_touch.json', 'w') as f:
    json.dump(data, f, indent=2)
print("Generated simulated_touch.json")
`;
    const blob = new Blob([script], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reproduce_touch.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSScript = () => {
    const script = `
const fs = require('fs');

const mulberry32 = (a) => {
  let state = a;
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ state >>> 15, state | 1);
    t = t ^ (t + Math.imul(t ^ t >>> 7, t | 61)) | 0;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

function generateTouchData(params) {
  const rng = mulberry32(params.seed);
  const startTime = Date.now();
  const downTime = startTime;
  const events = [];

  const p0 = [params.startX, params.startY];
  const p2 = [params.endX, params.endY];
  const p1 = [params.curveX, (params.startY + params.endY) / 2];

  const getBezierPoint = (t, p0, p1, p2) => {
    const x = Math.pow(1 - t, 2) * p0[0] + 2 * (1 - t) * t * p1[0] + Math.pow(t, 2) * p2[0];
    const y = Math.pow(1 - t, 2) * p0[1] + 2 * (1 - t) * t * p1[1] + Math.pow(t, 2) * p2[1];
    return [x, y];
  };

  for (let i = 0; i < params.steps; i++) {
    const tVal = i / (params.steps - 1);
    const progress = 1 - Math.pow(1 - tVal, 3);
    
    let [currX, currY] = getBezierPoint(progress, p0, p1, p2);
    currX += (rng() - 0.5) * params.jitter * 2;
    currY += (rng() - 0.5) * params.jitter * 2;

    let pressure = params.pressureBase + params.pressureVar * (progress - 0.5);
    if (params.pressureJitter > 0) {
      pressure += (rng() - 0.5) * params.pressureJitter;
    }
    pressure = Math.max(0.01, Math.min(1.0, pressure));

    let action = "ACTION_MOVE";
    if (i === 0) {
      action = "ACTION_DOWN";
      pressure = Math.min(1.0, pressure + 0.02);
    } else if (i === params.steps - 1) {
      action = "ACTION_UP";
    }

    const eventTime = startTime + Math.floor(params.duration * tVal);

    events.push({
      id: 5000 + i,
      gestureType: "SIMULATED",
      actionName: action,
      x: Number(currX.toFixed(5)),
      y: Number(currY.toFixed(5)),
      pressure: Number(pressure.toFixed(5)),
      size: Number((pressure * 0.15).toFixed(5)),
      eventTime,
      downTime,
      timestamp: eventTime + 1000,
      historicalEvents: []
    });
  }

  return {
    exportTime: startTime + params.duration + 100,
    totalEvents: events.length,
    events: events
  };
}

const params = ${JSON.stringify(currentParams, null, 2)};
const data = generateTouchData(params);
fs.writeFileSync('simulated_touch.json', JSON.stringify(data, null, 2));
console.log("Generated simulated_touch.json");
`;
    const blob = new Blob([script], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reproduce_touch.js';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Derive distance/angle from end points
  const { distance, angle } = useMemo(() => {
    const dx = endX - startX;
    const dy = endY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ang = Math.atan2(dy, dx) * (180 / Math.PI);
    return {
      distance: Math.round(dist),
      angle: Math.round(ang)
    };
  }, [startX, startY, endX, endY]);

  const handleDistanceChange = (newDist: number) => {
    const rad = angle * (Math.PI / 180);
    setEndX(Math.round(startX + newDist * Math.cos(rad)));
    setEndY(Math.round(startY + newDist * Math.sin(rad)));
  };

  const handleAngleChange = (newAngle: number) => {
    const rad = newAngle * (Math.PI / 180);
    setEndX(Math.round(startX + distance * Math.cos(rad)));
    setEndY(Math.round(startY + distance * Math.sin(rad)));
  };

  // We use useMemo but with a seedable RNG to keep it "pure" for the linter
  const simulatedData = useMemo(() => {
    const rng = mulberry32(seed);
    const startTime = 1700000000000 + seed; // Semi-stable start time
    const downTime = startTime;
    const events: any[] = [];

    const p0: [number, number] = [startX, startY];
    const p2: [number, number] = [endX, endY];
    const p1: [number, number] = [curveX, (startY + endY) / 2];

    const getBezierPoint = (t: number, p0: [number, number], p1: [number, number], p2: [number, number]): [number, number] => {
      const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0];
      const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1];
      return [x, y];
    };

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const progress = 1 - Math.pow(1 - t, 3);
      
      let [currX, currY] = getBezierPoint(progress, p0, p1, p2);
      
      currX += (rng() - 0.5) * jitter * 2;
      currY += (rng() - 0.5) * jitter * 2;

      let action = "ACTION_MOVE";
      
      // More realistic pressure: starts stable, slight linear variation if pressureVar > 0
      // This avoids the "hump" shape and provides a smooth, flat-ish profile
      let pressure = pressureBase + pressureVar * (progress - 0.5);
      
      // Apply pressure jitter
      if (pressureJitter > 0) {
        pressure += (rng() - 0.5) * pressureJitter;
      }
      
      pressure = Math.max(0.01, Math.min(1.0, pressure));

      if (i === 0) {
        action = "ACTION_DOWN";
        // Slightly higher pressure on initial contact is common
        pressure = Math.min(1.0, pressure + 0.02);
      } else if (i === steps - 1) {
        action = "ACTION_UP";
        // No abrupt drop; maintain the last state
      }

      const eventTime = startTime + Math.floor(duration * t);

      events.push({
        id: 5000 + i + seed * 1000,
        gestureType: "SIMULATED",
        actionName: action,
        x: Number(currX.toFixed(5)),
        y: Number(currY.toFixed(5)),
        pressure: Number(pressure.toFixed(5)),
        size: Number((pressure * 0.15).toFixed(5)),
        eventTime,
        downTime,
        timestamp: eventTime + 1000,
        historicalEvents: action === "ACTION_MOVE" ? [{
          x: Number((currX - 1).toFixed(5)),
          y: Number((currY + 5).toFixed(5)),
          pressure: Number((pressure * 0.98).toFixed(5)),
          size: Number((pressure * 0.15).toFixed(5)),
          eventTime: eventTime - 8
        }] : []
      });
    }

    return {
      exportTime: startTime + duration + 100,
      totalEvents: events.length,
      events: events
    } as TouchDataExport;
  }, [startX, startY, endX, endY, curveX, duration, steps, jitter, pressureJitter, pressureBase, pressureVar, seed]);

  const sequences = useMemo(() => {
    return processTouchEvents(simulatedData);
  }, [simulatedData]);

  const applyPreset = (type: 'right-swipe' | 'left-swipe' | 'click') => {
    if (type === 'right-swipe') {
      setStartX(350); setStartY(1900);
      setEndX(700); setEndY(500);
      setCurveX(50);
      setDuration(400);
      setSteps(35);
      setJitter(0);
      setPressureJitter(0);
    } else if (type === 'left-swipe') {
      setStartX(730); setStartY(1900);
      setEndX(380); setEndY(500);
      setCurveX(1030);
      setDuration(400);
      setSteps(35);
      setJitter(0);
      setPressureJitter(0);
    } else if (type === 'click') {
      setStartX(540); setStartY(1200);
      setEndX(541); setEndY(1201);
      setCurveX(540);
      setDuration(80);
      setSteps(5);
      setJitter(0.2);
      setPressureJitter(0.01);
    }
    setSeed(s => s + 1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Controls Column */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Settings2 size={16} className="text-indigo-600" />
              {t('parameters')}
            </h3>
            <button 
              onClick={() => setSeed(s => s + 1)}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title={t('regenerate')}
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => applyPreset('right-swipe')} className="flex flex-col items-center gap-1 p-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all">
              <MoveUp size={16} className="rotate-12 text-blue-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">{t('rightHand')}</span>
            </button>
            <button onClick={() => applyPreset('left-swipe')} className="flex flex-col items-center gap-1 p-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all">
              <MoveUp size={16} className="-rotate-12 text-purple-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">{t('leftHand')}</span>
            </button>
            <button onClick={() => applyPreset('click')} className="flex flex-col items-center gap-1 p-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all">
              <MousePointer2 size={16} className="text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">{t('click')}</span>
            </button>
          </div>

          <div className="space-y-4">
            <ControlSlider label={t('startX')} value={startX} min={0} max={1080} onChange={setStartX} />
            <ControlSlider label={t('startY')} value={startY} min={0} max={2400} onChange={setStartY} />
            <ControlSlider label={t('endX')} value={endX} min={0} max={1080} onChange={setEndX} />
            <ControlSlider label={t('endY')} value={endY} min={0} max={2400} onChange={setEndY} />
            <div className="grid grid-cols-2 gap-4">
              <ControlSlider label={t('distance')} value={distance} min={0} max={2500} onChange={handleDistanceChange} color="accent-emerald-500" />
              <ControlSlider label={t('angle')} value={angle} min={-180} max={180} onChange={handleAngleChange} color="accent-emerald-500" />
            </div>
            <ControlSlider label={t('curveControl')} value={curveX} min={-500} max={1500} onChange={setCurveX} color="accent-orange-500" />
            <ControlSlider label={t('duration')} value={duration} min={50} max={2000} onChange={setDuration} color="accent-blue-500" />
            <ControlSlider label={t('steps')} value={steps} min={5} max={100} onChange={setSteps} color="accent-slate-500" />
            <div className="grid grid-cols-2 gap-4">
              <ControlSlider label={t('jitter')} value={jitter} min={0} max={10} step={0.1} onChange={setJitter} color="accent-red-500" />
              <ControlSlider label={t('pressureJitter')} value={pressureJitter} min={0} max={0.5} step={0.01} onChange={setPressureJitter} color="accent-red-500" />
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => onSave(JSON.stringify(simulatedData), `${t('simulated')} ${new Date().toLocaleTimeString()}`)}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              <Save size={18} />
              {t('saveToHistory')}
            </button>
            <button 
              onClick={() => {
                const blob = new Blob([JSON.stringify(simulatedData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `simulated_touch_${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all active:scale-95"
              title={t('downloadJson')}
            >
              <Download size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={downloadPythonScript}
              className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all"
            >
              <Terminal size={14} className="text-blue-500" />
              Python
            </button>
            <button 
              onClick={downloadJSScript}
              className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all"
            >
              <FileCode size={14} className="text-yellow-500" />
              JavaScript
            </button>
          </div>
        </div>
      </div>

      {/* Preview Column */}
      <div className="lg:col-span-8 space-y-8">
        <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm h-[600px] relative group">
          <TrajectoryMap 
            sequences={sequences} 
            selectedGestureIds={selectedGestureIds}
            onSelectGesture={(id) => {
              setSelectedGestureIds(prev => 
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
              );
            }}
          />
          <div className="absolute top-6 left-6 pointer-events-none">
            <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-2 shadow-sm">
              <Zap size={14} className="text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('livePreview')}</span>
            </div>
          </div>
        </div>

        {sequences.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity size={20} className="text-indigo-600" />
              {t('simulatedDynamics')}
            </h2>
            <GestureDetails gestures={selectedGestureIds.length > 0 ? sequences.filter(s => selectedGestureIds.includes(s.id)) : sequences} />
          </div>
        )}
      </div>
    </div>
  );
};

const ControlSlider = ({ label, value, min, max, step = 1, onChange, color = "accent-indigo-600" }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
      <span>{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step}
      value={value} 
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        "w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100",
        color
      )}
    />
  </div>
);
