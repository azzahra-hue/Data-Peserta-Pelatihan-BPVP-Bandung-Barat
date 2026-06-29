import { useState, useEffect } from "react";
import { UserRole, Participant } from "../types";
import { Sparkles, BrainCircuit, RefreshCw, Send, CheckCircle2 } from "lucide-react";

interface AIDecisionSupportProps {
  currentRole: UserRole;
  participants: Participant[];
}

export default function AIDecisionSupport({ currentRole, participants }: AIDecisionSupportProps) {
  const [recommendation, setRecommendation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Simple Markdown to HTML formatter to avoid loading external libraries
  const formatMarkdown = (text: string) => {
    if (!text) return "";
    
    // Split into paragraphs/lines
    const lines = text.split("\n");
    return lines.map((line, index) => {
      let trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith("### ")) {
        return <h4 key={index} className="text-sm font-bold text-slate-900 mt-4 mb-1">{trimmed.replace("### ", "")}</h4>;
      }
      if (trimmed.startsWith("## ")) {
        return <h3 key={index} className="text-base font-display font-bold text-slate-900 mt-6 mb-2 border-b border-slate-100 pb-1">{trimmed.replace("## ", "")}</h3>;
      }
      if (trimmed.startsWith("# ")) {
        return <h2 key={index} className="text-lg font-display font-bold text-slate-900 mt-8 mb-3">{trimmed.replace("# ", "")}</h2>;
      }

      // Bullet lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const content = trimmed.substring(2);
        return (
          <li key={index} className="list-disc list-inside text-xs text-slate-600 ml-4 mb-1.5 leading-relaxed">
            {parseInlineMarkdown(content)}
          </li>
        );
      }

      // Numbered lists
      if (/^\d+\.\s/.test(trimmed)) {
        const content = trimmed.replace(/^\d+\.\s/, "");
        return (
          <li key={index} className="list-decimal list-inside text-xs text-slate-600 ml-4 mb-1.5 leading-relaxed">
            {parseInlineMarkdown(content)}
          </li>
        );
      }

      // Empty line
      if (trimmed === "") {
        return <div key={index} className="h-2"></div>;
      }

      // Regular paragraph
      return (
        <p key={index} className="text-xs text-slate-600 mb-2 leading-relaxed">
          {parseInlineMarkdown(trimmed)}
        </p>
      );
    });
  };

  // Helper to parse bold **text** in lines
  const parseInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const fetchAIAdvice = async (isManualRefresh = false) => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: currentRole,
          activeFilters: {}
        }),
      });
      const data = await res.json();
      setRecommendation(data.recommendation || "Gagal memproses rekomendasi.");
    } catch (err) {
      console.error(err);
      setRecommendation("Gagal menghubungi asisten AI BPVP Bandung Barat. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch advice automatically when currentRole shifts
  useEffect(() => {
    fetchAIAdvice();
  }, [currentRole]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(recommendation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-indigo-800/40" id="ai-decision-support-root">
      
      {/* AI Title Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800/30 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
            <BrainCircuit className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-white flex items-center gap-1.5">
              Saran Keputusan AI <span className="inline-flex items-center text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Gemini 3.5</span>
            </h2>
            <p className="text-xs text-indigo-200">Rekomendasi taktis evaluasi kurikulum berbasis AECT untuk peran <strong className="text-amber-300 font-semibold">{currentRole}</strong>.</p>
          </div>
        </div>

        <button
          onClick={() => fetchAIAdvice(true)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 rounded-xl px-4 py-2 text-xs font-semibold text-indigo-100 transition-all active:scale-95 disabled:opacity-50"
          id="btn-refresh-ai"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Menganalisis..." : "Segarkan Analisis"}
        </button>
      </div>

      {/* Advice Display Area */}
      <div className="mt-6 bg-slate-950/70 rounded-xl p-5 border border-indigo-900/40 min-h-[250px] relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-slate-950/45 rounded-xl">
            <div className="relative flex items-center justify-center">
              <div className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-indigo-400 opacity-75"></div>
              <Sparkles className="relative w-8 h-8 text-indigo-400 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-indigo-200">Membaca Struktur Database Alumni...</p>
              <p className="text-[10px] text-indigo-300/60 mt-1">Merumuskan matriks keputusan kurikulum & saran kemitraan</p>
            </div>
          </div>
        ) : null}

        <div className="space-y-1 prose prose-invert max-w-none text-slate-100 selection:bg-indigo-500/45">
          {recommendation ? (
            <div className="space-y-3" id="ai-response-rendered">
              {formatMarkdown(recommendation)}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs">
              Saran analisis keputusan belum dimuat. Klik tombol 'Segarkan Analisis' di atas untuk memanggil AI Gemini.
            </div>
          )}
        </div>

        {/* Copy advice btn */}
        {recommendation && !loading && (
          <div className="flex justify-end mt-6 pt-4 border-t border-indigo-900/20">
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-900/40 active:scale-95"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Salin Berhasil!
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Salin Rekomendasi
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Strategic AECT Banner info */}
      <div className="mt-4 bg-indigo-950/40 p-3 rounded-xl border border-indigo-900/30 text-[10px] text-indigo-300/80 leading-relaxed">
        💡 <strong>Perspektif Teknologi Pendidikan (AECT):</strong> Analisis ini diselaraskan dengan fungsi <strong>Pengelolaan</strong> (organisasi sumber daya) dan <strong>Evaluasi</strong> (penilaian ketercapaian program belajar & tracer study) untuk memastikan pengembangan kurikulum pelatihan vokasi di BPVP Bandung Barat berjalan terstruktur berbasis bukti data (Evidence-Based Decision Making).
      </div>

    </div>
  );
}
