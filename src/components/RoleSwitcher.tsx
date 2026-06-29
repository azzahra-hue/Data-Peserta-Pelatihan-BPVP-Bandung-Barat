import { UserRole } from "../types";
import { Shield, FileSpreadsheet, Layers, Briefcase } from "lucide-react";

interface RoleSwitcherProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
}

export default function RoleSwitcher({ currentRole, onChangeRole }: RoleSwitcherProps) {
  const rolesInfo = [
    {
      role: "Kepala Unit Kerja" as UserRole,
      label: "Kepala Unit Kerja",
      desc: "Evaluasi program makro, keputusan strategis, & keterserapan industri.",
      icon: Shield,
      color: "border-indigo-500 text-indigo-600 bg-indigo-50/50",
      activeColor: "bg-indigo-600 text-white shadow-indigo-200"
    },
    {
      role: "Sekretaris" as UserRole,
      label: "Sekretaris",
      desc: "Manajemen data, integrasi Google Sheets, & efisiensi operasional.",
      icon: FileSpreadsheet,
      color: "border-emerald-500 text-emerald-600 bg-emerald-50/50",
      activeColor: "bg-emerald-600 text-white shadow-emerald-200"
    },
    {
      role: "Sub Koordinator" as UserRole,
      label: "Sub Koordinator",
      desc: "Penyusunan kurikulum, daftar kejuruan, & target ketercapaian peserta.",
      icon: Layers,
      color: "border-amber-500 text-amber-600 bg-amber-50/50",
      activeColor: "bg-amber-600 text-white shadow-amber-200"
    },
    {
      role: "Pengantar Kerja" as UserRole,
      label: "Pengantar Kerja",
      desc: "Pelacakan alumni (tracer study), pemantauan lokasi kerja, & rekrutmen.",
      icon: Briefcase,
      color: "border-sky-500 text-sky-600 bg-sky-50/50",
      activeColor: "bg-sky-600 text-white shadow-sky-200"
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-6" id="role-switcher-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-display font-semibold text-slate-900">Pilih Peran Pengguna (Role Switcher)</h2>
          <p className="text-sm text-slate-500">Sesuaikan dasbor dan hak akses sesuai dengan fungsi kerja Anda saat ini.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 self-start md:self-auto">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Database Terintegrasi (Online)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {rolesInfo.map((info) => {
          const Icon = info.icon;
          const isActive = currentRole === info.role;

          return (
            <button
              key={info.role}
              id={`role-btn-${info.role.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => onChangeRole(info.role)}
              className={`text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                isActive
                  ? `${info.activeColor} border-transparent shadow-lg scale-[1.02] z-10`
                  : "border-slate-100 bg-slate-50/30 hover:bg-slate-50 hover:border-slate-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg ${isActive ? "bg-white/20" : "bg-slate-100 text-slate-700"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm ${isActive ? "text-white" : "text-slate-800"}`}>
                    {info.label}
                  </h3>
                  <p className={`text-xs mt-1 leading-relaxed ${isActive ? "text-white/85" : "text-slate-500"}`}>
                    {info.desc}
                  </p>
                </div>
              </div>
              
              {/* Background accent decor */}
              <div className={`absolute -right-6 -bottom-6 w-16 h-16 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-125 ${
                isActive ? "bg-white" : "bg-slate-900"
              }`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
