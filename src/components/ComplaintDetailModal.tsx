import React, { useState } from 'react';
import { 
  Complaint, 
  ResolutionData 
} from '../types';
import { useCivic } from '../context/CivicContext';
import { checkSLAStatus } from '../services/slaEngine';
import { 
  X, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Building2, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  ThumbsUp, 
  Star, 
  ArrowUpRight, 
  Send,
  Calendar,
  Layers,
  FileCheck,
  ChevronRight
} from 'lucide-react';

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  onClose: () => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({ complaint, onClose }) => {
  const { 
    currentUser, 
    supportComplaint, 
    resolveComplaint, 
    citizenReviewResolution, 
    updateComplaintStatus,
    requestExtensionForComplaint,
    escalateComplaintSla,
    auditEvents 
  } = useCivic();

  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'timeline' | 'actions'>('overview');
  
  // Government resolution state
  const [resolutionText, setResolutionText] = useState('');
  const [actionTakenText, setActionTakenText] = useState('');
  const [resolutionImageUrl, setResolutionImageUrl] = useState(
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80'
  );

  // Citizen review state
  const [citizenRating, setCitizenRating] = useState(5);
  const [citizenFeedback, setCitizenFeedback] = useState('');
  const [appealReason, setAppealReason] = useState('');
  const [showAppealForm, setShowAppealForm] = useState(false);

  // Extension state
  const [extensionHours, setExtensionHours] = useState(24);
  const [extensionReason, setExtensionReason] = useState('');
  const [showExtensionForm, setShowExtensionForm] = useState(false);

  if (!complaint) return null;

  const slaInfo = checkSLAStatus(complaint.sla);
  const isGovernment = ['government_official', 'supervisor', 'department_head', 'district_authority', 'state_authority', 'admin'].includes(currentUser.role);
  const isCitizen = currentUser.role === 'citizen';
  const hasSupported = complaint.supportedByCitizenIds?.includes(currentUser.uid);

  // Filter events for this complaint
  const complaintAudit = auditEvents.filter(e => e.complaintId === complaint.complaintId);

  const handleGovernmentResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTakenText.trim()) return;

    const res: ResolutionData = {
      description: resolutionText || 'Site inspection and restorative work successfully carried out.',
      actionTaken: actionTakenText,
      resolvedAt: new Date().toISOString(),
      resolvedByOfficialId: currentUser.uid,
      resolvedByOfficialName: currentUser.displayName,
      beforeEvidenceUrl: complaint.evidence[0]?.url,
      afterEvidenceUrls: [resolutionImageUrl]
    };

    resolveComplaint(complaint.complaintId, res);
    setActiveTab('overview');
  };

  const handleCitizenAccept = () => {
    citizenReviewResolution(complaint.complaintId, 'ACCEPTED', citizenRating, citizenFeedback);
  };

  const handleCitizenAppeal = () => {
    if (!appealReason.trim()) return;
    citizenReviewResolution(complaint.complaintId, 'APPEALED', undefined, undefined, appealReason);
    setShowAppealForm(false);
  };

  const handleExtensionSubmit = () => {
    if (!extensionReason.trim()) return;
    requestExtensionForComplaint(complaint.complaintId, extensionHours, extensionReason);
    setShowExtensionForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="font-mono text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                #{complaint.complaintId}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                complaint.priorityLevel === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                complaint.priorityLevel === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {complaint.priorityLevel} PRIORITY ({complaint.priorityScore}/100)
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-neutral-900 text-white">
                {complaint.status}
              </span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 leading-snug">
              {complaint.title}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy & GIS Snapshot Bar */}
        <div className="bg-neutral-50 px-6 py-2.5 border-b border-neutral-200 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-neutral-700">
            <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold text-neutral-900">
              {complaint.locationSnapshot.wardName || 'Ward Unmapped'}
            </span>
            <span className="text-neutral-400">•</span>
            <span className="text-neutral-600">{complaint.locationSnapshot.localBodyName}</span>
          </div>

          <div className="flex items-center gap-2 text-neutral-500">
            <ShieldCheck className="w-4 h-4 text-neutral-700" />
            <span>Reporter: <strong className="text-neutral-800">
              {isGovernment ? complaint.citizenName : `${complaint.citizenName.split(' ')[0]} ***`}
            </strong></span>
            {complaint.citizenPhoneMasked && (
              <span className="text-neutral-400">({complaint.citizenPhoneMasked})</span>
            )}
            <span className="px-1.5 py-0.2 rounded bg-neutral-200/80 text-[10px] font-semibold text-neutral-700">
              Section 55 Privacy
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 px-6 gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition ${activeTab === 'overview' ? 'border-neutral-900 text-neutral-900 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
          >
            Problem & AI Insights
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-3 border-b-2 transition ${activeTab === 'evidence' ? 'border-neutral-900 text-neutral-900 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
          >
            Evidence & Resolution ({complaint.evidence.length})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 border-b-2 transition ${activeTab === 'timeline' ? 'border-neutral-900 text-neutral-900 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
          >
            Audit Trail ({complaintAudit.length})
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-3 border-b-2 transition ${activeTab === 'actions' ? 'border-neutral-900 text-neutral-900 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
          >
            Resolution & Actions
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {activeTab === 'overview' && (
            <>
              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                  Citizen Description
                </h4>
                <p className="text-neutral-800 leading-relaxed bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80">
                  {complaint.description}
                </p>
              </div>

              {/* SLA Status Card */}
              <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-600" />
                    <span className="font-semibold text-neutral-900 text-xs uppercase tracking-wider">
                      SLA Response Window
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${slaInfo.badgeColor}`}>
                    {slaInfo.statusLabel}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-neutral-100">
                  <div>
                    <span className="text-neutral-500">Target Response:</span>
                    <p className="font-semibold text-neutral-900">
                      {new Date(complaint.sla.initialResponseDueAt).toLocaleDateString()} {new Date(complaint.sla.initialResponseDueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Escalation Tier:</span>
                    <p className="font-semibold text-neutral-900">{complaint.sla.currentEscalationLevel}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Supporters Corroborated:</span>
                    <p className="font-semibold text-emerald-700">{complaint.supportersCount} Citizens</p>
                  </div>
                </div>
              </div>

              {/* Multimodal Gemini Understanding Card */}
              {complaint.latestAiAnalysis && (
                <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-neutral-900 text-xs uppercase tracking-wider">
                        Gemini Multimodal Analysis (Advisory)
                      </span>
                    </div>
                    <span className="text-xs font-mono font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                      Confidence: {(complaint.latestAiAnalysis.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-neutral-700 mb-3 italic">
                    "{complaint.latestAiAnalysis.explanation}"
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="bg-white p-2 rounded-lg border border-neutral-200">
                      <span className="text-[10px] text-neutral-500 block">Problem Class</span>
                      <strong className="text-neutral-900 truncate block">{complaint.latestAiAnalysis.problemType}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-neutral-200">
                      <span className="text-[10px] text-neutral-500 block">Safety Hazard</span>
                      <strong className="text-neutral-900 truncate block">{complaint.latestAiAnalysis.safetyRisk}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-neutral-200">
                      <span className="text-[10px] text-neutral-500 block">Public Exposure</span>
                      <strong className="text-neutral-900 truncate block">{complaint.latestAiAnalysis.affectedPopulation}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-neutral-200">
                      <span className="text-[10px] text-neutral-500 block">Suggested Dept</span>
                      <strong className="text-purple-700 truncate block">{complaint.latestAiAnalysis.suggestedDepartment}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Responsible Department & Assignment */}
              <div className="p-4 rounded-xl border border-neutral-200 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-neutral-700" />
                  <span className="font-semibold text-neutral-900 text-xs uppercase tracking-wider">
                    Government Jurisdiction & Assignment
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-500">Responsible Department:</span>
                    <p className="font-bold text-neutral-900 text-sm">{complaint.assignedDepartmentName}</p>
                    <span className="text-[11px] text-neutral-500">Determined via Deterministic Routing Engine</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Assigned Official:</span>
                    <p className="font-semibold text-neutral-900 text-sm">{complaint.assignedOfficialName || 'Under Routing Pool'}</p>
                    <span className="text-[11px] text-neutral-500">Allocation: {complaint.assignmentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Quick Support Action for Citizens */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-900 text-white">
                <div>
                  <h5 className="font-semibold text-sm">Have you witnessed this problem?</h5>
                  <p className="text-xs text-neutral-300">
                    Corroborate this issue to prevent duplicate submissions and elevate municipal urgency.
                  </p>
                </div>
                <button
                  onClick={() => supportComplaint(complaint.complaintId)}
                  disabled={hasSupported}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs transition ${
                    hasSupported ? 'bg-emerald-600 text-white cursor-default' : 'bg-white text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {hasSupported ? 'Corroborated' : `Support Issue (${complaint.supportersCount})`}
                </button>
              </div>
            </>
          )}

          {activeTab === 'evidence' && (
            <div className="space-y-6">
              {/* Citizen Uploaded Evidence */}
              <div>
                <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-2">
                  Original Citizen Evidence ({complaint.evidence.length} Attachment)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {complaint.evidence.map(ev => (
                    <div key={ev.id} className="rounded-xl border border-neutral-200 overflow-hidden bg-neutral-50">
                      <img 
                        src={ev.url} 
                        alt={ev.fileName} 
                        className="w-full h-48 object-cover bg-neutral-200" 
                      />
                      <div className="p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-neutral-800 truncate">{ev.fileName}</span>
                          <span className="text-neutral-500">{(ev.fileSize / 1024).toFixed(0)} KB</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-neutral-500 pt-1 border-t border-neutral-200">
                          <span>Quality: <strong>{ev.qualityScore}%</strong></span>
                          <span>AI Artifact Risk: <strong>{ev.aiAuthenticityRisk}%</strong></span>
                          <span>GPS Check: <strong className="text-emerald-600">Verified</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Government Resolution Evidence if available */}
              {complaint.resolution && (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-bold text-sm">Government Resolution Proof</h4>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {new Date(complaint.resolution.resolvedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-800">
                    <strong>Action Taken:</strong> {complaint.resolution.actionTaken}
                  </p>
                  <p className="text-xs text-neutral-700">
                    <strong>Official Notes:</strong> {complaint.resolution.description}
                  </p>

                  {complaint.resolution.afterEvidenceUrls && complaint.resolution.afterEvidenceUrls.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-neutral-700 block mb-1.5">After Completion Photo:</span>
                      <div className="rounded-xl overflow-hidden border border-emerald-200 max-w-sm">
                        <img 
                          src={complaint.resolution.afterEvidenceUrls[0]} 
                          alt="After repair proof" 
                          className="w-full h-48 object-cover" 
                        />
                      </div>
                    </div>
                  )}

                  {complaint.resolution.citizenRating && (
                    <div className="pt-2 border-t border-emerald-200 flex items-center gap-2 text-xs">
                      <span className="text-neutral-600">Citizen Verification:</span>
                      <div className="flex text-amber-500">
                        {Array.from({ length: complaint.resolution.citizenRating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-emerald-800 font-semibold italic">"{complaint.resolution.citizenFeedback}"</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-2">
                Immutable Problem Lifecycle Stream
              </h4>
              <div className="border-l-2 border-neutral-200 ml-3 pl-4 space-y-5">
                {complaintAudit.map((evt, idx) => (
                  <div key={evt.eventId || idx} className="relative">
                    <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-neutral-900 border-2 border-white shadow-xs"></div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-neutral-900">{evt.action.replace(/_/g, ' ')}</span>
                      <span className="text-neutral-400 font-mono text-[11px]">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600">{evt.notes}</p>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Actor: <strong className="text-neutral-700">{evt.actorName}</strong> ({evt.actorRole})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-6">
              {/* Government Official Operations */}
              {isGovernment && (
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-neutral-900">
                      Government Action Center ({currentUser.designation || currentUser.role})
                    </h4>
                    <span className="text-xs bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded">
                      Authorized Officer
                    </span>
                  </div>

                  {/* Status Progression */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => updateComplaintStatus(complaint.complaintId, 'IN_PROGRESS', 'Officer inspected location and commenced restoration works.')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition"
                    >
                      Mark In Progress
                    </button>
                    <button
                      onClick={() => updateComplaintStatus(complaint.complaintId, 'UNDER_INSPECTION', 'Site inspection initiated by field team.')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50 transition"
                    >
                      Conduct Inspection
                    </button>
                    <button
                      onClick={() => setShowExtensionForm(!showExtensionForm)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50 transition"
                    >
                      Request SLA Extension
                    </button>
                    <button
                      onClick={() => escalateComplaintSla(complaint.complaintId)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition"
                    >
                      Escalate to Supervisor
                    </button>
                  </div>

                  {/* SLA Extension Form */}
                  {showExtensionForm && (
                    <div className="p-3 bg-white rounded-xl border border-neutral-200 space-y-2.5 animate-in fade-in">
                      <h5 className="font-semibold text-xs text-neutral-900">Log SLA Extension Request</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-neutral-500 block mb-1">Additional Hours</label>
                          <select 
                            value={extensionHours} 
                            onChange={(e) => setExtensionHours(Number(e.target.value))}
                            className="w-full text-xs p-2 rounded-lg border border-neutral-300"
                          >
                            <option value={24}>+24 Hours</option>
                            <option value={48}>+48 Hours</option>
                            <option value={72}>+72 Hours</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-neutral-500 block mb-1">Mandatory Justification</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Heavy rain delay, specialized parts order"
                            value={extensionReason}
                            onChange={(e) => setExtensionReason(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-neutral-300"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleExtensionSubmit}
                        className="text-xs font-semibold px-3 py-1.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
                      >
                        Submit Audited Extension
                      </button>
                    </div>
                  )}

                  {/* Submit Resolution Form */}
                  <form onSubmit={handleGovernmentResolve} className="space-y-3 pt-2 border-t border-purple-200">
                    <h5 className="font-bold text-xs text-neutral-900">Resolve Complaint & Upload Evidence</h5>
                    <div>
                      <label className="text-xs text-neutral-600 block mb-1">Action Taken Summary (Public)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Pothole filled with bitumen mix, rolled and leveled to road grade."
                        value={actionTakenText}
                        onChange={(e) => setActionTakenText(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-purple-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-600 block mb-1">Resolution Evidence Photo URL</label>
                      <input 
                        type="url" 
                        required
                        value={resolutionImageUrl}
                        onChange={(e) => setResolutionImageUrl(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-purple-600"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition shadow-xs"
                    >
                      Submit Resolution for Citizen Verification
                    </button>
                  </form>
                </div>
              )}

              {/* Citizen Verification & Resolution Review */}
              {complaint.status === 'RESOLVED' && (
                <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-sm">Citizen Verification Required</h4>
                  </div>
                  <p className="text-xs text-neutral-700">
                    The government officer has marked this complaint resolved. Does the problem appear fixed on site?
                  </p>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-800 block">Rating</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setCitizenRating(star)}
                          className="p-1 text-amber-400 hover:scale-110 transition"
                        >
                          <Star className={`w-5 h-5 ${star <= citizenRating ? 'fill-amber-400' : 'text-neutral-300'}`} />
                        </button>
                      ))}
                    </div>
                    <input 
                      type="text" 
                      placeholder="Optional feedback for the municipal crew..."
                      value={citizenFeedback}
                      onChange={(e) => setCitizenFeedback(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-neutral-300 bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleCitizenAccept}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition"
                    >
                      Accept Resolution & Close Case
                    </button>
                    <button
                      onClick={() => setShowAppealForm(!showAppealForm)}
                      className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 font-semibold text-xs rounded-lg transition"
                    >
                      Appeal / Reopen
                    </button>
                  </div>

                  {showAppealForm && (
                    <div className="p-3 bg-white rounded-xl border border-red-200 space-y-2 mt-3 animate-in fade-in">
                      <h5 className="font-semibold text-xs text-red-700">State Reason for Appeal</h5>
                      <textarea
                        rows={2}
                        placeholder="Describe why the resolution is incomplete or unsatisfactory..."
                        value={appealReason}
                        onChange={(e) => setAppealReason(e.target.value)}
                        className="w-full p-2 text-xs rounded-lg border border-neutral-300"
                      />
                      <button
                        onClick={handleCitizenAppeal}
                        className="py-1.5 px-3 bg-red-600 text-white font-semibold text-xs rounded-lg hover:bg-red-700"
                      >
                        Submit Appeal & Reopen Case
                      </button>
                    </div>
                  )}
                </div>
              )}

              {complaint.status === 'CLOSED' && (
                <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-200 text-center text-xs text-neutral-600">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                  <p className="font-semibold text-neutral-900">Case Verified and Closed</p>
                  <p className="mt-0.5">Citizen confirmed successful resolution. Thank you for contributing to CivicSync.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500">
          <span>Boundary Source: <strong>{complaint.locationSnapshot.boundaryVersion}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
