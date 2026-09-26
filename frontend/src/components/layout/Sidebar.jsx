import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  TrendingUp,
  FileSpreadsheet,
  Package,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/followups', label: 'Follow-ups', icon: CalendarCheck },
  { to: '/opportunities', label: 'Opportunities', icon: TrendingUp },
  { to: '/quotations', label: 'Quotations', icon: FileSpreadsheet },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['sales_manager', 'administrator'] },
  { to: '/admin', label: 'Admin Settings', icon: Settings, roles: ['administrator'] },
];

export function Sidebar() {
  const user = useAuthStore((state) => state.user);

  return (
    <aside className="w-[240px] bg-[#1A2E4A] flex-shrink-0 flex flex-col min-h-screen text-white border-r border-[#152438]">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#233B5D]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[6px] bg-[#2B5FAD] flex items-center justify-center text-white font-bold">
            TQ
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide">Sales Manager</h1>
            <p className="text-[10px] text-[#A0AEC0]">Thinqloud Campus</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          if (item.roles && (!user || !item.roles.includes(user.role))) {
            return null;
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#2B5FAD] text-white shadow-sm'
                    : 'text-[#CBD5E1] hover:bg-[#233B5D] hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* AI Assistance Badge Footer */}
      <div className="p-4 mx-3 mb-4 rounded-[6px] bg-[#233B5D]/60 border border-[#2B5FAD]/40">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#60A5FA]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Assistance Active</span>
        </div>
        <p className="text-[11px] text-[#94A3B8] mt-1">
          Strict guardrails enabled. Deterministic calculations enforced.
        </p>
      </div>
    </aside>
  );
}
