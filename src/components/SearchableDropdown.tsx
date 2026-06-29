import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

interface Props {
  label?: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function SearchableDropdown({ label, options, value, onChange, placeholder = "Pilih..." }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full" ref={ref}>
      {label && <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#A8E6CF] transition-all"
      >
        <span className={`truncate ${!value ? "text-slate-400" : "text-slate-800 font-bold"}`}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
          <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Cari kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm bg-transparent font-medium focus:outline-none text-slate-700"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto p-2 space-y-1">
            <li
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setSearch("");
              }}
              className={`px-3 py-2.5 text-sm rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${!value ? "bg-slate-100 text-teal-700 font-bold" : "text-slate-600 font-medium"}`}
            >
              Semua / Kosongkan
            </li>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <li
                  key={idx}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`px-3 py-2.5 text-sm rounded-xl cursor-pointer hover:bg-[#F3FDF8] transition-colors flex items-center justify-between ${
                    value === opt ? "bg-[#A8E6CF]/30 text-teal-800 font-bold" : "text-slate-700 font-medium"
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {value === opt && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                </li>
              ))
            ) : (
              <li className="px-3 py-4 text-sm text-center text-slate-400 font-medium">Tidak ada hasil ditemukan</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
