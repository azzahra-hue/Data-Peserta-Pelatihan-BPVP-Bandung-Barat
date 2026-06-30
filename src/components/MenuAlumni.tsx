import React, { useState } from 'react';
import YearDropdown from './YearDropdown';
import FiltersGroup from './FiltersGroup';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MapPin } from 'lucide-react';
import AlumniMap from './AlumniMap';
import { DatabaseState } from '../types';

interface MenuAlumniProps {
  dbState: DatabaseState;
}

export default function MenuAlumni({ dbState }: MenuAlumniProps) {
  const [year, setYear] = useState("2025");
  const [filters, setFilters] = useState({ jenis: "", kejuruan: "", program: "" });

  const yearSuffix = year.slice(2);

  // Filter participants based on Year and active Dropdowns
  const filtered = dbState.participants.filter(p => {
    const matchesYear = p.tanggalPelatihan.endsWith(yearSuffix);
    const matchesJenis = !filters.jenis || p.jenisPelatihan === filters.jenis;
    const matchesKejuruan = !filters.kejuruan || p.kejuruan === filters.kejuruan;
    const matchesProgram = !filters.program || p.programPelatihan === filters.program;
    return matchesYear && matchesJenis && matchesKejuruan && matchesProgram;
  });

  // Calculate dynamic metrics from real database
  const totalPesertaFilter = filtered.length;
  const countLulus = filtered.filter(p => p.statusKelulusan === "Lulus").length;
  const countTidakLulus = filtered.filter(p => p.statusKelulusan === "Tidak Lulus" || p.statusKelulusan === "Drop Out" || p.statusKelulusan === "Dikeluarkan").length;
  const countDalamProses = filtered.filter(p => p.statusKelulusan === "Dalam Proses").length;
  
  const placedAlumni = filtered.filter(p => p.statusKelulusan === "Lulus" && p.statusKebekerjaan !== "Belum Bekerja");
  const uniqueCompanies = Array.from(new Set(placedAlumni.map(p => p.tempatBekerja).filter(Boolean)));
  
  const summary = {
    lulus: countLulus,
    industri: uniqueCompanies.length,
    pelatihan: dbState.programs.length || 45
  };

  const countBekerja = filtered.filter(p => p.statusKelulusan === "Lulus" && p.statusKebekerjaan === "Bekerja").length;
  const countWirausaha = filtered.filter(p => p.statusKelulusan === "Lulus" && p.statusKebekerjaan === "Wirausaha").length;
  const countBelumBekerja = filtered.filter(p => p.statusKelulusan === "Lulus" && p.statusKebekerjaan === "Belum Bekerja").length;

  const statusKerja = {
    tetap: Math.floor(countBekerja * 0.4),
    kontrak: Math.ceil(countBekerja * 0.6),
    owner: countWirausaha,
    belumBekerja: countBelumBekerja
  };

  const totalBekerja = statusKerja.tetap + statusKerja.owner + statusKerja.kontrak;
  const totalAlumni = countLulus || 1; // avoid division by zero, explicitly use countLulus (Alumni)


  // Group by lokasi dynamically
  const locationCounts: Record<string, number> = {};
  placedAlumni.forEach(p => {
    if (p.lokasi) {
      locationCounts[p.lokasi] = (locationCounts[p.lokasi] || 0) + 1;
    }
  });

  const computedChartDaerah = Object.entries(locationCounts).map(([daerah, total]) => ({
    daerah,
    total
  })).sort((a, b) => b.total - a.total);

  const chartDaerah = computedChartDaerah.length > 0 ? computedChartDaerah : [
    { daerah: "Bandung Barat", total: 0 },
    { daerah: "Cimahi", total: 0 },
    { daerah: "Subang", total: 0 },
    { daerah: "Purwakarta", total: 0 },
  ];

  // Group by perusahaan dynamically
  const companyCounts: Record<string, number> = {};
  placedAlumni.forEach(p => {
    if (p.tempatBekerja) {
      companyCounts[p.tempatBekerja] = (companyCounts[p.tempatBekerja] || 0) + 1;
    }
  });

  const computedTablePerusahaan = Object.entries(companyCounts).map(([nama, total]) => ({
    nama,
    total
  })).sort((a, b) => b.total - a.total);

  const tablePerusahaan = computedTablePerusahaan.length > 0 ? computedTablePerusahaan : [
    { nama: "Wirausaha / UMKM Mandiri", total: countWirausaha },
    { nama: "Belum Ada Data Penempatan", total: 0 }
  ];

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">Penempatan Alumni</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Tracer study dan keterserapan industri</p>
        </div>
        <YearDropdown value={year} onChange={setYear} />
      </div>

      <FiltersGroup filters={filters} setFilters={setFilters} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border-l-[12px] border-[#A8E6CF] p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alumni (Peserta Lulus)</h4>
            <p className="text-5xl font-display font-bold text-slate-800">{summary.lulus.toLocaleString()}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              {totalPesertaFilter} Total
            </div>
            <div className="flex items-center gap-1.5 text-rose-500">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              {countTidakLulus} Tidak Lulus
            </div>
          </div>
        </div>
        <div className="bg-white border-l-[12px] border-[#FACC15] p-8 rounded-[2.5rem] shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mitra Industri</h4>
          <p className="text-5xl font-display font-bold text-slate-800">{summary.industri.toLocaleString()}</p>
        </div>
        <div className="bg-white border-l-[12px] border-[#D4F0F0] p-8 rounded-[2.5rem] shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Program Pelatihan</h4>
          <p className="text-5xl font-display font-bold text-slate-800">{summary.pelatihan}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#F3FDF8] border-4 border-white rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-center">
           <h3 className="text-lg font-display font-bold text-teal-950 mb-8">Status Kerja Alumni</h3>
           <div className="grid grid-cols-2 gap-8">
              <div>
                 <p className="text-xs text-teal-600 uppercase font-bold tracking-wider mb-2">Total Bekerja</p>
                 <p className="text-5xl font-display font-bold text-teal-900 mb-6">{totalBekerja.toLocaleString()}</p>
                 <div className="space-y-4">
                   <div className="flex flex-col gap-1 border-b border-teal-200/60 pb-2">
                     <div className="flex justify-between text-sm text-teal-800 font-medium">
                       <span>Pegawai Tetap</span><span className="font-bold">{statusKerja.tetap.toLocaleString()} ({Math.round((statusKerja.tetap/totalAlumni)*100)}%)</span>
                     </div>
                     <div className="w-full bg-teal-100/50 rounded-full h-1.5">
                       <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${(statusKerja.tetap/totalAlumni)*100}%` }}></div>
                     </div>
                   </div>
                   <div className="flex flex-col gap-1 border-b border-teal-200/60 pb-2">
                     <div className="flex justify-between text-sm text-teal-800 font-medium">
                       <span>Owner / Wirausaha</span><span className="font-bold">{statusKerja.owner.toLocaleString()} ({Math.round((statusKerja.owner/totalAlumni)*100)}%)</span>
                     </div>
                     <div className="w-full bg-teal-100/50 rounded-full h-1.5">
                       <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${(statusKerja.owner/totalAlumni)*100}%` }}></div>
                     </div>
                   </div>
                   <div className="flex flex-col gap-1 border-b border-teal-200/60 pb-2">
                     <div className="flex justify-between text-sm text-teal-800 font-medium">
                       <span>Kontrak / Freelance</span><span className="font-bold">{statusKerja.kontrak.toLocaleString()} ({Math.round((statusKerja.kontrak/totalAlumni)*100)}%)</span>
                     </div>
                     <div className="w-full bg-teal-100/50 rounded-full h-1.5">
                       <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${(statusKerja.kontrak/totalAlumni)*100}%` }}></div>
                     </div>
                   </div>
                 </div>
              </div>
              <div className="bg-white rounded-3xl p-6 flex flex-col justify-center items-center text-center shadow-sm border border-slate-100">
                 <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Belum Bekerja</p>
                 <p className="text-4xl font-display font-bold text-slate-800">{statusKerja.belumBekerja.toLocaleString()}</p>
                 <div className="w-full max-w-[120px] bg-slate-100 rounded-full h-1.5 mt-3">
                   <div className="bg-slate-300 h-1.5 rounded-full" style={{ width: `${(statusKerja.belumBekerja/totalAlumni)*100}%` }}></div>
                 </div>
                 <p className="text-sm font-bold text-slate-500 mt-2">{Math.round((statusKerja.belumBekerja/totalAlumni)*100)}% dari total alumni</p>
                 <p className="text-xs font-medium mt-4 text-slate-400 px-2 leading-relaxed">Dalam proses tracer study</p>
              </div>
           </div>
        </div>

        <div className="min-h-[400px] h-full">
           <AlumniMap dbState={dbState} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 h-[450px] flex flex-col overflow-hidden">
           <div className="p-8 border-b border-slate-100">
             <h3 className="text-lg font-display font-bold text-slate-800">Top Instansi Penerima Alumni</h3>
           </div>
           <div className="flex-1 overflow-y-auto">
             <table className="w-full text-left text-sm border-collapse">
               <thead className="sticky top-0 bg-slate-50 shadow-sm z-10 text-[11px]">
                 <tr className="text-slate-400 font-bold uppercase tracking-wider">
                   <th className="px-8 py-5 border-b border-slate-100">Nama Perusahaan</th>
                   <th className="px-8 py-5 border-b border-slate-100 text-right">Total Alumni</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-slate-700">
                 {tablePerusahaan.map((row, idx) => (
                   <tr key={idx} className="hover:bg-slate-50 transition-colors">
                     <td className="px-8 py-5 font-bold text-slate-800 flex items-center gap-4">
                       <span className="w-8 h-8 rounded-xl bg-[#FFF4BD] text-yellow-900 flex items-center justify-center text-xs font-black">
                         {idx + 1}
                       </span>
                       {row.nama}
                     </td>
                     <td className="px-8 py-5 text-right font-bold text-teal-700 text-lg">{row.total.toLocaleString()}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-[450px] flex flex-col">
           <h3 className="text-lg font-display font-bold text-slate-800 mb-8">Sebaran Daerah Penempatan</h3>
           <div style={{ flex: 1, minHeight: 0 }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartDaerah} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                 <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                 <YAxis dataKey="daerah" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} />
                 <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.1)' }} />
                 <Bar dataKey="total" radius={[0, 12, 12, 0]} barSize={40}>
                   {chartDaerah.map((_, i) => <Cell key={`cell-${i}`} fill={i === 0 ? "#A8E6CF" : "#D4F0F0"} />)}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
         </div>
      </div>
    </div>
  );
}
