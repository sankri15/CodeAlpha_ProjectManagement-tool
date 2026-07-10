import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { motion } from 'framer-motion';
import { X, Briefcase, Check } from 'lucide-react';

export default function CreatePortfolioModal({ onClose, onCreated }: any) {
  const [name, setName] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.get('/projects').then(({ data }) => setProjects(data)).catch(console.error);
  }, []);

  const toggleProject = (id: string) => {
    const next = new Set(selectedProjectIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedProjectIds(next);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSaving(true);
    try {
      await api.post('/portfolios', {
        name,
        projectIds: Array.from(selectedProjectIds)
      });
      onCreated();
    } catch (error) {
      console.error(error);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 md:p-8 rounded-lg w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl border border-[#E8ECEE] relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-[#A2A0A2] hover:text-[#1E1F21] transition-colors z-10">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#E8F4FD] text-[#008CC9] rounded-lg flex items-center justify-center">
            <Briefcase size={20} />
          </div>
          <h2 className="text-xl font-bold text-[#1E1F21]">Create New Portfolio</h2>
        </div>

        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0">
          <div className="mb-6">
            <label className="text-[#1E1F21] text-sm mb-2 font-semibold block">Portfolio Name</label>
            <input 
              type="text" 
              placeholder="e.g. Marketing Initiatives"
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full bg-white border border-[#E8ECEE] rounded p-3 text-[14px] focus:outline-none focus:border-[#008CC9] transition-colors"
              autoFocus
            />
          </div>

          <label className="text-[#1E1F21] text-sm mb-2 font-semibold block">Add Projects to Portfolio</label>
          <div className="flex-1 overflow-y-auto border border-[#E8ECEE] rounded bg-[#F6F8F9] p-2 space-y-1 min-h-[200px]">
            {projects.map(p => (
              <div 
                key={p.id} 
                onClick={() => toggleProject(p.id)}
                className={`flex items-center gap-3 p-3 rounded cursor-pointer transition border ${selectedProjectIds.has(p.id) ? 'bg-white border-[#008CC9] shadow-sm' : 'border-transparent hover:bg-gray-100'}`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center border ${selectedProjectIds.has(p.id) ? 'bg-[#008CC9] border-[#008CC9] text-white' : 'bg-white border-[#A2A0A2]'}`}>
                  {selectedProjectIds.has(p.id) && <Check size={14} />}
                </div>
                <span className="text-[14px] font-medium text-[#1E1F21]">{p.name}</span>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-center p-4 text-[#6F7782] text-sm">No projects found.</div>
            )}
          </div>

          <div className="flex justify-end pt-6 mt-4 border-t border-[#E8ECEE]">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-[13px] font-medium text-[#6F7782] hover:text-[#1E1F21] transition-colors mr-3"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={!name.trim() || isSaving}
              className="bg-[#008CC9] text-white px-6 py-2 rounded text-[13px] font-medium hover:bg-[#007AB0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Create Portfolio'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
