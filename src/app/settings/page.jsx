'use client';
import SettingsPanel from '@/components/ui/SettingsPanel';

export default function SettingsPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow pt-24 pb-16 px-4 sm:px-6 md:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>
          <SettingsPanel />
        </div>
      </div>
      <Footer />
    </main>
  );
}