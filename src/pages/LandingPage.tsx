import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import { InteractiveMap } from '../components/InteractiveMap';
import { Complaint } from '../types';
import { 
  ArrowRight, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Radio, 
  CheckCircle2, 
  Users, 
  Building2, 
  Sparkles, 
  Search, 
  AlertCircle,
  ThumbsUp,
  Layers,
  ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  onOpenReportModal: () => void;
  onSelectComplaint: (complaint: Complaint) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenReportModal,
  onSelectComplaint
}) => {
  const { complaints, gisWards, gisCoverage } = useCivic();
  const [searchQuery, setSearchQuery] = useState('');

  const activeComplaints = complaints.filter(c => c.status !== 'CLOSED' && c.status !== 'RESOLVED');
  const resolvedComplaints = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED');

  // Filtered preview
  const previewComplaints = complaints.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.title.toLowerCase().includes(q) ||
      c.locationSnapshot.wardName?.toLowerCase().includes(q) ||
      c.complaintId.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-16 py-8">
      {/* Editorial Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Civic Problem Resolution Architecture</span>
              <span className="text-neutral-400">•</span>
              <span className="text-neutral-500">India Municipal Stack</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 leading-[1.12]">
              SEE A PROBLEM.<br />
              <span className="text-neutral-800">REPORT IT.</span> TRACK IT.<br />
              <span className="text-emerald-700">SOLVE IT.</span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-xl font-normal">
              CivicSync bridges citizens and city administrations with authentic GIS point-in-polygon ward resolution, multimodal AI understanding, and transparent 72-hour deterministic SLAs.
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onOpenReportModal}
                className="px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm rounded-xl transition flex items-center gap-2 shadow-sm"
              >
                <span>Report a Civic Problem</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
              <button
                onClick={() => onNavigate('live-relay')}
                className="px-5 py-3.5 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-900 font-semibold text-sm rounded-xl transition flex items-center gap-2"
              >
                <Radio className="w-4 h-4 text-emerald-600" />
                <span>Open Live Relay</span>
              </button>
            </div>

            {/* Platform Guarantees */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200 text-xs">
              <div>
                <strong className="block text-neutral-900 text-sm font-bold">100%</strong>
                <span className="text-neutral-500">Private Identity Guarantee</span>
              </div>
              <div>
                <strong className="block text-neutral-900 text-sm font-bold">72 Hours</strong>
                <span className="text-neutral-500">Mandatory SLA Window</span>
              </div>
              <div>
                <strong className="block text-neutral-900 text-sm font-bold">EPSG:4326</strong>
                <span className="text-neutral-500">Authoritative GIS Wards</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live City Status Box */}
          <div className="lg:col-span-5">
            <div className="p-6 rounded-2xl bg-neutral-900 text-white shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Active City Municipal Grid
                  </span>
                </div>
                <span className="text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                  Coimbatore (CCMC)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-800/80 p-3.5 rounded-xl border border-neutral-700/50">
                  <span className="text-neutral-400 text-xs block">Active Issues</span>
                  <span className="text-2xl font-bold text-white mt-1 block">{activeComplaints.length}</span>
                  <span className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> Under 72h SLA
                  </span>
                </div>
                <div className="bg-neutral-800/80 p-3.5 rounded-xl border border-neutral-700/50">
                  <span className="text-neutral-400 text-xs block">Resolved & Verified</span>
                  <span className="text-2xl font-bold text-white mt-1 block">{resolvedComplaints.length}</span>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Citizen Approved
                  </span>
                </div>
              </div>

              {/* Latest Live Signal */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider block">
                  Latest Resolved Signal
                </span>
                <div className="bg-neutral-800/50 p-3 rounded-xl border border-neutral-700/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-400">#CS-CBE-2024-0072 Closed</span>
                    <span className="text-neutral-400 text-[10px]">Ward 72 Singanallur</span>
                  </div>
                  <p className="text-neutral-300 line-clamp-1">
                    4 LED Streetlights Replaced along Lake Bund Promenade
                  </p>
                  <span className="text-[10px] text-neutral-400 block pt-1">
                    Resolution Time: <strong>44 hours</strong> (SLA Compliance: Met)
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('problems')}
                className="w-full py-2.5 bg-white text-neutral-900 hover:bg-neutral-100 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <span>View Full City Incident Grid</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive GIS Map Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Geospatial Transparency
              </span>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Live Municipal GIS Incident Map
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Verified ward boundaries (EPSG:4326) and real-time civic complaints color-coded by priority.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input 
                type="text"
                placeholder="Filter ward or issue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white text-xs border border-neutral-300 rounded-xl w-60 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            <button
              onClick={() => onNavigate('problems')}
              className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 px-3 py-2 bg-white border border-neutral-200 rounded-xl"
            >
              Expand
            </button>
          </div>
        </div>

        {/* Map Container */}
        <InteractiveMap
          complaints={previewComplaints}
          wards={gisWards}
          onSelectComplaint={onSelectComplaint}
          height="460px"
          showWards={true}
        />
      </section>

      {/* 5-Pillar Architecture Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-neutral-200">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">
            End-to-End Governance
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            How CivicSync Unifies the City Ecosystem
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2">
            Eliminating bureaucratic black holes through role-tailored portals and open accountability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Pillar 1: Citizen */}
          <div 
            onClick={() => onNavigate('citizen')}
            className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-900 transition cursor-pointer group space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-blue-700 transition">
              Citizens
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Report issues with photographic evidence, review AI classification, and verify final resolution on site.
            </p>
            <span className="text-xs font-semibold text-blue-700 flex items-center gap-1 pt-1">
              Open Portal <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Pillar 2: Government */}
          <div 
            onClick={() => onNavigate('government')}
            className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-900 transition cursor-pointer group space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-purple-700 transition">
              Government
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Departments, supervisors, and field engineers manage SLA queues and upload photographic proof of completion.
            </p>
            <span className="text-xs font-semibold text-purple-700 flex items-center gap-1 pt-1">
              Open Portal <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Pillar 3: Community & NGOs */}
          <div 
            onClick={() => onNavigate('community')}
            className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-900 transition cursor-pointer group space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-emerald-700 transition">
              NGOs & Volunteers
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Verified community organizations claim local cleanups and plantations with 24-hour SLA safety fallback.
            </p>
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 pt-1">
              Open Portal <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Pillar 4: Innovation */}
          <div 
            onClick={() => onNavigate('innovation')}
            className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-900 transition cursor-pointer group space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              4
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-amber-700 transition">
              Innovators
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Students and civic-tech developers solve unresolved challenges like IoT sewer sensors and edge AI defect detection.
            </p>
            <span className="text-xs font-semibold text-amber-700 flex items-center gap-1 pt-1">
              Open Portal <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Pillar 5: Administration & GIS */}
          <div 
            onClick={() => onNavigate('admin')}
            className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-900 transition cursor-pointer group space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center font-bold">
              5
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-neutral-700 transition">
              Admin & GIS
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              National Delimitation boundaries, version rollback, officer capacity, and deterministic priority weighting.
            </p>
            <span className="text-xs font-semibold text-neutral-900 flex items-center gap-1 pt-1">
              Open Portal <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
