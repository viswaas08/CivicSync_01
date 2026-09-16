import { GISLocationSnapshot, Department, GovernmentOfficial } from '../types';

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    departmentId: 'DEPT-ROADS',
    name: 'Roads, Bridges & Infrastructure',
    code: 'RBI',
    organizationId: 'ORG-CCMC',
    organizationName: 'Coimbatore City Municipal Corporation',
    headName: 'Er. S. Karunakaran, Chief Engineer',
    contactEmail: 'roads.ccmc@civicsync.gov.in',
    contactPhone: '+91 422 2390261',
    categoriesHandled: ['Pothole', 'Damaged Road', 'Cave-In', 'Broken Footpath', 'Damaged Divider', 'Speed Breaker'],
    activeOfficersCount: 14,
    openCasesCount: 42,
    resolvedCasesCount: 388,
    slaComplianceRate: 94.2
  },
  {
    departmentId: 'DEPT-SANITATION',
    name: 'Solid Waste Management & Sanitation',
    code: 'SWM',
    organizationId: 'ORG-CCMC',
    organizationName: 'Coimbatore City Municipal Corporation',
    headName: 'Dr. R. Meenakshi, City Health Officer',
    contactEmail: 'sanitation.ccmc@civicsync.gov.in',
    contactPhone: '+91 422 2390262',
    categoriesHandled: ['Garbage Accumulation', 'Illegal Dumping', 'Overflowing Dustbin', 'Dead Animal Removal', 'Debris'],
    activeOfficersCount: 22,
    openCasesCount: 31,
    resolvedCasesCount: 812,
    slaComplianceRate: 96.8
  },
  {
    departmentId: 'DEPT-WATER-SEWAGE',
    name: 'Water Supply & Underground Drainage',
    code: 'UGD',
    organizationId: 'ORG-CCMC',
    organizationName: 'Coimbatore City Municipal Corporation',
    headName: 'Er. K. Velmurugan, Executive Engineer',
    contactEmail: 'water.ccmc@civicsync.gov.in',
    contactPhone: '+91 422 2390263',
    categoriesHandled: ['Sewage Overflow', 'Water Pipeline Burst', 'Contaminated Water', 'Open Manhole', 'Drainage Blockage'],
    activeOfficersCount: 18,
    openCasesCount: 29,
    resolvedCasesCount: 495,
    slaComplianceRate: 91.5
  },
  {
    departmentId: 'DEPT-ELECTRICAL',
    name: 'Street Lighting & Electrical Infrastructure',
    code: 'ELE',
    organizationId: 'ORG-CCMC',
    organizationName: 'Coimbatore City Municipal Corporation',
    headName: 'Er. T. Senthil Kumar, Assistant Executive Engineer',
    contactEmail: 'electrical.ccmc@civicsync.gov.in',
    contactPhone: '+91 422 2390264',
    categoriesHandled: ['Broken Streetlight', 'Dark Spot', 'Hanging Wire', 'Damaged Electric Pole', 'Transformer Sparking'],
    activeOfficersCount: 12,
    openCasesCount: 17,
    resolvedCasesCount: 420,
    slaComplianceRate: 97.1
  },
  {
    departmentId: 'DEPT-PUBLIC-HEALTH',
    name: 'Public Health, Vector Control & Environment',
    code: 'PHV',
    organizationId: 'ORG-CCMC',
    organizationName: 'Coimbatore City Municipal Corporation',
    headName: 'Dr. M. Pradeep, Epidemiologist',
    contactEmail: 'health.ccmc@civicsync.gov.in',
    contactPhone: '+91 422 2390265',
    categoriesHandled: ['Stagnant Water', 'Mosquito Breeding', 'Chemical Spill', 'Bio-Medical Waste', 'Public Urinal Maintenance'],
    activeOfficersCount: 16,
    openCasesCount: 23,
    resolvedCasesCount: 310,
    slaComplianceRate: 93.4
  }
];

