'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import type { Project } from '@/lib/types';
import { PlatformIcon } from './platform-icon';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ProjectListProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
}

const statusColors: Record<Project['status'], string> = {
    Planning: 'bg-yellow-500',
    Running: 'bg-green-500 animate-pulse',
    Paused: 'bg-gray-500',
    Completed: 'bg-blue-500',
    Error: 'bg-red-500',
}

export function ProjectList({
  projects,
  selectedProjectId,
  onSelectProject,
}: ProjectListProps) {
  return (
    <div className="p-2">
      <h2 className="px-2 text-sm font-semibold text-muted-foreground mb-2">Projects</h2>
      <SidebarMenu>
        {projects.map(project => (
          <SidebarMenuItem key={project.id}>
            <SidebarMenuButton
              onClick={() => onSelectProject(project.id)}
              isActive={project.id === selectedProjectId}
              className="h-auto py-2"
            >
                <PlatformIcon platform={project.platform} className="h-5 w-5 shrink-0" />
                <div className="flex flex-col w-full min-w-0">
                    <span className="truncate font-medium">{project.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                        {formatDistanceToNow(project.lastUpdated, { addSuffix: true })}
                    </span>
                </div>
                <div className="flex-shrink-0">
                    <div className={cn("h-2.5 w-2.5 rounded-full", statusColors[project.status])} title={project.status}/>
                </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        {projects.length === 0 && (
            <div className="text-center text-sm text-muted-foreground p-4">
                No projects yet.
            </div>
        )}
      </SidebarMenu>
    </div>
  );
}
