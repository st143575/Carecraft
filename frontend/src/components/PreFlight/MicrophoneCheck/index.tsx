import React from 'react';
import styled from 'styled-components';
import type { MicrophoneCheckProps } from '../../../types';

const MicCheckContainer = styled.div`
  background-color: var(--white);
  border-radius: var(--radius-large);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-light);
  border: 1px solid var(--medium-gray);
  margin-bottom: var(--spacing-lg);
`;

const MicCheckHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-lg);
`;

const MicCheckTitle = styled.h3`
  color: var(--bosch-dark-blue);
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const StatusBadge = styled.div<{ status: 'checking' | 'connected' | 'disconnected' }>`
  margin-left: auto;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-small);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => {
    switch (props.status) {
      case 'connected':
        return `
          background-color: rgba(35, 113, 71, 0.1);
          color: var(--bosch-dark-green);
        `;
      case 'checking':
        return `
          background-color: rgba(1, 54, 98, 0.1);
          color: var(--bosch-dark-blue);
        `;
      case 'disconnected':
      default:
        return `
          background-color: rgba(238, 73, 73, 0.1);
          color: var(--bosch-red);
        `;
    }
  }}
`;

const MicCheckContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
`;

const MicrophoneIcon = styled.div<{ status: 'checking' | 'connected' | 'disconnected' }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  transition: all 0.3s ease;
  
  ${props => {
    switch (props.status) {
      case 'connected':
        return `
          background-color: rgba(35, 113, 71, 0.1);
          color: var(--bosch-dark-green);
          border: 3px solid var(--bosch-dark-green);
        `;
      case 'checking':
        return `
          background-color: rgba(1, 54, 98, 0.1);
          color: var(--bosch-dark-blue);
          border: 3px solid var(--bosch-dark-blue);
          animation: pulse 2s infinite;
        `;
      case 'disconnected':
      default:
        return `
          background-color: rgba(238, 73, 73, 0.1);
          color: var(--bosch-red);
          border: 3px solid var(--bosch-red);
        `;
    }
  }}
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const StatusText = styled.p<{ status: 'checking' | 'connected' | 'disconnected' }>`
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
  
  ${props => {
    switch (props.status) {
      case 'connected':
        return `color: var(--bosch-dark-green);`;
      case 'checking':
        return `color: var(--bosch-dark-blue);`;
      case 'disconnected':
      default:
        return `color: var(--bosch-red);`;
    }
  }}
`;

const CheckButton = styled.button<{ isChecking: boolean }>`
  background-color: ${props => props.isChecking ? 'var(--medium-gray)' : 'var(--bosch-dark-blue)'};
  color: var(--white);
  border: none;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-medium);
  font-weight: 600;
  cursor: ${props => props.isChecking ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  
  &:hover {
    background-color: ${props => props.isChecking ? 'var(--medium-gray)' : 'var(--bosch-dark-green)'};
    transform: ${props => props.isChecking ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.isChecking ? 'none' : 'var(--shadow-medium)'};
  }
  
  &:disabled {
    background-color: var(--medium-gray);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const VolumeIndicator = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 2px;
  height: 30px;
  opacity: ${props => props.isActive ? 1 : 0.3};
  transition: opacity 0.3s ease;
`;

const VolumeBar = styled.div<{ height: number; isActive: boolean }>`
  width: 4px;
  background-color: var(--bosch-dark-green);
  border-radius: 2px;
  transition: all 0.1s ease;
  height: ${props => props.isActive ? props.height : 8}px;
`;

const MicrophoneCheck: React.FC<MicrophoneCheckProps> = ({ 
  isChecking, 
  isConnected, 
  onStartCheck 
}) => {
  const getStatus = () => {
    if (isChecking) return 'checking';
    return isConnected ? 'connected' : 'disconnected';
  };

  const getStatusText = () => {
    if (isChecking) return 'Testing microphone connection...';
    if (isConnected) return 'Microphone is connected and ready';
    return 'Click to test your microphone';
  };

  const getStatusBadgeText = () => {
    if (isChecking) return 'Testing';
    return isConnected ? 'Connected' : 'Not Connected';
  };

  const status = getStatus();

  // Mock volume levels for visual effect
  const volumeLevels = [8, 12, 16, 20, 24, 20, 16, 12];

  return (
    <MicCheckContainer>
      <MicCheckHeader>
        <MicCheckTitle>Microphone Check</MicCheckTitle>
        <StatusBadge status={status}>
          {getStatusBadgeText()}
        </StatusBadge>
      </MicCheckHeader>
      
      <MicCheckContent>
        <MicrophoneIcon status={status}>
          🎤
        </MicrophoneIcon>
        
        <StatusText status={status}>
          {getStatusText()}
        </StatusText>
        
        <VolumeIndicator isActive={isChecking || isConnected}>
          {volumeLevels.map((height, index) => (
            <VolumeBar
              key={index}
              height={height}
              isActive={isChecking && index % 2 === 0}
            />
          ))}
        </VolumeIndicator>
        
        <CheckButton
          isChecking={isChecking}
          onClick={onStartCheck}
          disabled={isChecking}
        >
          {isChecking ? (
            <>
              <span>Testing...</span>
              <div className="loading">⟳</div>
            </>
          ) : (
            <>Test Microphone</>
          )}
        </CheckButton>
      </MicCheckContent>
    </MicCheckContainer>
  );
};

export default MicrophoneCheck;