/**
 * "Swiggy/Uber-Style" Municipal Repair Van Telemetry & Geofencing Engine
 * Simulates real-time telemetry dispatch for repair crews and enforces
 * a strict 40-meter GPS geofence check-in requirement before field crews
 * can mark "Work Started" or "Resolved".
 */

import { RepairVanTelemetry, Complaint } from '../types';
import { calculateHaversineDistance } from './duplicateEngine';

/**
 * Creates initial repair van telemetry when a work order is dispatched
 */
export function initializeRepairVanTelemetry(
  complaint: Complaint,
  vehicleType: RepairVanTelemetry['vehicleType'] = 'JET_PATCHER_TRUCK',
  crewName: string = 'CCMC Jet-Patcher Gang #4'
): RepairVanTelemetry {
  const destLat = complaint.location.latitude;
  const destLng = complaint.location.longitude;

  // Start from central depot (~2.5km away)
  const depotLat = destLat + 0.018;
  const depotLng = destLng - 0.015;

  const distance = calculateHaversineDistance(depotLat, depotLng, destLat, destLng);
  const etaMinutes = Math.max(15, Math.round((distance / 1000) * 12)); // ~12 mins per km in city traffic

  return {
    vehicleNumber: 'TN-38-G-4019',
    crewName,
    crewContact: '+91 94432 88210 (Er. Ramesh, Crew Supervisor)',
    vehicleType,
    currentLocation: {
      latitude: depotLat,
      longitude: depotLng
    },
    destinationLocation: {
      latitude: destLat,
      longitude: destLng
    },
    etaMinutes,
    status: 'DISPATCHED',
    distanceToSiteMeters: Math.round(distance),
    isWithinGeofence40m: distance <= 40,
    dispatchedAt: new Date().toISOString()
  };
}

/**
 * Steps the van along the trajectory towards the complaint site
 * Progress factor: 0.0 (at depot) to 1.0 (at complaint coordinates)
 */
export function stepVanTelemetryProgress(
  telemetry: RepairVanTelemetry,
  progressRatio: number
): RepairVanTelemetry {
  const startLat = telemetry.destinationLocation.latitude + 0.018;
  const startLng = telemetry.destinationLocation.longitude - 0.015;

  const currentLat = startLat + (telemetry.destinationLocation.latitude - startLat) * progressRatio;
  const currentLng = startLng + (telemetry.destinationLocation.longitude - startLng) * progressRatio;

  const distance = calculateHaversineDistance(
    currentLat,
    currentLng,
    telemetry.destinationLocation.latitude,
    telemetry.destinationLocation.longitude
  );

  const isWithinGeofence40m = distance <= 40;
  const etaMinutes = isWithinGeofence40m ? 0 : Math.max(2, Math.round((distance / 1000) * 8));

  let status: RepairVanTelemetry['status'] = telemetry.status;
  if (isWithinGeofence40m) {
    status = 'ON_SITE_GEOFENCED';
  } else if (progressRatio > 0.05) {
    status = 'EN_ROUTE';
  }

  return {
    ...telemetry,
    currentLocation: {
      latitude: currentLat,
      longitude: currentLng
    },
    etaMinutes,
    status,
    distanceToSiteMeters: Math.round(distance),
    isWithinGeofence40m,
    checkedInAt: isWithinGeofence40m ? (telemetry.checkedInAt || new Date().toISOString()) : telemetry.checkedInAt
  };
}

/**
 * Validates whether an official or field crew device is within the mandatory 40m geofence
 */
export function validateFieldCrewGeofence(
  deviceLat: number,
  deviceLng: number,
  complaintLat: number,
  complaintLng: number
): {
  isPermitted: boolean;
  distanceMeters: number;
  reason: string;
} {
  const distance = calculateHaversineDistance(deviceLat, deviceLng, complaintLat, complaintLng);
  const isPermitted = distance <= 40;

  return {
    isPermitted,
    distanceMeters: Math.round(distance),
    reason: isPermitted
      ? `GPS verified: Device is within ${Math.round(distance)}m of site (threshold <= 40m). Action permitted.`
      : `Geofence check failed: Device is ${Math.round(distance)}m away from reported coordinates. Field staff must be within 40m of physical site to update status.`
  };
}
