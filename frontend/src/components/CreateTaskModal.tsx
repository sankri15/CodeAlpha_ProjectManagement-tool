import React, { useState } from 'react';
import { api } from '../api';
import { motion } from 'framer-motion';
import { X, Calendar, Flag, UserPlus, AlignLeft, LayoutGrid } from 'lucide-react';

export default function CreateTaskModal({ projectId, sections, members, onClose }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [sectionId, setSectionId] = useState(sections?.[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setIsSaving(true);
    try {
      await api.post('/tasks', {
        title,
        description,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        priority,
        sectionId,
        projectId
      });
      onClose(); // Automatically triggers a refresh or socket event in the parent
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
        className="bg-white p-6 md:p-8 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8ECEE] relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-[#A2A0A2] hover:text-[#1E1F21] transition-colors z-10">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-[#1E1F21] mb-6">Create New Task</h2>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <input 
              type="text" 
              placeholder="What needs to be done?"
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="text-2xl font-semibold bg-transparent text-[#1E1F21] placeholder-[#A2A0A2] focus:outline-none focus:border-b border-[#008CC9] w-full pb-2 transition-colors"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 text-[13px]">
              
              <div className="flex items-center gap-4">
                <span className="text-[#6F7782] w-24 flex items-center gap-1.5"><UserPlus size={14}/> Assignee</span>
                <select 
                  value={assigneeId} 
                  onChange={e => setAssigneeId(e.target.value)}
                  className="bg-white border border-[#E8ECEE] rounded px-2 py-1.5 flex-1 text-[#1E1F21] focus:outline-none focus:border-[#008CC9] transition-colors"
                >
                  <option value="">Unassigned</option>
                  {members?.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.username}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[#6F7782] w-24 flex items-center gap-1.5"><Calendar size={14}/> Deadline</span>
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={e => setDueDate(e.target.value)}
                  className="bg-white border border-[#E8ECEE] rounded px-2 py-1.5 flex-1 text-[#1E1F21] focus:outline-none focus:border-[#008CC9] transition-colors"
                />
              </div>

            </div>

            <div className="space-y-4 text-[13px]">
              
              <div className="flex items-center gap-4">
                <span className="text-[#6F7782] w-24 flex items-center gap-1.5"><Flag size={14}/> Priority</span>
                <select 
                  value={priority} 
                  onChange={e => setPriority(e.target.value)}
                  className="bg-white border border-[#E8ECEE] rounded px-2 py-1.5 flex-1 text-[#1E1F21] focus:outline-none focus:border-[#008CC9] transition-colors"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High" className="text-[#F06A6A]">High</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[#6F7782] w-24 flex items-center gap-1.5"><LayoutGrid size={14}/> Section</span>
                <select 
                  value={sectionId} 
                  onChange={e => setSectionId(e.target.value)}
                  className="bg-white border border-[#E8ECEE] rounded px-2 py-1.5 flex-1 text-[#1E1F21] focus:outline-none focus:border-[#008CC9] transition-colors"
                >
                  {sections?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          <div>
            <label className="text-[#6F7782] text-sm mb-2 font-medium flex items-center gap-1.5"><AlignLeft size={16}/> Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this task about? Add more details here..."
              className="w-full bg-white border border-[#E8ECEE] rounded p-3 text-[13px] min-h-[120px] focus:outline-none focus:border-[#008CC9] text-[#1E1F21] resize-y transition-colors"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-[#E8ECEE]">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-[13px] font-medium text-[#6F7782] hover:text-[#1E1F21] transition-colors mr-3"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={!title.trim() || isSaving}
              className="bg-[#008CC9] text-white px-6 py-2 rounded text-[13px] font-medium hover:bg-[#007AB0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
