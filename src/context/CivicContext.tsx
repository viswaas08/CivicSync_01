import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Complaint, 
  UserProfile, 
  UserRole, 
  ComplaintStatus,
  CommunityOpportunity, 
  InnovationChallenge, 
  InnovationSolution,
  ComplaintEvent,
  GISWardBoundary,
  GISCoverageReport,
  ResolutionData
} from '../types';
import { 
  INITIAL_COMPLAINTS, 
  INITIAL_COMMUNITY_OPPORTUNITIES, 
  INITIAL_INNOVATION_CHALLENGES, 
  INITIAL_INNOVATION_SOLUTIONS,
  INITIAL_AUDIT_EVENTS
} from '../services/demoData';
import { INITIAL_PUBLISHED_WARDS, INITIAL_COVERAGE_REPORTS } from '../services/gisEngine';
import { requestSLAExtension, escalateComplaint } from '../services/slaEngine';
import { getTranslation, TranslationKey } from '../services/i18n';
import { auth, signOut as firebaseSignOut } from '../services/firebase';

export interface CivicContextType {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  switchRole: (role: UserRole) => void;
  loginUser: (profile: UserProfile) => void;
  signOutUser: () => Promise<void>;
  selectedCountryId: string;
  setSelectedCountryId: (countryId: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: TranslationKey) => string;
  complaints: Complaint[];
  filteredComplaints: Complaint[];
  communityOpportunities: CommunityOpportunity[];
  innovationChallenges: InnovationChallenge[];
  innovationSolutions: InnovationSolution[];
  auditEvents: ComplaintEvent[];
  gisWards: GISWardBoundary[];
  gisCoverage: GISCoverageReport[];
  submitComplaint: (newComplaint: Complaint) => void;
  approveAiReview: (complaintId: string) => void;
  updateComplaintStatus: (complaintId: string, newStatus: ComplaintStatus, notes?: string) => void;
  resolveComplaint: (complaintId: string, resolution: ResolutionData) => void;
  citizenReviewResolution: (complaintId: string, action: 'ACCEPTED' | 'APPEALED', rating?: number, feedback?: string, appealReason?: string) => void;
  supportComplaint: (complaintId: string) => void;
  requestExtensionForComplaint: (complaintId: string, hours: number, reason: string) => void;
  escalateComplaintSla: (complaintId: string) => void;
  acceptOpportunity: (oppId: string, orgName: string) => void;
  acceptCommunityOpportunity: (oppId: string, orgName: string, volunteers?: number) => void;
  completeOpportunity: (oppId: string, proofUrl: string) => void;
  completeCommunityOpportunity: (oppId: string, proofUrls: string[], notes?: string) => void;
  submitChallengeSolution: (challengeId: string, contributorName: string, institution: string, title: string) => void;
  submitInnovationSolution: (solution: InnovationSolution) => void;
  addGisWard: (ward: GISWardBoundary) => void;
  rollbackGisVersion: (datasetVersionId: string) => void;
  removeAllDemoData: () => void;
  reseedAllDemoData: () => void;
  resetDemoData: () => void;
  clearAllComplaints: () => void;
}

const CivicContext = createContext<CivicContextType | undefined>(undefined);

// Guest citizen profile when signed out
export const GUEST_USER: UserProfile = {
  uid: 'guest-cit-001',
  email: '',
  displayName: 'Guest Citizen',
  role: 'citizen',
  countryId: 'IN',
  verificationStatus: 'NOT_VERIFIED',
  createdAt: new Date().toISOString()
};

