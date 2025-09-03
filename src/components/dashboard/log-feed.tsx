'use client';

import { FileCode, Terminal, Info, AlertTriangle, ShieldQuestion, User, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type LogEntry } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const logIcons = {
  plan: <FileCode className="h-4 w-4 text-muted-foreground" />,
  action: <Terminal className="h-4 w-4 text-primary" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
  error: <AlertTriangle className="h-4 w-4 text-destructive" />,
  confirmation: <ShieldQuestion className="h-4 w-4 text-accent" />,
  user: <User className="h-4 w-4 text-green-500" />,
};


function LogItem({ log }: { log: LogEntry }) {
  const [isOpen, setIsOpen] = useState(false);

  const hasDetails = log.details?.action && log.details.action !== 'none';
  
  return (
    <div className="flex items-start gap-4">
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
        {hasDetails && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-2">
            <CollapsibleContent className="mt-1 text-xs text-muted-foreground p-3 bg-muted rounded-md font-code space-y-1">
                <p><strong>Action:</strong> {log.details.action}</p>
                <p><strong>Details:</strong> <span className="font-code">{JSON.stringify(log.details.details)}</span></p>
                <p className="mt-1"><strong>Reasoning:</strong> <em>{log.details.reasoning}</em></p>
            </CollapsibleContent>
             <CollapsibleTrigger asChild>
                <button className="text-xs text-muted-foreground flex items-center gap-1 mt-1 hover:text-foreground">
                  <ChevronRight className={cn("h-3 w-3 transition-transform", isOpen && "rotate-90")} />
                  {isOpen ? 'Hide' : 'Show'} Details
                </button>
            </CollapsibleTrigger>
          </Collapsible>
        )}
      </div>
    </div>
  )
}


export function LogFeed({ logs }: { logs: LogEntry[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <ScrollArea className="h-full flex-grow" viewportRef={viewportRef}>
      <div className="p-4 space-y-4">
        {logs.map(log => (
          <LogItem key={log.id} log={log} />
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
