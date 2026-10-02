import { useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Building2, LayoutDashboard, Users, CalendarDays, Home, UserPlus,
  LogOut, Menu, X,
} from 'lucide-react';

type NavItem = { label: string; icon: ReactNode; page: string };

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-[20px] h-[20px]" strokeWidth={1.5} />, page: 'dashboard' },
  { label: 'Clienti', icon: <Users className="w-[20px] h-[20px]" strokeWidth={1.5} />, page: 'clients' },
  { label: 'Venditori', icon: <UserPlus className="w-[20px] h-[20px]" strokeWidth={1.5} />, page: 'sellers' },
  { label: 'Immobili', icon: <Home className="w-[20px] h-[20px]" strokeWidth={1.5} />, page: 'properties' },
  { label: 'Appuntamenti', icon: <CalendarDays className="w-[20px] h-[20px]" strokeWidth={1.5} />, page: 'appointments' },
];

type Props = {
  currentPage: string;
  onPageChange: (page: string) => void;
  children: ReactNode;
};

export default function Layout({ currentPage, onPageChange, children }: Props) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-40 w-[240px] h-screen bg-white border-r border-[#e5e5e7] flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="w-[36px] h-[36px] bg-[#1d1d1f] rounded-[10px] flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-semibold text-[15px] text-[#1d1d1f]">ImmobiliarePro</h1>
            <p className="text-[#86868b] text-[11px]">Gestionale</p>
          </div>
        </div>

        <nav className="flex-1 px-3 pt-2 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => { onPageChange(item.page); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all ${
                currentPage === item.page
                  ? 'bg-[#0071e3] text-white'
                  : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-5 pt-3 border-t border-[#e5e5e7]">
          <div className="px-3 py-2 mb-1">
            <p className="text-[#86868b] text-[11px]">Account</p>
            <p className="text-[13px] text-[#1d1d1f] truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium text-[#86868b] hover:text-[#ff3b30] hover:bg-[#fff2f0] transition-all"
          >
            <LogOut className="w-[20px] h-[20px]" strokeWidth={1.5} />
            Esci
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-[#e5e5e7] sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="text-[#1d1d1f]">
            <Menu className="w-6 h-6" strokeWidth={1.5} />
          </button>
          <span className="font-semibold text-[15px] text-[#1d1d1f]">ImmobiliarePro</span>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {sidebarOpen && (
        <button onClick={() => setSidebarOpen(false)} className="fixed top-3 right-3 z-50 lg:hidden text-[#1d1d1f]">
          <X className="w-6 h-6" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
