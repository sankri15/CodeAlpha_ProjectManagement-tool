import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Briefcase, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import CreatePortfolioModal from '../components/CreatePortfolioModal';

export default function Portfolios() {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const { data } = await api.get('/portfolios');
      setPortfolios(data);
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
    <div className="flex h-screen bg-transparent text-[#1E1F21] font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white/40 backdrop-blur-sm border-l border-[#E8ECEE]">
        <Navbar />
        <header className="px-8 py-5 border-b border-[#E8ECEE] flex justify-between items-center bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E8F4FD] text-[#008CC9] rounded-lg flex items-center justify-center">
              <Briefcase size={20} />
            </div>
            <h1 className="text-2xl font-bold text-[#1E1F21]">Portfolios</h1>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-[#008CC9] text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-[#007AB0] transition-colors"
          >
            + New Portfolio
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#F6F8F9]">
          <div className="max-w-6xl mx-auto space-y-12">
            
            {portfolios.map(portfolio => (
              <div key={portfolio.id} className="mb-8">
                <div className="flex items-center justify-between border-b border-[#E8ECEE] pb-3 mb-6">
                  <h2 className="text-xl font-bold text-[#1E1F21]">{portfolio.name}</h2>
                  <span className="text-sm font-medium text-[#6F7782]">{portfolio.projects?.length || 0} Projects</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {portfolio.projects?.map((project: any) => {
                    const totalTasks = project.totalTasks || 0;
                    const completedTasks = project.completedTasks || 0;
                    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
                    
                    let status = 'On Track';
                    if (progress < 25 && totalTasks > 0) status = 'Off Track';
                    else if (progress < 60 && totalTasks > 0) status = 'At Risk';
                    else if (totalTasks === 0) status = 'Planning';

                    return (
                      <div key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="bg-white border border-[#E8ECEE] rounded-lg p-5 effect-3d effect-3d-active cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 rounded bg-[#F6F8F9] flex items-center justify-center text-[#6F7782] border border-[#E8ECEE]">
                            <CheckCircle2 size={20} />
                          </div>
                          <button className="text-[#A2A0A2] hover:text-[#1E1F21] opacity-0 group-hover:opacity-100 transition">
                            <MoreHorizontal size={18} />
                          </button>
                        </div>
                        
                        <h3 className="text-[16px] font-semibold text-[#1E1F21] mb-1">{project.name}</h3>
                        <div className="text-[13px] text-[#6F7782] mb-6 flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {project.members?.slice(0, 4).map((m: any) => (
                              <div key={m.id} className="w-6 h-6 rounded-full bg-[#008CC9] text-white flex items-center justify-center border-2 border-white text-[9px] font-bold" title={m.username}>
                                {m.username[0].toUpperCase()}
                              </div>
                            ))}
                            {(project.members?.length || 0) > 4 && (
                              <div className="w-6 h-6 rounded-full bg-[#F4F5F7] text-[#6F7782] flex items-center justify-center border-2 border-white text-[9px] font-bold">
                                +{project.members.length - 4}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[#4DA76B] font-medium" title="Completed">{completedTasks}</span>
                            <span>/</span>
                            <span className="text-[#F06A6A] font-medium" title="Incomplete">{totalTasks - completedTasks}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${getStatusColor(status)}`}>
                              {status}
                            </span>
                            <span className="text-[12px] font-medium text-[#6F7782]">{progress}%</span>
                          </div>
                          <div className="h-2 w-full bg-[#E8ECEE] rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${status === 'Off Track' ? 'bg-[#F06A6A]' : status === 'At Risk' ? 'bg-[#E2A633]' : 'bg-[#4DA76B]'}`} 
                              style={{ width: `${progress}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {(!portfolio.projects || portfolio.projects.length === 0) && (
                    <div className="col-span-3 text-[#6F7782] text-[13px] italic p-4 bg-white border border-dashed border-[#E8ECEE] rounded-lg">
                      No projects in this portfolio yet.
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {portfolios.length === 0 && (
              <div className="text-center py-24 bg-white border border-dashed border-[#A2A0A2] rounded-lg text-[#6F7782] flex flex-col items-center justify-center">
                <Briefcase size={48} className="text-[#A2A0A2] mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-[#1E1F21] mb-2">Create Your First Portfolio</h3>
                <p className="text-[#6F7782] max-w-sm mb-6">Group related projects together to easily monitor their overall progress and health in one place.</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#008CC9] text-white px-6 py-2 rounded font-medium hover:bg-[#007AB0] transition-colors shadow-sm"
                >
                  Create Portfolio
                </button>
              </div>
            )}
          </div>
        </div>

        {showCreateModal && (
          <CreatePortfolioModal 
            onClose={() => setShowCreateModal(false)} 
            onCreated={() => {
              setShowCreateModal(false);
              fetchPortfolios();
            }}
          />
        )}
      </div>
    </div>
  );
}
