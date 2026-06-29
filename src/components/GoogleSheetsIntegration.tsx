import React, { useState, useRef } from "react";
import { Participant } from "../types";
import { FileSpreadsheet, Upload, Download, Copy, RefreshCw, CheckCircle, HelpCircle } from "lucide-react";

interface GoogleSheetsIntegrationProps {
  participants: Participant[];
  onImportData: (newParticipants: Participant[], mode: "append" | "overwrite") => void;
}

export default function GoogleSheetsIntegration({ participants, onImportData }: GoogleSheetsIntegrationProps) {
  const [pastedText, setPastedText] = useState("");
  const [importMode, setImportMode] = useState<"append" | "overwrite">("append");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV / TSV helper
  const parsePastedData = (text: string): Participant[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length === 0) throw new Error("Teks kosong atau format tidak sesuai.");

    // Detect separator (Tab if pasted from Sheets/Excel, Comma or Semicolon if CSV)
    const firstLine = lines[0];
    let separator = ",";
    if (firstLine.includes("\t")) {
      separator = "\t";
    } else if (firstLine.includes(";")) {
      separator = ";";
    }

    // Parse header & lines
    const parsedRows = lines.map(line => {
      // Handle quoted values
      let values: string[] = [];
      if (separator === ",") {
        // Regex to handle CSV with quotes
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (matches) {
          values = matches.map(val => val.replace(/^"|"$/g, "").trim());
        } else {
          values = line.split(separator).map(val => val.trim());
        }
      } else {
        values = line.split(separator).map(val => val.trim());
      }
      return values;
    });

    if (parsedRows.length === 0) throw new Error("Tidak ada baris yang bisa dibaca.");

    // Check if first line is header. We look for keywords: "jenis", "nama", "status", "alamat" etc.
    const firstRowStr = parsedRows[0].join(" ").toLowerCase();
    const hasHeader = firstRowStr.includes("jenis") || firstRowStr.includes("nama") || firstRowStr.includes("kelulusan") || firstRowStr.includes("gender");
    
    const startIndex = hasHeader ? 1 : 0;
    const items: Participant[] = [];

    for (let i = startIndex; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      // Skip empty or blank lines
      if (row.length < 2) continue;

      // Map values into Participant fields
      // Schema: Jenis Pelatihan | Nama | Status Kelulusan | Alamat | Jenis Kelamin | Tanggal Lahir | Usia | Kategori | Penyandang Disabilitas | Program Pelatihan | Kejuruan | Tanggal Pelatihan | Status Kebekerjaan | Tempat Bekerja | Lokasi
      const jenisPelatihan = row[0] || "Pelatihan Vokasi";
      const nama = row[1] || `Peserta Baru ${i}`;
      const statusKelulusanRaw = row[2] || "Lulus";
      const statusKelulusan = (statusKelulusanRaw.toLowerCase().includes("tidak") ? "Tidak Lulus" : 
                               statusKelulusanRaw.toLowerCase().includes("proses") || statusKelulusanRaw.toLowerCase().includes("jalan") ? "Dalam Proses" : "Lulus") as Participant["statusKelulusan"];
      const alamat = row[3] || "Jl. Raya Tangkuban Perahu KM 04, Lembang";
      const jenisKelaminRaw = row[4] || "L";
      const jenisKelamin = (jenisKelaminRaw.toUpperCase().startsWith("P") || jenisKelaminRaw.toLowerCase().includes("perempuan") ? "P" : "L") as Participant["jenisKelamin"];
      const tanggalLahir = row[5] || "01/01/2000";
      const usia = parseInt(row[6]) || 25;
      const kategori = row[7] || "Bukan Lansia";
      const penyandangDisabilitasRaw = row[8] || "Tidak";
      const penyandangDisabilitas = (penyandangDisabilitasRaw.toLowerCase().includes("ya") || penyandangDisabilitasRaw.toLowerCase().includes("yes") ? "Ya" : "Tidak") as Participant["penyandangDisabilitas"];
      const programPelatihan = row[9] || "Barista";
      const kejuruan = row[10] || "Pariwisata";
      const tanggalPelatihan = row[11] || "23-Jan-24";
      const statusKebekerjaanRaw = row[12] || "Belum Bekerja";
      const statusKebekerjaan = (statusKebekerjaanRaw.toLowerCase().includes("belum") ? "Belum Bekerja" : 
                                 statusKebekerjaanRaw.toLowerCase().includes("wira") ? "Wirausaha" : "Bekerja") as Participant["statusKebekerjaan"];
      const tempatBekerja = row[13] || "";
      const lokasi = row[14] || "";

      items.push({
        id: `imported-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        jenisPelatihan,
        nama,
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
    }

    if (items.length === 0) {
      throw new Error("Gagal mengurai baris data. Periksa struktur atau pemisah kolom Anda.");
    }

    return items;
  };

  // Handle Text Paste Submission
  const handlePasteImport = () => {
    try {
      setErrorMessage("");
      setSuccessMessage("");
      if (!pastedText.trim()) {
        setErrorMessage("Silakan paste teks data dari Google Sheets terlebih dahulu.");
        return;
      }

      const imported = parsePastedData(pastedText);
      onImportData(imported, importMode);
      setSuccessMessage(`Berhasil mengimpor ${imported.length} data peserta dari Google Sheets!`);
      setPastedText("");
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal mengimpor data. Pastikan format kolom sesuai.");
    }
  };

  // Handle file select/drop
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setErrorMessage("");
        setSuccessMessage("");
        const text = e.target?.result as string;
        if (!text) throw new Error("File kosong.");
        
        const imported = parsePastedData(text);
        onImportData(imported, importMode);
        setSuccessMessage(`Berhasil mengimpor ${imported.length} data peserta dari file CSV Google Sheets!`);
      } catch (err: any) {
        setErrorMessage(err.message || "Gagal mengimpor file CSV.");
      }
    };
    reader.onerror = () => setErrorMessage("Gagal membaca file.");
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Export to Google Sheets compatible CSV
  const handleExportCSV = () => {
    // Generate headers
    const headers = [
      "Jenis Pelatihan",
      "Nama",
      "Status Kelulusan",
      "Alamat",
      "Jenis kelamin",
      "Tanggal Lahir",
      "usia",
      "kategori",
      "Penyandang Disabilitas",
      "program pelatihan",
      "kejuruan",
      "Tanggal pelatihan",
      "status kebekerjaan",
      "tempat bekerja",
      "Lokasi"
    ];

    // Map rows
    const rows = participants.map(p => [
      `"${p.jenisPelatihan.replace(/"/g, '""')}"`,
      `"${p.nama.replace(/"/g, '""')}"`,
      `"${p.statusKelulusan.replace(/"/g, '""')}"`,
      `"${p.alamat.replace(/"/g, '""')}"`,
      `"${p.jenisKelamin}"`,
      `"${p.tanggalLahir}"`,
      p.usia,
      `"${p.kategori}"`,
      `"${p.penyandangDisabilitas}"`,
      `"${p.programPelatihan.replace(/"/g, '""')}"`,
      `"${p.kejuruan.replace(/"/g, '""')}"`,
      `"${p.tanggalPelatihan}"`,
      `"${p.statusKebekerjaan.replace(/"/g, '""')}"`,
      `"${(p.tempatBekerja || "").replace(/"/g, '""')}"`,
      `"${(p.lokasi || "").replace(/"/g, '""')}"`
    ]);

    // Combine
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Alumni_BPVP_BandungBarat_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="google-sheets-integration-root">
      
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-display font-semibold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Integrasi & Sinkronisasi Google Sheets
          </h2>
          <p className="text-sm text-slate-500">Impor data mentah alumni dari Google Sheets atau ekspor database terstruktur kembali dalam format CSV.</p>
        </div>
        
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow active:scale-95"
          id="btn-export-csv"
        >
          <Download className="w-4 h-4" /> Ekspor ke Google Sheets (.CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Option A: Pasting Columns */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-800 text-xs font-bold">1</span>
            <h3 className="font-semibold text-sm text-slate-800">Cara Tercepat: Copy & Paste Baris</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Buka file Google Sheets Anda, pilih/blok baris-baris data alumni Anda, tekan <kbd className="bg-slate-100 px-1 rounded font-mono font-bold text-slate-700">Ctrl+C</kbd> (Copy), lalu paste langsung di kotak di bawah ini:
          </p>

          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Pilah kolom dari Google Sheets lalu paste di sini...&#10;Contoh format:&#10;Pelatihan Vokasi	Akbar Setiawan	Lulus	Jl. Hegarmanah	L	14/01/2000	26	Bukan Lansia	Tidak	Penyangraian Biji Kopi	Teknologi Pengolahan Agroindustri	23-Jan-24	Belum Bekerja"
            className="w-full h-44 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
            id="pasted-sheets-textarea"
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-500">Metode Sinkronisasi:</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === "append"}
                  onChange={() => setImportMode("append")}
                  className="accent-emerald-600"
                />
                Tambahkan data (Append)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === "overwrite"}
                  onChange={() => setImportMode("overwrite")}
                  className="accent-emerald-600"
                />
                Ganti semua data (Overwrite)
              </label>
            </div>

            <button
              onClick={handlePasteImport}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              id="btn-process-paste"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Proses Impor Teks
            </button>
          </div>
        </div>

        {/* Option B: File Uploading & Drag/Drop */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-800 text-xs font-bold">2</span>
            <h3 className="font-semibold text-sm text-slate-800">Atau Unggah File Ekspor Google Sheets</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Unduh file Google Sheets Anda sebagai format <strong className="text-slate-800">Comma-separated values (.csv)</strong> dari Google Sheets (File &gt; Download &gt; .csv), lalu drag atau pilih filenya di bawah ini:
          </p>

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`h-44 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all p-4 text-center ${
              dragActive
                ? "border-emerald-500 bg-emerald-50/20"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
            id="drag-drop-zone"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.txt"
              className="hidden"
            />
            <div className="p-3 bg-slate-100 rounded-full text-slate-600">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Klik untuk browse atau seret file CSV di sini</p>
              <p className="text-[10px] text-slate-400 mt-1">Mendukung file .csv hasil download dari Google Sheets</p>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-start gap-2.5 text-xs text-amber-800 leading-relaxed">
            <HelpCircle className="w-4.5 h-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block">Skema Header Google Sheets:</strong>
              Kolom wajib mencakup: <span className="font-mono text-[10px] bg-amber-100/60 px-1 rounded text-amber-900">Jenis Pelatihan, Nama, Status Kelulusan, Alamat, Jenis kelamin, Tanggal Lahir, usia, kategori, Penyandang Disabilitas, program pelatihan, kejuruan, Tanggal pelatihan, status kebekerjaan, tempat bekerja, Lokasi</span>. Urutan kolom dapat dicocokkan otomatis.
            </div>
          </div>
        </div>

      </div>

      {/* Alert Banners */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-xs font-medium animate-fade-in" id="success-alert">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl flex items-center gap-3 text-xs font-medium animate-fade-in" id="error-alert">
          <span className="w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">!</span>
          <span>{errorMessage}</span>
        </div>
      )}

    </div>
  );
}
