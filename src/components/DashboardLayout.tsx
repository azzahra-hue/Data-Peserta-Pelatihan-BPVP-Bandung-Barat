import React, { useState } from 'react';
import { Home, Users, BarChart2, Briefcase, LogOut, Menu, X, Building2, Database } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  activeMenu: string;
  onMenuChange: (m: string) => void;
  onLogout: () => void;
}

export default function DashboardLayout({ children, activeMenu, onMenuChange, onLogout }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navs = [
    { id: 'home', label: 'Home Recap', icon: <Home className="w-5 h-5" /> },
    { id: 'peserta', label: 'Peserta Pelatihan', icon: <Users className="w-5 h-5" /> },
    { id: 'sebaran', label: 'Profil Sebaran', icon: <BarChart2 className="w-5 h-5" /> },
    { id: 'alumni', label: 'Penempatan Alumni', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'import', label: 'Manajemen Data', icon: <Database className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#A8E6CF] flex items-center justify-center text-teal-800 shrink-0 shadow-sm border border-[#91c9b4]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-slate-800 text-lg leading-tight">BPVP Bandung Barat</h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Portal Data Vokasi</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navs.map(n => (
            <button
              key={n.id}
              onClick={() => onMenuChange(n.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                activeMenu === n.id 
                  ? "bg-[#F3FDF8] text-teal-800 shadow-sm border border-[#A8E6CF]/30" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className={activeMenu === n.id ? "text-teal-600" : "text-slate-400"}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors">
            <LogOut className="w-5 h-5" /> Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A8E6CF] flex items-center justify-center text-teal-800"><Building2 className="w-6 h-6" /></div>
            <h1 className="font-display font-bold text-slate-800 text-lg">BPVP Bandung Barat</h1>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-slate-600 bg-slate-100 rounded-xl">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile menu overlay */}
        {mobileOpen && (
          <div className="md:hidden absolute inset-0 top-[73px] bg-white z-30 flex flex-col border-t border-slate-100 animate-fade-in">
            <nav className="flex-1 p-4 space-y-2">
              {navs.map(n => (
                <button
                  key={n.id}
                  onClick={() => { onMenuChange(n.id); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-base font-bold transition-all ${activeMenu === n.id ? "bg-[#F3FDF8] text-teal-800 border border-[#A8E6CF]/30" : "text-slate-500"}`}
                >
                  <span className={activeMenu === n.id ? "text-teal-600" : "text-slate-400"}>{n.icon}</span>
                  {n.label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-100">
              <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl text-base font-bold text-rose-600 bg-rose-50 border border-rose-100">
                <LogOut className="w-5 h-5" /> Keluar
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
