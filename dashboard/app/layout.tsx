import './globals.css';
import React from 'react';
import Sidebar from '@/components/layout/Sidebar';

export const metadata = {
  title: 'ModelRouter | Cost, Quality & Latency Dashboard',
  description: 'Production AI Model Router & Eval Comparison Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#050507] text-[#f3f4f6] antialiased selection:bg-violet-500 selection:text-white">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0 bg-[#050507]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
