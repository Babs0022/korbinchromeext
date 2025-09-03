'use client';

import type { Project } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, AlertTriangle } from 'lucide-react';
import { LogFeed } from './log-feed';
import { PlatformIcon } from './platform-icon';
import { cn } from '@/lib/utils';


interface ProjectViewProps {
  project: Project;
  onToggleAgent: (project: Project) => void;
  onStopAgent: (project: Project) => void;
}

const statusConfig: Record<Project['status'], {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ReactNode;
    label: string;
}> = {
    Planning: { variant: 'outline', icon: <Play className="mr-2 h-4 w-4" />, label: 'Start Agent' },
    Running: { variant: 'default', icon: <Pause className="mr-2 h-4 w-4" />, label: 'Pause Agent' },
    Paused: { variant: 'default', icon: <Play className="mr-2 h-4 w-4" />, label: 'Resume Agent' },
    Completed: { variant: 'secondary', icon: null, label: 'Completed' },
    Error: { variant: 'destructive', icon: <AlertTriangle className="mr-2 h-4 w-4" />, label: 'Stopped' },
}

export function ProjectView({ project, onToggleAgent, onStopAgent }: ProjectViewProps) {
    const progress = project.totalSteps > 0 ? (project.currentStep / project.totalSteps) * 100 : 0;
    const currentStatus = statusConfig[project.status];

  return (
    <div className="flex flex-col h-screen bg-muted/20">
      <header className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-3 min-w-0">
            <PlatformIcon platform={project.platform} className="h-6 w-6" />
            <h2 className="text-xl font-semibold truncate">{project.name}</h2>
            <Badge variant={currentStatus.variant}>{project.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
            {project.status !== 'Completed' && project.status !== 'Error' && (
                <Button variant={currentStatus.variant} size="sm" onClick={() => onToggleAgent(project)}>
                    {currentStatus.icon}
                    {currentStatus.label}
                </Button>
            )}
             {(project.status === 'Running' || project.status === 'Paused') && (
                <Button variant="destructive" size="sm" onClick={() => onStopAgent(project)}>
                    <Square className="mr-2 h-4 w-4" />
                    Stop Agent
                </Button>
            )}
        </div>
      </header>
      <div className="p-4 space-y-4 flex-shrink-0">
        <Card>
            <CardHeader>
                <CardTitle>Project Goal</CardTitle>
                <CardDescription className="font-mono text-sm">{project.goal}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Progress</span>
                        <span>Step {project.currentStep} of {project.totalSteps}</span>
                    </div>
                    <Progress value={progress} />
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="flex-grow min-h-0">
        <LogFeed logs={project.logs} />
      </div>

    </div>
  );
}
