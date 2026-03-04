'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'zh' | 'en';

interface Translations {
  [key: string]: {
    zh: string;
    en: string;
  };
}

const translations: Translations = {
  // Header & Tabs
  appName: { zh: 'TouchTrace 分析器', en: 'TouchTrace Analyzer' },
  analyzer: { zh: '分析器', en: 'Analyzer' },
  simulator: { zh: '模拟器', en: 'Simulator' },
  newAnalysis: { zh: '新分析', en: 'New Analysis' },
  
  // Analyzer Home
  analyzeTitle: { zh: '分析您的触摸事件', en: 'Analyze Your Touch Events' },
  analyzeDesc: { zh: '上传 Android 触摸事件记录文件或使用模拟器生成合成数据。', en: 'Upload an Android touch event record file or use the Simulator to generate synthetic data.' },
  uploadJson: { zh: '上传 JSON', en: 'Upload JSON' },
  openSimulator: { zh: '打开模拟器', en: 'Open Simulator' },
  
  // History
  history: { zh: '历史记录', en: 'History' },
  clearAll: { zh: '清空全部', en: 'Clear All' },
  confirmClear: { zh: '您确定要清空所有历史记录吗？', en: 'Are you sure you want to clear all history?' },
  
  // Stats & Analysis
  formatAnalysis: { zh: '格式分析', en: 'Format Analysis' },
  standardFormat: { zh: '标准 Android 格式', en: 'Standard Android Format' },
  standardFormatDesc: { zh: '记录正确捕获了完整的 MotionEvent 生命周期。', en: 'The record correctly captures the full MotionEvent lifecycle.' },
  highFidelity: { zh: '高保真度', en: 'High Fidelity' },
  highFidelityDesc: { zh: '使用 historicalEvents 确保主事件样本之间的轨迹平滑重建。', en: 'The use of historicalEvents ensures smooth trajectory reconstruction between main event samples.' },
  keyParameters: { zh: '关键参数', en: 'Key Parameters' },
  keyParametersDesc: { zh: '坐标 (X/Y)、压力、大小和时间均存在且类型正确。', en: 'Coordinates (X/Y), Pressure, Size, and Timing are all present and correctly typed.' },
  currentSession: { zh: '当前会话', en: 'Current Session' },
  totalGestures: { zh: '总手势数', en: 'Total Gestures' },
  dataPoints: { zh: '数据点', en: 'Data Points' },
  gestureSequence: { zh: '手势序列', en: 'Gesture Sequence' },
  
  // Visualization
  livePreview: { zh: '实时预览', en: 'Live Preview' },
  gestureAnalysis: { zh: '手势分析', en: 'Gesture Analysis' },
  simulatedDynamics: { zh: '模拟动力学', en: 'Simulated Dynamics' },
  selectGestureDesc: { zh: '从列表或地图中选择一个手势以查看详细分析', en: 'Select a gesture from the list or map to view detailed analytics' },
  
  // Simulator Parameters
  parameters: { zh: '参数设置', en: 'Parameters' },
  regenerate: { zh: '重新生成', en: 'Regenerate' },
  rightHand: { zh: '右手滑动', en: 'Right Hand' },
  leftHand: { zh: '左手滑动', en: 'Left Hand' },
  click: { zh: '点击', en: 'Click' },
  startX: { zh: '起点 X', en: 'Start X' },
  startY: { zh: '起点 Y', en: 'Start Y' },
  endX: { zh: '终点 X', en: 'End X' },
  endY: { zh: '终点 Y', en: 'End Y' },
  distance: { zh: '滑动距离', en: 'Distance' },
  angle: { zh: '滑动角度 (°)', en: 'Angle (°)' },
  curveControl: { zh: '曲线控制 X', en: 'Curve Control X' },
  duration: { zh: '持续时间 (ms)', en: 'Duration (ms)' },
  steps: { zh: '步数', en: 'Steps' },
  jitter: { zh: '位置抖动', en: 'Position Jitter' },
  pressureJitter: { zh: '压力抖动', en: 'Pressure Jitter' },
  saveToHistory: { zh: '保存到历史记录', en: 'Save to History' },
  download: { zh: '下载', en: 'Download' },
  downloadJson: { zh: '下载 JSON', en: 'Download JSON' },
  delete: { zh: '删除', en: 'Delete' },
  simulated: { zh: '模拟', en: 'Simulated' },

  // Gesture Details
  trajectory: { zh: '轨迹', en: 'Trajectory' },
  pressureProfile: { zh: '压力分布', en: 'Pressure Profile' },
  sizeProfile: { zh: '大小分布', en: 'Size Profile' },
  velocity: { zh: '速度', en: 'Velocity' },
  time: { zh: '时间', en: 'Time' },
  pressure: { zh: '压力', en: 'Pressure' },
  size: { zh: '大小', en: 'Size' },
  points: { zh: '点', en: 'Points' },
  durationLabel: { zh: '时长', en: 'Duration' },
  startLabel: { zh: '起点 (按下)', en: 'Start (Down)' },
  endLabel: { zh: '终点 (抬起)', en: 'End (Up)' },
  timeMs: { zh: '时间 (ms)', en: 'Time (ms)' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_language') as Language;
      return saved || 'zh';
    }
    return 'zh';
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string) => {
    if (!translations[key]) return key;
    return translations[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
