import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Zap, Calculator, FileText, Database, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Prediction', icon: Zap, path: '/prediction' },
  { name: 'Calculator', icon: Calculator, path: '/calculator' },
  { name: 'Reports', icon: FileText, path: '/reports' },
  { name: 'Data Management', icon: Database, path: '/data' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const resetLocation = useLocationStore((state) => state.resetLocation);

  const handleLogout = () => {
    logout();
    resetLocation();
    navigate('/login');
  };

  return (
    <div className="flex flex-col w-64 bg-slate-900 text-white min-h-screen">
      <div className="flex items-center justify-center h-20 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-orange-500 flex items-center gap-2">
          <Zap size={28} />
          SolarPredict
        </h1>
      </div>
      <div className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </div>
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
