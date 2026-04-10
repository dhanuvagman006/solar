import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Prediction from './pages/Prediction';
import Calculator from './pages/Calculator';
import Reports from './pages/Reports';
import DataManagement from './pages/DataManagement';

const MainLayout = ({ children }) => (
  <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
    <Sidebar />
    <div className="flex-1 overflow-y-auto">
      {children}
    </div>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/prediction" element={<MainLayout><Prediction /></MainLayout>} />
          <Route path="/calculator" element={<MainLayout><Calculator /></MainLayout>} />
          <Route path="/reports" element={<MainLayout><Reports /></MainLayout>} />
          <Route path="/data" element={<MainLayout><DataManagement /></MainLayout>} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
