import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Plus, LogOut, Home, Inbox, Target, BarChart2, Briefcase, Bell, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function Sidebar() {
  const [projects, setProjects] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchProjects();
  }, [location.pathname]);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="w-[240px] h-screen bg-white/60 backdrop-blur-md border-r border-[#E8ECEE] text-[#6F7782] flex flex-col shrink-0 overflow-hidden text-sm">
      <div className="p-5 flex items-center gap-3 mb-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#008CC9] to-blue-600 flex items-center justify-center font-bold text-white shadow-sm text-sm effect-3d">
          F
        </div>
        <span className="font-bold text-xl text-[#1E1F21] tracking-tight">FlowSpace</span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="space-y-0.5 px-2 mb-4">
          <NavLink to="/dashboard" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium ${isActive ? 'bg-[#E8F4FD] text-[#008CC9]' : 'text-[#6F7782] hover:bg-[#F6F8F9] hover:text-[#1E1F21]'}`}>
            <Home size={18} className="text-[#008CC9]" />
            Home
          </NavLink>
          
          <NavLink to="/my-tasks" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium ${isActive ? 'bg-[#F0E5FF] text-[#9D4EDD]' : 'text-[#6F7782] hover:bg-[#F6F8F9] hover:text-[#1E1F21]'}`}>
            <CheckCircle2 size={18} className="text-[#9D4EDD]" />
            My tasks
          </NavLink>
          
          <NavLink to="/inbox" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium ${isActive ? 'bg-[#FFF0E5] text-[#F06A6A]' : 'text-[#6F7782] hover:bg-[#F6F8F9] hover:text-[#1E1F21]'}`}>
            <Bell size={18} className="text-[#F06A6A]" />
            Inbox
          </NavLink>

          <NavLink to="/portfolios" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium ${isActive ? 'bg-[#E5F5EB] text-[#4DA76B]' : 'text-[#6F7782] hover:bg-[#F6F8F9] hover:text-[#1E1F21]'}`}>
            <Briefcase size={18} className="text-[#4DA76B]" />
            Portfolios
          </NavLink>
        </div>

        <div className="space-y-0.5 px-2 mb-6 border-t border-[#E8ECEE] pt-6 mt-4">
          <span className="text-[11px] font-bold text-[#A2A0A2] uppercase tracking-wider px-3 mb-2 block">Insights</span>
          <NavLink 
            to="/reporting"
            className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium ${isActive ? 'bg-[#FFF8E1] text-[#E2A633]' : 'text-[#6F7782] hover:bg-white hover:text-[#1E1F21]'}`}
          >
            <BarChart2 size={18} className={location.pathname === '/reporting' ? "text-[#E2A633]" : ""} /> Reporting
          </NavLink>
          <NavLink 
            to="/goals"
            className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium ${isActive ? 'bg-[#E5F1F9] text-[#008CC9]' : 'text-[#6F7782] hover:bg-white hover:text-[#1E1F21]'}`}
          >
            <Target size={18} className={location.pathname === '/goals' ? "text-[#008CC9]" : ""} /> Goals
          </NavLink>
        </div>

        <div className="px-5 mb-2 flex items-center justify-between group mt-2 border-t border-[#E8ECEE] pt-6">
          <span className="text-[11px] font-bold text-[#A2A0A2] uppercase tracking-wider">Projects</span>
          <Link to="/create-project" className="text-[#A2A0A2] hover:text-[#008CC9] transition-colors"><Plus size={16} /></Link>
        </div>
        <div className="space-y-0.5 px-2">
          {projects.map(p => (
            <Link 
              key={p.id}
              to={`/projects/${p.id}`} 
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium ${location.pathname === `/projects/${p.id}` ? 'bg-white shadow-sm text-[#1E1F21] border border-[#E8ECEE]' : 'text-[#6F7782] hover:bg-white hover:text-[#1E1F21] border border-transparent'}`}
            >
              <div className="w-2 h-2 rounded-full bg-[#008CC9]"></div>
              <span className="truncate">{p.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="p-4 mt-auto border-t border-[#E8ECEE]">
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[#F06A6A] font-medium hover:bg-[#FFEBEE] transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}
