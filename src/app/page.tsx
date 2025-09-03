'use client';

import { VibePilotUI } from '@/components/dashboard/vibe-pilot-ui';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function VibePilotPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  return <VibePilotUI activeSessionIdFromURL={sessionId} />;
}


export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VibePilotPage />
    </Suspense>
  );
}
