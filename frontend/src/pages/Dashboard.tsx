import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, ArrowRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (error) {
      console.error(error);
      navigate('/login');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projects', { name: newProjectName, description: newProjectDesc });
      setNewProjectName('');
      setNewProjectDesc('');
      fetchProjects();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex h-screen bg-transparent text-[#1E1F21] font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white/40 backdrop-blur-sm border-l border-[#E8ECEE]">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-10">
        <header className="mb-10 border-b border-[#E8ECEE] pb-6">
          <h1 className="text-3xl font-semibold mb-2">My Workspace</h1>
          <p className="text-[#6F7782]">Manage your projects and collaborate with your team.</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2"><LayoutGrid className="text-[#F06A6A]" size={20}/> Projects</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {projects.map(project => (
                <Link to={`/projects/${project.id}`} key={project.id}>
                  <div className="p-5 rounded-lg bg-white border border-[#E8ECEE] hover:border-[#F06A6A] hover:shadow-md transition-all group cursor-pointer h-full flex flex-col">
                    <h3 className="text-lg font-semibold mb-2 text-[#1E1F21] group-hover:text-[#F06A6A] transition-colors">{project.name}</h3>
                    <p className="text-sm text-[#6F7782] mb-4 flex-1 line-clamp-2">{project.description || 'No description'}</p>
                    <div className="flex items-center text-[#F06A6A] text-sm font-medium mt-auto">
                      Open Project <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                </Link>
              ))}
              {projects.length === 0 && (
                <div className="p-8 text-center text-[#6F7782] border-2 border-dashed border-[#E8ECEE] rounded-lg bg-white">
                  No projects yet. Create one to get started!
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white p-6 rounded-lg border border-[#E8ECEE] shadow-sm sticky top-10">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-[#1E1F21]">
                <Plus size={18} className="text-[#F06A6A]" /> New Project
              </h2>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[#6F7782]">Project Name</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="flow-input"
                    required
                    placeholder="e.g. Website Redesign"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[#6F7782]">Description</label>
                  <textarea
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="flow-input h-24 resize-none"
                    placeholder="What is this project about?"
                  />
                </div>
                <button type="submit" className="flow-button w-full">
                  Create Project
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
