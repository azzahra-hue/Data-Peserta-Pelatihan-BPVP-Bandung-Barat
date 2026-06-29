import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { DatabaseState, Participant, TrainingType, Kejuruan, ProgramPelatihan } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const DB_FILE = path.join(process.cwd(), "database.json");

// Define initial seed data
const initialTrainingTypes: TrainingType[] = [
  { id: "vokasi", nama: "Pelatihan Vokasi", deskripsi: "Pelatihan peningkatan kompetensi kerja kerja sama industri" },
  { id: "tmt", nama: "TMT (Tugas Mandiri Terstruktur)", deskripsi: "Pelatihan terstruktur bagi instruktur atau tenaga latih" },
  { id: "eclass", nama: "e-Class", deskripsi: "Pelatihan online mandiri menggunakan platform digital" },
  { id: "uptd", nama: "UPTD", deskripsi: "Pelatihan binaan Unit Pelaksana Teknis Daerah" },
  { id: "pbl", nama: "Project Based Learning", deskripsi: "Pelatihan berbasis proyek riil dengan mitra industri" }
];

const initialKejuruan: Kejuruan[] = [
  { id: "agroindustri", nama: "Teknologi Pengolahan Agroindustri" },
  { id: "pertanian", nama: "Pertanian" },
  { id: "mekanisasi", nama: "Mekanisasi Pertanian" },
  { id: "creative", nama: "Smart Creative Skill" },
  { id: "fashion", nama: "Fashion Technology" },
  { id: "peternakan", nama: "Peternakan" },
  { id: "perikanan", nama: "Perikanan" },
  { id: "bisnis", nama: "Bisnis Manajemen" },
  { id: "pariwisata", nama: "Pariwisata" },
  { id: "kecantikan", nama: "Tata Kecantikan" },
  { id: "produktivitas", nama: "Produktivitas" },
  { id: "industri_kreatif", nama: "Industri Kreatif" },
  { id: "manufaktur", nama: "Manufaktur" },
  { id: "garmen", nama: "Garmen Apparel" }
];

const initialPrograms: ProgramPelatihan[] = [
  { id: "prog1", nama: "Penyangraian Biji Kopi", kejuruan: "Teknologi Pengolahan Agroindustri" },
  { id: "prog2", nama: "Pembuatan Roti dan Kue", kejuruan: "Teknologi Pengolahan Agroindustri" },
  { id: "prog3", nama: "Barista", kejuruan: "Pariwisata" },
  { id: "prog4", nama: "Pembudidayaan Domba", kejuruan: "Peternakan" },
  { id: "prog5", nama: "Hydroponic Automation System", kejuruan: "Pertanian" },
  { id: "prog6", nama: "Optimalisasi Pemasaran Melalui Media Sosial", kejuruan: "Bisnis Manajemen" },
  { id: "prog7", nama: "English For Frontliner", kejuruan: "Pariwisata" },
  { id: "prog8", nama: "Menjahit Komponen Pakaian Jadi", kejuruan: "Garmen Apparel" },
  { id: "prog9", nama: "Pembesaran Ikan Lele", kejuruan: "Perikanan" },
  { id: "prog10", nama: "Make-up", kejuruan: "Tata Kecantikan" }
];

