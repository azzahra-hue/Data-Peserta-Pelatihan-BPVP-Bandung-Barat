import React from 'react';
import SearchableDropdown from './SearchableDropdown';

interface Props {
  filters: { jenis: string, kejuruan: string, program: string };
  setFilters: (filters: any) => void;
}

export default function FiltersGroup({ filters, setFilters }: Props) {
  const jenisOptions = ["Pelatihan Berbasis Kompetensi (PBK)", "Pelatihan Tanggap Darurat", "Mobile Training Unit (MTU)", "Blended Learning"];
  const kejuruanOptions = ["Agroindustri", "Bisnis Manajemen", "Teknologi Informasi", "Pariwisata"];
  const programOptions = ["Penyangraian Biji Kopi (Roasting)", "Digital Marketing", "Desain Grafis", "Barista", "Tata Boga", "Budidaya Hidroponik"];

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4 mb-6 relative z-40">
      <div className="flex-1">
        <SearchableDropdown 
          label="Jenis Pelatihan" 
          options={jenisOptions} 
          value={filters.jenis} 
          onChange={(v) => setFilters({...filters, jenis: v})} 
          placeholder="Semua Jenis"
        />
      </div>
      <div className="flex-1">
        <SearchableDropdown 
          label="Kejuruan" 
          options={kejuruanOptions} 
          value={filters.kejuruan} 
          onChange={(v) => setFilters({...filters, kejuruan: v})} 
          placeholder="Semua Kejuruan"
        />
      </div>
      <div className="flex-1">
        <SearchableDropdown 
          label="Program Pelatihan" 
          options={programOptions} 
          value={filters.program} 
          onChange={(v) => setFilters({...filters, program: v})} 
          placeholder="Semua Program"
        />
      </div>
    </div>
  );
}
