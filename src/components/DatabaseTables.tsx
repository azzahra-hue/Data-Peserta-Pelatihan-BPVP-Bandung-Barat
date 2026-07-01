import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Participant, TrainingType, Kejuruan, ProgramPelatihan, DatabaseState } from "../types";
import { Plus, Edit2, Trash2, Search, Filter, RefreshCw, X, ChevronRight, Check, CheckSquare, FileSpreadsheet, AlertTriangle, Sparkles } from "lucide-react";
import SmartCSVImporter from "./SmartCSVImporter";

interface DatabaseTablesProps {
  dbState: DatabaseState;
  onUpdateDb: (updates: Partial<DatabaseState>) => void;
  onResetDb: () => void;
  currentUserRole: string;
}

export default function DatabaseTables({ dbState, onUpdateDb, onResetDb, currentUserRole }: DatabaseTablesProps) {
  const [activeTab, setActiveTab] = useState<"participants" | "types" | "kejuruan" | "programs">("participants");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Smart CSV Importer State
  const [openCSVImporter, setOpenCSVImporter] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{
    source: "CSV" | "Google Sheets";
    participantsCount: number;
    newTypesCount: number;
    newKejuruanCount: number;
    newProgramsCount: number;
  } | null>(null);

  const [isEnrichingLocations, setIsEnrichingLocations] = useState(false);
  const [isLookingUpSingle, setIsLookingUpSingle] = useState(false);

  const handleAILocationLookup = async () => {
    if (!pTempatBekerja || !pTempatBekerja.trim()) return;
    setIsLookingUpSingle(true);
    try {
      const res = await fetch("/api/ai/lookup-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies: [pTempatBekerja.trim()] })
      });
      const result = await res.json();
      if (result && result.locations && result.locations[pTempatBekerja.trim()]) {
        setPLokasi(result.locations[pTempatBekerja.trim()]);
      }
    } catch (error) {
      console.error("Single location lookup failed:", error);
    } finally {
      setIsLookingUpSingle(false);
    }
  };

  const handleSmartCSVImport = async (importedData: any[]) => {
    if (openCSVImporter === "participants") {
      setIsEnrichingLocations(true);
      
      const enrichedParticipants = [...importedData];
      const missingLocations = enrichedParticipants.filter(p => 
        (p.statusKebekerjaan === "Bekerja" || p.statusKebekerjaan === "Wirausaha") && 
        p.tempatBekerja && p.tempatBekerja.trim() !== "" &&
        (!p.lokasi || p.lokasi.trim() === "")
      );

      if (missingLocations.length > 0) {
        const uniqueCompanies = Array.from(new Set(missingLocations.map(p => p.tempatBekerja.trim())));
        
        try {
          const CHUNK_SIZE = 50;
          const allLocations: Record<string, string> = {};
          
          for (let i = 0; i < uniqueCompanies.length; i += CHUNK_SIZE) {
            const chunk = uniqueCompanies.slice(i, i + CHUNK_SIZE);
            const res = await fetch("/api/ai/lookup-locations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ companies: chunk })
            });
            const result = await res.json();
            if (result && result.locations) {
              Object.assign(allLocations, result.locations);
            }
          }
          
          enrichedParticipants.forEach(p => {
            if (
              (p.statusKebekerjaan === "Bekerja" || p.statusKebekerjaan === "Wirausaha") && 
              p.tempatBekerja && p.tempatBekerja.trim() !== "" &&
              (!p.lokasi || p.lokasi.trim() === "")
            ) {
              const companyKey = p.tempatBekerja.trim();
              if (allLocations[companyKey]) {
                p.lokasi = allLocations[companyKey];
              }
            }
          });
        } catch (error) {
          console.error("AI location enrichment failed:", error);
        }
      }
      setIsEnrichingLocations(false);

      // Automatic extraction of related master data for a seamless single-import experience
      const newTypes: TrainingType[] = [];
      const newKejuruan: Kejuruan[] = [];
      const newPrograms: ProgramPelatihan[] = [];

      const existingTypeNames = new Set(dbState.trainingTypes.map(t => t.nama.toLowerCase().trim()));
      const existingKejuruanNames = new Set(dbState.kejuruanList.map(k => k.nama.toLowerCase().trim()));
      const existingProgramNames = new Set(dbState.programs.map(p => p.nama.toLowerCase().trim()));

      enrichedParticipants.forEach((p, idx) => {
        // Extract training types
        if (p.jenisPelatihan) {
          const typeClean = p.jenisPelatihan.trim();
          if (!existingTypeNames.has(typeClean.toLowerCase())) {
            const id = `t-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
            newTypes.push({
              id,
              nama: typeClean,
              deskripsi: "Ditambahkan otomatis dari impor peserta"
            });
            existingTypeNames.add(typeClean.toLowerCase());
          }
        }

        // Extract kejuruan
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

        // Extract program pelatihan
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

      onUpdateDb({
        participants: [...dbState.participants, ...enrichedParticipants],
        trainingTypes: [...dbState.trainingTypes, ...newTypes],
        kejuruanList: [...dbState.kejuruanList, ...newKejuruan],
        programs: [...dbState.programs, ...newPrograms]
      });

      setImportSummary({
        source: "CSV",
        participantsCount: enrichedParticipants.length,
        newTypesCount: newTypes.length,
        newKejuruanCount: newKejuruan.length,
        newProgramsCount: newPrograms.length
      });
    } else if (openCSVImporter === "types") {
      const newTypes = importedData.map(item => ({
        id: item.id,
        nama: item.nama,
        deskripsi: item.deskripsi || ""
      }));
      onUpdateDb({ trainingTypes: [...dbState.trainingTypes, ...newTypes] });
    } else if (openCSVImporter === "kejuruan") {
      const newKejuruan = importedData.map(item => ({
        id: item.id,
        nama: item.nama
      }));
      onUpdateDb({ kejuruanList: [...dbState.kejuruanList, ...newKejuruan] });
    } else if (openCSVImporter === "programs") {
      const newPrograms = importedData.map(item => ({
        id: item.id,
        nama: item.nama,
        kejuruan: item.kejuruan
      }));
      onUpdateDb({ programs: [...dbState.programs, ...newPrograms] });
    }
  };

  // Custom Confirmation Modal State
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    actionLabel: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    title: "",
    message: "",
    actionLabel: "Konfirmasi",
    isDanger: true,
    onConfirm: () => {},
  });

  const triggerConfirm = (config: {
    title: string;
    message: string;
    actionLabel: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }) => {
    setConfirmConfig(config);
    setShowConfirm(true);
  };

  const handleClearActiveTab = () => {
    const tabNameMap: Record<string, string> = {
      participants: "Peserta",
      types: "Jenis Pelatihan",
      kejuruan: "Kejuruan",
      programs: "Program Pelatihan"
    };

    const tabLabel = tabNameMap[activeTab] || activeTab;

    triggerConfirm({
      title: `Kosongkan Tabel ${tabLabel}?`,
      message: `Apakah Anda yakin ingin mengosongkan seluruh data pada tabel ${tabLabel}? Tindakan ini akan menghapus semua data di tabel tersebut secara permanen dari Cloud Firestore.`,
      actionLabel: "Kosongkan Sekarang",
      isDanger: true,
      onConfirm: () => {
        if (activeTab === "participants") {
          localStorage.setItem("prevent_reseeding", "true");
          onUpdateDb({ participants: [] });
        } else if (activeTab === "types") {
          onUpdateDb({ trainingTypes: [] });
        } else if (activeTab === "kejuruan") {
          onUpdateDb({ kejuruanList: [] });
        } else if (activeTab === "programs") {
          onUpdateDb({ programs: [] });
        }
      }
    });
  };
  const [filterJenisPelatihan, setFilterJenisPelatihan] = useState("Semua");
  const [filterStatusKelulusan, setFilterStatusKelulusan] = useState("Semua");
  const [filterStatusKebekerjaan, setFilterStatusKebekerjaan] = useState("Semua");
  const [filterKejuruan, setFilterKejuruan] = useState("Semua");
  
  // Pagination State for Participants Table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  
  // Modal / Form state for Participant
  const [showPartForm, setShowPartForm] = useState(false);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  
  // Participant form fields
  const [pKodeTransaksi, setPKodeTransaksi] = useState("");
  const [pNama, setPNama] = useState("");
  const [pNik, setPNik] = useState("");
  const [pNoHp, setPNoHp] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [pJenisKelamin, setPJenisKelamin] = useState<Participant["jenisKelamin"]>("L");
  const [pAlamat, setPAlamat] = useState("");
  const [pTempatLahir, setPTempatLahir] = useState("");
  const [pTanggalLahir, setPTanggalLahir] = useState("");
  const [pUsia, setPUsia] = useState(25);
  const [pPendidikanTerakhir, setPPendidikanTerakhir] = useState("");
  const [pDisabilitasTipe, setPDisabilitasTipe] = useState("");
  const [pPenyandangDisabilitas, setPPenyandangDisabilitas] = useState<Participant["penyandangDisabilitas"]>("Tidak");
  const [pPernahBekerjaLuarNegeri, setPPernahBekerjaLuarNegeri] = useState<Participant["pernahBekerjaLuarNegeri"]>("Tidak");
  const [pBerminatBekerjaLuarNegeri, setPBerminatBekerjaLuarNegeri] = useState<Participant["berminatBekerjaLuarNegeri"]>("Tidak");
  const [pProgramPelatihan, setPProgramPelatihan] = useState("Penyangraian Biji Kopi");
  const [pKejuruan, setPKejuruan] = useState("Teknologi Pengolahan Agroindustri");
  const [pMetodePelatihan, setPMetodePelatihan] = useState("Luring");
  const [pJenisPelatihan, setPJenisPelatihan] = useState("Pelatihan Vokasi");
  const [pAngkatan, setPAngkatan] = useState("Angkatan I");
  const [pDurasi, setPDurasi] = useState("");
  const [pBiayaPelatihan, setPBiayaPelatihan] = useState("");
  const [pTanggalMulaiPelatihan, setPTanggalMulaiPelatihan] = useState("");
  const [pTanggalSelesaiPelatihan, setPTanggalSelesaiPelatihan] = useState("");
  const [pAbsensi, setPAbsensi] = useState("");
  const [pStatusSelesaiPelatihan, setPStatusSelesaiPelatihan] = useState("Selesai");
  const [pStatusKelulusan, setPStatusKelulusan] = useState<Participant["statusKelulusan"]>("Lulus");
  const [pSumberAnggaran, setPSumberAnggaran] = useState("APBN");
  const [pStatusKebekerjaan, setPStatusKebekerjaan] = useState<Participant["statusKebekerjaan"]>("Belum Bekerja");
  const [pTempatBekerja, setPTempatBekerja] = useState("");
  const [pStatus, setPStatus] = useState("");
  const [pJabatan, setPJabatan] = useState("");
  const [pTanggalPenempatan, setPTanggalPenempatan] = useState("");

  // Derived or compatibility fields for existing layout
  const [pKategori, setPKategori] = useState("Bukan Lansia");
  const [pTanggalPelatihan, setPTanggalPelatihan] = useState("");
  const [pLokasi, setPLokasi] = useState("");

  // Sub-master dynamic creators & editors
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDesc, setNewTypeDesc] = useState("");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);

  const [newKejuruanName, setNewKejuruanName] = useState("");
  const [editingKejuruanId, setEditingKejuruanId] = useState<string | null>(null);

  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramKejuruan, setNewProgramKejuruan] = useState("Teknologi Pengolahan Agroindustri");
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  // Filtering participants list
  const filteredParticipants = React.useMemo(() => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    return dbState.participants.filter(p => {
      const matchesSearch = !lowerSearchQuery || 
                            (p.nama || "").toLowerCase().includes(lowerSearchQuery) || 
                            (p.alamat || "").toLowerCase().includes(lowerSearchQuery) ||
                            (p.programPelatihan || "").toLowerCase().includes(lowerSearchQuery) ||
                            (p.kodeTransaksi || "").toLowerCase().includes(lowerSearchQuery) ||
                            (p.nik || "").toLowerCase().includes(lowerSearchQuery) ||
                            (p.noHp || "").toLowerCase().includes(lowerSearchQuery) ||
                            (p.email || "").toLowerCase().includes(lowerSearchQuery) ||
                            (p.tempatBekerja || "").toLowerCase().includes(lowerSearchQuery);
      
      const matchesJenis = filterJenisPelatihan === "Semua" || p.jenisPelatihan === filterJenisPelatihan;
      const matchesKelulusan = filterStatusKelulusan === "Semua" || p.statusKelulusan === filterStatusKelulusan;
      const matchesKebekerjaan = filterStatusKebekerjaan === "Semua" || p.statusKebekerjaan === filterStatusKebekerjaan;
      const matchesKejuruan = filterKejuruan === "Semua" || p.kejuruan === filterKejuruan;

      return matchesSearch && matchesJenis && matchesKelulusan && matchesKebekerjaan && matchesKejuruan;
    });
  }, [dbState.participants, searchQuery, filterJenisPelatihan, filterStatusKelulusan, filterStatusKebekerjaan, filterKejuruan]);

  const filteredTypes = React.useMemo(() => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    return dbState.trainingTypes.filter(t => 
      !lowerSearchQuery || 
      (t.nama || "").toLowerCase().includes(lowerSearchQuery) || 
      (t.deskripsi || "").toLowerCase().includes(lowerSearchQuery)
    );
  }, [dbState.trainingTypes, searchQuery]);

  const filteredKejuruan = React.useMemo(() => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    return dbState.kejuruanList.filter(k => 
      !lowerSearchQuery || 
      (k.nama || "").toLowerCase().includes(lowerSearchQuery)
    );
  }, [dbState.kejuruanList, searchQuery]);

  const filteredPrograms = React.useMemo(() => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    return dbState.programs.filter(p => 
      !lowerSearchQuery || 
      (p.nama || "").toLowerCase().includes(lowerSearchQuery) || 
      (p.kejuruan || "").toLowerCase().includes(lowerSearchQuery)
    );
  }, [dbState.programs, searchQuery]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterJenisPelatihan, filterStatusKelulusan, filterStatusKebekerjaan, filterKejuruan]);

  const totalPages = Math.ceil(filteredParticipants.length / pageSize);
  const paginatedParticipants = React.useMemo(() => {
    return filteredParticipants.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredParticipants, currentPage, pageSize]);

  // Check permissions based on roles
  const canModify = currentUserRole === "Sekretaris" || currentUserRole === "Sub Koordinator" || currentUserRole === "Kepala Unit Kerja";

  // Handle participant form submit (Create or Update)
  const handlePartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pNama.trim()) return;

    const parseToTanggalPelatihan = (tanggalMulai: string): string => {
      if (!tanggalMulai) return "15-May-25";
      const trimmed = tanggalMulai.trim();
      if (trimmed.match(/^\d{2}-[a-zA-Z]{3}-\d{2}$/)) return trimmed;
      
      let year = "25";
      if (trimmed.includes("2024") || trimmed.endsWith("-24") || trimmed.endsWith("/24") || trimmed.endsWith(" 24")) year = "24";
      if (trimmed.includes("2026") || trimmed.endsWith("-26") || trimmed.endsWith("/26") || trimmed.endsWith(" 26")) year = "26";
      if (trimmed.includes("2027") || trimmed.endsWith("-27") || trimmed.endsWith("/27") || trimmed.endsWith(" 27")) year = "27";
      return `15-May-${year}`;
    };

    const derivedTanggalPelatihan = pTanggalPelatihan || parseToTanggalPelatihan(pTanggalMulaiPelatihan || "");

    const data: Participant = {
      id: editingPartId || `part-${Date.now()}`,
      kodeTransaksi: pKodeTransaksi || "",
      nama: pNama,
      nik: pNik || "",
      noHp: pNoHp || "",
      email: pEmail || "",
      jenisKelamin: pJenisKelamin,
      alamat: pAlamat,
      tempatLahir: pTempatLahir || "",
      tanggalLahir: pTanggalLahir || "01/01/2000",
      usia: Number(pUsia) || 25,
      pendidikanTerakhir: pPendidikanTerakhir || "",
      disabilitasTipe: pDisabilitasTipe || "Tidak",
      penyandangDisabilitas: pPenyandangDisabilitas || "Tidak",
      pernahBekerjaLuarNegeri: pPernahBekerjaLuarNegeri || "Tidak",
      berminatBekerjaLuarNegeri: pBerminatBekerjaLuarNegeri || "Tidak",
      programPelatihan: pProgramPelatihan,
      kejuruan: pKejuruan,
      metodePelatihan: pMetodePelatihan || "Luring",
      jenisPelatihan: pJenisPelatihan,
      angkatan: pAngkatan || "",
      durasi: pDurasi || "",
      biayaPelatihan: pBiayaPelatihan || "",
      tanggalMulaiPelatihan: pTanggalMulaiPelatihan || "",
      tanggalSelesaiPelatihan: pTanggalSelesaiPelatihan || "",
      absensi: pAbsensi || "",
      statusSelesaiPelatihan: pStatusSelesaiPelatihan || "",
      statusKelulusan: pStatusKelulusan,
      sumberAnggaran: pSumberAnggaran || "APBN",
      statusKebekerjaan: pStatusKebekerjaan,
      tempatBekerja: pStatusKebekerjaan === "Belum Bekerja" ? "" : pTempatBekerja,
      status: pStatus || "",
      jabatan: pJabatan || "",
      tanggalPenempatan: pTanggalPenempatan || "",

      // Derived/compatibility fields
      kategori: pUsia >= 60 ? "Lansia" : "Bukan Lansia",
      tanggalPelatihan: derivedTanggalPelatihan,
      lokasi: pStatusKebekerjaan === "Belum Bekerja" ? "" : pLokasi || "Bandung Barat"
    };

    let updatedList = [];
    if (editingPartId) {
      updatedList = dbState.participants.map(p => p.id === editingPartId ? data : p);
    } else {
      updatedList = [data, ...dbState.participants];
    }

    // Auto extract master data from manual entry
    const newTypes: TrainingType[] = [];
    const newKejuruan: Kejuruan[] = [];
    const newPrograms: ProgramPelatihan[] = [];
    
    if (data.jenisPelatihan) {
      const typeClean = data.jenisPelatihan.trim();
      if (!dbState.trainingTypes.find(t => t.nama.toLowerCase() === typeClean.toLowerCase())) {
        newTypes.push({ id: `t-${Date.now()}-m`, nama: typeClean, deskripsi: "Ditambahkan otomatis" });
      }
    }
    if (data.kejuruan) {
      const kejuruanClean = data.kejuruan.trim();
      if (!dbState.kejuruanList.find(k => k.nama.toLowerCase() === kejuruanClean.toLowerCase())) {
        newKejuruan.push({ id: `k-${Date.now()}-m`, nama: kejuruanClean });
      }
    }
    if (data.programPelatihan) {
      const programClean = data.programPelatihan.trim();
      if (!dbState.programs.find(p => p.nama.toLowerCase() === programClean.toLowerCase())) {
        newPrograms.push({ id: `pr-${Date.now()}-m`, nama: programClean, kejuruan: data.kejuruan || "Umum" });
      }
    }

    onUpdateDb({
      participants: updatedList,
      ...(newTypes.length > 0 ? { trainingTypes: [...dbState.trainingTypes, ...newTypes] } : {}),
      ...(newKejuruan.length > 0 ? { kejuruanList: [...dbState.kejuruanList, ...newKejuruan] } : {}),
      ...(newPrograms.length > 0 ? { programs: [...dbState.programs, ...newPrograms] } : {})
    });

    resetPartForm();
  };

  const startEditPart = (p: Participant) => {
    setEditingPartId(p.id);
    setPKodeTransaksi(p.kodeTransaksi || "");
    setPNama(p.nama || "");
    setPNik(p.nik || "");
    setPNoHp(p.noHp || "");
    setPEmail(p.email || "");
    setPJenisKelamin(p.jenisKelamin || "L");
    setPAlamat(p.alamat || "");
    setPTempatLahir(p.tempatLahir || "");
    setPTanggalLahir(p.tanggalLahir || "");
    setPUsia(p.usia || 0);
    setPPendidikanTerakhir(p.pendidikanTerakhir || "");
    setPDisabilitasTipe(p.disabilitasTipe || "");
    setPPenyandangDisabilitas(p.penyandangDisabilitas || "Tidak");
    setPPernahBekerjaLuarNegeri(p.pernahBekerjaLuarNegeri || "Tidak");
    setPBerminatBekerjaLuarNegeri(p.berminatBekerjaLuarNegeri || "Tidak");
    setPProgramPelatihan(p.programPelatihan || "");
    setPKejuruan(p.kejuruan || "");
    setPMetodePelatihan(p.metodePelatihan || "Luring");
    setPJenisPelatihan(p.jenisPelatihan || "");
    setPAngkatan(p.angkatan || "");
    setPDurasi(p.durasi?.toString() || "");
    setPBiayaPelatihan(p.biayaPelatihan?.toString() || "");
    setPTanggalMulaiPelatihan(p.tanggalMulaiPelatihan || "");
    setPTanggalSelesaiPelatihan(p.tanggalSelesaiPelatihan || "");
    setPAbsensi(p.absensi || "");
    setPStatusSelesaiPelatihan(p.statusSelesaiPelatihan || "");
    setPStatusKelulusan(p.statusKelulusan || "Belum Lulus");
    setPSumberAnggaran(p.sumberAnggaran || "APBN");
    setPStatusKebekerjaan(p.statusKebekerjaan || "Belum Bekerja");
    setPTempatBekerja(p.tempatBekerja || "");
    setPStatus(p.status || "");
    setPJabatan(p.jabatan || "");
    setPTanggalPenempatan(p.tanggalPenempatan || "");

    setPKategori(p.kategori || "Bukan Lansia");
    setPTanggalPelatihan(p.tanggalPelatihan || "");
    setPLokasi(p.lokasi || "");
    setShowPartForm(true);
  };

  const deletePart = (id: string) => {
    triggerConfirm({
      title: "Hapus Data Peserta?",
      message: "Apakah Anda yakin ingin menghapus data peserta ini secara permanen dari Cloud Firestore?",
      actionLabel: "Hapus Peserta",
      isDanger: true,
      onConfirm: () => {
        const updatedList = dbState.participants.filter(p => p.id !== id);
        onUpdateDb({ participants: updatedList });
      }
    });
  };

  const resetPartForm = () => {
    setEditingPartId(null);
    setPKodeTransaksi("");
    setPNama("");
    setPNik("");
    setPNoHp("");
    setPEmail("");
    setPJenisKelamin("L");
    setPAlamat("");
    setPTempatLahir("");
    setPTanggalLahir("");
    setPUsia(25);
    setPPendidikanTerakhir("");
    setPDisabilitasTipe("");
    setPPenyandangDisabilitas("Tidak");
    setPPernahBekerjaLuarNegeri("Tidak");
    setPBerminatBekerjaLuarNegeri("Tidak");
    setPMetodePelatihan("Luring");
    setPAngkatan("Angkatan I");
    setPDurasi("");
    setPBiayaPelatihan("");
    setPTanggalMulaiPelatihan("");
    setPTanggalSelesaiPelatihan("");
    setPAbsensi("");
    setPStatusSelesaiPelatihan("Selesai");
    setPSumberAnggaran("APBN");
    setPStatusKebekerjaan("Belum Bekerja");
    setPTempatBekerja("");
    setPStatus("");
    setPJabatan("");
    setPTanggalPenempatan("");

    setPKategori("Bukan Lansia");
    setPTanggalPelatihan("");
    setPLokasi("");
    setShowPartForm(false);
  };

  // Sub-master additions and edits
  const startEditType = (t: TrainingType) => {
    setEditingTypeId(t.id);
    setNewTypeName(t.nama);
    setNewTypeDesc(t.deskripsi || "");
  };
  
  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    
    if (editingTypeId) {
      const updatedTypes = dbState.trainingTypes.map(t => 
        t.id === editingTypeId ? { ...t, nama: newTypeName, deskripsi: newTypeDesc } : t
      );
      onUpdateDb({ trainingTypes: updatedTypes });
      setEditingTypeId(null);
    } else {
      const newType: TrainingType = {
        id: `type-${Date.now()}`,
        nama: newTypeName,
        deskripsi: newTypeDesc
      };
      onUpdateDb({ trainingTypes: [...dbState.trainingTypes, newType] });
    }
    setNewTypeName("");
    setNewTypeDesc("");
  };

  const startEditKejuruan = (k: Kejuruan) => {
    setEditingKejuruanId(k.id);
    setNewKejuruanName(k.nama);
  };

  const handleAddKejuruan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKejuruanName.trim()) return;
    
    if (editingKejuruanId) {
      const updated = dbState.kejuruanList.map(k => 
        k.id === editingKejuruanId ? { ...k, nama: newKejuruanName } : k
      );
      onUpdateDb({ kejuruanList: updated });
      setEditingKejuruanId(null);
    } else {
      const newKej: Kejuruan = {
        id: `kej-${Date.now()}`,
        nama: newKejuruanName
      };
      onUpdateDb({ kejuruanList: [...dbState.kejuruanList, newKej] });
    }
    setNewKejuruanName("");
  };

  const startEditProgram = (p: ProgramPelatihan) => {
    setEditingProgramId(p.id);
    setNewProgramName(p.nama);
    setNewProgramKejuruan(p.kejuruan || "Teknologi Pengolahan Agroindustri");
  };

  const handleAddProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramName.trim()) return;
    
    if (editingProgramId) {
      const updated = dbState.programs.map(p => 
        p.id === editingProgramId ? { ...p, nama: newProgramName, kejuruan: newProgramKejuruan } : p
      );
      onUpdateDb({ programs: updated });
      setEditingProgramId(null);
    } else {
      const newProg: ProgramPelatihan = {
        id: `prog-${Date.now()}`,
        nama: newProgramName,
        kejuruan: newProgramKejuruan
      };
      onUpdateDb({ programs: [...dbState.programs, newProg] });
    }
    setNewProgramName("");
  };

  // Sub-master deletions
  const deleteType = (id: string) => {
    onUpdateDb({ trainingTypes: dbState.trainingTypes.filter(t => t.id !== id) });
  };
  const deleteKejuruan = (id: string) => {
    onUpdateDb({ kejuruanList: dbState.kejuruanList.filter(k => k.id !== id) });
  };
  const deleteProgram = (id: string) => {
    onUpdateDb({ programs: dbState.programs.filter(p => p.id !== id) });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="database-tables-root">
      
      {/* Visual Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("participants")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "participants"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Tabel Peserta Pelatihan ({dbState.participants.length})
          </button>
          <button
            onClick={() => setActiveTab("types")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "types"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Master Jenis Pelatihan ({dbState.trainingTypes.length})
          </button>
          <button
            onClick={() => setActiveTab("kejuruan")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "kejuruan"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Master Kejuruan ({dbState.kejuruanList.length})
          </button>
          <button
            onClick={() => setActiveTab("programs")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "programs"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Master Program Pelatihan ({dbState.programs.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {canModify && activeTab === "participants" && (
            <button
              onClick={() => { resetPartForm(); setShowPartForm(true); }}
              className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              id="btn-add-participant"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Peserta
            </button>
          )}
          {canModify && (
            <button
              onClick={() => setOpenCSVImporter(activeTab)}
              className="inline-flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
              id={`btn-import-csv-${activeTab}`}
              title={`Import data dari CSV ke ${activeTab}`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Import CSV Cerdas
            </button>
          )}
          {canModify && (
            <button
              onClick={handleClearActiveTab}
              className="inline-flex items-center gap-1.5 border border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-rose-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 animate-fade-in"
              title={`Kosongkan semua data pada tabel ${activeTab}`}
            >
              <Trash2 className="w-3.5 h-3.5" /> Kosongkan Tabel
            </button>
          )}
          <button
            onClick={() => triggerConfirm({
              title: "Reset Seluruh Database?",
              message: "Apakah Anda yakin ingin mereset seluruh database ke data bawaan? Semua data peserta, jenis pelatihan, kejuruan, dan program yang ditambahkan manual akan terhapus secara permanen dari Cloud Firestore.",
              actionLabel: "Reset Sekarang",
              isDanger: true,
              onConfirm: onResetDb
            })}
            className="inline-flex items-center gap-1 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            title="Reset ke Data Bawaan"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Database
          </button>
        </div>
      </div>

      {/* TAB 1: PARTICIPANTS CONTROL PANEL */}
      {activeTab === "participants" && (
        <div className="space-y-4">
          
          {/* Advanced Search & Filtering Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Search Query */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 w-full text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Jenis Pelatihan */}
            <div className="space-y-1">
              <select
                value={filterJenisPelatihan}
                onChange={(e) => setFilterJenisPelatihan(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg p-1.5 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Semua">Semua Jenis Pelatihan</option>
                {dbState.trainingTypes.map(t => (
                  <option key={t.id} value={t.nama}>{t.nama}</option>
                ))}
              </select>
            </div>

            {/* Filter Kejuruan */}
            <div className="space-y-1">
              <select
                value={filterKejuruan}
                onChange={(e) => setFilterKejuruan(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg p-1.5 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Semua">Semua Kejuruan</option>
                {dbState.kejuruanList.map(k => (
                  <option key={k.id} value={k.nama}>{k.nama}</option>
                ))}
              </select>
            </div>

            {/* Filter Kelulusan */}
            <div className="space-y-1">
              <select
                value={filterStatusKelulusan}
                onChange={(e) => setFilterStatusKelulusan(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg p-1.5 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Semua">Semua Status Lulus</option>
                <option value="Lulus">Lulus</option>
                <option value="Tidak Lulus">Tidak Lulus</option>
                <option value="Dalam Proses">Dalam Proses</option>
              </select>
            </div>

            {/* Filter Kebekerjaan */}
            <div className="space-y-1">
              <select
                value={filterStatusKebekerjaan}
                onChange={(e) => setFilterStatusKebekerjaan(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg p-1.5 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Semua">Semua Status Kerja</option>
                <option value="Bekerja">Bekerja</option>
                <option value="Belum Bekerja">Belum Bekerja</option>
                <option value="Wirausaha">Wirausaha</option>
              </select>
            </div>

          </div>

          {/* Table Container */}
          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Nama Lengkap</th>
                    <th className="p-3">Jenis Pelatihan</th>
                    <th className="p-3">Kelulusan</th>
                    <th className="p-3">Kejuruan / Program</th>
                    <th className="p-3">Gender / Usia</th>
                    <th className="p-3">Inklusi Disabilitas</th>
                    <th className="p-3">Kebekerjaan</th>
                    <th className="p-3">Lokasi Penempatan</th>
                    <th className="p-3">Alamat</th>
                    {canModify && <th className="p-3 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-400">
                        Tidak ada data peserta pelatihan yang sesuai dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedParticipants.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">{p.nama}</td>
                        <td className="p-3 whitespace-nowrap">{p.jenisPelatihan}</td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.statusKelulusan === "Lulus" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            p.statusKelulusan === "Tidak Lulus" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                            "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            {p.statusKelulusan}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="block font-medium text-slate-800">{p.kejuruan}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">{p.programPelatihan}</span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono mr-1.5 ${
                            p.jenisKelamin === "L" ? "bg-indigo-50 text-indigo-700" : "bg-rose-50 text-rose-700"
                          }`}>{p.jenisKelamin}</span>
                          <span className="text-slate-500">{p.usia} th ({p.kategori})</span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            p.penyandangDisabilitas === "Ya" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-600"
                          }`}>
                            Disabilitas: {p.penyandangDisabilitas}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            p.statusKebekerjaan === "Bekerja" ? "bg-emerald-100 text-emerald-800" :
                            p.statusKebekerjaan === "Wirausaha" ? "bg-amber-100 text-amber-800" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {p.statusKebekerjaan}
                          </span>
                          {p.tempatBekerja && (
                            <span className="block text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]" title={p.tempatBekerja}>
                              {p.tempatBekerja}
                            </span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {p.lokasi ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded text-[10px] font-bold">
                              📍 {p.lokasi}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-3 max-w-[180px] truncate text-slate-400" title={p.alamat}>{p.alamat}</td>
                        {canModify && (
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="inline-flex gap-1">
                              <button
                                onClick={() => startEditPart(p)}
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-all"
                                title="Edit data"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deletePart(p.id)}
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition-all"
                                title="Hapus data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-500 font-medium">
                  Menampilkan <span className="font-bold text-slate-700">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-bold text-slate-700">{Math.min(currentPage * pageSize, filteredParticipants.length)}</span> dari <span className="font-bold text-slate-700">{filteredParticipants.length}</span> data
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
      )}

      {/* TAB 2: MASTER TYPES */}
      {activeTab === "types" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="font-semibold text-sm text-slate-800">Daftar Jenis Pelatihan (Database Jenis Pelatihan)</h3>
              <div className="relative max-w-[200px] w-full">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-full text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-[10px] uppercase">
                    <th className="p-3">Nama Jenis Pelatihan</th>
                    <th className="p-3">Keterangan / Deskripsi</th>
                    {canModify && <th className="p-3 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTypes.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">{t.nama}</td>
                      <td className="p-3 text-slate-500">{t.deskripsi || "-"}</td>
                      {canModify && (
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => startEditType(t)}
                            className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-100 mr-2"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteType(t.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form adding dynamic types */}
          {canModify && (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/50 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500">
                  {editingTypeId ? "Edit Jenis Pelatihan" : "Tambah Jenis Pelatihan Baru"}
                </h3>
                {editingTypeId && (
                  <button type="button" onClick={() => { setEditingTypeId(null); setNewTypeName(''); setNewTypeDesc(''); }} className="text-[10px] text-rose-500 hover:underline">Batal</button>
                )}
              </div>
              <form onSubmit={handleAddType} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Nama Jenis Pelatihan</label>
                  <input
                    type="text"
                    required
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Contoh: Pelatihan Mandiri"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Keterangan / Deskripsi</label>
                  <textarea
                    value={newTypeDesc}
                    onChange={(e) => setNewTypeDesc(e.target.value)}
                    placeholder="Tuliskan detail peruntukan jenis pelatihan ini..."
                    className="w-full h-16 p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 rounded-lg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> {editingTypeId ? "Simpan Perubahan" : "Tambah Jenis Pelatihan"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MASTER KEJURUAN */}
      {activeTab === "kejuruan" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="font-semibold text-sm text-slate-800">Daftar Kejuruan (Database Kejuruan)</h3>
              <div className="relative max-w-[200px] w-full">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-full text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-[10px] uppercase">
                    <th className="p-3">Nama Kejuruan</th>
                    {canModify && <th className="p-3 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredKejuruan.map(k => (
                    <tr key={k.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">{k.nama}</td>
                      {canModify && (
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => startEditKejuruan(k)}
                            className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-100 mr-2"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteKejuruan(k.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form adding dynamic kejuruan */}
          {canModify && (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/50 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500">
                  {editingKejuruanId ? "Edit Kejuruan" : "Tambah Kejuruan Baru"}
                </h3>
                {editingKejuruanId && (
                  <button type="button" onClick={() => { setEditingKejuruanId(null); setNewKejuruanName(''); }} className="text-[10px] text-rose-500 hover:underline">Batal</button>
                )}
              </div>
              <form onSubmit={handleAddKejuruan} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Nama Bidang Kejuruan</label>
                  <input
                    type="text"
                    required
                    value={newKejuruanName}
                    onChange={(e) => setNewKejuruanName(e.target.value)}
                    placeholder="Contoh: Energi Baru Terbarukan"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 rounded-lg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> {editingKejuruanId ? "Simpan Perubahan" : "Tambah Kejuruan"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MASTER PROGRAMS */}
      {activeTab === "programs" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="font-semibold text-sm text-slate-800">Daftar Program Pelatihan (Database Program Pelatihan)</h3>
              <div className="relative max-w-[200px] w-full">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-full text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-[10px] uppercase">
                    <th className="p-3">Nama Program Pelatihan</th>
                    <th className="p-3">Asosiasi Kejuruan</th>
                    {canModify && <th className="p-3 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPrograms.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">{p.nama}</td>
                      <td className="p-3 text-slate-500">{p.kejuruan}</td>
                      {canModify && (
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => startEditProgram(p)}
                            className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-100 mr-2"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteProgram(p.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form adding dynamic programs */}
          {canModify && (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/50 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500">
                  {editingProgramId ? "Edit Program" : "Tambah Program Baru"}
                </h3>
                {editingProgramId && (
                  <button type="button" onClick={() => { setEditingProgramId(null); setNewProgramName(''); setNewProgramKejuruan('Teknologi Pengolahan Agroindustri'); }} className="text-[10px] text-rose-500 hover:underline">Batal</button>
                )}
              </div>
              <form onSubmit={handleAddProgram} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Nama Program Pelatihan</label>
                  <input
                    type="text"
                    required
                    value={newProgramName}
                    onChange={(e) => setNewProgramName(e.target.value)}
                    placeholder="Contoh: Digital Marketing Dasar"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Pilih Kejuruan Terkait</label>
                  <select
                    value={newProgramKejuruan}
                    onChange={(e) => setNewProgramKejuruan(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    {dbState.kejuruanList.map(k => (
                      <option key={k.id} value={k.nama}>{k.nama}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 rounded-lg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> {editingProgramId ? "Simpan Perubahan" : "Tambah Program"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* FULL PARTICIPANT MODAL FORM (CREATE / EDIT) */}
      {showPartForm && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-8 p-4 z-[2000] overflow-y-auto animate-fade-in" id="modal-container">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-2xl w-full max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="font-display font-semibold text-slate-900 text-sm">
                  {editingPartId ? "Ubah Data Peserta Pelatihan" : "Tambah Data Peserta Baru"}
                </h3>
                <p className="text-[11px] text-slate-500">Sesuaikan semua struktur kolom database terintegrasi.</p>
              </div>
              <button onClick={resetPartForm} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form onSubmit={handlePartSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* SECTION 1: DATA IDENTITAS (PERSONAL DETAILS) */}
              <div className="space-y-4">
                <h4 className="font-semibold text-xs text-indigo-700 uppercase tracking-wider pb-1 border-b border-indigo-100">
                  1. Identitas Pribadi Peserta
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Nama */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      value={pNama}
                      onChange={(e) => setPNama(e.target.value)}
                      placeholder="Contoh: Akbar Setiawan"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* NIK */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">NIK (Nomor Induk Kependudukan)</label>
                    <input
                      type="text"
                      value={pNik}
                      onChange={(e) => setPNik(e.target.value)}
                      placeholder="Contoh: 32170xxxxxxxxxxx"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* No HP */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">No. HP / WhatsApp</label>
                    <input
                      type="text"
                      value={pNoHp}
                      onChange={(e) => setPNoHp(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      value={pEmail}
                      onChange={(e) => setPEmail(e.target.value)}
                      placeholder="Contoh: akbar@gmail.com"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Jenis Kelamin */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Jenis Kelamin *</label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          checked={pJenisKelamin === "L"}
                          onChange={() => setPJenisKelamin("L")}
                          className="accent-indigo-600"
                        /> Laki-laki (L)
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          checked={pJenisKelamin === "P"}
                          onChange={() => setPJenisKelamin("P")}
                          className="accent-indigo-600"
                        /> Perempuan (P)
                      </label>
                    </div>
                  </div>

                  {/* Tempat Lahir */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Tempat Lahir</label>
                    <input
                      type="text"
                      value={pTempatLahir}
                      onChange={(e) => setPTempatLahir(e.target.value)}
                      placeholder="Contoh: Bandung"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Tanggal Lahir */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Tanggal Lahir *</label>
                    <input
                      type="text"
                      required
                      value={pTanggalLahir}
                      onChange={(e) => setPTanggalLahir(e.target.value)}
                      placeholder="Contoh: 14/01/2000"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Usia & Kategori */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Usia *</label>
                      <input
                        type="number"
                        required
                        value={pUsia}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setPUsia(val);
                          setPKategori(val >= 60 ? "Lansia" : "Bukan Lansia");
                        }}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Kategori</label>
                      <input
                        type="text"
                        disabled
                        value={pKategori}
                        className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500"
                      />
                    </div>
                  </div>

                  {/* Pendidikan Terakhir */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Pendidikan Terakhir</label>
                    <input
                      type="text"
                      value={pPendidikanTerakhir}
                      onChange={(e) => setPPendidikanTerakhir(e.target.value)}
                      placeholder="Contoh: SMA / SMK / D3 / S1"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Disabilitas Tipe */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Disabilitas Tipe Disabilitas *</label>
                    <input
                      type="text"
                      value={pDisabilitasTipe}
                      onChange={(e) => {
                        setPDisabilitasTipe(e.target.value);
                        setPPenyandangDisabilitas(e.target.value && e.target.value.toLowerCase() !== "tidak" && e.target.value.toLowerCase() !== "tidak ada" ? "Ya" : "Tidak");
                      }}
                      placeholder="Isi jenis disabilitas, atau 'Tidak'"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Penyandang Disabilitas (Derived) */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Inklusi Disabilitas</label>
                    <select
                      value={pPenyandangDisabilitas}
                      onChange={(e) => setPPenyandangDisabilitas(e.target.value as Participant["penyandangDisabilitas"])}
                      className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      disabled
                    >
                      <option value="Tidak">Tidak</option>
                      <option value="Ya">Ya</option>
                    </select>
                  </div>
                </div>

                {/* Alamat Domisili */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Alamat Lengkap Domisili</label>
                  <textarea
                    value={pAlamat}
                    onChange={(e) => setPAlamat(e.target.value)}
                    placeholder="Tuliskan alamat lengkap berserta RT/RW, kelurahan, kecamatan, kota/kabupaten"
                    className="w-full h-16 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                  />
                </div>
              </div>

              {/* SECTION 2: LUAR NEGERI (OVERSEAS PREFERENCES) */}
              <div className="space-y-4">
                <h4 className="font-semibold text-xs text-indigo-700 uppercase tracking-wider pb-1 border-b border-indigo-100">
                  2. Riwayat &amp; Minat Luar Negeri
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Pernah Bekerja di Luar Negeri */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Pernah Bekerja di Luar Negeri *</label>
                    <select
                      value={pPernahBekerjaLuarNegeri}
                      onChange={(e) => setPPernahBekerjaLuarNegeri(e.target.value as Participant["pernahBekerjaLuarNegeri"])}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Tidak">Tidak</option>
                      <option value="Ya">Ya</option>
                    </select>
                  </div>

                  {/* Berminat Bekerja di Luar Negeri */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Berminat Bekerja di Luar Negeri *</label>
                    <select
                      value={pBerminatBekerjaLuarNegeri}
                      onChange={(e) => setPBerminatBekerjaLuarNegeri(e.target.value as Participant["berminatBekerjaLuarNegeri"])}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Tidak">Tidak</option>
                      <option value="Ya">Ya</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: DETAIL PROGRAM PELATIHAN (PROGRAM DETAILS) */}
              <div className="space-y-4">
                <h4 className="font-semibold text-xs text-indigo-700 uppercase tracking-wider pb-1 border-b border-indigo-100">
                  3. Metadata Program Pelatihan &amp; Hasil
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Kode Transaksi */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Kode Transaksi</label>
                    <input
                      type="text"
                      value={pKodeTransaksi}
                      onChange={(e) => setPKodeTransaksi(e.target.value)}
                      placeholder="Contoh: TR-2024-001"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Jenis Pelatihan */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Jenis Pelatihan *</label>
                    <select
                      value={pJenisPelatihan}
                      onChange={(e) => setPJenisPelatihan(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    >
                      {dbState.trainingTypes.map(t => (
                        <option key={t.id} value={t.nama}>{t.nama}</option>
                      ))}
                    </select>
                  </div>

                  {/* Kejuruan */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Bidang Kejuruan *</label>
                    <select
                      value={pKejuruan}
                      onChange={(e) => setPKejuruan(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    >
                      {dbState.kejuruanList.map(k => (
                        <option key={k.id} value={k.nama}>{k.nama}</option>
                      ))}
                    </select>
                  </div>

                  {/* Program Pelatihan */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Judul Program Pelatihan *</label>
                    <input
                      type="text"
                      required
                      value={pProgramPelatihan}
                      onChange={(e) => setPProgramPelatihan(e.target.value)}
                      placeholder="Contoh: Penyangraian Biji Kopi"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      list="autocomplete-programs"
                    />
                    <datalist id="autocomplete-programs">
                      {dbState.programs.map(pr => (
                        <option key={pr.id} value={pr.nama}></option>
                      ))}
                    </datalist>
                  </div>

                  {/* Metode Pelatihan */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Metode Pelatihan</label>
                    <input
                      type="text"
                      value={pMetodePelatihan}
                      onChange={(e) => setPMetodePelatihan(e.target.value)}
                      placeholder="Contoh: Luring, Daring, Blended"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Angkatan */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Angkatan</label>
                    <input
                      type="text"
                      value={pAngkatan}
                      onChange={(e) => setPAngkatan(e.target.value)}
                      placeholder="Contoh: Angkatan I"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Durasi */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Durasi (JP)</label>
                    <input
                      type="text"
                      value={pDurasi}
                      onChange={(e) => setPDurasi(e.target.value)}
                      placeholder="Contoh: 120 JP"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Biaya Pelatihan */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Biaya Pelatihan</label>
                    <input
                      type="text"
                      value={pBiayaPelatihan}
                      onChange={(e) => setPBiayaPelatihan(e.target.value)}
                      placeholder="Contoh: APBN / Mandiri"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Tanggal Mulai Pelatihan */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Tanggal Mulai Pelatihan *</label>
                    <input
                      type="text"
                      required
                      value={pTanggalMulaiPelatihan}
                      onChange={(e) => setPTanggalMulaiPelatihan(e.target.value)}
                      placeholder="Contoh: 2024-01-15"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Tanggal Selesai Pelatihan */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Tanggal Selesai Pelatihan</label>
                    <input
                      type="text"
                      value={pTanggalSelesaiPelatihan}
                      onChange={(e) => setPTanggalSelesaiPelatihan(e.target.value)}
                      placeholder="Contoh: 2024-02-15"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Absensi */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Absensi</label>
                    <input
                      type="text"
                      value={pAbsensi}
                      onChange={(e) => setPAbsensi(e.target.value)}
                      placeholder="Contoh: 98% / 24 Hari"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Status Selesai Pelatihan */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Status Selesai Pelatihan</label>
                    <input
                      type="text"
                      value={pStatusSelesaiPelatihan}
                      onChange={(e) => setPStatusSelesaiPelatihan(e.target.value)}
                      placeholder="Contoh: Selesai"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Status Kelulusan */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Status Kelulusan *</label>
                    <select
                      value={pStatusKelulusan}
                      onChange={(e) => setPStatusKelulusan(e.target.value as Participant["statusKelulusan"])}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    >
                      <option value="Lulus">Lulus</option>
                      <option value="Tidak Lulus">Tidak Lulus</option>
                      <option value="Dalam Proses">Dalam Proses</option>
                    </select>
                  </div>

                  {/* Sumber Anggaran */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Sumber Anggaran</label>
                    <input
                      type="text"
                      value={pSumberAnggaran}
                      onChange={(e) => setPSumberAnggaran(e.target.value)}
                      placeholder="Contoh: APBN / APBD"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Tanggal Pelatihan (Legacy / Derived) */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Tanggal / Batch (Format Laporan)</label>
                    <input
                      type="text"
                      value={pTanggalPelatihan}
                      onChange={(e) => setPTanggalPelatihan(e.target.value)}
                      placeholder="Contoh: 15-May-24"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: TRACER STUDY & PENEMPATAN (EMPLOYMENT PLACEMENT) */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <h4 className="font-semibold text-xs text-indigo-700 uppercase tracking-wider pb-1 border-b border-indigo-100 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-indigo-600" /> 4. Pelacakan Alumni (Tracer Study &amp; Penempatan)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Status Kebekerjaan */}
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Status Kebekerjaan *</label>
                    <select
                      value={pStatusKebekerjaan}
                      onChange={(e) => setPStatusKebekerjaan(e.target.value as Participant["statusKebekerjaan"])}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Belum Bekerja">Belum Bekerja</option>
                      <option value="Bekerja">Bekerja</option>
                      <option value="Wirausaha">Wirausaha</option>
                    </select>
                  </div>

                  {/* Nama Perusahaan / Nama Usaha */}
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Nama Perusahaan / Nama Usaha</label>
                    <input
                      type="text"
                      value={pTempatBekerja}
                      onChange={(e) => setPTempatBekerja(e.target.value)}
                      placeholder="Contoh: PT. Sumber Makmur"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Lokasi Kerja */}
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1 flex justify-between items-center">
                      <span>Lokasi Penempatan (Kota/Kab) *</span>
                      {pTempatBekerja && pTempatBekerja.trim() && (
                        <button
                          type="button"
                          onClick={handleAILocationLookup}
                          disabled={isLookingUpSingle}
                          className="text-[9px] text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-wider flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                        >
                          {isLookingUpSingle ? (
                            <span>Mencari...</span>
                          ) : (
                            <>
                              <Sparkles className="w-2.5 h-2.5 text-indigo-500 animate-pulse" />
                              <span>Cari dengan AI</span>
                            </>
                          )}
                        </button>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required={pStatusKebekerjaan !== "Belum Bekerja"}
                        value={pLokasi}
                        onChange={(e) => setPLokasi(e.target.value)}
                        onBlur={async () => {
                          if (pTempatBekerja && pTempatBekerja.trim() && (!pLokasi || !pLokasi.trim())) {
                            setIsLookingUpSingle(true);
                            try {
                              const res = await fetch("/api/ai/lookup-locations", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ companies: [pTempatBekerja.trim()] })
                              });
                              const result = await res.json();
                              if (result && result.locations && result.locations[pTempatBekerja.trim()]) {
                                setPLokasi(result.locations[pTempatBekerja.trim()]);
                              }
                            } catch (error) {
                              console.error("On blur location lookup failed:", error);
                            } finally {
                              setIsLookingUpSingle(false);
                            }
                          }
                        }}
                        placeholder="Contoh: Bandung Barat"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 pr-8"
                      />
                      {isLookingUpSingle && (
                        <span className="absolute right-2.5 top-2.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Status Penempatan</label>
                    <select
                      value={pStatus}
                      onChange={(e) => setPStatus(e.target.value)}
                      disabled={pStatusKebekerjaan === "Belum Bekerja"}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:bg-slate-100"
                    >
                      <option value="">- Pilih Status Penempatan -</option>
                      <option value="Pegawai Tetap">Pegawai Tetap</option>
                      <option value="Kontrak">Kontrak / Freelance</option>
                      <option value="Magang">Magang / Internship</option>
                      <option value="Owner">Owner / Wirausaha</option>
                    </select>
                  </div>

                  {/* Jabatan */}
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Jabatan</label>
                    <input
                      type="text"
                      value={pJabatan}
                      onChange={(e) => setPJabatan(e.target.value)}
                      placeholder="Contoh: Operator Produksi, Barista"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Tanggal Penempatan */}
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Tanggal Penempatan</label>
                    <input
                      type="text"
                      value={pTanggalPenempatan}
                      onChange={(e) => setPTanggalPenempatan(e.target.value)}
                      placeholder="Contoh: 2024-03-01"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                <button
                  type="button"
                  onClick={resetPartForm}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  {editingPartId ? "Simpan Perubahan" : "Simpan Peserta Baru"}
                </button>
              </div>

            </form>

          </div>
        </div>, document.body
      )}

      {openCSVImporter && (
        <SmartCSVImporter
          isOpen={!!openCSVImporter}
          onClose={() => setOpenCSVImporter(null)}
          entityType={
            openCSVImporter === "participants" ? "participants" :
            openCSVImporter === "types" ? "trainingTypes" :
            openCSVImporter === "kejuruan" ? "kejuruanList" : "programs"
          }
          onImport={handleSmartCSVImport}
          kejuruanList={dbState.kejuruanList}
          existingData={
            openCSVImporter === "participants" ? dbState.participants :
            openCSVImporter === "types" ? dbState.trainingTypes :
            openCSVImporter === "kejuruan" ? dbState.kejuruanList : dbState.programs
          }
        />
      )}

      {isEnrichingLocations && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-start pt-32 z-[2000] animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full border border-slate-100 shadow-2xl text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100">
                <Sparkles className="w-8 h-8 text-indigo-600 animate-bounce" />
                <span className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-slate-800">Menemukan Lokasi Otomatis</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Kecerdasan Buatan (Gemini AI) sedang memindai nama-nama perusahaan penempatan dan mencarikan lokasi daerahnya secara otomatis...
              </p>
            </div>
          </div>
        </div>, document.body
      )}

      {showConfirm && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-8 z-[1000] animate-fade-in px-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full border border-slate-100 shadow-2xl animate-scale-up">
            <div className="flex items-start gap-4">
              <div className={`p-3.5 rounded-2xl shrink-0 ${confirmConfig.isDanger ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-display font-bold text-slate-800">{confirmConfig.title}</h4>
                <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-semibold">{confirmConfig.message}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8 border-t border-slate-100 pt-5">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  confirmConfig.onConfirm();
                  setShowConfirm(false);
                }}
                className={`px-5 py-2.5 text-white font-bold rounded-xl text-xs shadow-xs transition-all active:scale-95 cursor-pointer ${
                  confirmConfig.isDanger 
                    ? 'bg-rose-600 hover:bg-rose-700 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2' 
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                }`}
              >
                {confirmConfig.actionLabel}
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {importSummary && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-8 z-[1500] animate-fade-in px-4 p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full border border-slate-100 shadow-2xl animate-scale-up flex flex-col max-h-[85vh] overflow-hidden relative">
            <button
              onClick={() => setImportSummary(null)}
              className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8 overflow-y-auto flex-1">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-xs">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h4 className="text-xl font-display font-bold text-slate-800">Impor Data Berhasil!</h4>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Data dari {importSummary.source} telah berhasil dipetakan secara cerdas.
                </p>
              </div>

              <div className="mt-6 space-y-3 bg-slate-50/50 border border-slate-100 p-5 rounded-2xl">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Peserta Pelatihan</span>
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">+{importSummary.participantsCount} data</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Jenis Pelatihan Baru</span>
                  <span className="font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">+{importSummary.newTypesCount} master</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Kejuruan Baru</span>
                  <span className="font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">+{importSummary.newKejuruanCount} master</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Program Pelatihan Baru</span>
                  <span className="font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">+{importSummary.newProgramsCount} master</span>
                </div>
              </div>

              <p className="text-[10px] text-center font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/50 py-2.5 px-4 rounded-xl mt-5">
                ✓ Seluruh menu & tabel referensi tersinkronisasi seketika!
              </p>
            </div>
            
            <div className="p-6 bg-white border-t border-slate-100 shrink-0">
              <button
                onClick={() => setImportSummary(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
