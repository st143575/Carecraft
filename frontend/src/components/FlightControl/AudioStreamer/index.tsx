import React, { useState, useEffect, useRef, useCallback } from 'react';
import './AudioStreamer.css';

interface AudioStreamerProps {
  onAudioStream?: (stream: MediaStream) => void;
  onConnectionChange?: (connected: boolean) => void;
  onVolumeChange?: (volume: number) => void;
  isAwaitingAI?: boolean;
  setIsAwaitingAI?: (v: boolean) => void;
}

interface ConnectionQuality {
  signal: 'excellent' | 'good' | 'fair' | 'poor';
  latency: number;
  packetLoss: number;
}

const AudioStreamer: React.FC<AudioStreamerProps> = ({
  onAudioStream,
  onConnectionChange,
  onVolumeChange,
  isAwaitingAI = false,
  setIsAwaitingAI = () => {},
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>({
    signal: 'excellent',
    latency: 45,
    packetLoss: 0.1
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeIntervalRef = useRef<number | null>(null);
  const qualityIntervalRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Initialize audio monitoring
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    
    if (qualityIntervalRef.current) {
      clearInterval(qualityIntervalRef.current);
      qualityIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      // Stop the temporary stream, we'll create a new one when starting
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setError(null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Microphone access denied: ${errorMsg}`);
      setHasPermission(false);
      return false;
    }
  };

  const startAudioStream = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Request permission if not already granted
      if (hasPermission !== true) {
        const granted = await requestMicrophonePermission();
        if (!granted) {
          setIsConnecting(false);
          return;
        }
      }

      // Create audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // WebSocket connection
      wsRef.current = new WebSocket("ws://localhost:8000/ws/audio");
      wsRef.current.binaryType = "arraybuffer";

      wsRef.current.onopen = () => {
        // Start/stop MediaRecorder for each chunk
        let recorder: MediaRecorder | null = null;
        function startRecordingCycle() {
          recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
          mediaRecorderRef.current = recorder;
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0 && wsRef.current?.readyState === 1) {
              e.data.arrayBuffer().then(buf => wsRef.current?.send(buf));
            }
            // Restart recording for the next chunk
            recorder?.start();
            setTimeout(() => recorder?.stop(), 2000);
          };
          recorder.start();
          setTimeout(() => recorder?.stop(), 2000);
        }
        startRecordingCycle();
      };

      wsRef.current.onclose = () => {
        mediaRecorderRef.current?.stop();
      };

      setIsStreaming(true);
      setIsConnecting(false);
      onAudioStream?.(stream);
      onConnectionChange?.(true);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start audio stream';
      setError(errorMsg);
      setIsStreaming(false);
      setIsConnecting(false);
      onConnectionChange?.(false);
    }
  };

  const stopAudioStream = () => {
    cleanup();
    wsRef.current?.close();
    mediaRecorderRef.current?.stop();
    setIsStreaming(false);
    setVolume(0);
    onConnectionChange?.(false);
    onVolumeChange?.(0);
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const startVolumeMonitoring = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    volumeIntervalRef.current = setInterval(() => {
      if (analyserRef.current && !isMuted) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const volumeLevel = (average / 255) * 100;
        setVolume(volumeLevel);
        onVolumeChange?.(volumeLevel);
      } else {
        setVolume(0);
        onVolumeChange?.(0);
      }
    }, 100);
  };

  const startQualityMonitoring = () => {
    // Simulate connection quality changes
    qualityIntervalRef.current = setInterval(() => {
      const randomFactor = Math.random();
      
      let signal: ConnectionQuality['signal'];
      let latency: number;
      let packetLoss: number;

      if (randomFactor > 0.8) {
        signal = 'excellent';
        latency = 20 + Math.random() * 25;
        packetLoss = Math.random() * 0.5;
      } else if (randomFactor > 0.6) {
        signal = 'good';
        latency = 45 + Math.random() * 30;
        packetLoss = 0.5 + Math.random() * 1;
      } else if (randomFactor > 0.3) {
        signal = 'fair';
        latency = 75 + Math.random() * 50;
        packetLoss = 1 + Math.random() * 2;
      } else {
        signal = 'poor';
        latency = 125 + Math.random() * 100;
        packetLoss = 2 + Math.random() * 3;
      }

      setConnectionQuality({ signal, latency, packetLoss });
    }, 3000);
  };

  const getSignalIcon = () => {
    switch (connectionQuality.signal) {
      case 'excellent': return '📶';
      case 'good': return '📶';
      case 'fair': return '📶';
      case 'poor': return '📵';
      default: return '📶';
    }
  };

  const getSignalColor = () => {
    switch (connectionQuality.signal) {
      case 'excellent': return 'var(--bosch-dark-green)';
      case 'good': return 'var(--bosch-dark-blue)';
      case 'fair': return '#ffa500';
      case 'poor': return 'var(--bosch-red)';
      default: return 'var(--medium-gray)';
    }
  };

  const getMicrophoneIcon = () => {
    if (!isStreaming) return '🎤';
    if (isMuted) return '🔇';
    return volume > 20 ? '🎙️' : '🎤';
  };

  // Push-to-talk logic
  const handleStartRecording = async () => {
    setError(null);
    if (hasPermission !== true) {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    setIsRecording(true);
    // Open WebSocket if not open
    if (!wsRef.current || wsRef.current.readyState !== 1) {
      wsRef.current = new WebSocket("ws://localhost:8000/ws/audio");
      wsRef.current.binaryType = "arraybuffer";
    }
    // Start MediaRecorder
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mediaRecorderRef.current = recorder;
    let chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      if (wsRef.current && wsRef.current.readyState === 1) {
        blob.arrayBuffer().then(buf => wsRef.current?.send(buf));
        setIsAwaitingAI(true); // Disable button while waiting for AI
      }
      setIsRecording(false);
      chunks = [];
    };
    recorder.start();
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  // Listen for AI response to re-enable button
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      setIsAwaitingAI(false); // Re-enable button
      // Optionally handle AI audio here
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [wsRef.current, setIsAwaitingAI]);

  return (
    <div className="audio-streamer">
      <div className="streamer-header">
        <h3>Audio Control</h3>
        <div className="connection-status">
          <span 
            className="signal-indicator"
            style={{ color: getSignalColor() }}
          >
            {getSignalIcon()}
          </span>
          <span className="signal-text">{connectionQuality.signal}</span>
        </div>
      </div>

      <div className="audio-controls">
        <div className="main-controls">
          {!isRecording && !isAwaitingAI ? (
            <button onClick={handleStartRecording} className="start-button">
              🎤 Start Recording
            </button>
          ) : (
            <button onClick={handleStopRecording} className="stop-button" disabled={isAwaitingAI}>
              ⏹️ Stop Recording
            </button>
          )}
        </div>

        {hasPermission === false && (
          <div className="permission-prompt">
            <p>Microphone access is required for audio streaming.</p>
            <button onClick={requestMicrophonePermission}>
              Grant Permission
            </button>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}
      </div>

      <div className="audio-metrics">
        <div className="volume-display">
          <label>Volume Level</label>
          <div className="volume-bar">
            <div 
              className="volume-level"
              style={{ 
                width: `${volume}%`,
                backgroundColor: isMuted ? 'var(--medium-gray)' : getSignalColor()
              }}
            />
          </div>
          <span className="volume-text">{Math.round(volume)}%</span>
        </div>

        {isStreaming && (
          <div className="connection-metrics">
            <div className="metric">
              <label>Latency</label>
              <span>{Math.round(connectionQuality.latency)}ms</span>
            </div>
            <div className="metric">
              <label>Packet Loss</label>
              <span>{connectionQuality.packetLoss.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>

      {isStreaming && (
        <div className="streaming-indicator">
          <div className="pulse-dot" />
          <span>Live Audio Stream</span>
        </div>
      )}
    </div>
  );
};

export default AudioStreamer;