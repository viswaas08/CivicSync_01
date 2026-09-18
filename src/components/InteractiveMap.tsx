import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Complaint, GISWardBoundary } from '../types';
import { 
  MapPin, 
  Layers, 
  Crosshair, 
  ZoomIn, 
  ZoomOut, 
  Search, 
  Check, 
  Globe, 
  Flame, 
  Activity, 
  Filter, 
  Info, 
  Sparkles,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { getActivePermits } from '../services/utilityCoordinationEngine';

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
export type MapViewMode = 'pins' | 'heat' | 'choropleth';
export type DefectTypeFilter = 'ALL' | 'pothole' | 'garbage' | 'water' | 'lighting';

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
  height = '480px',
  showWards = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<L.LayerGroup | null>(null);
  const wardsLayerRef = useRef<L.LayerGroup | null>(null);
  const utilityLayerRef = useRef<L.LayerGroup | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);

  const [activeCity, setActiveCity] = useState<'CBE' | 'CHE' | 'BLR' | 'DEL' | 'MUM' | 'HYD' | 'KOL' | 'AHM'>('CBE');
  const [tileStyle, setTileStyle] = useState<MapTileStyle>('carto_voyager');
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // New View Modes: Pins, Heatmap Hotspots, Ward Choropleth, Utility Corridors
  const [mapMode, setMapMode] = useState<MapViewMode>('pins');
  const [defectFilter, setDefectFilter] = useState<DefectTypeFilter>('ALL');
  const [showUtilityCorridors, setShowUtilityCorridors] = useState(false);

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

      // Attribution
      L.control.attribution({
        prefix: '<span class="text-[10px] text-neutral-500 font-sans">OpenStreetMap & Leaflet GIS Engine</span>',
        position: 'bottomright'
      }).addTo(map);

      const wardsLayer = L.layerGroup().addTo(map);
      const heatLayer = L.layerGroup().addTo(map);
      const markersLayer = L.layerGroup().addTo(map);
      const utilityLayer = L.layerGroup().addTo(map);

      wardsLayerRef.current = wardsLayer;
      heatLayerRef.current = heatLayer;
      markersLayerRef.current = markersLayer;
      utilityLayerRef.current = utilityLayer;
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

  // Filter complaints by defect type if active
  const filteredComplaints = React.useMemo(() => {
    if (defectFilter === 'ALL') return complaints;
    return complaints.filter(c => {
      const text = `${c.title} ${c.problemType} ${c.category} ${c.description}`.toLowerCase();
      if (defectFilter === 'pothole') return text.includes('pothole') || text.includes('road') || text.includes('asphalt');
      if (defectFilter === 'garbage') return text.includes('garbage') || text.includes('waste') || text.includes('dumper') || text.includes('sanitation');
      if (defectFilter === 'water') return text.includes('water') || text.includes('sewage') || text.includes('drain') || text.includes('pipe') || text.includes('burst');
      if (defectFilter === 'lighting') return text.includes('light') || text.includes('lamp') || text.includes('electrical') || text.includes('wire');
      return true;
    });
  }, [complaints, defectFilter]);

  // Update Wards Layer & Choropleth
  useEffect(() => {
    if (!mapInstanceRef.current || !wardsLayerRef.current) return;
    wardsLayerRef.current.clearLayers();

    if (!showWards && mapMode !== 'choropleth') return;

    // Build complaint count index per ward
    const wardComplaintCounts = new Map<string, number>();
    const wardDefectBreakdown = new Map<string, { potholes: number; garbage: number; water: number; other: number }>();

    complaints.forEach(c => {
      const wardNum = c.locationSnapshot?.wardNumber;
      if (wardNum) {
        wardComplaintCounts.set(wardNum, (wardComplaintCounts.get(wardNum) || 0) + 1);
        const bd = wardDefectBreakdown.get(wardNum) || { potholes: 0, garbage: 0, water: 0, other: 0 };
        const text = `${c.title} ${c.problemType} ${c.category}`.toLowerCase();
        if (text.includes('pothole') || text.includes('road')) bd.potholes++;
        else if (text.includes('garbage') || text.includes('waste')) bd.garbage++;
        else if (text.includes('water') || text.includes('sewage')) bd.water++;
        else bd.other++;
        wardDefectBreakdown.set(wardNum, bd);
      }
    });

    wards.forEach(w => {
      if (w.geometry && w.geometry.coordinates) {
        if (w.geometry.type === 'Polygon') {
          const ring = (w.geometry.coordinates as number[][][])[0];
          const latLngs = ring.map(pt => [pt[1], pt[0]] as [number, number]);

          const count = wardComplaintCounts.get(w.wardNumber) || 0;
          const breakdown = wardDefectBreakdown.get(w.wardNumber) || { potholes: 0, garbage: 0, water: 0, other: 0 };

          // Determine choropleth style
          let fillColor = '#6366f1';
          let fillOpacity = 0.08;
          let strokeColor = '#4f46e5';
          let strokeDash = '4, 4';
          let strokeWidth = 1.5;

          if (mapMode === 'choropleth') {
            strokeDash = '0';
            if (count === 0) {
              fillColor = '#10b981'; // Green: Compliant / Clear
              fillOpacity = 0.12;
              strokeColor = '#059669';
              strokeWidth = 1.5;
            } else if (count <= 2) {
              fillColor = '#f59e0b'; // Amber: Moderate
              fillOpacity = 0.28;
              strokeColor = '#d97706';
              strokeWidth = 2;
            } else {
              fillColor = '#ef4444'; // Red: Critical Hotspot
              fillOpacity = 0.45;
              strokeColor = '#b91c1c';
              strokeWidth = 2.5;
            }
          }

          const polygon = L.polygon(latLngs, {
            color: strokeColor,
            weight: strokeWidth,
            dashArray: strokeDash,
            fillColor,
            fillOpacity
          });

          const statusBadge = count === 0 
            ? '<span style="color:#059669; font-weight:700;">🟢 Low Density (Clear)</span>'
            : count <= 2 
              ? '<span style="color:#d97706; font-weight:700;">🟡 Moderate Concentration</span>'
              : '<span style="color:#dc2626; font-weight:700;">🔴 Critical Hotspot Concentration</span>';

          polygon.bindTooltip(
            `<div style="font-family: system-ui, -apple-system, sans-serif; min-width: 180px; padding: 2px;">
              <div style="font-size: 12px; font-weight: 700; color: #111827;">${w.wardName}</div>
              <div style="font-size: 10px; color: #6b7280; margin-bottom: 4px;">${w.localBodyName} • Pop: ${w.population?.toLocaleString() || 'N/A'}</div>
              <div style="font-size: 11px; margin-bottom: 3px;">${statusBadge}</div>
              <div style="font-size: 10px; color: #374151; border-top: 1px solid #e5e7eb; padding-top: 3px;">
                Active Grievances: <strong>${count}</strong>
                ${count > 0 ? `<br>• Potholes: ${breakdown.potholes} | Garbage: ${breakdown.garbage} | Water: ${breakdown.water}` : ''}
              </div>
            </div>`,
            { permanent: false, direction: 'center', className: 'civic-gis-tooltip' }
          );

          polygon.addTo(wardsLayerRef.current!);
        }
      }
    });
  }, [wards, showWards, mapMode, complaints]);

  // Update Markers & Heatmap Halos
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !heatLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    heatLayerRef.current.clearLayers();

    filteredComplaints.forEach(c => {
      const lat = c.location?.latitude;
      const lng = c.location?.longitude;
      if (!lat || !lng) return;

      const isResolved = c.status === 'RESOLVED' || c.status === 'CLOSED';
      const text = `${c.title} ${c.problemType} ${c.category}`.toLowerCase();

      // Color mapping by defect type & severity
      let defectColor = '#ef4444'; // Crimson default for potholes
      let defectLabel = 'Asphalt / Pothole';
      if (text.includes('garbage') || text.includes('waste') || text.includes('dumper')) {
        defectColor = '#f59e0b';
        defectLabel = 'Garbage / Dumper';
      } else if (text.includes('water') || text.includes('burst') || text.includes('sewage') || text.includes('drain')) {
        defectColor = '#0284c7';
        defectLabel = 'Water / Sewage Burst';
      } else if (text.includes('light') || text.includes('lamp') || text.includes('electrical')) {
        defectColor = '#8b5cf6';
        defectLabel = 'Streetlight / Electrical';
      }

      if (isResolved) {
        defectColor = '#10b981';
      }

      // 1. HEATMAP MODE: Radiant translucent halos + beacon
      if (mapMode === 'heat') {
        const radius = Math.max(160, Math.min(360, (c.priorityScore || 50) * 3.5));

        // Outer radiant glow
        const outerCircle = L.circle([lat, lng], {
          radius: radius * 1.5,
          color: defectColor,
          weight: 0,
          fillColor: defectColor,
          fillOpacity: 0.12
        });

        // Inner concentrated heat circle
        const innerCircle = L.circle([lat, lng], {
          radius: radius * 0.7,
          color: defectColor,
          weight: 1,
          fillColor: defectColor,
          fillOpacity: 0.35
        });

        // Center beacon pin
        const beaconIcon = L.divIcon({
          className: 'civic-heat-beacon',
          html: `
            <div style="
              width: 14px; 
              height: 14px; 
              background: ${defectColor}; 
              border: 2px solid white; 
              border-radius: 50%; 
              box-shadow: 0 0 10px ${defectColor};
            "></div>
          `,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        const beaconMarker = L.marker([lat, lng], { icon: beaconIcon });
        beaconMarker.on('click', () => onSelectComplaint && onSelectComplaint(c));
        beaconMarker.bindPopup(`
          <div style="font-family: inherit; min-width: 220px; padding: 4px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span style="font-size:10px; font-weight:700; color:${defectColor}; text-transform:uppercase;">🔥 Hotspot: ${defectLabel}</span>
              <span style="font-size:10px; background:#fef2f2; color:#b91c1c; padding:2px 6px; border-radius:4px; font-weight:700;">Score: ${c.priorityScore}/100</span>
            </div>
            <h4 style="font-size:13px; font-weight:700; color:#111827; margin:0 0 4px 0;">${c.title}</h4>
            <p style="font-size:11px; color:#4b5563; margin:0 0 6px 0;">${c.locationSnapshot.wardName || c.locationSnapshot.addressText}</p>
            <div style="font-size:10px; color:#6b7280; border-top:1px solid #e5e7eb; padding-top:4px;">
              Dept: <strong>${c.assignedDepartmentName}</strong> • SLA: ${c.sla?.currentEscalationLevel}
            </div>
          </div>
        `);

        outerCircle.addTo(heatLayerRef.current!);
        innerCircle.addTo(heatLayerRef.current!);
        beaconMarker.addTo(heatLayerRef.current!);
      } 
      // 2. PINS / CHOROPLETH MODE: Standard markers
      else {
        const isSelected = selectedComplaintId === c.complaintId;
        let markerColor = defectColor;
        if (c.priorityLevel === 'CRITICAL') markerColor = '#ef4444';
        else if (c.priorityLevel === 'HIGH') markerColor = '#f59e0b';
        else if (isResolved) markerColor = '#10b981';

        const customIcon = L.divIcon({
          className: 'civic-custom-marker',
          html: `
            <div style="
              width: ${isSelected ? '28px' : '22px'}; 
              height: ${isSelected ? '28px' : '22px'}; 
              background: ${markerColor}; 
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
              ${c.priorityScore || '!'}
            </div>
          `,
          iconSize: [isSelected ? 28 : 22, isSelected ? 28 : 22],
          iconAnchor: [isSelected ? 14 : 11, isSelected ? 14 : 11]
        });

        const marker = L.marker([lat, lng], { icon: customIcon });
        marker.on('click', () => onSelectComplaint && onSelectComplaint(c));
        marker.bindPopup(`
          <div style="font-family: inherit; min-width: 200px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${markerColor};">${c.priorityLevel} (${c.priorityScore}/100)</span>
              <span style="font-size: 10px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${c.status}</span>
            </div>
            <h4 style="font-size: 13px; font-weight: 700; color: #111827; margin: 0 0 4px 0; line-height: 1.3;">${c.title}</h4>
            <p style="font-size: 11px; color: #4b5563; margin: 0 0 6px 0;">${c.locationSnapshot?.wardName || c.locationSnapshot?.addressText}</p>
            <div style="font-size: 10px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 4px;">
              Dept: <strong>${c.assignedDepartmentName}</strong>
            </div>
          </div>
        `);

        marker.addTo(markersLayerRef.current!);
      }
    });
  }, [filteredComplaints, selectedComplaintId, mapMode]);

  // Render Utility Excavation Corridors (Conflict Prevention Overlay)
  useEffect(() => {
    if (!utilityLayerRef.current) return;
    utilityLayerRef.current.clearLayers();

    if (!showUtilityCorridors) return;

    const permits = getActivePermits();

    permits.forEach((permit) => {
      const coords = permit.coordinates;
      if (!coords || coords.length < 2) return;

      const polylinePoints = coords.map((c) => [c[0], c[1]] as [number, number]);

      // Color coding based on utility type and moratorium status
      let strokeColor = '#0284c7'; // Water (TWAD/BWSSB)
      if (permit.utilityType === 'ELECTRICITY_TANGEDCO_BESCOM') strokeColor = '#d97706'; // Power
      else if (permit.utilityType === 'TELECOM_OPTICAL_FIBER') strokeColor = '#9333ea'; // Telecom OFC
      else if (permit.utilityType === 'GAS_PIPELINE') strokeColor = '#059669'; // GAIL Gas
      else if (permit.utilityType === 'METRO_RAIL_UNDERGROUND') strokeColor = '#e11d48'; // Metro

      const isBlocked = permit.status === 'BLOCKED_SPATIAL_CONFLICT';
      if (isBlocked) strokeColor = '#dc2626';

      const polyline = L.polyline(polylinePoints, {
        color: strokeColor,
        weight: isBlocked ? 6 : 4,
        dashArray: isBlocked ? '6, 6' : undefined,
        opacity: isBlocked ? 0.9 : 0.85
      });

      polyline.bindPopup(`
        <div style="font-family: inherit; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${strokeColor};">
              ${permit.agencyName}
            </span>
            <span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; ${
              isBlocked ? 'background: #fee2e2; color: #b91c1c;' : 'background: #dcfce7; color: #15803d;'
            }">
              ${permit.status.replace(/_/g, ' ')}
            </span>
          </div>
          <h4 style="font-size: 12px; font-weight: 700; color: #111827; margin: 0 0 3px 0;">${permit.roadName}</h4>
          <p style="font-size: 11px; color: #4b5563; margin: 0 0 6px 0;">${permit.purposeOfExcavation}</p>
          <div style="font-size: 10px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
            <div>Trench: <strong>${permit.trenchLengthMeters}m (${permit.surfaceType})</strong></div>
            <div>Escrow: <strong>₹${permit.reinstatementEscrowDeposit.toLocaleString('en-IN')}</strong></div>
            <div>Dates: <strong>${permit.scheduledStartDate} → ${permit.scheduledEndDate}</strong></div>
            <div>NOC Ref: <strong>${permit.permitNumber}</strong></div>
          </div>
        </div>
      `);

      polyline.addTo(utilityLayerRef.current!);

      // Add start and end circle markers
      const startMarker = L.circleMarker(polylinePoints[0], {
        radius: 4,
        color: strokeColor,
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: 2
      });
      startMarker.bindTooltip(`Start: ${permit.roadName} (${permit.agencyName})`, { direction: 'top' });
      startMarker.addTo(utilityLayerRef.current!);
    });
  }, [showUtilityCorridors]);

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

  const jumpToCity = (city: typeof activeCity) => {
    setActiveCity(city);
    if (!mapInstanceRef.current) return;

    const cityCoords: Record<typeof activeCity, [number, number]> = {
      CBE: [11.0168, 76.9558],
      CHE: [13.0827, 80.2707],
      BLR: [12.9716, 77.5946],
      DEL: [28.6139, 77.2090],
      MUM: [19.0760, 72.8777],
      HYD: [17.3850, 78.4867],
      KOL: [22.5726, 88.3639],
      AHM: [23.0225, 72.5714]
    };

    const coords = cityCoords[city];
    if (coords) {
      mapInstanceRef.current.setView(coords, 12, { animate: true });
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
        headers: { 'Accept-Language': 'en' }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.warn('Nominatim search warning:', err);
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
      {/* Map Leaflet Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Top Left: Geospatial Layer View Mode Toggle & City Jump */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 max-w-full">
        {/* Layer Mode Switcher: Pins / Heatmap / Choropleth */}
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur p-1 rounded-xl border border-neutral-200 shadow-sm text-xs font-semibold">
          <button
            onClick={() => setMapMode('pins')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              mapMode === 'pins' 
                ? 'bg-neutral-900 text-white shadow-xs' 
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Pin Beats</span>
          </button>

          <button
            onClick={() => setMapMode('heat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              mapMode === 'heat' 
                ? 'bg-red-600 text-white shadow-xs' 
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Hotspot Heatmap</span>
          </button>

          <button
            onClick={() => setMapMode('choropleth')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              mapMode === 'choropleth' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Ward Choropleth</span>
          </button>

          <div className="h-4 w-px bg-neutral-200 mx-0.5" />

          <button
            onClick={() => setShowUtilityCorridors(!showUtilityCorridors)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              showUtilityCorridors 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
            title="Toggle utility excavation permits & 180-day moratorium corridors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Utility Corridors</span>
            {showUtilityCorridors && (
              <span className="bg-amber-700 text-amber-100 text-[10px] px-1 rounded-full font-mono">
                ON
              </span>
            )}
          </button>
        </div>

        {/* Heatmap Category Filter Bar (Visible in Heat mode) */}
        {mapMode === 'heat' && (
          <div className="flex flex-wrap items-center gap-1 bg-white/95 backdrop-blur p-1.5 rounded-xl border border-neutral-200 shadow-sm text-[11px] font-semibold animate-in fade-in">
            <span className="text-neutral-400 pl-1">Defect:</span>
            <button
              onClick={() => setDefectFilter('ALL')}
              className={`px-2 py-0.5 rounded-md transition ${defectFilter === 'ALL' ? 'bg-neutral-800 text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}
            >
              All Types
            </button>
            <button
              onClick={() => setDefectFilter('pothole')}
              className={`px-2 py-0.5 rounded-md transition ${defectFilter === 'pothole' ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-50'}`}
            >
              🕳️ Potholes
            </button>
            <button
              onClick={() => setDefectFilter('garbage')}
              className={`px-2 py-0.5 rounded-md transition ${defectFilter === 'garbage' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-50'}`}
            >
              🗑️ Garbage
            </button>
            <button
              onClick={() => setDefectFilter('water')}
              className={`px-2 py-0.5 rounded-md transition ${defectFilter === 'water' ? 'bg-sky-600 text-white' : 'text-sky-700 hover:bg-sky-50'}`}
            >
              🚰 Water Bursts
            </button>
            <button
              onClick={() => setDefectFilter('lighting')}
              className={`px-2 py-0.5 rounded-md transition ${defectFilter === 'lighting' ? 'bg-purple-600 text-white' : 'text-purple-700 hover:bg-purple-50'}`}
            >
              💡 Streetlamps
            </button>
          </div>
        )}

        {/* Major ULB City Selector */}
        <div className="flex flex-wrap items-center gap-1 bg-white/90 backdrop-blur px-2 py-1 rounded-xl border border-neutral-200 shadow-xs text-[11px]">
          <span className="text-neutral-400 font-semibold pr-1">Jump ULB:</span>
          {(['CBE', 'CHE', 'BLR', 'DEL', 'MUM', 'HYD'] as const).map(c => (
            <button
              key={c}
              onClick={() => jumpToCity(c)}
              className={`px-2 py-0.5 rounded-md transition ${activeCity === c ? 'bg-neutral-900 text-white font-bold' : 'text-neutral-700 hover:bg-neutral-100'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Top Right: Free Nominatim Search + Map Tile Selector */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {/* Free Address Search */}
        <div className="relative">
          <form onSubmit={handleNominatimSearch} className="flex items-center bg-white/95 backdrop-blur rounded-xl border border-neutral-200 shadow-sm px-2.5 py-1 text-xs">
            <Search className="w-3.5 h-3.5 text-neutral-400 mr-1.5" />
            <input
              type="text"
              placeholder="Search locality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
              className="bg-transparent border-none outline-hidden text-xs w-36 sm:w-44 text-neutral-800 placeholder:text-neutral-400"
            />
            {isSearching && (
              <span className="w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin ml-1"></span>
            )}
          </form>

          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 z-30 max-h-48 overflow-y-auto">
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

        {/* Map Basemap Style Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-1.5 bg-white/95 backdrop-blur px-2.5 py-1.5 rounded-xl border border-neutral-200 shadow-sm text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Tiles</span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 z-30 text-xs">
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

      {/* Dynamic Map Legend based on current mode */}
      <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-2.5 bg-white/95 backdrop-blur px-3 py-2 rounded-xl border border-neutral-200 shadow-sm text-xs">
        {mapMode === 'heat' ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span className="text-neutral-700 font-semibold">Potholes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-neutral-700 font-semibold">Garbage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
              <span className="text-neutral-700 font-semibold">Water Bursts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
              <span className="text-neutral-700 font-semibold">Lighting</span>
            </div>
          </>
        ) : mapMode === 'choropleth' ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
              <span className="text-neutral-700 font-medium">Clear (0 Grievances)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
              <span className="text-neutral-700 font-medium">Moderate (1-2)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-600"></span>
              <span className="text-neutral-700 font-medium">Hotspot Density (3+)</span>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}

        <div className="h-3 w-px bg-neutral-200"></div>
        <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
          <ShieldCheck className="w-3 h-3" />
          <span>Gazette GIS Hotspots</span>
        </div>
      </div>

      {/* Map Zoom Controls */}
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
