'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Send, Power, PowerOff, AlertTriangle, PanelLeft, History, PlusCircle } from 'lucide-react';
import { VibePilotLogo } from '@/components/VibePilotLogo';
import type { ChatSession, VibePilotState, LogEntry, Platform } from '@/lib/types';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { llmAssistedContextualAction, LLMAssistedContextualActionOutput } from '@/ai/flows/llm-assisted-contextual-action';
import { generateChatName } from '@/ai/flows/llm-generate-chat-name';
import { LogFeed } from './log-feed';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


const VIBEPILOT_STATE_KEY = "vibepilot-state";

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
          func: () => document.documentElement.outerHTML,
        },
        (results) => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          if (results && results[0] && results[0].result) {
            resolve(results[0].result as string);
          } else {
            reject(new Error('Failed to get DOM from content script.'));
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

const createNewSession = (): ChatSession => ({
  id: crypto.randomUUID(),
  name: "New Chat",
  goal: "No goal set. Start by sending a message.",
  platform: 'Firebase',
  status: 'Paused',
  logs: [],
  lastUpdated: new Date(),
});


export function VibePilotUI({ activeSessionIdFromURL }: { activeSessionIdFromURL: string | null }) {
  const [appState, setAppState] = useState<VibePilotState | null>(null);
  const [confirmation, setConfirmation] = useState<{ log: LogEntry; onConfirm: () => void; onCancel: () => void; } | null>(null);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const activeSessionId = activeSessionIdFromURL || appState?.activeSessionId;
  const activeSession = appState?.sessions.find(s => s.id === activeSessionId) || null;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        const storedState = localStorage.getItem(VIBEPILOT_STATE_KEY);
        if (storedState) {
          const parsedState: VibePilotState = JSON.parse(storedState);
          parsedState.sessions.forEach(session => {
            session.lastUpdated = new Date(session.lastUpdated);
            session.logs.forEach(log => {
              log.timestamp = new Date(log.timestamp);
            });
          });

          const sessionIdToUse = activeSessionIdFromURL || parsedState.activeSessionId;
          const sessionExists = parsedState.sessions.some(s => s.id === sessionIdToUse);

          if (sessionExists) {
             setAppState({...parsedState, activeSessionId: sessionIdToUse});
          } else {
             const newSession = createNewSession();
             const newState = { sessions: [...parsedState.sessions, newSession], activeSessionId: newSession.id };
             setAppState(newState);
             router.replace(`/?session=${newSession.id}`);
          }

        } else {
          const newSession = createNewSession();
          setAppState({
            sessions: [newSession],
            activeSessionId: newSession.id,
          });
          router.replace(`/?session=${newSession.id}`);
        }
      } catch (error) {
        console.error("Failed to parse state from localStorage", error);
        const newSession = createNewSession();
        setAppState({
          sessions: [newSession],
          activeSessionId: newSession.id,
        });
        router.replace(`/?session=${newSession.id}`);
      }
    }
  }, [isClient, activeSessionIdFromURL, router]);

  useEffect(() => {
    if (isClient && appState) {
      localStorage.setItem(VIBEPILOT_STATE_KEY, JSON.stringify(appState));
    }
  }, [appState, isClient]);

  const updateSession = useCallback((sessionId: string, updates: Partial<ChatSession>) => {
    setAppState(prevState => {
      if (!prevState) return null;
      return {
        ...prevState,
        sessions: prevState.sessions.map(session =>
          session.id === sessionId ? { ...session, ...updates, lastUpdated: new Date() } : session
        ),
      };
    });
  }, []);
  
  const addLogEntry = useCallback((sessionId: string, log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setAppState(prevState => {
      if (!prevState) return prevState;
      
      const newLog: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        ...log
      };
      
      return {
        ...prevState,
        sessions: prevState.sessions.map(session => 
          session.id === sessionId 
            ? { ...session, logs: [...session.logs, newLog], lastUpdated: new Date() }
            : session
        )
      };
    });
  }, []);
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeSession) return;

    const message = inputValue.trim();
    const isFirstMessage = activeSession.logs.length === 0;

    addLogEntry(activeSession.id, { type: 'user', message: message });
    setInputValue('');

    const newGoal = isFirstMessage ? message : `${activeSession.goal}\n\nUser instruction: ${message}`;
    updateSession(activeSession.id, { goal: newGoal });

    if (isFirstMessage) {
        try {
            const { name } = await generateChatName({ message });
            updateSession(activeSession.id, { name });
        } catch (error) {
            console.error("Failed to generate chat name:", error);
            // Fallback to a generic name or the start of the message
            const fallbackName = message.substring(0, 30) + (message.length > 30 ? '...' : '');
            updateSession(activeSession.id, { name: fallbackName });
        }
    }

    if (activeSession.status !== 'Running') {
        updateSession(activeSession.id, { status: 'Running' });
        addLogEntry(activeSession.id, { type: 'info', message: 'Agent activated by new instruction.' });
    }
};

  const runAgent = useCallback(async (session: ChatSession) => {
    if (session.status !== 'Running') return;

    addLogEntry(session.id, { type: 'info', message: 'Agent is thinking...' });

    try {
      addLogEntry(session.id, { type: 'info', message: 'Capturing page content...' });
      const domSnapshot = await getDomSnapshot();
      addLogEntry(session.id, { type: 'info', message: 'Page content captured. Analyzing...' });
      
      const result: LLMAssistedContextualActionOutput = await llmAssistedContextualAction({
        domSnapshot,
        projectGoals: session.goal,
        platform: session.platform,
        userId: 'user@vibepilot.ai',
        projectId: session.id,
      });

      const newLog: Omit<LogEntry, 'id' | 'timestamp'> = {
        type: 'action',
        message: result.response,
        details: {
          action: result.action,
          details: result.actionDetails,
          reasoning: result.reasoning,
        },
      };
      
      if (result.action === 'none') {
        addLogEntry(session.id, newLog);
        updateSession(session.id, { status: 'Paused' });
        return;
      }

      const isRisky = result.action === 'delete' || result.action === 'publish' || result.action === 'deploy';

      if (isRisky) {
        updateSession(session.id, { status: 'Paused' });
        
        setConfirmation({
          log: { ...newLog, id: crypto.randomUUID(), timestamp: new Date() },
          onConfirm: async () => {
             addLogEntry(session.id, { type: 'action', message: `User confirmed action: ${result.action}. Executing...`, details: newLog.details });
             try {
                await executeActionInTab(result.action, result.actionDetails);
                addLogEntry(session.id, {type: 'info', message: `Action "${result.action}" executed successfully.`});
                updateSession(session.id, { status: 'Running' });
             } catch (e: any) {
                addLogEntry(session.id, {type: 'error', message: `Execution failed: ${e.message}`});
                updateSession(session.id, { status: 'Error' });
             }
             setConfirmation(null);
          },
          onCancel: () => {
            addLogEntry(session.id, { type: 'info', message: `User cancelled action: ${result.action}.`});
            updateSession(session.id, { status: 'Paused' });
            setConfirmation(null);
            toast({ title: "Action Cancelled", description: `Agent is paused.`, variant: 'destructive'});
          }
        });

      } else {
        addLogEntry(session.id, newLog);
        try {
          addLogEntry(session.id, { type: 'info', message: `Executing action: ${result.action}` });
          await executeActionInTab(result.action, result.actionDetails);
          addLogEntry(session.id, { type: 'info', message: `Action "${result.action}" executed successfully.` });
        } catch (e: any) {
          addLogEntry(session.id, {type: 'error', message: `Execution failed: ${e.message}`});
          updateSession(session.id, { status: 'Error' });
        }
      }
    } catch (error) {
      console.error('Agent action failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      addLogEntry(session.id, { type: 'error', message: `Agent failed: ${errorMessage}` });
      updateSession(session.id, { status: 'Error' });
      toast({ title: "Agent Error", description: "The agent encountered an error.", variant: 'destructive' });
    }
  }, [addLogEntry, updateSession, toast]);
  
  useEffect(() => {
    if (activeSession?.status === 'Running') {
      const timer = setTimeout(() => runAgent(activeSession), 5000); // Wait 5s between actions
      return () => clearTimeout(timer);
    }
  }, [activeSession, runAgent]);
  
  const handleToggleAgent = () => {
    if (!activeSession) return;
    if (activeSession.status === 'Running') {
      updateSession(activeSession.id, { status: 'Paused' });
      addLogEntry(activeSession.id, {type: 'info', message: 'Agent paused by user.'});
      toast({ title: 'Agent Paused'});
    } else if (activeSession.status === 'Paused' || activeSession.status === 'Error') {
      updateSession(activeSession.id, { status: 'Running' });
      addLogEntry(activeSession.id, {type: 'info', message: 'Agent started by user.'});
      toast({ title: 'Agent Resumed'});
    }
  };

  const handleNewChat = () => {
    const newSession = createNewSession();
    setAppState(prevState => {
        const newState = {
            ...prevState!,
            sessions: [newSession, ...prevState!.sessions],
            activeSessionId: newSession.id,
        };
        return newState;
    });
    router.push(`/?session=${newSession.id}`);
  };


  if (!isClient || !appState || !activeSession) {
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
  const currentStatus = statusConfig[activeSession.status] || statusConfig.Paused;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-3 border-b">
        <VibePilotLogo />
        <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/history">
                <History className="mr-2 h-4 w-4" />
                History
              </Link>
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleNewChat}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Chat
            </Button>
            
            <Separator orientation="vertical" className="h-6" />

            <Badge variant={currentStatus.badge as any}>{currentStatus.text}</Badge>
            <Button variant="ghost" size="icon" onClick={handleToggleAgent} className={currentStatus.color}>
                <currentStatus.Icon className="h-5 w-5" />
            </Button>
        </div>
      </header>
      
      <div className="flex-grow min-h-0">
        <LogFeed logs={activeSession.logs} />
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
