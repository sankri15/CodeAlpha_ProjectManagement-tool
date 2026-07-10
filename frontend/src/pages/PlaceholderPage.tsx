import React from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function PlaceholderPage({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex h-screen bg-[#F6F8F9] text-[#1E1F21] font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 bg-white border-l border-[#E8ECEE]">
        <Navbar />
        <header className="px-8 py-5 border-b border-[#E8ECEE]">
          <h1 className="text-2xl font-bold text-[#1E1F21]">{title}</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold mb-2 text-[#1E1F21]">Welcome to {title}</h2>
            <p className="text-[#6F7782]">{description}</p>
            <div className="mt-8 p-6 bg-[#F6F8F9] rounded-lg border border-[#E8ECEE] border-dashed">
              <p className="text-sm text-[#A2A0A2]">This page is currently under construction. Check back soon for more updates!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
