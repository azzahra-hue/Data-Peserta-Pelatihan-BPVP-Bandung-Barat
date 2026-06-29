import { useState } from "react";
import { Participant } from "../types";
import { Users, GraduationCap, Briefcase, Percent, ShieldCheck, MapPin, Search } from "lucide-react";

interface DashboardAnalyticsProps {
  participants: Participant[];
}

export default function DashboardAnalytics({ participants }: DashboardAnalyticsProps) {
  const [annualTarget, setAnnualTarget] = useState<number>(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKejuruanFilter, setSelectedKejuruanFilter] = useState("Semua");

  const totalParticipants = participants.length;
  
  // Calculations
  const lulusList = participants.filter((p) => p.statusKelulusan === "Lulus");
  const totalLulus = lulusList.length;
  
  const tidakLulus = participants.filter((p) => p.statusKelulusan === "Tidak Lulus").length;
  const dalamProses = participants.filter((p) => p.statusKelulusan === "Dalam Proses").length;

  const bekerjaList = participants.filter(
    (p) => p.statusKelulusan === "Lulus" && (p.statusKebekerjaan === "Bekerja" || p.statusKebekerjaan === "Wirausaha")
  );
  const totalBekerja = bekerjaList.length;
  
  const belumBekerja = totalLulus - totalBekerja;

  const disabilitasCount = participants.filter((p) => p.penyandangDisabilitas === "Ya").length;

  // Rates
  const kelulusanRate = totalParticipants > 0 ? Math.round((totalLulus / totalParticipants) * 100) : 0;
  const keterserapanRate = totalLulus > 0 ? Math.round((totalBekerja / totalLulus) * 100) : 0;
  const targetKetercapaian = Math.min(100, Math.round((totalParticipants / annualTarget) * 100));

  // 1. Kejuruan Trends calculations
  const kejuruanCounts: Record<string, { count: number; bekerja: number }> = {};
  participants.forEach((p) => {
    if (!kejuruanCounts[p.kejuruan]) {
      kejuruanCounts[p.kejuruan] = { count: 0, bekerja: 0 };
    }
    kejuruanCounts[p.kejuruan].count += 1;
    if (p.statusKelulusan === "Lulus" && (p.statusKebekerjaan === "Bekerja" || p.statusKebekerjaan === "Wirausaha")) {
      kejuruanCounts[p.kejuruan].bekerja += 1;
    }
  });

  const kejuruanData = Object.entries(kejuruanCounts).map(([name, data]) => ({
    name,
    count: data.count,
    bekerja: data.bekerja,
    rate: data.count > 0 ? Math.round((data.bekerja / data.count) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  // 2. Gender Distribution
  const maleCount = participants.filter(p => p.jenisKelamin === "L").length;
  const femaleCount = participants.filter(p => p.jenisKelamin === "P").length;
  const malePercent = totalParticipants > 0 ? Math.round((maleCount / totalParticipants) * 100) : 0;
  const femalePercent = totalParticipants > 0 ? Math.round((femaleCount / totalParticipants) * 100) : 0;

  // Filter alumni list
  const filteredAlumni = participants.filter((p) => {
    const matchesSearch = p.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.tempatBekerja || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.lokasi || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKejuruan = selectedKejuruanFilter === "Semua" || p.kejuruan === selectedKejuruanFilter;
    return matchesSearch && matchesKejuruan;
  });

  // Unique Kejuruan list for filtering
  const uniqueKejuruan = Array.from(new Set(participants.map(p => p.kejuruan)));

  return (
    <div className="space-y-6" id="dashboard-analytics-root">
      
      {/* 1. Annual Target & Percentage of Achievement Scoreboard */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-md border border-emerald-500/20">
              <Percent className="w-3 h-3" /> Target Ketercapaian Pelatihan
            </span>
            <h2 className="text-2xl font-display font-bold tracking-tight">
              Sistem Pendukung Keputusan BPVP Bandung Barat
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Melacak sasaran strategis, keterserapan industri Lulusan, dan pemetaan sebaran penempatan kerja secara real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 w-full lg:w-auto">
            <div className="flex-1 lg:flex-initial">
              <label className="block text-xs text-slate-400 font-medium mb-1">Set Target Peserta Tahunan</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={annualTarget}
                  onChange={(e) => setAnnualTarget(Math.max(1, parseInt(e.target.value) || 0))}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-24"
                  id="target-input"
                />
                <span className="text-sm text-slate-300">Peserta</span>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-700 hidden sm:block"></div>

            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center w-16 h-16">
                {/* SVG circular progress */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    className="stroke-slate-700"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    className="stroke-emerald-500 transition-all duration-500"
                    strokeWidth="5"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - targetKetercapaian / 100)}
                  />
                </svg>
                <span className="absolute text-xs font-mono font-bold text-emerald-400">{targetKetercapaian}%</span>
              </div>
              <div>
                <div className="text-xl font-mono font-bold text-slate-100">
                  {totalParticipants} <span className="text-xs text-slate-500">/ {annualTarget}</span>
                </div>
                <div className="text-xs text-slate-400">Pencapaian Pelatihan</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CORE SCOREBOARD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="scoreboard-grid">
        
        {/* Total Alumni */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Partisipan</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-mono font-bold text-slate-900" id="stat-total-participants">{totalParticipants}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="text-emerald-500 font-medium">Terintegrasi</span> dengan database pusat
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"></div>
        </div>

        {/* Angka Kelulusan */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kelulusan Alumni</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-mono font-bold text-slate-900" id="stat-graduation-rate">{kelulusanRate}%</h3>
            <p className="text-xs text-slate-500">
              <span className="text-slate-900 font-semibold">{totalLulus}</span> dari {totalParticipants} alumni lulus sertifikasi
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        {/* Angka Penyerapan Kerja */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tingkat Penyerapan Kerja</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-mono font-bold text-slate-900" id="stat-employment-rate">{keterserapanRate}%</h3>
            <p className="text-xs text-slate-500">
              <span className="text-slate-900 font-semibold">{totalBekerja}</span> bekerja / wirausaha dari lulusan
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </div>

        {/* Disabilitas & Gender */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Penyandang Disabilitas</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-mono font-bold text-slate-900" id="stat-disability-count">{disabilitasCount}</h3>
            <p className="text-xs text-slate-500">
              Akses inklusi: L: <span className="font-semibold text-slate-800">{maleCount}</span> | P: <span className="font-semibold text-slate-800">{femaleCount}</span> peserta
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500"></div>
        </div>

      </div>

      {/* 3. CHARTS GRID (Donut & Horisontal Bar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pie / Donut Chart (Status Kelulusan) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-display font-semibold text-slate-900 mb-1">Status Kelulusan & Gender</h3>
            <p className="text-xs text-slate-500 mb-6">Distribusi kelulusan dan representasi inklusif gender.</p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-6 flex-1">
            {/* Donut Graphic */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* Lulus circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  className="stroke-emerald-500"
                  strokeWidth="14"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 60}
                  strokeDashoffset={totalParticipants > 0 ? 2 * Math.PI * 60 * (1 - totalLulus / totalParticipants) : 0}
                />
                {/* Tidak Lulus circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  className="stroke-rose-500"
                  strokeWidth="14"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 60}
                  strokeDashoffset={totalParticipants > 0 ? 2 * Math.PI * 60 * (1 - (totalLulus + tidakLulus) / totalParticipants) : 0}
                  style={{
                    transform: `rotate(${totalParticipants > 0 ? (totalLulus / totalParticipants) * 360 : 0}deg)`,
                    transformOrigin: "center"
                  }}
                />
                {/* Dalam Proses circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  className="stroke-slate-300"
                  strokeWidth="14"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 60}
                  strokeDashoffset={totalParticipants > 0 ? 2 * Math.PI * 60 * (1 - (totalLulus + tidakLulus + dalamProses) / totalParticipants) : 0}
                  style={{
                    transform: `rotate(${totalParticipants > 0 ? ((totalLulus + tidakLulus) / totalParticipants) * 360 : 0}deg)`,
                    transformOrigin: "center"
                  }}
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-mono font-bold text-slate-800">{totalParticipants}</span>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total Alumni</p>
              </div>
            </div>

            {/* Legend Indicators */}
            <div className="w-full grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                <span className="block font-mono font-bold text-emerald-600">{totalLulus}</span>
                <span className="text-[10px] text-emerald-500 font-medium">Lulus</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="block font-mono font-bold text-slate-600">{dalamProses}</span>
                <span className="text-[10px] text-slate-500 font-medium">Dalam Proses</span>
              </div>
              <div className="bg-rose-50 p-2 rounded-lg border border-rose-100">
                <span className="block font-mono font-bold text-rose-600">{tidakLulus}</span>
                <span className="text-[10px] text-rose-500 font-medium">Tidak Lulus</span>
              </div>
            </div>

            {/* Gender Representation */}
            <div className="w-full space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Laki-laki ({maleCount} orang)</span>
                <span>Perempuan ({femaleCount} orang)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full flex overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${malePercent}%` }}></div>
                <div className="h-full bg-rose-400" style={{ width: `${femalePercent}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{malePercent}%</span>
                <span>{femalePercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Pemetaan Tren Kejuruan (Custom Bar Chart) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-display font-semibold text-slate-900 mb-1">Tren Kejuruan Terpopuler</h3>
              <p className="text-xs text-slate-500">Mengidentifikasi program peminat tertinggi & persentase serapan kerja.</p>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-semibold border border-indigo-100">
              {kejuruanData.length} Kejuruan Aktif
            </span>
          </div>

          <div className="space-y-4" id="vocation-bars-container">
            {kejuruanData.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">Belum ada data kejuruan yang terekam.</div>
            ) : (
              kejuruanData.map((item, idx) => {
                // Calculate scale of bar relative to max count
                const maxCount = Math.max(...kejuruanData.map(d => d.count));
                const scaleWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

                return (
                  <div key={item.name} className="space-y-1.5 animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-800 text-ellipsis overflow-hidden whitespace-nowrap max-w-[200px] sm:max-w-xs">{item.name}</span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-slate-600">{item.count} alumni</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {item.rate}% kerja
                        </span>
                      </div>
                    </div>
                    
                    <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${scaleWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* 5. Tracer Study - Sebaran Alumni & Employment Tracking */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm" id="tracer-study-tracker">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-display font-semibold text-slate-900 mb-1">Pelacakan Alumni (Tracer Study Sebaran)</h3>
            <p className="text-xs text-slate-500">Memantau status kebekerjaan alumni, instansi tempat kerja, dan sebaran lokasi penempatan.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, tempat, lokasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filter by Kejuruan */}
            <select
              value={selectedKejuruanFilter}
              onChange={(e) => setSelectedKejuruanFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Kejuruan</option>
              {uniqueKejuruan.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Alumni Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlumni.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
              Alumni tidak ditemukan untuk kata kunci "{searchTerm}".
            </div>
          ) : (
            filteredAlumni.map((p) => {
              const isEmployed = p.statusKebekerjaan === "Bekerja" || p.statusKebekerjaan === "Wirausaha";

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    isEmployed
                      ? "border-emerald-100 bg-emerald-50/10 hover:border-emerald-200 hover:shadow-sm"
                      : "border-slate-100 bg-slate-50/20 hover:border-slate-200 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900">{p.nama}</h4>
                      <p className="text-[10px] text-slate-400">{p.programPelatihan}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold leading-relaxed ${
                      isEmployed 
                        ? "bg-emerald-100 text-emerald-800" 
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {p.statusKebekerjaan}
                    </span>
                  </div>

                  <div className="space-y-2 mt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>Kejuruan: <strong className="text-slate-700 font-medium">{p.kejuruan}</strong></span>
                    </div>

                    {isEmployed ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>Tempat Kerja: <strong className="text-slate-800 font-semibold">{p.tempatBekerja}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                          <span className="capitalize">Lokasi: <strong className="text-slate-800 font-semibold">{p.lokasi}</strong></span>
                        </div>
                      </>
                    ) : (
                      <div className="bg-slate-100/50 p-2 rounded-lg text-[11px] text-slate-500 italic">
                        Belum terserap kerja / Belum melaporkan instansi saat ini.
                      </div>
                    )}
                  </div>
                  
                  {/* Footer address locator */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 truncate">
                    📍 {p.alamat}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
