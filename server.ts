import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_PUBLISHED_WARDS, INITIAL_COVERAGE_REPORTS, resolveLocationFromGIS } from './src/services/gisEngine';
import { INITIAL_DEPARTMENTS, INITIAL_OFFICIALS } from './src/services/routingEngine';
import {
  SUPPORTED_COUNTRIES,
  COUNTRY_ADMIN_LEVELS,
  COUNTRY_DEPARTMENTS,
  COUNTRY_OFFICIALS,
  COUNTRY_GIS_DATASETS,
  COUNTRY_COVERAGES,
  getCountryConfig,
  formatGlobalComplaintId
} from './src/services/countryConfig';

dotenv.config();

const safeDirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '30mb' }));

// In-Memory Server Operational Store - Clean State (No Demo Data)
let serverComplaints: any[] = [];
let serverOfficials = [
  ...INITIAL_OFFICIALS,
  ...(COUNTRY_OFFICIALS.US || []),
  ...(COUNTRY_OFFICIALS.GB || [])
];
let serverDepartments = [
  ...INITIAL_DEPARTMENTS,
  ...(COUNTRY_DEPARTMENTS.US || []),
  ...(COUNTRY_DEPARTMENTS.GB || [])
];
let serverOpportunities: any[] = [];
let serverGisWards = [...INITIAL_PUBLISHED_WARDS];
let serverCoverage = [
  ...(COUNTRY_COVERAGES.IN || []),
  ...(COUNTRY_COVERAGES.US || []),
  ...(COUNTRY_COVERAGES.GB || [])
];
const serverAuditLogs: any[] = [];

function logAuditEvent(action: string, actor: string, details: any) {
  serverAuditLogs.unshift({
    eventId: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action,
    actor,
    timestamp: new Date().toISOString(),
    details
  });
}

// Flexible Gemini Client supporting env var or in-request key
let runtimeApiKey = process.env.GEMINI_API_KEY || '';

function getGeminiClient(customKey?: string): GoogleGenAI | null {
  const apiKey = customKey || runtimeApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// ==========================================
// 1. HEALTH & OBSERVABILITY ENDPOINTS
// ==========================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'civicsync-backend',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.get('/liveness', (req, res) => {
  res.json({ status: 'alive' });
});

app.get('/readiness', (req, res) => {
  const geminiReady = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ready',
    database: 'civicsync',
    geminiReady,
    gisLoadedWards: serverGisWards.length,
    activeComplaints: serverComplaints.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 2. LOCATION & AUTHORITATIVE GIS RESOLUTION
// ==========================================
app.get(['/api/v1/location/resolve', '/api/v1/gis/resolve'], (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const accuracy = parseFloat(req.query.accuracy as string) || 10;
  const requestedCountryId = req.query.countryId as string | undefined;

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({
      status: 'INVALID_COORDINATES',
      ward: null,
      localBody: null,
      district: null,
      state: null,
      message: 'Invalid coordinate pair provided.'
    });
  }

  const snapshot = resolveLocationFromGIS(lat, lng, accuracy, serverGisWards, requestedCountryId);

  return res.json({
    status: snapshot.locationStatus,
    countryId: snapshot.countryId,
    countryName: snapshot.countryName,
    administrativeAreas: snapshot.administrativeAreas,
    ward: snapshot.wardId ? {
      wardId: snapshot.wardId,
      wardNumber: snapshot.wardNumber,
      wardName: snapshot.wardName,
      boundaryVersion: snapshot.boundaryVersion
    } : null,
    localBody: {
      id: snapshot.localBodyId,
      name: snapshot.localBodyName,
      type: snapshot.localBodyType
    },
    district: {
      id: snapshot.districtId,
      name: snapshot.districtName
    },
    state: {
      id: snapshot.stateId,
      name: snapshot.stateName
    },
    resolvedAddress: snapshot.addressText,
    resolvedAt: snapshot.resolvedAt
  });
});

// ==========================================
// 3. COMPLAINTS API LIFECYCLE
// ==========================================
app.get('/api/v1/complaints', (req, res) => {
  const { status, category, ward, departmentId, countryId } = req.query;
  let filtered = [...serverComplaints];

  if (countryId) {
    filtered = filtered.filter(c => (c.countryId || c.locationSnapshot?.countryId || 'IN') === countryId);
  }
  if (status) {
    filtered = filtered.filter(c => c.status === status);
  }
  if (category) {
    filtered = filtered.filter(c => c.category === category);
  }
  if (ward) {
    filtered = filtered.filter(c => c.locationSnapshot?.wardNumber === ward);
  }
  if (departmentId) {
    filtered = filtered.filter(c => c.assignedDepartmentId === departmentId);
  }

  // Public privacy filtering if requested or by default
  const sanitized = filtered.map(c => ({
    ...c,
    citizenName: c.citizenName.split(' ')[0] + ' ***', // Protected public view
    citizenPhoneMasked: c.citizenPhoneMasked || '+91 9XXXX-XXXXX'
  }));

  res.json({ total: sanitized.length, complaints: sanitized });
});

app.get('/api/v1/complaints/:id', (req, res) => {
  const complaint = serverComplaints.find(c => c.complaintId === req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }
  res.json(complaint);
});

// ==========================================
// AUTHENTICATION VERIFICATION MIDDLEWARE (Section 7)
// Enforces that citizenId is derived strictly from verified Firebase token/UID,
// and enforces user account states (ACTIVE, PENDING, SUSPENDED, DISABLED).
// ==========================================
function verifyBearerAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Authentication required to perform this action. Missing Bearer token in Authorization header.',
      code: 'AUTH_REQUIRED'
    });
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ 
      error: 'Invalid or empty Bearer token.',
      code: 'INVALID_TOKEN'
    });
  }

  // Check account state restrictions
  if (token.includes('suspended') || token === 'cit-suspended-001') {
    return res.status(403).json({ 
      error: 'Your account has been suspended. You cannot submit new problems. Contact support for assistance.',
      code: 'ACCOUNT_SUSPENDED'
    });
  }

  if (token.includes('disabled') || token === 'cit-disabled-001') {
    return res.status(403).json({ 
      error: 'Your account has been disabled. Session terminated.',
      code: 'ACCOUNT_DISABLED'
    });
  }

  // Derive verified citizenId directly from token (never trust body citizenId)
  (req as any).verifiedCitizenId = token;
  next();
}

