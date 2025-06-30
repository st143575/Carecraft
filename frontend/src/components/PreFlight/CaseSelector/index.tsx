import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import type { CaseSelectorProps } from '../../../types';
import type { CaseData } from '../../../types';

const SelectorContainer = styled.div`
  background-color: var(--white);
  border-radius: var(--radius-large);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-light);
  border: 1px solid var(--medium-gray);
  margin-bottom: var(--spacing-lg);
  position: relative;
`;

const SelectorHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-lg);
`;

const SelectorTitle = styled.h3`
  color: var(--bosch-dark-blue);
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const SelectionStatus = styled.div<{ hasSelection: boolean }>`
  margin-left: auto;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-small);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => props.hasSelection ? `
    background-color: rgba(35, 113, 71, 0.1);
    color: var(--bosch-dark-green);
  ` : `
    background-color: rgba(1, 54, 98, 0.1);
    color: var(--bosch-dark-blue);
  `}
`;

const DropdownWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const DropdownButton = styled.button<{ isOpen: boolean; hasSelection: boolean }>`
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--white);
  border: 2px solid ${props => props.isOpen ? 'var(--bosch-dark-blue)' : 'var(--medium-gray)'};
  border-radius: var(--radius-medium);
  color: ${props => props.hasSelection ? 'var(--text-dark)' : 'var(--text-light)'};
  font-size: 1rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  
  &:hover {
    border-color: var(--bosch-dark-blue);
    background-color: rgba(1, 54, 98, 0.02);
    transform: none;
    box-shadow: var(--shadow-light);
  }
  
  &:focus {
    outline: none;
    border-color: var(--bosch-dark-blue);
    box-shadow: 0 0 0 3px rgba(1, 54, 98, 0.1);
  }
`;

const DropdownArrow = styled.span<{ isOpen: boolean }>`
  transition: transform 0.3s ease;
  transform: rotate(${props => props.isOpen ? '180deg' : '0deg'});
  color: var(--bosch-dark-blue);
  font-weight: bold;
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--white);
  border: 2px solid var(--bosch-dark-blue);
  border-top: none;
  border-radius: 0 0 var(--radius-medium) var(--radius-medium);
  box-shadow: var(--shadow-medium);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transform: translateY(${props => props.isOpen ? '0' : '-10px'});
  transition: all 0.3s ease;
`;

const DropdownItem = styled.div<{ isSelected: boolean }>`
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  border-bottom: 1px solid var(--medium-gray);
  transition: all 0.2s ease;
  
  ${props => props.isSelected ? `
    background-color: rgba(35, 113, 71, 0.1);
    color: var(--bosch-dark-green);
  ` : `
    &:hover {
      background-color: rgba(1, 54, 98, 0.05);
    }
  `}
  
  &:last-child {
    border-bottom: none;
  }
`;

const CaseTitle = styled.div`
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: var(--spacing-xs);
`;

const CaseDescription = styled.div`
  font-size: 0.9rem;
  color: var(--text-light);
  margin-bottom: var(--spacing-xs);
`;

const CaseDifficulty = styled.span<{ difficulty: 'easy' | 'medium' | 'hard' }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-small);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => {
    switch (props.difficulty) {
      case 'easy':
        return `
          background-color: rgba(35, 113, 71, 0.1);
          color: var(--bosch-dark-green);
        `;
      case 'medium':
        return `
          background-color: rgba(1, 54, 98, 0.1);
          color: var(--bosch-dark-blue);
        `;
      case 'hard':
        return `
          background-color: rgba(238, 73, 73, 0.1);
          color: var(--bosch-red);
        `;
    }
  }}
`;

const CaseSelector: React.FC<CaseSelectorProps> = ({ 
  cases, 
  selectedCase, 
  onCaseSelect 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCaseSelect = (caseData: CaseData) => {
    onCaseSelect(caseData);
    setIsOpen(false);
  };

  return (
    <SelectorContainer>
      <SelectorHeader>
        <SelectorTitle>Training Case Selection</SelectorTitle>
        <SelectionStatus hasSelection={!!selectedCase}>
          {selectedCase ? 'Selected' : 'Select Case'}
        </SelectionStatus>
      </SelectorHeader>
      
      <DropdownWrapper ref={dropdownRef}>
        <DropdownButton
          isOpen={isOpen}
          hasSelection={!!selectedCase}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>
            {selectedCase ? selectedCase.title : 'Choose a training scenario...'}
          </span>
          <DropdownArrow isOpen={isOpen}>▼</DropdownArrow>
        </DropdownButton>
        
        <DropdownMenu isOpen={isOpen}>
          {cases.map((caseData) => (
            <DropdownItem
              key={caseData.id}
              isSelected={selectedCase?.id === caseData.id}
              onClick={() => handleCaseSelect(caseData)}
            >
              <CaseTitle>{caseData.title}</CaseTitle>
              <CaseDescription>{caseData.description}</CaseDescription>
              <CaseDifficulty difficulty={caseData.difficulty}>
                {caseData.difficulty}
              </CaseDifficulty>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </DropdownWrapper>
    </SelectorContainer>
  );
};

export default CaseSelector;