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

export interface Project {
  id: string;
  name: string;
  goal: string;
  platform: Platform;
  status: ProjectStatus;
  currentStep: number;
  totalSteps: number;
  logs: LogEntry[];
  lastUpdated: Date;
}
