import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Complaint, GISWardBoundary } from '../types';
import { MapPin, Layers, Crosshair, ZoomIn, ZoomOut, Search, Check, Globe } from 'lucide-react';

interface InteractiveMapProps {
  complaints?: Complaint[];
  wards?: GISWardBoundary[];
  selectedComplaintId?: string | null;
  onSelectComplaint?: (complaint: Complaint) => void;
  onSelectCoordinates?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  height?: string;
  showWards?: boolean;
}

type MapTileStyle = 'osm' | 'carto_positron' | 'carto_voyager';

const cartoApiKey = ((import.meta as any).env?.VITE_CARTO_API_KEY as string | undefined)?.trim() || '';
const cartoParam = cartoApiKey && cartoApiKey !== 'YOUR_KEY' ? `?key=${cartoApiKey}` : '';

const TILE_PROVIDERS: Record<MapTileStyle, { name: string; url: string; attribution: string; subdomains?: string }> = {
  osm: {
    name: 'OpenStreetMap (Standard)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    subdomains: 'abc'
  },
  carto_positron: {
    name: 'CartoDB Positron (Light)',
    url: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png${cartoParam}`,
    attribution: '© OpenStreetMap • CartoDB',
    subdomains: 'abcd'
  },
  carto_voyager: {
    name: 'CartoDB Voyager (Civic)',
    url: cartoApiKey && cartoApiKey !== 'YOUR_KEY'
      ? `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${cartoApiKey}`
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap • CARTO',
    subdomains: 'abcd'
  }
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  complaints = [],
  wards = [],
  selectedComplaintId,
  onSelectComplaint,
  onSelectCoordinates,
  selectedLocation,
  center = [11.0168, 76.9558], // Coimbatore center
  zoom = 12,
  height = '420px',
  showWards = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const wardsLayerRef = useRef<L.LayerGroup | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);
  const [activeCity, setActiveCity] = useState<'CBE' | 'CHE' | 'BLR' | 'DEL'>('CBE');
  const [tileStyle, setTileStyle] = useState<MapTileStyle>('carto_voyager');
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Free OpenStreetMap Nominatim search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center[0], center[1]] as [number, number],
        zoom,
        zoomControl: false,
        attributionControl: false
      });

      // Free OpenStreetMap / Carto Layer
      const provider = TILE_PROVIDERS[tileStyle];
      const tileLayer = L.tileLayer(provider.url, {
        maxZoom: 19,
        subdomains: provider.subdomains || 'abc'
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      // Free Attribution
      L.control.attribution({
        prefix: '<span class="text-[10px] text-neutral-500 font-sans">Free OpenStreetMap & Leaflet (No Google API)</span>',
        position: 'bottomright'
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      const wardsLayer = L.layerGroup().addTo(map);

      markersLayerRef.current = markersLayer;
      wardsLayerRef.current = wardsLayer;
      mapInstanceRef.current = map;

      // Click event for location selection in report wizard
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onSelectCoordinates) {
          onSelectCoordinates(e.latlng.lat, e.latlng.lng);
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Tile Layer switch
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const provider = TILE_PROVIDERS[tileStyle];
    const newLayer = L.tileLayer(provider.url, {
      maxZoom: 19,
      subdomains: provider.subdomains || 'abc'
    }).addTo(mapInstanceRef.current);
    newLayer.bringToBack();
    tileLayerRef.current = newLayer;
  }, [tileStyle]);

  // Update Wards Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !wardsLayerRef.current) return;
    wardsLayerRef.current.clearLayers();

    if (!showWards) return;

    wards.forEach(w => {
      if (w.geometry && w.geometry.coordinates) {
        // GeoJSON uses [lng, lat], Leaflet uses [lat, lng]
        if (w.geometry.type === 'Polygon') {
          const ring = (w.geometry.coordinates as number[][][])[0];
          const latLngs = ring.map(pt => [pt[1], pt[0]] as [number, number]);

          const polygon = L.polygon(latLngs, {
            color: '#4f46e5',
            weight: 1.5,
            dashArray: '4, 4',
            fillColor: '#6366f1',
            fillOpacity: 0.08
          });

          polygon.bindTooltip(
            `<div class="text-xs font-sans font-semibold">${w.wardName}</div><div class="text-[10px] text-neutral-500">${w.localBodyName} • Pop: ${w.population?.toLocaleString()}</div>`,
            { permanent: false, direction: 'center', className: 'civic-gis-tooltip' }
          );

          polygon.addTo(wardsLayerRef.current!);
        }
      }
    });
  }, [wards, showWards]);

  // Update Complaint Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    complaints.forEach(c => {
      const lat = c.location.latitude;
      const lng = c.location.longitude;
      if (!lat || !lng) return;

      let color = '#3b82f6'; // Blue (Medium/Low)
      if (c.status === 'RESOLVED' || c.status === 'CLOSED') {
        color = '#10b981'; // Green (Resolved)
      } else if (c.priorityLevel === 'CRITICAL') {
        color = '#ef4444'; // Red (Critical)
      } else if (c.priorityLevel === 'HIGH') {
        color = '#f59e0b'; // Amber (High)
      }

      const isSelected = selectedComplaintId === c.complaintId;

      const customIcon = L.divIcon({
        className: 'civic-custom-marker',
        html: `
          <div style="
            width: ${isSelected ? '28px' : '22px'}; 
            height: ${isSelected ? '28px' : '22px'}; 
            background: ${color}; 
            border: 2px solid white; 
            border-radius: 50%; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            ${isSelected ? 'transform: scale(1.2); border: 2.5px solid #000;' : ''}
          ">
            ${c.priorityScore}
          </div>
        `,
        iconSize: [isSelected ? 28 : 22, isSelected ? 28 : 22],
        iconAnchor: [isSelected ? 14 : 11, isSelected ? 14 : 11]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        if (onSelectComplaint) {
          onSelectComplaint(c);
        }
      });

      marker.bindPopup(`
        <div style="font-family: inherit; min-width: 200px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${color};">${c.priorityLevel} PRIORITY (${c.priorityScore}/100)</span>
            <span style="font-size: 10px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${c.status}</span>
          </div>
          <h4 style="font-size: 13px; font-weight: 700; color: #111827; margin: 0 0 4px 0; line-height: 1.3;">${c.title}</h4>
          <p style="font-size: 11px; color: #4b5563; margin: 0 0 6px 0;">${c.locationSnapshot.wardName || c.locationSnapshot.addressText}</p>
          <div style="font-size: 10px; color: #6b7280; border-top: 1px solid #e5e7eb; pt: 4px;">
            Dept: <strong>${c.assignedDepartmentName}</strong>
          </div>
        </div>
      `);

      marker.addTo(markersLayerRef.current!);
    });
  }, [complaints, selectedComplaintId]);

  // Selected Pin for Report Wizard
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (selectedLocation) {
      if (!pinMarkerRef.current) {
        const pinIcon = L.divIcon({
          className: 'civic-pin-marker',
          html: `
            <div style="
              width: 32px; 
              height: 32px; 
              background: #000000; 
              border: 3px solid #10b981; 
              border-radius: 50% 50% 50% 0; 
              transform: rotate(-45deg);
              box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            "></div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        pinMarkerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng], {
          icon: pinIcon,
          draggable: true
        }).addTo(mapInstanceRef.current);

        pinMarkerRef.current.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          if (onSelectCoordinates) {
            onSelectCoordinates(pos.lat, pos.lng);
          }
        });
      } else {
        pinMarkerRef.current.setLatLng([selectedLocation.lat, selectedLocation.lng]);
      }

      mapInstanceRef.current.setView([selectedLocation.lat, selectedLocation.lng], 15, { animate: true });
    } else if (pinMarkerRef.current) {
      pinMarkerRef.current.remove();
      pinMarkerRef.current = null;
    }
  }, [selectedLocation]);

  const jumpToCity = (city: 'CBE' | 'CHE' | 'BLR' | 'DEL') => {
    setActiveCity(city);
    if (!mapInstanceRef.current) return;

    if (city === 'CBE') {
      mapInstanceRef.current.setView([11.0168, 76.9558], 12);
    } else if (city === 'CHE') {
      mapInstanceRef.current.setView([13.0400, 80.2400], 12);
    } else if (city === 'BLR') {
      mapInstanceRef.current.setView([12.9716, 77.5946], 12);
    } else if (city === 'DEL') {
      mapInstanceRef.current.setView([28.6139, 77.2090], 12);
    }
  };

  // Free OpenStreetMap Nominatim Geocoding Search
  const handleNominatimSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=in`;
      const res = await fetch(endpoint, {
        headers: {
          'Accept-Language': 'en'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.warn('Nominatim free search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    if (!isNaN(lat) && !isNaN(lng) && mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
      if (onSelectCoordinates) {
        onSelectCoordinates(lat, lng);
      }
    }
    setShowSearchResults(false);
    setSearchQuery(result.display_name.split(',')[0]);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-neutral-200 shadow-sm bg-neutral-100" style={{ height }}>
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Top Left: City Quick-Switch */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur px-2 py-1.5 rounded-xl border border-neutral-200 shadow-sm text-xs font-medium">
        <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider pl-1">GIS City:</span>
        <button
          onClick={() => jumpToCity('CBE')}
          className={`px-2.5 py-1 rounded-lg transition ${activeCity === 'CBE' ? 'bg-neutral-900 text-white font-semibold' : 'text-neutral-700 hover:bg-neutral-100'}`}
        >
          Coimbatore (CCMC)
        </button>
        <button
          onClick={() => jumpToCity('CHE')}
          className={`px-2.5 py-1 rounded-lg transition ${activeCity === 'CHE' ? 'bg-neutral-900 text-white font-semibold' : 'text-neutral-700 hover:bg-neutral-100'}`}
        >
          Chennai (GCC)
        </button>
        <button
          onClick={() => jumpToCity('BLR')}
          className={`px-2.5 py-1 rounded-lg transition ${activeCity === 'BLR' ? 'bg-neutral-900 text-white font-semibold' : 'text-neutral-700 hover:bg-neutral-100'}`}
        >
          Bengaluru (BBMP)
        </button>
      </div>

      {/* Top Right: Free Nominatim Search + Free OpenStreetMap Layer Switcher */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {/* Free OpenStreetMap Address Search */}
        <div className="relative">
          <form onSubmit={handleNominatimSearch} className="flex items-center bg-white/95 backdrop-blur rounded-xl border border-neutral-200 shadow-sm px-2.5 py-1 text-xs">
            <Search className="w-3.5 h-3.5 text-neutral-400 mr-1.5" />
            <input
              type="text"
              placeholder="Search locality (free OSM)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
              className="bg-transparent border-none outline-hidden text-xs w-36 sm:w-48 text-neutral-800 placeholder:text-neutral-400"
            />
            {isSearching && (
              <span className="w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin ml-1"></span>
            )}
          </form>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 z-30 max-h-56 overflow-y-auto text-xs">
              <div className="px-3 py-1 text-[10px] uppercase font-semibold tracking-wider text-neutral-400 border-b border-neutral-100 flex items-center justify-between">
                <span>Free OpenStreetMap Places</span>
                <button onClick={() => setShowSearchResults(false)} className="text-neutral-400 hover:text-neutral-600">✕</button>
              </div>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-50 transition border-b border-neutral-50 last:border-none flex items-start gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px] text-neutral-700 line-clamp-2 leading-tight">
                    {item.display_name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Free Map Style Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-1.5 bg-white/95 backdrop-blur px-2.5 py-1.5 rounded-xl border border-neutral-200 shadow-sm text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
            title="Switch Free Map Layer"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Map: {TILE_PROVIDERS[tileStyle].name.split(' ')[0]}</span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 z-30 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50/70 border-b border-neutral-100 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>100% Free Open Layers</span>
              </div>
              {(Object.keys(TILE_PROVIDERS) as MapTileStyle[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setTileStyle(key);
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-neutral-50 transition flex items-center justify-between ${tileStyle === key ? 'font-semibold text-emerald-700 bg-emerald-50/40' : 'text-neutral-700'}`}
                >
                  <span>{TILE_PROVIDERS[key].name}</span>
                  {tileStyle === key && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Legend & GIS Layer indicator */}
      <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-2.5 bg-white/95 backdrop-blur px-3 py-2 rounded-xl border border-neutral-200 shadow-sm text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span className="text-neutral-700 font-medium">Critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-neutral-700 font-medium">High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span className="text-neutral-700 font-medium">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-neutral-700 font-medium">Resolved</span>
        </div>
        <div className="h-3 w-px bg-neutral-200"></div>
        <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
          <Globe className="w-3 h-3" />
          <span>Free OpenStreetMap (No Google API)</span>
        </div>
      </div>

      {/* Custom Map Zoom Controls */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1 bg-white rounded-xl border border-neutral-200 shadow-sm p-1">
        <button 
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-700 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button 
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-700 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
