// WebSocket Service for Real-Time Communication
// Handles WebSocket connections, audio streaming, and real-time messaging

export interface AudioFeatures {
  volume_level: number;
  sample_rate: number;
  duration_ms: number;
  rms: number;
}

export interface WebSocketMessage {
  type: 'connection_established' | 'audio_analysis' | 'ai_response' | 'pong' | 'command_acknowledgment';
  session_id?: string;
  timestamp?: string;
  features?: AudioFeatures;
  message?: string;
  is_complete?: boolean;
  incident_type?: string;
  metrics?: Record<string, unknown>;
  command?: string;
  status?: string;
}

export interface AIResponseMetadata {
  incident_type?: string;
  metrics?: Record<string, unknown>;
  is_complete?: boolean;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  lastPingTime?: number;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

export interface WebSocketServiceCallbacks {
  onConnectionStateChange?: (state: ConnectionState) => void;
  onAudioAnalysis?: (features: AudioFeatures) => void;
  onAIResponse?: (message: string, metadata?: AIResponseMetadata) => void;
  onError?: (error: Error) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private callbacks: WebSocketServiceCallbacks = {};
  private connectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5
  };
  private pingInterval: number | null = null;
  private reconnectTimeout: number | null = null;
  private audioBuffer: number[] = [];
  private isAudioStreaming = false;
  private baseUrl: string;

  constructor(baseUrl: string = 'ws://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  // Set callbacks for various events
  setCallbacks(callbacks: WebSocketServiceCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Connect to WebSocket server
  async connect(sessionId: string): Promise<boolean> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return true;
    }

    this.sessionId = sessionId;
    this.updateConnectionState({ isConnecting: true });

    try {
      this.ws = new WebSocket(`${this.baseUrl}/ws/${sessionId}`);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 10000); // 10 second timeout

        this.ws!.onopen = (event) => {
          clearTimeout(timeout);
          this.handleOpen(event);
          resolve(true);
        };
      });
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.updateConnectionState({ isConnecting: false });
      this.callbacks.onError?.(error as Error);
      return false;
    }
  }

  // Disconnect from WebSocket server
  disconnect() {
    this.stopHeartbeat();
    this.stopAudioStreaming();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.updateConnectionState({ 
      isConnected: false, 
      isConnecting: false,
      reconnectAttempts: 0
    });
  }

  // Send text message
  sendTextMessage(message: string) {
    this.sendMessage({
      type: 'text_message',
      message: message
    });
  }

  // Send voice command
  sendVoiceCommand(command: string) {
    this.sendMessage({
      type: 'voice_command',
      command: command
    });
  }

  // Start audio streaming
  startAudioStreaming(audioStream: MediaStream) {
    if (this.isAudioStreaming) {
      console.log('Audio streaming already active');
      return;
    }

    this.isAudioStreaming = true;
    this.setupAudioProcessing(audioStream);
  }

  // Stop audio streaming
  stopAudioStreaming() {
    this.isAudioStreaming = false;
    this.audioBuffer = [];
  }

  // Get connection state
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  // Private methods
  private handleOpen(event: Event) {
    console.log('WebSocket connected:', event);
    this.updateConnectionState({ 
      isConnected: true, 
      isConnecting: false,
      reconnectAttempts: 0
    });
    this.startHeartbeat();
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('WebSocket message received:', message);

      this.callbacks.onMessage?.(message);

      switch (message.type) {
        case 'connection_established':
          console.log('Connection established for session:', message.session_id);
          break;

        case 'audio_analysis':
          if (message.features) {
            this.callbacks.onAudioAnalysis?.(message.features);
          }
          break;

        case 'ai_response':
          if (message.message) {
            this.callbacks.onAIResponse?.(message.message, {
              incident_type: message.incident_type,
              metrics: message.metrics,
              is_complete: message.is_complete
            });
          }
          break;

        case 'pong':
          this.connectionState.lastPingTime = Date.now();
          break;

        case 'command_acknowledgment':
          console.log('Command acknowledged:', message.command, message.status);
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  private handleClose(event: CloseEvent) {
    console.log('WebSocket closed:', event);
    this.updateConnectionState({ isConnected: false, isConnecting: false });
    this.stopHeartbeat();
    
    // Attempt to reconnect if not a normal closure
    if (event.code !== 1000 && this.connectionState.reconnectAttempts < this.connectionState.maxReconnectAttempts) {
      this.attemptReconnect();
    }
  }

  private handleError(event: Event) {
    console.error('WebSocket error:', event);
    this.callbacks.onError?.(new Error('WebSocket connection error'));
  }

  private attemptReconnect() {
    if (!this.sessionId) return;

    this.connectionState.reconnectAttempts++;
    this.updateConnectionState({ isConnecting: true });

    const delay = Math.min(1000 * Math.pow(2, this.connectionState.reconnectAttempts), 30000);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.connectionState.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.sessionId!);
    }, delay);
  }

  private startHeartbeat() {
    this.pingInterval = setInterval(() => {
      this.sendMessage({ type: 'ping' });
    }, 30000); // Ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private sendMessage(message: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  private updateConnectionState(updates: Partial<ConnectionState>) {
    this.connectionState = { ...this.connectionState, ...updates };
    this.callbacks.onConnectionStateChange?.(this.connectionState);
  }

  private setupAudioProcessing(audioStream: MediaStream) {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(audioStream);
      
      analyser.fftSize = 2048;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const processAudio = () => {
        if (!this.isAudioStreaming) return;

        analyser.getByteFrequencyData(dataArray);
        
        // Convert to hex string for transmission
        const hexData = Array.from(dataArray)
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');

        // Send audio data every 100ms
        this.sendMessage({
          type: 'audio_data',
          data: hexData
        });

        // Continue processing
        setTimeout(processAudio, 100);
      };

      processAudio();
    } catch (error) {
      console.error('Error setting up audio processing:', error);
      this.callbacks.onError?.(error as Error);
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;