export const INITIAL_OFFICIALS: GovernmentOfficial[] = [
  {
    officialId: 'OFF-012-ROADS',
    firebaseUid: 'gov-uid-012-roads',
    employeeId: 'CCMC-ENG-2018-042',
    name: 'Er. Anandhan Krishnan',
    officialEmail: 'anandhan.k@ccmc.gov.in',
    phone: '+91 94421 00121',
    designation: 'Assistant Engineer (Roads & Infrastructure)',
    role: 'government_official',
    organizationId: 'ORG-CCMC',
    departmentId: 'DEPT-ROADS',
    departmentName: 'Roads, Bridges & Infrastructure',
    supervisorId: 'SUP-EAST-ZONE',
    jurisdiction: {
      stateId: 'TN',
      districtId: 'CBE',
      localBodyId: 'CCMC',
      wardNumbers: ['12', '13', '14', '23']
    },
    specializations: ['Asphalt Paver Operations', 'Pothole Patching', 'Storm Drain Bridges'],
    employmentStatus: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    availability: 'AVAILABLE',
    currentActiveCases: 4,
    maxActiveCases: 15,
    slaAdherenceScore: 95.8
  },
  {
    officialId: 'OFF-023-SWM',
    firebaseUid: 'gov-uid-023-swm',
    employeeId: 'CCMC-SWM-2019-108',
    name: 'Thiru. Selvaraj Manickam',
    officialEmail: 'selvaraj.m@ccmc.gov.in',
    phone: '+91 94421 00234',
    designation: 'Sanitary Inspector (East Zone)',
    role: 'government_official',
    organizationId: 'ORG-CCMC',
    departmentId: 'DEPT-SANITATION',
    departmentName: 'Solid Waste Management & Sanitation',
    supervisorId: 'SUP-EAST-ZONE',
    jurisdiction: {
      stateId: 'TN',
      districtId: 'CBE',
      localBodyId: 'CCMC',
      wardNumbers: ['12', '23', '24', '45']
    },
    specializations: ['Bulk Garbage Clearance', 'Segregation Auditing', 'Night Sanitation Sweep'],
    employmentStatus: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    availability: 'AVAILABLE',
    currentActiveCases: 6,
    maxActiveCases: 20,
    slaAdherenceScore: 97.2
  },
  {
    officialId: 'OFF-045-UGD',
    firebaseUid: 'gov-uid-045-ugd',
    employeeId: 'CCMC-UGD-2020-055',
    name: 'Er. Nithya Soundararajan',
    officialEmail: 'nithya.s@ccmc.gov.in',
    phone: '+91 94421 00455',
    designation: 'Junior Engineer (Water & Underground Drainage)',
    role: 'government_official',
    organizationId: 'ORG-CCMC',
    departmentId: 'DEPT-WATER-SEWAGE',
    departmentName: 'Water Supply & Underground Drainage',
    supervisorId: 'SUP-WEST-ZONE',
    jurisdiction: {
      stateId: 'TN',
      districtId: 'CBE',
      localBodyId: 'CCMC',
      wardNumbers: ['45', '46', '60', '72']
    },
    specializations: ['Suction Jetting Units', 'Underground Line Relining', 'Manhole Restoration'],
    employmentStatus: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    availability: 'AVAILABLE',
    currentActiveCases: 5,
    maxActiveCases: 12,
    slaAdherenceScore: 92.4
  },
  {
    officialId: 'OFF-072-ELE',
    firebaseUid: 'gov-uid-072-ele',
    employeeId: 'CCMC-ELE-2017-019',
    name: 'Thiru. Muthu Kumaravel',
    officialEmail: 'muthu.k@ccmc.gov.in',
    phone: '+91 94421 00721',
    designation: 'Electrical Inspector (South Zone)',
    role: 'government_official',
    organizationId: 'ORG-CCMC',
    departmentId: 'DEPT-ELECTRICAL',
    departmentName: 'Street Lighting & Electrical Infrastructure',
    supervisorId: 'SUP-SOUTH-ZONE',
    jurisdiction: {
      stateId: 'TN',
      districtId: 'CBE',
      localBodyId: 'CCMC',
      wardNumbers: ['71', '72', '73', '85']
    },
    specializations: ['LED Smart Feeder Panels', 'Underground Cable Fault Finding', 'Emergency Disconnect'],
    employmentStatus: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    availability: 'AVAILABLE',
    currentActiveCases: 3,
    maxActiveCases: 15,
    slaAdherenceScore: 98.1
  },
  {
    officialId: 'SUP-EAST-ZONE',
    firebaseUid: 'gov-uid-sup-east',
    employeeId: 'CCMC-SUP-2015-008',
    name: 'Thiru. Balasubramanian V.',
    officialEmail: 'balasubramanian.v@ccmc.gov.in',
    phone: '+91 94421 00010',
    designation: 'Zonal Supervisor (East Zone)',
    role: 'supervisor',
    organizationId: 'ORG-CCMC',
    departmentId: 'DEPT-ROADS',
    departmentName: 'Roads, Bridges & Infrastructure',
    jurisdiction: {
      stateId: 'TN',
      districtId: 'CBE',
      localBodyId: 'CCMC',
      wardNumbers: ['12', '13', '14', '23', '24']
    },
    specializations: ['Zonal Inter-Department Coordination', 'Escalation Resolution'],
    employmentStatus: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    availability: 'AVAILABLE',
    currentActiveCases: 14,
    maxActiveCases: 50,
    slaAdherenceScore: 96.0
  }
];

