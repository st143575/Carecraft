// TypeScript interfaces for CareCraft application state management

export interface CaseData {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  scenario: string;
  expectedOutcomes: string[];
}

export interface CallState {
  isInProgress: boolean;
  isFinished: boolean;
  startTime?: Date;
  endTime?: Date;
  duration?: number; // in seconds
}

export interface ConversationData {
  transcript: string;
  summary: string;
  keyPoints: string[];
  performanceMetrics: {
    communicationScore: number;
    empathyScore: number;
    clinicalAccuracy: number;
    responseTime: number;
  };
}

export interface ApplicationState {
  selectedCase: CaseData | null;
  callState: CallState;
  conversationData: ConversationData | null;
  currentPhase: 'preflight' | 'flight-control' | 'postflight';
}

export interface PreFlightProps {
  onSelectCase: (caseData: CaseData) => void;
}

export interface FlightControlProps {
  selectedCase: CaseData;
  onCallStart: () => void;
  onCallFinish: () => void;
}

export interface PostFlightProps {
  selectedCase: CaseData;
  conversationData: ConversationData;
  onReset?: () => void;
}

export interface PreFlightChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface PreFlightChecklistProps {
  items: PreFlightChecklistItem[];
  onItemToggle: (id: string) => void;
  allCompleted: boolean;
}

export interface CaseSelectorProps {
  cases: CaseData[];
  selectedCase: CaseData | null;
  onCaseSelect: (caseData: CaseData) => void;
}

export interface MicrophoneCheckProps {
  isChecking: boolean;
  isConnected: boolean;
  onStartCheck: () => void;
}

export interface VoiceVisualizerProps {
  isActive: boolean;
  audioStream?: MediaStream;
  label: string;
  type: 'user' | 'bot';
}

export interface AudioStreamerProps {
  onAudioStream?: (stream: MediaStream) => void;
  onConnectionChange?: (connected: boolean) => void;
  onVolumeChange?: (volume: number) => void;
}

export interface CallMetrics {
  duration: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  isRecording: boolean;
  userVolume: number;
  botVolume: number;
}

export interface EmergencyAlertState {
  isActive: boolean;
  type: 'medical' | 'fire' | 'police' | 'technical';
  timestamp?: Date;
}