import React from 'react';
import styled from 'styled-components';

const SummaryContainer = styled.div`
  background: linear-gradient(135deg, var(--white) 0%, #f8f9fa 100%);
  border-radius: var(--radius-large);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-medium);
  border-left: 5px solid var(--bosch-dark-blue);
  margin-bottom: var(--spacing-xl);
`;

const SummaryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--medium-gray);
`;

const Title = styled.h3`
  color: var(--bosch-dark-blue);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`;

const CallId = styled.span`
  background-color: var(--bosch-dark-blue);
  color: var(--white);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-small);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const MetadataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
`;

const MetadataItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
`;

const MetadataLabel = styled.span`
  font-size: 0.8rem;
  color: var(--text-light);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const MetadataValue = styled.span`
  font-size: 1rem;
  color: var(--text-dark);
  font-weight: 500;
`;

const StatusBadge = styled.span<{ status: string }>`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-small);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => {
    switch (props.status) {
      case 'completed':
        return `
          background-color: rgba(35, 113, 71, 0.1);
          color: var(--bosch-dark-green);
        `;
      case 'emergency':
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

const EvaluationSection = styled.div`
  background-color: var(--light-gray);
  border-radius: var(--radius-medium);
  padding: var(--spacing-lg);
  border: 1px solid var(--medium-gray);
`;

const EvaluationHeader = styled.h4`
  color: var(--bosch-dark-blue);
  margin-bottom: var(--spacing-md);
  font-size: 1.2rem;
  font-weight: 600;
`;

const ScoreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
`;

const ScoreCard = styled.div`
  background-color: var(--white);
  padding: var(--spacing-md);
  border-radius: var(--radius-medium);
  text-align: center;
  box-shadow: var(--shadow-light);
  border: 1px solid var(--medium-gray);
`;

const ScoreValue = styled.div<{ score: number }>`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--spacing-xs);
  color: ${props => {
    if (props.score >= 90) return 'var(--bosch-dark-green)';
    if (props.score >= 70) return 'var(--bosch-dark-blue)';
    return 'var(--bosch-red)';
  }};
`;

const ScoreLabel = styled.div`
  font-size: 0.9rem;
  color: var(--text-light);
  font-weight: 500;
`;

const OverallPerformance = styled.div<{ level: string }>`
  text-align: center;
  padding: var(--spacing-lg);
  border-radius: var(--radius-medium);
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  ${props => {
    switch (props.level) {
      case 'excellent':
        return `
          background-color: rgba(35, 113, 71, 0.1);
          color: var(--bosch-dark-green);
          border: 2px solid var(--bosch-dark-green);
        `;
      case 'good':
        return `
          background-color: rgba(1, 54, 98, 0.1);
          color: var(--bosch-dark-blue);
          border: 2px solid var(--bosch-dark-blue);
        `;
      default:
        return `
          background-color: rgba(238, 73, 73, 0.1);
          color: var(--bosch-red);
          border: 2px solid var(--bosch-red);
        `;
    }
  }}
`;

// Mock data for the summary
const mockSummaryData = {
  callId: "CC-2025-001234",
  duration: "4m 32s",
  supportAgent: "Dr. Sarah Mitchell",
  customer: "John Anderson",
  date: "January 24, 2025",
  callType: "eCall (Medical Emergency)",
  emergencyServices: "Ambulance Dispatched",
  status: "completed",
  evaluation: {
    totalScore: 92,
    performanceLevel: "excellent",
    scores: {
      compassion: 95,
      clarity: 88,
      protocolFollowing: 93,
      responseTime: 91
    }
  }
};

const SummaryBox: React.FC = () => {
  const data = mockSummaryData;
  
  return (
    <SummaryContainer>
      <SummaryHeader>
        <Title>Call Summary</Title>
        <CallId>{data.callId}</CallId>
      </SummaryHeader>
      
      <MetadataGrid>
        <MetadataItem>
          <MetadataLabel>Duration</MetadataLabel>
          <MetadataValue>{data.duration}</MetadataValue>
        </MetadataItem>
        
        <MetadataItem>
          <MetadataLabel>Support Agent</MetadataLabel>
          <MetadataValue>{data.supportAgent}</MetadataValue>
        </MetadataItem>
        
        <MetadataItem>
          <MetadataLabel>Customer</MetadataLabel>
          <MetadataValue>{data.customer}</MetadataValue>
        </MetadataItem>
        
        <MetadataItem>
          <MetadataLabel>Date</MetadataLabel>
          <MetadataValue>{data.date}</MetadataValue>
        </MetadataItem>
        
        <MetadataItem>
          <MetadataLabel>Call Type</MetadataLabel>
          <MetadataValue>{data.callType}</MetadataValue>
        </MetadataItem>
        
        <MetadataItem>
          <MetadataLabel>Emergency Services</MetadataLabel>
          <MetadataValue>{data.emergencyServices}</MetadataValue>
        </MetadataItem>
        
        <MetadataItem>
          <MetadataLabel>Status</MetadataLabel>
          <StatusBadge status={data.status}>
            ● {data.status}
          </StatusBadge>
        </MetadataItem>
      </MetadataGrid>
      
      <EvaluationSection>
        <EvaluationHeader>Performance Evaluation</EvaluationHeader>
        
        <ScoreGrid>
          <ScoreCard>
            <ScoreValue score={data.evaluation.scores.compassion}>
              {data.evaluation.scores.compassion}
            </ScoreValue>
            <ScoreLabel>Compassion</ScoreLabel>
          </ScoreCard>
          
          <ScoreCard>
            <ScoreValue score={data.evaluation.scores.clarity}>
              {data.evaluation.scores.clarity}
            </ScoreValue>
            <ScoreLabel>Clarity</ScoreLabel>
          </ScoreCard>
          
          <ScoreCard>
            <ScoreValue score={data.evaluation.scores.protocolFollowing}>
              {data.evaluation.scores.protocolFollowing}
            </ScoreValue>
            <ScoreLabel>Protocol Following</ScoreLabel>
          </ScoreCard>
          
          <ScoreCard>
            <ScoreValue score={data.evaluation.scores.responseTime}>
              {data.evaluation.scores.responseTime}
            </ScoreValue>
            <ScoreLabel>Response Time</ScoreLabel>
          </ScoreCard>
        </ScoreGrid>
        
        <OverallPerformance level={data.evaluation.performanceLevel}>
          Overall Score: {data.evaluation.totalScore}/100 - {data.evaluation.performanceLevel}
        </OverallPerformance>
      </EvaluationSection>
    </SummaryContainer>
  );
};

export default SummaryBox;