export interface RoutingDecision {
  department: Department;
  responsibleOfficer?: GovernmentOfficial;
  routingRuleTriggered: string;
  isJurisdictionExact: boolean;
  confidence: number;
}

/**
 * Deterministic Backend Routing Engine
 * Enforces rule: Gemini suggests a department, backend deterministically computes the responsible department.
 */
export function determineResponsibleDepartment(
  problemType: string,
  category: string,
  locationSnapshot: GISLocationSnapshot,
  suggestedDepartmentName?: string,
  departments: Department[] = INITIAL_DEPARTMENTS
): Department {
  const normProblem = (problemType + ' ' + category).toLowerCase();

  // 1. Sewage, Drainage & Water Supply
  if (normProblem.includes('sewag') || normProblem.includes('drain') || normProblem.includes('pipe') || normProblem.includes('leak') || normProblem.includes('water supply') || normProblem.includes('manhole')) {
    const d = departments.find(dep => dep.departmentId === 'DEPT-WATER-SEWAGE');
    if (d) return d;
  }

  // 2. Sanitation & Solid Waste
  if (normProblem.includes('garbag') || normProblem.includes('waste') || normProblem.includes('dump') || normProblem.includes('bin') || normProblem.includes('debris') || normProblem.includes('trash') || normProblem.includes('dead animal')) {
    const d = departments.find(dep => dep.departmentId === 'DEPT-SANITATION');
    if (d) return d;
  }

  // 3. Electrical & Streetlights
  if (normProblem.includes('light') || normProblem.includes('electric') || normProblem.includes('wire') || normProblem.includes('dark') || normProblem.includes('pole') || normProblem.includes('transformer')) {
    const d = departments.find(dep => dep.departmentId === 'DEPT-ELECTRICAL');
    if (d) return d;
  }

  // 4. Public Health & Vector Control
  if (normProblem.includes('stagnant') || normProblem.includes('mosquito') || normProblem.includes('dengue') || normProblem.includes('chemical') || normProblem.includes('hygiene') || normProblem.includes('sanitary')) {
    const d = departments.find(dep => dep.departmentId === 'DEPT-PUBLIC-HEALTH');
    if (d) return d;
  }

  // 5. Roads, Potholes & Infrastructure (Default / Primary)
  if (normProblem.includes('pothole') || normProblem.includes('road') || normProblem.includes('footpath') || normProblem.includes('pavement') || normProblem.includes('divider') || normProblem.includes('bridge') || normProblem.includes('cave-in')) {
    const d = departments.find(dep => dep.departmentId === 'DEPT-ROADS');
    if (d) return d;
  }

  // Fallback to Gemini suggestion if matching a known department
  if (suggestedDepartmentName) {
    const matched = departments.find(d => 
      d.name.toLowerCase().includes(suggestedDepartmentName.toLowerCase()) || 
      suggestedDepartmentName.toLowerCase().includes(d.code.toLowerCase())
    );
    if (matched) return matched;
  }

  // Default to Roads & Infrastructure
  return departments[0];
}

/**
 * Filters and ranks eligible government officials based on jurisdiction, specialization, workload, and availability
 */
export function findEligibleOfficials(
  departmentId: string,
  locationSnapshot: GISLocationSnapshot,
  officials: GovernmentOfficial[] = INITIAL_OFFICIALS
): GovernmentOfficial[] {
  return officials.filter(off => {
    if (off.departmentId !== departmentId) return false;
    if (off.employmentStatus !== 'ACTIVE' || off.availability === 'OFF_DUTY') return false;
    if (off.currentActiveCases >= off.maxActiveCases) return false;

    // Check ward jurisdiction if known
    if (locationSnapshot.wardNumber && off.jurisdiction.wardNumbers.length > 0) {
      return off.jurisdiction.wardNumbers.includes(locationSnapshot.wardNumber);
    }

    // Otherwise check local body match
    return off.jurisdiction.localBodyId === locationSnapshot.localBodyId;
  }).sort((a, b) => {
    // Rank by available capacity and SLA adherence
    const capacityA = a.maxActiveCases - a.currentActiveCases;
    const capacityB = b.maxActiveCases - b.currentActiveCases;
    if (capacityB !== capacityA) return capacityB - capacityA;
    return b.slaAdherenceScore - a.slaAdherenceScore;
  });
}
