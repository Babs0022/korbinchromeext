'use client';

import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import type { ChatSession } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ChatHistoryProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

export function ChatHistory({ sessions, activeSessionId, onNewChat, onSelectChat, onDeleteChat }: ChatHistoryProps) {
  return (
    <div className="flex flex-col h-full">
      <SidebarHeader>
        <Button onClick={onNewChat} className="w-full">
          <Plus className="mr-2" />
          New Chat
        </Button>
      </SidebarHeader>
      <SidebarMenu className="p-2 flex-grow">
        {sessions.map(session => (
          <SidebarMenuItem key={session.id} className="relative">
            <SidebarMenuButton
              onClick={() => onSelectChat(session.id)}
              isActive={session.id === activeSessionId}
              className="w-full justify-start items-center"
            >
              <MessageSquare className="w-4 h-4" />
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium truncate max-w-[150px]">{session.name}</span>
                <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(session.lastUpdated, { addSuffix: true })}
                </span>
              </div>
            </SidebarMenuButton>
            <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(session.id);
                }}
            >
                <Trash2 className="w-4 h-4" />
            </Button>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}
