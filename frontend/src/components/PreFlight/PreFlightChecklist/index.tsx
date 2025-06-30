import React from 'react';
import styled from 'styled-components';
import type { PreFlightChecklistProps } from '../../../types';

const ChecklistContainer = styled.div`
  background-color: var(--white);
  border-radius: var(--radius-large);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-light);
  border: 1px solid var(--medium-gray);
  margin-bottom: var(--spacing-lg);
`;

const ChecklistHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-lg);
`;

const ChecklistTitle = styled.h3`
  color: var(--bosch-dark-blue);
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const CompletionBadge = styled.div<{ completed: boolean }>`
  margin-left: auto;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-small);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  
  ${props => props.completed ? `
    background-color: rgba(35, 113, 71, 0.1);
    color: var(--bosch-dark-green);
  ` : `
    background-color: rgba(1, 54, 98, 0.1);
    color: var(--bosch-dark-blue);
  `}
`;

const ChecklistItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
`;

const ChecklistItem = styled.div<{ completed: boolean }>`
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  border-radius: var(--radius-medium);
  border: 2px solid var(--medium-gray);
  background-color: var(--white);
  transition: all 0.3s ease;
  cursor: pointer;
  
  ${props => props.completed ? `
    border-color: var(--bosch-dark-green);
    background-color: rgba(35, 113, 71, 0.05);
  ` : `
    &:hover {
      border-color: var(--bosch-dark-blue);
      background-color: rgba(1, 54, 98, 0.02);
      transform: translateY(-1px);
      box-shadow: var(--shadow-light);
    }
  `}
`;

const Checkbox = styled.div<{ checked: boolean }>`
  width: 24px;
  height: 24px;
  border: 2px solid ${props => props.checked ? 'var(--bosch-dark-green)' : 'var(--medium-gray)'};
  border-radius: var(--radius-small);
  background-color: ${props => props.checked ? 'var(--bosch-dark-green)' : 'var(--white)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-md);
  transition: all 0.3s ease;
  flex-shrink: 0;
  
  &::after {
    content: '✓';
    color: var(--white);
    font-weight: bold;
    font-size: 0.9rem;
    opacity: ${props => props.checked ? 1 : 0};
    transform: scale(${props => props.checked ? 1 : 0.5});
    transition: all 0.2s ease;
  }
`;

const ChecklistText = styled.span<{ completed: boolean }>`
  font-size: 1rem;
  color: ${props => props.completed ? 'var(--bosch-dark-green)' : 'var(--text-dark)'};
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
  opacity: ${props => props.completed ? 0.8 : 1};
  transition: all 0.3s ease;
  line-height: 1.4;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: var(--medium-gray);
  border-radius: var(--radius-small);
  overflow: hidden;
  margin-top: var(--spacing-lg);
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(90deg, var(--bosch-dark-blue), var(--bosch-dark-green));
  transition: width 0.5s ease;
  border-radius: var(--radius-small);
`;

const PreFlightChecklist: React.FC<PreFlightChecklistProps> = ({ 
  items, 
  onItemToggle, 
  allCompleted 
}) => {
  const completedCount = items.filter(item => item.completed).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <ChecklistContainer>
      <ChecklistHeader>
        <ChecklistTitle>Pre-Flight Checklist</ChecklistTitle>
        <CompletionBadge completed={allCompleted}>
          {allCompleted ? 'Complete' : `${completedCount}/${items.length}`}
        </CompletionBadge>
      </ChecklistHeader>
      
      <ChecklistItems>
        {items.map((item) => (
          <ChecklistItem
            key={item.id}
            completed={item.completed}
            onClick={() => onItemToggle(item.id)}
          >
            <Checkbox checked={item.completed} />
            <ChecklistText completed={item.completed}>
              {item.text}
            </ChecklistText>
          </ChecklistItem>
        ))}
      </ChecklistItems>
      
      <ProgressBar>
        <ProgressFill progress={progress} />
      </ProgressBar>
    </ChecklistContainer>
  );
};

export default PreFlightChecklist;