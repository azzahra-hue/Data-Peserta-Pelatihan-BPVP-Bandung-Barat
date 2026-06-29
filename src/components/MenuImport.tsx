import React, { useState, useEffect } from 'react';
import { CheckCircle, Link2, Database, FileSpreadsheet } from 'lucide-react';
import { gapi } from 'gapi-script';
import { initAuth, googleSignIn, getAccessToken } from '../lib/auth';
import DatabaseTables from './DatabaseTables';
import { DEFAULT_PARTICIPANTS } from './MenuPeserta';
import { DatabaseState, Participant, TrainingType, Kejuruan, ProgramPelatihan } from '../types';

export const DEFAULT_TRAINING_TYPES: TrainingType[] = [
  { id: "t1", nama: "Pelatihan Berbasis Kompetensi (PBK)", deskripsi: "Pelatihan kerja berbasis standar kompetensi kerja nasional" },
  { id: "t2", nama: "Mobile Training Unit (MTU)", deskripsi: "Pelatihan keliling untuk menjangkau pelosok desa" },
  { id: "t3", nama: "Blended Learning", deskripsi: "Kombinasi pelatihan daring dan luring" }
];

export const DEFAULT_KEJURUAN: Kejuruan[] = [
  { id: "k1", nama: "Agroindustri" },
  { id: "k2", nama: "Pariwisata" },
  { id: "k3", nama: "Teknologi Informasi" },
  { id: "k4", nama: "Bisnis Manajemen" }
];

export const DEFAULT_PROGRAMS: ProgramPelatihan[] = [
  { id: "pr1", nama: "Penyangraian Biji Kopi (Roasting)", kejuruan: "Agroindustri" },
  { id: "pr2", nama: "Barista", kejuruan: "Pariwisata" },
  { id: "pr3", nama: "Budidaya Hidroponik", kejuruan: "Agroindustri" },
  { id: "pr4", nama: "Desain Grafis", kejuruan: "Teknologi Informasi" },
  { id: "pr5", nama: "Digital Marketing", kejuruan: "Bisnis Manajemen" },
  { id: "pr6", nama: "Tata Boga", kejuruan: "Pariwisata" }
];

interface MenuImportProps {
  dbState: DatabaseState;
  onUpdateDb: (updates: Partial<DatabaseState>) => Promise<void>;
  onResetDb: () => Promise<void>;
}

