import { Send } from 'lucide-react';
import type { SVGProps } from 'react';

export function VibePilotLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-primary text-primary-foreground p-2 rounded-lg">
        <Send className="h-5 w-5" />
      </div>
      <h1 className="text-xl font-bold">VibePilot</h1>
    </div>
  );
}
