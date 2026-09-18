import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import { CommunityOpportunity, Complaint } from '../types';
import { 
  HeartHandshake, 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Camera, 
  ShieldCheck, 
  Calendar,
  AlertCircle,
  Sparkles,
  Award,
  Trees
} from 'lucide-react';

interface CommunityPortalProps {
  onSelectComplaint: (complaint: Complaint) => void;
}

export const CommunityPortal: React.FC<CommunityPortalProps> = ({ onSelectComplaint }) => {
  const { 
    currentUser, 
    communityOpportunities, 
    acceptCommunityOpportunity, 
    completeCommunityOpportunity,
    complaints 
  } = useCivic();

  const [activeTab, setActiveTab] = useState<'available' | 'claimed' | 'completed'>('available');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [volunteersCount, setVolunteersCount] = useState<number>(12);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completingId, setCompletingId] = useState<string | null>(null);

  const safeOps = communityOpportunities || [];
  const availableOps = safeOps.filter(o => o.status === 'AVAILABLE');
  const claimedOps = safeOps.filter(o => o.status === 'ACCEPTED' || (o.status as string) === 'CLAIMED' || o.status === 'IN_PROGRESS');
  const completedOps = safeOps.filter(o => o.status === 'VERIFIED_COMPLETE' || (o.status as string) === 'COMPLETED');

  const handleClaim = (opId: string) => {
    if (acceptCommunityOpportunity) {
      acceptCommunityOpportunity(opId, currentUser.organizationName || 'Coimbatore Plogging Club', volunteersCount);
    }
    setClaimingId(null);
  };

  const handleComplete = (opId: string) => {
    if (completeCommunityOpportunity) {
      completeCommunityOpportunity(
        opId, 
        [
          'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80'
        ],
        completionNotes || 'Community cleanup completed with verified volunteer team. 18 bags of plastic debris collected.'
      );
    }
    setCompletingId(null);
    setCompletionNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Portal Banner */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xl">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-neutral-900">
                {currentUser.organizationName || 'Coimbatore Plogging & Civic Action Club'}
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified NGO Partner
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Accredited by Coimbatore City Municipal Corp (CCMC) • NGO Registration: TN-CBE-2021-0849
            </p>
            <span className="inline-block text-[11px] text-neutral-400 mt-1">
              24-Hour Opportunity Fallback Safety Window active on all claimed civic initiatives.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-neutral-500 block">Civic Impact Score</span>
            <span className="text-xl font-extrabold text-emerald-700">920 Pts</span>
          </div>
        </div>
      </div>

      {/* Volunteer Milestones & Accreditations */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Volunteer Hours</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-neutral-900">420+</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Gold Tier</span>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Canal Cleanups</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-blue-700">8 Cleaned</span>
            <span className="text-[10px] text-blue-600 font-medium">Noyyal River</span>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
            <Trees className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Urban Greenery</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-emerald-700">650+</span>
            <span className="text-[10px] text-emerald-600 font-medium">Native Saplings</span>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Escrow Grants</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-purple-700">₹85,000</span>
            <span className="text-[10px] text-purple-600 font-medium">100% Disbursed</span>
          </div>
        </div>
      </div>

      {/* SLA Fallback Notice */}
      <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-neutral-700 flex items-start gap-3">
        <Clock className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-emerald-900 block">24-Hour Structured Fallback SLA Rule:</strong>
          When an NGO accepts an opportunity, a 24-hour action window is established. If community mobilization does not complete the initiative, the task automatically falls back to the government departmental SLA with zero delay for the citizen.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('available')}
          className={`py-3 border-b-2 transition ${activeTab === 'available' ? 'border-neutral-900 text-neutral-900 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
        >
          Open Civic Opportunities ({availableOps.length})
        </button>
        <button
          onClick={() => setActiveTab('claimed')}
          className={`py-3 border-b-2 transition ${activeTab === 'claimed' ? 'border-neutral-900 text-neutral-900 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
        >
          Active NGO Drives ({claimedOps.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`py-3 border-b-2 transition ${activeTab === 'completed' ? 'border-neutral-900 text-neutral-900 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
        >
          Completed Initiatives ({completedOps.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'available' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {availableOps.map((op, idx) => {
              const opId = op.id || op.opportunityId || `avail-op-${idx}`;
              const opCategory = op.category || op.type || 'CIVIC_ACTION';
              const locationText = op.locationSnapshot?.wardName || op.locationSnapshot?.localBodyName || 'Municipal Ward Area';

              return (
                <div key={opId} className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {opCategory}
                      </span>
                      <span className="text-xs font-mono text-neutral-400">
                        Expires in 24h
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-neutral-900">{op.title}</h3>
                    <p className="text-xs text-neutral-600 leading-relaxed">{op.description}</p>

                    <div className="flex items-center gap-2 text-xs text-neutral-500 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{locationText}</span>
                    </div>
                  </div>

                  {claimingId === opId ? (
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2.5 animate-in fade-in">
                      <label className="text-xs font-semibold text-neutral-700 block">
                        Registered Volunteers Pledged:
                      </label>
                      <input 
                        type="number" 
                        min={1} 
                        max={100}
                        value={volunteersCount} 
                        onChange={(e) => setVolunteersCount(Number(e.target.value))}
                        className="w-full p-2 text-xs rounded-lg border border-neutral-300"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleClaim(opId)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition cursor-pointer"
                        >
                          Confirm & Accept Initiative
                        </button>
                        <button
                          onClick={() => setClaimingId(null)}
                          className="px-3 py-2 border border-neutral-300 text-neutral-600 text-xs rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setClaimingId(opId)}
                      className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <HeartHandshake className="w-4 h-4 text-emerald-400" />
                      <span>Accept Opportunity for NGO</span>
                    </button>
                  )}
                </div>
              );
            })}

            {availableOps.length === 0 && (
              <div className="col-span-2 py-16 text-center text-neutral-500 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                <p className="font-bold text-sm text-neutral-800">No open community opportunities currently</p>
                <p className="mt-0.5">Municipal sanitation and tree planting requests will appear here automatically.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'claimed' && (
          <div className="space-y-4">
            {claimedOps.map((op, idx) => {
              const opId = op.id || op.opportunityId || `claimed-op-${idx}`;
              const volunteersMobilized = op.requiredVolunteers || (op as any).registeredVolunteersCount || 12;

              return (
                <div key={opId} className="p-5 rounded-2xl border-2 border-emerald-300 bg-white shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          ACTIVE VOLUNTEER DRIVE
                        </span>
                        <span className="text-xs text-neutral-500">
                          {volunteersMobilized} Volunteers Mobilized
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-neutral-900">{op.title}</h3>
                      <p className="text-xs text-neutral-600 mt-1">{op.description}</p>
                    </div>
                  </div>

                  {completingId === opId ? (
                    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                      <h4 className="text-xs font-bold text-neutral-900">Upload Community Completion Proof</h4>
                      <textarea 
                        rows={2}
                        placeholder="Describe work completed (e.g. Cleared 200m of canal bank, planted 15 neem saplings)..."
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                        className="w-full p-2 text-xs rounded-lg border border-neutral-300"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleComplete(opId)}
                          className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition cursor-pointer"
                        >
                          Submit Photographic Proof & Close Drive
                        </button>
                        <button
                          onClick={() => setCompletingId(null)}
                          className="py-2 px-3 border border-neutral-300 text-xs rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCompletingId(opId)}
                      className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
                    >
                      Submit Completion Photos & Verify
                    </button>
                  )}
                </div>
              );
            })}

            {claimedOps.length === 0 && (
              <div className="py-12 text-center text-neutral-500 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs">
                <p className="font-bold text-sm text-neutral-800">No active volunteer drives underway</p>
                <p className="mt-0.5">Accept an available opportunity above to mobilize your team.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-3">
            {completedOps.map((op, idx) => {
              const opId = op.id || op.opportunityId || `completed-op-${idx}`;
              const leaderOrg = op.acceptedByOrgName || (op as any).claimedByOrgName || 'Accredited Civic Action NGO';
              const notes = (op as any).completionNotes || op.description || 'Initiative successfully verified and resolved.';

              return (
                <div key={opId} className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-800">COMPLETED & AUDITED</span>
                    </div>
                    <h3 className="font-bold text-sm text-neutral-900">{op.title}</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">{notes}</p>
                  </div>

                  <div className="text-xs text-neutral-500 text-right">
                    <span>Led by: <strong>{leaderOrg}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
