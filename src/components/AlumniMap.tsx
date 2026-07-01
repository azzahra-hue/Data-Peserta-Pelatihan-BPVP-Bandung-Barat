import React, { useEffect, useRef, useMemo } from 'react';
import { DatabaseState } from '../types';

interface AlumniMapProps {
  dbState?: DatabaseState;
}

const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "bandung barat": { lat: -6.8402, lng: 107.4580 },
  "kab. bandung barat": { lat: -6.8402, lng: 107.4580 },
  "bandung": { lat: -6.9175, lng: 107.6191 },
  "kota bandung": { lat: -6.9175, lng: 107.6191 },
  "kab. bandung": { lat: -7.0189, lng: 107.5255 },
  "cimahi": { lat: -6.8778, lng: 107.5501 },
  "kota cimahi": { lat: -6.8778, lng: 107.5501 },
  "subang": { lat: -6.5562, lng: 107.7562 },
  "kab. subang": { lat: -6.5562, lng: 107.7562 },
  "purwakarta": { lat: -6.5529, lng: 107.4431 },
  "kab. purwakarta": { lat: -6.5529, lng: 107.4431 },
  "jakarta": { lat: -6.2088, lng: 106.8456 },
  "dki jakarta": { lat: -6.2088, lng: 106.8456 },
  "majalengka": { lat: -6.8364, lng: 108.2274 },
  "kab. majalengka": { lat: -6.8364, lng: 108.2274 },
  "cianjur": { lat: -6.8222, lng: 107.1394 },
  "kab. cianjur": { lat: -6.8222, lng: 107.1394 },
  "sumedang": { lat: -6.8589, lng: 107.9250 },
  "kab. sumedang": { lat: -6.8589, lng: 107.9250 },
  "garut": { lat: -7.2278, lng: 107.9086 },
  "kab. garut": { lat: -7.2278, lng: 107.9086 },
  "tasikmalaya": { lat: -7.3274, lng: 108.2207 },
  "kab. tasikmalaya": { lat: -7.3274, lng: 108.2207 },
  "sukabumi": { lat: -6.9278, lng: 106.9300 },
  "kab. sukabumi": { lat: -6.9278, lng: 106.9300 },
  "bogor": { lat: -6.5971, lng: 106.8060 },
  "kab. bogor": { lat: -6.5971, lng: 106.8060 },
  "depok": { lat: -6.4025, lng: 106.7942 },
  "bekasi": { lat: -6.2383, lng: 106.9756 },
  "karawang": { lat: -6.3227, lng: 107.3376 },
  "lampung": { lat: -5.4500, lng: 105.2667 },
  "tangerang": { lat: -6.1783, lng: 106.6319 }
};

