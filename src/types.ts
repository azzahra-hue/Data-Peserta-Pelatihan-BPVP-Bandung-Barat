export interface Participant {
  id: string;
  kodeTransaksi?: string;
  nama: string;
  nik?: string;
  noHp?: string;
  email?: string;
  jenisKelamin: 'L' | 'P' | string;
  alamat: string;
  tempatLahir?: string;
  tanggalLahir: string;
  usia: number;
  pendidikanTerakhir?: string;
  disabilitasTipe?: string;
  penyandangDisabilitas: 'Ya' | 'Tidak' | string;
  pernahBekerjaLuarNegeri?: 'Ya' | 'Tidak' | string;
  berminatBekerjaLuarNegeri?: 'Ya' | 'Tidak' | string;
  programPelatihan: string;
  kejuruan: string;
  metodePelatihan?: string;
  jenisPelatihan: string;
  angkatan?: string;
  durasi?: number | string;
  biayaPelatihan?: number | string;
  tanggalMulaiPelatihan?: string;
  tanggalSelesaiPelatihan?: string;
  absensi?: string;
  statusSelesaiPelatihan?: string;
  statusKelulusan: 'Lulus' | 'Tidak Lulus' | 'Dalam Proses' | string;
  sumberAnggaran?: string;
  statusKebekerjaan: 'Bekerja' | 'Belum Bekerja' | 'Wirausaha' | string;
  tempatBekerja?: string;
  status?: string;
  jabatan?: string;
  tanggalPenempatan?: string;

  // Derived or compatibility fields for existing layout
  kategori: string;
  tanggalPelatihan: string;
  lokasi?: string;
}

export type UserRole = 'Kepala Unit Kerja' | 'Sekretaris' | 'Sub Koordinator' | 'Pengantar Kerja';

export interface User {
  id: string;
  role: UserRole;
  nama: string;
  avatar: string;
}

export interface TrainingType {
  id: string;
  nama: string;
  deskripsi?: string;
}

export interface Kejuruan {
  id: string;
  nama: string;
}

export interface ProgramPelatihan {
  id: string;
  nama: string;
  kejuruan: string;
}

export interface AppSettings {
  target2025: number;
  target2026: number;
}

export interface DatabaseState {
  participants: Participant[];
  trainingTypes: TrainingType[];
  kejuruanList: Kejuruan[];
  programs: ProgramPelatihan[];
  settings?: AppSettings;
}
