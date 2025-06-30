import React from 'react';
import styled from 'styled-components';
import BarChart from './BarChart';
import LineChart from './LineChart';

const DashboardContainer = styled.div`
  margin-bottom: var(--spacing-xl);
`;

const DashboardHeader = styled.div`
  text-align: center;
  margin-bottom: var(--spacing-xl);
`;

const Title = styled.h2`
  color: var(--bosch-dark-blue);
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
`;

const Subtitle = styled.p`
  color: var(--text-light);
  font-size: 1.1rem;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-xl);
  
  @media (min-width: 1200px) {
    grid-template-columns: 1fr 1.5fr;
  }
`;

const ChartSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const Legend = styled.div`
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.9rem;
  color: var(--text-dark);
`;

const LegendColor = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 3px;
  background-color: ${props => props.color};
  border: 1px solid var(--medium-gray);
`;

const AnnotationLegend = styled.div`
  background-color: var(--light-gray);
  border-radius: var(--radius-medium);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--medium-gray);
`;

const AnnotationTitle = styled.h4`
  color: var(--bosch-dark-blue);
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  text-align: center;
`;

const AnnotationList = styled.div`
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
`;

const AnnotationItem = styled.div<{ type: 'positive' | 'negative' | 'neutral' }>`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-small);
  font-size: 0.8rem;
  font-weight: 500;
  
  ${props => {
    switch (props.type) {
      case 'positive':
        return `
          background-color: rgba(35, 113, 71, 0.1);
          color: var(--bosch-dark-green);
        `;
      case 'negative':
        return `
          background-color: rgba(238, 73, 73, 0.1);
          color: var(--bosch-red);
        `;
      default:
        return `
          background-color: rgba(1, 54, 98, 0.1);
          color: var(--bosch-dark-blue);
        `;
    }
  }}
`;

const AnnotationIcon = styled.span<{ type: 'positive' | 'negative' | 'neutral' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  color: white;
  
  ${props => {
    switch (props.type) {
      case 'positive':
        return `background-color: var(--bosch-dark-green);`;
      case 'negative':
        return `background-color: var(--bosch-red);`;
      default:
        return `background-color: var(--bosch-dark-blue);`;
    }
  }}
`;

const InteractionHint = styled.div`
  background-color: rgba(1, 54, 98, 0.05);
  border: 1px solid rgba(1, 54, 98, 0.2);
  border-radius: var(--radius-medium);
  padding: var(--spacing-md);
  margin-top: var(--spacing-lg);
  text-align: center;
  color: var(--bosch-dark-blue);
  font-size: 0.9rem;
  font-style: italic;
`;

interface DashboardProps {
  onTimelineClick?: (transcriptSection: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onTimelineClick }) => {
  const handleAnnotationClick = (transcriptSection: number) => {
    if (onTimelineClick) {
      onTimelineClick(transcriptSection);
    }
  };

  return (
    <DashboardContainer>
      <DashboardHeader>
        <Title>Performance Analytics Dashboard</Title>
        <Subtitle>
          Comprehensive analysis of call performance metrics and timeline evaluation
        </Subtitle>
      </DashboardHeader>

      <ChartsGrid>
        <ChartSection>
          <BarChart />
          
          <Legend>
            <LegendItem>
              <LegendColor color="#013662" />
              <span>Following Protocol</span>
            </LegendItem>
            <LegendItem>
              <LegendColor color="#237147" />
              <span>Compassion</span>
            </LegendItem>
            <LegendItem>
              <LegendColor color="#ee4949" />
              <span>Clarity</span>
            </LegendItem>
            <LegendItem>
              <LegendColor color="#1a5490" />
              <span>Overall Score</span>
            </LegendItem>
          </Legend>
        </ChartSection>

        <ChartSection>
          <AnnotationLegend>
            <AnnotationTitle>Timeline Annotations</AnnotationTitle>
            <AnnotationList>
              <AnnotationItem type="positive">
                <AnnotationIcon type="positive">✓</AnnotationIcon>
                <span>Positive Performance</span>
              </AnnotationItem>
              <AnnotationItem type="negative">
                <AnnotationIcon type="negative">!</AnnotationIcon>
                <span>Needs Improvement</span>
              </AnnotationItem>
              <AnnotationItem type="neutral">
                <AnnotationIcon type="neutral">?</AnnotationIcon>
                <span>Protocol Notes</span>
              </AnnotationItem>
            </AnnotationList>
          </AnnotationLegend>
          
          <LineChart onAnnotationClick={handleAnnotationClick} />
          
          <InteractionHint>
            💡 Click on annotations in the timeline chart to jump to corresponding transcript sections
          </InteractionHint>
        </ChartSection>
      </ChartsGrid>
    </DashboardContainer>
  );
};

export default Dashboard;