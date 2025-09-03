import type { Project } from './types';

export const initialProjects: Project[] = [
  {
    id: 'proj_1',
    name: 'AI-Powered Blog',
    goal: 'Build a Next.js app with a blog, using TailwindCSS for styling and connected to a Firestore database.',
    platform: 'Firebase',
    status: 'Running',
    currentStep: 3,
    totalSteps: 10,
    logs: [
        { id: 'log_1_1', timestamp: new Date(Date.now() - 60000 * 5), type: 'info', message: 'Project "AI-Powered Blog" created.' },
        { id: 'log_1_2', timestamp: new Date(Date.now() - 60000 * 4), type: 'plan', message: 'Step 1: Initialize project repository.' },
        { id: 'log_1_3', timestamp: new Date(Date.now() - 60000 * 3), type: 'plan', message: 'Step 2: Install Next.js and TailwindCSS dependencies.' },
        { id: 'log_1_4', timestamp: new Date(Date.now() - 60000 * 2), type: 'plan', message: 'Step 3: Configure Firebase SDK.' },
        { id: 'log_1_5', timestamp: new Date(Date.now() - 60000 * 1), type: 'action', message: 'Executing action: click', details: { action: 'click', details: { selector: '#create-project-btn' }, reasoning: 'To start a new project, the first step is to click the "Create Project" button.' } },
    ],
    lastUpdated: new Date(Date.now() - 60000 * 1),
  },
  {
    id: 'proj_2',
    name: 'Discord Bot',
    goal: 'Create a simple Discord bot that responds to a !hello command.',
    platform: 'Replit',
    status: 'Paused',
    currentStep: 1,
    totalSteps: 5,
    logs: [
        { id: 'log_2_1', timestamp: new Date(Date.now() - 86400000 * 2), type: 'info', message: 'Project "Discord Bot" created.' },
        { id: 'log_2_2', timestamp: new Date(Date.now() - 86400000 * 1), type: 'info', message: 'Agent paused by user.' },
    ],
    lastUpdated: new Date(Date.now() - 86400000 * 1),
  },
  {
    id: 'proj_3',
    name: 'Portfolio Website',
    goal: 'A personal portfolio website to showcase my projects, built with Vercel.',
    platform: 'Vercel',
    status: 'Completed',
    currentStep: 8,
    totalSteps: 8,
    logs: [
        { id: 'log_3_1', timestamp: new Date(Date.now() - 86400000 * 5), type: 'info', message: 'Project "Portfolio Website" created.' },
        { id: 'log_3_2', timestamp: new Date(Date.now() - 86400000 * 4), type: 'info', message: 'Project automation completed.' },
    ],
    lastUpdated: new Date(Date.now() - 86400000 * 4),
  },
    {
    id: 'proj_4',
    name: 'API Service',
    goal: 'Build and deploy a GraphQL API service on Firebase.',
    platform: 'Firebase',
    status: 'Error',
    currentStep: 4,
    totalSteps: 9,
    logs: [
        { id: 'log_4_1', timestamp: new Date(Date.now() - 86400000 * 6), type: 'info', message: 'Project "API Service" created.' },
         { id: 'log_4_2', timestamp: new Date(Date.now() - 86400000 * 5), type: 'error', message: 'Agent stopped by user.' },
    ],
    lastUpdated: new Date(Date.now() - 86400000 * 5),
  },
];
