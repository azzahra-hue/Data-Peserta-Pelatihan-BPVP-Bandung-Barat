import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface AlumniLocation {
  id: string;
  name: string;
  position: google.maps.LatLngLiteral;
  count: number;
}

const locations: AlumniLocation[] = [
  { id: '1', name: 'PT. Indofood CBP (Bandung Barat)', position: { lat: -6.8402, lng: 107.4580 }, count: 150 },
  { id: '2', name: 'Kopi Kenangan (Bandung)', position: { lat: -6.9175, lng: 107.6191 }, count: 120 },
  { id: '3', name: 'Eiger Adventure (Kab. Bandung)', position: { lat: -7.0189, lng: 107.5255 }, count: 85 },
  { id: '4', name: 'Area Cimahi (Kawasan Industri)', position: { lat: -6.8778, lng: 107.5501 }, count: 850 },
  { id: '5', name: 'Area Subang', position: { lat: -6.5562, lng: 107.7562 }, count: 600 },
  { id: '6', name: 'Area Purwakarta', position: { lat: -6.5529, lng: 107.4431 }, count: 400 },
];

export default function AlumniMap() {
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
          {locations.map(loc => (
            <AdvancedMarker key={loc.id} position={loc.position} title={`${loc.name} (${loc.count} Alumni)`}>
              <div className="bg-[#A8E6CF] text-teal-900 font-bold text-xs px-2 py-1 rounded-full shadow-md border border-white whitespace-nowrap transform -translate-y-full">
                {loc.count}
              </div>
              <Pin background="#A8E6CF" glyphColor="#064E3B" borderColor="#064E3B" />
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
