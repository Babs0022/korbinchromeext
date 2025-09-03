'use client';

import { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VibePilotLogo } from '@/components/VibePilotLogo';
import type { Project, LogEntry } from '@/lib/types';
import { initialProjects } from '@/lib/mock-data';
import { NewProjectDialog } from './new-project-dialog';
import { ProjectList } from './project-list';
import { ProjectView } from './project-view';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const agentActions = [
  { action: 'click', details: { selector: '#create-project-btn' }, reasoning: 'To start a new project, the first step is to click the "Create Project" button.' },
  { action: 'type', details: { selector: '#project-name-input', text: 'My Awesome App' }, reasoning: 'Entering the project name into the designated input field.' },
  { action: 'select', details: { selector: '#framework-select', value: 'nextjs' }, reasoning: 'Selecting Next.js as the framework for this project.' },
  { action: 'click', details: { selector: '[data-cy="deploy-button"]' }, reasoning: 'Deploying the initial version of the application.' },
  { action: 'navigate', details: { url: '/dashboard/settings' }, reasoning: 'Navigating to the settings page to configure environment variables.' },
  { action: 'type', details: { selector: '#env-var-key', text: 'API_KEY' }, reasoning: 'Adding a new environment variable for an API key.' },
  { action: 'delete', details: { selector: '.file[name="old-styles.css"]' }, reasoning: 'Removing an old, unused stylesheet.' },
  { action: 'publish', details: { }, reasoning: 'Publishing the latest changes to production.' },
];

export function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isNewProjectOpen, setNewProjectOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{ log: LogEntry; onConfirm: () => void; onCancel: () => void; } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching data
    setProjects(initialProjects);
    if (initialProjects.length > 0) {
      setSelectedProjectId(initialProjects[0].id);
    }
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId) ?? null;

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, ...updates, lastUpdated: new Date() } : p
      )
    );
  };
  
  const addLogEntry = (projectId: string, log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...log
    };
    updateProject(projectId, { logs: [...(projects.find(p=>p.id === projectId)?.logs ?? []), newLog] });
  };
  
  // Agent simulation loop
  useEffect(() => {
    if (selectedProject?.status !== 'Running') {
      return;
    }

    const agentInterval = setInterval(() => {
      const nextStep = selectedProject.currentStep + 1;
      if (nextStep > selectedProject.totalSteps) {
        updateProject(selectedProject.id, { status: 'Completed' });
        addLogEntry(selectedProject.id, { type: 'info', message: 'Project automation completed.' });
        toast({ title: "Project Completed", description: `"${selectedProject.name}" is now complete.` });
        return;
      }
      
      const randomAction = agentActions[Math.floor(Math.random() * agentActions.length)];
      const newLog: LogEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          type: 'action',
          message: `Executing action: ${randomAction.action}`,
          details: randomAction,
      };

      const isRisky = randomAction.action === 'delete' || randomAction.action === 'publish';

      if (isRisky) {
        updateProject(selectedProject.id, { status: 'Paused' });
        newLog.type = 'confirmation';
        newLog.message = `Awaiting confirmation for risky action: ${randomAction.action}`;
        
        setConfirmation({
          log: newLog,
          onConfirm: () => {
             addLogEntry(selectedProject.id, { type: 'action', message: `User confirmed action: ${randomAction.action}. Executing...`, details: randomAction });
             updateProject(selectedProject.id, { currentStep: nextStep, status: 'Running' });
             setConfirmation(null);
          },
          onCancel: () => {
            addLogEntry(selectedProject.id, { type: 'info', message: `User cancelled action: ${randomAction.action}.`});
            updateProject(selectedProject.id, { status: 'Paused' });
            setConfirmation(null);
            toast({ title: "Action Cancelled", description: `Agent is paused.`, variant: 'destructive'});
          }
        });

      } else {
        addLogEntry(selectedProject.id, newLog);
        updateProject(selectedProject.id, { currentStep: nextStep });
      }

    }, 2500);

    return () => clearInterval(agentInterval);
  }, [selectedProject, projects]);

  const handleCreateProject = (data: { name: string; goal: string; platform: 'Firebase' | 'Replit' | 'Vercel' }) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: data.name,
      goal: data.goal,
      platform: data.platform,
      status: 'Planning',
      currentStep: 0,
      totalSteps: 10, // Mock total steps
      logs: [],
      lastUpdated: new Date(),
    };

    addLogEntry(newProject.id, { type: 'info', message: `Project "${newProject.name}" created.` });
    
    // Simulate planning phase from AI
    setTimeout(() => {
        addLogEntry(newProject.id, {type: 'plan', message: 'Step 1: Initialize project repository.'});
    }, 500);
    setTimeout(() => {
        addLogEntry(newProject.id, {type: 'plan', message: 'Step 2: Install dependencies.'});
        updateProject(newProject.id, { status: 'Running' });
        toast({ title: "Agent Started", description: `Now working on "${newProject.name}".`});
    }, 1500);
    
    setProjects(prev => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
    setNewProjectOpen(false);
  };
  
  const handleToggleAgent = (project: Project) => {
    if (project.status === 'Running') {
      updateProject(project.id, { status: 'Paused' });
      addLogEntry(project.id, {type: 'info', message: 'Agent paused by user.'});
      toast({ title: 'Agent Paused', description: `Work on "${project.name}" has been paused.`});
    } else if (project.status === 'Paused' || project.status === 'Planning') {
      updateProject(project.id, { status: 'Running' });
      addLogEntry(project.id, {type: 'info', message: 'Agent resumed by user.'});
      toast({ title: 'Agent Resumed', description: `Resuming work on "${project.name}".`});
    }
  };

  const handleStopAgent = (project: Project) => {
    updateProject(project.id, { status: 'Error' });
    addLogEntry(project.id, {type: 'error', message: 'Agent stopped by user.'});
    toast({ title: 'Agent Stopped', description: `Agent for "${project.name}" has been stopped.`, variant: 'destructive'});
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar className="flex flex-col">
          <SidebarHeader>
            <VibePilotLogo />
          </SidebarHeader>
          <SidebarContent>
            <Button className="w-full" onClick={() => setNewProjectOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </Button>
            <ProjectList
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
            />
          </SidebarContent>
          <Separator />
          <SidebarFooter>
            <div className="flex items-center gap-3 p-2">
              <Avatar>
                <AvatarImage src="https://picsum.photos/100/100" data-ai-hint="person avatar" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">User</span>
                <span className="text-xs text-muted-foreground">user@vibepilot.ai</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          {selectedProject ? (
            <ProjectView
              key={selectedProject.id} // Re-mount component on project change
              project={selectedProject}
              onToggleAgent={handleToggleAgent}
              onStopAgent={handleStopAgent}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <VibePilotLogo />
                <p className="mt-4 text-muted-foreground">Select a project or create a new one to begin.</p>
              </div>
            </div>
          )}
        </SidebarInset>
      </div>
      <NewProjectDialog
        isOpen={isNewProjectOpen}
        onOpenChange={setNewProjectOpen}
        onSubmit={handleCreateProject}
      />
      {confirmation && (
        <AlertDialog open={!!confirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmation Required</AlertDialogTitle>
              <AlertDialogDescription>
                The agent wants to perform a potentially irreversible action: <strong className="text-destructive">{confirmation.log.details?.action}</strong>.
                <br/>
                Reasoning: <em>{confirmation.log.details?.reasoning}</em>
                <br/><br/>
                Do you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={confirmation.onCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmation.onConfirm} className="bg-destructive hover:bg-destructive/90">Proceed</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </SidebarProvider>
  );
}
