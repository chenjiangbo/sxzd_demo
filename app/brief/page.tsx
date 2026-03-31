import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import BriefGenerator from '@/components/BriefGenerator';

export const dynamic = 'force-dynamic';

export default function BriefPage() {
  return (
    <>
      <Sidebar />
      <Header />
      
      <main className="ml-48 mt-16 min-h-screen min-w-0 flex-1 bg-surface p-6 font-body text-on-surface">
        <BriefGenerator />
      </main>
    </>
  );
}
