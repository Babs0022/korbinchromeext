
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Send, Power, PowerOff, AlertTriangle } from 'lucide-react';
import { VibePilotLogo } from '@/components/VibePilotLogo';
import type { Project, LogEntry, Platform } from '@/lib/types';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { planProject } from '@/ai/flows/llm-assisted-project-planning';
import { llmAssistedContextualAction, LLMAssistedContextualActionOutput } from '@/ai/flows/llm-assisted-contextual-action';
import { LogFeed } from './log-feed';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

const DEFAULT_PROJECT_ID = "vibepilot-session";

function sendMessageToContentScript(tabId: number, message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, response => {
      if (chrome.runtime.lastError) {
        return reject(new Error(`Message sending failed: ${chrome.runtime.lastError.message}`));
      }
      if (response?.error) {
        return reject(new Error(response.error));
      }
      resolve(response);
    });
  });
}

async function getDomSnapshot(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof chrome?.tabs?.query !== 'function') {
      console.warn('Not in a chrome extension context. Returning placeholder DOM.');
      return resolve('<body><p>This is a placeholder DOM. Run in extension context to see real page content.</p></body>');
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      if (tabs.length === 0) {
        return reject(new Error('No active tab found.'));
      }
      const activeTab = tabs[0];
      if (!activeTab.id) {
        return reject(new Error('Active tab has no ID.'));
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          files: ['content/index.js'],
        },
        async () => {
          if (chrome.runtime.lastError) {
             // This error often means the script was already injected, which is fine.
             console.log(`Script injection info: ${chrome.runtime.lastError.message}`);
          }
          try {
            const response = await sendMessageToContentScript(activeTab.id!, { action: "get_dom" });
            if (response && response.dom) {
              resolve(response.dom);
            } else {
              reject(new Error('Failed to get DOM from content script. The content script might not be responding.'));
            }
          } catch(e) {
            reject(e);
          }
        }
      );
    });
  });
}

async function executeActionInTab(action: string, details: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof chrome?.tabs?.query !== 'function') {
      console.warn('Not in a chrome extension context. Action not executed.');
      return resolve({ status: 'success', message: `Simulated ${action} action.` });
    }

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      if (tabs.length === 0) {
        return reject(new Error('No active tab found to execute action.'));
      }
      const activeTab = tabs[0];
      if (!activeTab.id) {
        return reject(new Error('Active tab has no ID.'));
      }
      
      try {
        const response = await sendMessageToContentScript(activeTab.id, {
          action: 'execute_action',
          payload: {
            action,
            details,
          },
        });
        resolve(response);
      } catch (e) {
        reject(e);
      }
    });
  });
}


