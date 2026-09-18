import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import { Complaint } from '../types';
import { InteractiveMap } from '../components/InteractiveMap';
import { checkSLAStatus } from '../services/slaEngine';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ThumbsUp, 
  Sparkles, 
  Building2, 
  Layers,
  ArrowUpRight,
  PlusCircle
} from 'lucide-react';

import { HierarchicalJurisdictionFilter, JurisdictionFilterValue } from '../components/HierarchicalJurisdictionFilter';

interface ProblemExplorerPageProps {
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenReportModal: () => void;
}

export const ProblemExplorerPage: React.FC<ProblemExplorerPageProps> = ({
  onSelectComplaint,
  onOpenReportModal
}) => {
  const { complaints, gisWards, selectedCountryId } = useCivic();

  const [jurisdictionFilter, setJurisdictionFilter] = useState<JurisdictionFilterValue>({
    stateId: 'ALL',
    ulbId: 'ALL',
    wardNumber: 'ALL'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const filteredComplaints = complaints.filter(c => {
    if (selectedCountryId !== 'ALL' && (c.countryId || c.locationSnapshot?.countryId || 'IN') !== selectedCountryId) return false;

    // Hierarchical Jurisdiction Filtering
    const snap = c.locationSnapshot;
    if (jurisdictionFilter.stateId !== 'ALL' && snap?.stateId !== jurisdictionFilter.stateId) {
      return false;
    }
    if (jurisdictionFilter.ulbId !== 'ALL' && snap?.localBodyId !== jurisdictionFilter.ulbId) {
      return false;
    }
    if (jurisdictionFilter.wardNumber !== 'ALL' && snap?.wardNumber !== jurisdictionFilter.wardNumber) {
      return false;
    }

    if (departmentFilter !== 'ALL' && c.assignedDepartmentId !== departmentFilter) return false;
    if (priorityFilter !== 'ALL' && c.priorityLevel !== priorityFilter) return false;
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchWard = c.locationSnapshot?.wardName?.toLowerCase().includes(q);
      const matchId = c.complaintId.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      if (!matchTitle && !matchWard && !matchId && !matchDesc) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="text-xs font-bold text-emerald-700 tracking-wider uppercase">
            Public Incident Repository
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            City Civic Problem Explorer
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Search, filter, and corroborate civic issues tracked across municipal wards with deterministic SLAs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-neutral-100 p-1 rounded-xl flex items-center text-xs font-medium text-neutral-600">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'hover:text-neutral-900'}`}
            >
              Card Grid
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg transition ${viewMode === 'map' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'hover:text-neutral-900'}`}
            >
              GIS Map View
            </button>
          </div>

          <button
            onClick={onOpenReportModal}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl transition"
          >
            + Report Problem
          </button>
        </div>
      </div>

      {/* Hierarchical Cascading State, City & Ward Filter with Live Badges */}
      <HierarchicalJurisdictionFilter 
        value={jurisdictionFilter}
        onChange={setJurisdictionFilter}
        complaints={complaints}
      />

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search problem, ward, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          {/* Department */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2 px-3 text-xs text-neutral-700"
          >
            <option value="ALL">All Departments</option>
            <option value="DEPT-ROADS">Roads & Infrastructure</option>
            <option value="DEPT-SANITATION">Solid Waste & Sanitation</option>
            <option value="DEPT-WATER-SEWAGE">Water Supply & Drainage</option>
            <option value="DEPT-ELECTRICAL">Electrical & Lighting</option>
            <option value="DEPT-PUBLIC-HEALTH">Public Health & Vector Control</option>
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2 px-3 text-xs text-neutral-700"
          >
            <option value="ALL">All Priority Levels</option>
            <option value="CRITICAL">Critical Priority (76-100)</option>
            <option value="HIGH">High Priority (51-75)</option>
            <option value="MEDIUM">Medium Priority (26-50)</option>
            <option value="LOW">Low Priority (0-25)</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2 px-3 text-xs text-neutral-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="ROUTED">Routed</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="UNDER_INSPECTION">Under Inspection</option>
            <option value="RESOLVED">Resolved (Pending Citizen Verification)</option>
            <option value="CLOSED">Verified & Closed</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500 pt-1 border-t border-neutral-100">
          <span>Active Filter: <strong>{filteredComplaints.length}</strong> complaints matched</span>
          <button
            onClick={() => {
              setSearchQuery('');
              setDepartmentFilter('ALL');
              setPriorityFilter('ALL');
              setStatusFilter('ALL');
            }}
            className="text-neutral-500 hover:text-neutral-900 underline"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Main Content: Map or Grid */}
      {viewMode === 'map' ? (
        <div className="space-y-3">
          <InteractiveMap
            complaints={filteredComplaints}
            wards={gisWards}
            onSelectComplaint={onSelectComplaint}
            height="560px"
            showWards={true}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredComplaints.map((c) => {
            const slaInfo = checkSLAStatus(c.sla);
            const isResolved = c.status === 'RESOLVED' || c.status === 'CLOSED';

            return (
              <div 
                key={c.complaintId}
                onClick={() => onSelectComplaint(c)}
                className="rounded-2xl border border-neutral-200 bg-white hover:border-neutral-900 transition cursor-pointer shadow-xs flex flex-col justify-between overflow-hidden group"
              >
                {/* Image Header if evidence available */}
                {c.evidence && c.evidence.length > 0 && (
                  <div className="relative h-44 w-full bg-neutral-100 overflow-hidden">
                    <img 
                      src={c.evidence[0].url} 
                      alt={c.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${
                        c.priorityLevel === 'CRITICAL' ? 'bg-red-500 text-white border-red-600' :
                        c.priorityLevel === 'HIGH' ? 'bg-amber-500 text-white border-amber-600' :
                        'bg-blue-600 text-white border-blue-700'
                      }`}>
                        {c.priorityLevel} ({c.priorityScore})
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-semibold bg-neutral-900/80 backdrop-blur text-white px-2 py-0.5 rounded-full">
                        {c.status}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-3 right-3 bg-black/60 backdrop-blur text-white px-2.5 py-1 rounded-lg text-[10px] flex items-center justify-between">
                      <span className="truncate">{c.locationSnapshot.wardName || c.locationSnapshot.localBodyName}</span>
                      <span className="font-mono">#{c.complaintId}</span>
                    </div>
                  </div>
                )}

                {/* Card Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 group-hover:text-emerald-700 transition line-clamp-2 leading-snug">
                      {c.title}
                    </h3>
                    <p className="text-xs text-neutral-500 line-clamp-2 mt-1.5 leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-neutral-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Dept:</span>
                      <span className="font-medium text-neutral-900 truncate max-w-[180px]">
                        {c.assignedDepartmentName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">SLA Status:</span>
                      <span className={`font-semibold text-[11px] px-2 py-0.5 rounded border ${slaInfo.badgeColor}`}>
                        {slaInfo.statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* Footer Card Row */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-neutral-500">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                      <strong>{c.supportersCount}</strong> supporters
                    </span>

                    <span className="text-xs font-semibold text-neutral-900 group-hover:text-emerald-700 flex items-center gap-1">
                      <span>Inspect</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredComplaints.length === 0 && (
        <div className="py-16 text-center text-neutral-500 bg-neutral-50 rounded-2xl border border-neutral-200 p-6 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="font-bold text-base text-neutral-800">Clean Slate — No Active Grievances</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            All previous demo complaints have been removed. Report the first civic issue in your ward to trigger automated AI classification and statutory SLA tracking!
          </p>
          <button
            onClick={onOpenReportModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Report First Civic Problem</span>
          </button>
        </div>
      )}
    </div>
  );
};
