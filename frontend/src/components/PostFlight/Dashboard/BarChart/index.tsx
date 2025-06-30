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

interface BarChartData {
  metric: string;
  score: number;
  label: string;
}


const BarChart: React.FC = () => {
  const metrics = demoDataService.getPerformanceMetrics();
  const mockData: BarChartData[] = [
    { metric: 'protocol', score: metrics.protocol, label: 'Following Protocol' },
    { metric: 'compassion', score: metrics.compassion, label: 'Compassion' },
    { metric: 'clarity', score: metrics.clarity, label: 'Clarity' },
    { metric: 'overall', score: metrics.overall, label: 'Overall Score' }
  ];
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Set dimensions and margins
    const containerWidth = containerRef.current.clientWidth;
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', 300);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Color scale using BOSCH colors
    const colorScale = d3.scaleOrdinal()
      .domain(['protocol', 'compassion', 'clarity', 'overall'])
      .range(['#013662', '#237147', '#ee4949', '#1a5490']);

    // Scales
    const xScale = d3.scaleBand()
      .domain(mockData.map(d => d.metric))
      .range([0, width])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    // Create gradient definitions
    const defs = svg.append('defs');
    
    mockData.forEach((d) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `gradient-${d.metric}`)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', 0).attr('y1', height)
        .attr('x2', 0).attr('y2', 0);

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colorScale(d.metric) as string)
        .attr('stop-opacity', 0.8);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colorScale(d.metric) as string)
        .attr('stop-opacity', 1);
    });

    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => {
        const item = mockData.find(item => item.metric === d);
        return item ? item.label : d;
      }))
      .selectAll('text')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('fill', 'var(--text-dark)')
      .attr('transform', 'rotate(-45)')
      .attr('dx', '-0.8em')
      .attr('dy', '0.15em');

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).ticks(10))
      .selectAll('text')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('fill', 'var(--text-dark)');

    // Style axes
    g.selectAll('.domain')
      .style('stroke', 'var(--medium-gray)')
      .style('stroke-width', 2);

    g.selectAll('.tick line')
      .style('stroke', 'var(--medium-gray)')
      .style('stroke-width', 1);

    // Add Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', 'var(--bosch-dark-blue)')
      .text('Score (%)');

    // Create bars
    const bars = g.selectAll('.bar')
      .data(mockData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.metric)!)
      .attr('width', xScale.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', d => `url(#gradient-${d.metric})`)
      .style('cursor', 'pointer')
      .style('stroke', '#ffffff')
      .style('stroke-width', 2);

    // Add hover effects
    bars
      .on('mouseover', function(_event, d) {
        d3.select(this)
          .style('opacity', 0.8)
          .style('stroke-width', 3);

        // Show tooltip
        const tooltip = g.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${xScale(d.metric)! + xScale.bandwidth()/2}, ${yScale(d.score) - 10})`);

        tooltip.append('rect')
          .attr('x', -30)
          .attr('y', -25)
          .attr('width', 60)
          .attr('height', 20)
          .attr('fill', 'var(--text-dark)')
          .attr('rx', 4);

        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', -10)
          .style('fill', 'white')
          .style('font-size', '12px')
          .style('font-weight', '600')
          .text(`${d.score}%`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('opacity', 1)
          .style('stroke-width', 2);

        g.select('.tooltip').remove();
      });

    // Animate bars
    bars.transition()
      .duration(1000)
      .delay((_d, i) => i * 100)
      .attr('y', d => yScale(d.score))
      .attr('height', d => height - yScale(d.score));

    // Add value labels on top of bars
    const labels = g.selectAll('.label')
      .data(mockData)
      .enter().append('text')
      .attr('class', 'label')
      .attr('x', d => xScale(d.metric)! + xScale.bandwidth() / 2)
      .attr('y', height)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', '700')
      .style('fill', 'var(--bosch-dark-blue)')
      .style('opacity', 0)
      .text(d => `${d.score}%`);

    // Animate labels
    labels.transition()
      .duration(1000)
      .delay((_d, i) => i * 100 + 500)
      .attr('y', d => yScale(d.score) - 8)
      .style('opacity', 1);

    // Add grid lines
    g.selectAll('.grid-line')
      .data(yScale.ticks(10))
      .enter().append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .style('stroke', 'var(--light-gray)')
      .style('stroke-width', 1)
      .style('opacity', 0.6);

  }, []);

  useEffect(() => {
    const handleResize = () => {
      // Re-render chart on window resize
      if (svgRef.current && containerRef.current) {
        const event = new Event('resize');
        window.dispatchEvent(event);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ChartContainer>
      <ChartTitle>Performance Metrics</ChartTitle>
      <ChartWrapper ref={containerRef}>
        <svg ref={svgRef}></svg>
      </ChartWrapper>
    </ChartContainer>
  );
};

export default BarChart;