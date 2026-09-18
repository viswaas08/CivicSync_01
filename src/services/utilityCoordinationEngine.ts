import { 
  ExcavationPermit, 
  SpatialConflictReport, 
  CitizenReinstatementAudit, 
  UtilityAgencyType 
} from '../types';

// Statutory reinstatement deposit rates per linear meter (Standard Indian Urban Local Body bylaws)
export const ESCROW_RATES_PER_METER: Record<ExcavationPermit['roadSurfaceType'], number> = {
  BITUMINOUS_ASPHALT: 2500,
  CEMENT_CONCRETE: 3800,
  INTERLOCKING_PAVER: 1800,
  EARTHEN_SHOULDER: 950
};

// Initial authoritative registry of active utility permits across Indian corporations
export const INITIAL_UTILITY_PERMITS: ExcavationPermit[] = [
  {
    permitId: 'PERMIT-2026-001',
    permitNumber: 'CCMC-NOC-2026-0812',
    agencyName: 'TWAD Board (Tamil Nadu Water Supply & Drainage)',
    agencyType: 'WATER_SUPPLY',
    roadStretchName: 'Avinashi Road (KM 8.2 to 10.4)',
    ulbId: 'CCMC',
    ulbName: 'Coimbatore City Municipal Corporation',
    wardNumber: '12',
    startCoordinates: [11.0268, 77.0125],
    endCoordinates: [11.0321, 77.0289],
    lengthMeters: 220,
    depthMeters: 2.2,
    roadSurfaceType: 'BITUMINOUS_ASPHALT',
    applicationDate: '2026-08-01T10:00:00.000Z',
    plannedStartDate: '2026-09-25T08:00:00.000Z',
    plannedEndDate: '2026-10-15T18:00:00.000Z',
    purposeDescription: 'Laying 600mm Ductile Iron potable drinking water pipeline trunk mains under Pillur Scheme III.',
    trafficPoliceNocNumber: 'CBE-TRAFFIC-NOC-2026-441',
    trafficDiversionPlan: 'Night trenching from 22:00 to 05:00 hrs with left-lane barricading and LED flasher beacons.',
    status: 'TRENCHING_ACTIVE',
    escrowAmountInInr: 550000,
    escrowStatus: 'HELD_IN_ESCROW'
  },
  {
    permitId: 'PERMIT-2026-002',
    permitNumber: 'CCMC-NOC-2026-0845',
    agencyName: 'TANGEDCO (Electricity Board)',
    agencyType: 'ELECTRICITY',
    roadStretchName: 'Trichy Road (Sungam Junction to Ramanathapuram)',
    ulbId: 'CCMC',
    ulbName: 'Coimbatore City Municipal Corporation',
    wardNumber: '14',
    startCoordinates: [10.9982, 76.9745],
    endCoordinates: [11.0045, 76.9912],
    lengthMeters: 150,
    depthMeters: 1.5,
    roadSurfaceType: 'CEMENT_CONCRETE',
    applicationDate: '2026-08-10T11:30:00.000Z',
    plannedStartDate: '2026-10-05T09:00:00.000Z',
    plannedEndDate: '2026-10-22T17:00:00.000Z',
    purposeDescription: 'Subsurface 11kV High-Tension distribution cable conversion from overhead lines for storm resilience.',
    trafficPoliceNocNumber: 'CBE-TRAFFIC-NOC-2026-489',
    trafficDiversionPlan: 'Single lane operation with rubber speed cushions and traffic warden deployment.',
    status: 'NOC_APPROVED',
    escrowAmountInInr: 570000,
    escrowStatus: 'HELD_IN_ESCROW'
  },
  {
    permitId: 'PERMIT-2026-003',
    permitNumber: 'CCMC-NOC-2026-0790',
    agencyName: 'Reliance Jio Digital Infocomm',
    agencyType: 'TELECOM_OFC',
    roadStretchName: 'Mettupalayam Road (Saibaba Colony Stretch)',
    ulbId: 'CCMC',
    ulbName: 'Coimbatore City Municipal Corporation',
    wardNumber: '22',
    startCoordinates: [11.0255, 76.9456],
    endCoordinates: [11.0310, 76.9490],
    lengthMeters: 116,
    depthMeters: 1.2,
    roadSurfaceType: 'BITUMINOUS_ASPHALT',
    applicationDate: '2026-07-15T09:00:00.000Z',
    plannedStartDate: '2026-08-20T08:00:00.000Z',
    plannedEndDate: '2026-09-05T18:00:00.000Z',
    purposeDescription: 'Underground micro-trenching for 5G Gigabit Optical Fiber ducting network.',
    trafficPoliceNocNumber: 'CBE-TRAFFIC-NOC-2026-390',
    trafficDiversionPlan: 'Horizontal directional drilling (HDD) to minimize open cutting on vehicular carriage.',
    status: 'REINSTATEMENT_SUBMITTED',
    escrowAmountInInr: 290000,
    escrowStatus: 'UNDER_CITIZEN_AUDIT',
    reinstatementProofUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80',
    reinstatementSubmittedAt: '2026-09-08T14:30:00.000Z',
    citizenAudits: [
      {
        auditId: 'AUDIT-001',
        permitId: 'PERMIT-2026-003',
        citizenUid: 'cit-009-auditor',
        citizenName: 'K. Balasubramanian (Ward Committee)',
        smoothnessRating: 4,
        debrisCleared: true,
        sunkenTrenchDefect: false,
        photoEvidenceUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
        remarks: 'Asphalt cold mix leveled and steam-roller rolled. No loose gravel or debris left behind.',
        timestamp: '2026-09-10T11:15:00.000Z'
      }
    ]
  },
  {
    permitId: 'PERMIT-2026-004',
    permitNumber: 'CCMC-NOC-2026-0902',
    agencyName: 'GAIL Gas Limited',
    agencyType: 'GAS_PIPELINE',
    roadStretchName: 'Sathyamangalam Road (Saravanampatti to Ganapathy)',
    ulbId: 'CCMC',
    ulbName: 'Coimbatore City Municipal Corporation',
    wardNumber: '35',
    startCoordinates: [11.0645, 77.0012],
    endCoordinates: [11.0755, 77.0125],
    lengthMeters: 280,
    depthMeters: 1.8,
    roadSurfaceType: 'BITUMINOUS_ASPHALT',
    applicationDate: '2026-09-02T16:00:00.000Z',
    plannedStartDate: '2026-10-18T08:00:00.000Z',
    plannedEndDate: '2026-11-10T18:00:00.000Z',
    purposeDescription: 'City Gas Distribution (CGD) medium-density polyethylene pipeline for residential domestic piped natural gas (PNG).',
    trafficPoliceNocNumber: 'CBE-TRAFFIC-NOC-2026-512',
    trafficDiversionPlan: 'Phase-wise barricading along service lane; 24-hour sniffer leak testing protocol.',
    status: 'FILED_PENDING_REVIEW',
    escrowAmountInInr: 700000,
    escrowStatus: 'HELD_IN_ESCROW'
  },
  {
    permitId: 'PERMIT-2026-005',
    permitNumber: 'GCC-NOC-2026-1180',
    agencyName: 'Chennai Metro Rail Limited (CMRL Phase II)',
    agencyType: 'METRO_TRANSIT',
    roadStretchName: 'Poonamallee High Road (Aminjikarai Stretch)',
    ulbId: 'GCC',
    ulbName: 'Greater Chennai Corporation',
    wardNumber: '104',
    startCoordinates: [13.0789, 80.2245],
    endCoordinates: [13.0850, 80.2312],
    lengthMeters: 450,
    depthMeters: 4.5,
    roadSurfaceType: 'CEMENT_CONCRETE',
    applicationDate: '2026-07-20T10:00:00.000Z',
    plannedStartDate: '2026-08-25T08:00:00.000Z',
    plannedEndDate: '2026-12-15T18:00:00.000Z',
    purposeDescription: 'Deep shaft utilities diversion and station ventilation shaft civil works for Corridor 4.',
    trafficPoliceNocNumber: 'CHN-TRAFFIC-NOC-2026-1044',
    trafficDiversionPlan: 'Comprehensive diversion via EVR Periyar Salai with dedicated multi-axle vehicle bypass.',
    status: 'TRENCHING_ACTIVE',
    escrowAmountInInr: 1710000,
    escrowStatus: 'HELD_IN_ESCROW'
  },
  {
    permitId: 'PERMIT-2026-006',
    permitNumber: 'BBMP-NOC-2026-2241',
    agencyName: 'BWSSB (Bengaluru Water Supply & Sewerage Board)',
    agencyType: 'SEWERAGE',
    roadStretchName: 'Outer Ring Road (Bellandur to Iblur Corridor)',
    ulbId: 'BBMP',
    ulbName: 'Bruhat Bengaluru Mahanagara Palike',
    wardNumber: '150',
    startCoordinates: [12.9268, 77.6789],
    endCoordinates: [12.9345, 77.6890],
    lengthMeters: 320,
    depthMeters: 3.0,
    roadSurfaceType: 'BITUMINOUS_ASPHALT',
    applicationDate: '2026-08-15T12:00:00.000Z',
    plannedStartDate: '2026-09-30T09:00:00.000Z',
    plannedEndDate: '2026-10-31T18:00:00.000Z',
    purposeDescription: 'Underground underground sewage trunk pipeline diversion and stormwater culvert linkage.',
    trafficPoliceNocNumber: 'BLR-TRAFFIC-NOC-2026-889',
    trafficDiversionPlan: 'Dedicated bus-priority lane preserved; work exclusively on median utility trench.',
    status: 'NOC_APPROVED',
    escrowAmountInInr: 800000,
    escrowStatus: 'HELD_IN_ESCROW'
  },
  {
    permitId: 'PERMIT-2026-007',
    permitNumber: 'CCMC-ROAD-2026-014',
    agencyName: 'CCMC Highways & Works Directorate',
    agencyType: 'PWD_HIGHWAYS',
    roadStretchName: 'Avinashi Road (KM 8.2 to 10.4)',
    ulbId: 'CCMC',
    ulbName: 'Coimbatore City Municipal Corporation',
    wardNumber: '12',
    startCoordinates: [11.0268, 77.0125],
    endCoordinates: [11.0321, 77.0289],
    lengthMeters: 220,
    depthMeters: 0.1,
    roadSurfaceType: 'BITUMINOUS_ASPHALT',
    applicationDate: '2026-09-10T10:00:00.000Z',
    plannedStartDate: '2026-10-01T08:00:00.000Z',
    plannedEndDate: '2026-10-10T18:00:00.000Z',
    purposeDescription: 'Annual asphalt hot-mix bituminous wearing course repaving and road leveling.',
    trafficPoliceNocNumber: 'CBE-TRAFFIC-NOC-2026-610',
    trafficDiversionPlan: 'Rolling nighttime closure with lane markers.',
    status: 'CONFLICT_BLOCKED',
    escrowAmountInInr: 0,
    escrowStatus: 'HELD_IN_ESCROW',
    conflictNotice: 'MANDATORY MORATORIUM BLOCK: Overlaps spatially with TWAD Water Main excavation (Permit #CCMC-NOC-2026-0812) scheduled through Oct 15, 2026. Repaving frozen to prevent repave-and-dig cycle.'
  }
];

