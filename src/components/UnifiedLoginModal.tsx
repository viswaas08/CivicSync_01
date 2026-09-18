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
  LogIn,
  Zap,
  Phone,
  Mail,
  Award,
  ChevronRight,
  Fingerprint,
  BadgeCheck
} from 'lucide-react';
import { useCivic } from '../context/CivicContext';
import { UserRole, UserProfile } from '../types';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  db, 
  doc, 
  getDoc, 
  setDoc 
} from '../services/firebase';

interface UnifiedLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  returnTo?: string;
  onAuthenticated?: (returnTo?: string) => void;
}

export const QUICK_PERSONA_PROFILES: {
  role: UserRole;
  title: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  jurisdiction: string;
  badge: string;
  badgeColor: string;
  avatarUrl: string;
  description: string;
}[] = [
  {
    role: 'citizen',
    title: 'Verified Citizen',
    name: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    jurisdiction: 'Peelamedu (Ward 12), Coimbatore',
    badge: 'Aadhaar Verified',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    description: 'Report civic issues, monitor SLAs, rate resolutions, and track municipal escrow.'
  },
  {
    role: 'government_official',
    title: 'Field Engineer (Official)',
    name: 'Er. Rajesh Kumar',
    email: 'official@ccmc.gov.in',
    designation: 'Assistant Engineer',
    department: 'Roads, Bridges & Infrastructure',
    jurisdiction: 'East Zone, CCMC Coimbatore',
    badge: 'Gazetted Official',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    description: 'Inspect assigned ward problems, upload geotagged resolution proof, and request SLA extensions.'
  },
  {
    role: 'supervisor',
    title: 'Zonal Supervisor',
    name: 'K. Sundaramoorthy',
    email: 'supervisor@ccmc.gov.in',
    designation: 'Zonal Engineering Supervisor',
    department: 'Municipal Operations',
    jurisdiction: 'CCMC East Zone (Wards 10-25)',
    badge: 'Level-2 Authority',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    description: 'Manage inter-ward engineer allocations, review breached SLAs, and authorize statutory extensions.'
  },
  {
    role: 'department_head',
    title: 'Municipal Department Head',
    name: 'Dr. S. Ramanathan',
    email: 'depthead@ccmc.gov.in',
    designation: 'Chief Municipal Engineer',
    department: 'Solid Waste & Works Administration',
    jurisdiction: 'Coimbatore Corporation Headquarters',
    badge: 'Executive Head',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
    description: 'City-wide resource allocation, department-level SLA performance analytics, and emergency bypasses.'
  },
  {
    role: 'ngo',
    title: 'Civic NGO Lead',
    name: 'Ananya Swaminathan',
    email: 'contact@civicaction.org',
    designation: 'Executive Director',
    department: 'Kovai Civic Action Forum',
    jurisdiction: 'Coimbatore Urban District',
    badge: 'Accredited NGO',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    description: 'Adopt pending municipal grievances for collaborative citizen action and CSR co-funding.'
  },
  {
    role: 'student',
    title: 'Student / Innovator',
    name: 'Karthik Raja',
    email: 'innovator@civictech.in',
    designation: 'Research Fellow',
    department: 'PSG College of Technology - Innovation Cell',
    jurisdiction: 'Tamil Nadu Innovation Network',
    badge: 'Smart City Innovator',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80',
    description: 'Submit IoT/AI solutions to municipal challenges, compete for innovation grants and pilot trials.'
  },
  {
    role: 'admin',
    title: 'System Administrator',
    name: 'Govind Balakrishnan',
    email: 'admin@civicsync.org',
    designation: 'Chief Platform Administrator',
    department: 'Directorate of Municipal Administration',
    jurisdiction: 'National Statutory Control & GIS',
    badge: 'Super Admin',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&q=80',
    description: 'Manage GIS boundaries, authoritative gazette datasets, departmental routing tables, and SLA parameters.'
  }
];

