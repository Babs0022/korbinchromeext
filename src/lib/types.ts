export type Platform = 'Firebase' | 'Replit' | 'Vercel';

export type ProjectStatus = 'Planning' | 'Running' | 'Paused' | 'Completed' | 'Error';

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'plan' | 'action' | 'info' | 'error' | 'confirmation' | 'user';
  message: string;
  details?: {
    action?: string;
    reasoning?: string;
    [key: string]: any;
  };
}

export interface ChatSession {
  id: string;
  name: string;
  goal: string;
  platform: Platform;
  status: ProjectStatus;
  logs: LogEntry[];
  lastUpdated: Date;
}

export interface VibePilotState {
  sessions: ChatSession[];
  activeSessionId: string;
}
