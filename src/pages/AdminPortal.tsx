import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import { 
  ShieldCheck, 
  MapPin, 
  Layers, 
  RefreshCw, 
  RotateCcw, 
  Trash2, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  Settings, 
  Sliders,
  Sparkles,
  ArrowUpRight,
  Building2,
  Users
} from 'lucide-react';
import { AdminGovernmentManagement } from '../components/AdminGovernmentManagement';

export const AdminPortal: React.FC = () => {
  const { 
    currentUser, 
    gisWards, 
    gisCoverage, 
    rollbackGisVersion, 
    removeAllDemoData,
    complaints,
    communityOpportunities,
    innovationChallenges,
    auditEvents
  } = useCivic();

  const [activeTab, setActiveTab] = useState<'government' | 'gis' | 'demo_data' | 'routing_rules'>('government');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [gisFeedback, setGisFeedback] = useState<string | null>(null);

  // Rollback simulation
  const handleRollback = () => {
    rollbackGisVersion('CCMC-2023-V2');
    setGisFeedback('Successfully rolled back to CCMC-2023-V2 gazetted boundary snapshot. Active complaint GIS snapshots remain immutable.');
    setTimeout(() => setGisFeedback(null), 6000);
  };

  const handleRemoveAll = () => {
    removeAllDemoData();
    setShowClearConfirm(false);
    setGisFeedback('System records cleared across Citizen, Government, Community, and Innovation panels.');
    setTimeout(() => setGisFeedback(null), 6000);
  };

  const demoComplaintsCount = complaints.length;
  const demoOpportunitiesCount = communityOpportunities.length;
  const demoChallengesCount = innovationChallenges.length;
  const demoAuditCount = auditEvents.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xl">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-neutral-900">
                National Platform Administration
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-300">
                System Administrator
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Supervising Gazetted Delimitation Boundaries, Deterministic Priority Matrices, and Department Queues.
            </p>
          </div>
        </div>
      </div>

      {gisFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{gisFeedback}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-200 gap-6 text-sm font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('government')}
          className={`py-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'government' ? 'border-neutral-900 text-neutral-900 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
        >
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>Government Hierarchy & Officials (Sec 8-9)</span>
        </button>

        <button
          onClick={() => setActiveTab('gis')}
          className={`py-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'gis' ? 'border-neutral-900 text-neutral-900 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
        >
          <Layers className="w-4 h-4" />
          <span>GIS Delimitation Wards ({gisWards.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('demo_data')}
          className={`flex items-center gap-2 pb-3 border-b-2 font-semibold text-xs transition ${
            activeTab === 'demo_data' 
              ? 'border-neutral-900 text-neutral-900' 
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Data Storage & Purge</span>
        </button>

        <button
          onClick={() => setActiveTab('routing_rules')}
          className={`py-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'routing_rules' ? 'border-neutral-900 text-neutral-900 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
        >
          <Sliders className="w-4 h-4" />
          <span>Deterministic Priority Matrix</span>
        </button>
      </div>

      {/* Tab: Government Hierarchy & Officials */}
      {activeTab === 'government' && (
        <AdminGovernmentManagement />
      )}

      {/* Tab: GIS Delimitation & Ingestion */}
      {activeTab === 'gis' && (
        <div className="space-y-6">
          {/* City Coverage Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {gisCoverage.map((cov) => (
              <div key={cov.localBodyId} className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded">
                    {cov.status}
                  </span>
                  <span className="text-xs font-mono text-neutral-400">{cov.boundaryVersion}</span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-neutral-900">{cov.cityName}</h3>
                  <p className="text-xs text-neutral-500">{cov.localBodyName}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Gazetted Wards:</span>
                    <strong className="text-neutral-900">{cov.publishedWardsCount} / {cov.totalWardsCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Polygon Coverage:</span>
                    <strong className="text-emerald-700">{cov.coveragePercent}% Active</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Last Delimitation:</span>
                    <span className="text-neutral-600 font-mono text-[11px]">{cov.lastGazetteDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Rollback & Version Safety Control */}
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-neutral-700" />
                  <span>Gazetted Boundary Rollback Protection</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                  If an administrative court stays a delimitation or an invalid GeoJSON topology is uploaded, rollback restores the previous boundary snapshot. Existing complaints retain their original immutable snapshot.
                </p>
              </div>

              <button
                onClick={handleRollback}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2 shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Rollback CCMC to 2023-V2</span>
              </button>
            </div>
          </div>

          {/* Published Ward Polygon Registry Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-900">
                Published Municipal Ward Coordinates (EPSG:4326)
              </h3>
              <span className="text-xs font-mono text-neutral-500">{gisWards.length} Polygon Geometries</span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
                  <tr>
                    <th className="p-3">Ward ID</th>
                    <th className="p-3">Ward Name</th>
                    <th className="p-3">Zone / Local Body</th>
                    <th className="p-3">Population</th>
                    <th className="p-3">Delimitation Gazette</th>
                    <th className="p-3">Geometry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {gisWards.map((w) => (
                    <tr key={w.wardId} className="hover:bg-neutral-50">
                      <td className="p-3 font-mono font-bold text-neutral-700">#{w.wardNumber}</td>
                      <td className="p-3 font-semibold text-neutral-900">{w.wardName}</td>
                      <td className="p-3 text-neutral-600">{w.zoneName || 'Central Zone'} • {w.localBodyName}</td>
                      <td className="p-3 text-neutral-600">{w.population?.toLocaleString() || '45,000'}</td>
                      <td className="p-3 font-mono text-neutral-500">{w.gazettedNotificationNumber}</td>
                      <td className="p-3 text-emerald-700 font-medium">Valid GeoJSON Polygon</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Demo Data Lifecycle Manager */}
      {activeTab === 'demo_data' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-neutral-200 rounded-2xl shadow-xs space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-neutral-900">
                    Simultaneous Multi-Panel Demo Data Controller
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Purge or re-populate realistic representative datasets across all 5 user portals (Citizen, Government, Community, Innovation, Admin) simultaneously.
                  </p>
                </div>
              </div>
            </div>

            {/* Panel Synchronized Status Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-xs text-neutral-500 font-semibold block">Citizen & Govt</span>
                <span className="text-2xl font-black text-neutral-900 mt-1 block">
                  {demoComplaintsCount}
                </span>
                <span className="text-[11px] text-neutral-400">Complaints & SLAs</span>
              </div>

              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-xs text-neutral-500 font-semibold block">Community Portal</span>
                <span className="text-2xl font-black text-neutral-900 mt-1 block">
                  {demoOpportunitiesCount}
                </span>
                <span className="text-[11px] text-neutral-400">Action Opportunities</span>
              </div>

              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-xs text-neutral-500 font-semibold block">Innovation Hub</span>
                <span className="text-2xl font-black text-neutral-900 mt-1 block">
                  {demoChallengesCount}
                </span>
                <span className="text-[11px] text-neutral-400">University Challenges</span>
              </div>

              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-xs text-neutral-500 font-semibold block">Audit Logs</span>
                <span className="text-2xl font-black text-neutral-900 mt-1 block">
                  {demoAuditCount}
                </span>
                <span className="text-[11px] text-neutral-400">Ledger Events</span>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Card 1: Remove All Demo Data */}
              <div className="p-5 rounded-2xl border border-red-200 bg-red-50/30 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>Option 1: Remove All Demo Data</span>
                  </div>
                  <p className="text-xs text-red-900/70 leading-relaxed">
                    Instantly purges all complaints, community drives, university challenges, and audit events from all panels simultaneously, leaving a completely clean production state. Demo login accounts are safely retained.
                  </p>
                </div>

                <div>
                  {!showClearConfirm ? (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2 shadow-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove All Data Across Panels</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-red-300 space-y-2">
                      <p className="text-xs text-red-700 font-bold">
                        Are you sure you want to wipe all panels simultaneously?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleRemoveAll}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition"
                        >
                          Yes, Remove All
                        </button>
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-xs rounded-lg transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Schema Corruption:</strong> Wiping or re-seeding demo data strictly operates in isolated client state and localStorage. Core GIS gazetted ward boundaries, user authentication tokens, and deterministic priority algorithms remain 100% untouched.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Deterministic Priority Matrix */}
      {activeTab === 'routing_rules' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-neutral-200 rounded-2xl shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-neutral-700" />
                <span>Deterministic Priority Weighting Standard (0–100)</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-2xl leading-relaxed">
                CivicSync calculates severity scores deterministically using mathematically grounded formula: Priority = (Severity × 30%) + (SafetyRisk × 25%) + (Urgency × 20%) + (Population × 15%) + (Environment × 10%) + CriticalZoneBonus.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-red-200 bg-red-50/40">
                <span className="font-bold text-red-700 block">Critical Priority</span>
                <strong className="text-2xl font-bold text-neutral-900 block mt-1">76 – 100</strong>
                <p className="text-neutral-500 mt-1">Direct life hazard, collapsed road, major contaminated main. SLA: 24h.</p>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
                <span className="font-bold text-amber-700 block">High Priority</span>
                <strong className="text-2xl font-bold text-neutral-900 block mt-1">51 – 75</strong>
                <p className="text-neutral-500 mt-1">Significant traffic blockage, broken signal, commercial garbage spill. SLA: 48h.</p>
              </div>

              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
                <span className="font-bold text-blue-700 block">Medium Priority</span>
                <strong className="text-2xl font-bold text-neutral-900 block mt-1">26 – 50</strong>
                <p className="text-neutral-500 mt-1">Pothole on residential lane, dimmed streetlight. SLA: 72h.</p>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
                <span className="font-bold text-neutral-700 block">Low Priority</span>
                <strong className="text-2xl font-bold text-neutral-900 block mt-1">0 – 25</strong>
                <p className="text-neutral-500 mt-1">Faded road markings, bench paint peeling, routine maintenance. SLA: 120h.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
