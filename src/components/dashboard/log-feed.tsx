'use client';

import { FileCode, Terminal, Info, AlertTriangle, ShieldQuestion, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type LogEntry } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useRef } from 'react';

const logIcons = {
  plan: <FileCode className="h-4 w-4 text-muted-foreground" />,
  action: <Terminal className="h-4 w-4 text-primary" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
  error: <AlertTriangle className="h-4 w-4 text-destructive" />,
  confirmation: <ShieldQuestion className="h-4 w-4 text-accent" />,
  user: <User className="h-4 w-4 text-green-500" />,
};

export function LogFeed({ logs }: { logs: LogEntry[] }) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <ScrollArea className="h-full flex-grow" viewportRef={scrollAreaRef}>
      <div className="p-4 space-y-4">
        {logs.map(log => (
          <div key={log.id} className="flex items-start gap-4">
            <div className="mt-1">{logIcons[log.type]}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p
                  className={cn(
                    'text-sm',
                    log.type === 'error' && 'text-destructive font-semibold',
                    log.type === 'confirmation' && 'text-accent-foreground dark:text-yellow-400 font-semibold',
                    log.type === 'user' && 'font-semibold',
                  )}
                >
                  {log.message}
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap pl-4">
                  {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                </span>
              </div>
              {log.details?.action && (
                <div className="mt-1 text-xs text-muted-foreground p-3 bg-muted rounded-md font-code">
                  <p><strong>Action:</strong> {log.details.action}</p>
                  <p><strong>Details:</strong> <span className="font-code">{JSON.stringify(log.details.details)}</span></p>
                  <p className="mt-1"><strong>Reasoning:</strong> <em>{log.details.reasoning}</em></p>
                </div>
              )}
            </div>
          </div>
        ))}
         {logs.length === 0 && (
          <div className="text-center text-muted-foreground py-10">
            <p>Send a message to start the agent.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
