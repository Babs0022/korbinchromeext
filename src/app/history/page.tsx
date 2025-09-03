import { HistoryList } from '@/components/dashboard/history-list';

export default function HistoryPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Chat History</h1>
      <HistoryList />
    </div>
  );
}
