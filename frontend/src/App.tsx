import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectBoard from './pages/ProjectBoard';
import MyTasks from './pages/MyTasks';
import PlaceholderPage from './pages/PlaceholderPage';
import Goals from './pages/Goals';
import Portfolios from './pages/Portfolios';
import Reporting from './pages/Reporting';
import Inbox from './pages/Inbox';
import CreateProject from './pages/CreateProject';
import HelpPage from './pages/HelpPage';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { api } from './api';
import { useNavigate } from 'react-router-dom';

function GlobalNotificationListener() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const socket = io('http://localhost:5000');
    
    // Join all project rooms for this user
    api.get('/projects').then(({ data }) => {
      data.forEach((p: any) => socket.emit('joinProject', p.id));
    }).catch(console.error);

    socket.on('activityAdded', (activity: any) => {
      toast.success(
        <div className="flex flex-col cursor-pointer" onClick={() => navigate('/inbox')}>
          <span className="font-bold text-[13px]">{activity.username}</span>
          <span className="text-[12px]">{activity.action} "{activity.target}"</span>
          <span className="text-[10px] text-gray-500 mt-1">Click to view in Inbox</span>
        </div>,
        { duration: 5000 }
      );
    });

    return () => { socket.disconnect(); };
  }, [navigate]);

  return null;
}
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? (
    <>
      <GlobalNotificationListener />
      {children}
    </>
  ) : <Navigate to="/" />;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={
          localStorage.getItem('token') ? <Navigate to="/inbox" /> : <Login />
        } />
        <Route path="/login" element={
          localStorage.getItem('token') ? <Navigate to="/inbox" /> : <Login />
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/projects/:id" element={
          <ProtectedRoute><ProjectBoard /></ProtectedRoute>
        } />
        <Route path="/my-tasks" element={
          <ProtectedRoute><MyTasks /></ProtectedRoute>
        } />
        <Route path="/inbox" element={
          <ProtectedRoute><Inbox /></ProtectedRoute>
        } />
        <Route path="/reporting" element={
          <ProtectedRoute><Reporting /></ProtectedRoute>
        } />
        <Route path="/portfolios" element={
          <ProtectedRoute><Portfolios /></ProtectedRoute>
        } />
        <Route path="/goals" element={
          <ProtectedRoute><Goals /></ProtectedRoute>
        } />
        <Route path="/create-project" element={
          <ProtectedRoute><CreateProject /></ProtectedRoute>
        } />
        <Route path="/help" element={
          <ProtectedRoute><HelpPage /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
