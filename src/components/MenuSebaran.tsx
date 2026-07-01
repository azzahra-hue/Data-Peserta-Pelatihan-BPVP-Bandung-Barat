import React, { useState, useMemo } from 'react';
import YearDropdown from './YearDropdown';
import FiltersGroup from './FiltersGroup';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DatabaseState } from '../types';

interface MenuSebaranProps {
  dbState: DatabaseState;
}

export default function MenuSebaran({ dbState }: MenuSebaranProps) {
  const [year, setYear] = useState("Semua");
  const [filters, setFilters] = useState({ jenis: "", kejuruan: "", program: "" });

  const yearSuffix = year !== "Semua" ? year.slice(2) : "";

  // Filter participants based on Year and Dropdown selections
  const availableYears = React.useMemo(() => {
    const years = new Set<string>();
    dbState.participants.forEach(p => {
      if (p.tanggalPelatihan) {
        const match = p.tanggalPelatihan.match(/\d{4}$/) || p.tanggalPelatihan.match(/\d{2}$/);
        if (match) {
          const y = match[0];
          years.add(y.length === 2 ? `20${y}` : y);
        }
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [dbState.participants]);

  const filtered = useMemo(() => {
    return dbState.participants.filter(p => {
      const tp = p.tanggalPelatihan || "";
      const matchesYear = year === "Semua" || tp.startsWith(year) || tp.endsWith(`/${year}`) || tp.endsWith(`/${yearSuffix}`) || tp.endsWith(`-${yearSuffix}`) || tp.includes(year);
      const matchesJenis = !filters.jenis || p.jenisPelatihan === filters.jenis;
      const matchesKejuruan = !filters.kejuruan || p.kejuruan === filters.kejuruan;
      const matchesProgram = !filters.program || p.programPelatihan === filters.program;
      return matchesYear && matchesJenis && matchesKejuruan && matchesProgram;
    });
  }, [dbState.participants, year, yearSuffix, filters]);

  // Calculate dynamic bar chart data from real database
  // Group by Kejuruan
  const chartData = useMemo(() => {
    const kejuruanList = dbState.kejuruanList.length > 0
      ? dbState.kejuruanList.map(k => k.nama)
      : ["Agroindustri", "Pariwisata", "Teknologi Informasi", "Bisnis Manajemen", "Otomotif"];

    return kejuruanList.map(kName => {
      const count = filtered.filter(p => p.kejuruan === kName).length;
      return { kejuruan: kName, total: count };
    });
  }, [dbState.kejuruanList, filtered]);

  // Calculate dynamic table data from real database
  // Group by Program Pelatihan
  const tableData = useMemo(() => {
    const programList = dbState.programs.length > 0
      ? dbState.programs.map(pr => pr.nama)
      : Array.from(new Set(dbState.participants.map(p => p.programPelatihan).filter(Boolean)));

    const computedTableData = programList.map(pName => {
      const count = filtered.filter(p => p.programPelatihan === pName).length;
      return { program: pName, total: count };
    })
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total);

    return computedTableData.length > 0 ? computedTableData : [
      { program: "Belum Ada Peserta untuk Filter Ini", total: 0 }
    ];
  }, [dbState.programs, dbState.participants, filtered]);

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">Profil Sebaran Peserta</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Distribusi peserta berdasarkan kejuruan dan program</p>
        </div>
        <YearDropdown value={year} onChange={setYear} availableYears={availableYears} />
      </div>

      <FiltersGroup filters={filters} setFilters={setFilters} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-[500px] flex flex-col">
          <h3 className="text-lg font-display font-bold text-slate-800 mb-8">Distribusi per Kejuruan</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="kejuruan" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} angle={-45} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={48}>
                  {chartData.map((_, i) => <Cell key={`cell-${i}`} fill={i % 2 === 0 ? "#A8E6CF" : "#D4F0F0"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 h-[500px] flex flex-col overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-[#F3FDF8]/50">
            <h3 className="text-lg font-display font-bold text-teal-950">Rincian Program Pelatihan</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="text-slate-400 font-bold uppercase tracking-wider bg-slate-50 text-[11px]">
                  <th className="px-8 py-5 border-b border-slate-100">Nama Program</th>
                  <th className="px-8 py-5 border-b border-slate-100 text-right">Total Peserta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-800">{row.program}</td>
                    <td className="px-8 py-5 text-right font-bold text-teal-700 text-lg">{row.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
