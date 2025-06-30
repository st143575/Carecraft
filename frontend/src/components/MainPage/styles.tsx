// Styled components for the MainPage component
import styled from 'styled-components';

export const MainPageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--light-gray);
`;

export const MainHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-xl);
  background-color: var(--white);
  border-bottom: 3px solid var(--bosch-dark-blue);
  box-shadow: var(--shadow-light);

  @media (max-width: 768px) {
    padding: var(--spacing-md);
    flex-direction: column;
    gap: var(--spacing-md);
  }

  @media (max-width: 480px) {
    padding: var(--spacing-sm);
  }
`;

export const Logo = styled.h1`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--bosch-dark-blue);
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -1px;
  
  img {
    height: 8rem;
    width: auto;
  }
  
  @media (max-width: 768px) {
    font-size: 2rem;
    
    img {
      height: 2rem;
    }
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
    
    img {
      height: 1.5rem;
    }
  }
`;

export const ResetButton = styled.button`
  background-color: var(--bosch-red);
  color: var(--white);
  border: none;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-medium);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    background-color: #d73d3d;
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus {
    outline: 2px solid var(--white);
    outline-offset: 2px;
  }
`;

export const MainContent = styled.main`
  flex: 1;
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    padding: var(--spacing-md);
  }

  @media (max-width: 480px) {
    padding: var(--spacing-sm);
  }
`;

export const PhaseContainer = styled.div<{ phase: 'preflight' | 'flight-control' | 'postflight' }>`
  background-color: var(--white);
  border-radius: var(--radius-large);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-medium);
  margin-bottom: var(--spacing-xl);
  border-left: 5px solid ${props => {
    switch (props.phase) {
      case 'preflight':
        return 'var(--bosch-dark-green)';
      case 'flight-control':
        return 'var(--bosch-red)';
      case 'postflight':
        return 'var(--bosch-dark-blue)';
      default:
        return 'var(--bosch-dark-blue)';
    }
  }};
  animation: fadeIn 0.5s ease-in;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    padding: var(--spacing-lg);
  }

  @media (max-width: 480px) {
    padding: var(--spacing-md);
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const StatusIndicator = styled.div<{ status: 'active' | 'completed' | 'pending' }>`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-small);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--spacing-md);

  ${props => {
    switch (props.status) {
      case 'active':
        return `
          background-color: rgba(238, 73, 73, 0.1);
          color: var(--bosch-red);
        `;
      case 'completed':
        return `
          background-color: rgba(35, 113, 71, 0.1);
          color: var(--bosch-dark-green);
        `;
      case 'pending':
      default:
        return `
          background-color: rgba(1, 54, 98, 0.1);
          color: var(--bosch-dark-blue);
        `;
    }
  }}
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: var(--medium-gray);
  border-radius: var(--radius-small);
  overflow: hidden;
  margin: var(--spacing-md) 0;
`;

export const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(90deg, var(--bosch-dark-blue), var(--bosch-dark-green));
  transition: width 0.3s ease;
`;