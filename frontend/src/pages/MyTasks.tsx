import React, { useEffect, useState } from 'react';
import { api } from '../api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { CheckCircle2, Circle, Calendar, MessageSquare } from 'lucide-react';
import TaskModal from '../components/TaskModal';

export default function MyTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      const { data } = await api.get('/tasks/me');
      setTasks(data);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleComplete = async (task: any) => {
    try {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t));
      await api.put(`/tasks/${task.id}`, { isCompleted: !task.isCompleted ? 1 : 0 });
    } catch(e) { console.error(e); }
  }

  // Group tasks by project
  const groupedTasks = tasks.reduce((acc, task) => {
    const pName = task.projectName || 'Other';
    if (!acc[pName]) {
      acc[pName] = { incomplete: [], completed: [] };
    }
    if (task.isCompleted) {
      acc[pName].completed.push(task);
    } else {
      acc[pName].incomplete.push(task);
    }
    return acc;
  }, {} as Record<string, { incomplete: any[], completed: any[] }>);

  const projectNames = Object.keys(groupedTasks).sort();

  const [selectedProjectMembers, setSelectedProjectMembers] = useState<any[]>([]);

  const handleTaskClick = async (taskId: string, projectId: string) => {
    setSelectedTaskId(taskId);
    try {
      const { data } = await api.get(`/projects/${projectId}`);
      setSelectedProjectMembers(data.members || []);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex h-screen bg-[#F6F8F9] text-[#1E1F21] font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 bg-white border-l border-[#E8ECEE]">
        <Navbar />
        <header className="px-8 py-5 border-b border-[#E8ECEE]">
          <h1 className="text-2xl font-bold text-[#1E1F21]">My Tasks</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl">
            
            {projectNames.length === 0 && (
              <div className="text-center py-12 border border-dashed border-[#E8ECEE] rounded-lg text-[#A2A0A2]">
                No tasks assigned to you right now.
              </div>
            )}

            {projectNames.map(projectName => {
              const projectData = groupedTasks[projectName];
              const { incomplete, completed } = projectData;
              
              if (incomplete.length === 0 && completed.length === 0) return null;

              return (
                <div key={projectName} className="mb-10">
                  <div className="flex items-center gap-2 mb-4 border-b border-[#E8ECEE] pb-2">
                    <div className="w-6 h-6 rounded bg-[#F06A6A] bg-opacity-20 flex items-center justify-center text-[#F06A6A]">
                      <div className="w-2 h-2 rounded-full bg-[#F06A6A]" />
                    </div>
                    <h3 className="font-semibold text-[15px] text-[#1E1F21]">{projectName}</h3>
                  </div>

                  <table className="w-full text-left text-[13px]">
                    <tbody>
                      {incomplete.map(task => (
                        <tr key={task.id} onClick={() => handleTaskClick(task.id, task.projectId)} className="border-b border-[#E8ECEE] hover:bg-gray-50 cursor-pointer transition group">
                          <td className="py-3 px-4 w-10">
                              <button 
                              onClick={(e) => { e.stopPropagation(); toggleComplete(task); }} 
                              className={`transition ${task.isCompleted ? 'text-[#4DA76B]' : 'text-[#A2A0A2] hover:text-[#4DA76B]'}`}
                            >
                              {task.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                            </button>
                          </td>
                          <td className="py-3 px-4 font-medium text-[#1E1F21]">
                            <div className="flex items-center gap-2">
                              <span>{task.title}</span>
                              {task.commentCount > 0 && (
                                <div className="text-[11px] text-[#A2A0A2] font-medium flex items-center gap-1" title={`${task.commentCount} comments`}>
                                  <MessageSquare size={12}/> {task.commentCount}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#F06A6A] text-right">{task.dueDate || 'No deadline'}</td>
                        </tr>
                      ))}
                      
                      {completed.map(task => (
                        <tr key={task.id} onClick={() => handleTaskClick(task.id, task.projectId)} className="border-b border-[#E8ECEE] hover:bg-gray-50 cursor-pointer transition group opacity-60">
                          <td className="py-3 px-4 w-10">
                              <button 
                              onClick={(e) => { e.stopPropagation(); toggleComplete(task); }} 
                              className={`transition ${task.isCompleted ? 'text-[#4DA76B]' : 'text-[#A2A0A2] hover:text-[#4DA76B]'}`}
                            >
                              {task.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                            </button>
                          </td>
                          <td className="py-3 px-4 font-medium line-through text-[#6F7782]">{task.title}</td>
                          <td className="py-3 px-4 text-[#6F7782] text-right">{task.dueDate || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}

          </div>
        </div>

        {selectedTaskId && (
          <TaskModal 
            taskId={selectedTaskId} 
            projectId={tasks.find(t => t.id === selectedTaskId)?.projectId}
            members={selectedProjectMembers}
            onClose={() => { setSelectedTaskId(null); fetchMyTasks(); }} 
          />
        )}
      </div>
    </div>
  );
}
