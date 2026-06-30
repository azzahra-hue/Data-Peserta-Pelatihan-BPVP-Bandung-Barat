import React, { useState, useEffect } from 'react';
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';
import { Users, Briefcase, BookOpen, Sliders, Settings, Check, X } from 'lucide-react';
import { DatabaseState } from '../types';
import { saveSettings } from '../lib/firestore';

interface MenuHomeProps {
  dbState: DatabaseState;
}

export default function MenuHome({ dbState }: MenuHomeProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Local state for target inputs, synchronized with dbState.settings
  const [input2025, setInput2025] = useState(dbState.settings?.target2025 ?? 5000);
  const [input2026, setInput2026] = useState(dbState.settings?.target2026 ?? 6000);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Keep inputs updated when dbState.settings is loaded (only when not editing)
  useEffect(() => {
    if (dbState.settings && !isEditing) {
      setInput2025(dbState.settings.target2025);
      setInput2026(dbState.settings.target2026);
    }
  }, [dbState.settings?.target2025, dbState.settings?.target2026, isEditing]);

  const handleOpenEdit = () => {
    if (dbState.settings) {
      setInput2025(dbState.settings.target2025);
      setInput2026(dbState.settings.target2026);
    }
    setIsEditing(true);
  };

  // Filter participants to active years (2025, 2026)
  const activeParticipants = dbState.participants.filter(p => {
    if (!p.tanggalPelatihan) return false;
    return p.tanggalPelatihan.endsWith("25") || 
           p.tanggalPelatihan.endsWith("26") || 
           p.tanggalPelatihan.includes("2025") ||
           p.tanggalPelatihan.includes("2026");
  });

  const totalPesertaAllTime = activeParticipants.length;
  const totalAlumniBekerjaAllTime = activeParticipants.filter(
    p => p.statusKelulusan === "Lulus" && p.statusKebekerjaan !== "Belum Bekerja"
  ).length;
  const totalPrograms = dbState.programs.length || 45;

  const trendData = ["2025", "2026"].map(y => {
    const suffix = y.slice(2);
    const yearlyPeserta = dbState.participants.filter(p => {
      if (!p.tanggalPelatihan) return false;
      return p.tanggalPelatihan.endsWith(suffix) || p.tanggalPelatihan.includes(y);
    });
    const yearlyBekerja = yearlyPeserta.filter(
      p => p.statusKelulusan === "Lulus" && p.statusKebekerjaan !== "Belum Bekerja"
    );
    return {
      name: y,
      peserta: yearlyPeserta.length,
      alumniBekerja: yearlyBekerja.length
    };
  });

  // Target values defined by settings or defaults
  const target2025 = dbState.settings?.target2025 ?? 5000;
  const target2026 = dbState.settings?.target2026 ?? 6000;

  const targetMap: Record<string, number> = {
    "2025": target2025,
    "2026": target2026
  };

  const targetsData = ["2025", "2026"].map((y, idx) => {
    const suffix = y.slice(2);
    const yearlyPeserta = dbState.participants.filter(p => {
      if (!p.tanggalPelatihan) return false;
      return p.tanggalPelatihan.endsWith(suffix) || p.tanggalPelatihan.includes(y);
    });
    
    const target = targetMap[y];
    const colors = ["#A8E6CF", "#FACC15", "#38BDF8"];

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
        <div style={{ flex: 1, minHeight: 0 }}>
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
      </div>

      <div className="flex justify-between items-center mt-8 mb-4 px-2">
        <h3 className="text-xl font-display font-bold text-slate-800">Ketercapaian Target Tahunan</h3>
        <button
          onClick={handleOpenEdit}
          className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          <Sliders className="w-3.5 h-3.5" />
          Sesuaikan Target
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {isEditing && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-8 z-[1500] animate-fade-in px-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full border border-slate-100 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <Settings className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <h4 className="text-lg font-display font-bold text-slate-800">Sesuaikan Target</h4>
                  <p className="text-xs font-semibold text-slate-400">Target peserta tahunan BPVP</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSaving(true);
              try {
                await saveSettings({
                  target2025: Number(input2025),
                  target2026: Number(input2026)
                });
                setSaveSuccess(true);
                setTimeout(() => {
                  setSaveSuccess(false);
                  setIsEditing(false);
                }, 1500);
              } catch (err) {
                console.error(err);
              } finally {
                setIsSaving(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Target Tahun 2025</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={input2025}
                  onChange={(e) => setInput2025(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Target Tahun 2026</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={input2026}
                  onChange={(e) => setInput2026(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {saveSuccess && (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs font-bold animate-fade-in">
                  <Check className="w-4 h-4" />
                  Target berhasil diperbarui & disimpan ke Cloud!
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving || saveSuccess}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Target"}
                </button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
