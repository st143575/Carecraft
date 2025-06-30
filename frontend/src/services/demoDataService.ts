// Demo Data Service for CareCraft Application
// Centralizes all mocked data for consistent structure across components

import type { CaseData, ConversationData, PreFlightChecklistItem } from '../types';

export interface DemoDataService {
  getCases(): CaseData[];
  getPreFlightChecklist(): PreFlightChecklistItem[];
  generateConversationData(caseId: string): ConversationData;
  getPerformanceMetrics(): {
    protocol: number;
    compassion: number;
    clarity: number;
    overall: number;
  };
  getTimelineData(): Array<{
    time: number;
    score: number;
    timestamp: string;
  }>;
  getAnnotations(): Array<{
    time: number;
    score: number;
    type: 'positive' | 'negative' | 'neutral';
    message: string;
    transcriptSection: number;
  }>;
  getTranscriptEntries(): Array<{
    id: number;
    timestamp: string;
    speaker: 'agent' | 'customer';
    message: string;
    highlights?: Array<{
      text: string;
      type: 'positive' | 'negative' | 'protocol';
      annotation?: string;
    }>;
    section?: number;
  }>;
}

class DemoDataServiceImpl implements DemoDataService {
  private static instance: DemoDataServiceImpl;

  public static getInstance(): DemoDataServiceImpl {
    if (!DemoDataServiceImpl.instance) {
      DemoDataServiceImpl.instance = new DemoDataServiceImpl();
    }
    return DemoDataServiceImpl.instance;
  }

  getCases(): CaseData[] {
    return [
      {
        id: 'vehicle-accident-minor',
        title: 'Vehicle Accident - Minor Injuries',
        description: 'Practice handling a vehicle accident with minor injuries and coordinating emergency response',
        difficulty: 'easy',
        scenario: 'Two-car collision with minor injuries, no entrapment. Caller reports both drivers are conscious.',
        expectedOutcomes: [
          'Assess injury severity and consciousness',
          'Coordinate medical response (EMS)',
          'Manage traffic safety concerns',
          'Document incident details accurately'
        ]
      },
      {
        id: 'medical-cardiac',
        title: 'Medical Emergency - Cardiac Event',
        description: 'Respond to a cardiac emergency requiring immediate medical intervention',
        difficulty: 'hard',
        scenario: 'Adult male experiencing chest pain and difficulty breathing. Family member calling for help.',
        expectedOutcomes: [
          'Identify cardiac symptoms quickly',
          'Provide CPR guidance if needed',
          'Coordinate ALS response',
          'Maintain caller composure',
          'Document vital information'
        ]
      },
      {
        id: 'roadside-breakdown',
        title: 'Roadside Assistance - Vehicle Breakdown',
        description: 'Handle a vehicle breakdown situation with potential safety concerns',
        difficulty: 'easy',
        scenario: 'Vehicle breakdown on highway shoulder during heavy traffic. Driver stranded safely.',
        expectedOutcomes: [
          'Ensure caller safety first',
          'Coordinate towing service',
          'Manage traffic hazards',
          'Provide safety instructions'
        ]
      },
      {
        id: 'domestic-disturbance',
        title: 'Domestic Disturbance - Welfare Check',
        description: 'Manage a welfare check request for domestic disturbance',
        difficulty: 'medium',
        scenario: 'Neighbor reports loud argument and possible domestic violence from adjacent apartment.',
        expectedOutcomes: [
          'Assess threat level carefully',
          'Coordinate police response',
          'Provide safety guidance to caller',
          'Document incident thoroughly',
          'Follow domestic violence protocols'
        ]
      },
      {
        id: 'fire-emergency',
        title: 'Fire Emergency - Residential',
        description: 'Respond to a residential fire emergency with potential entrapment',
        difficulty: 'hard',
        scenario: 'House fire with possible occupants trapped inside. Multiple emergency services needed.',
        expectedOutcomes: [
          'Coordinate fire department response',
          'Assess evacuation needs',
          'Manage scene safety',
          'Coordinate with multiple agencies',
          'Provide evacuation guidance'
        ]
      },
      {
        id: 'mental-health-crisis',
        title: 'Mental Health Crisis - Suicide Risk',
        description: 'Handle a mental health crisis with suicide risk assessment',
        difficulty: 'medium',
        scenario: 'Caller expressing suicidal thoughts and intent. Requires immediate crisis intervention.',
        expectedOutcomes: [
          'Conduct suicide risk assessment',
          'Provide crisis counseling support',
          'Coordinate mental health response',
          'Maintain continuous contact',
          'Follow crisis protocols'
        ]
      }
    ];
  }

  getPreFlightChecklist(): PreFlightChecklistItem[] {
    return [
      {
        id: 'headset',
        text: 'Check headset connection and audio quality',
        completed: false
      },
      {
        id: 'protocols',
        text: 'Review emergency response protocols and guidelines',
        completed: false
      },
      {
        id: 'contacts',
        text: 'Verify emergency contact information is up to date',
        completed: false
      },
      {
        id: 'workspace',
        text: 'Ensure quiet workspace free from distractions',
        completed: false
      },
      {
        id: 'documentation',
        text: 'Have incident documentation templates ready',
        completed: false
      },
      {
        id: 'escalation',
        text: 'Confirm escalation procedures and supervisor contacts',
        completed: false
      }
    ];
  }