export default function AlumniMap({ dbState }: AlumniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Extract placed participants
  const displayLocations = useMemo(() => {
    const placedAlumni = (dbState?.participants || []).filter(
      (p) => p.statusKelulusan === "Lulus" && (p.statusKebekerjaan === "Bekerja" || p.statusKebekerjaan === "Wirausaha")
    );

    const dynamicLocationsMap: Record<string, { id: string; name: string; position: { lat: number; lng: number }; count: number }> = {};

    placedAlumni.forEach((p, index) => {
      if (!p.lokasi || p.lokasi.trim() === "") return;
      const cleanLokasi = p.lokasi.trim();
      const lookupKey = cleanLokasi.toLowerCase();

      // Find coordinates from our pre-defined dictionary, or try to fuzzy match
      let position = REGION_COORDINATES[lookupKey];
      if (!position) {
        const matchingKey = Object.keys(REGION_COORDINATES).find(
          (k) => k.includes(lookupKey) || lookupKey.includes(k)
        );
        if (matchingKey) {
          position = REGION_COORDINATES[matchingKey];
        } else {
          // Default fallback to Lembang area with a slight random offset to prevent complete overlapping
          const randLat = (Math.random() - 0.5) * 0.15;
          const randLng = (Math.random() - 0.5) * 0.15;
          position = { lat: -6.7937 + randLat, lng: 107.6251 + randLng };
        }
      }

      if (!dynamicLocationsMap[cleanLokasi]) {
        dynamicLocationsMap[cleanLokasi] = {
          id: `loc-${index}`,
          name: cleanLokasi,
          position,
          count: 0
        };
      }
      dynamicLocationsMap[cleanLokasi].count += 1;
    });

    const locationsList = Object.values(dynamicLocationsMap);

    return locationsList.length > 0 ? locationsList : [
      { id: '1', name: 'PT. Indofood CBP (Bandung Barat)', position: { lat: -6.8402, lng: 107.4580 }, count: 150 },
      { id: '2', name: 'Kopi Kenangan (Bandung)', position: { lat: -6.9175, lng: 107.6191 }, count: 120 },
      { id: '3', name: 'Eiger Adventure (Kab. Bandung)', position: { lat: -7.0189, lng: 107.5255 }, count: 85 },
      { id: '4', name: 'Area Cimahi (Kawasan Industri)', position: { lat: -6.8778, lng: 107.5501 }, count: 850 },
      { id: '5', name: 'Area Subang', position: { lat: -6.5562, lng: 107.7562 }, count: 600 },
      { id: '6', name: 'Area Purwakarta', position: { lat: -6.5529, lng: 107.4431 }, count: 400 },
    ];
  }, [dbState?.participants]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) {
      console.warn("Leaflet is not available on window.");
      return;
    }

    // BPVP Bandung Barat Lembang coordinates: -6.7937, 107.6251
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([-6.7937, 107.6251], 10);
    
    mapInstanceRef.current = map;

    // Use beautiful light voyager tile layer matching our UI theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Add main marker for BPVP Bandung Barat with elegant pulsate effect
    const bpvpIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-9 w-9 rounded-full bg-teal-400 opacity-60 animate-ping"></span>
          <div class="relative bg-teal-600 text-white p-2 rounded-full shadow-lg border-2 border-white flex items-center justify-center" style="width: 36px; height: 36px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
          </div>
        </div>
      `,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const bpvpMarker = L.marker([-6.7937, 107.6251], { icon: bpvpIcon }).addTo(map);
    bpvpMarker.bindPopup(`
      <div class="p-2 font-sans text-center min-w-[150px]">
        <h3 class="font-bold text-slate-800 text-sm">BPVP Bandung Barat</h3>
        <p class="text-xs text-slate-500 mt-1">Balai Pelatihan Vokasi & Produktivitas</p>
        <div class="inline-block bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full mt-2">
          📍 Lembang, Cikole
        </div>
      </div>
    `, { closeButton: false }).openPopup();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when displayLocations changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add alumni markers
    displayLocations.forEach(loc => {
      // Avoid placing exact overlap with BPVP center if it matches fallback exactly
      const isBpvpArea = Math.abs(loc.position.lat - -6.7937) < 0.005 && Math.abs(loc.position.lng - 107.6251) < 0.005;
      
      const markerColor = isBpvpArea ? "bg-amber-500 border-amber-600" : "bg-[#A8E6CF] border-emerald-500";
      const textColor = isBpvpArea ? "text-amber-900" : "text-emerald-900";
      const dotColor = isBpvpArea ? "bg-amber-600" : "bg-emerald-500";

      const alumniIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center">
            <div class="${markerColor} ${textColor} font-bold text-[10px] px-2 py-0.5 rounded-full shadow-md border whitespace-nowrap mb-1">
              ${loc.count} Alumni
            </div>
            <div class="w-3.5 h-3.5 rounded-full bg-white border-2 border-emerald-500 shadow-md flex items-center justify-center">
              <div class="w-1.5 h-1.5 rounded-full ${dotColor}"></div>
            </div>
          </div>
        `,
        className: '',
        iconSize: [70, 40],
        iconAnchor: [35, 35]
      });

      const marker = L.marker([loc.position.lat, loc.position.lng], { icon: alumniIcon }).addTo(map);
      marker.bindPopup(`
        <div class="p-2 font-sans max-w-[200px]">
          <h4 class="font-bold text-slate-800 text-xs">${loc.name}</h4>
          <div class="flex items-center gap-1.5 mt-1">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span class="text-[11px] text-slate-600 font-semibold">${loc.count} Alumni Terkoneksi</span>
          </div>
        </div>
      `, { closeButton: false });

      markersRef.current.push(marker);
    });
  }, [displayLocations]);

  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border-4 border-white h-full relative" style={{ minHeight: '400px' }}>
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />
    </div>
  );
}
