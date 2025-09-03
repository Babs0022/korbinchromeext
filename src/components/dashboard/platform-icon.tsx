import type { Platform } from '@/lib/types';
import { FirebaseLogo } from '@/components/icons/FirebaseLogo';
import { ReplitLogo } from '@/components/icons/ReplitLogo';
import { VercelLogo } from '@/components/icons/VercelLogo';

interface PlatformIconProps {
  platform: Platform;
  className?: string;
}

export function PlatformIcon({ platform, className }: PlatformIconProps) {
  const icons: Record<Platform, React.ReactNode> = {
    Firebase: <FirebaseLogo className={className} />,
    Replit: <ReplitLogo className={className} />,
    Vercel: <VercelLogo className={className} />,
  };

  return icons[platform] || null;
}
