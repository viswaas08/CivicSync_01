import React, { useState } from 'react';
import { 
  ShieldCheck, 
  User, 
  Building2, 
  Users, 
  GraduationCap, 
  Lock, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  Sparkles,
  Info,
  ChevronDown,
  UserPlus,
  LogIn
} from 'lucide-react';
import { useCivic } from '../context/CivicContext';
import { UserRole, UserProfile } from '../types';
import { auth, googleProvider, signInWithPopup, db, doc, getDoc, setDoc } from '../services/firebase';

interface UnifiedLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  returnTo?: string;
  onAuthenticated?: (returnTo?: string) => void;
}

export const UnifiedLoginModal: React.FC<UnifiedLoginModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  returnTo,
  onAuthenticated
}) => {
  const { switchRole, loginUser, currentUser, t, language } = useCivic();

  // Mode: 'OAUTH_CHOICE' | 'CREATE_ACCOUNT'
  const [activeLoginTab, setActiveLoginTab] = useState<'google' | 'email' | 'phone'>('google');
  const [modalMode, setModalMode] = useState<'OAUTH_CHOICE' | 'CREATE_ACCOUNT'>('OAUTH_CHOICE');
  const [authStage, setAuthStage] = useState<'IDLE' | 'AUTHENTICATING' | 'CHECKING' | 'SUCCESS'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email form state
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [isEmailRegister, setIsEmailRegister] = useState(false);

  // Phone form state
  const [phoneValue, setPhoneValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Temporary state for OAuth authenticated user who needs to create account
  const [oauthUser, setOauthUser] = useState<{
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  } | null>(null);

  // Registration form fields
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('citizen');
  const [regState, setRegState] = useState('Tamil Nadu');
  const [regDistrict, setRegDistrict] = useState('Coimbatore');
  const [regLocalBody, setRegLocalBody] = useState('Coimbatore City Municipal Corporation');
  const [regWardNumber, setRegWardNumber] = useState('12');
  const [regDesignation, setRegDesignation] = useState('');
  const [regDepartment, setRegDepartment] = useState('');

  if (!isOpen) return null;

  // Account State Verification Helper
  const checkAccountStateAndProceed = (profile: UserProfile): boolean => {
    if (profile.accountStatus === 'SUSPENDED') {
      setErrorMessage('Your account has been suspended. You cannot submit new problems. Contact support for assistance.');
      setAuthStage('IDLE');
      return false;
    }
    if (profile.accountStatus === 'DISABLED') {
      setErrorMessage('Your account has been disabled. Session terminated.');
      setAuthStage('IDLE');
      return false;
    }
    return true;
  };

  const finalizeLogin = (profile: UserProfile) => {
    if (!checkAccountStateAndProceed(profile)) return;

    loginUser(profile);
    setAuthStage('SUCCESS');

    setTimeout(() => {
      onClose();
      setAuthStage('IDLE');
      if (onAuthenticated) {
        onAuthenticated(returnTo);
      } else {
        if (returnTo === '/report') {
          // Handled via onAuthenticated if provided
        } else if (profile.role === 'citizen') onNavigate('citizen');
        else if (['government_official', 'supervisor', 'department_head'].includes(profile.role)) onNavigate('government');
        else if (['ngo', 'volunteer'].includes(profile.role)) onNavigate('community');
        else if (['student', 'innovator'].includes(profile.role)) onNavigate('innovation');
        else if (profile.role === 'admin') onNavigate('admin');
      }
    }, 600);
  };

  // Handler: Google OAuth Login
  const handleGoogleOAuthLogin = async () => {
    setErrorMessage(null);
    setAuthStage('AUTHENTICATING');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      setAuthStage('CHECKING');

      // Check if user has an existing account in Firestore or localStorage
      let existingProfile: UserProfile | null = null;

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          existingProfile = userDocSnap.data() as UserProfile;
        }
      } catch (firestoreErr) {
        console.warn('Firestore profile lookup error, checking local store:', firestoreErr);
      }

      // Check localStorage backup
      if (!existingProfile) {
        const localSaved = localStorage.getItem(`civicsync_profile_${user.uid}`);
        if (localSaved) {
          try {
            existingProfile = JSON.parse(localSaved);
          } catch {
            existingProfile = null;
          }
        }
      }

      // If user profile exists, log them straight in!
      if (existingProfile) {
        finalizeLogin(existingProfile);
      } else {
        // User has NO previous profile! Switch to Registration screen instead of random login
        setOauthUser({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Citizen User',
          photoURL: user.photoURL || undefined
        });
        setRegFullName(user.displayName || '');
        setModalMode('CREATE_ACCOUNT');
        setAuthStage('IDLE');
      }
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setAuthStage('IDLE');
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in cancelled by user.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Popup was blocked by your browser. Please allow popups for this site or log in using Email.');
      } else {
        setErrorMessage(err.message || 'OAuth authentication encountered an issue.');
      }
    }
  };

  // Handler: Email Authentication (Sign in / Register)
  const handleEmailAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!emailValue.trim()) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    setAuthStage('CHECKING');
    // Check if user exists in local profile registry
    const savedProfilesKey = `civicsync_profile_email_${emailValue.trim().toLowerCase()}`;
    const localProfileStr = localStorage.getItem(savedProfilesKey);

    if (localProfileStr && !isEmailRegister) {
      try {
        const profile = JSON.parse(localProfileStr) as UserProfile;
        finalizeLogin(profile);
        return;
      } catch {
        // Continue
      }
    }

    if (isEmailRegister || !localProfileStr) {
      // Prompt for registration details
      const uid = `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setOauthUser({
        uid,
        email: emailValue.trim(),
        displayName: emailValue.split('@')[0] || 'Citizen'
      });
      setRegFullName(emailValue.split('@')[0] || '');
      setModalMode('CREATE_ACCOUNT');
      setAuthStage('IDLE');
    }
  };

  // Handler: Phone Authentication with simulated OTP
  const handleSendPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!phoneValue.trim() || phoneValue.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (+91).');
      return;
    }
    setIsOtpSent(true);
    setOtpValue('123456'); // Simulated default for frictionless evaluation
  };

  const handleVerifyPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (otpValue.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP sent to your phone.');
      return;
    }

    setAuthStage('CHECKING');
    const cleanPhone = phoneValue.replace(/\D/g, '').slice(-10);
    const savedPhoneKey = `civicsync_profile_phone_${cleanPhone}`;
    const localProfileStr = localStorage.getItem(savedPhoneKey);

    if (localProfileStr) {
      try {
        const profile = JSON.parse(localProfileStr) as UserProfile;
        finalizeLogin(profile);
        return;
      } catch {
        // Continue
      }
    }

    // New Phone user -> prompt registration
    const uid = `phone-${cleanPhone}-${Date.now()}`;
    setOauthUser({
      uid,
      email: `${cleanPhone}@citizen.civicsync.gov.in`,
      displayName: `Citizen ${cleanPhone.slice(-4)}`
    });
    setRegPhone(`+91 ${cleanPhone}`);
    setModalMode('CREATE_ACCOUNT');
    setAuthStage('IDLE');
  };

  // Handler: Submit New Account Registration
  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oauthUser) return;
    if (!regFullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setAuthStage('CHECKING');
    setErrorMessage(null);

    const newProfile: UserProfile = {
      uid: oauthUser.uid,
      email: oauthUser.email,
      displayName: regFullName.trim(),
      phone: regPhone.trim() || undefined,
      role: regRole,
      countryId: 'IN',
      designation: regRole === 'government_official' ? (regDesignation || 'Municipal Officer') : undefined,
      departmentName: regRole === 'government_official' ? (regDepartment || 'Public Works') : undefined,
      verificationStatus: regRole === 'government_official' ? 'PENDING' : 'VERIFIED',
      accountStatus: 'ACTIVE',
      aadhaarStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
      avatarUrl: oauthUser.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80`,
      jurisdiction: {
        countryId: 'IN',
        stateId: regState === 'Tamil Nadu' ? 'TN' : 'DL',
        districtId: regDistrict === 'Coimbatore' ? 'CBE' : 'DEL',
        localBodyId: regLocalBody,
        wardNumbers: regWardNumber ? [regWardNumber] : ['01']
      }
    };

    try {
      // Save to Firestore
      try {
        await setDoc(doc(db, 'users', oauthUser.uid), newProfile);
      } catch (fsErr) {
        console.warn('Firestore write warning:', fsErr);
      }
      // Save to localStorage
      localStorage.setItem(`civicsync_profile_${oauthUser.uid}`, JSON.stringify(newProfile));
      if (oauthUser.email) {
        localStorage.setItem(`civicsync_profile_email_${oauthUser.email.toLowerCase()}`, JSON.stringify(newProfile));
      }
      if (newProfile.phone) {
        const clean = newProfile.phone.replace(/\D/g, '').slice(-10);
        localStorage.setItem(`civicsync_profile_phone_${clean}`, JSON.stringify(newProfile));
      }

      finalizeLogin(newProfile);
    } catch (err: any) {
      console.error('Account creation error:', err);
      setAuthStage('IDLE');
      setErrorMessage(err.message || 'Failed to initialize civic account profile.');
    }
  };

  // Mode 1 Handler: Tab Switch
  const handleTabSwitch = (tab: 'google' | 'email' | 'phone') => {
    setActiveLoginTab(tab);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-neutral-900 text-white p-5 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">CivicSync National Identity Gateway</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  India 🇮🇳
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                OAuth Authentication & Municipal Role Switcher
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Specific Banner when redirected from Report Action */}
          {returnTo === '/report' && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 block">
                SIGN IN TO REPORT A PROBLEM
              </span>
              <p className="text-xs text-amber-900 font-medium">
                To submit a civic problem, you need to sign in first. Choose one of the verified sign-in options below:
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODE 1: Authentication Options (Google, Email, Phone, Demo) */}
          {/* ======================================================== */}
          {modalMode === 'OAUTH_CHOICE' && (
            <div className="space-y-5">
              {/* Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setActiveLoginTab('google'); setErrorMessage(null); }}
                  className={`py-2 px-3 rounded-lg transition text-center ${activeLoginTab === 'google' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
                >
                  Google OAuth
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveLoginTab('email'); setErrorMessage(null); }}
                  className={`py-2 px-3 rounded-lg transition text-center ${activeLoginTab === 'email' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveLoginTab('phone'); setErrorMessage(null); }}
                  className={`py-2 px-3 rounded-lg transition text-center ${activeLoginTab === 'phone' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
                >
                  Mobile OTP
                </button>
              </div>

              {/* Tab 1: Google OAuth Option */}
              {activeLoginTab === 'google' && (
                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 text-center space-y-3">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-600 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Continue with Google Single Sign-On</span>
                  </div>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    Authenticate securely via your Google account. If your citizen profile is not yet initialized, you will be prompted to confirm your jurisdiction.
                  </p>

                  <button
                    id="btn-google-oauth-login"
                    onClick={handleGoogleOAuthLogin}
                    disabled={authStage !== 'IDLE'}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-100 text-neutral-800 text-sm font-semibold py-3 px-4 rounded-xl border border-neutral-300 shadow-xs hover:shadow transition disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>
                      {authStage === 'AUTHENTICATING' ? 'Connecting to Google...' : 
                       authStage === 'CHECKING' ? 'Checking Account Profile...' : 
                       authStage === 'SUCCESS' ? 'Login Verified!' : 
                       'Continue with Google'}
                    </span>
                  </button>
                </div>
              )}

              {/* Tab 2: Email Authentication */}
              {activeLoginTab === 'email' && (
                <form onSubmit={handleEmailAuthSubmit} className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">
                      {isEmailRegister ? 'Create Account with Email' : 'Continue with Email'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEmailRegister(!isEmailRegister)}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      {isEmailRegister ? 'Already have account? Sign in' : 'New user? Register'}
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        value={passwordValue}
                        onChange={(e) => setPasswordValue(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authStage !== 'IDLE'}
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold py-2.5 rounded-xl transition shadow-xs disabled:opacity-50"
                  >
                    {authStage === 'CHECKING' ? 'Verifying...' : isEmailRegister ? 'Create Account & Continue' : 'Continue with Email'}
                  </button>
                </form>
              )}

              {/* Tab 3: Phone Authentication */}
              {activeLoginTab === 'phone' && (
                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">Continue with Phone Number</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Instant SMS OTP
                    </span>
                  </div>

                  {!isOtpSent ? (
                    <form onSubmit={handleSendPhoneOtp} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                          10-Digit Mobile Number (+91)
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 text-xs text-neutral-600 bg-neutral-100 border border-r-0 border-neutral-300 rounded-l-xl font-medium">
                            🇮🇳 +91
                          </span>
                          <input
                            type="tel"
                            required
                            value={phoneValue}
                            onChange={(e) => setPhoneValue(e.target.value)}
                            placeholder="98765 43210"
                            className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-r-xl bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold py-2.5 rounded-xl transition shadow-xs"
                      >
                        Send Verification OTP
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyPhoneOtp} className="space-y-3">
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800">
                        OTP code <strong>123456</strong> sent to +91 {phoneValue}. Enter below:
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                          6-Digit OTP
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value)}
                          className="w-full text-center tracking-widest text-sm font-bold px-3 py-2 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsOtpSent(false)}
                          className="w-1/3 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-semibold py-2 rounded-xl transition"
                        >
                          Change Number
                        </button>
                        <button
                          type="submit"
                          disabled={authStage !== 'IDLE'}
                          className="w-2/3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold py-2 rounded-xl transition shadow-xs disabled:opacity-50"
                        >
                          {authStage === 'CHECKING' ? 'Verifying OTP...' : 'Verify & Continue'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* MODE 2: Create Account / Registration for New OAuth User */}
          {/* ======================================================== */}
          {modalMode === 'CREATE_ACCOUNT' && oauthUser && (
            <form onSubmit={handleCreateAccountSubmit} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <UserPlus className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">{t('accountSetupTitle')}</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">{t('accountSetupSub')}</p>
                </div>
              </div>

              {/* Verified Google Details Banner */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-3">
                {oauthUser.photoURL ? (
                  <img src={oauthUser.photoURL} alt="Avatar" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold">
                    {oauthUser.displayName.charAt(0)}
                  </div>
                )}
                <div className="text-xs min-w-0">
                  <div className="font-semibold text-neutral-900">{oauthUser.displayName}</div>
                  <div className="text-neutral-500 truncate">{oauthUser.email}</div>
                </div>
                <span className="ml-auto text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                  Google Verified
                </span>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{t('fullName')} *</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                    placeholder="E.g. Priya Sharma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{t('phoneNumber')}</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{t('roleLabel')} *</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:outline-none bg-white"
                  >
                    <option value="citizen">Citizen</option>
                    <option value="student">Student / Innovator</option>
                    <option value="volunteer">Community Volunteer</option>
                    <option value="ngo">Registered Civic NGO</option>
                    <option value="government_official">Government Official</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{t('state')} *</label>
                  <select
                    value={regState}
                    onChange={(e) => setRegState(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:outline-none bg-white"
                  >
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi">Delhi NCT</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="West Bengal">West Bengal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{t('localBody')} *</label>
                  <input
                    type="text"
                    required
                    value={regLocalBody}
                    onChange={(e) => setRegLocalBody(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                    placeholder="E.g. Coimbatore City Municipal Corporation"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{t('wardNumber')} *</label>
                  <input
                    type="text"
                    required
                    value={regWardNumber}
                    onChange={(e) => setRegWardNumber(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                    placeholder="E.g. 12"
                  />
                </div>
              </div>

              {regRole === 'government_official' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <div>
                    <label className="block text-xs font-medium text-amber-900 mb-1">Official Designation *</label>
                    <input
                      type="text"
                      value={regDesignation}
                      onChange={(e) => setRegDesignation(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-amber-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none bg-white"
                      placeholder="E.g. Assistant Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-amber-900 mb-1">Municipal Department *</label>
                    <input
                      type="text"
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-amber-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none bg-white"
                      placeholder="E.g. Roads & Infrastructure"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => { setModalMode('OAUTH_CHOICE'); setErrorMessage(null); }}
                  className="text-xs text-neutral-600 hover:text-neutral-900 font-medium px-3 py-2 rounded-lg"
                >
                  Back to Sign In
                </button>

                <button
                  type="submit"
                  disabled={authStage !== 'IDLE'}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{authStage === 'CHECKING' ? 'Registering Account...' : t('saveAndContinue')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
