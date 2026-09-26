import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, UserCircle, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/useUIStore';
import { Badge } from '../ui/Badge';

export function TopBar() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabels = {
    sales_executive: 'Sales Executive',
    sales_manager: 'Sales Manager',
    administrator: 'Administrator',
  };

  return (
    <header className="h-16 bg-white border-b border-[#D1D9E6] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 text-[#6B7C93] hover:text-[#1F2937] hover:bg-gray-100 rounded-[6px] md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-xs font-mono text-[#6B7C93] hidden sm:block">Sales Manager CRM v1.0</span>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-[#1F2937]">{user.name}</div>
              <div className="text-xs text-[#6B7C93]">{user.email}</div>
            </div>
            <Badge
              status={user.role === 'sales_manager' ? 'Qualified' : user.role === 'administrator' ? 'High' : 'New'}
              label={roleLabels[user.role] || user.role}
            />
          </div>
        )}

        <button
          onClick={handleLogout}
          className="p-2 text-[#6B7C93] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-[6px] transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
