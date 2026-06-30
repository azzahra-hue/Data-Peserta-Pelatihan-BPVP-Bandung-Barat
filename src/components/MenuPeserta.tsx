import React, { useState, useEffect } from 'react';
import { createPortal } from "react-dom";
import YearDropdown from './YearDropdown';
import FiltersGroup from './FiltersGroup';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Participant, DatabaseState } from '../types';
import { Search, Briefcase, MapPin, X, CheckCircle, RefreshCw, User, ClipboardList, AlertTriangle, Settings } from 'lucide-react';
import { 
  saveParticipant, 
  resetParticipantsToDefault,
  saveSettings
} from '../lib/firestore';

export const DEFAULT_PARTICIPANTS: Participant[] = [
  {
    id: "p1",
    jenisPelatihan: "Pelatihan Berbasis Kompetensi (PBK)",
    nama: "Akbar Setiawan",
    statusKelulusan: "Lulus",
    alamat: "Jl. Raya Lembang No. 12, Lembang",
    jenisKelamin: "L",
    tanggalLahir: "14/01/2000",
    usia: 26,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Penyangraian Biji Kopi (Roasting)",
    kejuruan: "Agroindustri",
    tanggalPelatihan: "12-Feb-25",
    statusKebekerjaan: "Belum Bekerja",
    tempatBekerja: "",
    lokasi: ""
  },
  {
    id: "p2",
    jenisPelatihan: "Pelatihan Berbasis Kompetensi (PBK)",
    nama: "Budi Santoso",
    statusKelulusan: "Lulus",
    alamat: "Jl. Kolonel Masturi No. 45, Cimahi",
    jenisKelamin: "L",
    tanggalLahir: "22/05/2001",
    usia: 24,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Barista",
    kejuruan: "Pariwisata",
    tanggalPelatihan: "15-Apr-25",
    statusKebekerjaan: "Bekerja",
    tempatBekerja: "PT. Indofood CBP",
    lokasi: "Bandung Barat"
  },
  {
    id: "p3",
    jenisPelatihan: "Blended Learning",
    nama: "Citra Lestari",
    statusKelulusan: "Lulus",
    alamat: "Jl. Geger Kalong Hilir, Bandung",
    jenisKelamin: "P",
    tanggalLahir: "10/09/2002",
    usia: 23,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Barista",
    kejuruan: "Pariwisata",
    tanggalPelatihan: "10-May-25",
    statusKebekerjaan: "Wirausaha",
    tempatBekerja: "Coffee Shop Citra",
    lokasi: "Bandung"
  },
  {
    id: "p4",
    jenisPelatihan: "Mobile Training Unit (MTU)",
    nama: "Dedi Wijaya",
    statusKelulusan: "Lulus",
    alamat: "Sukasari, Purwakarta",
    jenisKelamin: "L",
    tanggalLahir: "03/11/1963",
    usia: 62,
    kategori: "Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Budidaya Hidroponik",
    kejuruan: "Agroindustri",
    tanggalPelatihan: "02-Jun-25",
    statusKebekerjaan: "Belum Bekerja",
    tempatBekerja: "",
    lokasi: ""
  },
  {
    id: "p5",
    jenisPelatihan: "Pelatihan Berbasis Kompetensi (PBK)",
    nama: "Elina Fitri",
    statusKelulusan: "Lulus",
    alamat: "Cisarua, Bandung Barat",
    jenisKelamin: "P",
    tanggalLahir: "18/07/2006",
    usia: 19,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Desain Grafis",
    kejuruan: "Teknologi Informasi",
    tanggalPelatihan: "20-Aug-25",
    statusKebekerjaan: "Bekerja",
    tempatBekerja: "Eiger Adventure",
    lokasi: "Bandung Barat"
  },
  {
    id: "p6",
    jenisPelatihan: "Pelatihan Berbasis Kompetensi (PBK)",
    nama: "Farhan Ramadhan",
    statusKelulusan: "Lulus",
    alamat: "Cisalak, Subang",
    jenisKelamin: "L",
    tanggalLahir: "25/09/2000",
    usia: 25,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Digital Marketing",
    kejuruan: "Bisnis Manajemen",
    tanggalPelatihan: "10-Jan-26",
    statusKebekerjaan: "Belum Bekerja",
    tempatBekerja: "",
    lokasi: ""
  },
  {
    id: "p7",
    jenisPelatihan: "Blended Learning",
    nama: "Githa Amelia",
    statusKelulusan: "Lulus",
    alamat: "Jl. Dustira No. 8, Cimahi",
    jenisKelamin: "P",
    tanggalLahir: "12/12/2003",
    usia: 22,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Digital Marketing",
    kejuruan: "Bisnis Manajemen",
    tanggalPelatihan: "15-Mar-26",
    statusKebekerjaan: "Wirausaha",
    tempatBekerja: "Toko Online Githa",
    lokasi: "Cimahi"
  },
  {
    id: "p8",
    jenisPelatihan: "Mobile Training Unit (MTU)",
    nama: "Hendra Gunawan",
    statusKelulusan: "Lulus",
    alamat: "Parongpong, Bandung Barat",
    jenisKelamin: "L",
    tanggalLahir: "05/04/1961",
    usia: 65,
    kategori: "Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Budidaya Hidroponik",
    kejuruan: "Agroindustri",
    tanggalPelatihan: "12-May-26",
    statusKebekerjaan: "Wirausaha",
    tempatBekerja: "Kebun Hidroponik Hendra",
    lokasi: "Bandung Barat"
  },
  {
    id: "p9",
    jenisPelatihan: "Pelatihan Berbasis Kompetensi (PBK)",
    nama: "Indah Permatasari",
    statusKelulusan: "Lulus",
    alamat: "Cihampelas, Bandung",
    jenisKelamin: "P",
    tanggalLahir: "30/08/2004",
    usia: 21,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Barista",
    kejuruan: "Pariwisata",
    tanggalPelatihan: "14-Jul-26",
    statusKebekerjaan: "Bekerja",
    tempatBekerja: "Kopi Kenangan",
    lokasi: "Bandung"
  },
  {
    id: "p10",
    jenisPelatihan: "Pelatihan Berbasis Kompetensi (PBK)",
    nama: "Joko Susilo",
    statusKelulusan: "Dalam Proses",
    alamat: "Jatiluhur, Purwakarta",
    jenisKelamin: "L",
    tanggalLahir: "11/02/1991",
    usia: 35,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Tata Boga",
    kejuruan: "Pariwisata",
    tanggalPelatihan: "18-Sep-26",
    statusKebekerjaan: "Belum Bekerja",
    tempatBekerja: "",
    lokasi: ""
  },
  {
    id: "p11",
    jenisPelatihan: "Blended Learning",
    nama: "Kartika Sari",
    statusKelulusan: "Tidak Lulus",
    alamat: "Kalijati, Subang",
    jenisKelamin: "P",
    tanggalLahir: "29/10/1997",
    usia: 28,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Desain Grafis",
    kejuruan: "Teknologi Informasi",
    tanggalPelatihan: "10-Feb-27",
    statusKebekerjaan: "Belum Bekerja",
    tempatBekerja: "",
    lokasi: ""
  },
  {
    id: "p12",
    jenisPelatihan: "Pelatihan Berbasis Kompetensi (PBK)",
    nama: "Lutfi Hakim",
    statusKelulusan: "Lulus",
    alamat: "Ngamprah, Bandung Barat",
    jenisKelamin: "L",
    tanggalLahir: "07/06/2002",
    usia: 24,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Ya",
    programPelatihan: "Desain Grafis",
    kejuruan: "Teknologi Informasi",
    tanggalPelatihan: "05-May-27",
    statusKebekerjaan: "Bekerja",
    tempatBekerja: "Pikiran Rakyat",
    lokasi: "Bandung Barat"
  },
  {
    id: "p13",
    jenisPelatihan: "Mobile Training Unit (MTU)",
    nama: "Mega Utami",
    statusKelulusan: "Lulus",
    alamat: "Cibeureum, Cimahi",
    jenisKelamin: "P",
    tanggalLahir: "25/03/1999",
    usia: 27,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Tata Boga",
    kejuruan: "Pariwisata",
    tanggalPelatihan: "12-Jun-27",
    statusKebekerjaan: "Belum Bekerja",
    tempatBekerja: "",
    lokasi: ""
  },
  {
    id: "p14",
    jenisPelatihan: "Pelatihan Berbasis Kompetensi (PBK)",
    nama: "Novi Anggraeni",
    statusKelulusan: "Lulus",
    alamat: "Padalarang, Bandung Barat",
    jenisKelamin: "P",
    tanggalLahir: "14/04/1966",
    usia: 60,
    kategori: "Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Tata Boga",
    kejuruan: "Pariwisata",
    tanggalPelatihan: "19-Aug-27",
    statusKebekerjaan: "Wirausaha",
    tempatBekerja: "Catering Novi",
    lokasi: "Bandung Barat"
  },
  {
    id: "p15",
    jenisPelatihan: "Pelatihan Berbasis Kompetensi (PBK)",
    nama: "Oki Prasetyo",
    statusKelulusan: "Lulus",
    alamat: "Ciseureuh, Purwakarta",
    jenisKelamin: "L",
    tanggalLahir: "24/09/2001",
    usia: 25,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Digital Marketing",
    kejuruan: "Bisnis Manajemen",
    tanggalPelatihan: "10-Nov-27",
    statusKebekerjaan: "Bekerja",
    tempatBekerja: "PT. Pos Indonesia",
    lokasi: "Purwakarta"
  }
];

