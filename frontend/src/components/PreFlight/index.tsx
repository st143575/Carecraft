import React, { useState } from 'react';
import styled from 'styled-components';
import type { PreFlightProps, CaseData, PreFlightChecklistItem } from '../../types';
import demoDataService from '../../services/demoDataService';
import PreFlightChecklist from './PreFlightChecklist';
import CaseSelector from './CaseSelector';
import MicrophoneCheck from './MicrophoneCheck';

const PreFlightContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  max-width: 800px;
  margin: 0 auto;
`;

const PreFlightHeader = styled.div`
  text-align: center;
  margin-bottom: var(--spacing-xl);
`;

const PreFlightTitle = styled.h2`
  color: var(--bosch-dark-blue);
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-md) 0;
`;

const PreFlightSubtitle = styled.p`
  color: var(--text-light);
  font-size: 1.1rem;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
`;

const ActionSection = styled.div`
  background-color: var(--white);
  border-radius: var(--radius-large);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-light);
  border: 1px solid var(--medium-gray);
  text-align: center;
`;

const StartButton = styled.button<{ canStart: boolean }>`
  background: ${props => props.canStart 
    ? 'linear-gradient(135deg, var(--bosch-dark-blue), var(--bosch-dark-green))' 
    : 'var(--medium-gray)'};
  color: var(--white);
  border: none;
  padding: var(--spacing-lg) var(--spacing-2xl);
  border-radius: var(--radius-medium);
  font-size: 1.2rem;
  font-weight: 600;
  cursor: ${props => props.canStart ? 'pointer' : 'not-allowed'};
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  min-width: 250px;
  
  &:hover {
    transform: ${props => props.canStart ? 'translateY(-3px)' : 'none'};
    box-shadow: ${props => props.canStart ? 'var(--shadow-heavy)' : 'none'};
    background: ${props => props.canStart 
      ? 'linear-gradient(135deg, var(--bosch-dark-green), var(--bosch-dark-blue))' 
      : 'var(--medium-gray)'};
  }
  
  &:disabled {
    background: var(--medium-gray);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ReadinessIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  border-radius: var(--radius-medium);
  background-color: var(--light-gray);
`;

const IndicatorItem = styled.div<{ completed: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-small);
  font-size: 0.9rem;
  font-weight: 500;
  
  ${props => props.completed ? `
    background-color: rgba(35, 113, 71, 0.1);
    color: var(--bosch-dark-green);
  ` : `
    background-color: rgba(238, 73, 73, 0.1);
    color: var(--bosch-red);
  `}
`;

const CheckIcon = styled.span<{ completed: boolean }>`
  font-weight: bold;
  color: ${props => props.completed ? 'var(--bosch-dark-green)' : 'var(--bosch-red)'};
`;


const PreFlight: React.FC<PreFlightProps> = ({ onSelectCase }) => {
  const [checklistItems, setChecklistItems] = useState<PreFlightChecklistItem[]>(demoDataService.getPreFlightChecklist());
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [microphoneChecking, setMicrophoneChecking] = useState(false);
  const [microphoneConnected, setMicrophoneConnected] = useState(false);

  const handleChecklistToggle = (itemId: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleCaseSelect = (caseData: CaseData) => {
    setSelectedCase(caseData);
  };

  const handleMicrophoneCheck = () => {
    setMicrophoneChecking(true);
    // Simulate microphone check
    setTimeout(() => {
      setMicrophoneChecking(false);
      setMicrophoneConnected(true);
    }, 2000);
  };

  const allChecklistCompleted = checklistItems.every(item => item.completed);
  const canStartTraining = allChecklistCompleted && !!selectedCase && microphoneConnected;

  const handleStartTraining = () => {
    if (canStartTraining && selectedCase) {
      onSelectCase(selectedCase);
    }
  };

  return (
    <PreFlightContainer>
      <PreFlightHeader>
        <PreFlightTitle>Pre-Flight Preparation</PreFlightTitle>
        <PreFlightSubtitle>
          Complete all preparation steps before beginning your emergency response training session
        </PreFlightSubtitle>
      </PreFlightHeader>

      <PreFlightChecklist
        items={checklistItems}
        onItemToggle={handleChecklistToggle}
        allCompleted={allChecklistCompleted}
      />

      <CaseSelector
        cases={demoDataService.getCases()}
        selectedCase={selectedCase}
        onCaseSelect={handleCaseSelect}
      />

      <MicrophoneCheck
        isChecking={microphoneChecking}
        isConnected={microphoneConnected}
        onStartCheck={handleMicrophoneCheck}
      />

      <ActionSection>
        <ReadinessIndicator>
          <IndicatorItem completed={allChecklistCompleted}>
            <CheckIcon completed={allChecklistCompleted}>
              {allChecklistCompleted ? '✓' : '✗'}
            </CheckIcon>
            Checklist
          </IndicatorItem>
          
          <IndicatorItem completed={!!selectedCase}>
            <CheckIcon completed={!!selectedCase}>
              {selectedCase ? '✓' : '✗'}
            </CheckIcon>
            Case Selected
          </IndicatorItem>
          
          <IndicatorItem completed={microphoneConnected}>
            <CheckIcon completed={microphoneConnected}>
              {microphoneConnected ? '✓' : '✗'}
            </CheckIcon>
            Microphone
          </IndicatorItem>
        </ReadinessIndicator>

        <StartButton
          canStart={canStartTraining}
          onClick={handleStartTraining}
          disabled={!canStartTraining}
        >
          {canStartTraining ? 'Start Training Session' : 'Complete All Steps Above'}
        </StartButton>
      </ActionSection>
    </PreFlightContainer>
  );
};

export default PreFlight;
