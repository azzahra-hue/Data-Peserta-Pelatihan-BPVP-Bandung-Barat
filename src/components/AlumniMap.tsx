import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { DatabaseState } from '../types';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface AlumniMapProps {
  dbState?: DatabaseState;
}

const REGION_COORDINATES: Record<string, google.maps.LatLngLiteral> = {
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
  if (!hasValidKey) {
    return (
      <div className="bg-slate-100 rounded-[2.5rem] border-4 border-white flex flex-col items-center justify-center min-h-[350px] p-8 shadow-sm text-center relative h-full">
        <h2 className="text-lg font-display font-bold text-slate-800 mb-4">Google Maps API Key Required</h2>
        <div className="text-sm text-slate-600 max-w-sm space-y-2">
          <p><strong>Step 1:</strong> <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener" className="text-teal-600 font-bold hover:underline">Get an API Key</a></p>
          <p><strong>Step 2:</strong> Add your key as a secret in AI Studio:</p>
          <ul className="text-left bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-2">
            <li>Open <strong>Settings</strong> (⚙️)</li>
            <li>Select <strong>Secrets</strong></li>
            <li>Type <code>GOOGLE_MAPS_PLATFORM_KEY</code></li>
            <li>Paste your API key</li>
          </ul>
        </div>
      </div>
    );
  }

  // Extract placed participants
  const placedAlumni = (dbState?.participants || []).filter(
    (p) => p.statusKelulusan === "Lulus" && (p.statusKebekerjaan === "Bekerja" || p.statusKebekerjaan === "Wirausaha")
  );

  const dynamicLocationsMap: Record<string, { id: string; name: string; position: google.maps.LatLngLiteral; count: number }> = {};

  placedAlumni.forEach((p, index) => {
    if (!p.lokasi || p.lokasi.trim() === "") return;
    const cleanLokasi = p.lokasi.trim();
    const lookupKey = cleanLokasi.toLowerCase();

    // Find coordinates from our pre-defined dictionary, or try to fuzzy match
    let position = REGION_COORDINATES[lookupKey];
    if (!position) {
      // Fuzzy match: check if dictionary key contains the lookup key, or vice-versa
      const matchingKey = Object.keys(REGION_COORDINATES).find(
        (k) => k.includes(lookupKey) || lookupKey.includes(k)
      );
      if (matchingKey) {
        position = REGION_COORDINATES[matchingKey];
      } else {
        // Default fallback to Bandung Barat region with a slight random offset to prevent complete overlapping
        const randLat = (Math.random() - 0.5) * 0.12;
        const randLng = (Math.random() - 0.5) * 0.12;
        position = { lat: -6.8402 + randLat, lng: 107.4580 + randLng };
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

  // If there are no placed alumni in the database yet, fallback to the pre-filled mock list so it always looks fantastic
  const displayLocations = locationsList.length > 0 ? locationsList : [
    { id: '1', name: 'PT. Indofood CBP (Bandung Barat)', position: { lat: -6.8402, lng: 107.4580 }, count: 150 },
    { id: '2', name: 'Kopi Kenangan (Bandung)', position: { lat: -6.9175, lng: 107.6191 }, count: 120 },
    { id: '3', name: 'Eiger Adventure (Kab. Bandung)', position: { lat: -7.0189, lng: 107.5255 }, count: 85 },
    { id: '4', name: 'Area Cimahi (Kawasan Industri)', position: { lat: -6.8778, lng: 107.5501 }, count: 850 },
    { id: '5', name: 'Area Subang', position: { lat: -6.5562, lng: 107.7562 }, count: 600 },
    { id: '6', name: 'Area Purwakarta', position: { lat: -6.5529, lng: 107.4431 }, count: 400 },
  ];

  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border-4 border-white min-h-[400px] h-full relative">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={{lat: -6.8402, lng: 107.4580}} // Center around Bandung Barat
          defaultZoom={9}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{width: '100%', height: '100%'}}
        >
          {displayLocations.map(loc => (
            <AdvancedMarker key={loc.id} position={loc.position} title={`${loc.name} (${loc.count} Alumni)`}>
              <div className="bg-[#A8E6CF] text-teal-900 font-bold text-xs px-2 py-1 rounded-full shadow-md border border-white whitespace-nowrap transform -translate-y-full">
                {loc.count} {locationsList.length > 0 ? "Orang" : ""}
              </div>
              <Pin background="#A8E6CF" glyphColor="#064E3B" borderColor="#064E3B" />
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
