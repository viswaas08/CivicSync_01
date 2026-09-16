/**
 * CivicSync Core Domain Types
 * Defines all data models across GIS, AI, Complaints, SLA, Government, Community, and Innovation.
 */

export type UserRole = 
  | 'citizen' 
  | 'government_official' 
  | 'supervisor' 
  | 'department_head' 
  | 'district_authority' 
  | 'state_authority' 
  | 'ngo' 
  | 'volunteer' 
  | 'student' 
  | 'innovator' 
  | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  countryId?: string;
  designation?: string;
  departmentId?: string;
  departmentName?: string;
  organizationId?: string;
  organizationName?: string;
  jurisdiction?: {
    countryId?: string;
    stateId: string;
    districtId: string;
    localBodyId: string;
    wardNumbers?: string[];
  };
  verificationStatus: 'NOT_VERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  accountStatus?: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DISABLED';
  aadhaarStatus?: 'NOT_VERIFIED' | 'PENDING' | 'VERIFIED';
  createdAt: string;
  avatarUrl?: string;
}

export type ComplaintStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'LOCATION_RESOLVING'
  | 'AI_ANALYZING'
  | 'AI_REVIEW_REQUIRED'
  | 'REPORTER_APPROVED'
  | 'ROUTING'
  | 'ROUTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'UNDER_INSPECTION'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CITIZEN_REVIEW'
  | 'CLOSED'
  | 'APPEALED'
  | 'REOPENED';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
}

export interface GISLocationSnapshot {
  countryId?: string;
  countryName?: string;
  administrativeAreas?: AdministrativeAreaSnapshot[];
  latitude?: number;
  longitude?: number;
  zoneName?: string;
  stateId: string;
  stateName: string;
  districtId: string;
  districtName: string;
  localBodyId: string;
  localBodyName: string;
  localBodyType?: 'MUNICIPAL_CORPORATION' | 'MUNICIPALITY' | 'NAGAR_PANCHAYAT' | 'GRAM_PANCHAYAT' | string;
  wardId?: string | null;
  wardNumber: string | null;
  wardName: string | null;
  boundaryVersion?: string;
  delimitationVersion?: string;
  locality?: string;
  addressText: string;
  locationStatus?: 'RESOLVED' | 'PARTIAL' | 'AMBIGUOUS' | 'NOT_FOUND';
  resolvedAt?: string;
}

export interface GeminiAnalysisResult {
  domain: string;
  subDomain: string;
  problemType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  severityScore: number; // 0-100
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMMEDIATE';
  safetyRisk: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'HAZARDOUS';
  affectedPopulation: 'FEW' | 'NEIGHBORHOOD' | 'COMMUNITY' | 'MASSIVE';
  environmentalImpact: 'NONE' | 'LOW' | 'MODERATE' | 'SEVERE';
  suggestedDepartment: string;
  confidence: number; // 0.0 - 1.0
  evidenceQuality: 'POOR' | 'ACCEPTABLE' | 'GOOD' | 'EXCELLENT';
  needsHumanReview: boolean;
  isCivicRelated: boolean;
  isAiGeneratedOrSynthetic: boolean;
  isValidEvidence: boolean;
  isInternetOrStockImage?: boolean;
  isFakeOrRecycledEvidence?: boolean;
  provenanceWarning?: string;
  detectedSourceType?: 'LIVE_CAMERA_PHOTO' | 'INTERNET_OR_STOCK' | 'SYNTHETIC_AI' | 'DOCUMENT' | 'UNKNOWN';
  rejectionReason?: string;
  detectedSubject?: string;
  title?: string;
  generatedDescription?: string;
  explanation: string;
  timestamp: string;
  model: string;
  promptVersion: number;
}

export interface EvidenceFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  exifData?: {
    dateTimeOriginal?: string;
    make?: string;
    model?: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
  };
  hasCameraExif?: boolean;
  isInternetOrStockImage?: boolean;
  isFakeOrRecycledEvidence?: boolean;
  provenanceWarning?: string;
  qualityScore: number; // 0-100
  aiAuthenticityRisk: number; // 0-100 (probabilistic score, not definitive)
  gpsConsistent: boolean;
  uploadedAt: string;
}

export interface ComplaintSLA {
  initialResponseDueAt: string;
  responseAt?: string;
  expectedResolutionAt: string;
  extendedUntil?: string;
  extensionReason?: string;
  extensionApprovedBy?: string;
  extensionHistory?: Array<{
    previousDue: string;
    extendedTo: string;
    reason: string;
    requestedBy: string;
    approvedAt: string;
  }>;
  isBreached: boolean;
  currentEscalationLevel: 'OFFICER' | 'SUPERVISOR' | 'DEPARTMENT_HEAD' | 'DISTRICT_AUTHORITY' | 'STATE_AUTHORITY';
}

