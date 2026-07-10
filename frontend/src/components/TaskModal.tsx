import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { motion } from 'framer-motion';
import { X, Calendar, Flag, MessageSquare, Send, CheckCircle2, Circle, Paperclip } from 'lucide-react';
import { io } from 'socket.io-client';

export default function TaskModal({ taskId, projectId, members, onClose }: any) {
  const [task, setTask] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [projectMembers, setProjectMembers] = useState(members || []);

  useEffect(() => {
    fetchTask();
    const socket = io('http://localhost:5000');
    socket.emit('joinProject', projectId);
    
    socket.on('commentAdded', (comment: any) => {
      if (comment.taskId === taskId) {
        setTask((prev: any) => ({ ...prev, comments: [comment, ...prev.comments] }));
      }
    });

    socket.on('taskUpdated', (updatedTask: any) => {
      if (updatedTask.id === taskId) {
        setTask((prev: any) => ({ ...prev, ...updatedTask }));
      }
    });

    return () => { socket.disconnect(); };
  }, [taskId]);

  const fetchTask = async () => {
    const { data } = await api.get(`/tasks/${taskId}`);
    setTask(data);
    
    if (!members || members.length === 0) {
      const projRes = await api.get(`/projects/${projectId}`);
      setProjectMembers(projRes.data.members || []);
    }
  };

  const updateTask = async (field: string, value: any) => {
    setTask({ ...task, [field]: value });
    await api.put(`/tasks/${taskId}`, { [field]: value });
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText && !attachmentName) return;
    await api.post('/comments', { text: commentText, taskId, attachmentName });
    setCommentText('');
    setAttachmentName('');
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 md:p-8 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row gap-8 shadow-2xl border border-[#E8ECEE] relative"
      >
        <div className="flex-1">
          <div className="flex justify-between items-start mb-6">
            <input 
              type="text" 
              value={task.title} 
              onChange={e => updateTask('title', e.target.value)}
              className="text-2xl font-bold bg-transparent text-[#1E1F21] focus:outline-none focus:border-b border-[#008CC9] w-full"
            />
          </div>

          <div className="space-y-4 text-[13px] mb-8">
            <div className="flex items-center gap-4">
              <span className="text-[#6F7782] w-24">Assignee</span>
              <select 
                value={task.assigneeId || ''} 
                onChange={e => updateTask('assigneeId', e.target.value)}
                className="bg-white border border-[#E8ECEE] rounded px-2 py-1.5 flex-1 text-[#1E1F21] focus:outline-none focus:border-[#008CC9]"
              >
                <option value="">Unassigned</option>
                {projectMembers?.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.username}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[#6F7782] w-24 flex items-center gap-1.5">Assigned</span>
              <span className="text-[#1E1F21] font-medium flex-1 px-2 py-1.5">
                {task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[#6F7782] w-24 flex items-center gap-1.5"><Calendar size={14}/> Deadline</span>
              <input 
                type="date" 
                value={task.dueDate || ''} 
                onChange={e => updateTask('dueDate', e.target.value)}
                className="bg-white border border-[#E8ECEE] rounded px-2 py-1.5 flex-1 text-[#1E1F21] focus:outline-none focus:border-[#008CC9]"
              />
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[#6F7782] w-24 flex items-center gap-1.5"><Flag size={14}/> Priority</span>
              <select 
                value={task.priority || 'Medium'} 
                onChange={e => updateTask('priority', e.target.value)}
                className="bg-white border border-[#E8ECEE] rounded px-2 py-1.5 flex-1 text-[#1E1F21] focus:outline-none focus:border-[#008CC9]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High" className="text-[#F06A6A]">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[#6F7782] text-sm mb-2 block font-medium">Description</label>
            <textarea 
              value={task.description || ''} 
              onChange={e => updateTask('description', e.target.value)}
              placeholder="Add more details to this task..."
              className="w-full bg-white border border-[#E8ECEE] rounded p-3 text-[13px] min-h-[120px] focus:outline-none focus:border-[#008CC9] text-[#1E1F21] resize-y"
            />
          </div>

          <div className="mt-8">
            <h3 className="font-semibold text-[13px] text-[#1E1F21] mb-3">Subtasks</h3>
            <div className="space-y-1 mb-2">
              {task.subtasks?.map((st: any) => (
                <div key={st.id} className="flex items-center gap-2 group p-1 hover:bg-[#F6F8F9] rounded transition-colors">
                  <button 
                    onClick={async () => {
                      const isComp = !st.isCompleted;
                      await api.put(`/tasks/${st.id}`, { isCompleted: isComp ? 1 : 0 });
                      fetchTask();
                    }}
                    className={`shrink-0 transition-colors ${st.isCompleted ? 'text-[#4DA76B]' : 'text-[#A2A0A2] group-hover:text-[#4DA76B]'}`}
                  >
                    {st.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </button>
                  <span className={`text-[13px] ${st.isCompleted ? 'line-through text-[#A2A0A2]' : 'text-[#1E1F21]'}`}>{st.title}</span>
                </div>
              ))}
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const input = (e.target as any).subtaskTitle;
              if (!input.value) return;
              await api.post('/tasks', { title: input.value, projectId, parentId: taskId });
              input.value = '';
              fetchTask();
            }}>
              <input 
                name="subtaskTitle"
                type="text" 
                placeholder="+ Add subtask" 
                className="w-full bg-transparent text-[13px] text-[#6F7782] placeholder-[#A2A0A2] hover:text-[#1E1F21] focus:outline-none focus:text-[#1E1F21] p-1"
              />
            </form>
          </div>
        </div>

        {/* Comments Section */}
        <div className="w-full md:w-[320px] flex flex-col border-t md:border-t-0 md:border-l border-[#E8ECEE] pt-6 md:pt-0 md:pl-6 bg-[#F6F8F9] -m-6 md:-my-8 md:p-8 ml-0 md:ml-0 md:rounded-r-lg">
          <h3 className="font-semibold text-[#1E1F21] flex items-center gap-2 mb-4"><MessageSquare size={16} className="text-[#6F7782]"/> Comments</h3>
          
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[300px] md:max-h-[500px]">
            {task.comments?.map((c: any) => (
              <div key={c.id} className="bg-white p-3 rounded-lg border border-[#E8ECEE] text-[13px]">
                <div className="font-semibold text-[#1E1F21] mb-1">{c.authorName}</div>
                <div className="text-[#6F7782]">{c.text}</div>
                {c.attachmentName && (
                  <div className="mt-2 bg-[#F6F8F9] px-3 py-2 rounded text-[#008CC9] font-medium text-[12px] flex items-center gap-2 border border-[#E8ECEE]">
                    <Paperclip size={12}/> {c.attachmentName}
                  </div>
                )}
              </div>
            ))}
            {(!task.comments || task.comments.length === 0) && (
              <div className="text-[#A2A0A2] text-sm text-center mt-10">No comments yet.</div>
            )}
          </div>

          {attachmentName && (
            <div className="mb-2 text-[12px] text-[#008CC9] flex items-center gap-1 font-medium bg-[#E5F1F9] px-2 py-1 rounded w-fit">
              <Paperclip size={12}/> {attachmentName}
              <button onClick={() => setAttachmentName('')} className="ml-1 text-[#6F7782] hover:text-[#1E1F21]"><X size={12}/></button>
            </div>
          )}
          <form onSubmit={addComment} className="flex gap-2 items-center">
            <label className="cursor-pointer text-[#A2A0A2] hover:text-[#1E1F21] transition-colors p-1">
              <Paperclip size={16}/>
              <input 
                type="file" 
                className="hidden" 
                onChange={e => {
                  if (e.target.files?.[0]) setAttachmentName(e.target.files[0].name);
                  e.target.value = '';
                }}
              />
            </label>
            <input 
              type="text" 
              value={commentText} 
              onChange={e => setCommentText(e.target.value)}
              placeholder="Ask a question or share an update..."
              className="flex-1 bg-white border border-[#E8ECEE] rounded px-3 py-2 text-[13px] focus:outline-none focus:border-[#008CC9]"
            />
            <button type="submit" className="bg-[#008CC9] text-white p-2 rounded hover:bg-[#007AB0] transition-colors"><Send size={14}/></button>
          </form>
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 text-[#A2A0A2] hover:text-[#1E1F21] transition-colors z-10">
          <X size={20} />
        </button>
      </motion.div>
    </div>
  );
}
