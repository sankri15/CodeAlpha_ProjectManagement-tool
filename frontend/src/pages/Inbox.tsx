import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Inbox as InboxIcon, CheckCircle2, MessageSquare, Briefcase } from 'lucide-react';
import { api } from '../api';
import TaskModal from '../components/TaskModal';

export default function Inbox() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'active'|'archived'>('archived');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { data } = await api.get(`/activities?status=${viewMode}`);
        setActivities(data);
        if (data.length > 0 && data[0].taskId && !selectedTaskId) {
          setSelectedTaskId(data[0].taskId);
          setSelectedProjectId(data[0].projectId);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchActivities();
  }, [viewMode]);

  const handleArchiveAll = async () => {
    try {
      await api.post('/activities/archive-all');
      setActivities([]);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleArchive = async (e: React.MouseEvent, id: string, isArchived: boolean) => {
    e.stopPropagation();
    try {
      if (isArchived) {
        await api.put(`/activities/${id}/unarchive`);
      } else {
        await api.put(`/activities/${id}/archive`);
      }
      setActivities(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (action: string) => {
    if (action.includes('task')) return <CheckCircle2 size={16} className="text-[#4DA76B]" />;
    if (action.includes('comment')) return <MessageSquare size={16} className="text-[#E2A633]" />;
    return <Briefcase size={16} className="text-[#008CC9]" />;
  };

  return (
    <div className="flex h-screen bg-transparent text-[#1E1F21] font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white/40 backdrop-blur-sm border-l border-[#E8ECEE]">
        <Navbar />
        <header className="px-8 py-5 border-b border-[#E8ECEE] flex justify-between items-center bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F4F5F7] text-[#1E1F21] rounded-lg flex items-center justify-center border border-[#E8ECEE]">
              <InboxIcon size={20} />
            </div>
            <h1 className="text-2xl font-bold text-[#1E1F21]">Inbox</h1>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-[#F6F8F9] rounded border border-[#E8ECEE] p-0.5 mr-4">
              <button 
                onClick={() => setViewMode('active')} 
                className={`px-3 py-1.5 text-sm rounded ${viewMode === 'active' ? 'bg-white shadow-sm font-medium text-[#1E1F21]' : 'text-[#6F7782] hover:text-[#1E1F21]'}`}
              >
                Active
              </button>
              <button 
                onClick={() => setViewMode('archived')} 
                className={`px-3 py-1.5 text-sm rounded ${viewMode === 'archived' ? 'bg-white shadow-sm font-medium text-[#1E1F21]' : 'text-[#6F7782] hover:text-[#1E1F21]'}`}
              >
                Archived
              </button>
            </div>
            {viewMode === 'active' && (
              <button 
                onClick={handleArchiveAll}
                className="bg-white border border-[#E8ECEE] text-[#1E1F21] px-4 py-2 rounded text-[13px] font-medium hover:bg-[#F6F8F9] transition-colors"
              >
                Archive all
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-[#F6F8F9] p-8">
          <div className="max-w-4xl mx-auto">
            {activities.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-lg border border-[#E8ECEE]">
                <InboxIcon size={48} className="mx-auto text-[#A2A0A2] mb-4" />
                <h2 className="text-xl font-bold text-[#1E1F21] mb-2">You're all caught up!</h2>
                <p className="text-[#6F7782]">New tasks, comments, and updates will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map(act => (
                  <div 
                    key={act.id} 
                    onClick={() => {
                      if (act.taskId) {
                        setSelectedTaskId(act.taskId);
                        setSelectedProjectId(act.projectId);
                      } else if (act.projectId) {
                        navigate(`/projects/${act.projectId}`);
                      }
                    }}
                    className={`bg-white border border-[#E8ECEE] rounded-lg p-5 flex gap-4 effect-3d effect-3d-active cursor-pointer group`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#008CC9] to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {act.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-[14px] text-[#1E1F21]">
                          <span className="font-bold">{act.username}</span> {act.action} <span className="font-bold">"{act.target}"</span>
                        </div>
                        <span className="text-[12px] text-[#6F7782]">
                          {new Date(act.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-[13px] text-[#6F7782] flex items-center gap-2 mt-2">
                        {getIcon(act.action)}
                        In <span className="font-medium text-[#1E1F21]">{act.projectName}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center">
                      <button 
                        onClick={(e) => toggleArchive(e, act.id, viewMode === 'archived')}
                        className="opacity-0 group-hover:opacity-100 bg-white border border-[#E8ECEE] text-[#6F7782] px-3 py-1 rounded text-xs hover:text-[#1E1F21] hover:border-[#A2A0A2] transition-all"
                      >
                        {viewMode === 'archived' ? 'Unarchive' : 'Archive'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedTaskId && selectedProjectId && (
          <TaskModal 
            taskId={selectedTaskId}
            projectId={selectedProjectId}
            onClose={() => {
              setSelectedTaskId(null);
              setSelectedProjectId(null);
            }} 
          />
        )}
      </div>
    </div>
  );
}