export interface ResolutionData {
  description: string;
  actionTaken: string;
  resolvedAt: string;
  resolvedByOfficialId: string;
  resolvedByOfficialName: string;
  beforeEvidenceUrl?: string;
  afterEvidenceUrls: string[];
  citizenRating?: number;
  citizenFeedback?: string;
  citizenAction?: 'ACCEPTED' | 'APPEALED';
  appealReason?: string;
}

export interface Complaint {
  complaintId: string;
  countryId?: string;
  administrativeAreas?: AdministrativeAreaSnapshot[];
  citizenId: string;
  citizenName: string; // Protected: only shown to authorized officials, masked on public pages
  citizenPhoneMasked?: string;
  isAnonymous?: boolean;
  confidenceScore?: number;
  isDuplicate?: boolean;
  duplicateOfId?: string;
  title: string;
  description: string;
  category: string;
  problemType: string;
  priorityScore: number; // 0-100
  priorityLevel: PriorityLevel;
  status: ComplaintStatus;
  location: LocationCoordinates;
  locationSnapshot: GISLocationSnapshot;
  evidence: EvidenceFile[];
  aiAnalysisHistory: GeminiAnalysisResult[];
  latestAiAnalysis?: GeminiAnalysisResult;
  aiReviewApproved: boolean;
  assignedDepartmentId: string;
  assignedDepartmentName: string;
  assignedOfficialId?: string;
  assignedOfficialName?: string;
  assignmentMethod: 'AUTOMATIC' | 'OPTIMIZED' | 'MANUAL' | 'ESCALATED' | 'TRANSFERRED';
  sla: ComplaintSLA;
  resolution?: ResolutionData;
  supportersCount: number;
  supportedByCitizenIds?: string[];
  isCommunityEligible: boolean;
  communityOpportunityId?: string;
  isInnovationEligible: boolean;
  innovationChallengeId?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintEvent {
  eventId: string;
  complaintId: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole | 'SYSTEM';
  action: string;
  previousStatus?: ComplaintStatus;
  newStatus?: ComplaintStatus;
  notes?: string;
  timestamp: string;
}

export interface Department {
  departmentId: string;
  countryId?: string;
  name: string;
  code: string;
  organizationId: string;
  organizationName: string;
  headName: string;
  contactEmail: string;
  contactPhone: string;
  categoriesHandled: string[];
  activeOfficersCount: number;
  openCasesCount: number;
  resolvedCasesCount: number;
  slaComplianceRate: number; // percentage
}

export interface GovernmentOfficial {
  officialId: string;
  countryId?: string;
  firebaseUid: string;
  employeeId: string;
  name: string;
  officialEmail: string;
  phone: string;
  designation: string;
  role: 'government_official' | 'supervisor' | 'department_head';
  organizationId: string;
  departmentId: string;
  departmentName: string;
  supervisorId?: string;
  jurisdiction: {
    countryId?: string;
    stateId: string;
    districtId: string;
    localBodyId: string;
    wardNumbers: string[];
  };
  specializations: string[];
  employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'TRANSFERRED';
  verificationStatus: 'VERIFIED' | 'PENDING';
  availability: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';
  currentActiveCases: number;
  maxActiveCases: number;
  slaAdherenceScore: number;
}

export interface GISWardBoundary {
  boundaryId: string;
  countryId?: string;
  levelCode?: string;
  wardId: string;
  wardNumber: string;
  wardName: string;
  type: 'WARD';
  stateId: string;
  districtId: string;
  localBodyId: string;
  localBodyName: string;
  localBodyType: 'MUNICIPAL_CORPORATION' | 'MUNICIPALITY' | 'NAGAR_PANCHAYAT' | 'LOCAL_AUTHORITY' | 'CITY_GOVERNMENT' | string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][]; // [longitude, latitude]
  };
  centroid: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  source: {
    datasetId: string;
    datasetVersionId: string;
    organization: string;
    sourceType: 'OFFICIAL_GIS' | 'MUNICIPAL_SURVEY';
    sourceUrl: string;
    retrievedAt: string;
  };
  status: 'PUBLISHED' | 'STAGED' | 'SUPERSEDED';
  effectiveFrom: string;
  effectiveTo?: string | null;
  population?: number;
  areaSqKm?: number;
}

