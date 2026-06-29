import React, { useState } from "react";
import { Building2, AlertCircle, Info } from "lucide-react";

// ==========================================
// PENGATURAN USERNAME & PASSWORD DEFAULT
// Silakan ubah nilai variabel di bawah ini
// untuk mengganti username & password masuk:
// ==========================================
const CONFIG_USERNAME = "pemberdayaan";
const CONFIG_PASSWORD = "pemberdayaan2026";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validasi login
    if (username.trim() === CONFIG_USERNAME && password === CONFIG_PASSWORD) {
      onLogin();
    } else {
      setError("Username atau Password yang Anda masukkan salah. Silakan coba lagi.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#A8E6CF] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-[#FACC15] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-[#D4F0F0] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative w-full max-w-md p-10 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white z-10 mx-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-[#A8E6CF] rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-[#91c9b4]">
            <Building2 className="w-10 h-10 text-teal-900" />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-800 text-center leading-tight">
            Data Peserta Pelatihan BPVP Bandung Barat
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-3 text-center">
            Sistem Informasi Terpadu
          </p>
        </div>



        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-150 rounded-2xl flex gap-2.5 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
            <input
              type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A8E6CF] focus:bg-white transition-all font-medium text-slate-800"
              placeholder="Masukkan username"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:bg-white transition-all font-medium text-slate-800"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="w-full py-4 px-6 bg-[#A8E6CF] hover:bg-[#91c9b4] text-teal-950 font-bold text-sm rounded-2xl transition-all shadow-md mt-6 active:scale-[0.98]">
            Masuk ke Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
