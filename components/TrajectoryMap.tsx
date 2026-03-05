'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useTranslation } from '@/lib/i18n';
import { GestureSequence } from '@/lib/touch-parser';

interface TrajectoryMapProps {
  sequences: GestureSequence[];
  selectedGestureIds: string[];
  onSelectGesture: (id: string) => void;
}

export const TrajectoryMap: React.FC<TrajectoryMapProps> = ({ 
  sequences, 
  selectedGestureIds,
  onSelectGesture 
}) => {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || sequences.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    sequences.forEach(seq => {
      seq.points.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
    });

    // Add some padding
    const padding = 50;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    svg.attr('viewBox', `${minX - padding} ${minY - padding} ${width} ${height}`);

    const line = d3.line<{x: number, y: number}>()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveBasis);

    // Draw sequences
    sequences.forEach(seq => {
      const isSelected = selectedGestureIds.includes(seq.id);
      
      // Draw path
      svg.append('path')
        .datum(seq.points)
        .attr('d', line as any)
        .attr('fill', 'none')
        .attr('stroke', isSelected ? '#3b82f6' : '#94a3b8')
        .attr('stroke-width', isSelected ? 8 : 3)
        .attr('stroke-opacity', isSelected ? 1 : 0.4)
        .attr('class', 'cursor-pointer transition-all duration-200')
        .on('click', () => onSelectGesture(seq.id));

      // Draw start point
      const start = seq.points[0];
      svg.append('circle')
        .attr('cx', start.x)
        .attr('cy', start.y)
        .attr('r', isSelected ? 10 : 6)
        .attr('fill', '#10b981')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      // Draw end point
      const end = seq.points[seq.points.length - 1];
      svg.append('circle')
        .attr('cx', end.x)
        .attr('cy', end.y)
        .attr('r', isSelected ? 10 : 6)
        .attr('fill', '#ef4444')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);
        
      // Label
      if (isSelected) {
        svg.append('text')
          .attr('x', start.x)
          .attr('y', start.y - 15)
          .attr('text-anchor', 'middle')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .attr('fill', '#1e293b')
          .text(seq.type);
      }
    });

  }, [sequences, selectedGestureIds, onSelectGesture]);

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur p-2 rounded-lg border border-slate-200 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>{t('startLabel')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>{t('endLabel')}</span>
        </div>
      </div>
    </div>
  );
};
