import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import { Complaint } from '../types';
import { checkSLAStatus } from '../services/slaEngine';
import { CommunityImpactSection } from '../components/CommunityImpactSection';
import { 
  User, 
  ShieldCheck, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ThumbsUp, 
  Star, 
  MapPin, 
  ArrowUpRight,
  HeartHandshake
} from 'lucide-react';

interface CitizenDashboardProps {
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenReportModal: () => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  onSelectComplaint,
  onOpenReportModal
}) => {
  const { currentUser, isAuthenticated, isProductionMode, complaints } = useCivic();
  const [activeTab, setActiveTab] = useState<'my_reports' | 'impact' | 'verification' | 'supported'>('my_reports');

  if (isProductionMode && (!isAuthenticated || currentUser.uid === 'guest-cit-001')) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white border border-neutral-200 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Citizen Sign-In Required</h2>
        <p className="text-sm text-neutral-600 max-w-md mx-auto">
          Please sign in with Google or your verified mobile number to view your reported grievances, track municipal SLA timelines, and confirm problem resolutions.
        </p>
      </div>
    );
  }

  const myReports = complaints.filter(c => c.citizenId === currentUser.uid);
  const pendingVerification = complaints.filter(c => c.citizenId === currentUser.uid && c.status === 'RESOLVED');
  const supportedReports = complaints.filter(c => c.supportedByCitizenIds?.includes(currentUser.uid) && c.citizenId !== currentUser.uid);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Citizen Profile Banner */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xl">
            {currentUser.displayName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-neutral-900">{currentUser.displayName}</h1>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Citizen
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              {currentUser.email} {currentUser.phone ? `• Mobile: ${currentUser.phone}` : ''}
            </p>
            <span className="inline-block text-[11px] text-neutral-400 mt-1">
              Public Progress. Private Identity — PII never exposed on open boards.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Report New Problem</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium">My Submitted Reports</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-neutral-900">{myReports.length}</span>
            <span className="text-xs text-neutral-400 font-mono">Civic Issues</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium">Pending My Sign-Off</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-emerald-700">{pendingVerification.length}</span>
            <span className="text-xs text-emerald-600 font-medium">Resolved by Govt</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium">Corroborated / Supported</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-blue-700">{supportedReports.length}</span>
            <span className="text-xs text-blue-600 font-medium">Community Backing</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-neutral-200 gap-6 text-sm font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('my_reports')}
          className={`py-3 border-b-2 transition whitespace-nowrap ${activeTab === 'my_reports' ? 'border-neutral-900 text-neutral-900 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
        >
          My Reports ({myReports.length})
        </button>

        <button
          onClick={() => setActiveTab('impact')}
          className={`py-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'impact' ? 'border-neutral-900 text-neutral-900 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
        >
          <HeartHandshake className="w-4 h-4 text-emerald-600" />
          <span>Community Impact & Volunteer Hours</span>
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`py-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'verification' ? 'border-neutral-900 text-neutral-900 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
        >
          <span>Sign-off & Verification</span>
          {pendingVerification.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingVerification.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('supported')}
          className={`py-3 border-b-2 transition whitespace-nowrap ${activeTab === 'supported' ? 'border-neutral-900 text-neutral-900 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
        >
          Supported Issues ({supportedReports.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'impact' && (
          <CommunityImpactSection />
        )}
        {activeTab === 'my_reports' && (
          <div className="space-y-3">
            {myReports.map((c) => {
              const slaInfo = checkSLAStatus(c.sla);
              return (
                <div
                  key={c.complaintId}
                  onClick={() => onSelectComplaint(c)}
                  className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-900 transition cursor-pointer shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                        #{c.complaintId}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-neutral-900 text-white">
                        {c.status}
                      </span>
                      <span className="text-xs font-semibold text-neutral-500">
                        {c.category}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-neutral-900 group-hover:text-emerald-700 transition">
                      {c.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        {c.locationSnapshot.wardName || c.locationSnapshot.localBodyName}
                      </span>
                      <span>•</span>
                      <span>Dept: <strong>{c.assignedDepartmentName}</strong></span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded font-semibold border ${slaInfo.badgeColor}`}>
                        {slaInfo.statusLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <span className="text-xs font-semibold text-neutral-900 group-hover:text-emerald-700 flex items-center gap-1">
                      <span>View Progress</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Submitted {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}

            {myReports.length === 0 && (
              <div className="py-16 text-center text-neutral-500 bg-neutral-50 rounded-2xl border border-neutral-200">
                <p className="font-bold text-base text-neutral-800">You have not submitted any complaints yet</p>
                <p className="text-xs mt-1">See a civic defect? Submit a report with photographic evidence.</p>
                <button
                  onClick={onOpenReportModal}
                  className="mt-4 px-4 py-2 bg-neutral-900 text-white font-semibold text-xs rounded-xl"
                >
                  Report a Problem Now
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Citizen Sign-Off Verification:</strong> The government department has marked the issues below as fixed. Inspect the uploaded before/after evidence to either Accept with a rating or Appeal to reopen.
              </p>
            </div>

            {pendingVerification.map((c) => (
              <div
                key={c.complaintId}
                onClick={() => onSelectComplaint(c)}
                className="p-5 rounded-2xl border-2 border-emerald-300 bg-white hover:border-emerald-600 transition cursor-pointer shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                      #{c.complaintId}
                    </span>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      RESOLVED — VERIFICATION PENDING
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-neutral-900">{c.title}</h3>
                  <p className="text-xs text-neutral-600 mt-1">
                    Action Taken: <strong>{c.resolution?.actionTaken || 'Restoration complete'}</strong>
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectComplaint(c);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl"
                >
                  Inspect & Verify Sign-Off
                </button>
              </div>
            ))}

            {pendingVerification.length === 0 && (
              <div className="py-12 text-center text-neutral-500 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                <p className="font-bold text-sm text-neutral-800">No pending verification sign-offs</p>
                <p className="mt-0.5">All your resolved issues have been completed and verified.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'supported' && (
          <div className="space-y-3">
            {supportedReports.map((c) => (
              <div
                key={c.complaintId}
                onClick={() => onSelectComplaint(c)}
                className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-900 transition cursor-pointer shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                      #{c.complaintId}
                    </span>
                    <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Corroborated Issue
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900">{c.title}</h3>
                  <p className="text-xs text-neutral-500">{c.locationSnapshot.wardName}</p>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{c.supportersCount} Supporters</span>
                </div>
              </div>
            ))}

            {supportedReports.length === 0 && (
              <div className="py-12 text-center text-neutral-500 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs">
                <p className="font-bold text-sm text-neutral-800">You haven't corroborated any other issues yet</p>
                <p className="mt-0.5">Explore open neighborhood issues and support them to raise city urgency.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