export function VibePilotUI() {
  const [project, setProject] = useState<Project | null>(null);
  const [confirmation, setConfirmation] = useState<{ log: LogEntry; onConfirm: () => void; onCancel: () => void; } | null>(null);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        const storedProject = localStorage.getItem(DEFAULT_PROJECT_ID);
        if (storedProject) {
          const parsedProject: Project = JSON.parse(storedProject);
          parsedProject.lastUpdated = new Date(parsedProject.lastUpdated);
          parsedProject.logs = parsedProject.logs.map((l: any) => ({
            ...l,
            timestamp: new Date(l.timestamp),
          }));
          setProject(parsedProject);
        } else {
          // Create a default project if none exists
           const newProject: Project = {
              id: DEFAULT_PROJECT_ID,
              name: "VibePilot Session",
              goal: "No goal set. Start by sending a message.",
              platform: 'Firebase',
              status: 'Paused',
              currentStep: 0,
              totalSteps: 0,
              logs: [],
              lastUpdated: new Date(),
           };
           setProject(newProject);
        }
      } catch (error) {
        console.error("Failed to parse project from localStorage", error);
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient && project) {
      localStorage.setItem(DEFAULT_PROJECT_ID, JSON.stringify(project));
    }
  }, [project, isClient]);

  const updateProject = useCallback((updates: Partial<Project>) => {
    setProject(prevProject => {
        if (!prevProject) return null;
        return { ...prevProject, ...updates, lastUpdated: new Date() };
    });
  }, []);
  
  const addLogEntry = useCallback((log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setProject(prevProject => {
      if (!prevProject) return prevProject;

      const newLog: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        ...log
      };
      
      return { ...prevProject, logs: [...prevProject.logs, newLog], lastUpdated: new Date() };
    });
  }, []);
  
  const handleSendMessage = () => {
    if (!inputValue.trim() || !project) return;
    
    const message = inputValue.trim();
    addLogEntry({type: 'user', message: message});
    setInputValue('');

    if (project.logs.length === 1) { // The first message is now the user's
        updateProject({ goal: message, status: 'Running' });
        addLogEntry({type: 'info', message: "Goal set. The agent will now start working towards it."});
    } else {
        // Subsequent messages can be instructions too, maybe trigger the agent
        if (project.status !== 'Running') {
          updateProject({ status: 'Running' });
          addLogEntry({type: 'info', message: 'Agent activated by new instruction.'});
        }
    }
  }

  const runAgent = useCallback(async (project: Project) => {
    if (project.status !== 'Running') return;

    addLogEntry({ type: 'info', message: 'Agent is thinking...' });

    try {
      addLogEntry({ type: 'info', message: 'Capturing page content...' });
      const domSnapshot = await getDomSnapshot();
      addLogEntry({ type: 'info', message: 'Page content captured. Analyzing...' });
      
      const result: LLMAssistedContextualActionOutput = await llmAssistedContextualAction({
        domSnapshot,
        projectGoals: project.goal,
        platform: project.platform,
        userId: 'user@vibepilot.ai',
        projectId: project.id,
      });

      const newLog: Omit<LogEntry, 'id' | 'timestamp'> = {
        type: 'action',
        message: `Next Action: ${result.action}`,
        details: {
          action: result.action,
          details: result.actionDetails,
          reasoning: result.reasoning,
        },
      };

      const isRisky = result.action === 'delete' || result.action === 'publish' || result.action === 'deploy';

      if (isRisky) {
        updateProject({ status: 'Paused' });
        
        setConfirmation({
          log: { ...newLog, id: crypto.randomUUID(), timestamp: new Date() },
          onConfirm: async () => {
             addLogEntry({ type: 'action', message: `User confirmed action: ${result.action}. Executing...`, details: newLog.details });
             try {
                await executeActionInTab(result.action, result.actionDetails);
                addLogEntry({type: 'info', message: `Action "${result.action}" executed successfully.`});
                updateProject({ status: 'Running' });
             } catch (e: any) {
                addLogEntry({type: 'error', message: `Execution failed: ${e.message}`});
                updateProject({ status: 'Error' });
             }
             setConfirmation(null);
          },
          onCancel: () => {
            addLogEntry({ type: 'info', message: `User cancelled action: ${result.action}.`});
            updateProject({ status: 'Paused' });
            setConfirmation(null);
            toast({ title: "Action Cancelled", description: `Agent is paused.`, variant: 'destructive'});
          }
        });

      } else {
        addLogEntry(newLog);
        try {
          addLogEntry({ type: 'info', message: `Executing action: ${result.action}` });
          await executeActionInTab(result.action, result.actionDetails);
          addLogEntry({ type: 'info', message: `Action "${result.action}" executed successfully.` });
        } catch (e: any) {
          addLogEntry({type: 'error', message: `Execution failed: ${e.message}`});
          updateProject({ status: 'Error' });
        }
      }
    } catch (error) {
      console.error('Agent action failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      addLogEntry({ type: 'error', message: `Agent failed: ${errorMessage}` });
      updateProject({ status: 'Error' });
      toast({ title: "Agent Error", description: "The agent encountered an error.", variant: 'destructive' });
    }
  }, [addLogEntry, updateProject, toast]);
  
  useEffect(() => {
    if (project?.status === 'Running') {
      const timer = setTimeout(() => runAgent(project), 5000); // Wait 5s between actions
      return () => clearTimeout(timer);
    }
  }, [project, runAgent]);
  
  const handleToggleAgent = () => {
      if (!project) return;
    if (project.status === 'Running') {
      updateProject({ status: 'Paused' });
      addLogEntry({type: 'info', message: 'Agent paused by user.'});
      toast({ title: 'Agent Paused'});
    } else if (project.status === 'Paused' || project.status === 'Error') {
      updateProject({ status: 'Running' });
      addLogEntry({type: 'info', message: 'Agent started by user.'});
      toast({ title: 'Agent Resumed'});
    }
  };

  if (!isClient || !project) {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <VibePilotLogo />
        </div>
    );
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  }

  const statusConfig = {
      Running: { text: "Running", Icon: Power, color: "text-green-500", badge: "default" },
      Paused: { text: "Paused", Icon: PowerOff, color: "text-gray-500", badge: "secondary" },
      Error: { text: "Error", Icon: AlertTriangle, color: "text-destructive", badge: "destructive" },
      Completed: { text: "Completed", Icon: PowerOff, color: "text-gray-500", badge: "secondary" },
      Planning: { text: "Planning", Icon: Power, color: "text-blue-500", badge: "default" }
  }
  const currentStatus = statusConfig[project.status] || statusConfig.Paused;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-3 border-b">
        <VibePilotLogo />
        <div className="flex items-center gap-3">
             <Badge variant={currentStatus.badge as any}>{currentStatus.text}</Badge>
            <Button variant="ghost" size="icon" onClick={handleToggleAgent} className={currentStatus.color}>
                <currentStatus.Icon className="h-5 w-5" />
            </Button>
        </div>
      </header>
      
      <div className="flex-grow min-h-0">
        <LogFeed logs={project.logs} />
      </div>

      <Separator />

      <div className="p-4 bg-background">
        <div className="relative">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell the agent what to do..."
              className="pr-12 resize-none"
              rows={1}
            />
            <Button 
                type="submit" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
            >
                <Send className="h-4 w-4" />
            </Button>
        </div>
      </div>

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
    </div>
  );
}

    