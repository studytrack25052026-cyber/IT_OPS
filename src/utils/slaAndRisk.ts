import { ChangeRequest, PriorityLevel } from '../types';

export interface SlaInfo {
  slaStatus: 'On Track' | 'Nearing Breach' | 'SLA Breached';
  hoursElapsed: number;
  hoursRemaining: number;
  targetHours: number;
  stageName: string;
}

export interface RiskInfo {
  riskScore: number; // 0 to 100
  riskLevel: 'Low' | 'Medium' | 'High' | 'Severe';
  downtimeRequired: boolean;
  schemaChangeRequired: boolean;
}

/**
 * Standard Enterprise Priority & SLA Reference Configuration:
 * - Critical: 24h SLA | System-wide outage, regulatory block, severe security risk.
 * - High: 3 Days (72h) | Core departmental workflow obstruction with no workaround.
 * - Medium: 7 Days (168h) | Standard process optimization or feature enhancement.
 * - Low: 14 Days (336h) | Minor UI adjustments, cosmetic corrections, or non-urgent queries.
 */
export const PRIORITY_SLA_CONFIG = {
  Critical: {
    hours: 24,
    slaLabel: '24h SLA',
    turnaround: '24 Hours',
    description: 'System-wide outage, regulatory block, severe security risk.',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
  },
  High: {
    hours: 72,
    slaLabel: '3 Days',
    turnaround: '3 Days (72 Hours)',
    description: 'Core departmental workflow obstruction with no workaround.',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200 font-semibold',
  },
  Medium: {
    hours: 168,
    slaLabel: '7 Days',
    turnaround: '7 Days (168 Hours)',
    description: 'Standard process optimization or feature enhancement.',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
  },
  Low: {
    hours: 336,
    slaLabel: '14 Days',
    turnaround: '14 Days (336 Hours)',
    description: 'Minor UI adjustments, cosmetic corrections, or non-urgent queries.',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200 font-normal',
  },
} as const;

export function getPrioritySlaHours(priority?: PriorityLevel | string): number {
  switch (priority) {
    case 'Critical':
      return 24;
    case 'High':
      return 72; // 3 Days
    case 'Medium':
      return 168; // 7 Days
    case 'Low':
      return 336; // 14 Days
    default:
      return 168; // Default 7 Days
  }
}

/**
 * Calculates real-time SLA status based on request creation/stage timestamp and priority.
 */
export function calculateSlaStatus(cr: ChangeRequest): SlaInfo {
  // Target hours aligned with priority SLA
  const totalResolutionSla = cr.slaTargetHours || getPrioritySlaHours(cr.priority);

  let targetHours = totalResolutionSla;
  let stageName = 'Resolution';

  if (cr.status === 'Pending HOD Approval') {
    targetHours = cr.priority === 'Critical' ? 4 : cr.priority === 'High' ? 24 : 48;
    stageName = 'HOD Approval';
  } else if (cr.status === 'Pending IT Admin Review') {
    targetHours = cr.priority === 'Critical' ? 4 : 24; // IT Review target
    stageName = 'IT Review';
  } else if (cr.status === 'In Progress') {
    // In Progress development SLA aligned with priority total SLA
    targetHours = totalResolutionSla;
    stageName = 'Development';
  } else if (cr.status === 'Pending IT Verification') {
    targetHours = cr.priority === 'Critical' ? 4 : 24;
    stageName = 'Verification';
  } else if (cr.status === 'Closed (Completed)' || cr.status === 'Closed (Rejected)') {
    return {
      slaStatus: 'On Track',
      hoursElapsed: 0,
      hoursRemaining: 0,
      targetHours: totalResolutionSla,
      stageName: 'Completed',
    };
  }

  // Parse creation or latest update timestamp
  const createdTime = new Date(cr.createdAt).getTime();
  const now = new Date().getTime();
  
  // Elapsed hours calculation (fallback if invalid date)
  let hoursElapsed = Math.floor((now - (isNaN(createdTime) ? now : createdTime)) / (1000 * 60 * 60));
  if (hoursElapsed < 0) hoursElapsed = 0;

  // Modulate elapsed hours for mock simulation realism
  if (cr.id === 'PCS-CR-2026-00003') hoursElapsed = 54; // Breached mock example
  if (cr.id === 'PCS-CR-2026-00002') hoursElapsed = 20; // Nearing breach mock example

  const hoursRemaining = targetHours - hoursElapsed;

  let slaStatus: 'On Track' | 'Nearing Breach' | 'SLA Breached' = 'On Track';
  if (hoursRemaining <= 0) {
    slaStatus = 'SLA Breached';
  } else if (hoursRemaining <= Math.max(6, Math.round(targetHours * 0.25))) {
    slaStatus = 'Nearing Breach';
  }

  return {
    slaStatus,
    hoursElapsed,
    hoursRemaining: Math.max(0, hoursRemaining),
    targetHours,
    stageName,
  };
}

/**
 * Calculates dynamic risk score (0-100) and risk level based on scope parameters.
 */
export function calculateRiskScore(params: {
  affectedModulesCount: number;
  priority: PriorityLevel;
  downtimeRequired: boolean;
  schemaChangeRequired: boolean;
  requestType?: string;
}): RiskInfo {
  let score = 15; // Base risk score

  // Module weight
  score += Math.min(params.affectedModulesCount * 15, 30);

  // Priority weight
  if (params.priority === 'Critical') score += 25;
  else if (params.priority === 'High') score += 15;
  else if (params.priority === 'Medium') score += 5;

  // Technical impact flags
  if (params.downtimeRequired) score += 20;
  if (params.schemaChangeRequired) score += 15;

  // Request Type impact
  if (params.requestType === 'Data Amendment') score += 10;

  score = Math.min(score, 100);

  let riskLevel: 'Low' | 'Medium' | 'High' | 'Severe' = 'Low';
  if (score >= 75) riskLevel = 'Severe';
  else if (score >= 55) riskLevel = 'High';
  else if (score >= 35) riskLevel = 'Medium';

  return {
    riskScore: score,
    riskLevel,
    downtimeRequired: !!params.downtimeRequired,
    schemaChangeRequired: !!params.schemaChangeRequired,
  };
}

export function getSlaBadgeClass(status: 'On Track' | 'Nearing Breach' | 'SLA Breached') {
  switch (status) {
    case 'SLA Breached':
      return 'bg-rose-50 text-rose-700 border border-rose-200 font-bold';
    case 'Nearing Breach':
      return 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200 font-medium';
  }
}

export function getRiskBadgeClass(level: 'Low' | 'Medium' | 'High' | 'Severe') {
  switch (level) {
    case 'Severe':
      return 'bg-rose-50 text-rose-700 border border-rose-200 font-bold';
    case 'High':
      return 'bg-orange-50 text-orange-800 border border-orange-200 font-semibold';
    case 'Medium':
      return 'bg-slate-100 text-slate-700 border border-slate-200 font-medium';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200 font-normal';
  }
}