// Helper: Calculate Statutory Reinstatement Escrow
export function calculateReinstatementEscrow(
  lengthMeters: number, 
  surfaceType: ExcavationPermit['roadSurfaceType']
): number {
  const rate = ESCROW_RATES_PER_METER[surfaceType] || 2500;
  return lengthMeters * rate;
}

// Helper: Check 30-Day Advance Filing Compliance
export function checkThirtyDayNoticeCompliance(
  applicationDate: string, 
  plannedStartDate: string
): { isCompliant: boolean; daysInAdvance: number } {
  const appDate = new Date(applicationDate).getTime();
  const startDate = new Date(plannedStartDate).getTime();
  const diffDays = Math.round((startDate - appDate) / (1000 * 60 * 60 * 24));
  return {
    isCompliant: diffDays >= 30,
    daysInAdvance: Math.max(0, diffDays)
  };
}

// Helper: Real-time Spatial & Temporal Conflict Detector (6-Month Moratorium Rule)
export function detectSpatialConflicts(
  targetStretchName: string,
  targetCoordinates: [number, number],
  proposedStartDate: string,
  permits: ExcavationPermit[],
  moratoriumDays: number = 180
): SpatialConflictReport {
  const targetDate = new Date(proposedStartDate).getTime();
  const normalizedTarget = targetStretchName.toLowerCase().replace(/[^a-z0-9]/g, '');

  const conflictingPermits = permits.filter(permit => {
    if (permit.status === 'ESCROW_RELEASED' || permit.status === 'ESCROW_FORFEITED') {
      return false; // Work already completed and restored long ago
    }

    // 1. Spatial Overlap Check
    const normalizedPermitRoad = permit.roadStretchName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isSameRoad = normalizedTarget.includes(normalizedPermitRoad) || 
                        normalizedPermitRoad.includes(normalizedTarget) ||
                        (permit.startCoordinates && 
                         Math.hypot(permit.startCoordinates[0] - targetCoordinates[0], permit.startCoordinates[1] - targetCoordinates[1]) < 0.025); // ~2.5km spatial buffer

    if (!isSameRoad) return false;

    // 2. Temporal 180-Day (6-Month) Conflict Window Check
    const permitStart = new Date(permit.plannedStartDate).getTime();
    const permitEnd = new Date(permit.plannedEndDate).getTime();

    // Days difference between proposed start and either permit start or end
    const daysDiffFromStart = Math.abs(targetDate - permitStart) / (1000 * 60 * 60 * 24);
    const daysDiffFromEnd = Math.abs(targetDate - permitEnd) / (1000 * 60 * 60 * 24);

    return daysDiffFromStart <= moratoriumDays || daysDiffFromEnd <= moratoriumDays;
  });

  if (conflictingPermits.length === 0) {
    return {
      hasConflict: false,
      conflictingPermitIds: [],
      conflictingPermits: [],
      conflictSeverity: 'NONE',
      daysDifference: 0,
      moratoriumReason: 'No scheduled underground utility trenching or metro civil works detected on this corridor within the 6-month statutory window.',
      recommendedAction: 'CLEAR TO PROCEED: Municipal work order may be issued.'
    };
  }

  // Calculate closest collision
  const primaryConflict = conflictingPermits[0];
  const daysDiff = Math.round(Math.abs(targetDate - new Date(primaryConflict.plannedStartDate).getTime()) / (1000 * 60 * 60 * 24));

  return {
    hasConflict: true,
    conflictingPermitIds: conflictingPermits.map(p => p.permitId),
    conflictingPermits,
    conflictSeverity: 'BLOCKING_MORATORIUM',
    daysDifference: daysDiff,
    moratoriumReason: `CRITICAL SPATIAL CONFLICT: Road repaving on "${targetStretchName}" directly intersects with planned ${primaryConflict.agencyName} (${primaryConflict.purposeDescription}) scheduled within ${daysDiff} days (Permit #${primaryConflict.permitNumber}). Repaving now will cause a wasteful road cut within weeks of completion.`,
    recommendedAction: `MANDATORY MORATORIUM BLOCK: Road repaving work order is automatically FROZEN. Synchronize work via Joint Utility Trenching Coordination to lay pipeline first and execute final bitumen overlay after ${new Date(primaryConflict.plannedEndDate).toLocaleDateString()}.`
  };
}