// Clean Role profiles for authenticated users
export const ROLE_PROFILES: Record<UserRole, UserProfile> = {
  citizen: {
    uid: 'cit-verified-001',
    email: 'citizen@civicsync.org',
    displayName: 'Citizen',
    role: 'citizen',
    countryId: 'IN',
    verificationStatus: 'VERIFIED',
    createdAt: new Date().toISOString()
  },
  government_official: {
    uid: 'gov-official-001',
    email: 'official@ccmc.gov.in',
    displayName: 'Field Officer',
    role: 'government_official',
    countryId: 'IN',
    departmentName: 'Municipal Engineering & Works',
    verificationStatus: 'VERIFIED',
    createdAt: new Date().toISOString()
  },
  supervisor: {
    uid: 'gov-supervisor-001',
    email: 'supervisor@ccmc.gov.in',
    displayName: 'Zonal Supervisor',
    role: 'supervisor',
    countryId: 'IN',
    verificationStatus: 'VERIFIED',
    createdAt: new Date().toISOString()
  },
  department_head: {
    uid: 'gov-depthead-001',
    email: 'depthead@ccmc.gov.in',
    displayName: 'Department Head',
    role: 'department_head',
    countryId: 'IN',
    verificationStatus: 'VERIFIED',
    createdAt: new Date().toISOString()
  },
  district_authority: {
    uid: 'gov-district-001',
    email: 'collector@tn.gov.in',
    displayName: 'District Collector',
    role: 'district_authority',
    countryId: 'IN',
    verificationStatus: 'VERIFIED',
    createdAt: new Date().toISOString()
  },
  state_authority: {
    uid: 'gov-state-001',
    email: 'director.cma@tn.gov.in',
    displayName: 'State Authority',
    role: 'state_authority',
    countryId: 'IN',
    verificationStatus: 'VERIFIED',
    createdAt: new Date().toISOString()
  },
  ngo: {
    uid: 'org-ngo-001',
    email: 'contact@civicaction.org',
    displayName: 'Community Action Lead',
    role: 'ngo',
    countryId: 'IN',
    verificationStatus: 'VERIFIED',
    createdAt: new Date().toISOString()
  },
  volunteer: {
    uid: 'vol-user-001',
    email: 'volunteer@civicsync.org',
    displayName: 'Civic Volunteer',
    role: 'volunteer',
    countryId: 'IN',
    verificationStatus: 'VERIFIED',
    createdAt: new Date().toISOString()
  },
  student: {
    uid: 'stu-user-001',
    email: 'student@edu.in',
    displayName: 'Student Researcher',
    role: 'student',
    countryId: 'IN',
    verificationStatus: 'VERIFIED',
    createdAt: new Date().toISOString()
  },
  innovator: {
    uid: 'inn-user-001',
    email: 'innovator@civictech.in',
    displayName: 'Civic Innovator',
    role: 'innovator',
    countryId: 'IN',
    verificationStatus: 'VERIFIED',
    createdAt: new Date().toISOString()
  },
  admin: {
    uid: 'adm-sys-001',
    email: 'admin@civicsync.org',
    displayName: 'System Administrator',
    role: 'admin',
    countryId: 'IN',
    verificationStatus: 'VERIFIED',
    createdAt: new Date().toISOString()
  }
};