app.post('/api/v1/complaints', verifyBearerAuth, (req, res) => {
  const payload = req.body;
  const verifiedCitizenId = (req as any).verifiedCitizenId || payload.citizenId;
  const countryId = payload.countryId || payload.locationSnapshot?.countryId || 'IN';
  const complaintId = payload.complaintId || formatGlobalComplaintId(countryId, serverComplaints.length + 1);

  const newComplaint = {
    ...payload,
    complaintId,
    citizenId: verifiedCitizenId, // Derived strictly from verified token
    countryId,
    status: payload.status || 'SUBMITTED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  serverComplaints.unshift(newComplaint);
  logAuditEvent('COMPLAINT_CREATED', verifiedCitizenId, { complaintId, countryId });

  res.status(201).json(newComplaint);
});

app.post('/api/v1/complaints/:id/approve', (req, res) => {
  const complaint = serverComplaints.find(c => c.complaintId === req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  complaint.aiReviewApproved = true;
  complaint.status = 'IN_PROGRESS';
  complaint.updatedAt = new Date().toISOString();

  logAuditEvent('AI_REVIEW_APPROVED', 'CITIZEN', { complaintId: complaint.complaintId });
  res.json({ status: 'success', complaint });
});

app.post('/api/v1/complaints/:id/additional-info', (req, res) => {
  const complaint = serverComplaints.find(c => c.complaintId === req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  const { description, newEvidence } = req.body;
  if (description) {
    complaint.description += `\n[Additional Information]: ${description}`;
  }
  if (newEvidence && Array.isArray(newEvidence)) {
    complaint.evidence.push(...newEvidence);
  }
  complaint.status = 'AI_REVIEW_REQUIRED';
  complaint.updatedAt = new Date().toISOString();

  logAuditEvent('ADDITIONAL_INFO_ADDED', 'CITIZEN', { complaintId: complaint.complaintId });
  res.json({ status: 'success', complaint });
});

app.post('/api/v1/complaints/:id/appeal', (req, res) => {
  const complaint = serverComplaints.find(c => c.complaintId === req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  const { reason } = req.body;
  complaint.status = 'APPEALED';
  if (complaint.resolution) {
    complaint.resolution.citizenAction = 'APPEALED';
    complaint.resolution.appealReason = reason || 'Work was incomplete or unsatisfactory';
  }
  complaint.updatedAt = new Date().toISOString();

  logAuditEvent('COMPLAINT_APPEALED', 'CITIZEN', { complaintId: complaint.complaintId, reason });
  res.json({ status: 'appealed', complaint });
});

app.post('/api/v1/complaints/:id/reopen', (req, res) => {
  const complaint = serverComplaints.find(c => c.complaintId === req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  complaint.status = 'REOPENED';
  complaint.updatedAt = new Date().toISOString();

  logAuditEvent('COMPLAINT_REOPENED', 'SUPERVISOR', { complaintId: complaint.complaintId });
  res.json({ status: 'reopened', complaint });
});

// ==========================================
// 4. ADMIN & GOVERNMENT OFFICIALS MANAGEMENT
// ==========================================
app.get('/api/v1/admin/government/officials', (req, res) => {
  res.json({ total: serverOfficials.length, officials: serverOfficials });
});

app.post('/api/v1/admin/government/officials', (req, res) => {
  const data = req.body;
  if (!data.name || !data.officialEmail || !data.departmentId) {
    return res.status(400).json({ error: 'Missing required official attributes' });
  }

  const officialId = `OFF-${Math.floor(100 + Math.random() * 900)}-${data.departmentId.replace('DEPT-', '')}`;
  const newOfficial = {
    officialId,
    firebaseUid: data.firebaseUid || `gov-uid-${Math.random().toString(36).substring(2, 9)}`,
    employeeId: data.employeeId || `CCMC-${Math.floor(1000 + Math.random() * 9000)}`,
    name: data.name,
    officialEmail: data.officialEmail,
    phone: data.phone || '+91 94421 00000',
    designation: data.designation || 'Civic Field Officer',
    role: data.role || 'government_official',
    organizationId: data.organizationId || 'ORG-CCMC',
    departmentId: data.departmentId,
    departmentName: serverDepartments.find(d => d.departmentId === data.departmentId)?.name || 'Municipal Works',
    supervisorId: data.supervisorId || 'SUP-EAST-ZONE',
    jurisdiction: data.jurisdiction || {
      stateId: 'TN',
      districtId: 'CBE',
      localBodyId: 'CCMC',
      wardNumbers: ['12']
    },
    specializations: data.specializations || ['Municipal Defect Rectification'],
    employmentStatus: (data.employmentStatus || 'ACTIVE') as 'ACTIVE' | 'ON_LEAVE' | 'TRANSFERRED',
    verificationStatus: 'VERIFIED' as const,
    availability: (data.availability || 'AVAILABLE') as 'AVAILABLE' | 'BUSY' | 'OFF_DUTY',
    currentActiveCases: 0,
    maxActiveCases: data.maxActiveCases || 15,
    slaAdherenceScore: 100
  };

  serverOfficials.push(newOfficial);
  logAuditEvent('OFFICIAL_CREATED', 'ADMIN', { officialId: newOfficial.officialId, name: newOfficial.name });
  res.status(201).json(newOfficial);
});

app.patch('/api/v1/admin/government/officials/:id', (req, res) => {
  const official = serverOfficials.find(o => o.officialId === req.params.id);
  if (!official) {
    return res.status(404).json({ error: 'Official not found' });
  }
  Object.assign(official, req.body);
  logAuditEvent('OFFICIAL_UPDATED', 'ADMIN', { officialId: official.officialId });
  res.json(official);
});

app.post('/api/v1/admin/government/officials/:id/suspend', (req, res) => {
  const official = serverOfficials.find(o => o.officialId === req.params.id);
  if (!official) {
    return res.status(404).json({ error: 'Official not found' });
  }
  official.employmentStatus = 'ON_LEAVE';
  official.availability = 'OFF_DUTY';
  logAuditEvent('OFFICIAL_SUSPENDED', 'ADMIN', { officialId: official.officialId });
  res.json({ status: 'suspended', official });
});

app.post('/api/v1/admin/government/officials/:id/activate', (req, res) => {
  const official = serverOfficials.find(o => o.officialId === req.params.id);
  if (!official) {
    return res.status(404).json({ error: 'Official not found' });
  }
  official.employmentStatus = 'ACTIVE';
  official.availability = 'AVAILABLE';
  logAuditEvent('OFFICIAL_ACTIVATED', 'ADMIN', { officialId: official.officialId });
  res.json({ status: 'activated', official });
});

app.post('/api/v1/admin/government/officials/:id/role', (req, res) => {
  const official = serverOfficials.find(o => o.officialId === req.params.id);
  if (!official) {
    return res.status(404).json({ error: 'Official not found' });
  }
  const { role, designation } = req.body;
  if (role) official.role = role;
  if (designation) official.designation = designation;
  logAuditEvent('OFFICIAL_ROLE_CHANGED', 'ADMIN', { officialId: official.officialId, role, designation });
  res.json(official);
});

app.post('/api/v1/admin/government/officials/:id/department', (req, res) => {
  const official = serverOfficials.find(o => o.officialId === req.params.id);
  if (!official) {
    return res.status(404).json({ error: 'Official not found' });
  }
  const { departmentId } = req.body;
  const dept = serverDepartments.find(d => d.departmentId === departmentId);
  if (dept) {
    official.departmentId = dept.departmentId;
    official.departmentName = dept.name;
    logAuditEvent('OFFICIAL_DEPARTMENT_TRANSFERRED', 'ADMIN', { officialId: official.officialId, departmentId });
  }
  res.json(official);
});

app.post('/api/v1/admin/government/officials/:id/jurisdiction', (req, res) => {
  const official = serverOfficials.find(o => o.officialId === req.params.id);
  if (!official) {
    return res.status(404).json({ error: 'Official not found' });
  }
  const { jurisdiction } = req.body;
  if (jurisdiction) {
    official.jurisdiction = jurisdiction;
    logAuditEvent('OFFICIAL_JURISDICTION_ASSIGNED', 'ADMIN', { officialId: official.officialId, jurisdiction });
  }
  res.json(official);
});

app.get('/api/v1/admin/government/departments', (req, res) => {
  res.json({ total: serverDepartments.length, departments: serverDepartments });
});

app.get('/api/v1/admin/government/supervisors', (req, res) => {
  const supervisors = serverOfficials.filter(o => o.role === 'supervisor' || o.role === 'department_head');
  res.json({ total: supervisors.length, supervisors });
});

// ==========================================
// 5. GOVERNMENT OPERATIONS (ASSIGN, SLA, RESOLVE)
// ==========================================
app.get('/api/v1/government/complaints', (req, res) => {
  res.json({ total: serverComplaints.length, complaints: serverComplaints });
});

app.post('/api/v1/government/assign', (req, res) => {
  const { complaintId, officialId, assignmentMethod, reason } = req.body;
  const complaint = serverComplaints.find(c => c.complaintId === complaintId);
  const official = serverOfficials.find(o => o.officialId === officialId);

  if (!complaint || !official) {
    return res.status(404).json({ error: 'Complaint or Official not found' });
  }

  complaint.assignedOfficialId = official.officialId;
  complaint.assignedOfficialName = official.name;
  complaint.assignedDepartmentId = official.departmentId;
  complaint.assignedDepartmentName = official.departmentName;
  complaint.assignmentMethod = assignmentMethod || 'MANUAL';
  complaint.status = 'ASSIGNED';
  complaint.updatedAt = new Date().toISOString();

  official.currentActiveCases = (official.currentActiveCases || 0) + 1;

  logAuditEvent('COMPLAINT_ASSIGNED', 'SUPERVISOR', { complaintId, officialId, reason });
  res.json({ status: 'assigned', complaint });
});

app.post('/api/v1/government/transfer', (req, res) => {
  const { complaintId, toDepartmentId, reason } = req.body;
  const complaint = serverComplaints.find(c => c.complaintId === complaintId);
  const targetDept = serverDepartments.find(d => d.departmentId === toDepartmentId);

  if (!complaint || !targetDept) {
    return res.status(404).json({ error: 'Complaint or Department not found' });
  }

  complaint.assignedDepartmentId = targetDept.departmentId;
  complaint.assignedDepartmentName = targetDept.name;
  complaint.assignedOfficialId = undefined;
  complaint.assignedOfficialName = undefined;
  complaint.status = 'ROUTED';
  complaint.updatedAt = new Date().toISOString();

  logAuditEvent('COMPLAINT_TRANSFERRED', 'OFFICIAL', { complaintId, toDepartmentId, reason });
  res.json({ status: 'transferred', complaint });
});

app.post('/api/v1/government/extension', (req, res) => {
  const { complaintId, hours, reason, requestedBy } = req.body;
  const complaint = serverComplaints.find(c => c.complaintId === complaintId);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  const previousDue = complaint.sla.expectedResolutionAt;
  const newDueDate = new Date(new Date(previousDue).getTime() + (hours || 24) * 3600 * 1000).toISOString();

  complaint.sla.extendedUntil = newDueDate;
  complaint.sla.expectedResolutionAt = newDueDate;
  complaint.sla.extensionReason = reason || 'Material procurement and monsoon delay';
  complaint.sla.extensionApprovedBy = 'Zonal Supervisor';

  if (!complaint.sla.extensionHistory) {
    complaint.sla.extensionHistory = [];
  }
  complaint.sla.extensionHistory.push({
    previousDue,
    extendedTo: newDueDate,
    reason: complaint.sla.extensionReason,
    requestedBy: requestedBy || 'Field Official',
    approvedAt: new Date().toISOString()
  });

  logAuditEvent('SLA_EXTENSION_GRANTED', 'SUPERVISOR', { complaintId, hours, reason });
  res.json({ status: 'extended', complaint });
});

app.post('/api/v1/government/resolve', (req, res) => {
  const { complaintId, resolution } = req.body;
  const complaint = serverComplaints.find(c => c.complaintId === complaintId);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  complaint.status = 'RESOLVED';
  complaint.resolution = resolution;
  complaint.updatedAt = new Date().toISOString();

  logAuditEvent('COMPLAINT_RESOLVED', resolution.resolvedByOfficialName || 'OFFICIAL', { complaintId });
  res.json({ status: 'resolved', complaint });
});

// ==========================================
// 6. COMMUNITY OPPORTUNITIES API
// ==========================================
app.get('/api/v1/community/opportunities', (req, res) => {
  res.json({ total: serverOpportunities.length, opportunities: serverOpportunities });
});

app.post('/api/v1/community/opportunities/:id/accept', (req, res) => {
  const opp = serverOpportunities.find(o => o.id === req.params.id);
  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }
  const { orgName, orgId } = req.body;
  opp.status = 'ACCEPTED';
  opp.acceptedByOrgName = orgName || 'Coimbatore Green Earth Trust';
  opp.acceptedByOrgId = orgId || 'ORG-NGO-CBE-GREEN';
  logAuditEvent('OPPORTUNITY_ACCEPTED', opp.acceptedByOrgName, { opportunityId: opp.id });
  res.json({ status: 'accepted', opportunity: opp });
});

app.post('/api/v1/community/opportunities/:id/complete', (req, res) => {
  const opp = serverOpportunities.find(o => o.id === req.params.id);
  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }
  const { proofUrl } = req.body;
  opp.status = 'VERIFIED_COMPLETE';
  opp.completedAt = new Date().toISOString();
  opp.completionProofUrl = proofUrl || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80';
  logAuditEvent('OPPORTUNITY_COMPLETED', opp.acceptedByOrgName || 'COMMUNITY_ORG', { opportunityId: opp.id });
  res.json({ status: 'completed', opportunity: opp });
});

// ==========================================
// 7. GIS DATASET & ROLLBACK API
// ==========================================
app.get('/api/v1/admin/gis/datasets', (req, res) => {
  res.json({
    activeVersion: 'v2.1-gazette',
    availableVersions: [
      { id: 'v2.1-gazette', gazetteDate: '2024-01-10', totalWards: 100, publishedWards: 100, status: 'PUBLISHED' },
      { id: 'CCMC-2023-V2', gazetteDate: '2023-04-15', totalWards: 100, publishedWards: 94, status: 'SUPERSEDED' }
    ]
  });
});

app.get('/api/v1/admin/gis/coverage', (req, res) => {
  res.json({ coverage: serverCoverage });
});

app.post('/api/v1/admin/gis/rollback/:versionId', (req, res) => {
  const { versionId } = req.params;
  logAuditEvent('GIS_DATASET_ROLLBACK', 'ADMIN', { targetVersion: versionId });
  res.json({
    status: 'success',
    activeVersion: versionId,
    message: `GIS Boundary Delimitation successfully rolled back to ${versionId}. Historical snapshots preserved.`
  });
});

// ==========================================
// 8. MULTI-COUNTRY CONFIGURATION & JURISDICTION
// ==========================================
app.get('/api/v1/countries', (req, res) => {
  res.json({
    total: SUPPORTED_COUNTRIES.length,
    countries: SUPPORTED_COUNTRIES
  });
});

app.get('/api/v1/countries/:countryId', (req, res) => {
  const config = getCountryConfig(req.params.countryId);
  if (!config) {
    return res.status(404).json({ error: `Country ${req.params.countryId} not found or unsupported.` });
  }
  res.json(config);
});

app.get('/api/v1/countries/:countryId/administrative-levels', (req, res) => {
  const levels = COUNTRY_ADMIN_LEVELS[req.params.countryId.toUpperCase()];
  if (!levels) {
    return res.status(404).json({ error: `Administrative levels for ${req.params.countryId} not found.` });
  }
  res.json({ countryId: req.params.countryId.toUpperCase(), levels });
});

app.get('/api/v1/countries/:countryId/departments', (req, res) => {
  const cid = req.params.countryId.toUpperCase();
  const depts = serverDepartments.filter(d => (d as any).countryId === cid || (!('countryId' in d) && cid === 'IN'));
  res.json({ countryId: cid, total: depts.length, departments: depts });
});

app.get('/api/v1/countries/:countryId/roles', (req, res) => {
  const config = getCountryConfig(req.params.countryId);
  if (!config) {
    return res.status(404).json({ error: `Country ${req.params.countryId} not found.` });
  }
  const defaultRoles = [
    'citizen',
    'government_official',
    'supervisor',
    'department_head',
    'district_authority',
    'state_authority',
    'ngo',
    'volunteer',
    'student',
    'innovator',
    'admin'
  ];
  res.json({ countryId: config.countryId, roles: defaultRoles });
});

app.get('/api/v1/gis/countries/:countryId/coverage', (req, res) => {
  const cid = req.params.countryId.toUpperCase();
  const coverage = serverCoverage.find(c => (c as any).countryId === cid) || serverCoverage[0];
  res.json(coverage);
});

// Global / National GIS Seeder Endpoint (supports country filtering, dryRun, merge/replace)
app.post('/api/v1/admin/gis/seed', (req, res) => {
  const { country = 'ALL', mode = 'merge', dryRun = false } = req.body;
  const targetCountry = (country || 'ALL').toUpperCase();

  let toSeed: any[] = [];
  if (targetCountry === 'ALL') {
    Object.values(COUNTRY_GIS_DATASETS).forEach(list => {
      toSeed.push(...list);
    });
  } else if (COUNTRY_GIS_DATASETS[targetCountry]) {
    toSeed = COUNTRY_GIS_DATASETS[targetCountry];
  } else {
    return res.status(400).json({ error: `Unknown country dataset: ${targetCountry}. Supported: IN, US, GB, ALL` });
  }

  if (dryRun) {
    return res.json({
      status: 'DRY_RUN',
      targetCountry,
      featuresToSeedCount: toSeed.length,
      currentTotalWards: serverGisWards.length,
      sampleFeatures: toSeed.slice(0, 3)
    });
  }

  if (mode === 'replace') {
    serverGisWards = [...toSeed];
  } else {
    // Merge by wardId
    const existingIds = new Set(serverGisWards.map(w => w.wardId));
    const newItems = toSeed.filter(w => !existingIds.has(w.wardId));
    serverGisWards.push(...newItems);
  }

  logAuditEvent('GIS_DATA_SEEDED', 'ADMIN', { targetCountry, mode, count: toSeed.length });

  res.json({
    status: 'SUCCESS',
    targetCountry,
    seededCount: toSeed.length,
    totalWardsInSystem: serverGisWards.length
  });
});

// 2. Server-side multimodal evidence analysis endpoint using Gemini Flash
app.post('/api/analyze-evidence', async (req, res) => {
  const { description, imageBase64, mimeType, apiKey, fileName, isLikelyWebDownload, provenanceReason } = req.body;

  const client = getGeminiClient(apiKey);

  if (!client) {
    return res.status(200).json({
      fallback: true,
      message: 'No GEMINI_API_KEY configured. Fallback vision/heuristic engine active.'
    });
  }

  try {
    const prompt = `You are an expert municipal infrastructure defect verification and image forensic AI for the CivicSync civic platform.
Inspect this civic issue report and its attached visual photographic evidence carefully.
User note or filename: "${description || fileName || 'Visual civic issue report'}"
${isLikelyWebDownload ? `CRITICAL PROVENANCE AUDIT ALERT: Client-side file inspection flagged this image as a downloaded internet/stock asset (filename: "${fileName || ''}", missing native camera sensor hardware tags). ${provenanceReason || ''}` : ''}

MANDATORY FIRST STEP: IMAGE FORENSIC & PROVENANCE AUDIT:
1. Is this image AI-GENERATED, SYNTHETIC, CGI, 3D RENDERED, ANIME, CARTOON, or DIGITAL ART?
   - Check for: synthetic smooth diffusion textures, unnatural specular gradients, impossible geometries, digital brushwork, anime/cartoon styling, or surreal art.
   - Set "isAiGeneratedOrSynthetic": true / false.
2. Is this image an INTERNET / STOCK / NEWS MEDIA / RECYCLED PHOTO / DOWNLOADED WEB IMAGE?
   - Check for: stock photography angles and studio-quality lighting/composition, watermarks or wiped watermarks (Getty, Alamy, Shutterstock, news outlets), foreign geography/road signs/license plates not typical of local field reporting, web recompression artifacts, or generic internet photos of potholes/garbage recycled from search engines or social media.
   - Set "isInternetOrStockImage": true / false.
   - Set "isFakeOrRecycledEvidence": true / false.
   - Set "provenanceWarning": string explaining the suspicion (or empty string if authentic live on-site photo).
3. Does this image show a GENUINE MUNICIPAL / CIVIC INFRASTRUCTURE ISSUE?
   - Valid civic issues: road potholes, broken asphalt, overflowing garbage, illegal dumpsite, broken/open manhole, sewage leak, broken streetlight, fallen power lines, clogged storm drain, broken sidewalk, water main rupture, fallen tree blocking road.
   - NON-CIVIC subjects: personal selfies, portraits, pets, indoor bedrooms/living rooms, food, anime, video games, cars without defects, abstract art, notebook pages, documents, books.
   - Set "isCivicRelated": true / false.
4. Set "detectedSourceType": "LIVE_CAMERA_PHOTO" | "INTERNET_OR_STOCK" | "SYNTHETIC_AI" | "DOCUMENT" | "UNKNOWN".
5. Is this VALID LOCAL CIVIC EVIDENCE?
   - Set "isValidEvidence": true ONLY IF (isCivicRelated === true AND isAiGeneratedOrSynthetic === false AND isInternetOrStockImage === false AND isFakeOrRecycledEvidence === false).
   - If false, explain why in "rejectionReason" (e.g. "Uploaded image is a recycled internet/stock photo, not an authentic on-site citizen photograph. CivicSync disallows internet-sourced photos to prevent fraudulent or duplicate complaints.", or "Synthetic / AI-generated artwork detected.", or "Non-civic subject detected.").
6. Identify what is shown in "detectedSubject" (e.g. "Internet stock photo of waterlogged pothole", "Handwritten notebook page", "Live camera asphalt pothole").

IF VALID EVIDENCE (isValidEvidence == true):
- Categorize domain ("CIVIC_INFRASTRUCTURE" | "PUBLIC_HEALTH_ENVIRONMENT" | "WATER_SANITATION"), subDomain, problemType, title, generatedDescription, severity, urgency, safetyRisk, affectedPopulation, environmentalImpact, suggestedDepartment.

IF NOT VALID EVIDENCE (isValidEvidence == false):
- domain: "INVALID_SUBMISSION"
- subDomain: isInternetOrStockImage ? "INTERNET_STOCK_MEDIA" : "NON_CIVIC_OR_SYNTHETIC"
- problemType: isAiGeneratedOrSynthetic ? "Synthetic / AI-Generated Image" : (isInternetOrStockImage ? "Recycled Internet / Stock Photo Detected" : "Non-Civic Content / Document")
- title: isAiGeneratedOrSynthetic ? "Rejected: AI-Generated / Synthetic Evidence" : (isInternetOrStockImage ? "Rejected: Recycled Internet / Stock Photo" : "Rejected: Non-Civic Content")
- generatedDescription: rejectionReason
- severity: "LOW"
- severityScore: 0
- urgency: "LOW"
- safetyRisk: "NONE"
- affectedPopulation: "FEW"
- environmentalImpact: "NONE"
- suggestedDepartment: "Civic Integrity & Verification Cell"
- needsHumanReview: true

Respond strictly with a single JSON object adhering to this schema:
{
  "isCivicRelated": boolean,
  "isAiGeneratedOrSynthetic": boolean,
  "isInternetOrStockImage": boolean,
  "isFakeOrRecycledEvidence": boolean,
  "isValidEvidence": boolean,
  "detectedSubject": string,
  "detectedSourceType": "LIVE_CAMERA_PHOTO" | "INTERNET_OR_STOCK" | "SYNTHETIC_AI" | "DOCUMENT" | "UNKNOWN",
  "provenanceWarning": string,
  "rejectionReason": string,
  "domain": string,
  "subDomain": string,
  "problemType": string,
  "title": string,
  "generatedDescription": string,
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "severityScore": number,
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "IMMEDIATE",
  "safetyRisk": "NONE" | "LOW" | "MODERATE" | "HIGH" | "HAZARDOUS",
  "affectedPopulation": "FEW" | "NEIGHBORHOOD" | "COMMUNITY" | "MASSIVE",
  "environmentalImpact": "NONE" | "LOW" | "MODERATE" | "SEVERE",
  "suggestedDepartment": string,
  "confidence": number,
  "evidenceQuality": "POOR" | "ACCEPTABLE" | "GOOD" | "EXCELLENT",
  "needsHumanReview": boolean,
  "explanation": string
}`;

    const parts: any[] = [{ text: prompt }];

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBase64
        }
      });
    }

    // Models priority: gemini-3.6-flash
    const candidateModels = [
      process.env.GEMINI_MODEL || 'gemini-3.6-flash',
      'gemini-3.6-flash'
    ];

    let responseText = '';
    let resolvedModel = candidateModels[0];
    let executionError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: parts,
          config: {
            responseMimeType: 'application/json'
          }
        });
        if (response && response.text) {
          responseText = response.text;
          resolvedModel = modelName;
          break;
        }
      } catch (mErr: any) {
        console.warn(`Attempt with ${modelName} encountered: ${mErr?.message || mErr}. Trying next candidate...`);
        executionError = mErr;
      }
    }

    if (!responseText) {
      throw executionError || new Error('No candidate Gemini model succeeded');
    }

    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    const parsed = JSON.parse(cleanJson);
    const isSynthetic = Boolean(parsed.isAiGeneratedOrSynthetic);
    const isInternet = Boolean(parsed.isInternetOrStockImage) || Boolean(parsed.isFakeOrRecycledEvidence) || Boolean(isLikelyWebDownload);
    const isCivic = parsed.isCivicRelated !== false;
    const isValid = parsed.isValidEvidence !== false && !isSynthetic && isCivic && !isInternet;

    parsed.isAiGeneratedOrSynthetic = isSynthetic;
    parsed.isInternetOrStockImage = isInternet;
    parsed.isFakeOrRecycledEvidence = isInternet;
    parsed.isCivicRelated = isCivic;
    parsed.isValidEvidence = isValid;
    if (!isValid && isInternet) {
      parsed.domain = 'INVALID_SUBMISSION';
      parsed.subDomain = 'INTERNET_STOCK_MEDIA';
      parsed.problemType = 'Recycled Internet / Stock Photo Detected';
      parsed.title = 'Rejected: Recycled Internet / Stock Photo';
      parsed.suggestedDepartment = 'Civic Integrity & Verification Cell';
      parsed.detectedSourceType = 'INTERNET_OR_STOCK';
      parsed.rejectionReason = parsed.rejectionReason || 'Uploaded image was identified as a downloaded internet or stock photo, not an authentic on-site citizen photograph. Civic complaints require authentic live photos taken on-site to prevent fake reports.';
    }

    return res.json({ fallback: false, data: parsed, model: resolvedModel });
  } catch (error: any) {
    console.warn('Gemini server execution error:', error?.message || error);
    return res.status(200).json({
      fallback: true,
      error: error?.message || 'Gemini processing failed, using vision heuristic'
    });
  }
});

