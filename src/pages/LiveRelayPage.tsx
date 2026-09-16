import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import { Complaint } from '../types';
import { 
  Radio, 
  Search, 
  Filter, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight,
  Layers,
  Sparkles
} from 'lucide-react';

interface LiveRelayPageProps {
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenReportModal: () => void;
}

export const LiveRelayPage: React.FC<LiveRelayPageProps> = ({ onSelectComplaint, onOpenReportModal }) => {
  const { auditEvents, complaints, selectedCountryId } = useCivic();

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Map complaints lookup by ID
  const complaintsMap = new Map<string, Complaint>(complaints.map(c => [c.complaintId, c]));

  const filteredEvents = auditEvents.filter(evt => {
    const complaint = complaintsMap.get(evt.complaintId);
    if (!complaint) return false;

    if (selectedCountryId !== 'ALL' && (complaint.countryId || complaint.locationSnapshot?.countryId || 'IN') !== selectedCountryId) {
      return false;
    }

    if (categoryFilter !== 'ALL' && !complaint.category.toLowerCase().includes(categoryFilter.toLowerCase())) {
      return false;
    }

    if (statusFilter !== 'ALL' && complaint.status !== statusFilter) {
      return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = complaint.title.toLowerCase().includes(q);
      const matchWard = complaint.locationSnapshot.wardName?.toLowerCase().includes(q);
      const matchId = evt.complaintId.toLowerCase().includes(q);
      const matchNotes = evt.notes?.toLowerCase().includes(q);
      if (!matchTitle && !matchWard && !matchId && !matchNotes) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
            <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase">
              CivicSync Live Broadcast Relay
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Live Civic Problem Resolution Stream
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Real-time, immutable public record of civic complaint actions across cities and wards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-xl text-xs text-neutral-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Public Progress. Private Identity.</span>
          </div>
          <button
            onClick={onOpenReportModal}
            className="px-4 py-2 bg-neutral-900 text-white font-semibold text-xs rounded-xl hover:bg-neutral-800 transition"
          >
            + Report Issue
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search ID, ward, or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-lg py-1.5 px-2 text-xs text-neutral-700"
            >
              <option value="ALL">All Categories</option>
              <option value="Road">Roads & Bridges</option>
              <option value="Sanitation">Sanitation & Waste</option>
              <option value="Water">Water & Sewage</option>
              <option value="Electrical">Electrical & Lighting</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-lg py-1.5 px-2 text-xs text-neutral-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="ROUTED">Routed</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Verified & Closed</option>
              <option value="APPEALED">Appealed</option>
            </select>
          </div>
        </div>

        <span className="text-neutral-500 font-mono text-[11px]">
          Showing <strong>{filteredEvents.length}</strong> live transmissions
        </span>
      </div>

      {/* Event Relay Stream */}
      <div className="space-y-3">
        {filteredEvents.map((evt) => {
          const comp = complaintsMap.get(evt.complaintId);
          if (!comp) return null;

          const isResolved = evt.action.includes('RESOLVED') || evt.action.includes('ACCEPTED');
          const isCritical = comp.priorityLevel === 'CRITICAL';

          return (
            <div 
              key={evt.eventId}
              onClick={() => onSelectComplaint(comp)}
              className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-neutral-900 transition cursor-pointer shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isResolved ? 'bg-emerald-50 text-emerald-700' :
                  isCritical ? 'bg-red-50 text-red-700' :
                  'bg-neutral-100 text-neutral-800'
                }`}>
                  {isResolved ? <CheckCircle2 className="w-5 h-5" /> :
                   isCritical ? <AlertTriangle className="w-5 h-5" /> :
                   <Clock className="w-5 h-5" />}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                      #{evt.complaintId}
                    </span>
                    <span className="text-xs font-bold text-neutral-900">
                      {evt.action.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isCritical ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {comp.priorityLevel} ({comp.priorityScore})
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-emerald-700 transition">
                    {comp.title}
                  </h3>

                  <p className="text-xs text-neutral-600 line-clamp-1">
                    {evt.notes}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-500 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      {comp.locationSnapshot.wardName || comp.locationSnapshot.localBodyName}
                    </span>
                    <span>•</span>
                    <span>Dept: <strong>{comp.assignedDepartmentName}</strong></span>
                    <span>•</span>
                    <span>Actor: <strong className="text-neutral-700">{evt.actorName}</strong> ({evt.actorRole})</span>
                  </div>
                </div>
              </div>

              {/* Timestamp & Open CTA */}
              <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100">
                <span className="text-[11px] font-mono text-neutral-400">
                  {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-xs font-semibold text-neutral-900 group-hover:text-emerald-700 flex items-center gap-1 sm:mt-2">
                  <span>View Case</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="py-16 text-center text-neutral-500 bg-neutral-50 rounded-2xl border border-neutral-200 p-6">
            <Radio className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
            <p className="font-semibold text-sm text-neutral-800">Clean Slate — No Transmissions Yet</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              All previous demo events have been cleared. Submit a civic complaint to see live dispatch broadcasts, SLA timers, and verification events appear here!
            </p>
            <button
              onClick={onOpenReportModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition"
            >
              Report a Civic Problem
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
