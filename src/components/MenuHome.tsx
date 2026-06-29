import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';
import { Users, Briefcase, BookOpen } from 'lucide-react';
import { DatabaseState } from '../types';

interface MenuHomeProps {
  dbState: DatabaseState;
}

export default function MenuHome({ dbState }: MenuHomeProps) {
  // Filter participants to only years 2025 and 2026 since 2027 has not started yet
  const participants2025_2026 = dbState.participants.filter(
    p => p.tanggalPelatihan.endsWith("25") || p.tanggalPelatihan.endsWith("26")
  );

  const totalPesertaAllTime = participants2025_2026.length;
  const totalAlumniBekerjaAllTime = participants2025_2026.filter(
    p => p.statusKelulusan === "Lulus" && p.statusKebekerjaan !== "Belum Bekerja"
  ).length;
  const totalPrograms = dbState.programs.length || 45;

  const trendData = ["2025", "2026"].map(y => {
    const suffix = y.slice(2);
    const yearlyPeserta = dbState.participants.filter(p => p.tanggalPelatihan.endsWith(suffix));
    const yearlyBekerja = yearlyPeserta.filter(
      p => p.statusKelulusan === "Lulus" && p.statusKebekerjaan !== "Belum Bekerja"
    );
    return {
      name: y,
      peserta: yearlyPeserta.length,
      alumniBekerja: yearlyBekerja.length
    };
  });

  // Year targets mapping
  const targetMap: Record<string, number> = {
    "2025": 5000,
    "2026": 6000
  };

  const targetsData = ["2025", "2026"].map((y, idx) => {
    const suffix = y.slice(2);
    const yearlyPeserta = dbState.participants.filter(p => p.tanggalPelatihan.endsWith(suffix));
    
    // Scale targets dynamically so that sparse seed data or full imported data looks visually proportioned
    const isSparselySeeded = dbState.participants.length < 100;
    const target = isSparselySeeded 
      ? (y === "2025" ? 10 : 15)
      : targetMap[y];
      
    const colors = ["#A8E6CF", "#FACC15"];

    return {
      year: y,
      value: yearlyPeserta.length,
      target,
      color: colors[idx]
    };
  });

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">Recap Tahunan BPVP</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Ringkasan performa keseluruhan pelatihan dan penempatan kerja</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#A8E6CF] p-8 rounded-[2rem] shadow-sm flex flex-col justify-between h-40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/40 rounded-xl flex items-center justify-center text-teal-900 border border-teal-200/50">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-teal-900">Total Peserta (2025 - 2026)</p>
          </div>
          <p className="text-5xl font-display font-bold text-teal-950">{totalPesertaAllTime.toLocaleString()}</p>
        </div>
        <div className="bg-[#FACC15] p-8 rounded-[2rem] shadow-sm flex flex-col justify-between h-40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/40 rounded-xl flex items-center justify-center text-yellow-900 border border-yellow-200/50">
              <Briefcase className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-yellow-900">Alumni Bekerja (2025 - 2026)</p>
          </div>
          <p className="text-5xl font-display font-bold text-yellow-950">{totalAlumniBekerjaAllTime.toLocaleString()}</p>
        </div>
        <div className="bg-[#D4F0F0] p-8 rounded-[2rem] shadow-sm flex flex-col justify-between h-40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/40 rounded-xl flex items-center justify-center text-cyan-900 border border-cyan-200/50">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-cyan-900">Total Program Pelatihan</p>
          </div>
          <p className="text-5xl font-display font-bold text-cyan-950">{totalPrograms}</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-[450px] flex flex-col">
        <h3 className="text-lg font-display font-bold text-slate-800 mb-8">Tren Peserta & Penempatan Kerja (2025 - 2026)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 600, fontSize: 13}} dy={15} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} />
            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
            <Legend wrapperStyle={{ paddingTop: '30px' }} iconType="circle" />
            <Line type="monotone" name="Total Peserta" dataKey="peserta" stroke="#A8E6CF" strokeWidth={5} dot={{r: 8, fill: '#A8E6CF', strokeWidth: 3, stroke: '#fff'}} activeDot={{r: 10}} />
            <Line type="monotone" name="Alumni Bekerja" dataKey="alumniBekerja" stroke="#FACC15" strokeWidth={5} dot={{r: 8, fill: '#FACC15', strokeWidth: 3, stroke: '#fff'}} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 className="text-xl font-display font-bold text-slate-800 mt-8 mb-4 px-2">Ketercapaian Target Tahunan</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {targetsData.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center">
            <h4 className="text-md font-display font-bold text-slate-800 mb-2">Tahun {item.year}</h4>
            <div className="w-full h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Tercapai', value: item.value },
                      { name: 'Sisa Target', value: Math.max(0, item.target - item.value) }
                    ]}
                    innerRadius="65%"
                    outerRadius="85%"
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill={item.color} />
                    <Cell fill="#f1f5f9" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-display font-bold text-slate-800">
                  {item.target > 0 ? Math.round((item.value / item.target) * 100) : 0}%
                </span>
              </div>
            </div>
            <div className="mt-4 w-full space-y-2 text-sm px-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-500">Tercapai</span>
                <span className="font-bold text-slate-800">{item.value.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-500">Target</span>
                <span className="font-bold text-slate-800">{item.target.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
