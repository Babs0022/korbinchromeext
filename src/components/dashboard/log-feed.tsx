'use client';

import { FileCode, Terminal, Info, AlertTriangle, ShieldQuestion, User, ChevronRight, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type LogEntry } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { VibePilotAgentIcon } from '../VibePilotLogo';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


function LogItem({ log }: { log: LogEntry }) {
  const [isOpen, setIsOpen] = useState(false);
  const isUser = log.type === 'user';
  const hasDetails = log.details?.action && log.details.action !== 'none';

  return (
    <div className={cn("flex items-start gap-3", isUser && "justify-end")}>
       {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <VibePilotAgentIcon className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn("max-w-md rounded-lg p-3", isUser ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
        <p className="text-sm">{log.message}</p>
        <span className={cn("text-xs opacity-70 mt-1 block", isUser ? "text-right" : "text-left")}>
            {formatDistanceToNow(log.timestamp, { addSuffix: true })}
        </span>
         {hasDetails && log.details && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-2">
            <CollapsibleContent className="mt-2 text-xs p-3 bg-background/50 rounded-md font-code space-y-1">
                <p><strong>Action:</strong> {log.details.action}</p>
                <p><strong>Selector:</strong> <span className="font-code">{JSON.stringify(log.details.details?.selector)}</span></p>
                <p className="mt-1"><strong>Reasoning:</strong> <em>{log.details.reasoning}</em></p>
            </CollapsibleContent>
             <CollapsibleTrigger asChild>
                <button className="text-xs flex items-center gap-1 mt-2 hover:underline">
                  <ChevronRight className={cn("h-3 w-3 transition-transform", isOpen && "rotate-90")} />
                  {isOpen ? 'Hide' : 'Show'} technical details
                </button>
            </CollapsibleTrigger>
          </Collapsible>
        )}
      </div>
      {isUser && (
         <Avatar className="h-8 w-8">
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
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
      <div className="p-4 space-y-6">
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
