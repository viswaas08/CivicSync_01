import React, { useMemo } from 'react';
import { 
  getAllIndianStates, 
  getIndianStateById, 
  getUlbsByState, 
  getUlbById, 
  UrbanLocalBodyInfo 
} from '../services/nationwideGisRegistry';
import { Complaint } from '../types';
import { 
  MapPin, 
  Building2, 
  Layers, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  FileText, 
  ChevronRight, 
  Users 
} from 'lucide-react';

export interface JurisdictionFilterValue {
  stateId: string; // 'ALL' or State ID (e.g. 'TN', 'KA', 'MH', 'DL')
  ulbId: string;   // 'ALL' or ULB ID (e.g. 'GCC', 'CCMC', 'BBMP', 'BMC', 'MCD')
  wardNumber: string; // 'ALL' or Ward Number (e.g. '12', '114', '151')
}

interface HierarchicalJurisdictionFilterProps {
  value: JurisdictionFilterValue;
  onChange: (newValue: JurisdictionFilterValue) => void;
  complaints: Complaint[];
  compact?: boolean;
}

export const HierarchicalJurisdictionFilter: React.FC<HierarchicalJurisdictionFilterProps> = ({
  value,
  onChange,
  complaints,
  compact = false
}) => {
  const allStates = useMemo(() => getAllIndianStates(), []);

  const availableUlbs = useMemo(() => {
    if (value.stateId === 'ALL') {
      // Gather all ULBs across all states
      const list: UrbanLocalBodyInfo[] = [];
      allStates.forEach(s => list.push(...s.ulbs));
      return list;
    }
    return getUlbsByState(value.stateId);
  }, [value.stateId, allStates]);

  const selectedUlb = useMemo(() => {
    if (value.ulbId === 'ALL') return undefined;
    return getUlbById(value.ulbId);
  }, [value.ulbId]);

  const availableWards = useMemo(() => {
    if (!selectedUlb) return [];
    return selectedUlb.wards || [];
  }, [selectedUlb]);

  // Dynamic calculations for instant badges
  const scopedComplaints = useMemo(() => {
    return complaints.filter(c => {
      const snap = c.locationSnapshot;
      if (value.stateId !== 'ALL' && snap?.stateId !== value.stateId) return false;
      if (value.ulbId !== 'ALL' && snap?.localBodyId !== value.ulbId) return false;
      if (value.wardNumber !== 'ALL' && snap?.wardNumber !== value.wardNumber) return false;
      return true;
    });
  }, [complaints, value]);

  const activeComplaintsCount = useMemo(() => {
    return scopedComplaints.filter(c => c.status !== 'CLOSED' && c.status !== 'RESOLVED').length;
  }, [scopedComplaints]);

  const avgResolutionHours = useMemo(() => {
    if (scopedComplaints.length === 0) return 48;
    const total = scopedComplaints.reduce((acc, c) => {
      const p = c.priorityLevel;
      return acc + (p === 'CRITICAL' ? 24 : p === 'HIGH' ? 48 : 72);
    }, 0);
    return Math.round(total / scopedComplaints.length);
  }, [scopedComplaints]);

  const escalationCounts = useMemo(() => {
    let jeCount = 0;
    let zonalCount = 0;
    let commissionerCount = 0;

    scopedComplaints.forEach(c => {
      const lvl = c.sla?.currentEscalationLevel;
      if (lvl === 'OFFICER') jeCount++;
      else if (lvl === 'SUPERVISOR' || lvl === 'DEPARTMENT_HEAD') zonalCount++;
      else if (lvl === 'DISTRICT_AUTHORITY' || lvl === 'STATE_AUTHORITY') commissionerCount++;
    });

    return { jeCount, zonalCount, commissionerCount };
  }, [scopedComplaints]);

  const handleStateChange = (newStateId: string) => {
    onChange({
      stateId: newStateId,
      ulbId: 'ALL',
      wardNumber: 'ALL'
    });
  };

  const handleUlbChange = (newUlbId: string) => {
    // If state was ALL and user picked a ULB, also auto-set its state
    let targetStateId = value.stateId;
    if (newUlbId !== 'ALL') {
      const ulb = getUlbById(newUlbId);
      if (ulb) targetStateId = ulb.stateId;
    }
    onChange({
      stateId: targetStateId,
      ulbId: newUlbId,
      wardNumber: 'ALL'
    });
  };

  const handleWardChange = (newWardNumber: string) => {
    onChange({
      ...value,
      wardNumber: newWardNumber
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-4 space-y-3.5">
      {/* Cascading Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-neutral-800 uppercase tracking-wider">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>Gazette Jurisdiction Hierarchy:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 max-w-2xl">
          {/* Level 1: State / UT */}
          <div className="relative">
            <select
              value={value.stateId}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold text-neutral-800 transition focus:ring-1 focus:ring-neutral-900 focus:outline-none"
            >
              <option value="ALL">🇮🇳 All 28 States & 8 UTs</option>
              <optgroup label="States (28)">
                {allStates.filter(s => !s.isUnionTerritory).map(s => (
                  <option key={s.stateId} value={s.stateId}>
                    {s.stateName} ({s.ulbs.length} Major ULBs)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Union Territories (8)">
                {allStates.filter(s => s.isUnionTerritory).map(s => (
                  <option key={s.stateId} value={s.stateId}>
                    {s.stateName} (UT)
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Level 2: Municipal Corporation / ULB */}
          <div className="relative">
            <select
              value={value.ulbId}
              onChange={(e) => handleUlbChange(e.target.value)}
              className="w-full bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold text-neutral-800 transition focus:ring-1 focus:ring-neutral-900 focus:outline-none"
            >
              <option value="ALL">🏛️ All Urban Local Bodies</option>
              {availableUlbs.map(u => (
                <option key={u.ulbId} value={u.ulbId}>
                  {u.ulbName} ({u.officialWardCount} Wards)
                </option>
              ))}
            </select>
          </div>

          {/* Level 3: Ward */}
          <div className="relative">
            <select
              value={value.wardNumber}
              onChange={(e) => handleWardChange(e.target.value)}
              disabled={value.ulbId === 'ALL'}
              className={`w-full border rounded-xl py-2 px-3 text-xs font-semibold transition focus:ring-1 focus:ring-neutral-900 focus:outline-none ${
                value.ulbId === 'ALL'
                  ? 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed'
                  : 'bg-neutral-50 hover:bg-neutral-100/80 border-neutral-200 text-neutral-800'
              }`}
            >
              <option value="ALL">
                {value.ulbId === 'ALL' ? 'Select ULB to view Wards' : `📍 All Wards (${selectedUlb?.officialWardCount || availableWards.length})`}
              </option>
              {availableWards.map(w => (
                <option key={w.wardNumber} value={w.wardNumber}>
                  Ward {w.wardNumber} - {w.wardName} {w.zoneName ? `(${w.zoneName})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Instant Dynamic Count Badges & Hierarchy Strip */}
      <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Metric Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Complaints Badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            Active Grievances: <strong>{activeComplaintsCount}</strong>
          </span>

          {/* SLA Resolution Time Badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[11px]">
            <Clock className="w-3 h-3 text-blue-600" />
            Avg SLA Resolution: <strong>{avgResolutionHours}h</strong>
          </span>

          {/* Current Escalation Matrix Badges */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-semibold text-[11px]" title="Complaints assigned to Junior Engineer / Field AE">
            <Users className="w-3 h-3 text-purple-600" />
            JE Beat: <strong>{escalationCounts.jeCount}</strong>
          </span>

          {escalationCounts.zonalCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]" title="Complaints escalated to Zonal Commissioner">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              Zonal Esc.: <strong>{escalationCounts.zonalCount}</strong>
            </span>
          )}

          {escalationCounts.commissionerCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-800 border border-red-200 font-semibold text-[11px]" title="Critical complaints escalated to Municipal Commissioner">
              <ShieldAlert className="w-3 h-3 text-red-600" />
              Comm. Esc.: <strong>{escalationCounts.commissionerCount}</strong>
            </span>
          )}
        </div>

        {/* Gazette Delimitation & Escalation Info */}
        {selectedUlb && (
          <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
            <span className="inline-flex items-center gap-1 bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">
              <FileText className="w-3 h-3 text-neutral-500" />
              Gazette: {selectedUlb.boundaryVersionId} ({selectedUlb.delimitationGazetteDate})
            </span>
            <span className="hidden lg:inline text-neutral-400">
              Ref: {selectedUlb.gazetteNotificationRef}
            </span>
          </div>
        )}
      </div>

      {/* Escalation Hierarchy Line if ULB selected */}
      {selectedUlb && !compact && (
        <div className="bg-neutral-50 rounded-xl p-2.5 border border-neutral-200/80 text-[11px] text-neutral-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-700">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
            <span>Nodal Officer Escalation Hierarchy:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-neutral-800 font-medium">
            <span className="bg-white px-2 py-0.5 rounded border border-neutral-200">{selectedUlb.escalationHierarchy.tier1}</span>
            <ChevronRight className="w-3 h-3 text-neutral-400" />
            <span className="bg-white px-2 py-0.5 rounded border border-neutral-200">{selectedUlb.escalationHierarchy.tier2}</span>
            <ChevronRight className="w-3 h-3 text-neutral-400" />
            <span className="bg-white px-2 py-0.5 rounded border border-neutral-200 font-semibold text-emerald-800">{selectedUlb.escalationHierarchy.tier3}</span>
          </div>
        </div>
      )}
    </div>
  );
};
