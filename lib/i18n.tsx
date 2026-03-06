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
  pressureBase: { zh: '基础压力', en: 'Base Pressure' },
  pressureVar: { zh: '压力变化', en: 'Pressure Var' },
  sizeBase: { zh: '基础大小', en: 'Base Size' },
  sizeVar: { zh: '大小变化', en: 'Size Var' },
  linkSizeAndPressure: { zh: '关联压力与大小', en: 'Link Pressure & Size' },
  
  // Parameter Descriptions
  startXDesc: { zh: '触摸起始位置的水平坐标 (0-1080)', en: 'Horizontal coordinate of the touch start (0-1080)' },
  startYDesc: { zh: '触摸起始位置的垂直坐标 (0-2400)', en: 'Vertical coordinate of the touch start (0-2400)' },
  endXDesc: { zh: '触摸结束位置的水平坐标', en: 'Horizontal coordinate of the touch end' },
  endYDesc: { zh: '触摸结束位置的垂直坐标', en: 'Vertical coordinate of the touch end' },
  distanceDesc: { zh: '滑动路径的总直线距离 (像素)', en: 'Total straight-line distance of the swipe (pixels)' },
  angleDesc: { zh: '滑动的方向角度 (0° 为水平向右)', en: 'Direction angle of the swipe (0° is horizontal right)' },
  curveControlDesc: { zh: '贝塞尔曲线控制点，决定路径的弯曲程度', en: 'Bezier control point, determines path curvature' },
  durationDesc: { zh: '手势从按下到抬起的总耗时 (毫秒)', en: 'Total time from Down to Up (ms)' },
  stepsDesc: { zh: '生成的采样点数量，影响轨迹的精细度', en: 'Number of sample points, affects trajectory detail' },
  jitterDesc: { zh: '为坐标添加随机偏移，模拟手指震颤', en: 'Adds random offset to coordinates, simulating finger tremor' },
  pressureJitterDesc: { zh: '为压力值添加随机波动，模拟非平稳按压', en: 'Adds random fluctuations to pressure, simulating unsteady touch' },
  pressureBaseDesc: { zh: '手势的初始或平均压力水平 (0.0-1.0)', en: 'Initial or average pressure level (0.0-1.0)' },
  pressureVarDesc: { zh: '压力随进度的线性变化量', en: 'Linear change in pressure over progress' },
  sizeBaseDesc: { zh: '触摸点的初始或平均面积大小', en: 'Initial or average touch area size' },
  sizeVarDesc: { zh: '触摸点面积随进度的线性变化量', en: 'Linear change in touch area size over progress' },
  linkSizeAndPressureDesc: { zh: '开启后，触摸面积将随压力大小自动缩放', en: 'When enabled, touch area scales automatically with pressure' },
  fullScreen: { zh: '全屏查看', en: 'Full Screen' },
  exitFullScreen: { zh: '退出全屏', en: 'Exit Full Screen' },
  zoomIn: { zh: '放大', en: 'Zoom In' },
  zoomOut: { zh: '缩小', en: 'Zoom Out' },
  reset: { zh: '重置', en: 'Reset' },
  panToMove: { zh: '拖拽移动', en: 'Drag to Pan' },

  saveToHistory: { zh: '保存到历史记录', en: 'Save to History' },
  download: { zh: '下载', en: 'Download' },
  downloadJson: { zh: '下载 JSON', en: 'Download JSON' },
  downloadPython: { zh: '下载 Python 脚本', en: 'Download Python Script' },
  downloadJS: { zh: '下载 JS 脚本', en: 'Download JS Script' },
  delete: { zh: '删除', en: 'Delete' },
  simulated: { zh: '模拟', en: 'Simulated' },
  
  // Charts
  pressureProfile: { zh: '压力分布', en: 'Pressure Profile' },
  sizeProfile: { zh: '大小分布', en: 'Size Profile' },
  velocityProfile: { zh: '速度分布 (px/ms)', en: 'Velocity Profile (px/ms)' },
  coordinateDynamics: { zh: '坐标动态 (X/Y)', en: 'Coordinate Dynamics (X/Y)' },
  orientationProfile: { zh: '方向角分布', en: 'Orientation Profile' },
  
  // Analysis Conclusion
  dataRealism: { zh: '数据真实性评估', en: 'Data Realism Assessment' },
  realismConclusion: { zh: '评估结论', en: 'Assessment Conclusion' },
  realismScore: { zh: '真实度得分', en: 'Realism Score' },
  samplingRate: { zh: '采样率', en: 'Sampling Rate' },
  smoothness: { zh: '轨迹平滑度', en: 'Trajectory Smoothness' },
  pressureConsistency: { zh: '压力一致性', en: 'Pressure Consistency' },
  lifecycleIntegrity: { zh: '生命周期完整性', en: 'Lifecycle Integrity' },
  
  // Conclusion Tags
  conclusionReal: { zh: '高度疑似真实数据', en: 'Highly Likely Real Data' },
  conclusionSimulated: { zh: '明显模拟迹象', en: 'Clear Signs of Simulation' },
  conclusionIncomplete: { zh: '数据不完整或有偏差', en: 'Incomplete or Biased Data' },
  
  // Conclusion Details
  conclusionRealDesc: { zh: '数据包含自然的微抖动、稳定的采样间隔和完整的 Android MotionEvent 历史记录。', en: 'Data contains natural micro-jitter, stable sampling intervals, and complete Android MotionEvent history.' },
  conclusionSimulatedDesc: { zh: '数据过于平滑，压力变化呈数学规律，或缺乏物理传感器特有的随机噪声。', en: 'Data is too smooth, pressure changes follow mathematical patterns, or lacks random noise characteristic of physical sensors.' },
  conclusionIncompleteDesc: { zh: '缺少 ACTION_DOWN/UP 事件，或者采样率极不稳定，可能导致轨迹还原失真。', en: 'Missing ACTION_DOWN/UP events, or sampling rate is highly unstable, which may cause trajectory distortion.' },

  // Gesture Details
  trajectory: { zh: '轨迹', en: 'Trajectory' },
  velocity: { zh: '速度', en: 'Velocity' },
  time: { zh: '时间', en: 'Time' },
  pressure: { zh: '压力', en: 'Pressure' },
  size: { zh: '大小', en: 'Size' },
  points: { zh: '点', en: 'Points' },
  durationLabel: { zh: '时长', en: 'Duration' },
  startLabel: { zh: '起点 (按下)', en: 'Start (Down)' },
  endLabel: { zh: '终点 (抬起)', en: 'End (Up)' },
  timeMs: { zh: '时间 (ms)', en: 'Time (ms)' },
  rawEventData: { zh: '原始事件数据', en: 'Raw Event Data' },
  eventSequence: { zh: '事件序列', en: 'Event Sequence' },
  actionSequence: { zh: '动作序列 (Down/Move/Up)', en: 'Action Sequence (Down/Move/Up)' },
  copyJson: { zh: '复制 JSON', en: 'Copy JSON' },
  copied: { zh: '已复制', en: 'Copied' },
  gesturesSelected: { zh: '个手势已选择', en: 'Gestures Selected' },
  selectAll: { zh: '全选', en: 'Select All' },
  deselectAll: { zh: '取消全选', en: 'Deselect All' },
  multiRealismDesc: { zh: '对多个手势的一致性和类人模式进行综合分析。', en: 'Comprehensive analysis of multiple gestures for consistency and human-like patterns.' },
  avgRealismScore: { zh: '平均真实度', en: 'Avg Score' },
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
