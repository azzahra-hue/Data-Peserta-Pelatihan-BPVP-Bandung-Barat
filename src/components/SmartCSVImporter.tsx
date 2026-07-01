import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Play, HelpCircle, Edit2, RotateCcw, Plus } from "lucide-react";
import { Participant, TrainingType, Kejuruan, ProgramPelatihan } from "../types";

interface SmartCSVImporterProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "participants" | "trainingTypes" | "kejuruanList" | "programs";
  onImport: (importedData: any[]) => void;
  existingData?: any[];
  kejuruanList?: any[]; // for programs to associate with existing kejuruan
}

// target database fields depending on the entity type
interface TargetField {
  key: string;
  label: string;
  required: boolean;
  candidates: string[];
  description: string;
}

export default function SmartCSVImporter({
  isOpen,
  onClose,
  entityType,
  onImport,
  existingData = [],
  kejuruanList = []
}: SmartCSVImporterProps) {
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "success">("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<Record<number, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<number, Record<string, string>>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [showConfirmIgnoreErrors, setShowConfirmIgnoreErrors] = useState(false);
  const [pendingCleanImports, setPendingCleanImports] = useState<any[]>([]);
  const [previewPage, setPreviewPage] = useState(1);
  const previewPageSize = 50;
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      resetImporter();
    }
  }, [isOpen, entityType]);

  const resetImporter = () => {
    setCsvText("");
    setFileName(null);
    setStep("upload");
    setHeaders([]);
    setRawRows([]);
    setFieldMappings({});
    setParsedData([]);
    setSelectedRows({});
    setValidationErrors({});
  };

  const getTargetFields = (): TargetField[] => {
    switch (entityType) {
      case "participants":
        return [
          { key: "kodeTransaksi", label: "KODE TRANSAKSI", required: false, candidates: ["kode transaksi", "kode_transaksi", "transaction code", "id transaksi"], description: "Kode transaksi pembayaran/pendaftaran" },
          { key: "nama", label: "Nama", required: true, candidates: ["nama", "nama lengkap", "name", "full name", "nama peserta", "peserta"], description: "Nama lengkap peserta" },
          { key: "nik", label: "NIK", required: false, candidates: ["nik", "no. ktp", "no ktp", "identity number"], description: "Nomor Induk Kependudukan (16 digit)" },
          { key: "noHp", label: "No. HP", required: false, candidates: ["no. hp", "no hp", "nomor hp", "phone", "mobile", "telepon"], description: "Nomor handphone peserta" },
          { key: "email", label: "Email", required: false, candidates: ["email", "e-mail", "alamat email", "mail"], description: "Alamat email" },
          { key: "jenisKelamin", label: "Jenis Kelamin", required: true, candidates: ["jenis kelamin", "jk", "gender", "kelamin", "sex"], description: "L atau P" },
          { key: "alamat", label: "Alamat", required: false, candidates: ["alamat", "alamat domisili", "domisili", "address", "alamat tinggal"], description: "Alamat tempat tinggal lengkap" },
          { key: "tempatLahir", label: "Tempat Lahir", required: false, candidates: ["tempat lahir", "tpt lahir", "birthplace", "tempat_lahir"], description: "Kota/kabupaten tempat lahir" },
          { key: "tanggalLahir", label: "Tanggal Lahir", required: true, candidates: ["tanggal lahir", "tgl lahir", "birthdate", "tanggal_lahir", "tgl_lahir"], description: "Format: DD/MM/YYYY" },
          { key: "usia", label: "Usia", required: true, candidates: ["usia", "umur", "age"], description: "Angka umur peserta (0 - 150)" },
          { key: "pendidikanTerakhir", label: "Pendidikan Terakhir", required: false, candidates: ["pendidikan terakhir", "pendidikan", "last education", "pendidikan_terakhir"], description: "Contoh: SMA, S1, SMK, dll." },
          { key: "disabilitasTipe", label: "Disabilitas Tipe Disabilitas *", required: false, candidates: ["disabilitas tipe disabilitas *", "disabilitas", "tipe disabilitas", "disability", "disabel", "cacat"], description: "Isi 'Tidak' atau jenis disabilitasnya" },
          { key: "pernahBekerjaLuarNegeri", label: "Pernah Bekerja di Luar Negeri", required: false, candidates: ["pernah bekerja di luar negeri", "bekerja luar negeri", "ex tki", "luar negeri"], description: "Ya atau Tidak" },
          { key: "berminatBekerjaLuarNegeri", label: "Berminat Bekerja di Luar Negeri", required: false, candidates: ["berminat bekerja di luar negeri", "minat luar negeri", "minat bekerja luar negeri"], description: "Ya atau Tidak" },
          { key: "programPelatihan", label: "Judul Program Pelatihan", required: true, candidates: ["judul program pelatihan", "program pelatihan", "program", "training program", "nama program", "program_pelatihan"], description: "Contoh: Penyangraian Biji Kopi" },
          { key: "kejuruan", label: "Kejuruan", required: true, candidates: ["kejuruan", "bidang", "vocational", "department", "bidang kejuruan"], description: "Contoh: Pariwisata, Agroindustri" },
          { key: "metodePelatihan", label: "Metode Pelatihan", required: false, candidates: ["metode pelatihan", "metode", "method", "metode_pelatihan"], description: "Contoh: Luring, Daring, Blended" },
          { key: "jenisPelatihan", label: "Jenis Pelatihan", required: true, candidates: ["jenis pelatihan", "jenis", "tipe", "training type", "jenis_pelatihan", "kategori pelatihan"], description: "Contoh: Pelatihan Berbasis Kompetensi (PBK)" },
          { key: "angkatan", label: "Angkatan", required: false, candidates: ["angkatan", "batch", "angkatan_pelatihan"], description: "Contoh: Angkatan I, II, III" },
          { key: "durasi", label: "Durasi (JP)", required: false, candidates: ["durasi (jp)", "durasi", "jp", "hours", "duration"], description: "Jumlah Jam Pelajaran" },
          { key: "biayaPelatihan", label: "Biaya Pelatihan", required: false, candidates: ["biaya pelatihan", "biaya", "cost", "price", "biaya_pelatihan"], description: "Contoh: APBN, Mandiri, dll" },
          { key: "tanggalMulaiPelatihan", label: "Tanggal Mulai Pelatihan", required: false, candidates: ["tanggal mulai pelatihan", "mulai pelatihan", "tanggal mulai", "start date", "mulai"], description: "Format: DD/MM/YYYY atau YYYY-MM-DD" },
          { key: "tanggalSelesaiPelatihan", label: "Tanggal Selesai Pelatihan", required: false, candidates: ["tanggal selesai pelatihan", "selesai pelatihan", "tanggal selesai", "end date", "selesai"], description: "Format: DD/MM/YYYY atau YYYY-MM-DD" },
          { key: "absensi", label: "Absensi", required: false, candidates: ["absensi", "kehadiran", "attendance"], description: "Persentase/Jumlah kehadiran" },
          { key: "statusSelesaiPelatihan", label: "Status Selesai Pelatihan", required: false, candidates: ["status selesai pelatihan", "status selesai", "selesai"], description: "Contoh: Selesai, Mengundurkan Diri" },
          { key: "statusKelulusan", label: "Status Kelulusan", required: true, candidates: ["status kelulusan", "status", "kelulusan", "graduated", "lulus"], description: "Lulus, Tidak Lulus, atau Dalam Proses" },
          { key: "sumberAnggaran", label: "Sumber Anggaran", required: false, candidates: ["sumber anggaran", "sumber dana", "anggaran", "budget source", "sumber_anggaran"], description: "Contoh: APBN, APBD" },
          { key: "statusKebekerjaan", label: "Status Kebekerjaan", required: true, candidates: ["status kebekerjaan", "kebekerjaan", "kerja", "status kerja", "employment"], description: "Belum Bekerja, Bekerja, atau Wirausaha" },
          { key: "tempatBekerja", label: "Nama Perusahaan/Nama Usaha", required: false, candidates: ["nama perusahaan/nama usaha", "tempat bekerja", "instansi", "perusahaan", "tempat kerja", "kantor", "nama usaha"], description: "Nama perusahaan/tempat usaha penempatan" },
          { key: "lokasi", label: "Lokasi Penempatan (Kota/Kab)", required: true, candidates: ["lokasi", "lokasi penempatan", "lokasi kerja", "kota penempatan", "kota kerja", "kabupaten", "daerah penempatan", "lokasi_penempatan"], description: "Daerah penempatan (contoh: Kab. Subang, Kota Bandung)" },
          { key: "status", label: "Status", required: false, candidates: ["status", "status_peserta"], description: "Status penempatan alumni" },
          { key: "jabatan", label: "jabatan", required: false, candidates: ["jabatan", "posisi", "position", "role"], description: "Jabatan pekerjaan saat ini" },
          { key: "tanggalPenempatan", label: "Tanggal Penempatan", required: false, candidates: ["tanggal penempatan", "penempatan", "tanggal kerja", "placement date"], description: "Format: DD/MM/YYYY" },
        ];
      case "trainingTypes":
        return [
          { key: "nama", label: "Nama Jenis Pelatihan", required: true, candidates: ["nama", "nama jenis", "jenis", "jenis pelatihan", "title", "name"], description: "Contoh: Blended Learning" },
          { key: "deskripsi", label: "Deskripsi", required: false, candidates: ["deskripsi", "keterangan", "desk", "description", "info"], description: "Keterangan detail jenis pelatihan" }
        ];
      case "kejuruanList":
        return [
          { key: "nama", label: "Nama Kejuruan", required: true, candidates: ["nama", "nama kejuruan", "kejuruan", "bidang", "name", "title"], description: "Contoh: Pariwisata" }
        ];
      case "programs":
        return [
          { key: "nama", label: "Nama Program Pelatihan", required: true, candidates: ["nama", "nama program", "program", "program pelatihan", "name", "title"], description: "Contoh: Barista" },
          { key: "kejuruan", label: "Asosiasi Kejuruan", required: true, candidates: ["kejuruan", "nama kejuruan", "asosiasi kejuruan", "bidang"], description: "Asosiasi bidang kejuruan program ini" }
        ];
      default:
        return [];
    }
  };

  const parseCSV = (text: string): string[][] => {
    // Auto-detect separator
    const firstLine = text.split(/\r?\n/)[0] || "";
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const separator = semicolonCount > commaCount ? ";" : ",";

    const lines: string[][] = [];
    let row: string[] = [];
    let currentCell = "";
    let inQuotes = false;

    // Much faster parse loop utilizing slice
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (inQuotes) {
        if (char === '"' && text[i + 1] === '"') {
          currentCell += '"';
          i++; // skip next quote
        } else if (char === '"') {
          inQuotes = false;
        } else {
          currentCell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === separator) {
          row.push(currentCell.trim());
          currentCell = "";
        } else if (char === '\n' || char === '\r') {
          row.push(currentCell.trim());
          if (row.some(c => c !== "")) lines.push(row);
          row = [];
          currentCell = "";
          if (char === '\r' && text[i + 1] === '\n') {
            i++;
          }
        } else {
          currentCell += char;
        }
      }
    }
    
    if (currentCell !== "" || row.length > 0) {
      row.push(currentCell.trim());
      if (row.some(c => c !== "")) lines.push(row);
    }
    
    return lines;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      processRawCSV(text);
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!csvText.trim()) return;
    setFileName("Pasted Data.csv");
    processRawCSV(csvText);
  };

  const processRawCSV = (text: string) => {
    const lines = parseCSV(text);
    if (lines.length < 2) {
      showNotification("File CSV minimal harus memiliki satu baris header dan satu baris data.");
      return;
    }

    const fileHeaders = lines[0].map(h => h.replace(/^"|"$/g, "").trim());
    const dataRows = lines.slice(1);

    setHeaders(fileHeaders);
    setRawRows(dataRows);

    // Heuristic column auto-mapping
    const targets = getTargetFields();
    const mappings: Record<string, string> = {};

    targets.forEach(target => {
      // Find exact or closest match in headers
      const matchedHeader = fileHeaders.find(h => {
        const cleanedH = h.toLowerCase().replace(/[\s_\-\/]/g, "");
        return target.candidates.some(candidate => {
          const cleanedC = candidate.toLowerCase().replace(/[\s_\-\/]/g, "");
          return cleanedH === cleanedC || cleanedH.includes(cleanedC) || cleanedC.includes(cleanedH);
        });
      });

      if (matchedHeader) {
        mappings[target.key] = matchedHeader;
      }
    });

    setFieldMappings(mappings);
    setStep("mapping");
  };

  const startMappingExecution = () => {
    // Transform rawRows using mapped columns
    const targets = getTargetFields();
    const finalDataList: any[] = [];
    const initialSelected: Record<number, boolean> = {};

    rawRows.forEach((row, rowIndex) => {
      const item: any = { id: `${entityType === "participants" ? "p" : "master"}-${Date.now()}-${rowIndex}` };
      
      targets.forEach(target => {
        const mappedHeader = fieldMappings[target.key];
        const headerIndex = headers.indexOf(mappedHeader);
        let value = headerIndex !== -1 ? row[headerIndex] : "";
        
        // Smart Data Cleaning / Sanitization
        if (target.key === "usia" && value) {
          // Extract numeric digits
          const match = value.match(/\d+/);
          value = match ? parseInt(match[0], 10) : "";
        }
        
        if (target.key === "jenisKelamin" && value) {
          const cleanedVal = value.trim().toLowerCase();
          if (cleanedVal.startsWith("l") || cleanedVal.includes("laki") || cleanedVal === "male" || cleanedVal === "man") {
            value = "L";
          } else if (cleanedVal.startsWith("p") || cleanedVal.includes("perempuan") || cleanedVal.includes("wanita") || cleanedVal === "female" || cleanedVal === "woman") {
            value = "P";
          } else {
            value = "L"; // default
          }
        }

        if (target.key === "penyandangDisabilitas" && value) {
          const cleanedVal = value.trim().toLowerCase();
          if (cleanedVal === "ya" || cleanedVal === "yes" || cleanedVal === "true" || cleanedVal === "1") {
            value = "Ya";
          } else {
            value = "Tidak";
          }
        }

        if (target.key === "statusKelulusan" && value !== undefined && value !== null) {
          const cleanedVal = String(value).trim().toLowerCase();
          if (
            cleanedVal === "1" || 
            cleanedVal === "true" || 
            cleanedVal === "lulus" || 
            cleanedVal === "passed" || 
            cleanedVal === "graduated" || 
            cleanedVal === "success" || 
            (cleanedVal.includes("lulus") && !cleanedVal.includes("tidak"))
          ) {
            value = "Lulus";
          } else if (
            cleanedVal === "0" || 
            cleanedVal === "false" || 
            cleanedVal.includes("tidak") || 
            cleanedVal.includes("belum") || 
            cleanedVal === "failed" ||
            cleanedVal === "gagal"
          ) {
            value = "Tidak Lulus";
          } else {
            value = "Dalam Proses";
          }
        }

        if (target.key === "statusKebekerjaan" && value) {
          const cleanedVal = value.trim().toLowerCase();
          if (cleanedVal.includes("belum") || cleanedVal.includes("tidak") || cleanedVal === "unemployed" || cleanedVal === "mencari") {
            value = "Belum Bekerja";
          } else if (cleanedVal.includes("wirausaha") || cleanedVal.includes("bisnis") || cleanedVal === "entrepreneur" || cleanedVal === "usaha") {
            value = "Wirausaha";
          } else if (cleanedVal.includes("bekerja") || cleanedVal === "kerja" || cleanedVal === "employed") {
            value = "Bekerja";
          } else {
            value = "Belum Bekerja";
          }
        }

        item[target.key] = value !== undefined ? value : "";
      });

      // Calculate auto category for participants
      if (entityType === "participants") {
        item.kategori = (Number(item.usia) || 0) >= 60 ? "Lansia" : "Bukan Lansia";
        if (!item.tanggalLahir) item.tanggalLahir = "01/01/2000";
        
        // Helper function for parsing year
        const parseToTanggalPelatihan = (tanggalMulai: string): string => {
          if (!tanggalMulai) return "15-May-25";
          const trimmed = tanggalMulai.trim();
          if (trimmed.match(/^\d{2}-[a-zA-Z]{3}-\d{2}$/)) {
            return trimmed;
          }
          let year = "25";
          if (trimmed.includes("2024") || trimmed.endsWith("-24") || trimmed.endsWith("/24") || trimmed.endsWith(" 24")) year = "24";
          if (trimmed.includes("2026") || trimmed.endsWith("-26") || trimmed.endsWith("/26") || trimmed.endsWith(" 26")) year = "26";
          if (trimmed.includes("2027") || trimmed.endsWith("-27") || trimmed.endsWith("/27") || trimmed.endsWith(" 27")) year = "27";
          return `15-May-${year}`;
        };

        item.tanggalPelatihan = parseToTanggalPelatihan(item.tanggalMulaiPelatihan || item.tanggalPelatihan || "");
        
        // Derive penyandangDisabilitas status ('Ya' | 'Tidak') from disabilitasTipe
        const tipeDis = (item.disabilitasTipe || "").trim().toLowerCase();
        const isNotDisabled = 
          !tipeDis ||
          tipeDis === "tidak" || 
          tipeDis === "tidak ada" || 
          tipeDis === "tidak ada disabilitas" || 
          tipeDis === "tidak disabilitas" || 
          tipeDis === "normal" || 
          tipeDis === "-" || 
          tipeDis === "none" || 
          tipeDis === "t" || 
          tipeDis === "n" || 
          tipeDis === "no" || 
          tipeDis === "bukan";

        if (!isNotDisabled) {
          item.penyandangDisabilitas = "Ya";
        } else {
          item.penyandangDisabilitas = "Tidak";
          if (tipeDis === "t" || tipeDis === "n" || tipeDis === "no" || tipeDis === "none" || tipeDis === "-") {
            item.disabilitasTipe = "Tidak";
          }
        }
        
        if (!item.statusKebekerjaan) item.statusKebekerjaan = "Belum Bekerja";
      }

      finalDataList.push(item);
      initialSelected[rowIndex] = true; // default select all
    });

    setParsedData(finalDataList);
    setSelectedRows(initialSelected);
    validateDataRows(finalDataList);
    setPreviewPage(1);
    setStep("preview");
  };

  const validateDataRows = (dataList: any[]) => {
    const errors: Record<number, Record<string, string>> = {};
    const targets = getTargetFields();

    dataList.forEach((item, index) => {
      const rowErrors: Record<string, string> = {};

      targets.forEach(target => {
        const val = item[target.key];
        
        let isRequired = target.required;
        if (target.key === "lokasi") {
          const sk = String(item.statusKebekerjaan || "").trim().toLowerCase();
          if (sk !== "bekerja" && sk !== "wirausaha") {
            isRequired = false;
          }
        }

        if (isRequired && (val === undefined || val === null || val === "")) {
          rowErrors[target.key] = `${target.label} wajib diisi.`;
        }

        // Specific rules
        if (target.key === "usia" && val !== "") {
          const num = Number(val);
          if (isNaN(num) || num < 0 || num > 150) {
            rowErrors[target.key] = "Usia harus angka antara 0-150.";
          }
        }

        if (target.key === "jenisKelamin" && val !== "" && val !== "L" && val !== "P") {
          rowErrors[target.key] = "Jenis Kelamin harus 'L' atau 'P'.";
        }

        if (target.key === "penyandangDisabilitas" && val !== "" && val !== "Ya" && val !== "Tidak") {
          rowErrors[target.key] = "Disabilitas harus 'Ya' atau 'Tidak'.";
        }
        
        if (target.key === "statusKelulusan" && val !== "" && !["Lulus", "Tidak Lulus", "Dalam Proses"].includes(val)) {
          rowErrors[target.key] = "Status Kelulusan harus 'Lulus', 'Tidak Lulus', atau 'Dalam Proses'.";
        }
        
        if (target.key === "statusKebekerjaan" && val !== "" && !["Bekerja", "Belum Bekerja", "Wirausaha"].includes(val)) {
          rowErrors[target.key] = "Status Kebekerjaan harus 'Bekerja', 'Belum Bekerja', atau 'Wirausaha'.";
        }
      });

      if (Object.keys(rowErrors).length > 0) {
        errors[index] = rowErrors;
      }
    });

    setValidationErrors(errors);
  };

  const handleCellEdit = (rowIndex: number, key: string, newValue: any) => {
    const updated = [...parsedData];
    updated[rowIndex] = { ...updated[rowIndex], [key]: newValue };
    
    // Auto categorize if age changes
    if (entityType === "participants" && key === "usia") {
      const numUsia = Number(newValue) || 0;
      updated[rowIndex].kategori = numUsia >= 60 ? "Lansia" : "Bukan Lansia";
    }

    setParsedData(updated);
    validateDataRows(updated);
  };

  const repairDataAutomatically = () => {
    const repaired = parsedData.map(item => {
      const newItem = { ...item };
      
      // Auto-fill missing required string fields
      if (entityType === "participants") {
        if (!newItem.nama) newItem.nama = "Alumni Tanpa Nama";
        if (!newItem.jenisPelatihan) newItem.jenisPelatihan = "Pelatihan Berbasis Kompetensi (PBK)";
        if (!newItem.programPelatihan) newItem.programPelatihan = "Budidaya Hidroponik";
        if (!newItem.kejuruan) newItem.kejuruan = "Agroindustri";
        if (!["Lulus", "Tidak Lulus", "Dalam Proses"].includes(newItem.statusKelulusan)) newItem.statusKelulusan = "Lulus";
        if (!["Bekerja", "Belum Bekerja", "Wirausaha"].includes(newItem.statusKebekerjaan)) newItem.statusKebekerjaan = "Belum Bekerja";
        if (!newItem.jenisKelamin) newItem.jenisKelamin = "L";
        if (!newItem.usia) newItem.usia = 25;
        if (!newItem.tanggalLahir) newItem.tanggalLahir = "01/01/2000";
        if (!newItem.alamat) newItem.alamat = "Jl. Raya Lembang, Bandung Barat";
        const sk = String(newItem.statusKebekerjaan || "").trim().toLowerCase();
        if ((sk === "bekerja" || sk === "wirausaha") && !newItem.lokasi) {
          newItem.lokasi = "Belum Diketahui";
        }
        if (!newItem.tanggalMulaiPelatihan) newItem.tanggalMulaiPelatihan = "01/01/2026";
        newItem.kategori = Number(newItem.usia) >= 60 ? "Lansia" : "Bukan Lansia";
      } else {
        if (!newItem.nama) newItem.nama = "Master Baru Tanpa Nama";
        if (entityType === "programs" && !newItem.kejuruan) newItem.kejuruan = "Agroindustri";
      }

      return newItem;
    });

    setParsedData(repaired);
    validateDataRows(repaired);
    showNotification("Perbaikan otomatis berhasil diselesaikan!");
  };

  const finalizeImport = () => {
    const finalSelection = parsedData.filter((_, idx) => selectedRows[idx]);
    if (finalSelection.length === 0) {
      showNotification("Silakan pilih minimal satu baris untuk diimport.");
      return;
    }

    const countWithErrors = finalSelection.filter((_, idx) => {
      const originalIdx = parsedData.indexOf(finalSelection[idx]);
      return validationErrors[originalIdx] && Object.keys(validationErrors[originalIdx]).length > 0;
    }).length;

    // Filter out rows with active validation errors from the final selection
    const cleanImports = finalSelection.filter((_, idx) => {
      const originalIdx = parsedData.indexOf(finalSelection[idx]);
      const hasError = validationErrors[originalIdx] && Object.keys(validationErrors[originalIdx]).length > 0;
      return !hasError;
    });

    if (cleanImports.length === 0) {
      showNotification("Tidak ada baris data valid untuk diimport. Harap perbaiki kolom yang bermasalah terlebih dahulu.");
      return;
    }

    if (countWithErrors > 0) {
      setPendingCleanImports(cleanImports);
      setShowConfirmIgnoreErrors(true);
      return;
    }

    onImport(cleanImports);
    setStep("success");
  };

  const executePendingImport = () => {
    onImport(pendingCleanImports);
    setStep("success");
    setShowConfirmIgnoreErrors(false);
  };

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-8 z-50 animate-fade-in p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden relative">
        
        {/* Toast Notifikasi */}
        {toast && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-bounce">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            {toast}
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-slate-800">
                Import CSV Cerdas &mdash; {
                  entityType === "participants" ? "Database Peserta" :
                  entityType === "trainingTypes" ? "Master Jenis Pelatihan" :
                  entityType === "kejuruanList" ? "Master Kejuruan" : "Master Program Pelatihan"
                }
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Algoritma auto-mapping, pembersihan tipe data dinamis, dan editor instan pra-import.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200/50 text-slate-400 hover:text-slate-700 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Wizard Steps Bar */}
        <div className="bg-slate-50 border-b border-slate-100 px-8 py-3 flex items-center justify-between text-xs font-bold text-slate-400">
          <div className="flex items-center gap-8">
            <span className={`flex items-center gap-1.5 ${step === "upload" ? "text-indigo-600" : "text-emerald-600"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === "upload" ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"}`}>1</span>
              Upload File / Paste CSV
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span className={`flex items-center gap-1.5 ${step === "mapping" ? "text-indigo-600" : step === "preview" || step === "success" ? "text-emerald-600" : "text-slate-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === "mapping" ? "bg-indigo-100 text-indigo-600" : step === "preview" || step === "success" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100"}`}>2</span>
              Auto-Mapping Kolom
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span className={`flex items-center gap-1.5 ${step === "preview" ? "text-indigo-600" : step === "success" ? "text-emerald-600" : "text-slate-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === "preview" ? "bg-indigo-100 text-indigo-600" : step === "success" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100"}`}>3</span>
              Live-Review & Perbaikan
            </span>
          </div>
          {fileName && (
            <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs font-mono max-w-[200px] truncate">
              {fileName}
            </span>
          )}
        </div>

        {/* Content Body Area */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* STEP 1: UPLOAD AREA */}
          {step === "upload" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
              
              {/* Left Drag & Drop Card */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-slate-50/30 rounded-3xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all shrink-0 select-none group"
              >
                <div className="w-16 h-16 bg-slate-50 group-hover:bg-indigo-50 border border-slate-100 group-hover:border-indigo-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm transition-all">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <h3 className="font-display font-bold text-slate-700 mb-1 text-sm">Upload File CSV Anda</h3>
                <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed mb-4">
                  Seret dan taruh file CSV atau Excel di sini, atau klik untuk memilih file di komputer Anda.
                </p>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg">PILIH FILE CSV</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".csv" 
                  className="hidden" 
                />
              </div>

              {/* Right Manual Text Paste Area */}
              <div className="flex flex-col border border-slate-200 rounded-3xl p-6 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-slate-700 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Salin & Tempel CSV (Copy-Paste Excel)
                  </h4>
                  <span className="text-[10px] font-medium text-slate-400 bg-white border border-slate-200/50 px-2 py-0.5 rounded">Semicolon / Comma</span>
                </div>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`nama;jenisPelatihan;programPelatihan;kejuruan;statusKelulusan;jenisKelamin;usia;alamat&#10;Agung;Pelatihan Vokasi;Barista;Pariwisata;Lulus;L;25;Jl. Raya Padalarang&#10;Siti;Blended Learning;Desain Grafis;Teknologi Informasi;Lulus;P;22;Jl. Raya Cisarua`}
                  className="flex-1 w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none leading-relaxed shadow-inner"
                />
                <button 
                  onClick={handlePasteSubmit}
                  disabled={!csvText.trim()}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Proses Data Tempel
                </button>
              </div>

            </div>
          )}

          {/* STEP 2: AUTO-MAPPING INTERACTIVE BOARD */}
          {step === "mapping" && (
            <div className="space-y-4">
              <div className="bg-[#FACC15]/10 border border-[#FACC15]/30 text-yellow-900 p-4 rounded-2xl shadow-2xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#FACC15] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-xs font-bold mb-0.5">Konfigurasi Penjajaran Kolom Database</strong>
                  <p className="text-[11px] font-medium opacity-90 leading-relaxed">
                    Sistem kami telah melakukan <strong>Auto-Mapping</strong> berbasis kecerdasan kata kunci (heuristic fuzzy). Mohon verifikasi apakah pasangan kolom kiri (Target Database) sudah dipasangkan dengan benar ke kolom kanan (Kolom Excel Anda). Sesuaikan secara manual jika diperlukan.
                  </p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm max-h-[45vh] overflow-y-auto divide-y divide-slate-100">
                <div className="grid grid-cols-2 bg-slate-50/80 p-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <div>Kolom Database Target (BPVP)</div>
                  <div>Kolom File CSV/Excel Anda</div>
                </div>

                {getTargetFields().map(field => {
                  const currentMapped = fieldMappings[field.key] || "";
                  const isAutoMatched = headers.includes(currentMapped);
                  
                  return (
                    <div key={field.key} className="grid grid-cols-2 items-center p-4 gap-6 hover:bg-slate-50/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{field.label}</span>
                          {field.required && (
                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 text-[8px] font-extrabold uppercase rounded border border-rose-100/50">Wajib</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-sm">{field.description}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={currentMapped}
                          onChange={(e) => setFieldMappings({ ...fieldMappings, [field.key]: e.target.value })}
                          className={`flex-1 p-2 bg-white border ${currentMapped ? "border-slate-200" : "border-slate-300"} rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer text-slate-700 shadow-2xs`}
                        >
                          <option value="">&mdash; Kosongkan / Lewati Kolom &mdash;</option>
                          {headers.map((h, hIdx) => (
                            <option key={`${h}-${hIdx}`} value={h}>{h}</option>
                          ))}
                        </select>
                        {currentMapped ? (
                          isAutoMatched ? (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold rounded-lg shrink-0">Auto-Match</span>
                          ) : (
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-bold rounded-lg shrink-0">Manual</span>
                          )
                        ) : (
                          field.required && (
                            <span className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-bold rounded-lg shrink-0 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Harus Diisi
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 sticky bottom-[-24px] bg-white z-10 w-[calc(100%+48px)] -ml-6 -mb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button 
                  onClick={() => setStep("upload")}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl"
                >
                  Kembali ke Upload
                </button>
                <button 
                  onClick={startMappingExecution}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Verifikasi & Pratinjau Data &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LIVE PREVIEW & REPAIR TABLE */}
          {step === "preview" && (
            <div className="space-y-4 flex flex-col h-full">
              
              {/* Summary Stats & Repair Action Block */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl shadow-3xs shrink-0">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Total Peserta Diproses</span>
                    <strong className="text-xl font-display text-slate-800">{parsedData.length} baris</strong>
                  </div>
                  <div className="h-8 w-px bg-slate-200"></div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Terpilih Import</span>
                    <strong className="text-xl font-display text-emerald-600">
                      {Object.values(selectedRows).filter(Boolean).length} baris
                    </strong>
                  </div>
                  <div className="h-8 w-px bg-slate-200"></div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Koreksi Diperlukan</span>
                    <strong className={`text-xl font-display ${Object.keys(validationErrors).length > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {Object.keys(validationErrors).length} Baris Bermasalah
                    </strong>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={repairDataAutomatically}
                    className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                    title="Isi data kosong dengan template standar, bersihkan format angka/nama secara otomatis."
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Perbaiki Otomatis
                  </button>
                </div>
              </div>

              {/* Infinite Horizontal & Vertical Preview Grid */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs max-h-[35vh] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-50 z-10">
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={Object.values(selectedRows).every(Boolean)}
                          onChange={(e) => {
                            const val = e.target.checked;
                            const next: Record<number, boolean> = {};
                            parsedData.forEach((_, i) => { next[i] = val; });
                            setSelectedRows(next);
                          }}
                          className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">Status</th>
                      {getTargetFields().map(f => (
                        <th key={f.key} className="p-3 whitespace-nowrap">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                    {parsedData.slice((previewPage - 1) * previewPageSize, previewPage * previewPageSize).map((row, idx) => {
                      const rowIndex = (previewPage - 1) * previewPageSize + idx;
                      const hasRowError = validationErrors[rowIndex] && Object.keys(validationErrors[rowIndex]).length > 0;
                      const isSelected = selectedRows[rowIndex];

                      return (
                        <tr 
                          key={row.id} 
                          className={`hover:bg-slate-50/50 transition-colors ${
                            hasRowError ? "bg-rose-50/10" : !isSelected ? "opacity-50" : ""
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={!!isSelected}
                              onChange={(e) => setSelectedRows({ ...selectedRows, [rowIndex]: e.target.checked })}
                              className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 whitespace-nowrap text-center">
                            {hasRowError ? (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-bold rounded-lg cursor-help"
                                title={Object.values(validationErrors[rowIndex]).join(", ")}
                              >
                                <AlertTriangle className="w-3 h-3 text-rose-500" /> Error
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold rounded-lg">
                                <CheckCircle className="w-3 h-3 text-emerald-500" /> Valid
                              </span>
                            )}
                          </td>

                          {getTargetFields().map(field => {
                            const cellValue = row[field.key];
                            const cellError = validationErrors[rowIndex]?.[field.key];

                            return (
                              <td 
                                key={field.key} 
                                className={`p-2 relative group min-w-[140px] max-w-[250px] truncate ${
                                  cellError ? "bg-rose-50/50 border border-rose-200/50" : ""
                                }`}
                              >
                                {field.key === "jenisKelamin" ? (
                                  <select
                                    value={cellValue || ""}
                                    onChange={(e) => handleCellEdit(rowIndex, field.key, e.target.value)}
                                    className="w-full bg-transparent outline-none focus:bg-slate-100 p-1 rounded font-semibold text-xs"
                                  >
                                    <option value="">&mdash;</option>
                                    <option value="L">L (Laki-laki)</option>
                                    <option value="P">P (Perempuan)</option>
                                  </select>
                                ) : (field.key === "penyandangDisabilitas" || field.key === "pernahBekerjaLuarNegeri" || field.key === "berminatBekerjaLuarNegeri") ? (
                                  <select
                                    value={cellValue || ""}
                                    onChange={(e) => handleCellEdit(rowIndex, field.key, e.target.value)}
                                    className="w-full bg-transparent outline-none focus:bg-slate-100 p-1 rounded font-semibold text-xs"
                                  >
                                    <option value="">&mdash;</option>
                                    <option value="Tidak">Tidak</option>
                                    <option value="Ya">Ya</option>
                                  </select>
                                ) : field.key === "statusKelulusan" ? (
                                  <select
                                    value={cellValue || ""}
                                    onChange={(e) => handleCellEdit(rowIndex, field.key, e.target.value)}
                                    className="w-full bg-transparent outline-none focus:bg-slate-100 p-1 rounded font-semibold text-xs"
                                  >
                                    <option value="">&mdash;</option>
                                    <option value="Lulus">Lulus</option>
                                    <option value="Tidak Lulus">Tidak Lulus</option>
                                    <option value="Dalam Proses">Dalam Proses</option>
                                  </select>
                                ) : field.key === "statusKebekerjaan" ? (
                                  <select
                                    value={cellValue || ""}
                                    onChange={(e) => handleCellEdit(rowIndex, field.key, e.target.value)}
                                    className="w-full bg-transparent outline-none focus:bg-slate-100 p-1 rounded font-semibold text-xs"
                                  >
                                    <option value="">&mdash;</option>
                                    <option value="Belum Bekerja">Belum Bekerja</option>
                                    <option value="Bekerja">Bekerja</option>
                                    <option value="Wirausaha">Wirausaha</option>
                                  </select>
                                ) : (
                                  <input
                                    type={field.key === "usia" ? "number" : "text"}
                                    value={cellValue !== undefined ? cellValue : ""}
                                    onChange={(e) => handleCellEdit(rowIndex, field.key, e.target.value)}
                                    className="w-full bg-transparent hover:bg-slate-100 focus:bg-white p-1 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-xs"
                                    placeholder={field.required ? "Wajib diisi..." : "Opsional..."}
                                  />
                                )}
                                
                                {cellError && (
                                  <span className="absolute bottom-[-16px] left-2 bg-slate-900 text-white text-[8px] font-semibold px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                    {cellError}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons for step 3 */}
              <div className="flex items-center justify-between p-4 border-t border-slate-100 sticky bottom-[-24px] bg-white z-10 w-[calc(100%+48px)] -ml-6 -mb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button 
                  onClick={() => setStep("mapping")}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl"
                >
                  Kembali ke Penjajaran Kolom
                </button>
                
                {/* Pagination Controls */}
                {parsedData.length > previewPageSize && (
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                      disabled={previewPage === 1}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded text-xs font-bold"
                    >
                      &larr; Prev
                    </button>
                    <span className="text-xs font-semibold text-slate-500">
                      Halaman {previewPage} / {Math.ceil(parsedData.length / previewPageSize)}
                    </span>
                    <button 
                      onClick={() => setPreviewPage(p => Math.min(Math.ceil(parsedData.length / previewPageSize), p + 1))}
                      disabled={previewPage === Math.ceil(parsedData.length / previewPageSize)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded text-xs font-bold"
                    >
                      Next &rarr;
                    </button>
                  </div>
                )}

                <button 
                  onClick={finalizeImport}
                  className="px-8 py-3 bg-[#A8E6CF] hover:bg-[#91c9b4] text-teal-950 font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" /> Import Sekarang
                </button>
              </div>

            </div>
          )}

          {/* STEP 4: SUCCESS CONGRATS PANEL */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center text-center py-12 h-full space-y-4">
              <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 shadow-sm animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="font-display font-bold text-xl text-slate-800">Proses Import Berhasil Selesai!</h3>
              <p className="text-xs font-semibold text-slate-500 max-w-md leading-relaxed">
                Data CSV cerdas berhasil divalidasi, disanitasi secara otomatis, dan disinkronisasikan ke database cloud Firestore secara real-time.
              </p>
              <button 
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Tutup Jendela Import
              </button>
            </div>
          )}

        </div>

      </div>

      {showConfirmIgnoreErrors && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-8 z-[2000] animate-fade-in px-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full border border-slate-100 shadow-2xl animate-scale-up">
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-display font-bold text-slate-800">Abaikan Baris Bermasalah?</h4>
                <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-semibold">
                  Terdapat baris data pilihan yang masih memiliki error/tidak valid. Apakah Anda yakin ingin mengabaikan baris yang bermasalah tersebut dan tetap mengimport baris valid lainnya?
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8 border-t border-slate-100 pt-5">
              <button
                onClick={() => setShowConfirmIgnoreErrors(false)}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={executePendingImport}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all active:scale-95 cursor-pointer focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
              >
                Ya, Abaikan & Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
