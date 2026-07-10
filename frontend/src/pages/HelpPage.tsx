import React from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { HelpCircle, BookOpen, Video, Keyboard, BellRing } from 'lucide-react';

export default function HelpPage() {
  const helpSections = [
    {
      icon: <BookOpen size={24} className="text-[#008CC9]" />,
      title: "FlowSpace Guide",
      desc: "Comprehensive documentation on how to use every feature in the platform."
    },
    {
      icon: <Video size={24} className="text-[#F06A6A]" />,
      title: "Video Tutorials",
      desc: "Step-by-step video walkthroughs for setting up your first project and inviting your team."
    },
    {
      icon: <Keyboard size={24} className="text-[#4DA76B]" />,
      title: "Keyboard Shortcuts",
      desc: "Work faster with quick keyboard shortcuts for common actions."
    },
    {
      icon: <BellRing size={24} className="text-[#E2A633]" />,
      title: "Product Updates",
      desc: "See what's new and what has changed in the latest release."
    }
  ];

  return (
    <div className="flex h-screen bg-[#F6F8F9] text-[#1E1F21] font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 bg-white border-l border-[#E8ECEE]">
        <Navbar />
        
        <header className="px-8 py-10 bg-[#E8F4FD] border-b border-[#E8ECEE] text-center">
          <div className="w-16 h-16 bg-white text-[#008CC9] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <HelpCircle size={32} />
          </div>
          <h1 className="text-3xl font-bold text-[#1E1F21] mb-3">How can we help you?</h1>
          <div className="max-w-xl mx-auto relative">
            <input 
              type="text" 
              placeholder="Search the Help Center..." 
              className="w-full px-5 py-4 rounded-xl border border-[#E8ECEE] shadow-sm focus:outline-none focus:border-[#008CC9] focus:ring-1 focus:ring-[#008CC9] text-[15px]"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#F6F8F9]">
          <div className="max-w-4xl mx-auto mt-4">
            
            <h2 className="text-xl font-bold mb-6">Popular Topics</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {helpSections.map((section, idx) => (
                <div key={idx} className="bg-white border border-[#E8ECEE] rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="mb-4 bg-[#F6F8F9] w-12 h-12 rounded-lg flex items-center justify-center border border-[#E8ECEE]">
                    {section.icon}
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-[#1E1F21]">{section.title}</h3>
                  <p className="text-[#6F7782] text-[14px] leading-relaxed">{section.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-white rounded-xl border border-[#E8ECEE] p-8 text-center">
              <h3 className="font-bold text-xl mb-2">Still need help?</h3>
              <p className="text-[#6F7782] mb-6">Our support team is available 24/7 to help you with any questions.</p>
              <button className="px-6 py-3 bg-[#008CC9] text-white rounded-lg font-medium hover:bg-[#007AB0] transition-colors shadow-sm">
                Contact Support
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
