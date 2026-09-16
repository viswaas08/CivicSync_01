import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  ChevronDown,
  Building,
  UserCheck,
  UserX,
  MapPin,
  Briefcase,
  Layers,
  History,
  Clock,
  Edit,
  X
} from 'lucide-react';
import { GovernmentOfficial, Department } from '../types';
import { INITIAL_DEPARTMENTS, INITIAL_OFFICIALS } from '../services/routingEngine';
import { COUNTRY_DEPARTMENTS, COUNTRY_OFFICIALS } from '../services/countryConfig';

export const AdminGovernmentManagement: React.FC = () => {
  const [officials, setOfficials] = useState<GovernmentOfficial[]>(() => {
    return [
      ...INITIAL_OFFICIALS,
      ...(COUNTRY_OFFICIALS.US || []),
      ...(COUNTRY_OFFICIALS.GB || [])
    ];
  });
  const [departments] = useState<Department[]>(() => {
    return [
      ...INITIAL_DEPARTMENTS,
      ...(COUNTRY_DEPARTMENTS.US || []),
      ...(COUNTRY_DEPARTMENTS.GB || [])
    ];
  });
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [subTab, setSubTab] = useState<'officials' | 'hierarchy' | 'supervisors' | 'audit'>('officials');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOfficial, setEditingOfficial] = useState<GovernmentOfficial | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // New official form state
  const [formData, setFormData] = useState({
    employeeId: `CCMC-ENG-2026-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    officialEmail: '',
    phone: '+91 ',
    designation: 'Assistant Engineer (Infrastructure)',
    role: 'government_official' as 'government_official' | 'supervisor' | 'department_head',
    organizationId: 'ORG-CCMC',
    departmentId: 'DEPT-ROADS',
    supervisorId: 'SUP-EAST-ZONE',
    jurisdictionState: 'TN',
    jurisdictionDistrict: 'CBE',
    jurisdictionLocalBody: 'CCMC',
    jurisdictionWards: '12, 13',
    specializations: 'Pothole Patching, Road Resurfacing',
    employmentStatus: 'ACTIVE' as 'ACTIVE' | 'ON_LEAVE' | 'TRANSFERRED',
    availability: 'AVAILABLE' as 'AVAILABLE' | 'BUSY' | 'OFF_DUTY',
    maxActiveCases: 15
  });

  const notify = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleCreateOfficial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.officialEmail) return;

    const selectedDept = departments.find(d => d.departmentId === formData.departmentId);
    const wardList = formData.jurisdictionWards.split(',').map(w => w.trim()).filter(Boolean);

    const newOfficial: GovernmentOfficial = {
      officialId: `OFF-${Math.floor(100 + Math.random() * 900)}-${formData.departmentId.replace('DEPT-', '')}`,
      firebaseUid: `gov-uid-${Date.now()}`,
      employeeId: formData.employeeId,
      name: formData.name,
      officialEmail: formData.officialEmail,
      phone: formData.phone,
      designation: formData.designation,
      role: formData.role,
      organizationId: formData.organizationId,
      departmentId: formData.departmentId,
      departmentName: selectedDept?.name || 'Municipal Works',
      supervisorId: formData.supervisorId,
      jurisdiction: {
        stateId: formData.jurisdictionState,
        districtId: formData.jurisdictionDistrict,
        localBodyId: formData.jurisdictionLocalBody,
        wardNumbers: wardList.length > 0 ? wardList : ['12']
      },
      specializations: formData.specializations.split(',').map(s => s.trim()).filter(Boolean),
      employmentStatus: formData.employmentStatus,
      verificationStatus: 'VERIFIED',
      availability: formData.availability,
      currentActiveCases: 0,
      maxActiveCases: Number(formData.maxActiveCases) || 15,
      slaAdherenceScore: 100
    };

    setOfficials(prev => [newOfficial, ...prev]);
    setIsAddModalOpen(false);
    notify(`Official ${newOfficial.name} (${newOfficial.employeeId}) successfully provisioned and assigned to ${newOfficial.departmentName}.`);

    // Reset
    setFormData({
      employeeId: `CCMC-ENG-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      officialEmail: '',
      phone: '+91 ',
      designation: 'Assistant Engineer (Infrastructure)',
      role: 'government_official',
      organizationId: 'ORG-CCMC',
      departmentId: 'DEPT-ROADS',
      supervisorId: 'SUP-EAST-ZONE',
      jurisdictionState: 'TN',
      jurisdictionDistrict: 'CBE',
      jurisdictionLocalBody: 'CCMC',
      jurisdictionWards: '12, 13',
      specializations: 'Pothole Patching, Road Resurfacing',
      employmentStatus: 'ACTIVE',
      availability: 'AVAILABLE',
      maxActiveCases: 15
    });
  };

  const handleToggleSuspend = (officialId: string) => {
    setOfficials(prev => prev.map(o => {
      if (o.officialId === officialId) {
        const isCurrentlyActive = o.employmentStatus === 'ACTIVE';
        const newStatus = isCurrentlyActive ? 'ON_LEAVE' : 'ACTIVE';
        const newAvail = isCurrentlyActive ? 'OFF_DUTY' : 'AVAILABLE';
        notify(`Officer ${o.name} status updated to: ${newStatus}`);
        return {
          ...o,
          employmentStatus: newStatus,
          availability: newAvail
        };
      }
      return o;
    }));
  };

  const handleChangeRole = (officialId: string, newRole: 'government_official' | 'supervisor' | 'department_head') => {
    setOfficials(prev => prev.map(o => {
      if (o.officialId === officialId) {
        notify(`Role updated for ${o.name} to ${newRole}`);
        return { ...o, role: newRole };
      }
      return o;
    }));
  };

  const handleChangeDepartment = (officialId: string, newDeptId: string) => {
    const targetDept = departments.find(d => d.departmentId === newDeptId);
    if (!targetDept) return;
    setOfficials(prev => prev.map(o => {
      if (o.officialId === officialId) {
        notify(`Transferred ${o.name} to ${targetDept.name}`);
        return { ...o, departmentId: targetDept.departmentId, departmentName: targetDept.name };
      }
      return o;
    }));
  };

  // Filtered officials
  const filteredOfficials = officials.filter(o => {
    const isUS = o.jurisdiction.stateId === 'CA' || o.departmentId.includes('-US-');
    const isGB = o.jurisdiction.stateId === 'ENG' || o.departmentId.includes('-GB-');
    const isIN = !isUS && !isGB;

    if (countryFilter === 'IN' && !isIN) return false;
    if (countryFilter === 'US' && !isUS) return false;
    if (countryFilter === 'GB' && !isGB) return false;

    const matchesDept = selectedDeptId === 'ALL' || o.departmentId === selectedDeptId;
    const matchesQuery = !searchQuery || 
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.officialEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.jurisdiction.wardNumbers.some(w => w.includes(searchQuery));
    return matchesDept && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {feedbackMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Subnav */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setSubTab('officials')}
            className={`px-3 py-1.5 rounded-lg transition ${
              subTab === 'officials' 
                ? 'bg-neutral-900 text-white' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Officials Directory ({officials.length})
          </button>
          <button
            onClick={() => setSubTab('hierarchy')}
            className={`px-3 py-1.5 rounded-lg transition ${
              subTab === 'hierarchy' 
                ? 'bg-neutral-900 text-white' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Organization Hierarchy (Section 8)
          </button>
          <button
            onClick={() => setSubTab('supervisors')}
            className={`px-3 py-1.5 rounded-lg transition ${
              subTab === 'supervisors' 
                ? 'bg-neutral-900 text-white' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Zonal Supervisors & Capacity
          </button>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-neutral-800 transition shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Add New Official</span>
        </button>
      </div>

      {/* VIEW 1: OFFICIALS DIRECTORY */}
      {subTab === 'officials' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search official by name, employee ID, email, or ward..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
              />
            </div>
            <select
              value={countryFilter}
              onChange={(e) => { setCountryFilter(e.target.value); setSelectedDeptId('ALL'); }}
              className="w-full sm:w-48 px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-white font-medium text-neutral-700"
            >
              <option value="ALL">🌐 All Jurisdictions</option>
              <option value="IN">🇮🇳 India (CCMC)</option>
              <option value="US">🇺🇸 United States (San Jose)</option>
              <option value="GB">🇬🇧 United Kingdom (Camden)</option>
            </select>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-white font-medium text-neutral-700"
            >
              <option value="ALL">All Departments</option>
              {departments
                .filter(d => {
                  if (countryFilter === 'IN') return !d.departmentId.includes('-US-') && !d.departmentId.includes('-GB-');
                  if (countryFilter === 'US') return d.departmentId.includes('-US-');
                  if (countryFilter === 'GB') return d.departmentId.includes('-GB-');
                  return true;
                })
                .map(d => (
                  <option key={d.departmentId} value={d.departmentId}>{d.name}</option>
                ))}
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Official & ID</th>
                    <th className="py-3 px-4">Department & Role</th>
                    <th className="py-3 px-4">Wards / Jurisdiction</th>
                    <th className="py-3 px-4">Workload / Cap</th>
                    <th className="py-3 px-4">SLA Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredOfficials.map(o => (
                    <tr key={o.officialId} className="hover:bg-neutral-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-900">{o.name}</div>
                        <div className="text-[11px] font-mono text-neutral-500">{o.employeeId}</div>
                        <div className="text-[10px] text-neutral-400">{o.officialEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-neutral-800">{o.departmentName}</div>
                        <div className="text-[11px] text-neutral-500">{o.designation}</div>
                        <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.2 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                          {o.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-neutral-700 font-medium">
                          {o.jurisdiction.localBodyId} ({o.jurisdiction.districtId})
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {o.jurisdiction.wardNumbers.map(w => (
                            <span key={w} className="text-[10px] font-mono bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                              W-{w}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-neutral-100 overflow-hidden">
                            <div 
                              className={`h-full ${
                                o.currentActiveCases >= o.maxActiveCases 
                                  ? 'bg-red-500' 
                                  : o.currentActiveCases > o.maxActiveCases * 0.7 
                                    ? 'bg-amber-500' 
                                    : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, (o.currentActiveCases / o.maxActiveCases) * 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-neutral-700 font-semibold">
                            {o.currentActiveCases}/{o.maxActiveCases}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400">{o.availability}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-700 font-mono">
                          {o.slaAdherenceScore}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          o.employmentStatus === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${o.employmentStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {o.employmentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleSuspend(o.officialId)}
                            title={o.employmentStatus === 'ACTIVE' ? 'Suspend / Set On-Leave' : 'Reactivate Official'}
                            className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition text-[11px]"
                          >
                            {o.employmentStatus === 'ACTIVE' ? <UserX className="w-3.5 h-3.5 text-red-600" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ORGANIZATION HIERARCHY (SECTION 8) */}
      {subTab === 'hierarchy' && (
        <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-6">
          <div className="border-b border-neutral-100 pb-4">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-neutral-700" />
              Municipal Governance Hierarchy Architecture
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Strict Non-Flat Organizational Model: Government Organization → Authority → Department → Department Head → Zonal Supervisor → Field Officer.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Top Org Node */}
            <div className="p-4 rounded-xl bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center font-bold">
                  CCMC
                </div>
                <div>
                  <h4 className="font-bold text-sm">Coimbatore City Municipal Corporation (CCMC)</h4>
                  <p className="text-[11px] text-neutral-400">Executive Authority • 100 Gazetted Wards • Population ~2.1M</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Active Organization
              </span>
            </div>

            {/* Departments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-neutral-200">
              {departments.map(dept => {
                const deptOfficials = officials.filter(o => o.departmentId === dept.departmentId);
                const head = deptOfficials.find(o => o.role === 'department_head');
                const supervisors = deptOfficials.filter(o => o.role === 'supervisor');
                const fieldOfficers = deptOfficials.filter(o => o.role === 'government_official');

                return (
                  <div key={dept.departmentId} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900">{dept.name}</span>
                      <span className="font-mono text-[10px] bg-neutral-200 px-1.5 py-0.5 rounded">{dept.code}</span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="p-2 rounded-lg bg-white border border-neutral-200">
                        <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Department Head:</span>
                        <strong className="text-neutral-800">{dept.headName}</strong>
                      </div>

                      <div className="flex items-center justify-between text-neutral-600 pt-1">
                        <span>Zonal Supervisors: <strong>{supervisors.length}</strong></span>
                        <span>Field Officers: <strong>{fieldOfficers.length}</strong></span>
                        <span>SLA Rate: <strong className="text-emerald-700">{dept.slaComplianceRate}%</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: SUPERVISORS & CAPACITY */}
      {subTab === 'supervisors' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {officials.filter(o => o.role === 'supervisor' || o.role === 'department_head').map(sup => {
            const team = officials.filter(o => o.supervisorId === sup.supervisorId && o.role === 'government_official');
            const totalTeamCases = team.reduce((acc, curr) => acc + curr.currentActiveCases, 0);

            return (
              <div key={sup.officialId} className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">{sup.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {sup.designation.split('(')[0]}
                  </span>
                </div>

                <div className="text-xs text-neutral-500">
                  <p>{sup.departmentName}</p>
                  <p className="font-mono text-[11px] text-neutral-400 mt-0.5">{sup.officialEmail}</p>
                </div>

                <div className="pt-2 border-t border-neutral-100 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Subordinate Officers:</span>
                    <strong>{team.length} Field Officers</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Zonal Active Load:</span>
                    <strong className="text-neutral-900">{totalTeamCases} active complaints</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD OFFICIAL MODAL (SECTION 9 MANDATORY ATTRIBUTES) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden animate-in fade-in">
            <div className="p-5 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Provision New Government Officer (Section 9)</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOfficial} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Full Official Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Er. R. Senthil Nathan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-mono bg-neutral-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Official Email (.gov.in)</label>
                  <input
                    type="email"
                    required
                    placeholder="senthil.r@ccmc.gov.in"
                    value={formData.officialEmail}
                    onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Official Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Municipal Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-white"
                  >
                    {departments.map(d => (
                      <option key={d.departmentId} value={d.departmentId}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Role in Hierarchy</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-white"
                  >
                    <option value="government_official">Field Official / Assistant Engineer</option>
                    <option value="supervisor">Zonal Supervisor</option>
                    <option value="department_head">Department Head</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Official Designation Title</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Assigned Jurisdiction Wards</label>
                  <input
                    type="text"
                    placeholder="e.g., 12, 13, 24"
                    value={formData.jurisdictionWards}
                    onChange={(e) => setFormData({ ...formData, jurisdictionWards: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Specializations (Comma-separated)</label>
                  <input
                    type="text"
                    value={formData.specializations}
                    onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Max Active Case Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.maxActiveCases}
                    onChange={(e) => setFormData({ ...formData, maxActiveCases: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition shadow-xs"
                >
                  Create & Provision Official
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