const initialParticipants: Participant[] = [
  {
    id: "part1",
    jenisPelatihan: "Pelatihan Vokasi",
    nama: "Akbar Setiawan",
    statusKelulusan: "Lulus",
    alamat: "Jl.Hegarmanah Gg. Cikendi RT 05 RW 03, Cidadap, Kota Bandung, Jawa Barat",
    jenisKelamin: "L",
    tanggalLahir: "14/01/2000",
    usia: 26,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Penyangraian Biji Kopi",
    kejuruan: "Teknologi Pengolahan Agroindustri",
    tanggalPelatihan: "23-Jan-24",
    statusKebekerjaan: "Belum Bekerja",
    tempatBekerja: "",
    lokasi: ""
  },
  {
    id: "part2",
    jenisPelatihan: "Pelatihan Vokasi",
    nama: "M. Riezzal Ramdhani",
    statusKelulusan: "Lulus",
    alamat: "Kp.Pasir Malaka RT 001 RW 002 Desa Kertasari Kec. Haurwangi,Kab.Cianjur, Jawa Barat",
    jenisKelamin: "L",
    tanggalLahir: "13/11/2002",
    usia: 23,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Penyangraian Biji Kopi",
    kejuruan: "Teknologi Pengolahan Agroindustri",
    tanggalPelatihan: "23-Jan-24",
    statusKebekerjaan: "Bekerja",
    tempatBekerja: "The ranch ciater",
    lokasi: "Subang"
  },
  {
    id: "part3",
    jenisPelatihan: "Pelatihan Vokasi",
    nama: "Ricky Rifaldo",
    statusKelulusan: "Lulus",
    alamat: "Blok Kliwon RT 04 RW 05 Desa Randobawa Ilir, Kecamatan Mandirancan, Kabupaten Kuningan, Jawa Barat",
    jenisKelamin: "L",
    tanggalLahir: "19/11/1999",
    usia: 26,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Penyangraian Biji Kopi",
    kejuruan: "Teknologi Pengolahan Agroindustri",
    tanggalPelatihan: "23-Jan-24",
    statusKebekerjaan: "Bekerja",
    tempatBekerja: "Toko Kopi Lancar Jaya Abadi",
    lokasi: "bandung"
  },
  {
    id: "part4",
    jenisPelatihan: "Pelatihan Vokasi",
    nama: "Whisnu Hasta Prayogi",
    statusKelulusan: "Lulus",
    alamat: "Jl.Jend. H Amir Mahmud RT 003 RW 001, Kel.Padasuka, Kec.Cimahi Tengah, Kota Cimahi. Jawa Barat",
    jenisKelamin: "L",
    tanggalLahir: "28/03/1986",
    usia: 40,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Penyangraian Biji Kopi",
    kejuruan: "Teknologi Pengolahan Agroindustri",
    tanggalPelatihan: "23-Jan-24",
    statusKebekerjaan: "Bekerja",
    tempatBekerja: "SERIBU KOPI ROASTERY",
    lokasi: "cimahi"
  },
  {
    id: "part5",
    jenisPelatihan: "Pelatihan Vokasi",
    nama: "Yon Aidil Indra",
    statusKelulusan: "Lulus",
    alamat: "Jl Cisitu Lama RT04 RW10, Kelurahan Dago, Kecamatan Coblong, Kota Bandung, Jawa Barat",
    jenisKelamin: "L",
    tanggalLahir: "1/1/1968",
    usia: 58,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Penyangraian Biji Kopi",
    kejuruan: "Teknologi Pengolahan Agroindustri",
    tanggalPelatihan: "23-Jan-24",
    statusKebekerjaan: "Bekerja",
    tempatBekerja: "LPK Radiance",
    lokasi: "bandung"
  },
  {
    id: "part6",
    jenisPelatihan: "Pelatihan Vokasi",
    nama: "Putri Aulia Fitrah Robbani",
    statusKelulusan: "Lulus",
    alamat: "Komplek Griya Bandung Indah Blok J1-10, RT02 RW10, Kel. Buah Batu, Kec.Bojongsoang, Kab. Bandung, Jawa Barat",
    jenisKelamin: "P",
    tanggalLahir: "20/02/2001",
    usia: 25,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Pembuatan Roti dan Kue",
    kejuruan: "Teknologi Pengolahan Agroindustri",
    tanggalPelatihan: "23-Jan-24",
    statusKebekerjaan: "Bekerja",
    tempatBekerja: "PT.Kaldu Sari Nabati Indonesia",
    lokasi: "majalengka"
  },
  {
    id: "part7",
    jenisPelatihan: "Pelatihan Vokasi",
    nama: "Meliza Apriyanti",
    statusKelulusan: "Lulus",
    alamat: "Komp Griya Alam Blok E1 RT 005 RW 001, Kel. Cibeber, Kec.Cimahi Selatan, Kota Cimahi, Jawa Barat",
    jenisKelamin: "P",
    tanggalLahir: "12/4/1998",
    usia: 28,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Pembuatan Roti dan Kue",
    kejuruan: "Teknologi Pengolahan Agroindustri",
    tanggalPelatihan: "23-Jan-24",
    statusKebekerjaan: "Bekerja",
    tempatBekerja: "PT. GERLINK UTAMA MANDIRI",
    lokasi: "bandung"
  },
  {
    id: "part8",
    jenisPelatihan: "Pelatihan Vokasi",
    nama: "Febi Nurhanifah",
    statusKelulusan: "Lulus",
    alamat: "Dusun Warung Asem, RT 023 RW 005, Desa Purwadadi, Kecamatan Purwadadi, Kabupaten Subang Jawa Barat",
    jenisKelamin: "P",
    tanggalLahir: "15/02/2001",
    usia: 25,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Pembuatan Roti dan Kue",
    kejuruan: "Teknologi Pengolahan Agroindustri",
    tanggalPelatihan: "23-Jan-24",
    statusKebekerjaan: "Bekerja",
    tempatBekerja: "SDIT Cahaya Ilmu",
    lokasi: "bandung"
  },
  {
    id: "part9",
    jenisPelatihan: "Pelatihan Vokasi",
    nama: "Naufal Fauzan Izzatur Rahman",
    statusKelulusan: "Lulus",
    alamat: "Jl. Sompi No. 3 Blok Kertajaya RT 039 RW 010, Kel.Cigadung, Kec. Subang, Kab.Subang Jawa Barat",
    jenisKelamin: "L",
    tanggalLahir: "16/09/2004",
    usia: 21,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Barista",
    kejuruan: "Pariwisata",
    tanggalPelatihan: "23-Jan-24",
    statusKebekerjaan: "Bekerja",
    tempatBekerja: "Perum Bulog",
    lokasi: "jakarta"
  },
  {
    id: "part10",
    jenisPelatihan: "Pelatihan Vokasi",
    nama: "Refian Ghiffari Alfatih",
    statusKelulusan: "Lulus",
    alamat: "Bumi Panyileukan O.1 No.17 RT 03 RW 09 Cipadung Kidul , Kota Bandung, Jawa Barat",
    jenisKelamin: "L",
    tanggalLahir: "24/05/1996",
    usia: 30,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Barista",
    kejuruan: "Pariwisata",
    tanggalPelatihan: "23-Jan-24",
    statusKebekerjaan: "Bekerja",
    tempatBekerja: "Sekretariat daerah kabupaten pesisir barat provinsi lampung",
    lokasi: "lampung"
  },
  {
    id: "part11",
    jenisPelatihan: "Pelatihan Vokasi",
    nama: "Rey Noval Mochammad Chacha",
    statusKelulusan: "Lulus",
    alamat: "Kp Sukanagara No.164 RT 02 RW 04 Desa Pagerwangi Kec Lembang Kab Bandung Barat, Jawa Barat",
    jenisKelamin: "L",
    tanggalLahir: "16/09/2003",
    usia: 22,
    kategori: "Bukan Lansia",
    penyandangDisabilitas: "Tidak",
    programPelatihan: "Barista",
    kejuruan: "Pariwisata",
    tanggalPelatihan: "23-Jan-24",
    statusKebekerjaan: "Bekerja",
    tempatBekerja: "Culture Vienna, D Winkel Koffie",
    lokasi: "bandung"
  }
];

