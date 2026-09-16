import { Complaint, ComplaintSLA } from '../types';

export const DEFAULT_INITIAL_RESPONSE_HOURS = 72;
export const DEFAULT_EXPECTED_RESOLUTION_HOURS = 168; // 7 days

/**
 * Initializes SLA tracking for a new complaint
 */
export function initializeComplaintSLA(priorityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): ComplaintSLA {
  const now = new Date();
  
  // High / Critical issues have accelerated SLAs
  let responseHours = DEFAULT_INITIAL_RESPONSE_HOURS;
  let resolutionHours = DEFAULT_EXPECTED_RESOLUTION_HOURS;

  if (priorityLevel === 'CRITICAL') {
    responseHours = 24;
    resolutionHours = 48;
  } else if (priorityLevel === 'HIGH') {
    responseHours = 48;
    resolutionHours = 96;
  }

  const initialResponseDueAt = new Date(now.getTime() + responseHours * 3600 * 1000).toISOString();
  const expectedResolutionAt = new Date(now.getTime() + resolutionHours * 3600 * 1000).toISOString();

  return {
    initialResponseDueAt,
    expectedResolutionAt,
    isBreached: false,
    currentEscalationLevel: 'OFFICER',
    extensionHistory: []
  };
}

/**
 * Checks if an SLA is breached or due soon
 */
export function checkSLAStatus(sla: ComplaintSLA): {
  isBreached: boolean;
  isApproaching: boolean;
  hoursRemaining: number;
  remainingHours: number;
  statusLabel: string;
  badgeColor: string;
} {
  const targetTime = new Date(sla.extendedUntil || sla.initialResponseDueAt).getTime();
  const now = Date.now();
  const diffHours = (targetTime - now) / (3600 * 1000);

  if (diffHours <= 0) {
    return {
      isBreached: true,
      isApproaching: false,
      hoursRemaining: 0,
      remainingHours: 0,
      statusLabel: 'SLA BREACHED',
      badgeColor: 'bg-red-500/10 text-red-600 border-red-500/30'
    };
  } else if (diffHours <= 24) {
    return {
      isBreached: false,
      isApproaching: true,
      hoursRemaining: Math.round(diffHours),
      remainingHours: Math.round(diffHours),
      statusLabel: `${Math.round(diffHours)}h remaining (Urgent)`,
      badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30'
    };
  } else {
    return {
      isBreached: false,
      isApproaching: false,
      hoursRemaining: Math.round(diffHours),
      remainingHours: Math.round(diffHours),
      statusLabel: `${Math.round(diffHours)}h remaining`,
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
    };
  }
}

/**
 * Applies a formal SLA extension with mandatory audit metadata
 */
export function requestSLAExtension(
  complaint: Complaint,
  additionalHours: number,
  reason: string,
  requestedByOfficialId: string
): ComplaintSLA {
  const currentSla = complaint.sla;
  const currentDue = currentSla.extendedUntil || currentSla.expectedResolutionAt;
  const newDueDate = new Date(new Date(currentDue).getTime() + additionalHours * 3600 * 1000).toISOString();

  const historyItem = {
    previousDue: currentDue,
    extendedTo: newDueDate,
    reason,
    requestedBy: requestedByOfficialId,
    approvedAt: new Date().toISOString()
  };

  return {
    ...currentSla,
    extendedUntil: newDueDate,
    extensionReason: reason,
    extensionApprovedBy: requestedByOfficialId,
    extensionHistory: [...(currentSla.extensionHistory || []), historyItem],
    isBreached: false
  };
}

/**
 * Evaluates escalation hierarchy when SLA is breached:
 * Officer -> Supervisor -> Department Head -> District Authority -> State Authority
 */
export function escalateComplaint(complaint: Complaint): {
  newLevel: 'SUPERVISOR' | 'DEPARTMENT_HEAD' | 'DISTRICT_AUTHORITY' | 'STATE_AUTHORITY';
  escalationNote: string;
} {
  const current = complaint.sla.currentEscalationLevel;

  if (current === 'OFFICER') {
    return {
      newLevel: 'SUPERVISOR',
      escalationNote: 'Escalated to Zonal Supervisor due to SLA expiration at officer level.'
    };
  } else if (current === 'SUPERVISOR') {
    return {
      newLevel: 'DEPARTMENT_HEAD',
      escalationNote: 'Escalated to Department Head due to unresolved complaint beyond supervisor threshold.'
    };
  } else if (current === 'DEPARTMENT_HEAD') {
    return {
      newLevel: 'DISTRICT_AUTHORITY',
      escalationNote: 'Critical escalation to District Collectorate / Municipal Commissioner.'
    };
  } else {
    return {
      newLevel: 'STATE_AUTHORITY',
      escalationNote: 'Highest administrative escalation to State Municipal Administration Directorate.'
    };
  }
}
