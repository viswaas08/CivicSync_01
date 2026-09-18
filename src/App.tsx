import React, { useState } from 'react';
import { CivicProvider, useCivic } from './context/CivicContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ComplaintDetailModal } from './components/ComplaintDetailModal';
import { ReportWizardModal } from './components/ReportWizardModal';
import { LandingPage } from './pages/LandingPage';
import { LiveRelayPage } from './pages/LiveRelayPage';
import { ProblemExplorerPage } from './pages/ProblemExplorerPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { GovernmentPortal } from './pages/GovernmentPortal';
import { CommunityPortal } from './pages/CommunityPortal';
import { InnovationPortal } from './pages/InnovationPortal';
import { AdminPortal } from './pages/AdminPortal';
import { UtilityCoordinationPage } from './pages/UtilityCoordinationPage';
import { CivicAdvisorModal } from './components/CivicAdvisorModal';
import { UnifiedLoginModal } from './components/UnifiedLoginModal';
import { Complaint } from './types';
import { Scale, Sparkles } from 'lucide-react';

function CivicAppContent() {
  const { currentUser, isAuthenticated, complaints } = useCivic();
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginReturnTo, setLoginReturnTo] = useState<string | null>(null);

  // Protected action: submitting or initiating a civic problem requires authentication
  const handleOpenReportModal = () => {
    if (!isAuthenticated || currentUser.verificationStatus === 'NOT_VERIFIED' || currentUser.uid === 'guest-cit-001' || currentUser.role === 'guest') {
      setLoginReturnTo('/report');
      setIsLoginModalOpen(true);
      return;
    }

    if (currentUser.accountStatus === 'SUSPENDED') {
      alert("Your account has been suspended. You cannot submit new problems. Contact support for assistance.");
      return;
    }

    if (currentUser.accountStatus === 'DISABLED') {
      alert("Your account has been disabled. Session terminated.");
      return;
    }

    setIsReportModalOpen(true);
  };

  const handleAuthSuccess = (returnTo?: string) => {
    setIsLoginModalOpen(false);
    if (returnTo === '/report') {
      setLoginReturnTo(null);
      setIsReportModalOpen(true);
    }
  };

  // When report succeeds, open detail view of the complaint
  const handleReportSuccess = (complaintId: string) => {
    const created = complaints.find(c => c.complaintId === complaintId);
    if (created) {
      setSelectedComplaint(created);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {/* Top Universal Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenReportModal={handleOpenReportModal}
        onOpenAdvisorModal={() => setIsAdvisorModalOpen(true)}
        onOpenLoginModal={() => {
          setLoginReturnTo(null);
          setIsLoginModalOpen(true);
        }}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {(currentView === 'home' || currentView === 'landing') && (
          <LandingPage
            onNavigate={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenReportModal={handleOpenReportModal}
            onSelectComplaint={(c) => setSelectedComplaint(c)}
          />
        )}

        {currentView === 'problems' && (
          <ProblemExplorerPage
            onSelectComplaint={(c) => setSelectedComplaint(c)}
            onOpenReportModal={handleOpenReportModal}
          />
        )}

        {currentView === 'live-relay' && (
          <LiveRelayPage
            onSelectComplaint={(c) => setSelectedComplaint(c)}
            onOpenReportModal={handleOpenReportModal}
          />
        )}

        {currentView === 'citizen' && (
          <CitizenDashboard
            onSelectComplaint={(c) => setSelectedComplaint(c)}
            onOpenReportModal={handleOpenReportModal}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
          />
        )}

        {currentView === 'government' && (
          <GovernmentPortal
            onSelectComplaint={(c) => setSelectedComplaint(c)}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
          />
        )}

        {currentView === 'community' && (
          <CommunityPortal
            onSelectComplaint={(c) => setSelectedComplaint(c)}
          />
        )}

        {currentView === 'innovation' && (
          <InnovationPortal />
        )}

        {currentView === 'admin' && (
          <AdminPortal />
        )}

        {currentView === 'utility-coordination' && (
          <UtilityCoordinationPage />
        )}
      </main>

      {/* Universal Footer */}
      <Footer
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Complaint Detail Dossier & Audit Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}

      {/* Step-by-Step Reporting Wizard */}
      {isReportModalOpen && (
        <ReportWizardModal
          onClose={() => setIsReportModalOpen(false)}
          onSuccess={handleReportSuccess}
        />
      )}

      {/* Municipal Rights & Bylaw Copilot Modal */}
      <CivicAdvisorModal
        isOpen={isAdvisorModalOpen}
        onClose={() => setIsAdvisorModalOpen(false)}
      />

      {/* Unified Identity & Login Modal (Section 7) */}
      <UnifiedLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setLoginReturnTo(null);
        }}
        returnTo={loginReturnTo || undefined}
        onAuthenticated={handleAuthSuccess}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Floating Civic Advisor Launcher Pill */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setIsAdvisorModalOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full shadow-lg border border-neutral-700 transition hover:scale-105 active:scale-95"
          title="Open Municipal Rights & Bylaw Copilot"
        >
          <div className="w-6 h-6 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center font-bold">
            <Scale className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold">Civic Rights Copilot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <CivicProvider>
      <CivicAppContent />
    </CivicProvider>
  );
}
