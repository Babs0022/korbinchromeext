'use client';

import { useState, useEffect, useCallback } from 'react';
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
import type { Project, LogEntry, Platform } from '@/lib/types';
import { NewProjectDialog } from './new-project-dialog';
import { ProjectList } from './project-list';
import { ProjectView } from './project-view';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { planProject } from '@/ai/flows/llm-assisted-project-planning';
import { llmAssistedContextualAction, LLMAssistedContextualActionOutput } from '@/ai/flows/llm-assisted-contextual-action';

export function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isNewProjectOpen, setNewProjectOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{ log: LogEntry; onConfirm: () => void; onCancel: () => void; } | null>(null);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        const storedProjects = localStorage.getItem('vibepilot-projects');
        if (storedProjects) {
          const parsedProjects: Project[] = JSON.parse(storedProjects).map((p: any) => ({
            ...p,
            lastUpdated: new Date(p.lastUpdated),
            logs: p.logs.map((l: any) => ({
              ...l,
              timestamp: new Date(l.timestamp),
            })),
          }));
          setProjects(parsedProjects);
          if (parsedProjects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(parsedProjects[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to parse projects from localStorage", error);
        setProjects([]);
      }
    }
  }, [isClient, selectedProjectId]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('vibepilot-projects', JSON.stringify(projects));
    }
  }, [projects, isClient]);

  const selectedProject = projects.find(p => p.id === selectedProjectId) ?? null;

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, ...updates, lastUpdated: new Date() } : p
      )
    );
  }, []);
  
  const addLogEntry = useCallback((projectId: string, log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setProjects(prevProjects => {
      const projectExists = prevProjects.some(p => p.id === projectId);
      if (!projectExists) return prevProjects;

      const newLog: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        ...log
      };

      return prevProjects.map(p =>
        p.id === projectId ? { ...p, logs: [...p.logs, newLog], lastUpdated: new Date() } : p
      );
    });
  }, []);

  const runAgent = useCallback(async (project: Project) => {
    if (project.status !== 'Running') return;

    addLogEntry(project.id, { type: 'info', message: 'Agent is thinking...' });

    try {
      // In a real scenario, we would pass a real DOM snapshot.
      const domSnapshot = "<body>...</body>";
      
      const result: LLMAssistedContextualActionOutput = await llmAssistedContextualAction({
        domSnapshot,
        projectGoals: project.goal,
        platform: project.platform,
        userId: 'user@vibepilot.ai',
        projectId: project.id,
      });

      const newLog: Omit<LogEntry, 'id' | 'timestamp'> = {
        type: 'action',
        message: `Executing action: ${result.action}`,
        details: {
          action: result.action,
          details: result.actionDetails,
          reasoning: result.reasoning,
        },
      };

      const isRisky = result.action === 'delete' || result.action === 'publish' || result.action === 'deploy';

      if (isRisky) {
        updateProject(project.id, { status: 'Paused' });
        
        setConfirmation({
          log: { ...newLog, id: crypto.randomUUID(), timestamp: new Date() },
          onConfirm: () => {
             addLogEntry(project.id, { type: 'action', message: `User confirmed action: ${result.action}. Executing...`, details: newLog.details });
             updateProject(project.id, { currentStep: project.currentStep + 1, status: 'Running' });
             setConfirmation(null);
          },
          onCancel: () => {
            addLogEntry(project.id, { type: 'info', message: `User cancelled action: ${result.action}.`});
            updateProject(project.id, { status: 'Paused' });
            setConfirmation(null);
            toast({ title: "Action Cancelled", description: `Agent is paused.`, variant: 'destructive'});
          }
        });

      } else {
        addLogEntry(project.id, newLog);
        const nextStep = project.currentStep + 1;
        if (nextStep >= project.totalSteps) {
            updateProject(project.id, { status: 'Completed', currentStep: project.totalSteps });
            addLogEntry(project.id, { type: 'info', message: 'Project automation completed.' });
            toast({ title: "Project Completed", description: `"${project.name}" is now complete.` });
        } else {
            updateProject(project.id, { currentStep: nextStep });
        }
      }
    } catch (error) {
      console.error('Agent action failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      addLogEntry(project.id, { type: 'error', message: `Agent failed: ${errorMessage}` });
      updateProject(project.id, { status: 'Error' });
      toast({ title: "Agent Error", description: "The agent encountered an error.", variant: 'destructive' });
    }
  }, [addLogEntry, updateProject, toast]);
  
  // Agent simulation loop
  useEffect(() => {
    if (selectedProject?.status === 'Running') {
      runAgent(selectedProject);
    }
  }, [selectedProject, runAgent]);

  const handleCreateProject = async (data: { name: string; goal: string; platform: Platform }) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: data.name,
      goal: data.goal,
      platform: data.platform,
      status: 'Planning',
      currentStep: 0,
      totalSteps: 0, // Will be updated after planning
      logs: [],
      lastUpdated: new Date(),
    };

    setProjects(prev => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
    setNewProjectOpen(false);
    
    addLogEntry(newProject.id, { type: 'info', message: `Planning project "${newProject.name}"...` });

    try {
      const plan = await planProject({
        platform: data.platform,
        goal: data.goal,
      });

      plan.steps.forEach((step, index) => {
        addLogEntry(newProject.id, {type: 'plan', message: `Step ${index + 1}: ${step}`});
      });
      
      updateProject(newProject.id, { 
        status: 'Paused', // Start in paused state
        totalSteps: plan.steps.length 
      });

      toast({ title: "Planning Complete", description: `Project "${newProject.name}" is ready. Start the agent to begin.`});
    } catch(e) {
        const error = e as Error;
        addLogEntry(newProject.id, {type: 'error', message: `Planning failed: ${error.message}`});
        updateProject(newProject.id, { status: 'Error' });
        toast({ title: "Planning Failed", description: error.message, variant: 'destructive'});
    }
  };
  
  const handleToggleAgent = (project: Project) => {
    if (project.status === 'Running') {
      updateProject(project.id, { status: 'Paused' });
      addLogEntry(project.id, {type: 'info', message: 'Agent paused by user.'});
      toast({ title: 'Agent Paused', description: `Work on "${project.name}" has been paused.`});
    } else if (project.status === 'Paused' || project.status === 'Planning') {
      updateProject(project.id, { status: 'Running' });
      addLogEntry(project.id, {type: 'info', message: 'Agent started by user.'});
      toast({ title: 'Agent Started', description: `Now working on "${project.name}".`});
    }
  };

  const handleStopAgent = (project: Project) => {
    updateProject(project.id, { status: 'Error' });
    addLogEntry(project.id, {type: 'error', message: 'Agent stopped by user.'});
    toast({ title: 'Agent Stopped', description: `Agent for "${project.name}" has been stopped.`, variant: 'destructive'});
  };

  if (!isClient) {
    return null; // or a loading skeleton
  }

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