export interface GISCoverageReport {
  stateId: string;
  stateName: string;
  districtId: string;
  districtName: string;
  cityName?: string;
  localBodyId: string;
  localBodyName: string;
  expectedWards: number;
  totalWardsCount?: number;
  loadedWards: number;
  validatedWards: number;
  publishedWards: number;
  publishedWardsCount?: number;
  coveragePercentage: number;
  coveragePercent?: number;
  status: 'COMPLETE' | 'PARTIAL' | 'MISSING' | 'CONFLICT';
  lastCheckedAt: string;
  boundaryVersion?: string;
  lastGazetteDate?: string;
}

export interface CommunityOpportunity {
  id: string;
  opportunityId?: string;
  type?: string;
  countryId?: string;
  complaintId: string;
  title: string;
  category: 'CLEANUP' | 'PLANTATION' | 'AWARENESS' | 'MAINTENANCE' | 'COMMUNITY_ACTION';
  description: string;
  locationSnapshot: GISLocationSnapshot;
  suitableActivities: string[];
  requiredVolunteers: number;
  status: 'AVAILABLE' | 'ACCEPTED' | 'IN_PROGRESS' | 'PENDING_VERIFICATION' | 'VERIFIED_COMPLETE' | 'EXPIRED' | 'WITHDRAWN';
  acceptedByOrgId?: string;
  acceptedByOrgName?: string;
  expiresAt: string; // default 24h before fallback to pure government SLA
  completedAt?: string;
  completionProofUrl?: string;
  governmentFallbackInitiated: boolean;
  createdAt: string;
}

export interface InnovationChallenge {
  id: string;
  challengeId?: string;
  countryId?: string;
  complaintId?: string;
  title: string;
  problemDomain: string;
  targetDepartment?: string;
  bountyReward?: string;
  description: string;
  technicalRequirements: string[];
  evaluationCriteria?: string[];
  submissionsCount: number;
  solutionsCount?: number;
  stage: 'OPEN' | 'TECHNICAL_REVIEW' | 'GOVERNMENT_REVIEW' | 'PILOT' | 'ADOPTED';
  targetLocalBody: string;
  partnerInstitutions?: string[];
  featuredContributors?: Array<{
    name: string;
    institution: string;
    solutionTitle: string;
  }>;
  createdAt: string;
}

export interface CountryConfig {
  countryId: string; // e.g. "IN", "US", "GB"
  iso2: string;
  iso3: string;
  name: string;
  officialName: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  phoneCode: string;
  phoneFormatPattern: string;
  currencyCode: string;
  currencySymbol: string;
  timezoneStrategy: 'JURISDICTION' | 'FIXED';
  defaultTimezone: string;
  administrativeModel: string;
  identityProvider: 'AADHAAR_OPTIONAL' | 'PHONE_VERIFICATION' | 'EMAIL_VERIFICATION' | 'GOVERNMENT_ID';
  gisStatus: 'PRODUCTION_READY' | 'GIS_PARTIAL' | 'CONFIGURED_ONLY' | 'NOT_AVAILABLE';
  gisProvider: string;
  status: 'ACTIVE' | 'DISABLED';
  defaultSlaHours: number;
  emergencySlaHours: number;
  addressFormatSchema: string[];
  emergencyCategories: string[];
  boundingBox?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

export interface AdministrativeLevelDefinition {
  countryId: string;
  levelCode: string;
  levelOrder: number;
  displayName: string;
  pluralName: string;
  parentLevel: string | null;
  isLeafJurisdiction: boolean;
  description?: string;
}

export interface AdministrativeAreaSnapshot {
  levelCode: string;
  levelName: string;
  boundaryId: string;
  name: string;
}

export interface DepartmentResponsibilityRule {
  countryId: string;
  departmentId: string;
  departmentName: string;
  problemTypes: string[];
  jurisdictionLevels: string[];
}

export interface SlaPolicy {
  countryId: string;
  jurisdictionType: string;
  departmentId: string;
  initialResponseHours: number;
  resolutionHours: number;
  escalationLevels: string[];
}

export interface GisDataset {
  datasetId: string;
  countryId: string;
  provider: string;
  organization: string;
  sourceUrl: string;
  sourceType: string;
  administrativeLevels: string[];
  version: string;
  license: string;
  retrievedAt: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: 'PUBLISHED' | 'STAGED' | 'SUPERSEDED' | 'ARCHIVED';
}

export interface InnovationSolution {
  solutionId: string;
  challengeId: string;
  title: string;
  abstract: string;
  authorId: string;
  authorName: string;
  authorType: 'STUDENT' | 'DEVELOPER' | 'RESEARCHER' | 'STARTUP';
  organization: string;
  techStack: string[];
  githubUrl?: string;
  demoUrl?: string;
  estimatedCost?: string;
  pipelineStage: 'TECHNICAL_REVIEW' | 'GOVERNMENT_REVIEW' | 'PILOT' | 'ADOPTED';
  votes: number;
  createdAt: string;
}

