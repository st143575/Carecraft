// main page high-level component
// application is called "CareCraft"
// header displays a big logo with the name "CareCraft" in the middle
// has a white background
// main colors are BOSCH dark blue #013662, BOSCH dark green #237147
// highlight color is BOSCH red #ee4949
// has a horizontal menu with a button that resets the state of the application


// only shows PreFlight component, if no case is selected
// if a case is selected, it shows the FlightControl component
// if the conversation is finished, it shows the PostFlight component
import React, { useState } from 'react';

import PreFlight from '../PreFlight';
import FlightControl from '../FlightControl';
import PostFlight from '../PostFlight';
import type { CaseData, CallState, ConversationData } from '../../types';
import demoDataService from '../../services/demoDataService';
import {
  MainPageContainer,
  MainHeader,
  Logo,
  ResetButton,
  MainContent,
  PhaseContainer,
  StatusIndicator,
  ProgressBar,
  ProgressFill
} from './styles';

const MainPage: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [callState, setCallState] = useState<CallState>({
    isInProgress: false,
    isFinished: false,
  });
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);

  const handleCallStart = () => {
    setCallState(prev => ({
      ...prev,
      isInProgress: true,
      startTime: new Date(),
    }));
  };

  const handleCallFinish = () => {
    setCallState(prev => ({
      ...prev,
      isInProgress: false,
      isFinished: true,
      endTime: new Date(),
    }));
    
    // Generate conversation data using demo service
    if (selectedCase) {
      const conversationData = demoDataService.generateConversationData(selectedCase.id);
      setConversationData(conversationData);
    }
  };

  const handleResetApplication = () => {
    setSelectedCase(null);
    setCallState({
      isInProgress: false,
      isFinished: false,
    });
    setConversationData(null);
  };

  const getCurrentPhase = (): 'preflight' | 'flight-control' | 'postflight' => {
    if (!selectedCase) return 'preflight';
    if (!callState.isFinished) return 'flight-control';
    return 'postflight';
  };

  const getProgress = (): number => {
    if (!selectedCase) return 33;
    if (!callState.isFinished) return 66;
    return 100;
  };

  return (
    <MainPageContainer>
      <MainHeader>
        <Logo>
          <img src="/logo.svg" alt="CareCraft Logo" />
          <span>
            <span style={{ color: '#237147' }}>Care</span>
            <span style={{ color: '#013662' }}>Craft</span>
          </span>
        </Logo>
        <ResetButton
          onClick={handleResetApplication}
          title="Reset Application"
        >
          Reset
        </ResetButton>
      </MainHeader>
      
      <MainContent>
        <StatusIndicator
          status={callState.isInProgress ? 'active' : callState.isFinished ? 'completed' : 'pending'}
        >
          Phase: {getCurrentPhase().replace('-', ' ')}
        </StatusIndicator>
        
        <ProgressBar>
          <ProgressFill progress={getProgress()} />
        </ProgressBar>

        {!selectedCase && (
          <PhaseContainer phase="preflight">
            <PreFlight onSelectCase={setSelectedCase} />
          </PhaseContainer>
        )}
        
        {selectedCase && !callState.isFinished && (
          <PhaseContainer phase="flight-control">
            <FlightControl
              selectedCase={selectedCase}
              onCallStart={handleCallStart}
              onCallFinish={handleCallFinish}
            />
          </PhaseContainer>
        )}
        
        {callState.isFinished && selectedCase && conversationData && (
          <PhaseContainer phase="postflight">
            <PostFlight
              selectedCase={selectedCase}
              conversationData={conversationData}
              onReset={handleResetApplication}
            />
          </PhaseContainer>
        )}
      </MainContent>
    </MainPageContainer>
  );
};

export default MainPage;

