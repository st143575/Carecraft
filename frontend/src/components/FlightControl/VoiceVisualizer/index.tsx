import React, { useEffect, useRef, useState } from 'react';
// Fix import for AudioMotionAnalyzer - use dynamic import as fallback
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import './VoiceVisualizer.css';

interface VoiceVisualizerProps {
  isActive: boolean;
  userAudioStream?: MediaStream; // renamed from audioStream
  label: string;
  type: 'user' | 'bot';
  aiAudioData?: string | null; // renamed from audioData
  onAIAudioEnd?: () => void;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isActive,
  userAudioStream,
  label,
  type,
  aiAudioData,
  onAIAudioEnd
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioMotionRef = useRef<AudioMotionAnalyzer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [volume, setVolume] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      console.warn('[VoiceVisualizer] Container ref not available');
      return;
    }
    
    // Add a small delay to ensure the container is properly rendered
    const initTimeout = setTimeout(() => {
      initializeAudioMotion();
    }, 100);
    
    return () => {
      clearTimeout(initTimeout);
      cleanup();
    };
  }, [type]);

  const initializeAudioMotion = async () => {
    if (!containerRef.current) {
      setInitError('Container element not available');
      return;
    }
    
    // Check container dimensions
    const rect = containerRef.current.getBoundingClientRect();
    
    if (rect.width === 0 || rect.height === 0) {
      console.warn('[VoiceVisualizer] Container has zero dimensions, retrying...');
      setTimeout(() => initializeAudioMotion(), 200);
      return;
    }

    // Initialize AudioMotion analyzer
    try {
      setInitError(null);
      const audioMotion = new AudioMotionAnalyzer(containerRef.current, {
        mode: 3, // 1/3 octave bands
        barSpace: 0.3,
        bgAlpha: 0,
        colorMode: 'gradient',
        gradient: 'classic', // Use a valid default gradient initially
        height: 120,
        ledBars: false,
        lineWidth: 2,
        lumiBars: false,
        maxFreq: 16000,
        minFreq: 20,
        mirror: 0,
        noteLabels: false,
        outlineBars: false,
        radial: false,
        reflexRatio: 0,
        showBgColor: false,
        showFPS: false,
        showPeaks: true,
        showScaleX: false,
        showScaleY: false,
        smoothing: 0.7,
        spinSpeed: 0,
        splitGradient: false,
        weightingFilter: 'A'
      });

      // Custom gradient for BOSCH branding
      const customGradient = {
        name: type === 'user' ? 'boschUser' : 'boschBot',
        bgColor: '#1a1a1a',
        colorStops: type === 'user' 
          ? [
              { pos: 0, color: '#013662' },    // BOSCH dark blue
              { pos: 0.5, color: '#237147' },  // BOSCH dark green  
              { pos: 1, color: '#ffffff' }     // White peaks
            ]
          : [
              { pos: 0, color: '#ee4949' },    // BOSCH red
              { pos: 0.5, color: '#ff6b6b' },  // Lighter red
              { pos: 1, color: '#ffffff' }     // White peaks
            ]
      };

      try {
        audioMotion.registerGradient(customGradient.name, customGradient);
        audioMotion.gradient = customGradient.name;
      } catch (gradientError) {
        console.warn('[VoiceVisualizer] Custom gradient registration failed, using fallback:', gradientError);
        // Fallback to built-in gradients that actually exist
        audioMotion.gradient = type === 'user' ? 'rainbow' : 'classic';
      }

      audioMotionRef.current = audioMotion;

      // Use AudioMotion's built-in AudioContext instead of creating our own
      try {
        const audioContext = audioMotion.audioCtx;
        audioContextRef.current = audioContext;
        
        // Resume context if suspended (required by some browsers)
        if (audioContext.state === 'suspended') {
          audioContext.resume().catch(err => {
            console.error('[VoiceVisualizer] Failed to resume AudioContext:', err);
          });
        }
      } catch (contextError) {
        console.error('[VoiceVisualizer] AudioContext access failed:', contextError);
      }

      setIsInitialized(true);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[VoiceVisualizer] Error initializing AudioMotion:', error);
      console.error('[VoiceVisualizer] Error details:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        containerElement: containerRef.current,
        type: type
      });
      setInitError(`Initialization failed: ${errorMessage}`);
      setIsInitialized(false);
    }
  };

  useEffect(() => {
    if (isActive && isInitialized && audioMotionRef.current && audioContextRef.current) {
      if (type === 'user' && userAudioStream) {
        connectRealAudio(userAudioStream);
        setIsDemoMode(false);
      } else if (type === 'bot' && aiAudioData) {
        connectBotAudio();
        setIsDemoMode(false);
      } else {
        stopAudio();
      }
    } else {
      stopAudio();
    }
    // Cleanup bot audio connection on unmount or change
    return () => {
      disconnectAllSources();
    };
  }, [isActive, userAudioStream, isInitialized, aiAudioData, type]);

  useEffect(() => {
    if (type === 'bot' && aiAudioData && isActive) {
      const audioUrl = `data:audio/wav;base64,${aiAudioData}`;
      if (audioElementRef.current) {
        audioElementRef.current.src = audioUrl;
        audioElementRef.current.play();
        audioElementRef.current.onended = () => {
          if (onAIAudioEnd) onAIAudioEnd();
        };
      }
    }
    // Cleanup: remove onended handler if audioData changes
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.onended = null;
      }
    };
  }, [aiAudioData, isActive, type, onAIAudioEnd]);

  // Disconnect all audio sources from analyzer
  const disconnectAllSources = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.disconnect(); } catch {}
      sourceNodeRef.current = null;
    }
    if (botSourceNodeRef.current) {
      try { botSourceNodeRef.current.disconnect(); } catch {}
      botSourceNodeRef.current = null;
    }
    cleanupBotAnalyser();
  };

  // Connect user microphone stream
  const connectRealAudio = (stream: MediaStream) => {
    if (!stream || !audioContextRef.current || !audioMotionRef.current) return;
    disconnectAllSources();
    try {
      const source = audioContextRef.current.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      audioMotionRef.current.connectInput(source);
      // Monitor volume levels
      const analyser = audioContextRef.current.createAnalyser();
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setVolume(average / 255 * 100);
        if (isActive) requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (error) {
      console.error('[VoiceVisualizer] Error connecting real audio:', error);
    }
  };

  // Connect bot audio (base64 from backend) to visualizer and monitor volume
  const botSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const botAnalyserRef = useRef<AnalyserNode | null>(null);
  const botVolumeRAF = useRef<number | null>(null);

  const connectBotAudio = () => {
    if (!audioElementRef.current || !audioContextRef.current || !audioMotionRef.current) return;
    disconnectAllSources();
    try {
      // Create source node from <audio>
      const source = audioContextRef.current.createMediaElementSource(audioElementRef.current);
      botSourceNodeRef.current = source;
      audioMotionRef.current.connectInput(source);
      // Monitor volume levels for bot audio
      const analyser = audioContextRef.current.createAnalyser();
      botAnalyserRef.current = analyser;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setVolume(average / 255 * 100);
        if (isActive && type === 'bot' && audioElementRef.current && !audioElementRef.current.paused) {
          botVolumeRAF.current = requestAnimationFrame(updateVolume);
        }
      };
      updateVolume();
    } catch (error) {
      console.error('[VoiceVisualizer] Error connecting bot audio:', error);
    }
  };

  // Cleanup for bot analyser
  const cleanupBotAnalyser = () => {
    if (botVolumeRAF.current) {
      cancelAnimationFrame(botVolumeRAF.current);
      botVolumeRAF.current = null;
    }
    if (botAnalyserRef.current) {
      try { botAnalyserRef.current.disconnect(); } catch {}
      botAnalyserRef.current = null;
    }
  };

  const stopAudio = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch {
        // Oscillator might already be stopped
      }
      oscillatorRef.current = null;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    setVolume(0);
  };

  const cleanup = () => {
    stopAudio();
    
    if (audioMotionRef.current) {
      try {
        audioMotionRef.current.destroy();
        audioMotionRef.current = null;
      } catch (error) {
        console.error('[VoiceVisualizer] Error destroying AudioMotion:', error);
      }
    }

    // Don't close AudioMotion's AudioContext - it manages its own
    if (audioContextRef.current) {
      audioContextRef.current = null;
    }
  };

  const getStatusIcon = () => {
    if (!isActive) return '⏸️';
    if (isDemoMode) return '🎭';
    return volume > 10 ? '🔊' : '🔇';
  };

  const getStatusText = () => {
    if (!isActive) return 'Inactive';
    if (isDemoMode) return 'Demo Mode';
    return volume > 10 ? 'Active' : 'Quiet';
  };

  return (
    <div className={`voice-visualizer ${type} ${isActive ? 'active' : 'inactive'} ${!isInitialized ? 'loading' : ''}`}>
      <div className="visualizer-header">
        <h3 className="visualizer-label">{label}</h3>
        <div className="status-indicators">
          <span className="status-icon">{getStatusIcon()}</span>
          <span className="status-text">{getStatusText()}</span>
          <div className="volume-meter">
            <div 
              className="volume-fill" 
              style={{ width: `${volume}%` }}
            />
          </div>
        </div>
      </div>
      
      <div
        ref={containerRef}
        className="visualizer-container"
        style={{
          border: `2px solid ${type === 'user' ? 'var(--bosch-dark-blue)' : 'var(--bosch-red)'}`,
          borderRadius: 'var(--radius-medium)',
          backgroundColor: '#1a1a1a'
        }}
      >
        {!isInitialized && !initError && (
          <div className="loading-overlay">
            <span>Initializing visualizer...</span>
          </div>
        )}
        {initError && (
          <div className="error-overlay">
            <span>⚠️ {initError}</span>
          </div>
        )}
      </div>
      
      {isDemoMode && (
        <div className="demo-indicator">
          <span>🎭 Demo Mode - Simulated Audio</span>
        </div>
      )}
      <audio ref={audioElementRef} style={{ display: 'none' }} />
    </div>
  );
};

export default VoiceVisualizer;