import React, { useState } from 'react';
import { 
  User,
  GraduationCap,
  Building2, 
  MapPin, 
  ShieldCheck, 
  PlusCircle, 
  Users, 
  Lightbulb, 
  SlidersHorizontal, 
  UserCircle2, 
  Radio, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ChevronDown,
  Scale,
  Sparkles,
  KeyRound,
  Globe,
  LogOut,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { useCivic } from '../context/CivicContext';
import { UserRole } from '../types';
import { INDIAN_LANGUAGES } from '../services/i18n';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenReportModal: () => void;
  onOpenAdvisorModal?: () => void;
  onOpenLoginModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentView, 
  onNavigate, 
  onOpenReportModal, 
  onOpenAdvisorModal,
  onOpenLoginModal 
}) => {
  const { 
    currentUser, 
    isAuthenticated, 
    isProductionMode,
    switchRole, 
    loginUser, 
    signOutUser, 
    complaints, 
    language, 
    setLanguage, 
    t 
  } = useCivic();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Quick stats
  const activeCount = complaints.filter(c => c.status !== 'CLOSED' && c.status !== 'RESOLVED').length;
  const criticalCount = complaints.filter(c => c.priorityLevel === 'CRITICAL' && c.status !== 'CLOSED').length;

  const currentLangObj = INDIAN_LANGUAGES.find(l => l.code === language) || INDIAN_LANGUAGES[0];

  const handleSignOut = async () => {
    await signOutUser();
    setShowRoleMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-neutral-200">
      {/* Top Banner: National Governance & Statutory Standards */}
      <div className="bg-neutral-950 text-neutral-300 text-xs px-4 py-1.5 flex items-center justify-between border-b border-neutral-800">
        <div className="flex items-center gap-2 sm:gap-3 truncate">
          <span className="inline-flex items-center gap-1.5 font-medium text-white shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            🇮🇳 {t('appName')}
          </span>
          <span className="hidden sm:inline text-neutral-500">|</span>
          <span className="hidden md:inline text-neutral-300 truncate">
            {t('nationalBanner')}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-neutral-300 shrink-0">
          <span className="flex items-center gap-1 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{t('activeCases')}:</span>
            <strong className="text-white ml-0.5">{activeCount}</strong>
          </span>
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 text-red-400 font-medium text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              {criticalCount} {t('criticalIssues')}
            </span>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-sm group-hover:bg-neutral-800 transition">
            <Radio className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-xl text-neutral-900">CivicSync</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                India 🇮🇳
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 hidden sm:block">National SLA & Grievance Stack</p>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-neutral-700">
          <button
            onClick={() => onNavigate('landing')}
            className={`px-3 py-2 rounded-lg transition ${currentView === 'landing' ? 'text-neutral-900 bg-neutral-100 font-semibold' : 'hover:text-neutral-900 hover:bg-neutral-50'}`}
          >
            {t('overview')}
          </button>
          <button
            onClick={() => onNavigate('live-relay')}
            className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${currentView === 'live-relay' ? 'text-neutral-900 bg-neutral-100 font-semibold' : 'hover:text-neutral-900 hover:bg-neutral-50'}`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            {t('liveRelay')}
          </button>
          <button
            onClick={() => onNavigate('problems')}
            className={`px-3 py-2 rounded-lg transition ${currentView === 'problems' ? 'text-neutral-900 bg-neutral-100 font-semibold' : 'hover:text-neutral-900 hover:bg-neutral-50'}`}
          >
            {t('problemExplorer')}
          </button>
          <button
            onClick={() => onNavigate('utility-coordination')}
            className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${currentView === 'utility-coordination' ? 'text-neutral-900 bg-neutral-100 font-semibold' : 'hover:text-neutral-900 hover:bg-neutral-50'}`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Utility Digging NOC</span>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">180d</span>
          </button>
          
          {/* Demo Mode: Actor Persona Switcher */}
          {!isProductionMode && (
            <>
              <div className="h-4 w-px bg-neutral-200 mx-1"></div>
              <button
                onClick={() => { switchRole('citizen'); onNavigate('citizen'); }}
                className={`px-2.5 py-1.5 rounded-lg transition text-xs font-semibold ${currentView === 'citizen' ? 'text-blue-700 bg-blue-50' : 'text-neutral-600 hover:bg-neutral-50'}`}
              >
                {t('citizen')}
              </button>
              <button
                onClick={() => { switchRole('government_official'); onNavigate('government'); }}
                className={`px-2.5 py-1.5 rounded-lg transition text-xs font-semibold ${currentView === 'government' ? 'text-purple-700 bg-purple-50' : 'text-neutral-600 hover:bg-neutral-50'}`}
              >
                {t('government')}
              </button>
              <button
                onClick={() => { switchRole('ngo'); onNavigate('community'); }}
                className={`px-2.5 py-1.5 rounded-lg transition text-xs font-semibold ${currentView === 'community' ? 'text-emerald-700 bg-emerald-50' : 'text-neutral-600 hover:bg-neutral-50'}`}
              >
                {t('community')}
              </button>
              <button
                onClick={() => { switchRole('student'); onNavigate('innovation'); }}
                className={`px-2.5 py-1.5 rounded-lg transition text-xs font-semibold ${currentView === 'innovation' ? 'text-amber-700 bg-amber-50' : 'text-neutral-600 hover:bg-neutral-50'}`}
              >
                {t('innovation')}
              </button>
              <button
                onClick={() => { switchRole('admin'); onNavigate('admin'); }}
                className={`px-2.5 py-1.5 rounded-lg transition text-xs font-semibold ${currentView === 'admin' ? 'text-neutral-900 bg-neutral-200' : 'text-neutral-600 hover:bg-neutral-50'}`}
              >
                {t('adminGis')}
              </button>
            </>
          )}

          {/* Production Mode: Authentic User Portal Link (Strictly visible only if genuinely signed in) */}
          {isProductionMode && isAuthenticated && currentUser.uid !== 'guest-cit-001' && (
            <>
              <div className="h-4 w-px bg-neutral-200 mx-1"></div>
              {currentUser.role === 'citizen' && (
                <button
                  onClick={() => onNavigate('citizen')}
                  className={`px-3 py-1.5 rounded-lg transition text-xs font-bold flex items-center gap-1.5 ${currentView === 'citizen' ? 'text-blue-800 bg-blue-50 border border-blue-200 shadow-xs' : 'text-neutral-700 hover:bg-neutral-100'}`}
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>My Grievances</span>
                </button>
              )}
              {['government_official', 'supervisor', 'department_head', 'district_authority', 'state_authority'].includes(currentUser.role) && (
                <button
                  onClick={() => onNavigate('government')}
                  className={`px-3 py-1.5 rounded-lg transition text-xs font-bold flex items-center gap-1.5 ${currentView === 'government' ? 'text-purple-800 bg-purple-50 border border-purple-200 shadow-xs' : 'text-neutral-700 hover:bg-neutral-100'}`}
                >
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Official Portal</span>
                </button>
              )}
              {['ngo', 'volunteer'].includes(currentUser.role) && (
                <button
                  onClick={() => onNavigate('community')}
                  className={`px-3 py-1.5 rounded-lg transition text-xs font-bold flex items-center gap-1.5 ${currentView === 'community' ? 'text-emerald-800 bg-emerald-50 border border-emerald-200 shadow-xs' : 'text-neutral-700 hover:bg-neutral-100'}`}
                >
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Community Portal</span>
                </button>
              )}
              {['student', 'innovator'].includes(currentUser.role) && (
                <button
                  onClick={() => onNavigate('innovation')}
                  className={`px-3 py-1.5 rounded-lg transition text-xs font-bold flex items-center gap-1.5 ${currentView === 'innovation' ? 'text-amber-800 bg-amber-50 border border-amber-200 shadow-xs' : 'text-neutral-700 hover:bg-neutral-100'}`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Innovation Hub</span>
                </button>
              )}
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => onNavigate('admin')}
                  className={`px-3 py-1.5 rounded-lg transition text-xs font-bold flex items-center gap-1.5 ${currentView === 'admin' ? 'text-neutral-900 bg-neutral-200 border border-neutral-300 shadow-xs' : 'text-neutral-700 hover:bg-neutral-100'}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-800" />
                  <span>Admin & GIS</span>
                </button>
              )}
            </>
          )}
        </nav>

        {/* Right Section: Actions, Language Selector, Quick Demo Login, Sign In / Profile */}
        <div className="flex items-center gap-2">
          {/* Bylaw Advisor */}
          {onOpenAdvisorModal && (
            <button
              onClick={onOpenAdvisorModal}
              className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100/80 text-amber-900 text-xs font-semibold transition"
              title="Consult Municipal Rights & Bylaws"
            >
              <Scale className="w-3.5 h-3.5 text-amber-700" />
              <span>{t('bylawCopilot')}</span>
            </button>
          )}

          {/* Multilingual Selector */}
          <div className="relative">
            <button
              id="btn-language-selector"
              onClick={() => { setShowLanguageMenu(!showLanguageMenu); setShowRoleMenu(false); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-xs font-medium text-neutral-800 transition"
              title="Select Indian Language"
            >
              <Globe className="w-3.5 h-3.5 text-neutral-600" />
              <span className="font-semibold">{currentLangObj.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {showLanguageMenu && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-neutral-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1"
                onClick={() => setShowLanguageMenu(false)}
              >
                <div className="px-3 py-1.5 border-b border-neutral-100">
                  <p className="text-xs font-bold text-neutral-900">భారతీయ భాషలు (Indian Languages)</p>
                  <p className="text-[10px] text-neutral-500">Select language across platform</p>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {INDIAN_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`w-full text-left px-3 py-2 hover:bg-neutral-50 flex items-center justify-between text-xs transition ${language === lang.code ? 'bg-neutral-50 font-bold text-neutral-900' : 'text-neutral-700'}`}
                    >
                      <div>
                        <div className="font-semibold text-neutral-900">{lang.nativeName}</div>
                        <div className="text-[10px] text-neutral-400">{lang.name} ({lang.region})</div>
                      </div>
                      {language === lang.code && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Gemini Flash AI Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 text-emerald-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Gemini Flash</span>
          </div>

          {/* Primary Action: Report Grievance */}
          <button
            id="btn-report-problem-nav"
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">{t('reportProblem')}</span>
            <span className="sm:hidden">Report</span>
          </button>

          {/* User Profile & Sign Out / Login */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                id="btn-user-profile-menu"
                onClick={() => { setShowRoleMenu(!showRoleMenu); setShowLanguageMenu(false); }}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    className="w-7 h-7 rounded-full object-cover border border-neutral-300"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.displayName.charAt(0)}
                  </div>
                )}
                <div className="hidden md:block text-left pr-1 max-w-[110px]">
                  <div className="text-xs font-semibold text-neutral-900 truncate leading-none">
                    {currentUser.displayName.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-neutral-500 capitalize leading-tight mt-0.5 truncate">
                    {currentUser.role.replace('_', ' ')}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {showRoleMenu && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 z-50 animate-in fade-in slide-in-from-top-1"
                  onClick={() => setShowRoleMenu(false)}
                >
                  <div className="px-3.5 py-2.5 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-neutral-900">{currentUser.displayName}</p>
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {currentUser.verificationStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate">{currentUser.email || 'Verified Citizen Account'}</p>
                    {currentUser.designation && (
                      <p className="text-[10px] text-purple-700 font-medium mt-0.5">{currentUser.designation}</p>
                    )}
                  </div>

                  <div className="py-1">
                    {onOpenLoginModal && (
                      <button
                        onClick={onOpenLoginModal}
                        className="w-full text-left px-3.5 py-2 hover:bg-neutral-50 text-xs font-medium text-neutral-700 flex items-center gap-2"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Switch Account / OAuth Sign In</span>
                      </button>
                    )}

                    {/* Sign Out Button */}
                    <button
                      id="btn-signout"
                      onClick={handleSignOut}
                      className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-xs font-semibold text-red-600 flex items-center gap-2 border-t border-neutral-100 transition"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      <span>{t('signOut')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {onOpenLoginModal && (
                <button
                  id="btn-signin-nav"
                  onClick={onOpenLoginModal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold transition"
                >
                  <KeyRound className="w-3.5 h-3.5 text-neutral-700" />
                  <span>{t('signIn')}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
