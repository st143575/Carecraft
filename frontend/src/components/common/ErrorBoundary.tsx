import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: var(--spacing-2xl);
  background-color: var(--white);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-medium);
  border: 1px solid var(--medium-gray);
  margin: var(--spacing-xl);
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
  color: var(--bosch-red);
`;

const ErrorTitle = styled.h2`
  color: var(--bosch-dark-blue);
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
`;

const ErrorMessage = styled.p`
  color: var(--text-light);
  font-size: 1rem;
  margin-bottom: var(--spacing-lg);
  max-width: 500px;
  line-height: 1.6;
`;

const ErrorDetails = styled.details`
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--light-gray);
  border-radius: var(--radius-medium);
  border: 1px solid var(--medium-gray);
  max-width: 600px;
  width: 100%;
`;

const ErrorSummary = styled.summary`
  color: var(--bosch-dark-blue);
  font-weight: 600;
  cursor: pointer;
  padding: var(--spacing-sm);
  
  &:hover {
    color: var(--bosch-red);
  }
`;

const ErrorCode = styled.pre`
  background-color: var(--white);
  border: 1px solid var(--medium-gray);
  border-radius: var(--radius-small);
  padding: var(--spacing-md);
  margin-top: var(--spacing-md);
  font-size: 0.8rem;
  color: var(--text-dark);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const RetryButton = styled.button`
  background-color: var(--bosch-dark-blue);
  color: var(--white);
  border: none;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-medium);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: var(--bosch-dark-green);
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ActionGroup = styled.div`
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  flex-wrap: wrap;
  justify-content: center;
`;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorContainer>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorMessage>
            We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.
          </ErrorMessage>
          
          <ActionGroup>
            <RetryButton onClick={this.handleRetry}>
              🔄 Try Again
            </RetryButton>
            <RetryButton onClick={this.handleReload}>
              🔃 Reload Page
            </RetryButton>
            <RetryButton onClick={this.handleGoHome}>
              🏠 Go Home
            </RetryButton>
          </ActionGroup>

          {import.meta.env.DEV && this.state.error && (
            <ErrorDetails>
              <ErrorSummary>🔍 Error Details (Development)</ErrorSummary>
              <ErrorCode>
                <strong>Error:</strong> {this.state.error.message}
                {this.state.error.stack && (
                  <>
                    <br /><br />
                    <strong>Stack Trace:</strong><br />
                    {this.state.error.stack}
                  </>
                )}
                {this.state.errorInfo && (
                  <>
                    <br /><br />
                    <strong>Component Stack:</strong><br />
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </ErrorCode>
            </ErrorDetails>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;