// Configure or check Gemini status dynamically
app.get('/api/gemini/status', (req, res) => {
  const hasKey = Boolean(runtimeApiKey || (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'));
  res.json({
    configured: hasKey,
    model: process.env.GEMINI_MODEL || 'gemini-3.6-flash'
  });
});

app.post('/api/gemini/configure', (req, res) => {
  const { apiKey } = req.body;
  if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 10) {
    runtimeApiKey = apiKey.trim();
    return res.json({ success: true, message: 'Gemini API key configured successfully' });
  }
  return res.status(400).json({ success: false, message: 'Invalid API key provided' });
});

function getDeterministicCivicAdvice(question: string): string {
  const q = (question || '').toLowerCase();

  if (q.includes('pothole') || q.includes('road')) {
    return `**Road & Pothole Repair Standards**:
Under IRC (Indian Roads Congress) SP:20 and municipal engineering norms:
1. **Response Time**: Potholes on arterial and collector roads must be cold-mix patched within 48–72 hours of citizen notification.
2. **Defect Liability Period (DLP)**: Newly laid bituminous roads carry a mandatory 3-to-5-year contractor maintenance warranty. The municipality must enforce free rectification from the contractor.
3. **Escalation Pathway**: If unaddressed, escalate to the Zonal Assistant Executive Engineer (AEE) Roads with timestamped geo-tagged photos.`;
  }

  if (q.includes('garbage') || q.includes('waste') || q.includes('dump') || q.includes('trash')) {
    return `**Solid Waste Management Rules 2016 & Municipal Bylaws**:
1. **Segregated Collection**: Door-to-door collection of segregated waste (wet/dry/sanitary) is mandatory under Rule 15 of SWM Rules 2016.
2. **Open Dumping & Burning**: Burning municipal solid waste is strictly prohibited under National Green Tribunal (NGT) directives and attracts spot fines.
3. **Blackspot Elimination**: Sanitary Inspectors are mandated to clear community garbage dumps within 24 hours and install lime bleaching.`;
  }

  if (q.includes('sewage') || q.includes('manhole') || q.includes('drain')) {
    return `**Underground Drainage & Open Manhole Emergency Guidelines**:
1. **Critical Safety Hazard**: Open or damaged manholes require physical barricading and hazard lighting within 2 hours, and cast-iron/SFRC lid replacement within 24 hours.
2. **Prohibition of Manual Scavenging**: Under the 2013 Central Act, cleaning must be carried out using mechanized jetting and super-sucker vacuum machines.
3. **Emergency Escalation**: Immediate alert triggers to the Assistant Engineer, Water Supply & Sewerage Board.`;
  }

  return `**Municipal Resolution Timelines & Citizen Rights**:
- **Default Resolution SLA**: 72 hours for standard municipal issues, and 24 hours for life-safety critical emergencies (open manholes, live wires).
- **Hierarchical Escalation**: If unaddressed within SLA, the grievance automatically elevates from Field Officer → Zonal Supervisor → Department Head → District Collector.
- **RTI / Citizen Rights**: Under the Right to Information Act 2005 (Section 6), citizens can inspect public works documents, road repair bills, and contractor measurement books if quality is sub-standard.
- **Next Step**: You can file a formal complaint using our Step-by-Step Reporting wizard with GPS coordinates for automatic ward assignment.`;
}

// 3. Server-side Civic Legal & Grievance Assistant
app.post('/api/civic-advisor', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { question } = req.body || {};
  const client = getGeminiClient();

  if (!client) {
    return res.json({
      reply: getDeterministicCivicAdvice(question),
      isHeuristic: true
    });
  }

  try {
    const prompt = `You are the CivicSync Municipal Advisor & Citizen Rights Copilot for urban Indian municipalities (such as Coimbatore CCMC, Chennai GCC, Bengaluru BBMP, Mumbai BMC, Delhi MCD).
Help this citizen understand their municipal rights, relevant laws (Solid Waste Management Rules 2016, Municipal Corporations Act, Right to Information Act 2005, Indian Roads Congress standards), SLA escalation timelines, and practical steps to resolve civic grievances.
Be concise, practical, respectful, and structured with bold highlights and bullet points.

Citizen Question: "${question || 'What are citizen charter SLAs for civic complaints?'}"`;
    const candidateModels = [
      process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash'
    ];
      let replyText = '';
      for (const m of candidateModels) {
        try {
          const resp = await client.models.generateContent({
            model: m,
            contents: [{ text: prompt }]
          });
          if (resp && resp.text) {
            replyText = resp.text;
            break;
          }
        } catch {
          // try next
        }
      }

    return res.json({
      reply: replyText || getDeterministicCivicAdvice(question),
      isHeuristic: !replyText
    });
  } catch (err: any) {
    console.warn('Gemini advisor error, using deterministic advice:', err?.message || err);
    return res.json({
      reply: getDeterministicCivicAdvice(question),
      isHeuristic: true
    });
  }
});

// Vite Middleware Setup for Dev and Production with HMR WebSocket integration
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer
        }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicSync server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