interface MenuPesertaProps {
  dbState: DatabaseState;
}

export default function MenuPeserta({ dbState }: MenuPesertaProps) {
  const participants = dbState.participants;
  const [year, setYear] = useState("2025");
  const [filters, setFilters] = useState({ jenis: "", kejuruan: "", program: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Settings state
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [input2025, setInput2025] = useState(dbState.settings?.target2025 ?? 5000);
  const [input2026, setInput2026] = useState(dbState.settings?.target2026 ?? 6000);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (dbState.settings && !isEditingSettings) {
      setInput2025(dbState.settings.target2025);
      setInput2026(dbState.settings.target2026);
    }
  }, [dbState.settings?.target2025, dbState.settings?.target2026, isEditingSettings]);

  // Edit State for Quick Updater
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [newStatus, setNewStatus] = useState<Participant['statusKebekerjaan']>("Belum Bekerja");
  const [newTempat, setNewTempat] = useState("");
  const [newLokasi, setNewLokasi] = useState("");

  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Reset database to default in Firestore
  const handleResetDb = async () => {
    setShowConfirmReset(true);
  };

  const executeResetDb = async () => {
    try {
      await resetParticipantsToDefault(DEFAULT_PARTICIPANTS);
      showToast("Data peserta berhasil direset ke bawaan di Cloud Firestore!");
    } catch (err) {
      showToast("Gagal mereset data.");
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle Quick Status Update Submission using Firestore
  const handleStatusUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;

    const updatedParticipant: Participant = {
      ...editingParticipant,
      statusKebekerjaan: newStatus,
      tempatBekerja: newStatus === "Belum Bekerja" ? "" : newTempat,
      lokasi: newStatus === "Belum Bekerja" ? "" : newLokasi
    };

    try {
      await saveParticipant(updatedParticipant);
      setEditingParticipant(null);
      showToast(`Berhasil memperbarui status kebekerjaan ${editingParticipant.nama} di Cloud Firestore!`);
    } catch (err) {
      showToast("Gagal memperbarui status.");
    }
  };

  // Open Edit Modal Helper
  const openStatusEdit = (p: Participant) => {
    setEditingParticipant(p);
    setNewStatus(p.statusKebekerjaan);
    setNewTempat(p.tempatBekerja || "");
    setNewLokasi(p.lokasi || "");
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveSettings({
        target2025: Number(input2025),
        target2026: Number(input2026)
      });
      setIsEditingSettings(false);
      showToast("Target berhasil diperbarui & disimpan ke Cloud!");
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter participants based on Year, Dropdowns, and Search
  const filteredParticipants = participants.filter(p => {
    // Year filter (matches las 2 digits of the year in training date)
    const yearSuffix = year.slice(2);
    const matchesYear = p.tanggalPelatihan.endsWith(yearSuffix);

    // Filter dropdowns
    const matchesJenis = !filters.jenis || p.jenisPelatihan === filters.jenis;
    const matchesKejuruan = !filters.kejuruan || p.kejuruan === filters.kejuruan;
    const matchesProgram = !filters.program || p.programPelatihan === filters.program;

    // Search bar
    const matchesSearch = !searchQuery || 
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.programPelatihan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tempatBekerja && p.tempatBekerja.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status kebekerjaan filter
    const matchesStatus = statusFilter === "Semua" || p.statusKebekerjaan === statusFilter;

    return matchesYear && matchesJenis && matchesKejuruan && matchesProgram && matchesSearch && matchesStatus;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [year, filters, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredParticipants.length / pageSize);
  const paginatedParticipants = filteredParticipants.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Calculate stats dynamically from actual live filtered participants
  const totalLive = filteredParticipants.length;
  const targetPeserta = year === "2025" ? (dbState.settings?.target2025 ?? 5000) : year === "2026" ? (dbState.settings?.target2026 ?? 6000) : 7000;
  const progressPercentage = targetPeserta > 0 ? Math.round((totalLive / targetPeserta) * 100) : 0;

  const progressData = [
    { name: "Tercapai", value: totalLive },
    { name: "Sisa Target", value: Math.max(0, targetPeserta - totalLive) }
  ];
  const COLORS = ["#A8E6CF", "#f1f5f9"];

  // Secondary counts
  const lansiaCount = filteredParticipants.filter(p => p.usia >= 60).length;
  const maleCount = filteredParticipants.filter(p => p.jenisKelamin === "L").length;
  const femaleCount = filteredParticipants.filter(p => p.jenisKelamin === "P").length;
  const disabilitasCount = filteredParticipants.filter(p => p.penyandangDisabilitas === "Ya").length;

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 border border-slate-700 animate-slide-in">
          <CheckCircle className="w-5 h-5 text-[#A8E6CF]" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">Data & Tracer Study Peserta</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Pemantauan realisasi peserta, kelulusan, dan status kebekerjaan alumni</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <YearDropdown value={year} onChange={setYear} />
          <button 
            onClick={handleResetDb} 
            className="p-3 bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-2xl border border-slate-200/50 shadow-xs transition-colors flex items-center justify-center gap-1.5"
            title="Reset data default"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">Reset Data</span>
          </button>
        </div>
      </div>

      <FiltersGroup filters={filters} setFilters={setFilters} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Card */}
        <div className="col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[300px] relative">
          <button
            onClick={() => setIsEditingSettings(true)}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            title="Sesuaikan Target"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div className="text-center mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Peserta (Tahun {year})</h3>
            <p className="text-4xl font-display font-bold text-slate-800">{targetPeserta.toLocaleString()}</p>
          </div>
          
          <div className="relative w-48 h-48 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={progressData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  {progressData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(val: number) => val.toLocaleString()} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.1)'}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-400 font-bold text-center leading-tight mb-0.5">Aktif</span>
              <span className="text-lg font-display font-bold text-slate-800">{totalLive}</span>
              <div className="mt-2 w-12 h-12 bg-[#D4F0F0] rounded-full flex items-center justify-center border-4 border-white shadow-md">
                <span className="text-xs font-bold text-teal-900">{progressPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border-4 border-[#D4F0F0] rounded-[2rem] p-6 flex flex-col justify-center shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Peserta Filter Terpilih</h3>
            <p className="text-4xl font-display font-bold text-teal-950">{totalLive}</p>
            <span className="text-[10px] text-slate-400 font-medium mt-1">Sesuai filter & tahun pelatihan aktif</span>
          </div>
          <div className="bg-[#D4F0F0] rounded-[2rem] p-6 flex flex-col justify-center shadow-sm text-teal-900">
            <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">Lansia (Usia &gt;= 60)</h3>
            <p className="text-4xl font-display font-bold">{lansiaCount}</p>
            <span className="text-[10px] text-teal-700 font-medium mt-1">Inklusi program ramah lansia</span>
          </div>
          <div className="bg-[#A8E6CF] rounded-[2rem] p-6 flex flex-col justify-center shadow-sm text-teal-950">
            <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">Total Laki-Laki</h3>
            <p className="text-4xl font-display font-bold">{maleCount}</p>
            <span className="text-[10px] text-teal-700/80 font-medium mt-1">Partisipasi gender L</span>
          </div>
          <div className="bg-[#FACC15] rounded-[2rem] p-6 flex flex-col justify-center shadow-sm text-yellow-950">
            <h3 className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-1">Total Perempuan</h3>
            <p className="text-4xl font-display font-bold">{femaleCount}</p>
            <span className="text-[10px] text-yellow-800 font-medium mt-1">Partisipasi gender P</span>
          </div>
          <div className="bg-[#FFF4BD] rounded-[2rem] p-6 flex flex-col justify-center shadow-sm text-yellow-950 sm:col-span-2">
            <h3 className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-1">Penyandang Disabilitas</h3>
            <p className="text-4xl font-display font-bold">{disabilitasCount}</p>
            <span className="text-[10px] text-yellow-700 font-medium mt-1">Inklusi disabilitas aktif</span>
          </div>
        </div>
      </div>

      {/* Live Participant Table & Quick Update Section */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-[#F3FDF8]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-slate-800">Daftar Detail & Tracer Study Peserta</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Kelola data peserta pelatihan dan perbarui status kebekerjaan alumni</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 sm:flex-initial min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, program, atau instansi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Employment Status Selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-medium text-slate-700 cursor-pointer"
            >
              <option value="Semua">Semua Status Kebekerjaan</option>
              <option value="Belum Bekerja">Belum Bekerja</option>
              <option value="Bekerja">Bekerja</option>
              <option value="Wirausaha">Wirausaha</option>
            </select>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/60 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Detail Vokasi</th>
                <th className="px-6 py-4">Gender / Usia</th>
                <th className="px-6 py-4">Alamat Domisili</th>
                <th className="px-6 py-4">Status Kerja Alumni</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedParticipants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    Tidak ada data peserta yang cocok dengan kriteria pencarian dan filter aktif.
                  </td>
                </tr>
              ) : (
                paginatedParticipants.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                          {p.nama.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-snug">{p.nama}</p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{p.jenisPelatihan}</p>
                        </div>
                      </div>
                    </td>

                    {/* Vokasi Details */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-700 leading-snug">{p.programPelatihan}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Kejuruan: <span className="font-bold text-slate-500">{p.kejuruan}</span></p>
                    </td>

                    {/* Gender & Age */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.jenisKelamin === "L" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}>
                          {p.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{p.usia} tahun</span>
                      </div>
                      {p.usia >= 60 && <span className="block text-[10px] text-amber-600 font-bold mt-1">✓ Kelompok Lansia</span>}
                    </td>

                    {/* Address */}
                    <td className="px-6 py-4 text-xs font-medium text-slate-400 max-w-[180px] truncate" title={p.alamat}>
                      {p.alamat}
                    </td>

                    {/* Employment Status Badge */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2.5 py-1 rounded-xl text-xs font-bold border ${
                          p.statusKebekerjaan === "Bekerja" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          p.statusKebekerjaan === "Wirausaha" ? "bg-amber-50 text-amber-700 border-amber-100" :
                          "bg-slate-50 text-slate-500 border-slate-100"
                        }`}>
                          {p.statusKebekerjaan}
                        </span>
                        {p.tempatBekerja && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 font-semibold">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[150px]" title={`${p.tempatBekerja} (${p.lokasi})`}>
                              {p.tempatBekerja} ({p.lokasi})
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openStatusEdit(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-xs font-bold text-slate-600 rounded-xl transition-all"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Pagination UI */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-500 font-medium">
                Menampilkan <span className="font-bold text-slate-700">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-bold text-slate-700">{Math.min(currentPage * pageSize, filteredParticipants.length)}</span> dari <span className="font-bold text-slate-700">{filteredParticipants.length}</span> peserta
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <div className="flex items-center gap-1 px-2">
                  <span className="text-xs font-bold text-slate-700">{currentPage}</span>
                  <span className="text-xs font-medium text-slate-400">/ {totalPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QUICK STATUS UPDATE MODAL */}
      {editingParticipant && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-8 p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full flex flex-col p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-slate-800 text-lg">Update Status Kerja Alumni</h3>
                <p className="text-xs text-slate-500 mt-1">Atur data penempatan kerja untuk <strong>{editingParticipant.nama}</strong></p>
              </div>
              <button 
                onClick={() => setEditingParticipant(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusUpdateSubmit} className="space-y-4">
              {/* Status Selector */}
              <div>
                <label className="block text-xs text-slate-500 font-bold uppercase mb-1.5">Status Kebekerjaan *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Belum Bekerja', 'Bekerja', 'Wirausaha'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setNewStatus(status);
                        if (status === "Belum Bekerja") {
                          setNewTempat("");
                          setNewLokasi("");
                        }
                      }}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        newStatus === status
                          ? "bg-emerald-500 border-transparent text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Inputs */}
              {newStatus !== "Belum Bekerja" && (
                <div className="space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-xs text-slate-500 font-bold uppercase mb-1">
                      {newStatus === "Wirausaha" ? "Nama Usaha / Bisnis *" : "Nama Instansi / Perusahaan *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={newTempat}
                      onChange={(e) => setNewTempat(e.target.value)}
                      placeholder={newStatus === "Wirausaha" ? "Contoh: Coffee Shop Sejahtera" : "Contoh: PT. Indofood CBP"}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 font-bold uppercase mb-1">Lokasi (Kota / Kabupaten) *</label>
                    <input
                      type="text"
                      required
                      value={newLokasi}
                      onChange={(e) => setNewLokasi(e.target.value)}
                      placeholder="Contoh: Bandung Barat"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingParticipant(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}

      {showConfirmReset && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-8 z-[1000] animate-fade-in px-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full border border-slate-100 shadow-2xl animate-scale-up">
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-display font-bold text-slate-800">Setel Ulang Data Peserta?</h4>
                <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-semibold">
                  Apakah Anda yakin ingin menyetel ulang semua data peserta ke data bawaan? Tindakan ini akan mengembalikan data default di Cloud Firestore dan menghapus perubahan manual.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8 border-t border-slate-100 pt-5">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  executeResetDb();
                  setShowConfirmReset(false);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all active:scale-95 cursor-pointer focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
              >
                Reset Sekarang
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {isEditingSettings && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-8 z-[1500] animate-fade-in px-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full border border-slate-100 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-display font-bold text-slate-800">Sesuaikan Target</h4>
                  <p className="text-xs font-semibold text-slate-400">Target peserta tahunan BPVP</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditingSettings(false);
                  setInput2025(dbState.settings?.target2025 ?? 5000);
                  setInput2026(dbState.settings?.target2026 ?? 6000);
                }}
                className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings}>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Target Tahun 2025</label>
                  <input 
                    type="number"
                    min="1"
                    value={input2025}
                    onChange={(e) => setInput2025(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Target Tahun 2026</label>
                  <input 
                    type="number"
                    min="1"
                    value={input2026}
                    onChange={(e) => setInput2026(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingSettings(false);
                    setInput2025(dbState.settings?.target2025 ?? 5000);
                    setInput2026(dbState.settings?.target2026 ?? 6000);
                  }}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
                  disabled={isSaving}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
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