// Read from JSON file database
function readDatabase(): DatabaseState {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const data: DatabaseState = {
        participants: initialParticipants,
        trainingTypes: initialTrainingTypes,
        kejuruanList: initialKejuruan,
        programs: initialPrograms
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
      return data;
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading database file, returning default initial state", err);
    return {
      participants: initialParticipants,
      trainingTypes: initialTrainingTypes,
      kejuruanList: initialKejuruan,
      programs: initialPrograms
    };
  }
}

// Write to JSON file database
function writeDatabase(data: DatabaseState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file", err);
  }
}

// API Routes

// Get complete database
app.get("/api/data", (req, res) => {
  const db = readDatabase();
  res.json(db);
});

// Update database content (full state rewrite or edit)
app.post("/api/data", (req, res) => {
  try {
    const { participants, trainingTypes, kejuruanList, programs } = req.body;
    const db = readDatabase();

    if (participants) db.participants = participants;
    if (trainingTypes) db.trainingTypes = trainingTypes;
    if (kejuruanList) db.kejuruanList = kejuruanList;
    if (programs) db.programs = programs;

    writeDatabase(db);
    res.json({ success: true, message: "Database updated successfully", db });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset database to initial seeds
app.post("/api/reset", (req, res) => {
  try {
    const defaultDb: DatabaseState = {
      participants: initialParticipants,
      trainingTypes: initialTrainingTypes,
      kejuruanList: initialKejuruan,
      programs: initialPrograms
    };
    writeDatabase(defaultDb);
    res.json({ success: true, message: "Database reset to seed data successful", db: defaultDb });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Decision-Making Advisor endpoint using Gemini API
app.post("/api/ai/recommend", async (req, res) => {
  try {
    const { role, activeFilters } = req.body;
    const db = readDatabase();

    // Prepare a concise summary of current statistics for Gemini
    const totalParticipants = db.participants.length;
    const lulus = db.participants.filter(p => p.statusKelulusan === "Lulus").length;
    const bekerja = db.participants.filter(p => p.statusKebekerjaan === "Bekerja" || p.statusKebekerjaan === "Wirausaha").length;
    const rateKelulusan = totalParticipants > 0 ? Math.round((lulus / totalParticipants) * 100) : 0;
    const rateKebekerjaan = lulus > 0 ? Math.round((bekerja / lulus) * 100) : 0;

    // Kejuruan distribution
    const kejuruanStats: Record<string, number> = {};
    const kejuruanBekerja: Record<string, number> = {};
    db.participants.forEach(p => {
      kejuruanStats[p.kejuruan] = (kejuruanStats[p.kejuruan] || 0) + 1;
      if (p.statusKebekerjaan === "Bekerja" || p.statusKebekerjaan === "Wirausaha") {
        kejuruanBekerja[p.kejuruan] = (kejuruanBekerja[p.kejuruan] || 0) + 1;
      }
    });

    const popularKejuruanText = Object.entries(kejuruanStats)
      .map(([k, count]) => `- ${k}: ${count} peserta (Kebekerjaan: ${kejuruanBekerja[k] || 0} orang)`)
      .join("\n");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        recommendation: `**[Saran Strategis AI]**\n\nKunci API Gemini tidak terkonfigurasi. Hubungi administrator untuk mengonfigurasi \`GEMINI_API_KEY\` di menu Secrets.\n\n**Statistik Instan Saat Ini:**\n- Total Alumni: ${totalParticipants} orang\n- Angka Kelulusan: ${rateKelulusan}%\n- Angka Penyerapan Kerja: ${rateKebekerjaan}%\n\n*Silakan konfigurasikan Kunci API untuk mendapatkan rekomendasi kurikulum dan keputusan strategis lengkap dari AI berbasis ranah Pengelolaan & Evaluasi AECT.*`
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    const systemPrompt = `Anda adalah Asisten Keputusan Strategis AI khusus untuk Balai Pelatihan Vokasi dan Produktivitas (BPVP) Bandung Barat Kementerian Ketenagakerjaan RI. 
Tugas Anda adalah memberikan rekomendasi strategis, analisis data kurikulum, evaluasi program pelatihan, dan penyelarasan link and match dunia kerja.
Sesuaikan gaya analisis Anda sesuai peran pengguna saat ini:

1. **Kepala Unit Kerja**: Fokus pada arah kebijakan, evaluasi makro berbasis ranah Management AECT, pencapaian target strategis nasional, serta program link & match industri masa depan.
2. **Sekretaris**: Fokus pada pengelolaan operasional sumber daya, pelaporan administratif, efisiensi anggaran, dan ketersediaan data akurat.
3. **Sub Koordinator**: Fokus pada pengembangan kurikulum taktis, tren program yang diminati, pemantauan kelulusan peserta, serta kesiapan sarana pelatihan.
4. **Pengantar Kerja**: Fokus pada pelacakan alumni (tracer study), tingkat keterserapan kerja, rekomendasi kemitraan industri spesifik di wilayah Subang, Bandung, Cimahi, dan sekitarnya, serta bimbingan kerja alumni.

Berikan jawaban dalam Bahasa Indonesia yang formal, profesional, taktis, berstruktur rapi dengan markdown (tanpa tebak-tebakan teknis atau data palsu), dan langsung memberikan solusi yang bisa dieksekusi berdasarkan statistik yang dikirimkan.`;

    const userPrompt = `Halo AI, saya saat ini masuk sebagai peran: **${role}**.
Berikut adalah statistik terkini dari database Sistem Informasi Pelatihan BPVP Bandung Barat:
- Total peserta tercatat: ${totalParticipants} orang
- Jumlah lulusan: ${lulus} orang
- Angka Kelulusan: ${rateKelulusan}%
- Alumni yang bekerja/berwirausaha: ${bekerja} orang
- Tingkat penyerapan kerja alumni (Tracer Study): ${rateKebekerjaan}%

**Distribusi Kejuruan & Keterapan Kerja:**
${popularKejuruanText || "- Belum ada data peserta pelatihan yang tercatat."}

Berdasarkan ranah Pengelolaan (Management) dan Evaluasi (Evaluation) Teknologi Pendidikan (AECT):
1. Berikan analisis kritis singkat mengenai angka kelulusan dan penyerapan kerja di BPVP Bandung Barat saat ini.
2. Apa rekomendasi kurikulum, pengadaan pelatihan berikutnya, atau kemitraan industri yang tepat untuk membantu tugas saya sebagai **${role}**?
3. Buat strategi peningkatan penyerapan kerja yang praktis dan terukur.`;

    const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let responseText = "";
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      let attempts = 2;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          console.log(`Calling Gemini API using model ${modelName} (Attempt ${attempt}/${attempts})...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7
            }
          });
          
          if (response && response.text) {
            responseText = response.text;
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Attempt ${attempt} with model ${modelName} failed. Error: ${err.message || err}`);
          if (attempt < attempts || modelName !== modelsToTry[modelsToTry.length - 1]) {
            // Wait 1.5s before retrying or switching models
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
      }
      if (responseText) {
        break;
      }
    }

    if (responseText) {
      res.json({ recommendation: responseText });
    } else {
      throw lastError || new Error("All model fallback attempts failed.");
    }
  } catch (err: any) {
    console.error("Gemini AI integration error:", err);
    res.json({
      recommendation: `**[Saran Strategis AI]**\n\nGagal terhubung ke modul Kecerdasan Buatan (Gemini AI). Detail error: ${err.message || "Unknown error"}. Namun, manajemen BPVP Bandung Barat direkomendasikan untuk memprioritaskan program dengan serapan kerja tinggi seperti *Penyangraian Biji Kopi* dan *Barista* yang relevan dengan sektor pariwisata Lembang.`
    });
  }
});

// Automatically lookup company locations using Gemini
app.post("/api/ai/lookup-locations", async (req, res) => {
  try {
    const { companies } = req.body;
    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return res.json({ locations: {} });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Graceful fallback to default local cities if API key is not configured
      const fallbackMap: Record<string, string> = {};
      companies.forEach(company => {
        const cleanName = company.toLowerCase();
        if (cleanName.includes("ciater") || cleanName.includes("subang")) {
          fallbackMap[company] = "Subang";
        } else if (cleanName.includes("nabati") || cleanName.includes("majalengka")) {
          fallbackMap[company] = "Majalengka";
        } else if (cleanName.includes("cimahi")) {
          fallbackMap[company] = "Cimahi";
        } else if (cleanName.includes("jakarta") || cleanName.includes("bulog")) {
          fallbackMap[company] = "Jakarta";
        } else if (cleanName.includes("ranch")) {
          fallbackMap[company] = "Subang";
        } else if (cleanName.includes("lancar jaya")) {
          fallbackMap[company] = "Bandung";
        } else if (cleanName.includes("seribu kopi")) {
          fallbackMap[company] = "Cimahi";
        } else if (cleanName.includes("radiance")) {
          fallbackMap[company] = "Bandung";
        } else if (cleanName.includes("gerlink")) {
          fallbackMap[company] = "Bandung";
        } else if (cleanName.includes("pesisir barat") || cleanName.includes("lampung")) {
          fallbackMap[company] = "Lampung";
        } else if (cleanName.includes("vienna") || cleanName.includes("winkel")) {
          fallbackMap[company] = "Bandung";
        } else {
          fallbackMap[company] = "Bandung Barat"; // default local region
        }
      });
      return res.json({ locations: fallbackMap });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    const systemPrompt = `You are an AI Location Finder for companies in Indonesia. 
Given a list of company, institution, or school names, determine their primary city, district, or regency in Indonesia (preferring Bandung Barat, Bandung, Cimahi, Subang, West Java cities, or Jakarta if appropriate).
For each company in the list, return ONLY a clean city/district name (e.g. "Bandung Barat", "Bandung", "Cimahi", "Subang", "Jakarta", "Majalengka", "Cianjur", "Purwakarta", etc.). Do not include full street addresses, just the city/regency name.
If a company name is very generic, local, or unclear, infer a likely West Java city/district based on local context.
You MUST respond with a JSON object where the keys are the EXACT company names from the input and the values are their corresponding city/district names.`;

    const userPrompt = `List of company names to lookup:
${JSON.stringify(companies, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    if (response && response.text) {
      const parsed = JSON.parse(response.text.trim());
      return res.json({ locations: parsed });
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (err: any) {
    console.error("Error looking up company locations:", err);
    // Graceful fallback
    const fallbackMap: Record<string, string> = {};
    req.body.companies?.forEach((company: string) => {
      fallbackMap[company] = "Bandung Barat";
    });
    res.json({ locations: fallbackMap });
  }
});

// Vite middleware and fallback setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
