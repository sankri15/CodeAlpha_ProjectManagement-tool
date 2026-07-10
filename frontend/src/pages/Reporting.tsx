import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import TaskModal from '../components/TaskModal';
import { BarChart2, CheckCircle2, Clock, AlertCircle, Users, ChevronDown, ChevronRight, Circle } from 'lucide-react';

export default function Reporting() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [expandedAssignee, setExpandedAssignee] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks/all');
      setTasks(data);
    } catch (error) {
      console.error(error);
      navigate('/login');
    }
  };

  // KPI Calculations
  const completedCount = tasks.filter(t => t.isCompleted).length;
  const now = new Date();
  
  const overdueCount = tasks.filter(t => {
    if (t.isCompleted || !t.dueDate) return false;
    return new Date(t.dueDate) < now;
  }).length;

  const upcomingCount = tasks.filter(t => {
    if (t.isCompleted || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    const diff = (due.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diff >= 0 && diff <= 7;
  }).length;

  // Workload Calculations
  const workloadMap = tasks.reduce((acc: any, task) => {
    const assignee = task.assigneeName || 'Unassigned';
    if (!acc[assignee]) acc[assignee] = { total: 0, completed: 0, overdue: 0, userTasks: [] };
    acc[assignee].total += 1;
    acc[assignee].userTasks.push(task);
    if (task.isCompleted) acc[assignee].completed += 1;
    if (!task.isCompleted && task.dueDate && new Date(task.dueDate) < now) acc[assignee].overdue += 1;
    return acc;
  }, {});
  
  const workloadArray = Object.keys(workloadMap).map(name => ({
    name,
    ...workloadMap[name]
  })).sort((a, b) => b.total - a.total);

  // Fake chart data scaling based on total tasks just so it's not totally static
  const weeklyData = [
    { day: 'Mon', completed: Math.round(completedCount * 0.1), added: Math.round(tasks.length * 0.15) },
    { day: 'Tue', completed: Math.round(completedCount * 0.2), added: Math.round(tasks.length * 0.1) },
    { day: 'Wed', completed: Math.round(completedCount * 0.15), added: Math.round(tasks.length * 0.2) },
    { day: 'Thu', completed: Math.round(completedCount * 0.25), added: Math.round(tasks.length * 0.15) },
    { day: 'Fri', completed: Math.round(completedCount * 0.2), added: Math.round(tasks.length * 0.25) },
    { day: 'Sat', completed: Math.round(completedCount * 0.05), added: Math.round(tasks.length * 0.05) },
    { day: 'Sun', completed: Math.round(completedCount * 0.05), added: Math.round(tasks.length * 0.1) },
  ];

  const maxVal = Math.max(...weeklyData.flatMap(d => [d.completed, d.added])) || 1;

  return (
    <div className="flex h-screen bg-[#F6F8F9] text-[#1E1F21] font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 bg-white border-l border-[#E8ECEE]">
        <Navbar />
        <header className="px-8 py-5 border-b border-[#E8ECEE] flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F4F5F7] text-[#1E1F21] rounded-lg flex items-center justify-center border border-[#E8ECEE]">
              <BarChart2 size={20} />
            </div>
            <h1 className="text-2xl font-bold text-[#1E1F21]">Reporting</h1>
          </div>
          <select className="bg-white border border-[#E8ECEE] rounded px-3 py-1.5 text-[13px] text-[#1E1F21] focus:outline-none">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>This Quarter</option>
          </select>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#F6F8F9]">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-[#E8ECEE] p-6 shadow-sm">
                <div className="flex items-center gap-3 text-[#6F7782] mb-4">
                  <CheckCircle2 size={18} className="text-[#4DA76B]" />
                  <span className="font-semibold text-[13px]">Tasks Completed</span>
                </div>
                <div className="text-4xl font-bold text-[#1E1F21]">{completedCount}</div>
                <div className="text-[12px] text-[#4DA76B] font-medium mt-2">Across all projects</div>
              </div>
              
              <div className="bg-white rounded-lg border border-[#E8ECEE] p-6 shadow-sm">
                <div className="flex items-center gap-3 text-[#6F7782] mb-4">
                  <AlertCircle size={18} className="text-[#F06A6A]" />
                  <span className="font-semibold text-[13px]">Overdue Tasks</span>
                </div>
                <div className="text-4xl font-bold text-[#1E1F21]">{overdueCount}</div>
                <div className="text-[12px] text-[#F06A6A] font-medium mt-2">Requires immediate attention</div>
              </div>

              <div className="bg-white rounded-lg border border-[#E8ECEE] p-6 shadow-sm">
                <div className="flex items-center gap-3 text-[#6F7782] mb-4">
                  <Clock size={18} className="text-[#008CC9]" />
                  <span className="font-semibold text-[13px]">Upcoming Deadlines</span>
                </div>
                <div className="text-4xl font-bold text-[#1E1F21]">{upcomingCount}</div>
                <div className="text-[12px] text-[#6F7782] font-medium mt-2">Within the next 7 days</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="bg-white rounded-lg border border-[#E8ECEE] p-6 shadow-sm">
              <h3 className="font-semibold text-[15px] text-[#1E1F21] mb-6">Task Activity (Last 7 Days)</h3>
              
              <div className="h-[300px] flex items-end gap-6 pt-4 pb-2 relative">
                {/* Y-Axis lines (dummy) */}
                <div className="absolute inset-0 flex flex-col justify-between pb-8 pointer-events-none opacity-10 text-[11px] text-[#6F7782] text-right pr-2">
                  <div className="border-t border-[#E8ECEE] w-full mt-4"></div>
                  <div className="border-t border-[#E8ECEE] w-full"></div>
                  <div className="border-t border-[#E8ECEE] w-full"></div>
                  <div className="border-t border-[#E8ECEE] w-full"></div>
                </div>

                {weeklyData.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end gap-1 h-full relative z-10 group">
                    <div className="flex-1 flex justify-center items-end gap-1 pb-8 relative">
                      {/* Added bar */}
                      <div 
                        className="w-1/3 bg-[#E8ECEE] rounded-t-sm hover:bg-[#D5D9DC] transition-colors"
                        style={{ height: `${(data.added / maxVal) * 100}%` }}
                        title={`Added: ${data.added}`}
                      />
                      {/* Completed bar */}
                      <div 
                        className="w-1/3 bg-[#4DA76B] rounded-t-sm hover:bg-[#3d8b58] transition-colors"
                        style={{ height: `${(data.completed / maxVal) * 100}%` }}
                        title={`Completed: ${data.completed}`}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 text-center text-[12px] text-[#6F7782] font-medium">
                      {data.day}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#4DA76B]"></div>
                  <span className="text-[12px] text-[#6F7782]">Tasks Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#E8ECEE]"></div>
                  <span className="text-[12px] text-[#6F7782]">Tasks Added</span>
                </div>
              </div>
            </div>

            {/* Workload Section */}
            <div className="bg-white rounded-lg border border-[#E8ECEE] p-6 shadow-sm">
              <div className="flex items-center gap-3 text-[#1E1F21] mb-6">
                <Users size={20} className="text-[#E2A633]" />
                <h3 className="font-semibold text-[15px]">Team Workload</h3>
              </div>
              
              <div className="overflow-hidden border border-[#E8ECEE] rounded-lg">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[#F6F8F9] border-b border-[#E8ECEE] text-[#6F7782]">
                    <tr>
                      <th className="py-3 px-4 font-medium w-8"></th>
                      <th className="py-3 px-2 font-medium">Assignee</th>
                      <th className="py-3 px-6 font-medium text-center">Total Tasks</th>
                      <th className="py-3 px-6 font-medium text-center">Completed</th>
                      <th className="py-3 px-6 font-medium text-center">Overdue</th>
                      <th className="py-3 px-6 font-medium w-64">Workload Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workloadArray.map((w, idx) => (
                      <React.Fragment key={idx}>
                        <tr 
                          onClick={() => setExpandedAssignee(expandedAssignee === w.name ? null : w.name)}
                          className="border-b border-[#E8ECEE] hover:bg-gray-50 transition cursor-pointer"
                        >
                          <td className="py-4 px-4 text-[#A2A0A2]">
                            {expandedAssignee === w.name ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </td>
                          <td className="py-4 px-2 font-medium text-[#1E1F21] flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#008CC9] text-white flex items-center justify-center text-[10px] font-bold">
                              {w.name[0].toUpperCase()}
                            </div>
                            {w.name}
                          </td>
                          <td className="py-4 px-6 text-center font-semibold">{w.total}</td>
                          <td className="py-4 px-6 text-center text-[#4DA76B] font-medium">{w.completed}</td>
                          <td className="py-4 px-6 text-center text-[#F06A6A] font-medium">{w.overdue}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="h-2 flex-1 bg-[#E8ECEE] rounded-full overflow-hidden flex">
                                <div className="bg-[#4DA76B]" style={{ width: `${(w.completed / w.total) * 100}%` }} />
                                <div className="bg-[#F06A6A]" style={{ width: `${(w.overdue / w.total) * 100}%` }} />
                                <div className="bg-[#008CC9]" style={{ width: `${((w.total - w.completed - w.overdue) / w.total) * 100}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                        {expandedAssignee === w.name && w.userTasks && w.userTasks.length > 0 && (
                          <tr className="bg-[#F6F8F9] border-b border-[#E8ECEE]">
                            <td colSpan={6} className="p-0">
                              <div className="py-3 px-10">
                                <h4 className="text-[12px] font-semibold text-[#6F7782] uppercase tracking-wider mb-3">Tasks assigned to {w.name}</h4>
                                <div className="space-y-1">
                                  {w.userTasks.map((t: any) => (
                                    <div 
                                      key={t.id} 
                                      onClick={() => setSelectedTaskId(t.id)}
                                      className="flex items-center justify-between p-2 hover:bg-white rounded border border-transparent hover:border-[#E8ECEE] transition cursor-pointer group"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={t.isCompleted ? 'text-[#4DA76B]' : 'text-[#A2A0A2]'}>
                                          {t.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                        </div>
                                        <span className={`text-[13px] font-medium ${t.isCompleted ? 'line-through text-[#A2A0A2]' : 'text-[#1E1F21]'}`}>
                                          {t.title}
                                        </span>
                                      </div>
                                      <div className="text-[12px] text-[#6F7782] flex items-center gap-4">
                                        <span className="bg-[#E8ECEE] px-2 py-0.5 rounded text-[11px]">{t.projectName}</span>
                                        <span className={!t.isCompleted && t.dueDate && new Date(t.dueDate) < now ? 'text-[#F06A6A] font-medium' : ''}>
                                          {t.dueDate || 'No deadline'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {workloadArray.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#6F7782]">No tasks found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        {selectedTaskId && (
          <TaskModal 
            taskId={selectedTaskId} 
            projectId={tasks.find(t => t.id === selectedTaskId)?.projectId}
            members={[]}
            onClose={() => { setSelectedTaskId(null); fetchTasks(); }} 
          />
        )}
      </div>
    </div>
  );
}
