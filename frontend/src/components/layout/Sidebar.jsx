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
  X,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/useUIStore';

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
  const { sidebarOpen, closeSidebar } = useUIStore();

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-[240px] bg-[#1A2E4A] flex-shrink-0 flex flex-col min-h-screen text-white border-r border-[#152438] transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#233B5D]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[6px] bg-[#2B5FAD] flex items-center justify-center text-white font-bold">
              SM
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide">Sales Manager</h1>
              <p className="text-[10px] text-[#A0AEC0]">B2B Sales CRM</p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="md:hidden text-[#A0AEC0] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
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
              onClick={() => {
                // Close sidebar on navigation on mobile
                if (window.innerWidth < 768) {
                  closeSidebar();
                }
              }}
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
    </>
  );
}
