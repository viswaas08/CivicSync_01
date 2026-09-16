import { Complaint } from '../types';

export interface DuplicateMatch {
  existingComplaint: Complaint;
  distanceMeters: number;
  similarityScore: number; // 0 - 100
  reason: string;
}

/**
 * Calculates distance between two coordinates in meters using the Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Tokenizes and computes simple cosine similarity between two text descriptions
 */
function textSimilarity(textA: string, textB: string): number {
  const wordsA = textA.toLowerCase().match(/\b\w+\b/g) || [];
  const wordsB = textB.toLowerCase().match(/\b\w+\b/g) || [];

  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  let common = 0;
  for (const w of setA) {
    if (setB.has(w)) common++;
  }

  return (2 * common) / (setA.size + setB.size);
}

/**
 * CivicSync Duplicate Complaint Detection Engine
 * Scans active complaints within 500m radius and similar category.
 * Enforces rule: Never auto-merge without citizen confirmation.
 */
export function detectPotentialDuplicates(
  latitude: number,
  longitude: number,
  category: string,
  problemType: string,
  description: string,
  activeComplaints: Complaint[],
  radiusThresholdMeters: number = 350
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  for (const comp of activeComplaints) {
    // Only check unresolved complaints
    if (comp.status === 'RESOLVED' || comp.status === 'CLOSED') continue;

    const distance = calculateHaversineDistance(
      latitude, 
      longitude, 
      comp.location.latitude, 
      comp.location.longitude
    );

    if (distance <= radiusThresholdMeters) {
      // Category match check
      const catMatch = comp.category.toLowerCase() === category.toLowerCase() ||
        comp.problemType.toLowerCase() === problemType.toLowerCase();

      const similarity = textSimilarity(description, comp.description + ' ' + comp.title);

      let totalScore = 0;
      // Distance factor (closer distance = higher score)
      const distScore = Math.max(0, (radiusThresholdMeters - distance) / radiusThresholdMeters) * 50;
      const catScore = catMatch ? 30 : 0;
      const descScore = similarity * 20;

      totalScore = Math.min(100, Math.round(distScore + catScore + descScore));

      if (totalScore >= 45) {
        matches.push({
          existingComplaint: comp,
          distanceMeters: Math.round(distance),
          similarityScore: totalScore,
          reason: `Found existing ${comp.category} complaint #${comp.complaintId} located ${Math.round(distance)}m away with ${totalScore}% contextual match.`
        });
      }
    }
  }

  return matches.sort((a, b) => b.similarityScore - a.similarityScore);
}
