import React, { useState } from 'react';
import styled from 'styled-components';
import type { PostFlightProps } from '../../types';
import SummaryBox from './SummaryBox';
import Dashboard from './Dashboard';
import TranscriptBox from './TranscriptBox';

const PostFlightContainer = styled.div`
  background-color: var(--light-gray);
  min-height: 100vh;
  padding: var(--spacing-xl);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  padding: var(--spacing-xl);
  background-color: var(--white);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-medium);
  border-left: 5px solid var(--bosch-dark-blue);
`;

const Title = styled.h1`
  color: var(--bosch-dark-blue);
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-md);
  letter-spacing: -1px;
`;

const Subtitle = styled.p`
  color: var(--text-light);
  font-size: 1.2rem;
  margin-bottom: var(--spacing-lg);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const CaseInfo = styled.div`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  background-color: var(--bosch-dark-blue);
  color: var(--white);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-medium);
  font-weight: 600;
  font-size: 1rem;
`;

const TabContainer = styled.div`
  margin-bottom: var(--spacing-xl);
`;

const TabNav = styled.div`
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-lg);
  background-color: var(--white);
  padding: var(--spacing-sm);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-light);
`;

const TabButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-medium);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => props.active ? `
    background-color: var(--bosch-dark-blue);
    color: var(--white);
    box-shadow: var(--shadow-medium);
  ` : `
    background-color: transparent;
    color: var(--text-dark);
    
    &:hover {
      background-color: var(--light-gray);
      color: var(--bosch-dark-blue);
    }
  `}
`;

const TabContent = styled.div`
  min-height: 400px;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-top: var(--spacing-2xl);
  padding: var(--spacing-xl);
  background-color: var(--white);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-medium);
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1rem;
  font-weight: 600;
  border: 2px solid;
  border-radius: var(--radius-medium);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 160px;
  justify-content: center;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background-color: var(--bosch-dark-blue);
          border-color: var(--bosch-dark-blue);
          color: var(--white);
          
          &:hover {
            background-color: var(--bosch-dark-green);
            border-color: var(--bosch-dark-green);
            transform: translateY(-2px);
            box-shadow: var(--shadow-medium);
          }
        `;
      case 'danger':
        return `
          background-color: var(--bosch-red);
          border-color: var(--bosch-red);
          color: var(--white);
          
          &:hover {
            background-color: #d73d3d;
            border-color: #d73d3d;
            transform: translateY(-2px);
            box-shadow: var(--shadow-medium);
          }
        `;
      default:
        return `
          background-color: transparent;
          border-color: var(--bosch-dark-blue);
          color: var(--bosch-dark-blue);
          
          &:hover {
            background-color: var(--bosch-dark-blue);
            color: var(--white);
            transform: translateY(-2px);
            box-shadow: var(--shadow-medium);
          }
        `;
    }
  }}
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  background-color: var(--white);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-medium);
  margin: var(--spacing-xl) 0;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid var(--light-gray);
  border-top: 4px solid var(--bosch-dark-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: var(--text-light);
  font-size: 1.1rem;
  margin: 0;
`;

type TabType = 'summary' | 'analytics' | 'transcript';

const PostFlight: React.FC<PostFlightProps> = ({ selectedCase, conversationData, onReset }) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [jumpToSection, setJumpToSection] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTimelineClick = (transcriptSection: number) => {
    setActiveTab('transcript');
    setJumpToSection(transcriptSection);
    
    // Clear the jump to section after a brief delay to allow the component to process it
    setTimeout(() => setJumpToSection(null), 100);
  };

  const handleNewTrainingSession = () => {
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      // Use parent reset function if available, otherwise reload
      if (onReset) {
        onReset();
      } else {
        window.location.reload();
      }
    }, 2000);
  };

  const handleExportReport = () => {
    // Mock export functionality
    const reportData = {
      caseId: selectedCase.id,
      caseTitle: selectedCase.title,
      timestamp: new Date().toISOString(),
      summary: conversationData?.summary || 'Call completed successfully',
      performanceMetrics: conversationData?.performanceMetrics || {
        communicationScore: 92,
        empathyScore: 95,
        clinicalAccuracy: 88,
        responseTime: 91
      }
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carecraft-report-${selectedCase.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareResults = () => {
    // Mock share functionality
    if (navigator.share) {
      navigator.share({
        title: 'CareCraft Training Results',
        text: `Completed training session: ${selectedCase.title}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `CareCraft Training Results\nCase: ${selectedCase.title}\nCompleted: ${new Date().toLocaleDateString()}`
      );
      alert('Results copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <PostFlightContainer>
        <LoadingState>
          <LoadingSpinner />
          <LoadingText>Starting New Training Session...</LoadingText>
        </LoadingState>
      </PostFlightContainer>
    );
  }

  return (
    <PostFlightContainer>
      <Header>
        <Title>Post-Flight Analysis</Title>
        <Subtitle>
          Training session completed. Review your performance and analyze key metrics.
        </Subtitle>
        <CaseInfo>
          📋 Case: {selectedCase.title}
        </CaseInfo>
      </Header>

      <TabContainer>
        <TabNav>
          <TabButton 
            active={activeTab === 'summary'} 
            onClick={() => setActiveTab('summary')}
          >
            📊 Summary
          </TabButton>
          <TabButton 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </TabButton>
          <TabButton 
            active={activeTab === 'transcript'} 
            onClick={() => setActiveTab('transcript')}
          >
            📝 Transcript
          </TabButton>
        </TabNav>

        <TabContent>
          {activeTab === 'summary' && <SummaryBox />}
          {activeTab === 'analytics' && <Dashboard onTimelineClick={handleTimelineClick} />}
          {activeTab === 'transcript' && (
            <TranscriptBox 
              jumpToSection={jumpToSection || undefined}
              onSectionClick={handleTimelineClick}
            />
          )}
        </TabContent>
      </TabContainer>

      <ActionsContainer>
        <ActionButton variant="primary" onClick={handleNewTrainingSession}>
          🚀 New Training Session
        </ActionButton>
        <ActionButton variant="secondary" onClick={handleExportReport}>
          📥 Export Report
        </ActionButton>
        <ActionButton variant="secondary" onClick={handleShareResults}>
          📤 Share Results
        </ActionButton>
        <ActionButton variant="danger" onClick={() => onReset ? onReset() : window.location.reload()}>
          🔄 Reset Application
        </ActionButton>
      </ActionsContainer>
    </PostFlightContainer>
  );
};

export default PostFlight;
