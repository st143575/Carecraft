import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styled from 'styled-components';
import demoDataService from '../../../../services/demoDataService';

const ChartContainer = styled.div`
  background-color: var(--white);
  border-radius: var(--radius-large);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-medium);
  border: 1px solid var(--medium-gray);
  margin-bottom: var(--spacing-lg);
`;

const ChartTitle = styled.h3`
  color: var(--bosch-dark-blue);
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  text-align: center;
`;

const ChartWrapper = styled.div`
  width: 100%;
  overflow: hidden;
  border-radius: var(--radius-medium);
`;

interface LineChartDataPoint {
  time: number; // in seconds
  score: number;
  timestamp: string;
}

interface Annotation {
  time: number;
  score: number;
  type: 'positive' | 'negative' | 'neutral';
  message: string;
  transcriptSection: number;
}


interface LineChartProps {
  onAnnotationClick?: (transcriptSection: number) => void;
}

const LineChart: React.FC<LineChartProps> = ({ onAnnotationClick }) => {
  const mockLineData: LineChartDataPoint[] = demoDataService.getTimelineData();
  const mockAnnotations: Annotation[] = demoDataService.getAnnotations();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Set dimensions and margins
    const containerWidth = containerRef.current.clientWidth;
    const margin = { top: 30, right: 50, bottom: 70, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', 400);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(mockLineData, d => d.time) as [number, number])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([70, 100])
      .range([height, 0]);

    // Create gradient for the line
    const defs = svg.append('defs');
    
    const lineGradient = defs.append('linearGradient')
      .attr('id', 'line-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', width).attr('y2', 0);

    lineGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#013662')
      .attr('stop-opacity', 1);

    lineGradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#237147')
      .attr('stop-opacity', 1);

    lineGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ee4949')
      .attr('stop-opacity', 1);

    // Create area gradient
    const areaGradient = defs.append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', 0).attr('y2', height);

    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#237147')
      .attr('stop-opacity', 0.3);

    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#237147')
      .attr('stop-opacity', 0.1);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat(() => '')
        .ticks(8)
      );

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat(() => '')
        .ticks(6)
      );

    // Style grid lines
    g.selectAll('.grid line')
      .style('stroke', 'var(--light-gray)')
      .style('stroke-width', 1)
      .style('opacity', 0.7);

    g.selectAll('.grid .domain')
      .style('stroke', 'none');

    // Create line generator
    const line = d3.line<LineChartDataPoint>()
      .x(d => xScale(d.time))
      .y(d => yScale(d.score))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Create area generator
    const area = d3.area<LineChartDataPoint>()
      .x(d => xScale(d.time))
      .y0(height)
      .y1(d => yScale(d.score))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Add area
    const areaPath = g.append('path')
      .datum(mockLineData)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area)
      .style('opacity', 0);

    // Add line
    const linePath = g.append('path')
      .datum(mockLineData)
      .attr('fill', 'none')
      .attr('stroke', 'url(#line-gradient)')
      .attr('stroke-width', 3)
      .attr('d', line)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d => {
          const minutes = Math.floor(Number(d) / 60);
          const seconds = Number(d) % 60;
          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        })
        .ticks(8)
      );

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).ticks(6));

    // Style axes
    g.selectAll('.domain')
      .style('stroke', 'var(--medium-gray)')
      .style('stroke-width', 2);

    g.selectAll('.tick line')
      .style('stroke', 'var(--medium-gray)')
      .style('stroke-width', 1);

    g.selectAll('.tick text')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('fill', 'var(--text-dark)');

    // Add axis labels
    g.append('text')
      .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', 'var(--bosch-dark-blue)')
      .text('Call Duration');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', 'var(--bosch-dark-blue)')
      .text('Performance Score (%)');

    // Add data points
    const dots = g.selectAll('.dot')
      .data(mockLineData)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.time))
      .attr('cy', d => yScale(d.score))
      .attr('r', 0)
      .attr('fill', '#013662')
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))');

    // Add hover effects to dots
    dots
      .on('mouseover', function(_event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 6)
          .attr('fill', '#ee4949');

        // Show tooltip
        const tooltip = g.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${xScale(d.time)}, ${yScale(d.score) - 15})`);

        tooltip.append('rect')
          .attr('x', -40)
          .attr('y', -30)
          .attr('width', 80)
          .attr('height', 25)
          .attr('fill', 'var(--text-dark)')
          .attr('rx', 4)
          .style('opacity', 0.9);

        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', -10)
          .style('fill', 'white')
          .style('font-size', '12px')
          .style('font-weight', '600')
          .text(`${d.score}% at ${d.timestamp}`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 3)
          .attr('fill', '#013662');

        g.select('.tooltip').remove();
      });

    // Add annotations
    const annotations = g.selectAll('.annotation')
      .data(mockAnnotations)
      .enter().append('g')
      .attr('class', 'annotation')
      .attr('transform', d => `translate(${xScale(d.time)}, ${yScale(d.score)})`)
      .style('cursor', 'pointer');

    // Annotation circles
    annotations.append('circle')
      .attr('r', 8)
      .attr('fill', d => {
        switch (d.type) {
          case 'positive': return '#237147';
          case 'negative': return '#ee4949';
          default: return '#013662';
        }
      })
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))');

    // Annotation icons
    annotations.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('fill', 'white')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .text(d => {
        switch (d.type) {
          case 'positive': return '✓';
          case 'negative': return '!';
          default: return '?';
        }
      });

    // Annotation labels
    annotations.append('text')
      .attr('x', 0)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('fill', 'var(--text-dark)')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('background', 'white')
      .text(d => d.message);

    // Add click handlers to annotations
    annotations.on('click', function(_event, d) {
      if (onAnnotationClick) {
        onAnnotationClick(d.transcriptSection);
      }
      
      // Visual feedback
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', 12)
        .transition()
        .duration(200)
        .attr('r', 8);
    });

    // Animate the chart
    const totalLength = linePath.node()?.getTotalLength() || 0;
    
    linePath
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);

    // Animate area
    areaPath
      .transition()
      .delay(500)
      .duration(1500)
      .style('opacity', 1);

    // Animate dots
    dots
      .transition()
      .delay((_d, i) => i * 50 + 1000)
      .duration(300)
      .attr('r', 3);

    // Animate annotations
    annotations
      .style('opacity', 0)
      .transition()
      .delay((_d, i) => i * 200 + 1500)
      .duration(500)
      .style('opacity', 1);

  }, [onAnnotationClick]);

  return (
    <ChartContainer>
      <ChartTitle>Performance Timeline</ChartTitle>
      <ChartWrapper ref={containerRef}>
        <svg ref={svgRef}></svg>
      </ChartWrapper>
    </ChartContainer>
  );
};

export default LineChart;