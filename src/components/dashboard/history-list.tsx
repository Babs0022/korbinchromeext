'use client';

import { useState, useEffect } from 'react';
import type { VibePilotState, ChatSession } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trash2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { VibePilotLogo } from '../VibePilotLogo';

const VIBEPILOT_STATE_KEY = "vibepilot-state";

const createNewSession = (): ChatSession => ({
  id: crypto.randomUUID(),
  name: "New Chat",
  goal: "No goal set. Start by sending a message.",
  platform: 'Firebase',
  status: 'Paused',
  logs: [],
  lastUpdated: new Date(),
});

export function HistoryList() {
  const [appState, setAppState] = useState<VibePilotState | null>(null);
  const [isClient, setIsClient] = useState(false);

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
          });
          setAppState(parsedState);
        } else {
            const newSession = createNewSession();
            setAppState({ sessions: [newSession], activeSessionId: newSession.id });
        }
      } catch (error) {
        console.error("Failed to parse state from localStorage", error);
        const newSession = createNewSession();
        setAppState({ sessions: [newSession], activeSessionId: newSession.id });
      }
    }
  }, [isClient]);

  const handleDeleteChat = (sessionId: string) => {
    setAppState(prevState => {
      if (!prevState) return null;
      const remainingSessions = prevState.sessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length === 0) {
        const newSession = createNewSession();
        return {
          sessions: [newSession],
          activeSessionId: newSession.id,
        };
      }
      const newState = {
        ...prevState,
        sessions: remainingSessions,
        activeSessionId: prevState.activeSessionId === sessionId ? remainingSessions[0].id : prevState.activeSessionId,
      };
      localStorage.setItem(VIBEPILOT_STATE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  if (!isClient || !appState) {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <VibePilotLogo />
        </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {appState.sessions.map(session => (
            <Card key={session.id} className="flex flex-col">
                <CardHeader>
                    <CardTitle className="truncate">{session.name}</CardTitle>
                    <CardDescription>
                        Last updated {formatDistanceToNow(session.lastUpdated, { addSuffix: true })}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        {session.goal}
                    </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                     <Button asChild variant="ghost">
                        <Link href={`/?session=${session.id}`}>
                            <MessageSquare className="mr-2 h-4 w-4" /> Open Chat
                        </Link>
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteChat(session.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        ))}
         {appState.sessions.length === 0 && (
            <div className="text-center text-muted-foreground py-10 col-span-full">
                <p>No chat history yet.</p>
                <Button asChild className="mt-4">
                    <Link href="/">Start a new chat</Link>
                </Button>
            </div>
        )}
    </div>
  );
}
