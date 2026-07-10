import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Navbar() {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [activities, setActivities] = useState<any[]>([]);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { data } = await api.get('/activities');
        setActivities(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchActivities();

    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Invite sent to ${inviteEmail}!`);
    setShowInviteModal(false);
    setInviteEmail('');
  };

  return (
    <>
    <div className="h-14 border-b border-[#E8ECEE] bg-white flex items-center justify-between px-4 shrink-0 w-full z-20" ref={navRef}>
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A2A0A2] group-focus-within:text-[#008CC9]" />
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-[#F6F8F9] hover:bg-white border border-transparent hover:border-[#E8ECEE] focus:bg-white focus:border-[#008CC9] rounded-full py-1.5 pl-9 pr-4 text-sm outline-none transition-all text-[#1E1F21] placeholder-[#A2A0A2]"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Quick Add Menu */}
        <div className="relative">
          <button 
            onClick={() => { setShowAddMenu(!showAddMenu); setShowNotifications(false); }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#F06A6A] bg-[#F06A6A]/10 hover:bg-[#F06A6A]/20 transition-colors"
          >
            <Plus size={16} />
          </button>
          
          {showAddMenu && (
            <div className="absolute top-10 right-0 w-48 bg-white border border-[#E8ECEE] rounded-lg shadow-xl overflow-hidden z-50 py-2">
              <div onClick={() => {navigate('/my-tasks'); setShowAddMenu(false);}} className="px-4 py-2 hover:bg-[#F6F8F9] cursor-pointer text-[13px] text-[#1E1F21] font-medium transition">Create Task</div>
              <div onClick={() => {navigate('/create-project'); setShowAddMenu(false);}} className="px-4 py-2 hover:bg-[#F6F8F9] cursor-pointer text-[13px] text-[#1E1F21] font-medium transition">Create Project</div>
              <div onClick={() => {navigate('/inbox'); setShowAddMenu(false);}} className="px-4 py-2 hover:bg-[#F6F8F9] cursor-pointer text-[13px] text-[#1E1F21] font-medium transition">Send Message</div>
              <div className="border-t border-[#E8ECEE] my-1"></div>
              <div onClick={() => { setShowInviteModal(true); setShowAddMenu(false); }} className="px-4 py-2 hover:bg-[#F6F8F9] cursor-pointer text-[13px] text-[#1E1F21] font-medium transition">Invite Team Member</div>
            </div>
          )}
        </div>

        {/* Invite Button */}
        <button 
          onClick={() => { setShowInviteModal(true); setShowNotifications(false); setShowAddMenu(false); }}
          className="px-3 py-1.5 bg-[#F4F5F7] hover:bg-[#E8ECEE] text-[#1E1F21] text-[13px] font-medium rounded-md transition-colors border border-[#E8ECEE]"
        >
          Invite
        </button>
        
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowAddMenu(false); }}
            className="text-[#6F7782] hover:text-[#1E1F21] transition-colors relative flex items-center"
          >
            <Bell size={20} />
            {activities.length > 0 && <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#F06A6A]"></div>}
          </button>
          
          {showNotifications && (
            <div className="absolute top-10 right-0 w-80 bg-white border border-[#E8ECEE] rounded-lg shadow-xl overflow-hidden z-50">
              <div className="p-4 border-b border-[#E8ECEE] flex justify-between items-center bg-[#F6F8F9]">
                <h3 className="font-semibold text-[#1E1F21]">Notifications</h3>
                <span className="text-[11px] text-[#008CC9] cursor-pointer hover:underline">Mark all as read</span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {activities.length === 0 ? (
                  <div className="p-8 text-center text-[#A2A0A2] text-sm">No new notifications</div>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="p-4 border-b border-[#E8ECEE] hover:bg-[#F6F8F9] transition cursor-pointer">
                      <div className="text-[13px] text-[#1E1F21] mb-1">
                        <span className="font-semibold">{act.username}</span> {act.action} <span className="font-medium">"{act.target}"</span>
                      </div>
                      <div className="text-[11px] text-[#6F7782]">{new Date(act.createdAt).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div 
          onClick={handleLogout}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-[#008CC9] to-blue-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:shadow-md transition-shadow ml-2" 
          title="Logout"
        >
          ME
        </div>
      </div>
    </div>

    {/* Invite Modal */}
    {showInviteModal && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="p-6 border-b border-[#E8ECEE]">
            <h2 className="text-xl font-bold text-[#1E1F21]">Invite Team Member</h2>
            <p className="text-[13px] text-[#6F7782] mt-1">Send an invite link to collaborate in your workspace.</p>
          </div>
          <form onSubmit={handleInvite} className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-[#1E1F21]">Email Address</label>
              <input 
                type="email" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com" 
                className="w-full px-4 py-2 border border-[#E8ECEE] rounded-lg focus:outline-none focus:border-[#008CC9] focus:ring-1 focus:ring-[#008CC9]"
                required
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-lg font-medium text-[#6F7782] hover:bg-[#F6F8F9] transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-[#008CC9] text-white rounded-lg font-medium hover:bg-[#007AB0] transition-colors"
              >
                Send Invite
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
