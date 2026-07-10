import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Target, Users, Calendar, Flag } from 'lucide-react';

export default function Goals() {
  const [projects, setProjects] = useState<any[]>([]);
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
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'On Track': return 'text-[#4DA76B] bg-[#E8F5E9]';
      case 'At Risk': return 'text-[#E2A633] bg-[#FFF8E1]';
      case 'Off Track': return 'text-[#F06A6A] bg-[#FFEBEE]';
      default: return 'text-[#6F7782] bg-[#F6F8F9]';
    }
  };

  return (
    <div className="flex h-screen bg-[#F6F8F9] text-[#1E1F21] font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 bg-white border-l border-[#E8ECEE]">
        <Navbar />
        <header className="px-8 py-5 border-b border-[#E8ECEE] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFECEE] text-[#F06A6A] rounded-lg flex items-center justify-center">
              <Target size={20} />
            </div>
            <h1 className="text-2xl font-bold text-[#1E1F21]">Company Goals</h1>
          </div>
          <button className="bg-[#008CC9] text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-[#007AB0] transition-colors">
            + Add Goal
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#F6F8F9]">
          <div className="max-w-5xl mx-auto space-y-4">
            
            <div className="bg-white border border-[#E8ECEE] rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#F6F8F9] border-b border-[#E8ECEE] text-[#6F7782]">
                  <tr>
                    <th className="py-3 px-6 font-medium">Goal Name</th>
                    <th className="py-3 px-6 font-medium">Status</th>
                    <th className="py-3 px-6 font-medium w-48">Progress</th>
                    <th className="py-3 px-6 font-medium">Owner</th>
                    <th className="py-3 px-6 font-medium">Time Period</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(project => {
                    const totalTasks = project.totalTasks || 0;
                    const completedTasks = project.completedTasks || 0;
                    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
                    
                    let status = 'On Track';
                    if (progress < 25 && totalTasks > 0) status = 'Off Track';
                    else if (progress < 60 && totalTasks > 0) status = 'At Risk';
                    else if (totalTasks === 0) status = 'Planning';

                    return (
                      <tr key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="border-b border-[#E8ECEE] hover:bg-gray-50 transition cursor-pointer">
                        <td className="py-4 px-6 font-medium text-[#1E1F21]">{project.name}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-full bg-[#E8ECEE] rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${status === 'Off Track' ? 'bg-[#F06A6A]' : status === 'At Risk' ? 'bg-[#E2A633]' : 'bg-[#4DA76B]'}`} 
                                style={{ width: `${progress}%` }} 
                              />
                            </div>
                            <span className="text-[12px] font-medium text-[#6F7782] min-w-[32px]">{progress}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[#6F7782]">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-[#008CC9] text-white flex items-center justify-center text-[10px] font-bold">
                              {(project.ownerName || 'U')[0].toUpperCase()}
                            </div>
                            {project.ownerName || 'You'}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[#6F7782]">2026</td>
                      </tr>
                    );
                  })}
                  
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-[#6F7782]">No active goals/projects.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
