import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LayoutGrid, List, UserPlus, CheckCircle2, Circle, Calendar, MessageSquare, MoreHorizontal, Search, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TaskModal from '../components/TaskModal';
import CreateTaskModal from '../components/CreateTaskModal';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ProjectBoard() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'board'|'list'|'overview'>('overview');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedSectionForModal, setSelectedSectionForModal] = useState<any>(null);
  const [showTeamMembersModal, setShowTeamMembersModal] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionMenuOpen, setSectionMenuOpen] = useState<string | null>(null);

  // Socket
  useEffect(() => {
    fetchProject();
    
    const socket = io('http://localhost:5000');
    socket.emit('joinProject', id);
    
    socket.on('taskAdded', (task) => {
      setTasks(prev => [...prev, task]);
    });
    
    socket.on('taskUpdated', (updatedTask) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    });

    socket.on('sectionAdded', (section) => {
      setSections(prev => [...prev, section].sort((a,b) => a.orderIndex - b.orderIndex));
    });

    socket.on('taskDeleted', ({ id }) => {
      setTasks(prev => prev.filter(t => t.id !== id));
    });

    socket.on('sectionDeleted', ({ id }) => {
      setSections(prev => prev.filter(s => s.id !== id));
      setTasks(prev => prev.filter(t => t.sectionId !== id));
    });

    socket.on('sectionUpdated', (updatedSection) => {
      setSections(prev => prev.map(s => s.id === updatedSection.id ? updatedSection : s).sort((a,b) => a.orderIndex - b.orderIndex));
    });

    return () => { socket.disconnect(); };
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data);
      setTasks(data.tasks || []);
      setSections(data.sections || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent, sectionId?: string) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    try {
      await api.post('/tasks', { title: newTaskTitle, projectId: id, sectionId });
      setNewTaskTitle('');
    } catch(e) { console.error(e); }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName) return;
    try {
      await api.post('/sections', { name: newSectionName, projectId: id });
      setNewSectionName('');
    } catch(e) { console.error(e); }
  }

  const claimTask = async (taskId: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return; 
    try {
      const me = JSON.parse(atob(localStorage.getItem('token')!.split('.')[1]));
      await api.put(`/tasks/${taskId}`, { assigneeId: me.id });
    } catch(e) { console.error(e); }
  };

  const toggleComplete = async (task: any) => {
    try {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t));
      await api.put(`/tasks/${task.id}`, { isCompleted: !task.isCompleted ? 1 : 0 });
    } catch(e) { console.error(e); }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await api.delete(`/tasks/${taskId}`);
    } catch(e) { console.error(e); }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      setSections(prev => prev.filter(s => s.id !== sectionId));
      setTasks(prev => prev.filter(t => t.sectionId !== sectionId));
      await api.delete(`/sections/${sectionId}`);
    } catch(e) { console.error(e); }
  };

  const handleRenameSection = async (sectionId: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, name: newName } : s));
      await api.put(`/sections/${sectionId}`, { name: newName });
      setEditingSectionId(null);
    } catch(e) { console.error(e); }
  };

  const onDragEnd = async (result: any) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'section') {
      const newSections = Array.from(sections);
      const [moved] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, moved);
      
      const updatedSections = newSections.map((s, idx) => ({ ...s, orderIndex: idx }));
      setSections(updatedSections);
      
      try {
        await api.put(`/sections/${moved.id}`, { orderIndex: destination.index });
      } catch(e) { console.error(e); }
      return;
    }

    const draggedTask = tasks.find(t => t.id === draggableId);
    if (!draggedTask) return;

    const updatedTask = { ...draggedTask, sectionId: destination.droppableId };
    
    setTasks(prev => {
      const newTasks = prev.filter(t => t.id !== draggableId);
      return [...newTasks, updatedTask];
    });

    try {
      await api.put(`/tasks/${draggableId}`, { sectionId: destination.droppableId });
    } catch(e) { console.error(e); }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/members`, { email: inviteEmail });
      alert('Collaborator added!');
      setShowInviteModal(false);
      setInviteEmail('');
      fetchProject();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error adding collaborator');
    }
  };

  if (!project) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex h-screen bg-transparent text-[#1E1F21] font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 bg-white/40 backdrop-blur-sm border-l border-[#E8ECEE]">
        <Navbar />
        <header className="px-8 py-5 border-b border-[#E8ECEE] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1 max-w-md">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-[#1E1F21]">{project.name}</h1>
                {(() => {
                  const totalTasks = tasks.length;
                  const completedTasks = tasks.filter(t => t.isCompleted).length;
                  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
                  
                  let status = 'On Track';
                  let colors = 'text-[#4DA76B] bg-[#E8F5E9]';
                  
                  if (progress < 25 && totalTasks > 0) {
                    status = 'Off Track';
                    colors = 'text-[#F06A6A] bg-[#FFEBEE]';
                  } else if (progress < 60 && totalTasks > 0) {
                    status = 'At Risk';
                    colors = 'text-[#E2A633] bg-[#FFF8E1]';
                  } else if (totalTasks === 0) {
                    status = 'Planning';
                    colors = 'text-[#6F7782] bg-[#F6F8F9]';
                  }

                  return (
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${colors}`}>
                      {status}
                    </span>
                  );
                })()}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-48 h-1.5 bg-[#E8ECEE] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#4DA76B] rounded-full transition-all duration-500"
                    style={{ width: `${tasks.length === 0 ? 0 : Math.round((tasks.filter(t => t.isCompleted).length / tasks.length) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-[#6F7782]">
                  {tasks.filter(t => t.isCompleted).length} / {tasks.length} tasks
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {viewMode !== 'overview' && (
              <div className="relative flex items-center">
                <Search size={16} className="absolute left-3 text-[#A2A0A2]" />
                <input 
                  type="text" 
                  placeholder="Search tasks..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-white border border-[#E8ECEE] rounded text-sm text-[#1E1F21] focus:outline-none focus:border-[#008CC9] focus:ring-1 focus:ring-[#008CC9] transition-all w-48 focus:w-64"
                />
              </div>
            )}
            <div className="flex bg-[#F6F8F9] rounded border border-[#E8ECEE] p-0.5">
              <button 
                onClick={() => setViewMode('overview')} 
                className={`px-3 py-1.5 text-sm rounded ${viewMode === 'overview' ? 'bg-white shadow-sm font-medium text-[#1E1F21]' : 'text-[#6F7782] hover:text-[#1E1F21]'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setViewMode('board')} 
                className={`px-3 py-1.5 text-sm rounded ${viewMode === 'board' ? 'bg-white shadow-sm font-medium text-[#1E1F21]' : 'text-[#6F7782] hover:text-[#1E1F21]'}`}
              >
                Board
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`px-3 py-1.5 text-sm rounded ${viewMode === 'list' ? 'bg-white shadow-sm font-medium text-[#1E1F21]' : 'text-[#6F7782] hover:text-[#1E1F21]'}`}
              >
                List
              </button>
            </div>

            <div className="flex gap-3 items-center">
              <div className="flex -space-x-2">
                {project.members?.slice(0, 3).map((m: any) => (
                  <div key={m.id} className="w-8 h-8 rounded-full bg-[#008CC9] text-white flex items-center justify-center border-2 border-white text-xs font-bold" title={m.username}>
                    {m.username[0].toUpperCase()}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-[#008CC9] text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-[#007AB0] transition-colors shadow-sm"
              >
                + Add task
              </button>
            </div>

            <button 
              onClick={() => setShowInviteModal(true)}
              className="w-8 h-8 rounded-full border border-dashed border-[#A2A0A2] text-[#A2A0A2] hover:text-[#1E1F21] hover:border-[#1E1F21] flex items-center justify-center transition-colors"
              title="Invite"
            >
              <Plus size={14} />
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden bg-transparent">
          
          <div className="flex-1 flex flex-col min-w-0">
            {/* Overview View */}
            {viewMode === 'overview' && (
              <div className="flex-1 overflow-y-auto p-10">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-10">
                    <h2 className="text-2xl font-bold mb-3">Project Overview</h2>
                    <p className="text-[#6F7782] text-lg max-w-2xl">{project.description || 'Welcome to the project overview. Here you can track your overall progress and see key stats at a glance.'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">
                    {sections.map((section, idx) => {
                      const count = tasks.filter(t => t.sectionId === section.id).length;
                      const colors = [
                        { bg: 'bg-[#F6F8F9]', text: 'text-[#6F7782]', icon: <Circle size={24} /> },
                        { bg: 'bg-[#FFF0E5]', text: 'text-[#E2A633]', icon: <Calendar size={24} /> },
                        { bg: 'bg-[#E8F4FD]', text: 'text-[#008CC9]', icon: <LayoutGrid size={24} /> },
                        { bg: 'bg-[#F0E5FF]', text: 'text-[#9D4EDD]', icon: <List size={24} /> },
                        { bg: 'bg-[#E5F5EB]', text: 'text-[#4DA76B]', icon: <CheckCircle2 size={24} /> },
                      ];
                      const color = colors[idx % colors.length];
                      
                      return (
                        <div 
                          key={section.id} 
                          onClick={() => setSelectedSectionForModal(section)}
                          className="bg-white p-6 rounded-lg border border-[#E8ECEE] flex flex-col items-center text-center cursor-pointer effect-3d effect-3d-active group"
                        >
                          <div className={`w-12 h-12 rounded-full ${color.bg} ${color.text} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            {color.icon}
                          </div>
                          <div className="text-3xl font-bold text-[#1E1F21] mb-1">{count}</div>
                          <div className="text-[11px] font-semibold text-[#6F7782] uppercase tracking-wider">{section.name}</div>
                        </div>
                      );
                    })}
                    
                    <div 
                      onClick={() => setShowTeamMembersModal(true)}
                      className="bg-white p-6 rounded-lg border border-[#E8ECEE] flex flex-col items-center text-center cursor-pointer effect-3d effect-3d-active group"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#E5F1F9] text-[#008CC9] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <UserPlus size={24} />
                      </div>
                      <div className="text-3xl font-bold text-[#1E1F21] mb-1">{project.members?.length || 0}</div>
                      <div className="text-[11px] font-semibold text-[#6F7782] uppercase tracking-wider">Team Members</div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-4">Workload by Section</h3>
                  <div className="bg-white rounded-lg border border-[#E8ECEE] shadow-sm p-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={sections.map(section => {
                            const sectionTasks = tasks.filter(t => t.sectionId === section.id);
                            const completed = sectionTasks.filter(t => t.isCompleted).length;
                            return {
                              name: section.name,
                              Completed: completed,
                              Incomplete: sectionTasks.length - completed
                            };
                          })}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEE" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6F7782', fontSize: 13}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#6F7782', fontSize: 13}} />
                          <Tooltip 
                            cursor={{fill: '#F6F8F9'}}
                            contentStyle={{borderRadius: '8px', border: '1px solid #E8ECEE', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                          />
                          <Bar dataKey="Completed" stackId="a" fill="#4DA76B" radius={[0, 0, 4, 4]} barSize={40} />
                          <Bar dataKey="Incomplete" stackId="a" fill="#E8ECEE" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Board View */}
            {viewMode === 'board' && (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="board" type="section" direction="horizontal">
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-1 flex gap-4 overflow-x-auto p-8 items-start"
                    >
                      {sections.map((section, index) => (
                        <Draggable key={section.id} draggableId={section.id} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`w-[280px] shrink-0 flex flex-col rounded-lg transition-colors pb-4 ${snapshot.isDragging ? 'opacity-90 shadow-xl' : ''}`}
                            >
                              <div 
                                {...provided.dragHandleProps}
                                className="flex items-center justify-between mb-3 px-1 group/header relative"
                              >
                                {editingSectionId === section.id ? (
                                  <input 
                                    type="text"
                                    autoFocus
                                    defaultValue={section.name}
                                    onBlur={(e) => handleRenameSection(section.id, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleRenameSection(section.id, e.currentTarget.value);
                                      if (e.key === 'Escape') setEditingSectionId(null);
                                    }}
                                    className="font-semibold text-[13px] text-[#1E1F21] bg-white border border-[#008CC9] rounded px-1 w-full focus:outline-none"
                                  />
                                ) : (
                                  <h3 className="font-semibold text-[13px] text-[#1E1F21] cursor-pointer hover:text-[#008CC9]" onClick={() => setEditingSectionId(section.id)}>
                                    {section.name}
                                  </h3>
                                )}
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-semibold text-[#6F7782]">{tasks.filter(t => t.sectionId === section.id).length}</span>
                                  <div className="relative">
                                    <button 
                                      onClick={() => setSectionMenuOpen(sectionMenuOpen === section.id ? null : section.id)}
                                      className="text-[#A2A0A2] hover:text-[#1E1F21] p-0.5 rounded opacity-0 group-hover/header:opacity-100 transition-opacity"
                                    >
                                      <MoreHorizontal size={14} />
                                    </button>
                                    {sectionMenuOpen === section.id && (
                                      <>
                                        <div className="fixed inset-0 z-40" onClick={() => setSectionMenuOpen(null)} />
                                        <div className="absolute top-full right-0 mt-1 w-36 bg-white border border-[#E8ECEE] rounded-md shadow-lg py-1 z-50 effect-3d">
                                          <button onClick={() => { setEditingSectionId(section.id); setSectionMenuOpen(null); }} className="w-full text-left px-3 py-1.5 text-sm text-[#1E1F21] hover:bg-[#F6F8F9] flex items-center gap-2">
                                            <Edit2 size={12} /> Rename
                                          </button>
                                          <button onClick={() => { handleDeleteSection(section.id); setSectionMenuOpen(null); }} className="w-full text-left px-3 py-1.5 text-sm text-[#F06A6A] hover:bg-[#FFEBEE] flex items-center gap-2">
                                            <Trash2 size={12} /> Delete
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <Droppable droppableId={section.id} type="task">
                                {(provided, snapshot) => (
                                  <div 
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex-1 space-y-2 overflow-y-auto min-h-[100px] px-1 rounded-md transition-colors ${snapshot.isDraggingOver ? 'bg-black/5' : ''}`}
                                  >
                                    {tasks
                                      .filter(t => t.sectionId === section.id)
                                      .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                      .map((task, index) => {
                                      const assignee = project.members?.find((m:any) => m.id === task.assigneeId);
                                      
                                      let priorityColor = 'bg-[#F6F8F9] text-[#6F7782]';
                                      if (task.priority === 'High') priorityColor = 'bg-[#FFEBEE] text-[#F06A6A]';
                                      if (task.priority === 'Medium') priorityColor = 'bg-[#FFF8E1] text-[#E2A633]';
                                      if (task.priority === 'Low') priorityColor = 'bg-[#E8F4FD] text-[#008CC9]';
                                      
                                      return (
                                        <Draggable key={task.id} draggableId={task.id} index={index}>
                                          {(provided, snapshot) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              onClick={() => setSelectedTaskId(task.id)}
                                              className={`p-3 rounded-lg bg-white border cursor-pointer group effect-3d effect-3d-active relative ${snapshot.isDragging ? 'border-[#008CC9] z-50' : 'border-[#E8ECEE]'}`}
                                              style={{ ...provided.draggableProps.style, opacity: task.isCompleted ? 0.6 : 1 }}
                                            >
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                                className="absolute top-2 right-2 p-1.5 bg-white rounded-md shadow-sm border border-[#E8ECEE] text-[#F06A6A] opacity-0 group-hover:opacity-100 hover:bg-[#FFEBEE] transition-all z-10"
                                                title="Delete task"
                                              >
                                                <Trash2 size={12} />
                                              </button>

                                              <div className="flex items-start gap-2 pr-6">
                                                <button 
                                                  onClick={(e) => { e.stopPropagation(); toggleComplete(task); }} 
                                                  className={`mt-0.5 shrink-0 transition-colors ${task.isCompleted ? 'text-[#4DA76B]' : 'text-[#A2A0A2] hover:text-[#4DA76B]'}`}
                                                >
                                                  {task.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                                                    {task.priority && (
                                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${priorityColor}`}>
                                                        {task.priority}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <h4 className={`text-[13px] mb-2 leading-tight ${task.isCompleted ? 'line-through text-[#6F7782]' : 'text-[#1E1F21]'}`}>{task.title}</h4>
                                                  <div className="flex items-center justify-between mt-3">
                                                    {task.dueDate ? (
                                                      <div className="text-[11px] bg-[#F6F8F9] text-[#1E1F21] px-2 py-0.5 rounded font-medium flex items-center gap-1 border border-[#E8ECEE]">
                                                        <Calendar size={10}/> {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                      </div>
                                                    ) : <div/>}
                                                    
                                                    {task.commentCount > 0 && (
                                                      <div className="text-[11px] text-[#A2A0A2] font-medium flex items-center gap-1 ml-2 mr-auto" title={`${task.commentCount} comments`}>
                                                        <MessageSquare size={12}/> {task.commentCount}
                                                      </div>
                                                    )}
                                                    
                                                    {assignee ? (
                                                      <div className="flex items-center gap-1.5" title={assignee.username}>
                                                        <div className="w-5 h-5 rounded-full bg-[#F06A6A] text-white flex items-center justify-center text-[9px] font-bold shadow-sm">
                                                          {assignee.username[0].toUpperCase()}
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <button onClick={(e) => { e.stopPropagation(); claimTask(task.id); }} className="opacity-0 group-hover:opacity-100 text-[#A2A0A2] hover:text-[#1E1F21] transition-opacity" title="Assign">
                                                        <UserPlus size={14}/>
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </Draggable>
                                      );
                                    })}
                                    {provided.placeholder}
                                    
                                    <form onSubmit={(e) => handleCreateTask(e, section.id)} className="pt-2">
                                      <input 
                                        type="text"
                                        placeholder="+ Add task" 
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            setNewTaskTitle((e.target as HTMLInputElement).value);
                                          }
                                        }}
                                        className="w-full bg-transparent text-[13px] text-[#6F7782] placeholder-[#A2A0A2] hover:text-[#1E1F21] hover:bg-white/50 px-2 py-1.5 rounded transition-all focus:outline-none focus:text-[#1E1F21] focus:bg-white"
                                      />
                                    </form>
                                  </div>
                                )}
                              </Droppable>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      <div className="w-[280px] shrink-0">
                        <form onSubmit={handleCreateSection} className="flex gap-2 bg-black/5 rounded-lg p-1 border border-dashed border-[#A2A0A2] hover:border-[#1E1F21] transition-colors">
                          <input 
                            type="text" value={newSectionName} onChange={e => setNewSectionName(e.target.value)}
                            placeholder="+ Add another list" 
                            className="flex-1 px-3 py-2 bg-transparent text-[13px] text-[#1E1F21] placeholder-[#6F7782] focus:outline-none focus:bg-white rounded transition-all"
                          />
                        </form>
                      </div>
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="flex-1 overflow-y-auto p-8">
                <table className="w-full text-left text-[13px]">
                  <thead className="border-b border-[#E8ECEE] text-[#6F7782]">
                    <tr>
                      <th className="py-2 px-4 font-medium w-10"></th>
                      <th className="py-2 px-4 font-medium">Task name</th>
                      <th className="py-2 px-4 font-medium">Assignee</th>
                      <th className="py-2 px-4 font-medium">Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => {
                      const assignee = project.members?.find((m:any) => m.id === task.assigneeId);
                      return (
                      <tr key={task.id} onClick={() => setSelectedTaskId(task.id)} className="border-b border-[#E8ECEE] hover:bg-white cursor-pointer transition group">
                        <td className="py-2 px-4">
                           <button 
                            onClick={(e) => { e.stopPropagation(); toggleComplete(task); }} 
                            className={`transition ${task.isCompleted ? 'text-[#4DA76B]' : 'text-[#A2A0A2] hover:text-[#4DA76B]'}`}
                          >
                            {task.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                          </button>
                        </td>
                        <td className={`py-2 px-4 font-medium`}>
                          <input 
                            type="text"
                            defaultValue={task.title}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={async (e) => {
                              if (e.target.value !== task.title) {
                                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, title: e.target.value } : t));
                                await api.put(`/tasks/${task.id}`, { title: e.target.value });
                              }
                            }}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            className={`w-full bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#008CC9] rounded px-1 -ml-1 transition-all ${task.isCompleted ? 'line-through text-[#A2A0A2]' : 'text-[#1E1F21]'}`}
                          />
                        </td>
                        <td className="py-2 px-4 text-[#6F7782]">
                          {assignee ? (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-[#F06A6A] flex items-center justify-center text-[9px] text-white font-bold">
                                {assignee.username[0].toUpperCase()}
                              </div>
                              {assignee.username}
                            </div>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); claimTask(task.id); }} className="text-[#A2A0A2] hover:text-[#1E1F21] opacity-0 group-hover:opacity-100 transition-opacity">
                              <UserPlus size={14}/>
                            </button>
                          )}
                        </td>
                        <td className="py-2 px-4 text-[#F06A6A]">
                          <div className="flex items-center justify-between">
                            <span>{task.dueDate || ''}</span>
                            {task.commentCount > 0 && (
                              <span className="text-[#A2A0A2] flex items-center gap-1" title={`${task.commentCount} comments`}>
                                <MessageSquare size={14}/> {task.commentCount}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {selectedTaskId && (
          <TaskModal 
            taskId={selectedTaskId} 
            projectId={project.id} 
            members={project.members}
            onClose={() => setSelectedTaskId(null)} 
          />
        )}

        {showCreateModal && (
          <CreateTaskModal
            projectId={project.id}
            sections={sections}
            members={project.members}
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {showInviteModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md border border-[#E8ECEE]"
            >
              <h2 className="text-xl font-semibold mb-4 text-[#1E1F21]">Invite Collaborator</h2>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[#6F7782]">Email address</label>
                  <input 
                    type="email" 
                    value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                    className="flow-input" required 
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 rounded text-[#6F7782] hover:bg-[#F6F8F9] transition">Cancel</button>
                  <button type="submit" className="flow-button">Send Invite</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {selectedSectionForModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl border border-[#E8ECEE] flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#1E1F21]">Tasks in {selectedSectionForModal.name}</h2>
                <button onClick={() => setSelectedSectionForModal(null)} className="text-[#6F7782] hover:text-[#1E1F21] text-xl font-bold">×</button>
              </div>
              <div className="overflow-y-auto pr-2 space-y-3">
                {tasks.filter(t => t.sectionId === selectedSectionForModal.id).map(task => {
                  const assignee = project.members?.find((m:any) => m.id === task.assigneeId);
                  return (
                    <div 
                      key={task.id} 
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        // Optionally keep section modal open underneath, or close it:
                        // setSelectedSectionForModal(null);
                      }} 
                      className="p-4 border border-[#E8ECEE] rounded-lg hover:border-[#008CC9] cursor-pointer flex justify-between items-center bg-white shadow-sm transition group"
                    >
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleComplete(task); }} 
                          className={`shrink-0 transition-colors ${task.isCompleted ? 'text-[#4DA76B]' : 'text-[#A2A0A2] hover:text-[#4DA76B]'}`}
                        >
                          {task.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </button>
                        <div className="flex flex-col">
                          <span className={`font-semibold text-[14px] ${task.isCompleted ? 'line-through text-[#A2A0A2]' : 'text-[#1E1F21]'}`}>{task.title}</span>
                          {task.dueDate && (
                            <span className="text-[11px] text-[#F06A6A] font-medium flex items-center gap-1 mt-1">
                              <Calendar size={10}/> {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {task.commentCount > 0 && (
                          <div className="text-[12px] text-[#A2A0A2] font-medium flex items-center gap-1">
                            <MessageSquare size={14}/> {task.commentCount}
                          </div>
                        )}
                        {assignee ? (
                          <div className="flex items-center gap-2" title={assignee.username}>
                            <div className="w-7 h-7 rounded-full bg-[#F06A6A] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                              {assignee.username[0].toUpperCase()}
                            </div>
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full border border-dashed border-[#A2A0A2] text-[#A2A0A2] flex items-center justify-center text-[10px]">
                            <UserPlus size={12}/>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {tasks.filter(t => t.sectionId === selectedSectionForModal.id).length === 0 && (
                  <div className="text-center text-[#6F7782] py-12 border border-dashed border-[#E8ECEE] rounded-lg">
                    <CheckCircle2 size={32} className="mx-auto mb-3 text-[#E8ECEE]" />
                    <p>No tasks currently in {selectedSectionForModal.name}.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showTeamMembersModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md border border-[#E8ECEE] flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#1E1F21]">Team Members</h2>
                <button onClick={() => setShowTeamMembersModal(false)} className="text-[#6F7782] hover:text-[#1E1F21] text-xl font-bold">×</button>
              </div>
              <div className="overflow-y-auto pr-2 space-y-3">
                {project.members?.map((member: any) => (
                  <div key={member.id} className="p-4 border border-[#E8ECEE] rounded-lg flex items-center gap-4 bg-white shadow-sm transition hover:border-[#008CC9]">
                    <div className="w-10 h-10 rounded-full bg-[#008CC9] text-white flex items-center justify-center text-[14px] font-bold shadow-sm">
                      {member.username[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[14px] text-[#1E1F21]">{member.username}</span>
                      {member.email && <span className="text-[12px] text-[#6F7782]">{member.email}</span>}
                    </div>
                  </div>
                ))}
                {(!project.members || project.members.length === 0) && (
                  <div className="text-center text-[#6F7782] py-12 border border-dashed border-[#E8ECEE] rounded-lg">
                    <UserPlus size={32} className="mx-auto mb-3 text-[#E8ECEE]" />
                    <p>No team members yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
