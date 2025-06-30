// React Hook for WebSocket Management
// Provides easy-to-use interface for WebSocket connections in React components

import { useState, useEffect, useCallback, useRef } from 'react';
import websocketService from '../services/websocketService';
import type {
  ConnectionState,
  AudioFeatures,
  AIResponseMetadata,
  WebSocketServiceCallbacks
} from '../services/websocketService';

export interface UseWebSocketOptions {
  sessionId?: string;
  autoConnect?: boolean;
  onAudioAnalysis?: (features: AudioFeatures) => void;
  onAIResponse?: (message: string, metadata?: AIResponseMetadata) => void;
  onError?: (error: Error) => void;
}

export interface UseWebSocketReturn {
  connectionState: ConnectionState;
  connect: (sessionId: string) => Promise<boolean>;
  disconnect: () => void;
  sendTextMessage: (message: string) => void;
  sendVoiceCommand: (command: string) => void;
  startAudioStreaming: (audioStream: MediaStream) => void;
  stopAudioStreaming: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
}

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    websocketService.getConnectionState()
  );
  const [error, setError] = useState<Error | null>(null);
  const callbacksRef = useRef<WebSocketServiceCallbacks>({});

  // Update callbacks ref when options change
  useEffect(() => {
    callbacksRef.current = {
      onConnectionStateChange: setConnectionState,
      onAudioAnalysis: options.onAudioAnalysis,
      onAIResponse: options.onAIResponse,
      onError: (err) => {
        setError(err);
        options.onError?.(err);
      },
    };

    websocketService.setCallbacks(callbacksRef.current);
  }, [options.onAudioAnalysis, options.onAIResponse, options.onError]);

  // Auto-connect if sessionId is provided and autoConnect is true
  useEffect(() => {
    if (options.sessionId && options.autoConnect && !connectionState.isConnected) {
      connect(options.sessionId);
    }
  }, [options.sessionId, options.autoConnect]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      websocketService.disconnect();
    };
  }, []);

  const connect = useCallback(async (sessionId: string): Promise<boolean> => {
    setError(null);
    try {
      const success = await websocketService.connect(sessionId);
      if (!success) {
        setError(new Error('Failed to connect to WebSocket server'));
      }
      return success;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown connection error');
      setError(error);
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    setError(null);
    websocketService.disconnect();
  }, []);

  const sendTextMessage = useCallback((message: string) => {
    try {
      websocketService.sendTextMessage(message);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
    }
  }, []);

  const sendVoiceCommand = useCallback((command: string) => {
    try {
      websocketService.sendVoiceCommand(command);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send voice command');
      setError(error);
    }
  }, []);

  const startAudioStreaming = useCallback((audioStream: MediaStream) => {
    try {
      websocketService.startAudioStreaming(audioStream);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start audio streaming');
      setError(error);
    }
  }, []);

  const stopAudioStreaming = useCallback(() => {
    try {
      websocketService.stopAudioStreaming();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to stop audio streaming');
      setError(error);
    }
  }, []);

  return {
    connectionState,
    connect,
    disconnect,
    sendTextMessage,
    sendVoiceCommand,
    startAudioStreaming,
    stopAudioStreaming,
    isConnected: connectionState.isConnected,
    isConnecting: connectionState.isConnecting,
    error,
  };
};

export default useWebSocket;