// Storage Manager for Permits
const STORAGE_KEY = 'civicsync_excavation_permits';

export function getActivePermits(): ExcavationPermit[] {
  if (typeof window === 'undefined') return INITIAL_UTILITY_PERMITS;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_UTILITY_PERMITS));
    return INITIAL_UTILITY_PERMITS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_UTILITY_PERMITS;
  }
}

export function savePermits(permits: ExcavationPermit[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(permits));
}

export function registerExcavationPermit(newPermit: Omit<ExcavationPermit, 'permitId' | 'permitNumber' | 'status' | 'escrowAmountInInr' | 'escrowStatus'>): ExcavationPermit {
  const permits = getActivePermits();
  const permitId = `PERMIT-${Date.now()}`;
  const permitNumber = `${newPermit.ulbId}-NOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const escrowAmount = calculateReinstatementEscrow(newPermit.lengthMeters, newPermit.roadSurfaceType);

  // Check 30-day compliance
  const { isCompliant } = checkThirtyDayNoticeCompliance(newPermit.applicationDate, newPermit.plannedStartDate);

  // Check spatial conflict
  const conflictReport = detectSpatialConflicts(
    newPermit.roadStretchName,
    newPermit.startCoordinates,
    newPermit.plannedStartDate,
    permits
  );

  const permit: ExcavationPermit = {
    ...newPermit,
    permitId,
    permitNumber,
    status: conflictReport.hasConflict ? 'CONFLICT_BLOCKED' : isCompliant ? 'NOC_APPROVED' : 'FILED_PENDING_REVIEW',
    escrowAmountInInr: escrowAmount,
    escrowStatus: 'HELD_IN_ESCROW',
    conflictNotice: conflictReport.hasConflict ? conflictReport.moratoriumReason : undefined
  };

  const updated = [permit, ...permits];
  savePermits(updated);
  return permit;
}

export function submitCitizenReinstatementAudit(
  permitId: string, 
  audit: Omit<CitizenReinstatementAudit, 'auditId' | 'timestamp'>
): { updatedPermit: ExcavationPermit; escrowReleased: boolean } {
  const permits = getActivePermits();
  let escrowReleased = false;

  const updated = permits.map(permit => {
    if (permit.permitId === permitId) {
      const fullAudit: CitizenReinstatementAudit = {
        ...audit,
        auditId: `AUDIT-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
      const existingAudits = permit.citizenAudits || [];
      const allAudits = [...existingAudits, fullAudit];

      const avgRating = allAudits.reduce((acc, a) => acc + a.smoothnessRating, 0) / allAudits.length;
      const hasSunkenDefect = allAudits.some(a => a.sunkenTrenchDefect);

      let newStatus = permit.status;
      let newEscrowStatus = permit.escrowStatus;

      // Evaluation threshold: At least 2 citizen audits and rating >= 3.5 without sunken trench defects
      if (allAudits.length >= 2) {
        if (avgRating >= 3.5 && !hasSunkenDefect) {
          newStatus = 'ESCROW_RELEASED';
          newEscrowStatus = 'RELEASED_TO_UTILITY';
          escrowReleased = true;
        } else if (hasSunkenDefect || avgRating < 2.5) {
          newStatus = 'ESCROW_FORFEITED';
          newEscrowStatus = 'FORFEITED_TO_MUNICIPALITY';
        }
      } else {
        newStatus = 'CITIZEN_AUDITING';
        newEscrowStatus = 'UNDER_CITIZEN_AUDIT';
      }

      return {
        ...permit,
        status: newStatus,
        escrowStatus: newEscrowStatus,
        citizenAudits: allAudits
      };
    }
    return permit;
  });

  savePermits(updated);
  const updatedPermit = updated.find(p => p.permitId === permitId)!;
  return { updatedPermit, escrowReleased };
}

export function markReinstatementCompleted(permitId: string, proofUrl: string): ExcavationPermit {
  const permits = getActivePermits();
  const updated = permits.map(p => {
    if (p.permitId === permitId) {
      return {
        ...p,
        status: 'REINSTATEMENT_SUBMITTED' as const,
        escrowStatus: 'UNDER_CITIZEN_AUDIT' as const,
        reinstatementProofUrl: proofUrl,
        reinstatementSubmittedAt: new Date().toISOString()
      };
    }
    return p;
  });
  savePermits(updated);
  return updated.find(p => p.permitId === permitId)!;
}