export const CivicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user & authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const savedAuth = localStorage.getItem('civicsync_authenticated');
    if (savedAuth === 'false') {
      return GUEST_USER;
    }
    const savedCustom = localStorage.getItem('civicsync_user_profile');
    if (savedCustom) {
      try {
        return JSON.parse(savedCustom);
      } catch (e) {
        console.error('Failed to parse saved user profile:', e);
      }
    }
    const savedRole = localStorage.getItem('civicsync_user_role') as UserRole;
    if (savedRole && ROLE_PROFILES[savedRole]) {
      return ROLE_PROFILES[savedRole];
    }
    if (savedAuth === 'true') {
      return ROLE_PROFILES.citizen;
    }
    // Default to unauthenticated GUEST_USER for public browsing
    return GUEST_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('civicsync_authenticated') === 'true';
  });

  // Country focus strictly on India
  const [selectedCountryId, setSelectedCountryIdState] = useState<string>('IN');
  const setSelectedCountryId = (_cid: string) => {
    setSelectedCountryIdState('IN');
    localStorage.setItem('civicsync_selected_country', 'IN');
  };

  // Indian Multilingual state
  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem('civicsync_language') || 'en';
  });

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('civicsync_language', lang);
  };

  const t = (key: TranslationKey): string => {
    return getTranslation(language, key);
  };

  // Complaints State: Default to clean state (no demo data)
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const saved = localStorage.getItem('civicsync_complaints');
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  // Filtered by jurisdiction (all complaints in India)
  const filteredComplaints = React.useMemo(() => {
    return complaints.filter(c => (c.countryId || c.locationSnapshot?.countryId || 'IN') === 'IN');
  }, [complaints]);

  const [communityOpportunities, setCommunityOpportunities] = useState<CommunityOpportunity[]>(() => {
    const saved = localStorage.getItem('civicsync_opportunities');
    return saved ? JSON.parse(saved) : INITIAL_COMMUNITY_OPPORTUNITIES;
  });

  const [innovationChallenges, setInnovationChallenges] = useState<InnovationChallenge[]>(() => {
    const saved = localStorage.getItem('civicsync_challenges');
    return saved ? JSON.parse(saved) : INITIAL_INNOVATION_CHALLENGES;
  });

  const [innovationSolutions, setInnovationSolutions] = useState<InnovationSolution[]>(() => {
    const saved = localStorage.getItem('civicsync_solutions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [auditEvents, setAuditEvents] = useState<ComplaintEvent[]>(() => {
    const saved = localStorage.getItem('civicsync_audit_events');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_EVENTS;
  });

  const [gisWards, setGisWards] = useState<GISWardBoundary[]>(INITIAL_PUBLISHED_WARDS);
  const [gisCoverage, setGisCoverage] = useState<GISCoverageReport[]>(INITIAL_COVERAGE_REPORTS);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('civicsync_complaints', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('civicsync_opportunities', JSON.stringify(communityOpportunities));
  }, [communityOpportunities]);

  useEffect(() => {
    localStorage.setItem('civicsync_challenges', JSON.stringify(innovationChallenges));
  }, [innovationChallenges]);

  useEffect(() => {
    localStorage.setItem('civicsync_solutions', JSON.stringify(innovationSolutions));
  }, [innovationSolutions]);

  useEffect(() => {
    localStorage.setItem('civicsync_audit_events', JSON.stringify(auditEvents));
  }, [auditEvents]);

  // Role switching
  const switchRole = (role: UserRole) => {
    const targetProfile = ROLE_PROFILES[role] || ROLE_PROFILES.citizen;
    setCurrentUser(targetProfile);
    setIsAuthenticated(true);
    localStorage.setItem('civicsync_user_role', role);
    localStorage.setItem('civicsync_user_profile', JSON.stringify(targetProfile));
    localStorage.setItem('civicsync_authenticated', 'true');
  };

  // Login user with verified profile
  const loginUser = (profile: UserProfile) => {
    setCurrentUser(profile);
    setIsAuthenticated(true);
    localStorage.setItem('civicsync_user_role', profile.role);
    localStorage.setItem('civicsync_user_profile', JSON.stringify(profile));
    localStorage.setItem('civicsync_authenticated', 'true');
  };

  // Sign out user
  const signOutUser = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Firebase sign out error (non-fatal):', err);
    }
    setCurrentUser(GUEST_USER);
    setIsAuthenticated(false);
    localStorage.removeItem('civicsync_user_profile');
    localStorage.removeItem('civicsync_user_role');
    localStorage.setItem('civicsync_authenticated', 'false');
  };

  // Clear all complaints for clean slate
  const clearAllComplaints = () => {
    setComplaints([]);
    localStorage.removeItem('civicsync_complaints');
  };

  // Submit new complaint
  const submitComplaint = (newComplaint: Complaint) => {
    setComplaints(prev => [newComplaint, ...prev]);

    const submitEvent: ComplaintEvent = {
      eventId: `EVT-${Date.now()}-SUB`,
      complaintId: newComplaint.complaintId,
      actorId: currentUser.uid,
      actorName: currentUser.displayName,
      actorRole: currentUser.role,
      action: 'REPORT_SUBMITTED',
      previousStatus: 'DRAFT',
      newStatus: newComplaint.status,
      notes: `Citizen submitted grievance for ${newComplaint.problemType} in Ward ${newComplaint.locationSnapshot.wardNumber || 'General'}.`,
      timestamp: new Date().toISOString()
    };

    setAuditEvents(prev => [submitEvent, ...prev]);

    // Asynchronously synchronize with backend API and pass Bearer token
    fetch('/api/v1/complaints', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.uid || 'guest-cit-001'}`
      },
      body: JSON.stringify(newComplaint)
    }).catch(err => {
      console.warn('Backend complaints sync notice:', err);
    });
  };

  const approveAiReview = (complaintId: string) => {
    setComplaints(prev => prev.map(c => {
      if (c.complaintId === complaintId) {
        return {
          ...c,
          aiReviewApproved: true,
          status: 'REPORTER_APPROVED',
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));

    const event: ComplaintEvent = {
      eventId: `EVT-${Date.now()}`,
      complaintId,
      actorId: currentUser.uid,
      actorName: currentUser.displayName,
      actorRole: currentUser.role,
      action: 'CITIZEN_AI_APPROVED',
      previousStatus: 'AI_REVIEW_REQUIRED',
      newStatus: 'REPORTER_APPROVED',
      notes: 'Citizen confirmed AI assessment of problem domain, safety risk, and priority level.',
      timestamp: new Date().toISOString()
    };
    setAuditEvents(prev => [event, ...prev]);
  };

  const updateComplaintStatus = (complaintId: string, newStatus: ComplaintStatus, notes?: string) => {
    let targetOldStatus: ComplaintStatus = 'DRAFT';
    setComplaints(prev => prev.map(c => {
      if (c.complaintId === complaintId) {
        targetOldStatus = c.status;
        return {
          ...c,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));

    const event: ComplaintEvent = {
      eventId: `EVT-${Date.now()}`,
      complaintId,
      actorId: currentUser.uid,
      actorName: currentUser.displayName,
      actorRole: currentUser.role,
      action: 'STATUS_UPDATED',
      previousStatus: targetOldStatus,
      newStatus,
      notes: notes || `Status transitioned to ${newStatus} by ${currentUser.displayName}.`,
      timestamp: new Date().toISOString()
    };
    setAuditEvents(prev => [event, ...prev]);
  };

  const resolveComplaint = (complaintId: string, resolution: ResolutionData) => {
    setComplaints(prev => prev.map(c => {
      if (c.complaintId === complaintId) {
        return {
          ...c,
          status: 'RESOLVED',
          resolution,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));

    const event: ComplaintEvent = {
      eventId: `EVT-${Date.now()}`,
      complaintId,
      actorId: currentUser.uid,
      actorName: currentUser.displayName,
      actorRole: currentUser.role,
      action: 'WORK_COMPLETED',
      previousStatus: 'IN_PROGRESS',
      newStatus: 'RESOLVED',
      notes: `Field resolution recorded: "${resolution.actionTaken}". Photo evidence verified.`,
      timestamp: new Date().toISOString()
    };
    setAuditEvents(prev => [event, ...prev]);
  };

  const citizenReviewResolution = (
    complaintId: string,
    action: 'ACCEPTED' | 'APPEALED',
    rating?: number,
    feedback?: string,
    appealReason?: string
  ) => {
    const finalStatus = action === 'ACCEPTED' ? 'CLOSED' : 'APPEALED';

    setComplaints(prev => prev.map(c => {
      if (c.complaintId === complaintId) {
        return {
          ...c,
          status: finalStatus,
          resolution: c.resolution ? {
            ...c.resolution,
            citizenAction: action,
            citizenRating: rating,
            citizenFeedback: feedback,
            appealReason: appealReason
          } : undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));

    const event: ComplaintEvent = {
      eventId: `EVT-${Date.now()}`,
      complaintId,
      actorId: currentUser.uid,
      actorName: currentUser.displayName,
      actorRole: 'citizen',
      action: action === 'ACCEPTED' ? 'CITIZEN_ACCEPTED_RESOLUTION' : 'CITIZEN_APPEALED_RESOLUTION',
      previousStatus: 'RESOLVED',
      newStatus: finalStatus,
      notes: action === 'ACCEPTED' 
        ? `Citizen approved resolution with ${rating || 5}-star rating: "${feedback || 'Satisfactory work'}"`
        : `Citizen appealed resolution: "${appealReason || 'Problem persists on site'}"`,
      timestamp: new Date().toISOString()
    };
    setAuditEvents(prev => [event, ...prev]);
  };

  const supportComplaint = (complaintId: string) => {
    setComplaints(prev => prev.map(c => {
      if (c.complaintId === complaintId) {
        const supported = c.supportedByCitizenIds || [];
        if (!supported.includes(currentUser.uid)) {
          return {
            ...c,
            supportersCount: (c.supportersCount || 0) + 1,
            supportedByCitizenIds: [...supported, currentUser.uid],
            priorityScore: Math.min(100, c.priorityScore + 2)
          };
        }
      }
      return c;
    }));

    const event: ComplaintEvent = {
      eventId: `EVT-${Date.now()}`,
      complaintId,
      actorId: currentUser.uid,
      actorName: currentUser.displayName,
      actorRole: 'citizen',
      action: 'CITIZEN_SUPPORT_ADDED',
      notes: 'Citizen corroborated this civic complaint (+1 Community Support).',
      timestamp: new Date().toISOString()
    };
    setAuditEvents(prev => [event, ...prev]);
  };

  const requestExtensionForComplaint = (complaintId: string, hours: number, reason: string) => {
    setComplaints(prev => prev.map(c => {
      if (c.complaintId === complaintId) {
        const updatedSla = requestSLAExtension(c.sla, hours, reason, currentUser.displayName);
        return {
          ...c,
          sla: updatedSla,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));

    const event: ComplaintEvent = {
      eventId: `EVT-${Date.now()}`,
      complaintId,
      actorId: currentUser.uid,
      actorName: currentUser.displayName,
      actorRole: currentUser.role,
      action: 'SLA_EXTENSION_REQUESTED',
      notes: `Extension of ${hours} hours requested by ${currentUser.displayName}. Reason: ${reason}`,
      timestamp: new Date().toISOString()
    };
    setAuditEvents(prev => [event, ...prev]);
  };

  const escalateComplaintSla = (complaintId: string) => {
    setComplaints(prev => prev.map(c => {
      if (c.complaintId === complaintId) {
        const escalatedSla = escalateComplaint(c.sla);
        return {
          ...c,
          sla: escalatedSla,
          status: 'ESCALATED',
          priorityScore: Math.min(100, c.priorityScore + 15),
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));

    const event: ComplaintEvent = {
      eventId: `EVT-${Date.now()}`,
      complaintId,
      actorId: 'SLA_SYSTEM',
      actorName: 'SLA Escalation Daemon',
      actorRole: 'SYSTEM',
      action: 'SLA_ESCALATED',
      notes: 'Complaint breached threshold. Escalated to higher administrative authority.',
      timestamp: new Date().toISOString()
    };
    setAuditEvents(prev => [event, ...prev]);
  };

  const acceptOpportunity = (oppId: string, orgName: string) => {
    setCommunityOpportunities(prev => prev.map(opp => {
      if (opp.id === oppId) {
        return {
          ...opp,
          status: 'ACCEPTED',
          acceptedByOrgId: currentUser.organizationId || currentUser.uid,
          acceptedByOrgName: orgName
        };
      }
      return opp;
    }));
  };

  const completeOpportunity = (oppId: string, proofUrl: string) => {
    setCommunityOpportunities(prev => prev.map(opp => {
      if (opp.id === oppId) {
        return {
          ...opp,
          status: 'VERIFIED_COMPLETE',
          completedAt: new Date().toISOString(),
          completionProofUrl: proofUrl
        };
      }
      return opp;
    }));
  };

  const acceptCommunityOpportunity = (oppId: string, orgName: string, _volunteers?: number) => {
    acceptOpportunity(oppId, orgName);
  };

  const completeCommunityOpportunity = (oppId: string, proofUrls: string[], notes?: string) => {
    completeOpportunity(oppId, proofUrls[0] || '');
  };

  const submitChallengeSolution = (
    challengeId: string,
    contributorName: string,
    institution: string,
    title: string
  ) => {
    setInnovationChallenges(prev => prev.map(ch => {
      if (ch.id === challengeId || ch.challengeId === challengeId) {
        const contributors = ch.featuredContributors || [];
        return {
          ...ch,
          submissionsCount: (ch.submissionsCount || 0) + 1,
          solutionsCount: ((ch.solutionsCount || ch.submissionsCount) || 0) + 1,
          featuredContributors: [
            ...contributors,
            { name: contributorName, institution, solutionTitle: title }
          ]
        };
      }
      return ch;
    }));
  };

  const submitInnovationSolution = (solution: InnovationSolution) => {
    setInnovationSolutions(prev => [solution, ...(prev || [])]);
    // Also bump submission count in corresponding challenge if present
    setInnovationChallenges(prev => prev.map(ch => {
      if (ch.id === solution.challengeId || ch.challengeId === solution.challengeId) {
        return {
          ...ch,
          submissionsCount: (ch.submissionsCount || 0) + 1,
          solutionsCount: ((ch.solutionsCount || ch.submissionsCount) || 0) + 1,
          featuredContributors: [
            ...(ch.featuredContributors || []),
            { name: solution.authorName, institution: solution.organization, solutionTitle: solution.title }
          ]
        };
      }
      return ch;
    }));
  };

  const addGisWard = (ward: GISWardBoundary) => {
    setGisWards(prev => {
      const exists = prev.some(w => w.boundaryId === ward.boundaryId);
      if (exists) {
        return prev.map(w => w.boundaryId === ward.boundaryId ? ward : w);
      }
      return [...prev, ward];
    });
  };

  const rollbackGisVersion = (datasetVersionId: string) => {
    const event: ComplaintEvent = {
      eventId: `EVT-GIS-${Date.now()}`,
      complaintId: 'GIS-SYSTEM',
      actorId: currentUser.uid,
      actorName: currentUser.displayName,
      actorRole: 'admin',
      action: 'GIS_VERSION_ROLLBACK',
      notes: `Rolled back dataset version ${datasetVersionId} safely. Historical complaints retained locationSnapshots.`,
      timestamp: new Date().toISOString()
    };
    setAuditEvents(prev => [event, ...prev]);
  };

  const removeAllDemoData = () => {
    setComplaints([]);
    setCommunityOpportunities([]);
    setInnovationChallenges([]);
    setInnovationSolutions([]);
    setAuditEvents([]);
    localStorage.removeItem('civicsync_complaints');
    localStorage.removeItem('civicsync_opportunities');
    localStorage.removeItem('civicsync_challenges');
    localStorage.removeItem('civicsync_solutions');
    localStorage.removeItem('civicsync_audit_events');
  };

  const reseedAllDemoData = () => {
    // Disabled: Demo data removed per user specification
    console.info('Demo data re-seeding disabled.');
  };

  const resetDemoData = removeAllDemoData;

  return (
    <CivicContext.Provider value={{
      currentUser,
      isAuthenticated,
      switchRole,
      loginUser,
      signOutUser,
      selectedCountryId,
      setSelectedCountryId,
      language,
      setLanguage,
      t,
      complaints,
      filteredComplaints,
      communityOpportunities,
      innovationChallenges,
      innovationSolutions,
      auditEvents,
      gisWards,
      gisCoverage,
      submitComplaint,
      approveAiReview,
      updateComplaintStatus,
      resolveComplaint,
      citizenReviewResolution,
      supportComplaint,
      requestExtensionForComplaint,
      escalateComplaintSla,
      acceptOpportunity,
      acceptCommunityOpportunity,
      completeOpportunity,
      completeCommunityOpportunity,
      submitChallengeSolution,
      submitInnovationSolution,
      addGisWard,
      rollbackGisVersion,
      removeAllDemoData,
      reseedAllDemoData,
      resetDemoData,
      clearAllComplaints
    }}>
      {children}
    </CivicContext.Provider>
  );
};

export function useCivic() {
  const context = useContext(CivicContext);
  if (!context) {
    throw new Error('useCivic must be used within a CivicProvider');
  }
  return context;
}
