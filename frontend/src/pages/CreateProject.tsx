import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowLeft } from 'lucide-react';

export default function CreateProject() {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const navigate = useNavigate();

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/projects', { name: newProjectName, description: newProjectDesc });
      navigate(`/projects/${data.id}`);
    } catch (error) {
      console.error(error);
      alert('Failed to create project');
    }
  };

  return (
    <div className="flex h-screen bg-[#F6F8F9] text-[#1E1F21] font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 bg-white border-l border-[#E8ECEE]">
        <Navbar />
        
        <header className="px-8 py-5 border-b border-[#E8ECEE] flex gap-4 items-center bg-white">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#F6F8F9] rounded-lg transition-colors text-[#6F7782]">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E8F4FD] text-[#008CC9] rounded-lg flex items-center justify-center">
              <Briefcase size={20} />
            </div>
            <h1 className="text-2xl font-bold text-[#1E1F21]">Create New Project</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#F6F8F9] flex justify-center">
          <div className="w-full max-w-xl bg-white border border-[#E8ECEE] rounded-lg shadow-sm p-8 mt-10 h-fit">
            <h2 className="text-xl font-semibold mb-6">Project Details</h2>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-[#6F7782]">Project Name <span className="text-[#F06A6A]">*</span></label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-2 border border-[#E8ECEE] rounded-md focus:outline-none focus:border-[#008CC9] focus:ring-1 focus:ring-[#008CC9]"
                  required
                  placeholder="e.g. Q4 Marketing Campaign"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[#6F7782]">Description</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-4 py-2 border border-[#E8ECEE] rounded-md focus:outline-none focus:border-[#008CC9] focus:ring-1 focus:ring-[#008CC9] h-32 resize-none"
                  placeholder="What is this project about?"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => navigate(-1)} className="px-5 py-2 rounded font-medium text-[#6F7782] hover:bg-[#F6F8F9] transition-colors border border-transparent">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#008CC9] text-white rounded font-medium hover:bg-[#007AB0] transition-colors">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
