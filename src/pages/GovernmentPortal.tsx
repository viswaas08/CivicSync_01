import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import { Complaint, UserRole } from '../types';
import { checkSLAStatus } from '../services/slaEngine';
import { 
  Building2, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  Users, 
  ArrowUpRight, 
  Filter, 
  Search,
  CheckCircle,
  FileCheck,
  Send
} from 'lucide-react';

interface GovernmentPortalProps {
  onSelectComplaint: (complaint: Complaint) => void;
}

export const GovernmentPortal: React.FC<GovernmentPortalProps> = ({ onSelectComplaint }) => {
  const { currentUser, isProductionMode, switchRole, complaints, updateComplaintStatus } = useCivic();

  const [slaFilter, setSlaFilter] = useState<'ALL' | 'BREACHED' | 'URGENT' | 'IN_PROGRESS'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Role Switcher helper (Active only in Demo Mode)
  const handleSwitchGovRole = (role: UserRole) => {
    if (!isProductionMode) {
      switchRole(role);
    }
  };

  const isAuthorizedOfficial = ['government_official', 'supervisor', 'department_head', 'district_authority', 'state_authority', 'admin'].includes(currentUser.role) && currentUser.uid !== 'guest-cit-001';

  if (isProductionMode && !isAuthorizedOfficial) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white border border-neutral-200 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center mx-auto">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Official Municipal Portal Access Restricted</h2>
        <p className="text-sm text-neutral-600 max-w-md mx-auto">
          This portal is reserved strictly for gazetted municipal field engineers, zonal supervisors, and department heads. Please sign in with your verified official credentials to access municipal SLA queues and work orders.
        </p>
      </div>
    );
  }

  const filteredComplaints = complaints.filter(c => {
    const sla = checkSLAStatus(c.sla);

    if (slaFilter === 'BREACHED' && !sla.isBreached) return false;
    if (slaFilter === 'URGENT' && (!sla.isApproaching || sla.isBreached)) return false;
    if (slaFilter === 'IN_PROGRESS' && c.status !== 'IN_PROGRESS' && c.status !== 'UNDER_INSPECTION') return false;

    if (departmentFilter !== 'ALL' && c.assignedDepartmentId !== departmentFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.title.toLowerCase().includes(q) && !c.complaintId.toLowerCase().includes(q) && !c.locationSnapshot.wardName?.toLowerCase().includes(q)) {
        return false;
      }
    }

    return true;
  });

  const breachedCount = complaints.filter(c => checkSLAStatus(c.sla).isBreached).length;
  const approachingCount = complaints.filter(c => checkSLAStatus(c.sla).isApproaching).length;
  const inProgressCount = complaints.filter(c => c.status === 'IN_PROGRESS' || c.status === 'UNDER_INSPECTION').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Government Role Header & Quick Switcher */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-900 text-white flex items-center justify-center font-bold text-xl">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-neutral-900">{currentUser.displayName}</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                {currentUser.designation || currentUser.role}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              {currentUser.department || 'Roads & Infrastructure'} • Municipal Jurisdiction: {currentUser.assignedWardId || 'CCMC Zone 2 (Wards 11-30)'}
            </p>
            <span className="inline-block text-[11px] text-neutral-400 mt-1">
              Active Official Capacity: <strong>4 / 15 Cases Assigned</strong> (OR-Tools Workload: Balanced)
            </span>
          </div>
        </div>

        {/* Role Testing Persona Switcher - Only visible in Demo Mode */}
        {!isProductionMode && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs">
            <span className="text-neutral-500 font-semibold uppercase tracking-wider text-[11px]">
              Simulate Persona:
            </span>
            <div className="bg-neutral-100 p-1 rounded-xl flex items-center gap-1">
              <button
                onClick={() => handleSwitchGovRole('government_official')}
                className={`px-2.5 py-1 rounded-lg transition ${currentUser.role === 'government_official' ? 'bg-white shadow-xs font-bold text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                Field Officer (AE)
              </button>
              <button
                onClick={() => handleSwitchGovRole('supervisor')}
                className={`px-2.5 py-1 rounded-lg transition ${currentUser.role === 'supervisor' ? 'bg-white shadow-xs font-bold text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                Zonal Supervisor
              </button>
              <button
                onClick={() => handleSwitchGovRole('department_head')}
                className={`px-2.5 py-1 rounded-lg transition ${currentUser.role === 'department_head' ? 'bg-white shadow-xs font-bold text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                Dept Head (EE)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SLA Triage Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setSlaFilter('ALL')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${slaFilter === 'ALL' ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 bg-white hover:border-neutral-400'}`}
        >
          <span className={`text-xs ${slaFilter === 'ALL' ? 'text-neutral-300' : 'text-neutral-500'}`}>Total Department Queue</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold">{complaints.length}</span>
            <span className="text-xs font-mono">Complaints</span>
          </div>
        </div>

        <div 
          onClick={() => setSlaFilter('BREACHED')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${slaFilter === 'BREACHED' ? 'border-red-600 bg-red-600 text-white' : 'border-red-200 bg-red-50/50 hover:border-red-400'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs ${slaFilter === 'BREACHED' ? 'text-white' : 'text-red-700 font-semibold'}`}>SLA Breached</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${slaFilter === 'BREACHED' ? 'text-white' : 'text-red-600'}`} />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-2xl font-extrabold ${slaFilter === 'BREACHED' ? 'text-white' : 'text-red-700'}`}>{breachedCount}</span>
            <span className={`text-xs ${slaFilter === 'BREACHED' ? 'text-red-100' : 'text-red-600'}`}>Requires Escalation</span>
          </div>
        </div>

        <div 
          onClick={() => setSlaFilter('URGENT')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${slaFilter === 'URGENT' ? 'border-amber-600 bg-amber-600 text-white' : 'border-amber-200 bg-amber-50/50 hover:border-amber-400'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs ${slaFilter === 'URGENT' ? 'text-white' : 'text-amber-700 font-semibold'}`}>Due in &lt; 24h</span>
            <Clock className={`w-3.5 h-3.5 ${slaFilter === 'URGENT' ? 'text-white' : 'text-amber-600'}`} />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-2xl font-extrabold ${slaFilter === 'URGENT' ? 'text-white' : 'text-amber-700'}`}>{approachingCount}</span>
            <span className={`text-xs ${slaFilter === 'URGENT' ? 'text-amber-100' : 'text-amber-600'}`}>Triage Priority</span>
          </div>
        </div>

        <div 
          onClick={() => setSlaFilter('IN_PROGRESS')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${slaFilter === 'IN_PROGRESS' ? 'border-blue-600 bg-blue-600 text-white' : 'border-blue-200 bg-blue-50/50 hover:border-blue-400'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs ${slaFilter === 'IN_PROGRESS' ? 'text-white' : 'text-blue-700 font-semibold'}`}>In Progress / Works</span>
            <UserCheck className={`w-3.5 h-3.5 ${slaFilter === 'IN_PROGRESS' ? 'text-white' : 'text-blue-600'}`} />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-2xl font-extrabold ${slaFilter === 'IN_PROGRESS' ? 'text-white' : 'text-blue-700'}`}>{inProgressCount}</span>
            <span className={`text-xs ${slaFilter === 'IN_PROGRESS' ? 'text-blue-100' : 'text-blue-600'}`}>Field Crews Deployed</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search reference ID, ward, or problem type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-700"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 font-medium">Filter Dept:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-lg py-1.5 px-2 text-xs text-neutral-700"
            >
              <option value="ALL">All Departments</option>
              <option value="DEPT-ROADS">Roads & Infrastructure</option>
              <option value="DEPT-SANITATION">Solid Waste & Sanitation</option>
              <option value="DEPT-WATER-SEWAGE">Water Supply & Drainage</option>
              <option value="DEPT-ELECTRICAL">Electrical & Lighting</option>
            </select>
          </div>
        </div>

        <span className="text-neutral-500 font-mono text-[11px]">
          Showing <strong>{filteredComplaints.length}</strong> municipal cases
        </span>
      </div>

      {/* Case Management List */}
      <div className="space-y-3">
        {filteredComplaints.map((c) => {
          const slaInfo = checkSLAStatus(c.sla);

          return (
            <div
              key={c.complaintId}
              onClick={() => onSelectComplaint(c)}
              className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-purple-600 transition cursor-pointer shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                    #{c.complaintId}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    c.priorityLevel === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                    c.priorityLevel === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {c.priorityLevel} ({c.priorityScore})
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-900 text-white">
                    {c.status}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${slaInfo.badgeColor}`}>
                    {slaInfo.statusLabel} ({slaInfo.remainingHours}h remaining)
                  </span>
                </div>

                <h3 className="text-base font-bold text-neutral-900 group-hover:text-purple-700 transition">
                  {c.title}
                </h3>

                <p className="text-xs text-neutral-600 line-clamp-1 max-w-2xl">
                  {c.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 pt-1">
                  <span>Ward: <strong className="text-neutral-800">{c.locationSnapshot.wardName || 'Ward 12'}</strong></span>
                  <span>•</span>
                  <span>Assigned Officer: <strong className="text-neutral-800">{c.assignedOfficialName || 'Field Queue'}</strong></span>
                  <span>•</span>
                  <span>Citizen Reporter: <strong className="text-neutral-700">{c.citizenName}</strong> ({c.citizenPhoneMasked})</span>
                </div>
              </div>

              {/* Action Buttons for Official */}
              <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap border-t lg:border-t-0 pt-2 lg:pt-0 border-neutral-100">
                {c.status === 'ROUTED' || c.status === 'ASSIGNED' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateComplaintStatus(c.complaintId, 'IN_PROGRESS', 'Field officer commenced repair work.');
                    }}
                    className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition"
                  >
                    Start Works
                  </button>
                ) : null}

                {c.status === 'IN_PROGRESS' || c.status === 'UNDER_INSPECTION' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectComplaint(c);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition"
                  >
                    Submit Proof & Resolve
                  </button>
                ) : null}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectComplaint(c);
                  }}
                  className="px-3 py-1.5 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-xl transition flex items-center gap-1"
                >
                  <span>Open Dossier</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredComplaints.length === 0 && (
          <div className="py-16 text-center text-neutral-500 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
            <p className="font-bold text-sm text-neutral-800">All filtered complaints cleared</p>
            <p className="mt-0.5">No pending cases match the active SLA or department filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