  generateConversationData(caseId: string): ConversationData {
    const baseData = {
      transcript: this.generateDetailedTranscript(caseId),
      summary: this.generateCaseSummary(caseId),
      keyPoints: this.generateKeyPoints(caseId),
      performanceMetrics: this.generatePerformanceMetrics()
    };

    return baseData;
  }

  private generateDetailedTranscript(_caseId: string): string {
    const transcriptEntries = this.getTranscriptEntries();
    return transcriptEntries
      .map(entry => `[${entry.timestamp}] ${entry.speaker === 'agent' ? 'Agent' : 'Customer'}: ${entry.message}`)
      .join('\n');
  }

  private generateCaseSummary(caseId: string): string {
    const summaries: Record<string, string> = {
      'medical-cardiac': 'Successfully handled cardiac emergency call. Provided clear guidance to family member, coordinated ALS response, and maintained calm communication throughout the incident. Patient was stabilized and transported to hospital.',
      'vehicle-accident-minor': 'Managed vehicle accident with minor injuries effectively. Coordinated EMS response, ensured scene safety, and documented all relevant details. Both drivers received appropriate medical attention.',
      'roadside-breakdown': 'Handled roadside assistance request professionally. Ensured caller safety, coordinated towing service, and provided clear safety instructions for highway breakdown scenario.',
      'domestic-disturbance': 'Managed domestic disturbance welfare check with appropriate sensitivity. Coordinated police response while ensuring caller safety and following all domestic violence protocols.',
      'fire-emergency': 'Responded to residential fire emergency with urgency and precision. Coordinated multiple emergency services, managed evacuation procedures, and maintained clear communication under pressure.',
      'mental-health-crisis': 'Handled mental health crisis with empathy and professionalism. Conducted thorough risk assessment, provided crisis counseling, and coordinated appropriate mental health response services.'
    };

    return summaries[caseId] || 'Training session completed successfully with appropriate emergency response coordination and professional communication throughout the call.';
  }

  private generateKeyPoints(caseId: string): string[] {
    const keyPointsMap: Record<string, string[]> = {
      'medical-cardiac': [
        'Quickly identified cardiac symptoms',
        'Provided clear CPR guidance',
        'Maintained caller composure effectively',
        'Coordinated timely ALS response',
        'Documented all critical information'
      ],
      'vehicle-accident-minor': [
        'Assessed injury severity promptly',
        'Coordinated appropriate EMS response',
        'Managed traffic safety concerns',
        'Gathered comprehensive incident details'
      ],
      'roadside-breakdown': [
        'Prioritized caller safety',
        'Coordinated efficient towing service',
        'Provided clear safety instructions',
        'Managed traffic hazard risks'
      ],
      'domestic-disturbance': [
        'Conducted sensitive threat assessment',
        'Followed domestic violence protocols',
        'Coordinated appropriate police response',
        'Ensured caller safety throughout'
      ],
      'fire-emergency': [
        'Coordinated multiple emergency services',
        'Managed complex evacuation procedures',
        'Maintained clear communication under pressure',
        'Prioritized scene safety effectively'
      ],
      'mental-health-crisis': [
        'Conducted thorough suicide risk assessment',
        'Provided empathetic crisis counseling',
        'Coordinated mental health services',
        'Followed crisis intervention protocols'
      ]
    };

    return keyPointsMap[caseId] || [
      'Maintained professional communication',
      'Followed appropriate protocols',
      'Coordinated emergency response effectively',
      'Documented incident thoroughly'
    ];
  }

  private generatePerformanceMetrics() {
    // Generate realistic but randomized performance metrics
    const baseScores = {
      communicationScore: 85 + Math.floor(Math.random() * 10),
      empathyScore: 88 + Math.floor(Math.random() * 8),
      clinicalAccuracy: 82 + Math.floor(Math.random() * 12),
      responseTime: 2.1 + Math.random() * 1.5
    };

    return baseScores;
  }

  getPerformanceMetrics() {
    return {
      protocol: 93,
      compassion: 95,
      clarity: 88,
      overall: 92
    };
  }

  getTimelineData() {
    return [
      { time: 0, score: 75, timestamp: '00:00' },
      { time: 15, score: 78, timestamp: '00:15' },
      { time: 30, score: 82, timestamp: '00:30' },
      { time: 45, score: 85, timestamp: '00:45' },
      { time: 60, score: 83, timestamp: '01:00' },
      { time: 75, score: 88, timestamp: '01:15' },
      { time: 90, score: 92, timestamp: '01:30' },
      { time: 105, score: 89, timestamp: '01:45' },
      { time: 120, score: 86, timestamp: '02:00' },
      { time: 135, score: 90, timestamp: '02:15' },
      { time: 150, score: 94, timestamp: '02:30' },
      { time: 165, score: 91, timestamp: '02:45' },
      { time: 180, score: 88, timestamp: '03:00' },
      { time: 195, score: 92, timestamp: '03:15' },
      { time: 210, score: 95, timestamp: '03:30' },
      { time: 225, score: 93, timestamp: '03:45' },
      { time: 240, score: 91, timestamp: '04:00' },
      { time: 255, score: 94, timestamp: '04:15' },
      { time: 272, score: 96, timestamp: '04:32' }
    ];
  }

