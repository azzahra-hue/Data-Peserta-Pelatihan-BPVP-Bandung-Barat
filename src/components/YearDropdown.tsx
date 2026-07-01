import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  availableYears?: string[];
}

export default function YearDropdown({ value, onChange, availableYears }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const years = availableYears && availableYears.length > 0 
    ? ["Semua", ...availableYears] 
    : ["Semua", "2024", "2025", "2026", "2027"];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#FACC15] hover:bg-[#FDE047] text-yellow-950 border border-[#FACC15] font-bold text-sm rounded-full shadow-sm transition-all active:scale-95"
      >
        <Calendar className="w-4 h-4 text-yellow-700" />
        {value === "Semua" ? "Semua Tahun" : `Tahun ${value}`}
        <ChevronDown className={`w-4 h-4 text-yellow-700 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-full min-w-[140px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in">
          <ul className="p-2 space-y-1">
            {years.map(y => (
              <li 
                key={y}
                onClick={() => { onChange(y); setIsOpen(false); }}
                className={`px-4 py-2 text-sm rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${value === y ? "bg-[#FACC15]/50 font-bold text-yellow-900" : "text-slate-600 font-medium"}`}
              >
                {y === "Semua" ? "Semua Tahun" : `Tahun ${y}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