export default function MenuImport({ dbState, onUpdateDb, onResetDb }: MenuImportProps) {
  const [step, setStep] = useState<"upload" | "mapping" | "success">("upload");
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [sourceColumns, setSourceColumns] = useState<string[]>([]);
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentSpreadsheetId, setCurrentSpreadsheetId] = useState<string | null>(null);
  const [currentSheetName, setCurrentSheetName] = useState<string | null>(null);
  const [sheetsSummary, setSheetsSummary] = useState<{
    participantsCount: number;
    newTypesCount: number;
    newKejuruanCount: number;
    newProgramsCount: number;
  } | null>(null);

  const targetColumns = [
    { id: "jenis_pelatihan", label: "Jenis Pelatihan" },
    { id: "nama", label: "Nama" },
    { id: "status_kelulusan", label: "Status Kelulusan" },
    { id: "alamat", label: "Alamat" },
    { id: "jk", label: "Jenis Kelamin" },
    { id: "tanggal_lahir", label: "Tanggal Lahir" },
    { id: "usia", label: "Usia" },
    { id: "kategori", label: "Kategori" },
    { id: "disabilitas", label: "Penyandang Disabilitas" },
    { id: "program_pelatihan", label: "Program Pelatihan" },
    { id: "kejuruan", label: "Kejuruan" },
    { id: "tanggal_pelatihan", label: "Tanggal Pelatihan" },
    { id: "status_kerja", label: "Status Kebekerjaan" },
    { id: "tempat_bekerja", label: "Tempat Bekerja" },
    { id: "lokasi", label: "Lokasi" },
  ];

  // Initialize Auth on mount
  useEffect(() => {
    gapi.load('picker', () => {});
    const unsubscribeAuth = initAuth(
      () => setNeedsAuth(false),
      () => setNeedsAuth(true)
    );
    return () => {
      unsubscribeAuth();
    };
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const createPicker = async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) return;

    const pickerOrigin =
      window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
        ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
        : window.location.origin;

    const view = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS)
      .setMimeTypes('application/vnd.google-apps.spreadsheet');

    const picker = new google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setCallback(pickerCallback)
      .setOrigin(pickerOrigin)
      .build();
    picker.setVisible(true);
  };

  const pickerCallback = async (data: any) => {
    if (data.action === google.picker.Action.PICKED) {
      const file = data.docs[0];
      setSelectedFileName(file.name);
      await fetchSheetHeaders(file.id);
    }
  };

  const fetchSheetHeaders = async (spreadsheetId: string) => {
    setIsFetchingSheet(true);
    setErrorMsg(null);
    setCurrentSpreadsheetId(spreadsheetId);
    try {
      const token = await getAccessToken();
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const metaData = await metaRes.json();
      const firstSheetName = metaData.sheets[0].properties.title;
      setCurrentSheetName(firstSheetName);

      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${firstSheetName}!1:1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.values && data.values.length > 0) {
        setSourceColumns(data.values[0]);
        setStep("mapping");
      } else {
        setErrorMsg("Spreadsheet tidak memiliki header di baris pertama.");
      }
    } catch (err) {
      console.error("Error fetching sheet:", err);
      setErrorMsg("Gagal membaca Google Sheet.");
    } finally {
      setIsFetchingSheet(false);
    }
  };

  const handleGoogleSheetsImport = async () => {
    if (!currentSpreadsheetId || !currentSheetName) {
      setErrorMsg("Spreadsheet ID atau Sheet Name tidak ditemukan.");
      return;
    }
    
    setIsFetchingSheet(true);
    setErrorMsg(null);

    try {
      const token = await getAccessToken();
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${currentSpreadsheetId}/values/${currentSheetName}!A2:Z2000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const rows = data.values;
      if (!rows || rows.length === 0) {
        throw new Error("Tidak ada data baris yang ditemukan di bawah baris header.");
      }

      const headerIndexes: Record<string, number> = {};
      sourceColumns.forEach((colName, idx) => {
        headerIndexes[colName] = idx;
      });

      const parsedParticipants: Participant[] = [];
      const timestamp = Date.now();

      rows.forEach((row, rowIdx) => {
        if (row.length === 0 || !row.some(val => val && val.trim() !== "")) {
          return;
        }

        const getValue = (targetId: string): string => {
          const mappedHeader = mappings[targetId];
          if (!mappedHeader) return "";
          const idx = headerIndexes[mappedHeader];
          if (idx === undefined || idx >= row.length) return "";
          return (row[idx] || "").trim();
        };

        const nama = getValue("nama") || `Peserta ${rowIdx + 1}`;
        const jenisPelatihan = getValue("jenis_pelatihan") || "Pelatihan Vokasi";
        const statusKelulusanRaw = getValue("status_kelulusan") || "Lulus";
        const statusKelulusan = (statusKelulusanRaw.toLowerCase().includes("tidak") ? "Tidak Lulus" : 
                                 statusKelulusanRaw.toLowerCase().includes("proses") || statusKelulusanRaw.toLowerCase().includes("jalan") ? "Dalam Proses" : "Lulus");
        const alamat = getValue("alamat") || "Bandung Barat";
        const jenisKelaminRaw = getValue("jk") || "L";
        const jenisKelamin = (jenisKelaminRaw.toUpperCase().startsWith("P") || jenisKelaminRaw.toLowerCase().includes("perempuan") ? "P" : "L");
        const tanggalLahir = getValue("tanggal_lahir") || "01/01/2000";
        const usia = parseInt(getValue("usia")) || 25;
        const kategori = getValue("kategori") || "Bukan Lansia";
        const penyandangDisabilitasRaw = getValue("disabilitas") || "Tidak";
        const penyandangDisabilitas = (penyandangDisabilitasRaw.toLowerCase().includes("ya") || penyandangDisabilitasRaw.toLowerCase().includes("yes") ? "Ya" : "Tidak");
        const programPelatihan = getValue("program_pelatihan") || "Barista";
        const kejuruan = getValue("kejuruan") || "Pariwisata";
        const tanggalPelatihan = getValue("tanggal_pelatihan") || "23-Jan-24";
        const statusKebekerjaanRaw = getValue("status_kerja") || "Belum Bekerja";
        const statusKebekerjaan = (statusKebekerjaanRaw.toLowerCase().includes("belum") ? "Belum Bekerja" : 
                                   statusKebekerjaanRaw.toLowerCase().includes("wira") ? "Wirausaha" : "Bekerja");
        const tempatBekerja = getValue("tempat_bekerja") || "";
        const lokasi = getValue("lokasi") || "";

        parsedParticipants.push({
          id: `sheet-${timestamp}-${rowIdx}-${Math.random().toString(36).substr(2, 5)}`,
          nama,
          jenisPelatihan,
          statusKelulusan,
          alamat,
          jenisKelamin,
          tanggalLahir,
          usia,
          kategori,
          penyandangDisabilitas,
          programPelatihan,
          kejuruan,
          tanggalPelatihan,
          statusKebekerjaan,
          tempatBekerja,
          lokasi
        });
      });

      if (parsedParticipants.length === 0) {
        throw new Error("Gagal mengurai data baris dari Google Sheet.");
      }

      // Auto-extract master lists
      const newTypes: TrainingType[] = [];
      const newKejuruan: Kejuruan[] = [];
      const newPrograms: ProgramPelatihan[] = [];

      const existingTypeNames = new Set(dbState.trainingTypes.map(t => t.nama.toLowerCase().trim()));
      const existingKejuruanNames = new Set(dbState.kejuruanList.map(k => k.nama.toLowerCase().trim()));
      const existingProgramNames = new Set(dbState.programs.map(p => p.nama.toLowerCase().trim()));

      parsedParticipants.forEach((p, idx) => {
        if (p.jenisPelatihan) {
          const typeClean = p.jenisPelatihan.trim();
          if (!existingTypeNames.has(typeClean.toLowerCase())) {
            const id = `t-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
            newTypes.push({
              id,
              nama: typeClean,
              deskripsi: "Ditambahkan otomatis dari impor Google Sheets"
            });
            existingTypeNames.add(typeClean.toLowerCase());
          }
        }

        if (p.kejuruan) {
          const kejuruanClean = p.kejuruan.trim();
          if (!existingKejuruanNames.has(kejuruanClean.toLowerCase())) {
            const id = `k-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
            newKejuruan.push({
              id,
              nama: kejuruanClean
            });
            existingKejuruanNames.add(kejuruanClean.toLowerCase());
          }
        }

        if (p.programPelatihan) {
          const programClean = p.programPelatihan.trim();
          const kejuruanClean = (p.kejuruan || "").trim();
          if (!existingProgramNames.has(programClean.toLowerCase())) {
            const id = `pr-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
            newPrograms.push({
              id,
              nama: programClean,
              kejuruan: kejuruanClean || "Umum"
            });
            existingProgramNames.add(programClean.toLowerCase());
          }
        }
      });

      await onUpdateDb({
        participants: [...dbState.participants, ...parsedParticipants],
        trainingTypes: [...dbState.trainingTypes, ...newTypes],
        kejuruanList: [...dbState.kejuruanList, ...newKejuruan],
        programs: [...dbState.programs, ...newPrograms]
      });

      setSheetsSummary({
        participantsCount: parsedParticipants.length,
        newTypesCount: newTypes.length,
        newKejuruanCount: newKejuruan.length,
        newProgramsCount: newPrograms.length
      });

      setStep("success");

      setTimeout(() => {
        setStep("upload");
        setMappings({});
        setSelectedFileName(null);
        setCurrentSpreadsheetId(null);
        setCurrentSheetName(null);
        setSheetsSummary(null);
      }, 5000);

    } catch (err: any) {
      console.error("Error importing Google Sheet:", err);
      setErrorMsg(err.message || "Gagal mengimpor data dari Google Sheet.");
    } finally {
      setIsFetchingSheet(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      
      {/* Title Header Card */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-800">Manajemen & Import Data Sentral</h2>
            <p className="text-sm font-semibold text-slate-500 mt-1">Sentralisasi data peserta, jenis pelatihan, kejuruan, dan program pelatihan yang tersinkronisasi ke Cloud Firestore.</p>
          </div>
        </div>
      </div>

      {/* Google Sheets Synchronization Card */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-slate-800 text-sm">Sinkronisasi Google Sheets</h3>
          </div>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold rounded-lg uppercase tracking-wider">Aktif</span>
        </div>

        {step === "upload" && (
          <div className="text-center py-12 flex flex-col justify-center items-center px-6">
            <h4 className="text-lg font-display font-bold text-slate-800 mb-2">Impor Langsung dari Google Drive</h4>
            <p className="text-xs text-slate-500 mb-6 max-w-md leading-relaxed">
              Koneksikan ke akun Google Workspace Anda untuk mengambil file spreadsheet, memetakan kolom secara real-time, dan mengintegrasikannya ke database.
            </p>
            {needsAuth ? (
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="px-6 py-3 bg-white border border-slate-200 rounded-xl shadow-2xs hover:bg-slate-50 transition-all font-semibold text-xs flex items-center gap-3 disabled:opacity-50 text-slate-700 active:scale-95 cursor-pointer"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                {isLoggingIn ? "Menghubungkan Akun..." : "Masuk dengan Google"}
              </button>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={createPicker}
                  disabled={isFetchingSheet}
                  className="px-8 py-3 bg-[#A8E6CF] hover:bg-[#91c9b4] text-teal-950 font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2 text-xs"
                >
                  {isFetchingSheet ? "Memproses Data..." : "Pilih File Google Sheets"}
                </button>
                {errorMsg && (
                  <p className="text-xs font-semibold text-rose-500 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">
                    {errorMsg}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {step === "mapping" && (
          <div className="p-6 flex-1 flex flex-col">
            <div className="bg-[#FACC15]/10 text-yellow-900 p-4 rounded-2xl border border-[#FACC15]/20 shadow-2xs mb-6 flex justify-between items-center">
              <div>
                <strong className="block mb-1 text-xs font-bold">Pencocokan Kolom (Mapping Dinamis)</strong>
                <p className="text-[11px] font-medium opacity-90 leading-relaxed">Pasangkan secara interaktif kolom dari file spreadsheet Anda (Kanan) dengan struktur database target kami (Kiri).</p>
              </div>
              {selectedFileName && (
                <div className="bg-white/80 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-yellow-200/50 flex items-center gap-1.5 font-mono">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {selectedFileName}
                </div>
              )}
            </div>
            
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-3xs max-h-[40vh] overflow-y-auto">
               <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-150 p-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <div>Kolom Database Target</div>
                  <div>Kolom File Upload</div>
               </div>
               <div className="divide-y divide-slate-100">
                 {targetColumns.map(col => (
                    <div key={col.id} className="grid grid-cols-2 items-center p-4 gap-6 hover:bg-slate-50 transition-colors">
                       <div className="flex items-center gap-3">
                         <div className="p-1.5 bg-slate-100 rounded-lg"><Link2 className="w-4 h-4 text-slate-500" /></div>
                         <span className="text-xs font-bold text-slate-700">{col.label}</span>
                       </div>
                       <div>
                         <select 
                           value={mappings[col.id] || ""}
                           onChange={(e) => setMappings({...mappings, [col.id]: e.target.value})}
                           className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer font-semibold text-slate-700 shadow-3xs"
                         >
                           <option value="" disabled>Pilih Kolom File...</option>
                           {sourceColumns.map((opt, optIdx) => <option key={`${opt}-${optIdx}`} value={opt}>{opt}</option>)}
                         </select>
                       </div>
                    </div>
                 ))}
               </div>
             </div>
             
             <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setStep("upload")} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-xs">Batal</button>
                <button
                  onClick={handleGoogleSheetsImport}
                  disabled={isFetchingSheet}
                  className="px-6 py-2.5 bg-[#A8E6CF] text-teal-950 font-bold rounded-xl hover:bg-[#91c9b4] shadow-2xs transition-all active:scale-95 text-xs disabled:opacity-50 flex items-center gap-2 font-bold cursor-pointer"
                >
                  {isFetchingSheet ? "Memproses..." : "Proses Import Data"}
                </button>
             </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-12 px-6 flex-1 flex flex-col justify-center items-center">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm animate-bounce">
              <CheckCircle className="w-8 h-8 text-emerald-600 animate-pulse" />
            </div>
            <h4 className="text-xl font-display font-bold text-slate-800 mb-1">Sinkronisasi Google Sheets Berhasil!</h4>
            <p className="text-xs font-semibold text-slate-500 mb-6">Data dari spreadsheet telah berhasil diintegrasikan ke database cloud secara real-time.</p>

            {sheetsSummary && (
              <div className="w-full max-w-sm space-y-2.5 bg-slate-50/50 border border-slate-100 p-5 rounded-2xl mb-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Data Peserta</span>
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">+{sheetsSummary.participantsCount} data</span>
                </div>
                {sheetsSummary.newTypesCount > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">Jenis Pelatihan Baru</span>
                    <span className="font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">+{sheetsSummary.newTypesCount} master</span>
                  </div>
                )}
                {sheetsSummary.newKejuruanCount > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">Kejuruan Baru</span>
                    <span className="font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">+{sheetsSummary.newKejuruanCount} master</span>
                  </div>
                )}
                {sheetsSummary.newProgramsCount > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">Program Pelatihan Baru</span>
                    <span className="font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">+{sheetsSummary.newProgramsCount} master</span>
                  </div>
                )}
              </div>
            )}

            <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/50 py-2 px-4 rounded-xl">
              Kembali ke dashboard pengimpor dalam beberapa saat...
            </p>
          </div>
        )}
      </div>

      {/* Main Master Database Manager Suite */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="mb-6">
          <h3 className="text-lg font-display font-bold text-slate-800">Master Database & Tabel Referensi</h3>
          <p className="text-xs font-semibold text-slate-500 mt-1">Gunakan tabel di bawah ini untuk melihat, menambah, mengubah, menghapus, atau melakukan **Import CSV Cerdas** pada masing-masing semua element database BPVP.</p>
        </div>
        
        <DatabaseTables 
          dbState={dbState}
          onUpdateDb={onUpdateDb}
          onResetDb={onResetDb}
          currentUserRole="Sekretaris" // Default to Sekretaris so they have canModify = true permissions
        />
      </div>

    </div>
  );
}