export const UnifiedLoginModal: React.FC<UnifiedLoginModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  returnTo,
  onAuthenticated
}) => {
  const { loginUser, t } = useCivic();

  // Mode: 'OAUTH_CHOICE' | 'CREATE_ACCOUNT'
  const [activeLoginTab, setActiveLoginTab] = useState<'roles' | 'phone' | 'aadhaar' | 'sso' | 'email'>('roles');
  const [modalMode, setModalMode] = useState<'OAUTH_CHOICE' | 'CREATE_ACCOUNT'>('OAUTH_CHOICE');
  const [authStage, setAuthStage] = useState<'IDLE' | 'AUTHENTICATING' | 'CHECKING' | 'SUCCESS'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email form state
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [isEmailRegister, setIsEmailRegister] = useState(false);

  // Phone form state
  const [phoneValue, setPhoneValue] = useState('9876543210');
  const [otpValue, setOtpValue] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  // DigiLocker / Aadhaar form state
  const [aadhaarInput, setAadhaarInput] = useState('5489 1240 8821');
  const [aadhaarName, setAadhaarName] = useState('Priya Sharma');
  const [aadhaarConsent, setAadhaarConsent] = useState(true);
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [isAadhaarOtpSent, setIsAadhaarOtpSent] = useState(false);

  // Municipal SSO form state
  const [ssoGovEmail, setSsoGovEmail] = useState('official@ccmc.gov.in');
  const [ssoEmployeeId, setSsoEmployeeId] = useState('TN-CCMC-2024-8841');
  const [ssoFullName, setSsoFullName] = useState('Er. Rajesh Kumar');
  const [ssoDepartment, setSsoDepartment] = useState('Roads, Bridges & Infrastructure');
  const [ssoDesignation, setSsoDesignation] = useState('Assistant Engineer (AE)');
  const [ssoLocalBody, setSsoLocalBody] = useState('Coimbatore City Municipal Corporation');
  const [ssoWard, setSsoWard] = useState('12');

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
    }, 500);
  };

  // Handler: Instant Quick Persona Login
  const handleQuickPersonaLogin = (persona: typeof QUICK_PERSONA_PROFILES[0]) => {
    setErrorMessage(null);
    setAuthStage('CHECKING');

    const profile: UserProfile = {
      uid: `usr-${persona.role}-${Date.now().toString(36)}`,
      email: persona.email,
      displayName: persona.name,
      role: persona.role,
      countryId: 'IN',
      designation: persona.designation,
      departmentName: persona.department,
      verificationStatus: 'VERIFIED',
      accountStatus: 'ACTIVE',
      aadhaarStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
      avatarUrl: persona.avatarUrl,
      jurisdiction: {
        countryId: 'IN',
        stateId: 'TN',
        districtId: 'CBE',
        localBodyId: 'Coimbatore City Municipal Corporation',
        wardNumbers: ['12', '72']
      }
    };

    // Save profile cache
    localStorage.setItem(`civicsync_profile_${profile.uid}`, JSON.stringify(profile));
    localStorage.setItem(`civicsync_profile_email_${profile.email.toLowerCase()}`, JSON.stringify(profile));

    finalizeLogin(profile);
  };

  // Handler: Demo Google Citizen Instant Sign-In (Fallback when Firebase OAuth popup is restricted)
  const handleDemoGoogleLogin = (role: UserRole = 'citizen') => {
    setErrorMessage(null);
    setAuthStage('CHECKING');

    const profile: UserProfile = role === 'government_official' ? {
      uid: `google-gov-${Date.now().toString(36)}`,
      email: 'rajesh.kumar.ccmc@gmail.com',
      displayName: 'Er. Rajesh Kumar',
      role: 'government_official',
      countryId: 'IN',
      designation: 'Assistant Engineer',
      departmentName: 'Roads, Bridges & Infrastructure',
      verificationStatus: 'VERIFIED',
      accountStatus: 'ACTIVE',
      aadhaarStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      jurisdiction: {
        countryId: 'IN',
        stateId: 'TN',
        districtId: 'CBE',
        localBodyId: 'Coimbatore City Municipal Corporation',
        wardNumbers: ['12']
      }
    } : {
      uid: `google-cit-${Date.now().toString(36)}`,
      email: 'priya.sharma.cit@gmail.com',
      displayName: 'Priya Sharma',
      role: 'citizen',
      countryId: 'IN',
      verificationStatus: 'VERIFIED',
      accountStatus: 'ACTIVE',
      aadhaarStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      jurisdiction: {
        countryId: 'IN',
        stateId: 'TN',
        districtId: 'CBE',
        localBodyId: 'Coimbatore City Municipal Corporation',
        wardNumbers: ['12']
      }
    };

    finalizeLogin(profile);
  };

  // Handler: Firebase Google OAuth Login
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
        // Switch to Registration screen with Google details prefilled
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
        setErrorMessage('Google Sign-In cancelled: Popup was closed.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Popup was blocked by your browser. Please allow popups or use Instant Demo Google Login below.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMessage('Domain (localhost) is not yet added to Firebase Authorized Domains. Use Instant Demo Google Login below.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMessage('Google provider is not enabled in Firebase Console. Use Instant Demo Google Login below.');
      } else {
        setErrorMessage(err.message || 'OAuth authentication encountered an issue.');
      }
    }
  };

  // Handler: Email Authentication (Sign in / Register)
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!emailValue.trim()) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!passwordValue || passwordValue.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setAuthStage('CHECKING');
    const cleanEmail = emailValue.trim().toLowerCase();

    try {
      let firebaseUser: any = null;
      try {
        if (isEmailRegister) {
          const res = await createUserWithEmailAndPassword(auth, cleanEmail, passwordValue);
          firebaseUser = res.user;
        } else {
          const res = await signInWithEmailAndPassword(auth, cleanEmail, passwordValue);
          firebaseUser = res.user;
        }
      } catch (fbAuthErr: any) {
        console.warn('Firebase email auth response:', fbAuthErr);
        if (fbAuthErr.code === 'auth/wrong-password' || fbAuthErr.code === 'auth/invalid-credential') {
          setAuthStage('IDLE');
          setErrorMessage('Invalid email or password. Please verify credentials or switch to Register.');
          return;
        }
        if (fbAuthErr.code === 'auth/email-already-in-use') {
          setAuthStage('IDLE');
          setErrorMessage('This email is already registered. Please click "Already have account? Sign in".');
          return;
        }
      }

      // Check Firestore
      let existingProfile: UserProfile | null = null;
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            existingProfile = snap.data() as UserProfile;
          }
        } catch {}
      }

      // Check localStorage
      if (!existingProfile) {
        const savedKey = `civicsync_profile_email_${cleanEmail}`;
        const localStr = localStorage.getItem(savedKey);
        if (localStr) {
          try {
            existingProfile = JSON.parse(localStr) as UserProfile;
          } catch {}
        }
      }

      // Check quick presets
      if (!existingProfile) {
        const matchingQuick = QUICK_PERSONA_PROFILES.find(p => p.email.toLowerCase() === cleanEmail);
        if (matchingQuick) {
          handleQuickPersonaLogin(matchingQuick);
          return;
        }
      }

      if (existingProfile && !isEmailRegister) {
        finalizeLogin(existingProfile);
        return;
      }

      // New user registration flow
      const uid = firebaseUser?.uid || `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setOauthUser({
        uid,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0] || 'Citizen'
      });
      setRegFullName(cleanEmail.split('@')[0] || '');
      setModalMode('CREATE_ACCOUNT');
      setAuthStage('IDLE');
    } catch (err: any) {
      console.error('Email authentication error:', err);
      setAuthStage('IDLE');
      setErrorMessage(err.message || 'Email authentication failed. Please try again.');
    }
  };

  // Handler: Phone Authentication with simulated instant OTP
  const handleSendPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!phoneValue.trim() || phoneValue.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (+91).');
      return;
    }
    setIsOtpSent(true);
    setOtpValue('123456'); // Simulated default OTP
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
      } catch {}
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

  // Handler: Send DigiLocker / Aadhaar OTP
  const handleSendAadhaarOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!aadhaarConsent) {
      setErrorMessage('Statutory citizen consent is required for UIDAI / DigiLocker e-KYC verification.');
      return;
    }
    const clean = aadhaarInput.replace(/\s/g, '');
    if (clean.length !== 12 || !/^\d+$/.test(clean)) {
      setErrorMessage('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    setIsAadhaarOtpSent(true);
    setAadhaarOtp('999888');
  };

  // Handler: Verify DigiLocker / Aadhaar OTP
  const handleVerifyAadhaarOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (aadhaarOtp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit UIDAI verification OTP.');
      return;
    }

    setAuthStage('CHECKING');
    const cleanAadhaar = aadhaarInput.replace(/\s/g, '');
    const profile: UserProfile = {
      uid: `uidai-${cleanAadhaar.slice(-4)}-${Date.now().toString(36)}`,
      email: `${aadhaarName.toLowerCase().replace(/\s+/g, '.')}@citizen.civicsync.in`,
      displayName: aadhaarName || 'Verified Aadhaar Citizen',
      role: 'citizen',
      countryId: 'IN',
      verificationStatus: 'VERIFIED',
      accountStatus: 'ACTIVE',
      aadhaarStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      jurisdiction: {
        countryId: 'IN',
        stateId: 'TN',
        districtId: 'CBE',
        localBodyId: 'Coimbatore City Municipal Corporation',
        wardNumbers: ['12']
      }
    };

    localStorage.setItem(`civicsync_profile_${profile.uid}`, JSON.stringify(profile));
    localStorage.setItem(`civicsync_profile_email_${profile.email.toLowerCase()}`, JSON.stringify(profile));
    finalizeLogin(profile);
  };

  // Handler: Municipal SSO Login
  const handleMunicipalSsoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const email = ssoGovEmail.trim().toLowerCase();
    if (!email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid official municipal email address.');
      return;
    }

    setAuthStage('CHECKING');

    let assignedRole: UserRole = 'government_official';
    const lowerDesig = ssoDesignation.toLowerCase();
    if (lowerDesig.includes('supervisor') || lowerDesig.includes('zonal')) {
      assignedRole = 'supervisor';
    } else if (lowerDesig.includes('head') || lowerDesig.includes('chief') || lowerDesig.includes('commissioner')) {
      assignedRole = 'department_head';
    }

    const profile: UserProfile = {
      uid: `gov-sso-${ssoEmployeeId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`,
      email: email,
      displayName: ssoFullName,
      role: assignedRole,
      countryId: 'IN',
      designation: ssoDesignation,
      departmentName: ssoDepartment,
      verificationStatus: 'VERIFIED',
      accountStatus: 'ACTIVE',
      aadhaarStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      jurisdiction: {
        countryId: 'IN',
        stateId: 'TN',
        districtId: 'CBE',
        localBodyId: ssoLocalBody,
        wardNumbers: [ssoWard]
      }
    };

    localStorage.setItem(`civicsync_profile_${profile.uid}`, JSON.stringify(profile));
    localStorage.setItem(`civicsync_profile_email_${profile.email.toLowerCase()}`, JSON.stringify(profile));
    finalizeLogin(profile);
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
      departmentName: regRole === 'government_official' ? (regDepartment || 'Public Works & Roads') : undefined,
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
        wardNumbers: regWardNumber ? [regWardNumber] : ['12']
      }
    };

    try {
      try {
        await setDoc(doc(db, 'users', oauthUser.uid), newProfile);
      } catch (fsErr) {
        console.warn('Firestore write warning:', fsErr);
      }
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Modal Header */}
        <div className="bg-neutral-950 text-white p-5 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">CivicSync Identity Gateway</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  India 🇮🇳
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Firebase OAuth, Email, Mobile OTP & 1-Click Role Access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Specific Banner when redirected from Report Action */}
          {returnTo === '/report' && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 block">
                AUTHENTICATION REQUIRED TO REPORT
              </span>
              <p className="text-xs text-amber-900 font-medium">
                To submit and sign a statutory civic grievance, select any verified sign-in option below:
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
              <div className="pt-2 border-t border-red-200/60 flex items-center justify-between">
                <span className="text-[11px] text-red-600 font-medium">Don't wait on external services:</span>
                <button
                  type="button"
                  onClick={() => handleDemoGoogleLogin('citizen')}
                  className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition"
                >
                  ⚡ Instant Demo Sign-In
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODE 1: Authentication Options */}
          {/* ======================================================== */}
          {modalMode === 'OAUTH_CHOICE' && (
            <div className="space-y-4">
              {/* Method Selector Tabs */}
              <div className="grid grid-cols-5 gap-1 p-1 bg-neutral-100 rounded-xl text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => { setActiveLoginTab('roles'); setErrorMessage(null); }}
                  className={`py-2 px-1 rounded-lg transition text-center flex flex-col sm:flex-row items-center justify-center gap-1 ${activeLoginTab === 'roles' ? 'bg-white text-neutral-900 shadow-xs font-bold' : 'text-neutral-600 hover:text-neutral-900'}`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">Personas</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveLoginTab('aadhaar'); setErrorMessage(null); }}
                  className={`py-2 px-1 rounded-lg transition text-center flex flex-col sm:flex-row items-center justify-center gap-1 ${activeLoginTab === 'aadhaar' ? 'bg-white text-neutral-900 shadow-xs font-bold' : 'text-neutral-600 hover:text-neutral-900'}`}
                >
                  <Fingerprint className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">DigiLocker</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveLoginTab('sso'); setErrorMessage(null); }}
                  className={`py-2 px-1 rounded-lg transition text-center flex flex-col sm:flex-row items-center justify-center gap-1 ${activeLoginTab === 'sso' ? 'bg-white text-neutral-900 shadow-xs font-bold' : 'text-neutral-600 hover:text-neutral-900'}`}
                >
                  <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">Officer SSO</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveLoginTab('phone'); setErrorMessage(null); }}
                  className={`py-2 px-1 rounded-lg transition text-center flex flex-col sm:flex-row items-center justify-center gap-1 ${activeLoginTab === 'phone' ? 'bg-white text-neutral-900 shadow-xs font-bold' : 'text-neutral-600 hover:text-neutral-900'}`}
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">Mobile OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveLoginTab('email'); setErrorMessage(null); }}
                  className={`py-2 px-1 rounded-lg transition text-center flex flex-col sm:flex-row items-center justify-center gap-1 ${activeLoginTab === 'email' ? 'bg-white text-neutral-900 shadow-xs font-bold' : 'text-neutral-600 hover:text-neutral-900'}`}
                >
                  <Mail className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">Email/Auth</span>
                </button>
              </div>

              {/* TAB 0: 1-Click Quick Role Access (Primary solution for evaluation & testing) */}
              {activeLoginTab === 'roles' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Select Verified Role to Sign In</span>
                    </span>
                    <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-medium">
                      Zero configuration needed
                    </span>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                    {QUICK_PERSONA_PROFILES.map((persona) => (
                      <div
                        key={persona.email}
                        onClick={() => handleQuickPersonaLogin(persona)}
                        className="group p-3 bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200 hover:border-neutral-300 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={persona.avatarUrl}
                            alt={persona.name}
                            className="w-10 h-10 rounded-full object-cover border border-neutral-300 shrink-0 group-hover:scale-105 transition"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-neutral-900 truncate">{persona.name}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${persona.badgeColor} shrink-0`}>
                                {persona.badge}
                              </span>
                            </div>
                            <p className="text-[11px] font-medium text-neutral-700 truncate mt-0.5">
                              {persona.title} {persona.department && `• ${persona.department}`}
                            </p>
                            <p className="text-[10px] text-neutral-500 truncate">
                              {persona.jurisdiction}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 text-neutral-400 group-hover:text-neutral-900 transition">
                          <span className="text-[11px] font-semibold hidden sm:inline">Sign In</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 1: Google OAuth Option */}
              {activeLoginTab === 'google' && (
                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 text-center space-y-4">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-600 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Continue with Google Single Sign-On</span>
                  </div>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    Authenticate securely using your Google account via Firebase OAuth. If your civic profile is not yet initialized, you will confirm your municipal jurisdiction.
                  </p>

                  <button
                    id="btn-google-oauth-login"
                    onClick={handleGoogleOAuthLogin}
                    disabled={authStage !== 'IDLE'}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-100 text-neutral-800 text-sm font-semibold py-3 px-4 rounded-xl border border-neutral-300 shadow-xs hover:shadow transition disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>
                      {authStage === 'AUTHENTICATING' ? 'Connecting to Google...' : 
                       authStage === 'CHECKING' ? 'Checking Account Profile...' : 
                       authStage === 'SUCCESS' ? 'Login Verified!' : 
                       'Launch Google OAuth Popup'}
                    </span>
                  </button>

                  {/* Resilient Instant Demo Google Fallback */}
                  <div className="pt-3 border-t border-neutral-200/80 space-y-2">
                    <p className="text-[11px] text-neutral-500 font-medium">
                      Testing locally without Google OAuth popup?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleDemoGoogleLogin('citizen')}
                        className="py-2 px-3 bg-white hover:bg-neutral-100 text-neutral-800 rounded-lg border border-neutral-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>Instant Google Citizen</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDemoGoogleLogin('government_official')}
                        className="py-2 px-3 bg-white hover:bg-neutral-100 text-neutral-800 rounded-lg border border-neutral-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <Building2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>Instant Google Officer</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Email Authentication */}
              {activeLoginTab === 'email' && (
                <form onSubmit={handleEmailAuthSubmit} className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">
                      {isEmailRegister ? 'Register Civic Account with Email' : 'Sign In with Email & Password'}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setIsEmailRegister(!isEmailRegister); setErrorMessage(null); }}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      {isEmailRegister ? 'Already registered? Sign In' : 'New user? Register'}
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
                        placeholder="official@ccmc.gov.in or citizen@gmail.com"
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
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold py-2.5 rounded-xl transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{authStage === 'CHECKING' ? 'Authenticating...' : isEmailRegister ? 'Create Account & Continue' : 'Sign In with Email'}</span>
                  </button>

                  {/* Pre-filled credentials helper */}
                  <div className="pt-2.5 border-t border-neutral-200/70">
                    <p className="text-[10px] text-neutral-500 mb-1.5 font-medium">Quick Credentials Helper (Click to fill):</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setEmailValue('official@ccmc.gov.in'); setPasswordValue('password123'); setIsEmailRegister(false); }}
                        className="text-[10px] px-2 py-1 bg-white hover:bg-neutral-100 rounded border border-neutral-200 text-purple-700 font-medium"
                      >
                        Field Officer (official@ccmc.gov.in)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEmailValue('priya.sharma@gmail.com'); setPasswordValue('password123'); setIsEmailRegister(false); }}
                        className="text-[10px] px-2 py-1 bg-white hover:bg-neutral-100 rounded border border-neutral-200 text-blue-700 font-medium"
                      >
                        Citizen (priya.sharma@gmail.com)
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 3: Phone Authentication */}
              {activeLoginTab === 'phone' && (
                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">Mobile Number Authentication</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                      Instant SMS OTP
                    </span>
                  </div>

                  {!isOtpSent ? (
                    <form onSubmit={handleSendPhoneOtp} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                          10-Digit Indian Mobile Number (+91)
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
                        Send Verification SMS OTP
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyPhoneOtp} className="space-y-3">
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex items-center justify-between">
                        <span>OTP code <strong>123456</strong> sent to +91 {phoneValue}</span>
                        <button
                          type="button"
                          onClick={() => setOtpValue('123456')}
                          className="underline text-[10px] font-bold text-emerald-900"
                        >
                          Auto-fill
                        </button>
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

              {/* TAB 4: DigiLocker / Aadhaar Authentication */}
              {activeLoginTab === 'aadhaar' && (
                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-neutral-800">DigiLocker / Aadhaar e-KYC</span>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                      UIDAI Gateway 🇮🇳
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Verify statutory identity to submit certified civic grievances and track municipal escrows.
                  </p>

                  {!isAadhaarOtpSent ? (
                    <form onSubmit={handleSendAadhaarOtp} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                          Full Name (As on Aadhaar)
                        </label>
                        <input
                          type="text"
                          required
                          value={aadhaarName}
                          onChange={(e) => setAadhaarName(e.target.value)}
                          placeholder="Priya Sharma"
                          className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                          12-Digit Aadhaar Number
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={14}
                          value={aadhaarInput}
                          onChange={(e) => setAadhaarInput(e.target.value)}
                          placeholder="5489 1240 8821"
                          className="w-full font-mono tracking-wider text-xs px-3 py-2 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>

                      <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200/80 flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="aadhaar-consent"
                          checked={aadhaarConsent}
                          onChange={(e) => setAadhaarConsent(e.target.checked)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-0"
                        />
                        <label htmlFor="aadhaar-consent" className="text-[10px] text-blue-900 leading-tight">
                          I hereby consent to CivicSync fetching my KYC status via DigiLocker / UIDAI solely for statutory civic grievance submission and grievance verification.
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2"
                      >
                        <BadgeCheck className="w-4 h-4" />
                        <span>Request UIDAI e-KYC OTP</span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyAadhaarOtp} className="space-y-3">
                      <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-blue-800 flex items-center justify-between">
                        <span>OTP code <strong>999888</strong> dispatched to linked mobile</span>
                        <button
                          type="button"
                          onClick={() => setAadhaarOtp('999888')}
                          className="underline text-[10px] font-bold text-blue-900"
                        >
                          Auto-fill
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                          6-Digit UIDAI e-KYC OTP
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={aadhaarOtp}
                          onChange={(e) => setAadhaarOtp(e.target.value)}
                          className="w-full text-center tracking-widest text-sm font-bold px-3 py-2 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAadhaarOtpSent(false)}
                          className="w-1/3 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-semibold py-2 rounded-xl transition"
                        >
                          Edit Details
                        </button>
                        <button
                          type="submit"
                          disabled={authStage !== 'IDLE'}
                          className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-xl transition shadow-xs disabled:opacity-50"
                        >
                          {authStage === 'CHECKING' ? 'Verifying e-KYC...' : 'Complete e-KYC & Sign In'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 5: Municipal Employee Single Sign-On (SSO) */}
              {activeLoginTab === 'sso' && (
                <form onSubmit={handleMunicipalSsoSubmit} className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-neutral-800">Municipal Employee SSO</span>
                    </div>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                      Gov Intranet 🏛️
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    State Directorate of Municipal Administration (DMA) credential validation for gazetted field engineers, supervisors, and commissioners.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Official Gov Email (@*.gov.in)
                      </label>
                      <input
                        type="email"
                        required
                        value={ssoGovEmail}
                        onChange={(e) => setSsoGovEmail(e.target.value)}
                        placeholder="official@ccmc.gov.in"
                        className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Employee ID / ESB Number
                      </label>
                      <input
                        type="text"
                        required
                        value={ssoEmployeeId}
                        onChange={(e) => setSsoEmployeeId(e.target.value)}
                        placeholder="TN-CCMC-2024-8841"
                        className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Officer Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={ssoFullName}
                        onChange={(e) => setSsoFullName(e.target.value)}
                        placeholder="Er. Rajesh Kumar"
                        className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Official Designation
                      </label>
                      <select
                        value={ssoDesignation}
                        onChange={(e) => setSsoDesignation(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      >
                        <option value="Assistant Engineer (AE)">Assistant Engineer (AE) - Field Beat</option>
                        <option value="Junior Engineer (JE)">Junior Engineer (JE) - Ward Beat</option>
                        <option value="Zonal Engineering Supervisor">Zonal Engineering Supervisor (L2)</option>
                        <option value="Chief Municipal Engineer">Chief Municipal Engineer (Dept Head)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Department
                      </label>
                      <select
                        value={ssoDepartment}
                        onChange={(e) => setSsoDepartment(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      >
                        <option value="Roads, Bridges & Infrastructure">Roads, Bridges & Infrastructure</option>
                        <option value="Solid Waste Management & Sanitation">Solid Waste Management & Sanitation</option>
                        <option value="Water Supply, Sewerage & Drainage">Water Supply, Sewerage & Drainage</option>
                        <option value="Public Lighting & Energy">Public Lighting & Energy</option>
                        <option value="Public Health & Vector Control">Public Health & Vector Control</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Assigned ULB & Ward Beat
                      </label>
                      <input
                        type="text"
                        value={`${ssoLocalBody} (Ward ${ssoWard})`}
                        readOnly
                        className="w-full text-xs px-3 py-2 border border-neutral-200 rounded-xl bg-neutral-100 text-neutral-700"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authStage !== 'IDLE'}
                    className="w-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{authStage === 'CHECKING' ? 'Authenticating Official Credentials...' : 'Sign In with Municipal SSO'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* MODE 2: Create Account / Registration for New User */}
          {/* ======================================================== */}
          {modalMode === 'CREATE_ACCOUNT' && oauthUser && (
            <form onSubmit={handleCreateAccountSubmit} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <UserPlus className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">{t('accountSetupTitle') || 'Complete Your Civic Identity Setup'}</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">{t('accountSetupSub') || 'Assign your local municipal ward and role jurisdiction.'}</p>
                </div>
              </div>

              {/* Verified Account Details Banner */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-3">
                {oauthUser.photoURL ? (
                  <img src={oauthUser.photoURL} alt="Avatar" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold">
                    {oauthUser.displayName.charAt(0)}
                  </div>
                )}
                <div className="text-xs min-w-0">
                  <div className="font-semibold text-neutral-900">{oauthUser.displayName}</div>
                  <div className="text-neutral-500 truncate">{oauthUser.email}</div>
                </div>
                <span className="ml-auto text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                  Verified Identity
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
                    <option value="government_official">Government Official / Field Engineer</option>
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
                      placeholder="E.g. Roads, Bridges & Infrastructure"
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
                  <span>{authStage === 'CHECKING' ? 'Registering Account...' : (t('saveAndContinue') || 'Save & Continue')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