  getAnnotations() {
    return [
      { time: 45, score: 85, type: 'positive' as const, message: 'Great empathy!', transcriptSection: 1 },
      { time: 120, score: 86, type: 'negative' as const, message: 'Needs improvement', transcriptSection: 3 },
      { time: 180, score: 88, type: 'positive' as const, message: 'Excellent protocol', transcriptSection: 4 },
      { time: 225, score: 93, type: 'neutral' as const, message: 'Protocol reminder', transcriptSection: 5 }
    ];
  }

  getTranscriptEntries() {
    return [
      {
        id: 1,
        timestamp: '00:00',
        speaker: 'agent' as const,
        message: 'Good evening, this is Dr. Sarah Mitchell from CareCraft Emergency Response. I understand you\'re calling about a medical emergency. Can you please tell me what\'s happening?',
        section: 1
      },
      {
        id: 2,
        timestamp: '00:15',
        speaker: 'customer' as const,
        message: 'Hi, yes, my father collapsed in the living room. He\'s conscious but complaining of chest pain and having trouble breathing.',
        section: 1
      },
      {
        id: 3,
        timestamp: '00:45',
        speaker: 'agent' as const,
        message: 'I understand this must be very frightening for you. You\'re doing the right thing by calling. Let me help you through this step by step. First, is your father still conscious and able to speak?',
        highlights: [
          { text: 'I understand this must be very frightening for you', type: 'positive' as const, annotation: 'great empathy!' }
        ],
        section: 1
      },
      {
        id: 4,
        timestamp: '01:00',
        speaker: 'customer' as const,
        message: 'Yes, he\'s awake and talking, but he seems very weak and pale.',
        section: 2
      },
      {
        id: 5,
        timestamp: '01:15',
        speaker: 'agent' as const,
        message: 'That\'s good that he\'s conscious. Now, is he experiencing any difficulty breathing or shortness of breath?',
        highlights: [
          { text: 'is he experiencing any difficulty breathing', type: 'protocol' as const }
        ],
        section: 2
      },
      {
        id: 6,
        timestamp: '01:30',
        speaker: 'customer' as const,
        message: 'Yes, he\'s breathing but it seems labored, and he keeps saying his chest hurts.',
        section: 2
      },
      {
        id: 7,
        timestamp: '02:00',
        speaker: 'agent' as const,
        message: 'I\'m dispatching an ambulance to your location right now. While we wait, I need you to help your father get into a comfortable position. Can you help him sit up if he\'s lying down?',
        highlights: [
          { text: 'I\'m dispatching an ambulance to your location right now', type: 'protocol' as const }
        ],
        section: 3
      },
      {
        id: 8,
        timestamp: '02:30',
        speaker: 'customer' as const,
        message: 'Okay, I\'m helping him sit up. Should I give him anything?',
        section: 3
      },
      {
        id: 9,
        timestamp: '02:45',
        speaker: 'agent' as const,
        message: 'Don\'t give him any medications unless prescribed by a doctor. Does your father take any heart medications regularly?',
        highlights: [
          { text: 'Does your father take any heart medications regularly', type: 'negative' as const, annotation: 'ask earlier' }
        ],
        section: 3
      },
      {
        id: 10,
        timestamp: '03:15',
        speaker: 'customer' as const,
        message: 'Yes, he takes blood pressure medication and something for his heart.',
        section: 4
      },
      {
        id: 11,
        timestamp: '03:30',
        speaker: 'agent' as const,
        message: 'That\'s very helpful information. The ambulance should be arriving in approximately 5-7 minutes. I want you to stay calm and keep talking to your father. How is his color now?',
        highlights: [
          { text: 'That\'s very helpful information', type: 'positive' as const },
          { text: 'I want you to stay calm', type: 'positive' as const, annotation: 'excellent support' }
        ],
        section: 4
      },
      {
        id: 12,
        timestamp: '04:00',
        speaker: 'customer' as const,
        message: 'He still looks pale, but he\'s talking to me. The chest pain seems to be the same.',
        section: 5
      },
      {
        id: 13,
        timestamp: '04:15',
        speaker: 'agent' as const,
        message: 'You\'re doing an excellent job. Keep monitoring his breathing and consciousness. Is the front door unlocked for the paramedics?',
        highlights: [
          { text: 'You\'re doing an excellent job', type: 'positive' as const }
        ],
        section: 5
      },
      {
        id: 14,
        timestamp: '04:32',
        speaker: 'customer' as const,
        message: 'Yes, the door is unlocked. Thank you so much for your help.',
        section: 5
      }
    ];
  }
}

// Export singleton instance
export const demoDataService = DemoDataServiceImpl.getInstance();
export default demoDataService;