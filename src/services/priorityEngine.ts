import { PriorityLevel, GeminiAnalysisResult } from '../types';

export interface PriorityCalculationInput {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  safetyRisk: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'HAZARDOUS';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMMEDIATE';
  affectedPopulation: 'FEW' | 'NEIGHBORHOOD' | 'COMMUNITY' | 'MASSIVE';
  environmentalImpact: 'NONE' | 'LOW' | 'MODERATE' | 'SEVERE';
  isCriticalZone?: boolean; // school, hospital, major arterial road, water body
  supportersCount?: number;
}

export interface PriorityEvaluationResult {
  score: number; // 0 - 100
  level: PriorityLevel;
  breakdown: {
    severityScore: number; // max 25
    safetyRiskScore: number; // max 25
    urgencyScore: number; // max 20
    populationScore: number; // max 15
    environmentalScore: number; // max 15
    criticalZoneBonus: number; // max 10
    communitySupportBonus: number; // max 5
  };
  rationale: string;
}

/**
 * Deterministic CivicSync Priority Engine
 * Non-negotiable rule: Gemini suggests severity inputs, but final score is calculated deterministically.
 */
export function calculatePriority(input: PriorityCalculationInput): PriorityEvaluationResult {
  // 1. Severity Score (max 25)
  let severityScore = 5;
  if (input.severity === 'MEDIUM') severityScore = 12;
  else if (input.severity === 'HIGH') severityScore = 20;
  else if (input.severity === 'CRITICAL') severityScore = 25;

  // 2. Safety Risk Score (max 25)
  let safetyRiskScore = 0;
  if (input.safetyRisk === 'LOW') safetyRiskScore = 6;
  else if (input.safetyRisk === 'MODERATE') safetyRiskScore = 14;
  else if (input.safetyRisk === 'HIGH') safetyRiskScore = 20;
  else if (input.safetyRisk === 'HAZARDOUS') safetyRiskScore = 25;

  // 3. Urgency Score (max 20)
  let urgencyScore = 4;
  if (input.urgency === 'MEDIUM') urgencyScore = 10;
  else if (input.urgency === 'HIGH') urgencyScore = 16;
  else if (input.urgency === 'IMMEDIATE') urgencyScore = 20;

  // 4. Affected Population Score (max 15)
  let populationScore = 3;
  if (input.affectedPopulation === 'NEIGHBORHOOD') populationScore = 7;
  else if (input.affectedPopulation === 'COMMUNITY') populationScore = 11;
  else if (input.affectedPopulation === 'MASSIVE') populationScore = 15;

  // 5. Environmental Impact Score (max 15)
  let environmentalScore = 0;
  if (input.environmentalImpact === 'LOW') environmentalScore = 4;
  else if (input.environmentalImpact === 'MODERATE') environmentalScore = 9;
  else if (input.environmentalImpact === 'SEVERE') environmentalScore = 15;

  // 6. Context Bonuses
  const criticalZoneBonus = input.isCriticalZone ? 8 : 0;
  const communitySupportBonus = Math.min(5, Math.floor((input.supportersCount || 0) / 3));

  const totalRaw = severityScore + safetyRiskScore + urgencyScore + populationScore + environmentalScore + criticalZoneBonus + communitySupportBonus;
  const score = Math.min(100, Math.max(0, totalRaw));

  let level: PriorityLevel = 'LOW';
  if (score > 75) level = 'CRITICAL';
  else if (score > 50) level = 'HIGH';
  else if (score > 25) level = 'MEDIUM';
  else level = 'LOW';

  const rationale = `Deterministic score calculated at ${score}/100 (${level}) with Severity: ${severityScore}/25, Safety Hazard: ${safetyRiskScore}/25, Urgency: ${urgencyScore}/20, Public Reach: ${populationScore}/15, Environmental Impact: ${environmentalScore}/15${criticalZoneBonus > 0 ? ', Sensitive Zone Bonus: +' + criticalZoneBonus : ''}.`;

  return {
    score,
    level,
    breakdown: {
      severityScore,
      safetyRiskScore,
      urgencyScore,
      populationScore,
      environmentalScore,
      criticalZoneBonus,
      communitySupportBonus
    },
    rationale
  };
}

/**
 * Derives priority from Gemini structured output safely
 */
export function derivePriorityFromAi(aiResult: GeminiAnalysisResult, isCriticalZone = false, supportersCount = 0): PriorityEvaluationResult {
  return calculatePriority({
    severity: aiResult.severity,
    safetyRisk: aiResult.safetyRisk,
    urgency: aiResult.urgency,
    affectedPopulation: aiResult.affectedPopulation,
    environmentalImpact: aiResult.environmentalImpact,
    isCriticalZone,
    supportersCount
  });
}
