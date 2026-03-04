'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { processTouchEvents, GestureSequence, TouchDataExport } from '@/lib/touch-parser';
import { TrajectoryMap } from '@/components/TrajectoryMap';
import { GestureDetails } from '@/components/GestureDetails';
import { TouchSimulator } from '@/components/TouchSimulator';
import { useTranslation } from '@/lib/i18n';
import { 
  Activity, 
  MousePointer2, 
  Move, 
  FileJson, 
  AlertCircle,
  Info,
  ChevronRight,
  Clock,
  Layers,
  History,
  Trash2,
  Plus,
  Zap,
  BarChart3,
  Globe,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryItem {
  id: string;
  name: string;
  timestamp: number;
  data: string;
}

export default function TouchAnalyzer() {
  const { t, language, setLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState<'analyzer' | 'simulator'>('analyzer');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedGestureId, setSelectedGestureId] = useState<string | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('touch_trace_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to load history', e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('touch_trace_history', JSON.stringify(history));
  }, [history]);

  const rawData = useMemo(() => {
    const session = history.find(h => h.id === currentSessionId);
    return session?.data || '';
  }, [history, currentSessionId]);

  const sequences = useMemo(() => {
    if (!rawData) return [];
    try {
      const parsed = JSON.parse(rawData) as TouchDataExport;
      if (!parsed.events || !Array.isArray(parsed.events)) {
        throw new Error('Invalid format: "events" array missing');
      }
      return processTouchEvents(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse JSON');
      return [];
    }
  }, [rawData]);

  const selectedGesture = useMemo(() => 
    sequences.find(s => s.id === selectedGestureId), 
    [sequences, selectedGestureId]
  );

  const stats = useMemo(() => {
    if (sequences.length === 0) return null;
    const types = sequences.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalPoints = sequences.reduce((acc, s) => acc + s.points.length, 0);
    const avgPoints = totalPoints / sequences.length;

    return { types, totalPoints, avgPoints };
  }, [sequences]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as string;
      saveSession(data, file.name);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const saveSession = (data: string, name: string) => {
    const newId = `session-${Date.now()}`;
    const newItem: HistoryItem = {
      id: newId,
      name: name,
      timestamp: Date.now(),
      data: data
    };
    
    setHistory(prev => [newItem, ...prev]);
    setCurrentSessionId(newId);
    setError(null);
    setSelectedGestureId(null);
    setActiveTab('analyzer');
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(h => h.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const clearAllHistory = () => {
    if (confirm(t('confirmClear'))) {
      setHistory([]);
      setCurrentSessionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Activity size={20} />
            </div>
            <h1 className="font-bold text-lg tracking-tight">{t('appName')}</h1>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setActiveTab('analyzer')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                activeTab === 'analyzer' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <BarChart3 size={16} />
              {t('analyzer')}
            </button>
            <button 
              onClick={() => setActiveTab('simulator')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                activeTab === 'simulator' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Zap size={16} />
              {t('simulator')}
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button 
                onClick={() => setLanguage('zh')}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded transition-all",
                  language === 'zh' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                )}
              >
                中
              </button>
              <button 
                onClick={() => setLanguage('en')}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded transition-all",
                  language === 'en' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                )}
              >
                EN
              </button>
            </div>

            <label className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">
              <Plus size={16} />
              {t('newAnalysis')}
              <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'simulator' ? (
          <TouchSimulator onSave={saveSession} />
        ) : (
          <>
            {history.length === 0 ? (
              <div className="max-w-2xl mx-auto text-center py-20">
                <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                  <Layers size={40} />
                </div>
                <h2 className="text-2xl font-bold mb-4">{t('analyzeTitle')}</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  {t('analyzeDesc')}
                </p>
                <div className="flex justify-center gap-4">
                  <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer group relative w-full max-w-sm">
                    <input type="file" accept=".json" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                    <div className="flex flex-col items-center">
                      <FileJson size={48} className="text-slate-300 group-hover:text-indigo-400 mb-4 transition-colors" />
                      <p className="font-medium text-slate-600">{t('uploadJson')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('simulator')}
                    className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-colors group w-full max-w-sm"
                  >
                    <div className="flex flex-col items-center">
                      <Zap size={48} className="text-slate-300 group-hover:text-indigo-400 mb-4 transition-colors" />
                      <p className="font-medium text-slate-600">{t('openSimulator')}</p>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: History & Stats */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Session Switcher */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <History size={16} className="text-slate-400" />
                        {t('history')}
                      </h3>
                      <button 
                        onClick={clearAllHistory}
                        className="text-[10px] text-slate-400 hover:text-red-500 font-bold uppercase tracking-wider transition-colors"
                      >
                        {t('clearAll')}
                      </button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setCurrentSessionId(item.id);
                            setSelectedGestureId(null);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between p-3 border-b border-slate-50 text-left transition-all cursor-pointer group",
                            currentSessionId === item.id ? "bg-indigo-50" : "hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              currentSessionId === item.id ? "bg-indigo-600" : "bg-slate-300"
                            )} />
                            <div className="truncate">
                              <div className={cn(
                                "text-sm truncate",
                                currentSessionId === item.id ? "font-bold text-indigo-900" : "text-slate-600"
                              )}>
                                {item.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(item.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const blob = new Blob([item.data], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${item.name.replace(/\.[^/.]+$/, "")}.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title={t('downloadJson')}
                            >
                              <Download size={14} />
                            </button>
                            <button 
                              onClick={(e) => deleteSession(item.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title={t('delete')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Parameter Analysis Card */}
                  <div className="bg-indigo-900 text-indigo-100 p-6 rounded-2xl shadow-lg shadow-indigo-200/50">
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <AlertCircle size={14} />
                      {t('formatAnalysis')}
                    </h3>
                    <div className="space-y-3 text-xs leading-relaxed">
                      <p>
                        <span className="text-white font-bold">✓ {t('standardFormat')}:</span> {t('standardFormatDesc')}
                      </p>
                      <p>
                        <span className="text-white font-bold">✓ {t('highFidelity')}:</span> {t('highFidelityDesc')}
                      </p>
                      <p>
                        <span className="text-white font-bold">✓ {t('keyParameters')}:</span> {t('keyParametersDesc')}
                      </p>
                    </div>
                  </div>

                  {/* Stats Card */}
                  {stats && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Info size={14} />
                        {t('currentSession')}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="text-2xl font-bold text-indigo-600">{sequences.length}</div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">{t('totalGestures')}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="text-2xl font-bold text-emerald-600">{stats.totalPoints}</div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">{t('dataPoints')}</div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="space-y-2">
                          {Object.entries(stats.types).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between text-sm">
                              <span className="text-slate-600 flex items-center gap-2">
                                {type === 'CLICK' ? <MousePointer2 size={14} /> : <Move size={14} />}
                                {type}
                              </span>
                              <span className="font-bold text-slate-900">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gesture List */}
                  {sequences.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-4 duration-700">
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-700">{t('gestureSequence')}</h3>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {sequences.map((seq, idx) => (
                          <button
                            key={seq.id}
                            onClick={() => setSelectedGestureId(seq.id)}
                            className={cn(
                              "w-full flex items-center justify-between p-4 border-b border-slate-50 text-left transition-all hover:bg-slate-50",
                              selectedGestureId === seq.id && "bg-indigo-50 border-l-4 border-l-indigo-600"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                seq.type === 'CLICK' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                              )}>
                                {seq.type === 'CLICK' ? <MousePointer2 size={16} /> : <Move size={16} />}
                              </div>
                              <div>
                                <div className="font-bold text-sm">{seq.type} #{idx + 1}</div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Clock size={10} />
                                  {seq.endTime - seq.startTime}ms • {seq.points.length} pts
                                </div>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-300" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Visualization */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Trajectory Map */}
                  <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm h-[600px]">
                    <TrajectoryMap 
                      sequences={sequences} 
                      selectedGestureId={selectedGestureId}
                      onSelectGesture={setSelectedGestureId}
                    />
                  </div>

                  {/* Details Section */}
                  {selectedGesture ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-xl font-bold">{t('gestureAnalysis')}</h2>
                        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase">
                          {selectedGesture.type}
                        </span>
                      </div>
                      <GestureDetails gesture={selectedGesture} />
                    </div>
                  ) : (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                      <MousePointer2 size={32} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">{t('selectGestureDesc')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}
