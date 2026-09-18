import React, { useState } from 'react';
import { 
  ExcavationPermit, 
  UtilityAgencyType, 
  SpatialConflictReport, 
  CitizenReinstatementAudit 
} from '../types';
import { 
  getActivePermits, 
  registerExcavationPermit, 
  detectSpatialConflicts, 
  submitCitizenReinstatementAudit, 
  markReinstatementCompleted,
  calculateReinstatementEscrow,
  checkThirtyDayNoticeCompliance,
  ESCROW_RATES_PER_METER
} from '../services/utilityCoordinationEngine';
import { useCivic } from '../context/CivicContext';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  MapPin, 
  DollarSign, 
  PlusCircle, 
  Layers, 
  FileCheck, 
  Building2, 
  X, 
  Star, 
  Camera, 
  ArrowRight, 
  Sparkles,
  Search,
  Filter,
  Check,
  Ban,
  Radio,
  Coins
} from 'lucide-react';

export const UtilityCoordinationPage: React.FC = () => {
  const { currentUser, t } = useCivic();
  const [permits, setPermits] = useState<ExcavationPermit[]>(() => getActivePermits());
  const [activeTab, setActiveTab] = useState<'calendar' | 'conflicts' | 'escrow'>('calendar');
  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState<string>('ALL');

  // Modal states
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedPermitForAudit, setSelectedPermitForAudit] = useState<ExcavationPermit | null>(null);

  // Conflict Simulator State
  const [simRoadName, setSimRoadName] = useState('Avinashi Road (KM 8.2 to 10.4)');
  const [simStartDate, setSimStartDate] = useState('2026-10-01');
  const [simReport, setSimReport] = useState<SpatialConflictReport | null>(() => 
    detectSpatialConflicts('Avinashi Road (KM 8.2 to 10.4)', [11.0268, 77.0125], '2026-10-01', getActivePermits())
  );

  // New Permit Form State
  const [newAgencyName, setNewAgencyName] = useState('TWAD Board (Tamil Nadu Water Supply & Drainage)');
  const [newAgencyType, setNewAgencyType] = useState<UtilityAgencyType>('WATER_SUPPLY');
  const [newRoadStretch, setNewRoadStretch] = useState('Trichy Road (Ramanathapuram to Singanallur)');
  const [newWard, setNewWard] = useState('14');
  const [newLength, setNewLength] = useState(180);
  const [newDepth, setNewDepth] = useState(1.8);
  const [newSurfaceType, setNewSurfaceType] = useState<ExcavationPermit['roadSurfaceType']>('BITUMINOUS_ASPHALT');
  const [newStartDate, setNewStartDate] = useState('2026-10-25');
  const [newEndDate, setNewEndDate] = useState('2026-11-15');
  const [newPurpose, setNewPurpose] = useState('Replacement of aged underground water distribution trunk mains.');
  const [newTrafficPlan, setNewTrafficPlan] = useState('Night trenching with one-way vehicle diversion.');

  // Citizen Audit Form State
  const [auditSmoothness, setAuditSmoothness] = useState(4);
  const [auditDebrisCleared, setAuditDebrisCleared] = useState(true);
  const [auditSunkenDefect, setAuditSunkenDefect] = useState(false);
  const [auditPhotoUrl, setAuditPhotoUrl] = useState('https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80');
  const [auditRemarks, setAuditRemarks] = useState('Road surface properly restored and rolled to grade. No uneven dips.');

  // Calculate live stats
  const activeTrenchingCount = permits.filter(p => p.status === 'TRENCHING_ACTIVE').length;
  const blockedConflictsCount = permits.filter(p => p.status === 'CONFLICT_BLOCKED').length;
  const totalEscrowCapital = permits.reduce((acc, p) => acc + (p.escrowStatus === 'HELD_IN_ESCROW' || p.escrowStatus === 'UNDER_CITIZEN_AUDIT' ? p.escrowAmountInInr : 0), 0);
  const citizenAuditsCount = permits.reduce((acc, p) => acc + (p.citizenAudits?.length || 0), 0);

  // Conflict Simulation Handler
  const handleRunConflictCheck = () => {
    const report = detectSpatialConflicts(simRoadName, [11.0268, 77.0125], simStartDate, permits);
    setSimReport(report);
  };

  // Submit New Permit Handler
  const handleFilePermitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = registerExcavationPermit({
      agencyName: newAgencyName,
      agencyType: newAgencyType,
      roadStretchName: newRoadStretch,
      ulbId: 'CCMC',
      ulbName: 'Coimbatore City Municipal Corporation',
      wardNumber: newWard,
      startCoordinates: [11.0045, 76.9912],
      endCoordinates: [11.0112, 77.0050],
      lengthMeters: Number(newLength),
      depthMeters: Number(newDepth),
      roadSurfaceType: newSurfaceType,
      applicationDate: new Date().toISOString(),
      plannedStartDate: new Date(newStartDate).toISOString(),
      plannedEndDate: new Date(newEndDate).toISOString(),
      purposeDescription: newPurpose,
      trafficPoliceNocNumber: `CBE-TRAFFIC-NOC-${Date.now().toString().slice(-4)}`,
      trafficDiversionPlan: newTrafficPlan
    });

    setPermits(getActivePermits());
    setIsFileModalOpen(false);
  };

  // Submit Citizen Audit Handler
  const handleSubmitAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPermitForAudit) return;

    const { updatedPermit, escrowReleased } = submitCitizenReinstatementAudit(selectedPermitForAudit.permitId, {
      permitId: selectedPermitForAudit.permitId,
      citizenUid: currentUser.uid,
      citizenName: currentUser.displayName || 'Verified Citizen Auditor',
      smoothnessRating: auditSmoothness,
      debrisCleared: auditDebrisCleared,
      sunkenTrenchDefect: auditSunkenDefect,
      photoEvidenceUrl: auditPhotoUrl,
      remarks: auditRemarks
    });

    setPermits(getActivePermits());
    setIsAuditModalOpen(false);
    setSelectedPermitForAudit(null);

    if (escrowReleased) {
      alert('Statutory citizen audit criteria met! ₹' + updatedPermit.escrowAmountInInr.toLocaleString('en-IN') + ' escrow funds successfully authorized for release.');
    }
  };

  // Agency Type Badges
  const getAgencyBadge = (type: UtilityAgencyType) => {
    switch (type) {
      case 'WATER_SUPPLY':
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-bold">Water (TWAD/BWSSB)</span>;
      case 'ELECTRICITY':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-bold">Power (TANGEDCO/BESCOM)</span>;
      case 'TELECOM_OFC':
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-bold">Telecom OFC</span>;
      case 'GAS_PIPELINE':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-bold">City Gas (GAIL)</span>;
      case 'METRO_TRANSIT':
        return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-bold">Metro Rail</span>;
      case 'PWD_HIGHWAYS':
        return <span className="bg-neutral-100 text-neutral-800 border border-neutral-300 px-2 py-0.5 rounded text-[11px] font-bold">Highways Repaving</span>;
      default:
        return <span className="bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded text-[11px] font-bold">{type}</span>;
    }
  };

  const filteredPermits = permits.filter(p => {
    if (selectedAgencyFilter === 'ALL') return true;
    return p.agencyType === selectedAgencyFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="bg-neutral-950 text-white rounded-3xl p-6 sm:p-8 border border-neutral-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">
                Statutory Conflict Prevention Engine • Rule 14-B
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-neutral-800 text-neutral-300 px-2.5 py-1 rounded-lg border border-neutral-700">
                6-Month Repaving Moratorium Active
              </span>
            </div>
          </div>

          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Unified Road Digging & Utility Coordination Portal
            </h1>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Ending the cycle of freshly repaved roads being destroyed weeks later. Mandates a 30-day advance digital excavation calendar, automated 6-month spatial conflict moratoriums, and citizen-audited reinstatement escrow accounts.
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-800">
            <div className="bg-neutral-900/80 p-3 rounded-2xl border border-neutral-800">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Active Digging Works</span>
              <span className="text-xl font-extrabold text-white mt-0.5 block">{activeTrenchingCount} Permits</span>
            </div>
            <div className="bg-neutral-900/80 p-3 rounded-2xl border border-neutral-800">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Repaving Conflicts Blocked</span>
              <span className="text-xl font-extrabold text-red-400 mt-0.5 block">{blockedConflictsCount} Blocked</span>
            </div>
            <div className="bg-neutral-900/80 p-3 rounded-2xl border border-neutral-800">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Reinstatement Escrow</span>
              <span className="text-xl font-extrabold text-amber-300 mt-0.5 block">
                ₹{(totalEscrowCapital / 100000).toFixed(1)} Lakhs
              </span>
            </div>
            <div className="bg-neutral-900/80 p-3 rounded-2xl border border-neutral-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Citizen Road Audits</span>
              <span className="text-xl font-extrabold text-emerald-300 mt-0.5 block">{citizenAuditsCount} Verified</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setIsFileModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>File Excavation NOC Permit</span>
            </button>
            <button
              onClick={() => { setActiveTab('conflicts'); }}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2 border border-neutral-700 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Run Repaving Conflict Simulator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-neutral-200 gap-2 sm:gap-6 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`py-3 px-2 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'calendar' 
              ? 'border-neutral-900 text-neutral-900 font-bold' 
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Excavation NOC Registry ({permits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('conflicts')}
          className={`py-3 px-2 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'conflicts' 
              ? 'border-neutral-900 text-neutral-900 font-bold' 
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Spatial Conflict Warning & Blocker</span>
        </button>

        <button
          onClick={() => setActiveTab('escrow')}
          className={`py-3 px-2 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'escrow' 
              ? 'border-neutral-900 text-neutral-900 font-bold' 
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Coins className="w-4 h-4 text-emerald-600" />
          <span>Reinstatement Escrow & Citizen Audits</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: Excavation NOC & 30-Day Digital Calendar Registry */}
      {/* ======================================================== */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {/* Agency Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
              <Filter className="w-3.5 h-3.5 text-neutral-500" />
              <span>Agency Domain:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {['ALL', 'WATER_SUPPLY', 'ELECTRICITY', 'TELECOM_OFC', 'GAS_PIPELINE', 'METRO_TRANSIT'].map((agency) => (
                <button
                  key={agency}
                  onClick={() => setSelectedAgencyFilter(agency)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition text-[11px] ${
                    selectedAgencyFilter === agency 
                      ? 'bg-neutral-900 text-white' 
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {agency === 'ALL' ? 'All Utilities' : agency.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Statutory 30-Day Advance Rule Advisory */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-3">
            <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block font-bold">Statutory Advance Filing Mandate:</strong>
              <p className="text-blue-800 leading-relaxed">
                Under Section 21-A of the State Urban Infrastructure Act, non-emergency trenching requests filed with less than 30 days notice are automatically flagged for review. Emergency burst repairs require municipal engineer certification.
              </p>
            </div>
          </div>

          {/* Permits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPermits.map((permit) => {
              const notice = checkThirtyDayNoticeCompliance(permit.applicationDate, permit.plannedStartDate);
              const isBlocked = permit.status === 'CONFLICT_BLOCKED';

              return (
                <div 
                  key={permit.permitId} 
                  className={`p-5 rounded-2xl border bg-white shadow-2xs space-y-4 flex flex-col justify-between transition ${
                    isBlocked ? 'border-red-300 bg-red-50/20' : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                          #{permit.permitNumber}
                        </span>
                        {getAgencyBadge(permit.agencyType)}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        permit.status === 'CONFLICT_BLOCKED' ? 'bg-red-100 text-red-800 border border-red-200' :
                        permit.status === 'TRENCHING_ACTIVE' ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' :
                        permit.status === 'REINSTATEMENT_SUBMITTED' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        permit.status === 'ESCROW_RELEASED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        'bg-neutral-100 text-neutral-700'
                      }`}>
                        {permit.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-neutral-900">{permit.roadStretchName}</h3>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{permit.purposeDescription}</p>
                    </div>

                    {/* Conflict Notice if blocked */}
                    {permit.conflictNotice && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                        <Ban className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <span className="font-medium leading-relaxed">{permit.conflictNotice}</span>
                      </div>
                    )}

                    {/* Specs strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-neutral-100">
                      <div>
                        <span className="text-[10px] text-neutral-400 block font-medium">Trench Length</span>
                        <strong className="text-neutral-900">{permit.lengthMeters} m</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block font-medium">Excavation Depth</span>
                        <strong className="text-neutral-900">{permit.depthMeters} m</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block font-medium">Escrow Deposit</span>
                        <strong className="text-amber-700">₹{permit.escrowAmountInInr.toLocaleString('en-IN')}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block font-medium">Ward Jurisdiction</span>
                        <strong className="text-neutral-900">Ward {permit.wardNumber}</strong>
                      </div>
                    </div>

                    {/* Schedule Dates & Advance notice */}
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span>
                          {new Date(permit.plannedStartDate).toLocaleDateString()} &rarr; {new Date(permit.plannedEndDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`font-semibold ${notice.isCompliant ? 'text-emerald-700' : 'text-amber-600'}`}>
                        {notice.daysInAdvance}d advance notice
                      </span>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Traffic NOC: {permit.trafficPoliceNocNumber}
                    </span>
                    {permit.status === 'REINSTATEMENT_SUBMITTED' && (
                      <button
                        onClick={() => {
                          setSelectedPermitForAudit(permit);
                          setIsAuditModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Audit Restoration</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: Spatial Conflict Warning & 6-Month Repaving Blocker */}
      {/* ======================================================== */}
      {activeTab === 'conflicts' && (
        <div className="space-y-6">
          {/* Conflict Simulator Tool */}
          <div className="p-6 bg-white rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <span>6-Month Repaving Conflict Detector (Pre-Tender Clearance)</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Before issuing a municipal work order for bitumen resurfacing or concrete paving, verify that no underground pipeline, gas main, or optical fiber ducting is scheduled within 180 days.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Proposed Road Stretch
                </label>
                <input
                  type="text"
                  value={simRoadName}
                  onChange={(e) => setSimRoadName(e.target.value)}
                  placeholder="e.g. Avinashi Road (KM 8.2 to 10.4)"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-xl focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Scheduled Resurfacing Date
                </label>
                <input
                  type="date"
                  value={simStartDate}
                  onChange={(e) => setSimStartDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-xl focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRunConflictCheck}
                className="py-2.5 px-5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Search className="w-4 h-4 text-emerald-400" />
                <span>Execute Spatial & Temporal Conflict Scan</span>
              </button>

              <button
                onClick={() => {
                  setSimRoadName('Mettupalayam Road (Saibaba Colony Stretch)');
                  setSimStartDate('2026-10-15');
                }}
                className="text-xs text-neutral-500 hover:text-neutral-900 underline font-medium cursor-pointer"
              >
                Try sample: Mettupalayam Road
              </button>
            </div>
          </div>

          {/* Simulation Output Banner */}
          {simReport && (
            <div className={`p-6 rounded-3xl border-2 transition space-y-4 ${
              simReport.hasConflict 
                ? 'bg-red-50/70 border-red-400 text-red-950' 
                : 'bg-emerald-50/70 border-emerald-400 text-emerald-950'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {simReport.hasConflict ? (
                    <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0">
                      <Ban className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                      simReport.hasConflict ? 'bg-red-200 text-red-900' : 'bg-emerald-200 text-emerald-900'
                    }`}>
                      {simReport.hasConflict ? 'STATUTORY MORATORIUM CONFLICT DETECTED' : 'CLEAR TO PROCEED'}
                    </span>
                    <h3 className="text-base font-extrabold">
                      {simReport.hasConflict 
                        ? 'Municipal Road Repaving Work Order Automatically BLOCKED' 
                        : 'Road Repaving Work Order Authorized'}
                    </h3>
                    <p className="text-xs leading-relaxed opacity-90">
                      {simReport.moratoriumReason}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold bg-white/80 px-2.5 py-1 rounded-lg border border-neutral-200/60 shrink-0">
                  Buffer: 180 Days
                </span>
              </div>

              {/* Recommendation Box */}
              <div className={`p-4 rounded-2xl text-xs space-y-2 ${
                simReport.hasConflict ? 'bg-white/80 border border-red-200' : 'bg-white/80 border border-emerald-200'
              }`}>
                <strong className="block uppercase tracking-wider text-[10px] text-neutral-500">Recommended Resolution:</strong>
                <p className="font-semibold">{simReport.recommendedAction}</p>

                {simReport.hasConflict && (
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => alert('Joint Trenching Coordination session initiated between CCMC Highways and utility agency engineers. Schedule synchronized!')}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Initiate Joint Utility Trenching Coordination</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: Reinstatement Escrow Tracking & Citizen Audits */}
      {/* ======================================================== */}
      {activeTab === 'escrow' && (
        <div className="space-y-6">
          {/* Escrow Rule Banner */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-600" />
                  <span>Municipal Reinstatement Escrow Ledger</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Contractors and utilities deposit statutory road restoration fees before receiving an excavation NOC. Funds remain locked until verified citizen audits confirm the asphalt has been returned to grade.
                </p>
              </div>

              <div className="flex gap-2">
                <div className="text-right p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase block">Bituminous Asphalt</span>
                  <span className="text-sm font-extrabold text-neutral-900">₹2,500 / linear meter</span>
                </div>
                <div className="text-right p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase block">Cement Concrete</span>
                  <span className="text-sm font-extrabold text-neutral-900">₹3,800 / linear meter</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stretches Awaiting Citizen Audit */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
              Completed Stretches Ready for Citizen Audit & Escrow Release
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {permits.filter(p => p.status === 'REINSTATEMENT_SUBMITTED' || p.status === 'CITIZEN_AUDITING').map((permit) => (
                <div key={permit.permitId} className="p-5 rounded-2xl border-2 border-emerald-300 bg-white shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        RESTORATION COMPLETED • ESCROW ON HOLD
                      </span>
                      <h4 className="font-bold text-base text-neutral-900 mt-1">{permit.roadStretchName}</h4>
                      <span className="text-xs text-neutral-500 block">{permit.agencyName}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 block uppercase">Escrow Locked</span>
                      <strong className="text-base text-amber-700 font-extrabold">
                        ₹{permit.escrowAmountInInr.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  {/* Before & After Photo Preview */}
                  {permit.reinstatementProofUrl && (
                    <div>
                      <span className="text-[11px] font-semibold text-neutral-600 block mb-1.5">
                        Contractor Restoration Photo Proof:
                      </span>
                      <div className="rounded-xl overflow-hidden border border-neutral-200 max-w-sm">
                        <img 
                          src={permit.reinstatementProofUrl} 
                          alt="Restoration proof" 
                          className="w-full h-44 object-cover" 
                        />
                      </div>
                    </div>
                  )}

                  {/* Citizen Audits Tally */}
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-700">Citizen Inspection Status:</span>
                      <span className="text-[11px] font-bold text-neutral-900">
                        {permit.citizenAudits?.length || 0} / 2 Required Inspections
                      </span>
                    </div>

                    {permit.citizenAudits && permit.citizenAudits.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {permit.citizenAudits.map((a) => (
                          <div key={a.auditId} className="text-xs p-2 bg-white rounded-lg border border-neutral-200 flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1 text-amber-500">
                                {Array.from({ length: a.smoothnessRating }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-amber-400" />
                                ))}
                                <span className="text-neutral-700 font-bold ml-1">{a.citizenName}</span>
                              </div>
                              <p className="text-[11px] text-neutral-600 italic mt-0.5">"{a.remarks}"</p>
                            </div>
                            <span className="text-[10px] text-emerald-700 font-bold shrink-0">Verified</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPermitForAudit(permit);
                      setIsAuditModalOpen(true);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Conduct Citizen Road Audit (+ ₹100 Civic Incentive)</span>
                  </button>
                </div>
              ))}

              {permits.filter(p => p.status === 'REINSTATEMENT_SUBMITTED' || p.status === 'CITIZEN_AUDITING').length === 0 && (
                <div className="col-span-2 py-12 text-center text-neutral-500 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                  <p className="font-bold text-sm text-neutral-800">All completed trenches have been audited</p>
                  <p className="mt-0.5">When an agency completes trench reinstatement, citizen audit tasks appear here automatically.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: File Excavation NOC Permit */}
      {/* ======================================================== */}
      {isFileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-neutral-200 space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-neutral-900">File Excavation NOC Permit Application</h3>
              </div>
              <button 
                onClick={() => setIsFileModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFilePermitSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Utility Agency Name</label>
                  <input
                    type="text"
                    required
                    value={newAgencyName}
                    onChange={(e) => setNewAgencyName(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Agency Type</label>
                  <select
                    value={newAgencyType}
                    onChange={(e) => setNewAgencyType(e.target.value as UtilityAgencyType)}
                    className="w-full p-2 border border-neutral-300 rounded-xl"
                  >
                    <option value="WATER_SUPPLY">Water Supply (TWAD/BWSSB)</option>
                    <option value="ELECTRICITY">Electricity (TANGEDCO/BESCOM)</option>
                    <option value="TELECOM_OFC">Telecom Optical Fiber (Jio/Airtel)</option>
                    <option value="GAS_PIPELINE">City Gas Grid (GAIL)</option>
                    <option value="METRO_TRANSIT">Metro Rail Corporation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Target Road Stretch Name</label>
                <input
                  type="text"
                  required
                  value={newRoadStretch}
                  onChange={(e) => setNewRoadStretch(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Length (Meters)</label>
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    required
                    value={newLength}
                    onChange={(e) => setNewLength(Number(e.target.value))}
                    className="w-full p-2 border border-neutral-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Depth (Meters)</label>
                  <input
                    type="number"
                    step={0.1}
                    required
                    value={newDepth}
                    onChange={(e) => setNewDepth(Number(e.target.value))}
                    className="w-full p-2 border border-neutral-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Road Surface</label>
                  <select
                    value={newSurfaceType}
                    onChange={(e) => setNewSurfaceType(e.target.value as any)}
                    className="w-full p-2 border border-neutral-300 rounded-xl"
                  >
                    <option value="BITUMINOUS_ASPHALT">Bituminous Asphalt</option>
                    <option value="CEMENT_CONCRETE">Cement Concrete</option>
                    <option value="INTERLOCKING_PAVER">Paver Blocks</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Planned Start Date</label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Planned Completion Date</label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Purpose of Excavation</label>
                <textarea
                  rows={2}
                  required
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-xl"
                />
              </div>

              {/* Escrow Math Preview */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">Statutory Reinstatement Escrow Deposit:</span>
                  <span className="text-xs text-amber-900 font-medium">{newLength}m × ₹{ESCROW_RATES_PER_METER[newSurfaceType]}/m</span>
                </div>
                <strong className="text-base font-extrabold text-amber-800">
                  ₹{calculateReinstatementEscrow(newLength, newSurfaceType).toLocaleString('en-IN')}
                </strong>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
              >
                Deposit Escrow & Submit NOC Application
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Citizen Reinstatement Road Audit */}
      {/* ======================================================== */}
      {isAuditModalOpen && selectedPermitForAudit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Citizen Audit Task</span>
                <h3 className="font-extrabold text-base text-neutral-900">Inspect Road Reinstatement Quality</h3>
              </div>
              <button 
                onClick={() => setIsAuditModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAudit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <span className="text-neutral-500 font-medium">Road Stretch:</span>
                <p className="font-bold text-neutral-900">{selectedPermitForAudit.roadStretchName}</p>
                <span className="text-neutral-500 block">Restored by: {selectedPermitForAudit.agencyName}</span>
              </div>

              <div>
                <label className="font-semibold text-neutral-800 block mb-1.5">
                  Surface Smoothness Rating (No Bumps / Even Grade)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setAuditSmoothness(star)}
                      className="p-1 hover:scale-110 transition cursor-pointer"
                    >
                      <Star className={`w-6 h-6 ${star <= auditSmoothness ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
                    </button>
                  ))}
                  <span className="font-bold text-sm ml-2 text-neutral-800">{auditSmoothness} / 5</span>
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-neutral-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={auditDebrisCleared}
                    onChange={(e) => setAuditDebrisCleared(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0"
                  />
                  <span className="text-neutral-800 font-medium">Construction debris, loose bitumen and gravel fully cleared</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={auditSunkenDefect}
                    onChange={(e) => setAuditSunkenDefect(e.target.checked)}
                    className="rounded text-red-600 focus:ring-0"
                  />
                  <span className="text-red-700 font-medium">Defect: Trench has sunk below road level (Pothole risk)</span>
                </label>
              </div>

              <div>
                <label className="font-semibold text-neutral-800 block mb-1">
                  Citizen Inspector Remarks
                </label>
                <textarea
                  rows={2}
                  required
                  value={auditRemarks}
                  onChange={(e) => setAuditRemarks(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-xl"
                  placeholder="e.g. Smooth finish, rolled to level. Ready for public vehicular traffic."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Verified Citizen Audit & Authorize Escrow</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
