import React, { useState, useEffect, useRef } from 'react';
import VoiceVisualizer from './VoiceVisualizer';
import AudioStreamer from './AudioStreamer';
import useWebSocket from '../../hooks/useWebSocket';
import type { FlightControlProps, CallMetrics, EmergencyAlertState } from '../../types';
import type { AudioFeatures } from '../../services/websocketService';
import './FlightControl.css';

const FlightControl: React.FC<FlightControlProps> = ({
  selectedCase,
  onCallStart,
  onCallFinish
}) => {
  const [callMetrics, setCallMetrics] = useState<CallMetrics>({
    duration: 0,
    quality: 'excellent',
    isRecording: true,
    userVolume: 0,
    botVolume: 0
  });

  const [emergencyAlert, setEmergencyAlert] = useState<EmergencyAlertState>({
    isActive: false,
    type: 'medical'
  });

  const [userAudioStream, setUserAudioStream] = useState<MediaStream | null>(null);
  const [aiAudioData, setAiAudioData] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [showProtocolReminder, setShowProtocolReminder] = useState(true);
  const [realTimeAudioData, setRealTimeAudioData] = useState<AudioFeatures | null>(null);
  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const [isAwaitingAI, setIsAwaitingAI] = useState(false);

  const callTimerRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket integration
  const {
    connectionState,
    connect,
    disconnect,
    sendTextMessage,
    startAudioStreaming,
    stopAudioStreaming,
    isConnected,
    error: wsError
  } = useWebSocket({
    onAudioAnalysis: (features: AudioFeatures) => {
      setRealTimeAudioData(features);
      setCallMetrics(prev => ({
        ...prev,
        userVolume: features.volume_level
      }));
    },
    onAIResponse: (message: string, metadata) => {
      setAiMessages(prev => [...prev, message]);
      console.log('AI Response:', message, metadata);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setCallMetrics(prev => ({
        ...prev,
        quality: 'poor'
      }));
    }
  });

  // Start call timer when call becomes active
  useEffect(() => {
    if (isCallActive && !callTimerRef.current) {
      callTimerRef.current = window.setInterval(() => {
        setCallMetrics(prev => ({
          ...prev,
          duration: prev.duration + 1
        }));
      }, 1000);
    } else if (!isCallActive && callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isCallActive]);

  // Simulate bot audio volume
  useEffect(() => {
    if (isCallActive) {
      const interval = setInterval(() => {
        const botVolume = 20 + Math.random() * 60; // Simulate bot speaking
        setCallMetrics(prev => ({
          ...prev,
          botVolume
        }));
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isCallActive]);

  // Listen for backend audio
  useEffect(() => {
    if (!wsRef.current) {
      wsRef.current = new WebSocket("ws://localhost:8000/ws/audio");
      wsRef.current.onmessage = (event) => {
        try {
          const { audio } = JSON.parse(event.data);
          setAiAudioData(audio);
        } catch {}
      };
    }
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  const handleStartCall = async () => {
    // Generate session ID and connect to WebSocket
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionIdRef.current = sessionId;
    
    const connected = await connect(sessionId);
    if (!connected) {
      console.error('Failed to establish WebSocket connection');
      setCallMetrics(prev => ({ ...prev, quality: 'poor' }));
    }

    setIsCallActive(true);
    setCallMetrics(prev => ({ ...prev, duration: 0 }));
    onCallStart();
  };

  const handleFinishCall = () => {
    // Disconnect WebSocket and stop audio streaming
    disconnect();
    stopAudioStreaming();
    
    setIsCallActive(false);
    setUserAudioStream(null);
    setCallMetrics(prev => ({ ...prev, isRecording: false }));
    sessionIdRef.current = null;
    onCallFinish();
  };

  const handleAudioStream = (stream: MediaStream) => {
    setUserAudioStream(stream);
    
    // Start WebSocket audio streaming if connected
    if (isConnected && stream) {
      startAudioStreaming(stream);
    }
  };

  const handleConnectionChange = (connected: boolean) => {
    setCallMetrics(prev => ({
      ...prev,
      quality: connected && isConnected ? 'excellent' : connected ? 'good' : 'poor'
    }));
  };

  const handleVolumeChange = (volume: number) => {
    setCallMetrics(prev => ({
      ...prev,
      userVolume: volume
    }));
  };

  const handleEmergencyAlert = (type: EmergencyAlertState['type']) => {
    setEmergencyAlert({
      isActive: true,
      type,
      timestamp: new Date()
    });

    // Send emergency alert through WebSocket if connected
    if (isConnected) {
      sendTextMessage(`EMERGENCY_ALERT: ${type.toUpperCase()} services needed immediately`);
    }

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setEmergencyAlert(prev => ({ ...prev, isActive: false }));
    }, 5000);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualityColor = () => {
    switch (callMetrics.quality) {
      case 'excellent': return 'var(--bosch-dark-green)';
      case 'good': return 'var(--bosch-dark-blue)';
      case 'fair': return '#ffa500';
      case 'poor': return 'var(--bosch-red)';
      default: return 'var(--medium-gray)';
    }
  };

  const getQualityIcon = () => {
    switch (callMetrics.quality) {
      case 'excellent': return '🟢';
      case 'good': return '🟡';
      case 'fair': return '🟠';
      case 'poor': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="flight-control">
      <div className="flight-control-header">
        <div className="case-info">
          <h2>Active Call - {selectedCase.title}</h2>
          <p className="case-description">{selectedCase.description}</p>
          <div className="difficulty-badge">
            <span className={`difficulty ${selectedCase.difficulty}`}>
              {selectedCase.difficulty.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="call-status">
          <div className="call-timer">
            <span className="timer-label">Call Duration</span>
            <span className="timer-value">{formatDuration(callMetrics.duration)}</span>
          </div>
          
          <div className="call-quality">
            <span className="quality-label">Quality</span>
            <div className="quality-indicator">
              <span className="quality-icon">{getQualityIcon()}</span>
              <span 
                className="quality-text"
                style={{ color: getQualityColor() }}
              >
                {callMetrics.quality}
              </span>
            </div>
          </div>

          {callMetrics.isRecording && (
            <div className="recording-indicator">
              <div className="recording-dot" />
              <span>Recording</span>
            </div>
          )}
        </div>
      </div>

      {showProtocolReminder && (
        <div className="protocol-reminder">
          <div className="reminder-content">
            <h3>📋 Protocol Reminder</h3>
            <ul>
              <li>Stay calm and speak clearly</li>
              <li>Listen actively to the caller's concerns</li>
              <li>Ask relevant follow-up questions</li>
              <li>Use emergency alerts if needed</li>
            </ul>
          </div>
          <button 
            className="dismiss-reminder"
            onClick={() => setShowProtocolReminder(false)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="audio-visualization-section">
        <div className="visualizers-grid">
          <VoiceVisualizer
            isActive={isCallActive}
            audioStream={userAudioStream || undefined}
            label="Your Voice"
            type="user"
          />
          
          <VoiceVisualizer
            isActive={isCallActive}
            label="AI Assistant"
            type="bot"
            audioData={aiAudioData}
            onAIAudioEnd={() => setIsAwaitingAI(false)}
          />
        </div>

        <AudioStreamer
          onAudioStream={setUserAudioStream}
          onConnectionChange={() => {}}
          onVolumeChange={() => {}}
          isAwaitingAI={isAwaitingAI}
          setIsAwaitingAI={setIsAwaitingAI}
        />
      </div>

      <div className="emergency-controls">
        <h3>Emergency Services</h3>
        <div className="emergency-buttons">
          <button 
            className="emergency-btn medical"
            onClick={() => handleEmergencyAlert('medical')}
            disabled={emergencyAlert.isActive}
          >
            🚑 Medical
          </button>
          
          <button 
            className="emergency-btn fire"
            onClick={() => handleEmergencyAlert('fire')}
            disabled={emergencyAlert.isActive}
          >
            🚒 Fire
          </button>
          
          <button 
            className="emergency-btn police"
            onClick={() => handleEmergencyAlert('police')}
            disabled={emergencyAlert.isActive}
          >
            🚓 Police
          </button>
          
          <button 
            className="emergency-btn technical"
            onClick={() => handleEmergencyAlert('technical')}
            disabled={emergencyAlert.isActive}
          >
            🔧 Technical
          </button>
        </div>

        {emergencyAlert.isActive && (
          <div className={`emergency-alert ${emergencyAlert.type}`}>
            <div className="alert-content">
              <strong>🚨 Emergency Alert Sent</strong>
              <p>
                {emergencyAlert.type.charAt(0).toUpperCase() + emergencyAlert.type.slice(1)} services 
                have been notified at {emergencyAlert.timestamp?.toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="call-controls">
        {!isCallActive ? (
          <button 
            className="start-call-btn"
            onClick={handleStartCall}
          >
            📞 Start Call
          </button>
        ) : (
          <button 
            className="finish-call-btn"
            onClick={handleFinishCall}
          >
            📞 Finish Call
          </button>
        )}
      </div>

      <div className="real-time-metrics">
        <h3>Call Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <label>User Volume</label>
            <div className="volume-bar">
              <div 
                className="volume-fill user"
                style={{ width: `${callMetrics.userVolume}%` }}
              />
            </div>
            <span>{Math.round(callMetrics.userVolume)}%</span>
          </div>

          <div className="metric-card">
            <label>AI Volume</label>
            <div className="volume-bar">
              <div 
                className="volume-fill bot"
                style={{ width: `${callMetrics.botVolume}%` }}
              />
            </div>
            <span>{Math.round(callMetrics.botVolume)}%</span>
          </div>

          <div className="metric-card">
            <label>Connection</label>
            <div className="connection-status">
              <span 
                className="status-dot"
                style={{ backgroundColor: getQualityColor() }}
              />
              <span>{callMetrics.quality}</span>
            </div>
          </div>

          <div className="metric-card">
            <label>Recording Status</label>
            <div className="recording-status">
              <span className={`status-indicator ${callMetrics.isRecording ? 'active' : 'inactive'}`}>
                {callMetrics.isRecording ? '🔴 Recording' : '⏹️ Stopped'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightControl;
